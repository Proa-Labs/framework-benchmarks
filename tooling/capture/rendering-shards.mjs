// Merge complete renderer comparisons run independently by workload. Never
// split the competitors of one workload across machines or synthesize RSS.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateProaRenderRun } from "../../benchmarks/rendering/canonical/render-contract.mjs";
import { validateCanonicalResult } from "../../benchmarks/rendering/canonical/report.mjs";
import roster from "../../benchmarks/rendering/canonical/roster.json" with {
  type: "json",
};
import { renderingSourceFiles } from "../../benchmarks/rendering/canonical/source_fingerprint.mjs";
import workloadManifest from "../../benchmarks/rendering/canonical/workloads.json" with {
  type: "json",
};
import { summarize } from "../stats.mjs";
import { atomicWrite, captureId, retainCapture } from "./captures.mjs";
import { summarizeMemory } from "./process-memory.mjs";
import { readRawJson, writeRawJson } from "./raw.mjs";
import { verifySourceSnapshot } from "./verify-source.mjs";

const profile = (h) => [
  h.machineClass,
  h.cpuModel,
  h.logicalCpuCount,
  h.arch,
  h.release,
  h.serverCpuAffinity,
];
const digest = (path) =>
  createHash("sha256").update(readFileSync(path)).digest("hex");
