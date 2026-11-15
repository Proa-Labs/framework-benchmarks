import { test } from "bun:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import workloads from "../../benchmarks/rendering/canonical/workloads.json" with {
  type: "json",
};
import {
  memoryMetric,
  memoryScope,
  summarizeMemory,
} from "./process-memory.mjs";
import { readRawJson } from "./raw.mjs";
import { mergeRenderingShards } from "./rendering-shards.mjs";

// Controlled in-memory observations exercise aggregation and rejection. These
// values are never written into benchmark captures or the site's source data.
function fixture() {
  const base = JSON.parse(
    readFileSync(
      new URL(
        "../../benchmarks/rendering/results/latest.json",
        import.meta.url,
      ),
    ),
  );
  const artifact = base.raw_artifacts.find((a) =>
    /process summaries/i.test(a.label),
  );
  const raw = readRawJson(
    join(import.meta.dir, "../../benchmarks/rendering/results", artifact.path),
  );
  return workloads.workloads.map((workload, i) => {
    const capture = structuredClone(base);
    capture.capture_id = `test-rendering-shard-${workload.id}`;
    capture.capture_kind = "engineering";
    capture.workloads = [workload];
    delete capture.refresh;
    capture.host = {
      ...base.host,
      campaignId: "render-rss-00000000-0000-0000-0000-000000000000",
      machineId: String(i).repeat(64),
      nodeName: `test-node-${i}`,
      machineClass: "c4-standard-16-lssd",
      logicalCpuCount: 16,
      arch: "x64",
      serverCpuAffinity: "0",
      sourceRevision: "a".repeat(40),
      campaignProtocol: "per-workload-render-host-v1",
    };
    const runs = structuredClone(raw.filter((r) => r.workload === workload.id));
    for (const r of runs)
      r.memory = {
        metric: memoryMetric,
        method: "os-process-resource-usage",
        scope: memoryScope,
        peak_rss_bytes: (r.repeat + 10) * 1048576,
      };
    for (const renderer of capture.renderers) {
      const m = capture.measurements[renderer.id][workload.id];
      m.capture_id = capture.capture_id;
      m.memory = summarizeMemory(
        runs.filter((r) => r.framework_id === renderer.id),
      );
      capture.measurements[renderer.id] = { [workload.id]: m };
      capture.parity[renderer.id] = {
        [workload.id]: capture.parity[renderer.id][workload.id],
      };
    }
    return { capture, runs };
  });
}
test("rendering shards retain every host and native RSS observation without changing latency", () => {
  const entries = fixture();
  const { result, runs } = mergeRenderingShards(entries);
  assert.equal(result.capture_kind, "canonical");
  assert.equal(
    result.host.machineId,
    null,
    "An aggregate must never pretend to be one physical host",
  );
  assert.equal(Object.keys(result.host.workloadHosts).length, 8);
  assert.equal(runs.length, 21 * 8 * 5);
  assert.equal(
    result.measurements.proa.cards.p50_us,
    entries.find((e) => e.capture.workloads[0].id === "cards").capture
      .measurements.proa.cards.p50_us,
  );
  assert.equal(
    result.measurements.proa.cards.memory.process_peak_rss_bytes.length,
    5,
  );
  assert.ok(
    runs.every(
      (r) => r.source_capture_id === result.capture_id && r.shard_capture_id,
    ),
  );
});
test("rendering shards reject missing competitors, changed policy, incomplete RSS and mixed sources/hosts", () => {
  const original = fixture();
  const mutate = (change, pattern) => {
    const entries = structuredClone(original);
    change(entries);
    assert.throws(() => mergeRenderingShards(entries), pattern);
  };
  mutate((e) => e.pop(), /Every rendering workload/);
  mutate((e) => (e[1] = e[0]), /Duplicate/);
  mutate((e) => (e[1].capture.host.cpuModel = "different"), /profiles differ/);
  mutate(
    (e) => (e[1].capture.host.totalMemoryBytes += 2 * 1048576),
    /memory capacities differ/,
  );
  mutate(
    (e) => (e[1].capture.provenance.source_sha256 = "f".repeat(64)),
    /sources differ/,
  );
  mutate(
    (e) => (e[1].capture.host.campaignId = "render-rss-other"),
    /Campaign differs/,
  );
  mutate((e) => (e[1].capture.versions.Proa = "other"), /versions differ/);
  mutate((e) => e[0].runs.pop(), /Missing or unexpected/);
  mutate((e) => (e[0].runs[0].repeat = 9), /missing or repeated/);
  mutate((e) => delete e[0].runs[0].memory, /RSS|observation/);
  mutate(
    (e) => e[0].capture.measurements.proa.cards.memory.peak_rss_bytes++,
    /raw RSS/,
  );
  mutate(
    (e) => (e[0].capture.measurements.proa.cards.samples_per_process = 3),
    /AssertionError/,
  );
  mutate((e) => e[0].capture.renderers.pop(), /roster entries missing/);
});

test("retained rendering evidence detects changed shard bytes and changed aggregate RSS", async () => {
  const { mkdtempSync, mkdirSync, writeFileSync, rmSync } = await import(
    "node:fs"
  );
  const { tmpdir } = await import("node:os");
  const { createHash } = await import("node:crypto");
  const { writeRawJson } = await import("./raw.mjs");
  const { verifyRenderingShardEvidence } = await import(
    "./rendering-shards.mjs"
  );
  const directory = mkdtempSync(join(tmpdir(), "rendering-shard-proof-"));
  try {
    const entries = fixture();
    const { result, runs } = mergeRenderingShards(entries);
    mkdirSync(join(directory, "raw", result.capture_id, "shards"), {
      recursive: true,
    });
    writeRawJson(
      join(directory, "raw", result.capture_id, "process-summaries.json.gz"),
      runs,
    );
    for (const entry of entries) {
      const id = entry.capture.workloads[0].id;
      const artifact = `raw/${result.capture_id}/shards/${id}.json.gz`;
      writeRawJson(join(directory, artifact), entry);
      Object.assign(result.workloadCaptures[id], {
        artifact,
        sha256: createHash("sha256")
          .update(readFileSync(join(directory, artifact)))
          .digest("hex"),
      });
    }
    verifyRenderingShardEvidence(result, directory);
    const changed = structuredClone(result);
    changed.measurements.proa.cards.memory.peak_rss_bytes++;
    assert.throws(
      () => verifyRenderingShardEvidence(changed, directory),
      /Aggregate measurements differs/,
    );
    writeFileSync(
      join(directory, result.workloadCaptures.cards.artifact),
      "changed",
    );
    assert.throws(
      () => verifyRenderingShardEvidence(result, directory),
      /retained shard changed/,
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
