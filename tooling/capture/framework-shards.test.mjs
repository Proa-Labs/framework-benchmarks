import { test } from "bun:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import contract from "../../benchmarks/framework-ssr/contract.json" with {
  type: "json",
};
import {
  sha256,
  validateSemanticHtml,
} from "../../benchmarks/framework-ssr/parity.mjs";
import {
  validateResult,
  workloadDefinitions,
} from "../../benchmarks/framework-ssr/report.ts";
import {
  loadFixture,
  renderReference,
} from "../../benchmarks/rendering/showcase/fixture.mjs";
import { verifyFrameworkShardEvidence } from "../checks/framework-shards.mjs";
import { validatePublication } from "../checks/publication.mjs";
import { retainCapture, sourceDigest } from "./captures.mjs";
import {
  aggregateFrameworkShards,
  mergeFrameworkShards,
} from "./framework-shards.mjs";
import { readRaw, readRawJson } from "./raw.mjs";
import { verifyRetainedSource } from "./retained-source.mjs";

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

for (const smoke of [false, true])
  test(`aggregation verifies raw bytes and retains original ${smoke ? "smoke" : "publication"} shards before cleanup`, () => {
    const root = mkdtempSync(join(tmpdir(), "framework-shard-io-"));
    try {
      execFileSync("git", ["init", "--quiet", root]);
      const files = ["benchmarks/framework-ssr/contract.json"];
      mkdirSync(join(root, "benchmarks/framework-ssr"), { recursive: true });
      writeFileSync(join(root, files[0]), JSON.stringify(contract));
      execFileSync("git", ["add", files[0]], { cwd: root });
      const sourceSha256 = sourceDigest(root, files);
      const selected = JSON.parse(
        readFileSync(
          new URL(
            "../../benchmarks/framework-ssr/results/latest.json",
            import.meta.url,
          ),
          "utf8",
        ),
      );
      const base = join(root, "benchmarks/framework-ssr/results");
      const selectedDirectory = smoke ? join(base, "local") : base;
      const pointer = smoke ? "smoke.json" : "latest.json";
      const shards = inputs();
      if (smoke)
        for (const shard of shards) {
          shard.shard.smoke = true;
          shard.methodology = {
            ...contract.publication,
            repeats: 1,
            concurrency: 2,
            warmupRequests: 2,
            preRollSeconds: 0.2,
            durationSeconds: 10,
          };
          for (const engine of shard.engines)
            engine.phases = engine.phases
              .filter((p) => p.repeat === 1)
              .map((p) => ({
                ...p,
                concurrency: p.mode === "closed" ? 2 : null,
                durationSeconds: 10,
              }));
        }
      for (const shard of shards) {
        const id = shard.shard.workload;
        shard.source.sourceSha256 = sourceSha256;
        const folder = join(base, "shards", id);
        const captureDirectory = smoke ? join(folder, "local") : folder;
        const raw = join(captureDirectory, "raw", shard.captureId);
        mkdirSync(raw, { recursive: true });
        let html;
        if (["cards", "products", "table"].includes(id)) {
          const artifact = new URL(
            `../../benchmarks/framework-ssr/results/raw/${selected.captureId}/proa-${id}-parity.html`,
            import.meta.url,
          );
          html = readRaw(
            existsSync(artifact)
              ? artifact.pathname
              : `${artifact.pathname}.gz`,
          ).toString();
        } else {
          const { definition, data } = loadFixture(id);
          data.texts[definition.controls.requestIndex] = "fresh-b";
          html = renderReference(definition, data);
        }
        for (const engine of shard.engines) {
          // Synthetic capture data exercises aggregation, never performance. The
          // adapted test response adds a native class; its business tree is intact.
          const body =
            engine.id === "exact" &&
            !["cards", "products", "table"].includes(id)
              ? html
                  .replace(
                    "</head>",
                    "<style>.c1{display:block}</style></head>",
                  )
                  .replace("<body", '<body class="c1"')
              : html;
          const proof = engine.parityByWorkload[id];
          proof.responseBytes = Buffer.byteLength(body);
          proof.responseSha256 = sha256(body);
          proof.semanticSha256 = validateSemanticHtml(body, "fresh-b", id, {
            adapted:
              engine.id === "exact" &&
              !["cards", "products", "table"].includes(id),
          });
          writeFileSync(
            join(raw, `${engine.id}-${id}-parity.html.gz`),
            gzipSync(body),
          );
        }
        retainCapture(root, captureDirectory, shard, files);
        writeFileSync(join(folder, pointer), JSON.stringify(shard));
      }
      const corrupt = join(
        base,
        `shards/cards/${smoke ? "local/" : ""}raw/shard-cards/proa-cards-parity.html.gz`,
      );
      const original = readFileSync(corrupt);
      writeFileSync(corrupt, gzipSync("changed response"));
      assert.throws(() => aggregateFrameworkShards(root, { smoke }));
      assert.ok(existsSync(join(base, "shards")));
      assert.ok(!existsSync(join(selectedDirectory, pointer)));
      writeFileSync(corrupt, original);
      const merged = aggregateFrameworkShards(root, { smoke });
      assert.ok(!existsSync(join(base, "shards")));
      assert.equal(
        JSON.parse(readFileSync(join(selectedDirectory, pointer))).captureId,
        merged.captureId,
      );
      verifyRetainedSource(selectedDirectory, merged);
      verifyFrameworkShardEvidence(merged, selectedDirectory, { smoke });
      const changed = structuredClone(merged);
      changed.engines[0].phases[0].completionThroughputRps += 1;
      assert.throws(() =>
        verifyFrameworkShardEvidence(changed, selectedDirectory, { smoke }),
      );
      const retainedShard = join(
        selectedDirectory,
        merged.workloadCaptures.cards.artifact,
      );
      const originalShardBytes = readFileSync(retainedShard);
      writeFileSync(retainedShard, gzipSync("changed shard"));
      assert.throws(() =>
        verifyFrameworkShardEvidence(merged, selectedDirectory, { smoke }),
      );
      writeFileSync(retainedShard, originalShardBytes);
      for (const shard of shards) {
        const proof = merged.workloadCaptures[shard.shard.workload];
        assert.deepEqual(
          readRawJson(join(selectedDirectory, proof.artifact)),
          shard,
        );
        assert.equal(
          sha256(readFileSync(join(selectedDirectory, proof.artifact))),
          proof.artifactSha256,
        );
        for (const engine of shard.engines) {
          const body = readRaw(
            join(
              selectedDirectory,
              "raw",
              merged.captureId,
              `${engine.id}-${shard.shard.workload}-parity.html.gz`,
            ),
          );
          assert.equal(
            sha256(body),
            engine.parityByWorkload[shard.shard.workload].responseSha256,
          );
        }
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }, 30_000);