export function mergeRenderingShards(entries, { aggregateId } = {}) {
  assert.equal(
    entries.length,
    workloadManifest.workloads.length,
    "Every rendering workload needs one complete shard",
  );
  const first = entries[0].capture;
  const byId = new Map();
  for (const { capture: shard, runs } of entries) {
    assert.equal(shard.workloads.length, 1);
    const workload = workloadManifest.workloads.find(
      (w) => w.id === shard.workloads[0].id,
    );
    assert.ok(workload, "Unexpected rendering workload");
    assert.ok(!byId.has(workload.id), "Duplicate rendering workload");
    assert.equal(
      shard.capture_kind,
      "engineering",
      "Only full-protocol workload shards may be combined",
    );
    validateCanonicalResult(
      { ...shard, capture_kind: "historical_partial" },
      roster,
      { workloads: [workload] },
    );
    assert.deepEqual(shard.workloads[0], workload, "Workload policy differs");
    assert.deepEqual(
      shard.renderers,
      first.renderers,
      "Renderer roster differs",
    );
    assert.deepEqual(
      shard.versions,
      first.versions,
      "Renderer/runtime versions differ",
    );
    assert.equal(
      shard.provenance.source_sha256,
      first.provenance.source_sha256,
      "Measured sources differ",
    );
    assert.equal(
      shard.provenance.harness_commit,
      first.provenance.harness_commit,
      "Harness revision differs",
    );
    assert.equal(
      shard.host.campaignId,
      first.host.campaignId,
      "Campaign differs",
    );
    assert.equal(
      shard.host.sourceRevision,
      first.host.sourceRevision,
      "Worker source revision differs",
    );
    assert.deepEqual(
      profile(shard.host),
      profile(first.host),
      "Hardware/OS profiles differ",
    );
    // Matching GKE guests can reserve a few 4-KiB pages differently at boot.
    // Preserve each exact value; reject a materially different RAM budget.
    assert.ok(
      Number.isSafeInteger(shard.host.totalMemoryBytes) &&
        shard.host.totalMemoryBytes > 0 &&
        Math.abs(shard.host.totalMemoryBytes - first.host.totalMemoryBytes) <=
          1048576,
      "Worker memory capacities differ",
    );
    assert.equal(shard.host.campaignProtocol, "per-workload-render-host-v1");
    assert.match(shard.host.campaignId, /^render-rss-[a-f0-9-]{36}$/);
    assert.match(shard.host.machineId, /^[a-f0-9]{64}$/);
    assert.equal(shard.host.machineClass, "c4-standard-16-lssd");
    assert.equal(shard.host.logicalCpuCount, 16);
    assert.equal(shard.host.arch, "x64");
    assert.equal(shard.host.serverCpuAffinity, "0");
    assert.ok(shard.host.nodeName);
    assert.equal(
      runs.length,
      roster.renderers.length * 5,
      "Missing or unexpected native process summaries",
    );
    for (const { id } of roster.renderers) {
      const m = shard.measurements[id][workload.id];
      const cells = runs
        .filter((r) => r.framework_id === id && r.workload === workload.id)
        .sort((a, b) => a.repeat - b.repeat);
      assert.deepEqual(
        cells.map((r) => r.repeat),
        [0, 1, 2, 3, 4],
        `${id}: missing or repeated process`,
      );
      assert.equal(m.independent_processes, 5);
      assert.equal(m.samples_per_process, workload.iterations);
      assert.equal(m.warmups_per_process, workload.warmup);
      for (const cell of cells) {
        assert.equal(cell.iterations, workload.iterations);
        assert.equal(cell.warmup, workload.warmup);
        if (cell.samples_us) {
          assert.equal(cell.samples_us.length, workload.iterations);
          assert.ok(cell.samples_us.every((v) => Number.isFinite(v) && v > 0));
          const stats = summarize(cell.samples_us);
          for (const key of ["p50", "p95", "p99"])
            assert.ok(
              Math.abs(cell[`${key}_us`] - stats[key]) <=
                1e-9 * Math.max(1, stats[key]),
              `${id}: raw latency summary differs`,
            );
        }
        assert.equal(cell.output_bytes, m.output_bytes);
        if (id === "proa") validateProaRenderRun(cell);
      }
      for (const key of ["p50", "p95", "p99"])
        assert.equal(
          m[`${key}_us`],
          summarize(cells.map((c) => c[`${key}_us`])).p50,
          `${id}: aggregate latency differs`,
        );
      assert.deepEqual(
        m.memory,
        summarizeMemory(cells),
        `${id}: raw RSS summary differs`,
      );
      assert.ok(m.memory, `${id}: native RSS is missing`);
    }
    byId.set(workload.id, { capture: shard, runs });
  }
  const ordered = workloadManifest.workloads.map((w) => {
    const e = byId.get(w.id);
    assert.ok(e, `Missing ${w.id}`);
    return e;
  });
  const capturedAt = ordered.map((e) => e.capture.captured_at).sort()[0];
  const id = aggregateId ?? captureId("canonical-ssr-v1", capturedAt);
  assert.match(id, /^[a-zA-Z0-9-]+$/);
  const result = {
    ...first,
    capture_id: id,
    capture_kind: "canonical",
    captured_at: capturedAt,
    completed_at: ordered
      .map((e) => e.capture.completed_at)
      .sort()
      .at(-1),
    workloads: workloadManifest.workloads,
    host: {
      ...first.host,
      machineId: null,
      nodeName: null,
      campaignProtocol: "per-workload-render-host-v1",
      cloud:
        "GCP C4 c4-standard-16-lssd · isolated matching hosts, one per workload",
      workloadHosts: Object.fromEntries(
        ordered.map((e) => [e.capture.workloads[0].id, e.capture.host]),
      ),
    },
    workloadCaptures: Object.fromEntries(
      ordered.map((e) => [
        e.capture.workloads[0].id,
        {
          captureId: e.capture.capture_id,
          capturedAt: e.capture.captured_at,
          completedAt: e.capture.completed_at,
          host: e.capture.host,
        },
      ]),
    ),
    measurements: Object.fromEntries(
      roster.renderers.map((r) => [
        r.id,
        Object.fromEntries(
          ordered.map((e) => {
            const w = e.capture.workloads[0].id;
            return [w, { ...e.capture.measurements[r.id][w], capture_id: id }];
          }),
        ),
      ]),
    ),
    parity: Object.fromEntries(
      roster.renderers.map((r) => [
        r.id,
        Object.fromEntries(
          ordered.map((e) => {
            const w = e.capture.workloads[0].id;
            return [w, e.capture.parity[r.id][w]];
          }),
        ),
      ]),
    ),
    commands: [...new Set(ordered.flatMap((e) => e.capture.commands))],
    limitations: [
      ...first.limitations.filter(
        (s) => !s.startsWith("This capture describes one machine"),
      ),
      "Each workload compares all 21 renderers sequentially on one isolated physical GCP C4 host. Workloads use matching hardware/OS profiles on separate hosts; see workloadCaptures for their identities and dates.",
      "Peak RSS is the OS native-process lifetime high-water mark, including startup, prepared data, template initialization, warmup, rendering and output verification/destruction. It is not allocation per render. Each headline is the median of five independent process peaks.",
    ],
    raw_artifacts: [
      {
        label: "Per-process summaries",
        path: `raw/${id}/process-summaries.json.gz`,
      },
    ],
  };
  validateCanonicalResult(result, roster, workloadManifest);
  return {
    result,
    runs: ordered.flatMap((e) =>
      e.runs.map((r) => ({
        ...r,
        source_capture_id: id,
        shard_capture_id: e.capture.capture_id,
      })),
    ),
  };
}

