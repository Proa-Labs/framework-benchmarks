import { expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  frameworkShardIds,
  jobManifest,
  prioritizeSuites,
  shardedSuiteIds,
  suiteIds,
  validateOptions,
  validateReconnect,
} from "./plan.mjs";

const options = {
  revision: "a".repeat(40),
  parallel: 5,
  namespace: "framework-benchmarks",
  campaignId: "publication-12345678-1234-1234-1234-123456789abc",
};
test("parallel units preserve whole suites and enforce node and credential isolation", () => {
  expect(suiteIds).toEqual([
    "rendering",
    "framework",
    "http",
    "streaming",
    "startup",
  ]);
  const jobs = suiteIds.map((suite) => jobManifest(options, suite));
  expect(new Set(jobs.map((job) => job.metadata.name)).size).toBe(5);
  for (const job of jobs) {
    const spec = job.spec.template.spec;
    expect(spec.automountServiceAccountToken).toBe(false);
    expect(spec.containers[0].resources.requests.cpu).toBe("15");
    expect(spec.nodeSelector["node.kubernetes.io/instance-type"]).toBe(
      "c4-standard-16-lssd",
    );
    const rule =
      spec.affinity.podAntiAffinity
        .requiredDuringSchedulingIgnoredDuringExecution[0];
    expect(rule.namespaces).toEqual(["arc-runners", "framework-benchmarks"]);
    expect(rule.labelSelector).toEqual({});
    expect(rule.topologyKey).toBe("kubernetes.io/hostname");
    expect(job.spec.activeDeadlineSeconds).toBe(14400);
    expect(job.spec.backoffLimit).toBe(0);
  }
});
test("campaign refuses mutable refs, command injection and excessive workers", () => {
  for (const change of [
    { revision: "main" },
    { revision: "a;echo unsafe" },
    { parallel: 6 },
    { parallel: 0 },
    { namespace: "x;echo" },
    { campaignId: "publication/other" },
  ]) {
    expect(() => validateOptions({ ...options, ...change })).toThrow();
  }
});
test("artifact extraction rejects traversal, links, duplicate and unrelated files", () => {
  const temp = mkdtempSync(join(tmpdir(), "bench-artifact-"));
  try {
    const generator = join(temp, "generate.py");
    writeFileSync(
      generator,
      `import io,sys,tarfile\nwith tarfile.open(sys.argv[1], 'w:gz') as a:\n for name in sys.argv[2:]:\n  m=tarfile.TarInfo(name)\n  if name.endswith('link'):\n   m.type=tarfile.SYMTYPE; m.linkname='/tmp/outside'\n  a.addfile(m,io.BytesIO(b''))\n`,
    );
    for (const paths of [
      ["../escape"],
      ["/absolute"],
      ["tooling/code.mjs"],
      ["benchmarks/rendering/results/link"],
      [
        "benchmarks/rendering/results/a.json",
        "benchmarks/rendering/results/a.json",
      ],
    ]) {
      const archive = join(temp, "test.tar.gz");
      expect(spawnSync("python3", [generator, archive, ...paths]).status).toBe(
        0,
      );
      expect(
        spawnSync("python3", [
          join(import.meta.dir, "extract.py"),
          archive,
          join(temp, "out"),
        ]).status,
      ).not.toBe(0);
    }
    const archive = join(temp, "good.tar.gz");
    expect(
      spawnSync("python3", [
        generator,
        archive,
        "benchmarks/rendering/results/raw/capture/samples.json",
      ]).status,
    ).toBe(0);
    expect(
      spawnSync("python3", [
        join(import.meta.dir, "extract.py"),
        archive,
        join(temp, "good"),
      ]).status,
    ).toBe(0);
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});

// This integration check clones retained evidence and starts three controller
// processes. Give shared CI runners room beyond Bun's 5-second unit-test limit.
test("resume reuses complete archives and rejects a changed archive before launching machines", () => {
  const temp = mkdtempSync(join(tmpdir(), "bench-resume-"));
  try {
    const root = join(import.meta.dir, "../..");
    const revision = spawnSync("git", ["rev-parse", "HEAD"], { cwd: root })
      .stdout.toString()
      .trim();
    const stage = join(temp, "validated");
    expect(
      spawnSync("git", ["clone", "--shared", "--no-checkout", root, stage])
        .status,
    ).toBe(0);
    expect(
      spawnSync("git", ["checkout", "--detach", revision], { cwd: stage })
        .status,
    ).toBe(0);
    const archive = join(temp, "empty.tar.gz");
    expect(
      spawnSync("python3", [
        "-c",
        "import tarfile,sys; tarfile.open(sys.argv[1], 'w:gz').close()",
        archive,
      ]).status,
    ).toBe(0);
    const data = readFileSync(archive);
    const sha256 = createHash("sha256").update(data).digest("hex");
    const state = {
      options: { ...options, revision, smoke: true },
      suites: {},
    };
    for (const suite of suiteIds) {
      writeFileSync(join(temp, `${suite}.tar.gz`), data);
      state.suites[suite] = { status: "collected", sha256 };
    }
    const statePath = join(temp, "campaign.json");
    writeFileSync(statePath, JSON.stringify(state));
    const run = () =>
      spawnSync(
        process.execPath,
        [join(import.meta.dir, "campaign.mjs"), "--out", temp],
        { cwd: root },
      );
    const success = run();
    expect(success.status).toBe(0);
    expect(
      success.stdout.toString().match(/reusing retained complete run/g)?.length,
    ).toBe(5);
    expect(JSON.parse(readFileSync(statePath)).status).toBe("smoke-complete");
    const selection = join(stage, "site/data/performance/proa-refresh.json");
    const original = Buffer.from('{"reviewOnly":true}\n');
    mkdirSync(join(stage, "site/data/performance"), { recursive: true });
    writeFileSync(selection, original);
    state.options.smoke = false;
    writeFileSync(statePath, JSON.stringify(state));
    // Empty archives cannot promote old captures as a replacement campaign.
    // Failed publication validation must retain the preview selection.
    const invalidPublication = run();
    expect(invalidPublication.status).not.toBe(0);
    expect(readFileSync(selection)).toEqual(original);
    expect(JSON.parse(readFileSync(statePath)).status).toBe("failed");
    writeFileSync(join(temp, "rendering.tar.gz"), "corrupted");
    expect(run().status).not.toBe(0);
    expect(JSON.parse(readFileSync(statePath)).status).toBe("failed");
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
}, 30_000);

test("reconnection rejects a worker from another suite or altered isolation contract", () => {
  const expected = jobManifest(options, "rendering");
  validateReconnect(expected, structuredClone(expected));
  for (const mutate of [
    (job) => {
      job.metadata.labels.campaign = "other";
    },
    (job) => {
      job.metadata.labels.suite = "startup";
    },
    (job) => {
      job.spec.template.spec.automountServiceAccountToken = true;
    },
    (job) => {
      job.spec.template.spec.containers[0].image = "another-image";
    },
    (job) => {
      delete job.spec.template.spec.affinity;
    },
  ]) {
    const changed = structuredClone(expected);
    mutate(changed);
    expect(() => validateReconnect(expected, changed)).toThrow();
  }
});

test("unknown or incomplete CLI flags fail before allocating or creating campaign state", () => {
  const temp = mkdtempSync(join(tmpdir(), "bench-args-"));
  const bin = join(temp, "bin");
  mkdirSync(bin);
  writeFileSync(join(bin, "kubectl"), "#!/bin/sh\nexit 99\n");
  chmodSync(join(bin, "kubectl"), 0o755);
  try {
    for (const flags of [["--dry-run"], ["--smoke=false"], ["--parallel"]]) {
      const state = join(temp, "campaign.json");
      const result = spawnSync(
        process.execPath,
        [
          join(import.meta.dir, "campaign.mjs"),
          "--out",
          temp,
          "--revision",
          "a".repeat(40),
          ...flags,
        ],
        { env: { ...process.env, PATH: `${bin}:${process.env.PATH}` } },
      );
      expect(result.status).not.toBe(0);
      expect(existsSync(state)).toBe(false);
    }
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});

test("framework workload jobs keep every competitor on one isolated node", () => {
  expect(frameworkShardIds).toHaveLength(8);
  expect(shardedSuiteIds).toHaveLength(12);
  for (const id of frameworkShardIds) {
    const job = jobManifest(options, id);
    expect(job.metadata.labels.suite).toBe(id);
    expect(job.spec.template.spec.automountServiceAccountToken).toBe(false);
    expect(job.spec.template.spec.containers[0].resources.requests.cpu).toBe(
      "15",
    );
  }
});

test("long suites start early while resumed workers keep their concurrency slots", () => {
  expect(shardedSuiteIds.slice(0, 4)).toEqual([
    "rendering",
    "streaming",
    "http",
    "startup",
  ]);
  expect(new Set(shardedSuiteIds)).toEqual(
    new Set([
      ...suiteIds.filter((id) => id !== "framework"),
      ...frameworkShardIds,
    ]),
  );
  const retained = {
    "framework-cards": { status: "running" },
    "framework-table": { status: "starting" },
    rendering: { status: "collected" },
  };
  const ordered = prioritizeSuites(shardedSuiteIds, retained);
  expect(new Set(ordered.slice(0, 2))).toEqual(
    new Set(["framework-cards", "framework-table"]),
  );
  expect(ordered.slice(2, 6)).toEqual([
    "rendering",
    "streaming",
    "http",
    "startup",
  ]);
  expect(prioritizeSuites(shardedSuiteIds, {})).toEqual(shardedSuiteIds);
});

test("an exhausted control-connection retry preserves the active job for resume", () => {
  const temp = mkdtempSync(join(tmpdir(), "campaign-transport-"));
  try {
    const bin = join(temp, "bin"),
      log = join(temp, "commands");
    mkdirSync(bin);
    const kubectl = join(bin, "kubectl");
    writeFileSync(
      kubectl,
      `#!/bin/sh\nprintf '%s\\n' "$*" >> '${log}'\ncase " $* " in *" get "*) printf 'http2: client connection lost\\n' >&2; exit 1;; esac\ncat > /dev/null\n`,
    );
    chmodSync(kubectl, 0o755);
    const result = spawnSync(
      process.execPath,
      [
        "tooling/cloud/campaign.mjs",
        "--revision",
        "a".repeat(40),
        "--parallel",
        "1",
        "--out",
        join(temp, "output"),
      ],
      {
        env: { ...process.env, PATH: `${bin}:${process.env.PATH}` },
        timeout: 20_000,
      },
    );
    expect(result.status).not.toBe(0);
    const state = JSON.parse(
      readFileSync(join(temp, "output/campaign.json"), "utf8"),
    );
    expect(state.status).toBe("failed");
    expect(state.suites.rendering.status).toBe("starting");
    const commands = readFileSync(log, "utf8");
    expect(commands).toContain("apply -f -");
    expect(commands).not.toContain("delete");
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
}, 25_000);
