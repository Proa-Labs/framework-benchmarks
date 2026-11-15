import { test } from "bun:test";
import assert from "node:assert/strict";
import contract from "../../benchmarks/framework-ssr/contract.json" with {
  type: "json",
};
import {
  validateResult,
  workloadDefinitions,
} from "../../benchmarks/framework-ssr/report.ts";
import { validatePublication } from "../checks/publication.mjs";
import { mergeFrameworkShards } from "./framework-shards.mjs";

function inputs() {
  return contract.workloads.map((w, index) => {
    const result = {
      schemaVersion: 2,
      status: "pass",
      captureKind: "shard",
      shard: { workload: w.id, smoke: false },
      captureId: `shard-${w.id}`,
      capturedAt: "2026-11-15T00:00:00Z",
      scenario: { ...contract, workloads: [w] },
      methodology: contract.publication,
      host: {
        machineId: index.toString(16).padStart(64, "a"),
        campaignId: "publication-test",
        campaignProtocol: "per-suite-host-v1",
        machineClass: "c4-standard-16-lssd",
        sourceRevision: "c".repeat(40),
        nodeName: `node-${index}`,
        cpuModel: "Test C4",
        logicalCpuCount: 16,
        arch: "x64",
        release: "Linux",
        serverCpuAffinity: "0",
      },
      source: {
        sourceSha256: "d".repeat(64),
        repositoryCommit: "c".repeat(40),
        dirty: false,
      },
      commands: {
        runtime: contract.runtime,
        build: "build",
        capture: "capture",
      },
      limitations: [],
      engines: [],
    };
    const definition = workloadDefinitions(result)[0];
    result.engines = contract.engines.map((id) => {
      const proof = {
        pass: true,
        semanticSha256: "e".repeat(64),
        responseSha256: "f".repeat(64),
        negativeControls: 3,
        responseBytes: 100,
      };
      return {
        id,
        framework: id,
        runtime: id === "proa" ? "Rust / Tokio" : contract.runtime,
        parity: proof,
        parityByWorkload: { [w.id]: proof },
        phases: ["closed", "open"].flatMap((mode) =>
          [1, 2, 3].map((repeat) => ({
            repeat,
            workload: w.id,
            mode,
            concurrency:
              mode === "closed" ? definition.capacityConcurrency : null,
            offeredRps: mode === "open" ? w.fixedRateRps : null,
            durationSeconds:
              mode === "closed"
                ? definition.capacityDurationSeconds
                : definition.latencyDurationSeconds,
            errorCount: 0,
            loadGeneratorValid: true,
            completionThroughputRps: 100,
            latencyMs: {
              complete: { p50: 1, p95: 2, p99: 3 },
              scheduledComplete: { p50: 1, p95: 2, p99: 3 },
            },
            cpu: { cpuMsPerSuccessfulRequest: 1 },
            memory: { peakSampledRssBytes: 1024 },
          })),
        ),
      };
    });
    return result;
  });
}
test("a workload shard cannot satisfy the publication gate alone", () => {
  const shard = inputs()[0];
  assert.doesNotThrow(() => validateResult(shard, false));
  assert.throws(() => validateResult(shard, true));
});
test("aggregation keeps every measured phase and discloses each physical workload host", () => {
  const shards = inputs(),
    original = JSON.stringify(shards),
    result = mergeFrameworkShards(shards);
  assert.equal(result.host.machineId, null);
  assert.equal(result.host.campaignProtocol, "per-workload-host-v1");
  assert.equal(Object.keys(result.host.workloadHosts).length, 8);
  assert.equal(result.engines.length, 5);
  for (const e of result.engines) {
    assert.equal(e.phases.length, 48);
    for (const w of contract.workloads)
      assert.equal(e.phases.filter((p) => p.workload === w.id).length, 6);
  }
  assert.equal(JSON.stringify(shards), original);
  const host = shards[0].host;
  const matrix = Object.fromEntries(
    ["rendering", "framework", "http", "streaming", "startup"].map((id) => [
      id,
      id === "framework"
        ? result
        : {
            status: "pass",
            captureKind: "publication",
            capture_kind: "canonical",
            host: { ...host, server_cpu_affinity: "0" },
          },
    ]),
  );
  assert.equal(validatePublication(matrix).protocol, "per-workload-host-v1");
  const bad = structuredClone(matrix);
  bad.framework.host.workloadHosts.espn.sourceRevision = "b".repeat(40);
  assert.throws(() => validatePublication(bad));
});
test("missing, duplicate, failed, mixed-source and mixed-machine-profile shards are rejected", () => {
  for (const mutate of [
    (rows) => rows.pop(),
    (rows) => (rows[1] = structuredClone(rows[0])),
    (rows) => (rows[1].source.sourceSha256 = "a".repeat(64)),
    (rows) => (rows[1].host.cpuModel = "Other"),
    (rows) => (rows[1].host.sourceRevision = "a".repeat(40)),
    (rows) => (rows[1].host.campaignId = "another"),
    (rows) => rows[1].engines[0].phases.pop(),
    (rows) => (rows[1].engines[0].phases[0].errorCount = 1),
    (rows) => (rows[1].engines[0].phases[0].concurrency = 1),
    (rows) => (rows[6].engines[0].phases[3].durationSeconds = 10),
  ]) {
    const data = inputs();
    mutate(data);
    assert.throws(() => mergeFrameworkShards(data));
  }
});
