#!/usr/bin/env bun
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, rename, symlink, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { verifyPublication } from "../publication.mjs";
import { jobManifest, suiteIds, validateOptions } from "./plan.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const argv = process.argv.slice(2);
function option(name, fallback) {
  const index = argv.indexOf(`--${name}`);
  return index < 0 ? fallback : argv[index + 1];
}
const output = resolve(option("out", "cloud-results"));
const statePath = join(output, "campaign.json");
const previous = existsSync(statePath)
  ? JSON.parse(await readFile(statePath, "utf8"))
  : null;
const options = {
  revision: option("revision", previous?.options.revision || ""),
  parallel: Number(option("parallel", previous?.options.parallel ?? 5)),
  namespace: option(
    "namespace",
    previous?.options.namespace || "framework-benchmarks",
  ),
  campaignId: previous?.options.campaignId || `publication-${randomUUID()}`,
  smoke: argv.includes("--smoke") || previous?.options.smoke || false,
};
validateOptions(options);
if (previous)
  assert.deepEqual(
    options,
    previous.options,
    "Resume the same campaign options",
  );
const context = option("context", process.env.BENCH_KUBE_CONTEXT);
const kubeArgs = context ? ["--context", context] : [];
const state = previous || {
  options,
  startedAt: new Date().toISOString(),
  suites: {},
};
await mkdir(output, { recursive: true });
let saving = Promise.resolve();
function save() {
  const snapshot = `${JSON.stringify(state, null, 2)}\n`;
  saving = saving.then(async () => {
    await writeFile(`${statePath}.tmp`, snapshot);
    await rename(`${statePath}.tmp`, statePath);
  });
  return saving;
}
await save();
async function command(
  command,
  args,
  { input, cwd = root, binary = false, allowFailure = false } = {},
) {
  return await new Promise((resolveResult, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: ["pipe", "pipe", "pipe"],
    });
    const stdout = [],
      stderr = [];
    child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.stderr.on("data", (chunk) => stderr.push(chunk));
    child.on("error", reject);
    child.stdin.on("error", () => {});
    child.stdin.end(input);
    child.on("close", (code) => {
      const result = Buffer.concat(stdout);
      if (code !== 0 && !allowFailure)
        reject(
          new Error(
            `${command} ${args.join(" ")}: ${Buffer.concat(stderr).toString().slice(-4000)}`,
          ),
        );
      else resolveResult(binary ? result : result.toString().trim());
    });
  });
}
const kube = (args, config) =>
  command("kubectl", [...kubeArgs, "--request-timeout=60s", ...args], config);
const jobs = new Set();
let stopping = false;
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    stopping = true;
  });
async function cleanup() {
  for (const name of jobs)
    await kube(
      [
        "delete",
        "job",
        name,
        "-n",
        options.namespace,
        "--ignore-not-found",
        "--wait=false",
      ],
      { allowFailure: true },
    );
}
const delay = (ms) =>
  new Promise((resolveDelay) => setTimeout(resolveDelay, ms));