export function retainRenderingShards(root, paths) {
  const verifiedSources = new Set();
  const entries = paths.map((path) => {
    const capture = JSON.parse(readFileSync(path, "utf8"));
    const raw = join(dirname(path), "raw", capture.capture_id);
    const source = join(raw, "source.tar.gz");
    const key = `${capture.provenance.source_sha256}/${digest(source)}`;
    if (!verifiedSources.has(key)) {
      verifySourceSnapshot(source, capture.provenance.source_sha256, {
        prefix: "/",
      });
      verifiedSources.add(key);
    }
    return {
      capture,
      runs: readRawJson(join(raw, "process-summaries.json.gz")),
      raw,
    };
  });
  const { result, runs } = mergeRenderingShards(entries);
  const directory = join(root, "benchmarks/rendering/results");
  const raw = join(directory, "raw", result.capture_id);
  mkdirSync(join(raw, "shards"), { recursive: true });
  writeRawJson(join(raw, "process-summaries.json.gz"), runs);
  for (const entry of entries) {
    const w = entry.capture.workloads[0].id;
    const artifact = `raw/${result.capture_id}/shards/${w}.json.gz`;
    writeRawJson(join(directory, artifact), {
      capture: entry.capture,
      runs: entry.runs,
    });
    result.workloadCaptures[w].artifact = artifact;
    result.workloadCaptures[w].sha256 = digest(join(directory, artifact));
    result.raw_artifacts.push({
      label: `${w}: original capture and raw processes`,
      path: artifact,
    });
    const name = `${w}-exact.css`;
    copyFileSync(join(entry.raw, name), join(raw, name));
    result.raw_artifacts.push({
      label: `Exact adapted ${w} stylesheet`,
      path: `raw/${result.capture_id}/${name}`,
    });
  }
  retainCapture(root, directory, result, renderingSourceFiles(root), {
    prefix: "/",
  });
  atomicWrite(
    join(directory, "latest.json"),
    `${JSON.stringify(result, null, 2)}\n`,
  );
  return result;
}

export function verifyRenderingShardEvidence(result, directory) {
  if (result.host.campaignProtocol !== "per-workload-render-host-v1") return;
  assert.match(result.capture_id, /^[a-zA-Z0-9-]+$/);
  const entries = workloadManifest.workloads.map(({ id }) => {
    const proof = result.workloadCaptures[id];
    const artifact = `raw/${result.capture_id}/shards/${id}.json.gz`;
    assert.equal(proof.artifact, artifact);
    const path = join(directory, artifact);
    assert.equal(digest(path), proof.sha256, `${id}: retained shard changed`);
    const entry = readRawJson(path);
    assert.equal(entry.capture.capture_id, proof.captureId);
    assert.equal(entry.capture.workloads[0].id, id);
    assert.equal(entry.capture.captured_at, proof.capturedAt);
    assert.equal(entry.capture.completed_at, proof.completedAt);
    assert.deepEqual(entry.capture.host, proof.host);
    return entry;
  });
  const expected = mergeRenderingShards(entries, {
    aggregateId: result.capture_id,
  });
  for (const key of [
    "status",
    "capture_kind",
    "captured_at",
    "completed_at",
    "host",
    "workloads",
    "renderers",
    "measurements",
    "parity",
    "versions",
    "provenance",
    "limitations",
    "commands",
  ])
    assert.deepEqual(
      result[key],
      expected.result[key],
      `Aggregate ${key} differs from retained workload shards`,
    );
  assert.deepEqual(
    readRawJson(
      join(directory, `raw/${result.capture_id}/process-summaries.json.gz`),
    ),
    expected.runs,
    "Aggregate processes differ from retained workload shards",
  );
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const [root, ...paths] = process.argv.slice(2);
  assert.ok(
    root && paths.length,
    "Usage: bun rendering-shards.mjs <repository> <eight shard JSON paths>",
  );
  console.log(
    JSON.stringify({
      captureId: retainRenderingShards(resolve(root), paths).capture_id,
    }),
  );
}