const digest = (data) => createHash("sha256").update(data).digest("hex");
async function runSuite(suite) {
  const retained = state.suites[suite];
  if (retained?.status === "collected") {
    assert.equal(
      digest(await readFile(join(output, `${suite}.tar.gz`))),
      retained.sha256,
      `${suite}: retained archive changed`,
    );
    console.log(`${suite}: reusing retained complete run`);
    return;
  }
  if (retained?.job) {
    assert.equal(
      retained.job,
      jobManifest(options, suite, retained.attempt).metadata.name,
    );
    await kube([
      "delete",
      "job",
      retained.job,
      "-n",
      options.namespace,
      "--ignore-not-found",
      "--wait=false",
    ]);
  }
  const attempt = (retained?.attempt || 0) + 1;
  const manifest = jobManifest(options, suite, attempt);
  const name = manifest.metadata.name;
  state.suites[suite] = { attempt, job: name, status: "starting" };
  await save();
  jobs.add(name);
  await kube(["apply", "-f", "-"], { input: JSON.stringify(manifest) });
  const deadline = Date.now() + 4 * 60 * 60 * 1000;
  let pod;
  while (!pod) {
    assert.ok(
      !stopping && Date.now() < deadline,
      `${suite}: interrupted or timed out`,
    );
    const list = JSON.parse(
      await kube([
        "get",
        "pods",
        "-n",
        options.namespace,
        "-l",
        `job-name=${name}`,
        "-o",
        "json",
      ]),
    );
    const candidate = list.items[0];
    if (["Failed", "Succeeded"].includes(candidate?.status.phase))
      throw new Error(`${suite}: worker stopped before launch`);
    if (candidate?.status.containerStatuses?.[0]?.ready)
      pod = candidate.metadata.name;
    else await delay(5000);
  }
  const exec = (args, config) =>
    kube(["exec", "-n", options.namespace, "-i", pod, "--", ...args], config);
  // Transfer trusted orchestration separately from the immutable measured checkout.
  for (const [local, remote] of [
    ["framework-ssr/cloud/bootstrap.sh", "bootstrap.sh"],
    ["tooling/cloud/run-suite.sh", "run-suite.sh"],
  ]) {
    await exec(["bash", "-c", `cat > /work/${remote}`], {
      input: await readFile(join(root, local)),
    });
  }
  const launch = `#!/usr/bin/env bash\nset -euo pipefail\nbash /work/bootstrap.sh > /work/bootstrap.log 2>&1\nmkdir -p /work/repo\ncd /work/repo\ngit init -q\ngit remote add origin https://github.com/Proa-Labs/framework-benchmarks.git\ngit fetch --depth=1 origin ${options.revision}\ngit checkout --detach FETCH_HEAD\nbash /work/run-suite.sh ${options.revision} ${options.campaignId} ${suite} ${options.smoke ? "smoke" : "publication"}\n`;
  await exec(
    [
      "bash",
      "-c",
      "cat > /work/launch.tmp && mv /work/launch.tmp /work/launch.sh",
    ],
    { input: launch },
  );
  state.suites[suite].status = "running";
  await save();
  console.log(`${suite}: running on ${pod}`);
  let exitCode;
  let lastLog = 0;
  while (exitCode === undefined) {
    assert.ok(
      !stopping && Date.now() < deadline,
      `${suite}: interrupted or timed out`,
    );
    if (Date.now() - lastLog > 60000) {
      const log = await exec(
        ["bash", "-c", "tail -c 32000 /work/worker.log 2>/dev/null || true"],
        { allowFailure: true },
      );
      await writeFile(join(output, `${suite}-progress.log`), log);
      lastLog = Date.now();
    }
    const status = JSON.parse(
      await kube(["get", "pod", pod, "-n", options.namespace, "-o", "json"]),
    );
    if (status.status.phase !== "Running")
      throw new Error(
        `${suite}: worker ${status.status.phase} (possible spot interruption); resume to retry the entire suite`,
      );
    const result = await exec([
      "bash",
      "-c",
      "if test -f /work/exit-code; then cat /work/exit-code; else echo running; fi",
    ]);
    if (result !== "running") exitCode = Number(result);
    else await delay(10000);
  }
  const logs = await exec(
    [
      "bash",
      "-c",
      "cd /work; tar -czf - worker.log bootstrap.log cpu-topology.txt cpu-quota.txt 2>/dev/null || true",
    ],
    { binary: true },
  );
  await writeFile(join(output, `${suite}-logs.tar.gz`), logs);
  if (exitCode !== 0) {
    state.suites[suite].status = "failed";
    state.suites[suite].exitCode = exitCode;
    await save();
    throw new Error(
      `${suite}: failed (${exitCode}); logs retained at ${output}`,
    );
  }
  const artifact = await exec(["cat", "/work/results.tar.gz"], {
    binary: true,
  });
  await writeFile(join(output, `${suite}.tar.gz`), artifact);
  state.suites[suite] = {
    ...state.suites[suite],
    status: "collected",
    sha256: digest(artifact),
    completedAt: new Date().toISOString(),
  };
  await save();
  await exec(["touch", "/work/collected"]);
  await kube(["delete", "job", name, "-n", options.namespace, "--wait=false"]);
  jobs.delete(name);
  console.log(`${suite}: complete, raw artifacts retained`);
}
try {
  if (argv.includes("--plan")) {
    for (const suite of suiteIds)
      console.log(JSON.stringify(jobManifest(options, suite)));
  } else {
    // Concurrency applies to whole suites. Rendering and its scaling diagnostic
    // stay in one worker, sequentially, on the same physical machine.
    state.status = "running";
    delete state.error;
    await save();
    const queue = [...suiteIds];
    const outcomes = await Promise.allSettled(
      Array.from({ length: options.parallel }, async () => {
        while (queue.length && !stopping) await runSuite(queue.shift());
      }),
    );
    const failures = outcomes.filter((result) => result.status === "rejected");
    if (failures.length)
      throw new AggregateError(
        failures.map((result) => result.reason),
        "Campaign incomplete; successful suite archives are reusable on resume",
      );
    assert.ok(!stopping, "Campaign interrupted");
    const stage = join(output, "validated");
    if (!existsSync(join(stage, ".git"))) {
      await command("git", ["clone", "--shared", "--no-checkout", root, stage]);
      await command(
        "git",
        [
          "fetch",
          "--depth=1",
          "https://github.com/Proa-Labs/framework-benchmarks.git",
          options.revision,
        ],
        { cwd: stage },
      );
      await command("git", ["checkout", "--detach", options.revision], {
        cwd: stage,
      });
      await symlink(join(root, "node_modules"), join(stage, "node_modules"));
    }
    assert.equal(
      await command("git", ["rev-parse", "HEAD"], { cwd: stage }),
      options.revision,
    );
    for (const suite of suiteIds)
      await command("python3", [
        join(root, "tooling/cloud/extract.py"),
        join(output, `${suite}.tar.gz`),
        stage,
      ]);
    if (options.smoke) {
      state.status = "smoke-complete";
      console.log(
        "Smoke orchestration complete; these results cannot satisfy publication readiness.",
      );
    } else {
      const verified = await verifyPublication(stage);
      assert.equal(
        verified.campaignId,
        options.campaignId,
        "Collected results belong to a different campaign",
      );
      assert.equal(verified.protocol, "per-suite-host-v1");
      console.log(
        `Publication ready: ${verified.campaignId} (${verified.protocol})`,
      );
      state.status = "validated";
      console.log(
        `Validated campaign staged at ${stage}; working-tree latest files were not replaced.`,
      );
    }
    state.completedAt = new Date().toISOString();
    await save();
  }
} catch (error) {
  state.status = "failed";
  state.error = String(error);
  await save();
  throw error;
} finally {
  await cleanup();
}
