import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { validateResult as validateFramework } from "../framework-ssr/report.ts";
import { validateProaRenderRun } from "../rendering/canonical/render-contract.mjs";

export const refreshFolders = {
  rendering: "rendering",
  scaling: "rendering",
  framework: "framework-ssr",
  http: "page-load",
  streaming: "suspense-load",
  startup: "cold-start",
};
const read = (path) => JSON.parse(readFileSync(path, "utf8"));
const idOf = (d) => d.capture_id ?? d.captureId;
const sourcePath = (root, suite, d) =>
  join(root, refreshFolders[suite], "results/raw", idOf(d), "source.tar.gz");
function phasesValid(phases) {
  for (const p of phases) {
    assert.equal(p.errorCount, 0);
    assert.equal(p.loadGeneratorValid, true);
    assert.ok(p.successfulRequests > 0 && p.completionThroughputRps > 0);
    assert.ok(Number.isFinite(p.latencyMs.scheduledComplete.p50));
  }
}
export function validateProaPair(suite, pair, base, manifest) {
  for (const [lane, d] of Object.entries(pair)) {
    assert.equal(d.status, "pass");
    assert.equal(d.capture_kind ?? d.captureKind, "engineering");
    const revision =
      lane === "baseline" ? manifest.beforeRevision : manifest.afterRevision;
    if (d.source) assert.equal(d.source.proaRevision, revision);
    else assert.ok(d.versions.Proa.includes(revision));
    assert.equal(d.host.campaignProtocol, "proa-only-v1");
    for (const key of [
      "cpuModel",
      "logicalCpuCount",
      "arch",
      "release",
      "machineClass",
    ])
      assert.equal(
        d.host[key],
        base.host[key],
        `Different hardware/OS profile: ${key}`,
      );
    if (suite === "rendering" || suite === "scaling") {
      assert.deepEqual(
        d.renderers.map((r) => r.id),
        ["proa"],
      );
      const keys =
        suite === "rendering"
          ? base.workloads.map((w) => w.id)
          : base.counts.map(String);
      assert.deepEqual(
        Object.keys(d.measurements.proa).sort(),
        [...keys].sort(),
      );
      for (const key of keys) {
        assert.equal(d.parity.proa[key].status, "pass");
        assert.equal(
          d.parity.proa[key].canonical_sha256,
          base.parity.proa[key].canonical_sha256,
        );
        assert.equal(
          d.parity.proa[key].output_bytes,
          base.parity.proa[key].output_bytes,
        );
        assert.equal(d.measurements.proa[key].independent_processes, 5);
        for (const field of ["samples_per_process", "warmups_per_process"])
          assert.equal(
            d.measurements.proa[key][field],
            base.measurements.proa[key][field],
          );
      }
    } else {
      assert.deepEqual(
        d.engines.map((e) => e.id),
        ["proa"],
      );
      const e = d.engines[0];
      assert.deepEqual(d.scenario, base.scenario);
      if (suite === "framework") {
        validateFramework(d, false);
        assert.deepEqual(d.methodology, base.methodology);
        phasesValid(e.phases);
      }
      if (suite === "http") {
        assert.equal(e.health.workerThreads, 1);
        for (const key of [
          "repeats",
          "durationSeconds",
          "preRollSeconds",
          "warmupRequests",
          "closedLoopConcurrency",
          "generatorWorkers",
        ])
          assert.equal(d.methodology[key], base.methodology[key]);
        assert.deepEqual(Object.keys(e.workloads).sort(), [
          "cards",
          "products",
          "table",
        ]);
        for (const [key, c] of Object.entries(e.workloads)) {
          assert.equal(c.parity.byteIdenticalToCanonicalDump, true);
          assert.deepEqual(
            c.canonicalDump,
            base.engines.find((e) => e.id === "proa").workloads[key]
              .canonicalDump,
          );
          assert.equal(c.phases.length, 6);
          phasesValid(c.phases);
          assert.deepEqual(
            c.phases.map((p) => `${p.mode}/${p.repeat}`).sort(),
            ["closed/1", "closed/2", "closed/3", "open/1", "open/2", "open/3"],
          );
        }
      }
      if (suite === "streaming") {
        assert.equal(e.health.workerThreads, 1);
        assert.equal(d.methodology.generatorWorkers, 32);
        for (const key of [
          "repeats",
          "durationSecondsPerRate",
          "preRollSecondsPerRate",
          "warmupRequestsPerEngineRateProcess",
          "generatorLagP95LimitMs",
          "generatorCpuLimit",
          "responseValidator",
          "ratesRps",
        ])
          assert.deepEqual(d.methodology[key], base.methodology[key]);
        assert.equal(e.phases.length, 24);
        phasesValid(e.phases);
        for (const rate of base.methodology.ratesRps)
          assert.deepEqual(
            e.phases
              .filter((p) => p.offeredRps === rate)
              .map((p) => p.repeat)
              .sort(),
            [1, 2, 3],
          );
        assert.equal(e.multiThread.workerThreads, 4);
        assert.equal(e.multiThread.phases.length, 3);
        phasesValid(e.multiThread.phases);
      }
      if (suite === "startup") {
        assert.equal(d.methodology.starts, 15);
        assert.equal(d.methodology.warmupStarts, 2);
        assert.equal(e.starts.length, 15);
        assert.deepEqual(
          e.canonicalDump,
          base.engines.find((e) => e.id === "proa").canonicalDump,
        );
        assert.ok(
          e.starts.every(
            (s) => s.firstResponseMs > 0 && s.rssAfterFirstResponseBytes > 0,
          ),
        );
      }
    }
  }
  assert.equal(
    pair.baseline.host.machineId,
    pair.merged.host.machineId,
    "Paired revisions need the same physical boot",
  );
}
export function loadProaRefresh(root, input, buffers) {
  const manifest = read(join(root, "site/proa-refresh.json"));
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.reviewOnly, true);
  assert.deepEqual(
    Object.keys(manifest.runs).sort(),
    Object.keys(refreshFolders).sort(),
  );
  for (const key of ["beforeRevision", "afterRevision"])
    assert.match(manifest[key], /^[a-f0-9]{40}$/);
  const captures = {},
    sourcePairs = [];
  for (const [suite, folder] of Object.entries(refreshFolders)) {
    const base =
      suite === "scaling"
        ? read(join(root, "rendering/results/product-scaling.json"))
        : input[suite === "http" ? "http" : suite];
    if (suite !== "scaling") {
      const view = suite === "framework" ? "framework" : suite;
      assert.equal(
        manifest.baseline[suite].captureId,
        idOf(base),
        "Refresh targets another baseline",
      );
      assert.equal(
        manifest.baseline[suite].sha256,
        createHash("sha256").update(buffers[view]).digest("hex"),
        "Peer baseline changed",
      );
    }
    const pair = {};
    assert.deepEqual(Object.keys(manifest.runs[suite]).sort(), [
      "baseline",
      "merged",
    ]);
    for (const lane of ["baseline", "merged"]) {
      const id = manifest.runs[suite][lane];
      assert.match(id, /^[a-zA-Z0-9-]+$/);
      const text = readFileSync(
        join(root, folder, "results/archive", `${id}.json`),
      );
      assert.equal(
        createHash("sha256").update(text).digest("hex"),
        manifest.artifactSha256[id],
        "Refresh artifact changed",
      );
      const d = JSON.parse(text.toString());
      assert.equal(idOf(d), id);
      pair[lane] = d;
      if (suite === "rendering" || suite === "scaling") {
        const raw =
          suite === "scaling"
            ? d.raw_artifact
            : d.raw_artifacts.find((r) => r.label === "Per-process summaries")
                .path;
        assert.equal(raw, `raw/${id}/process-summaries.json`);
        const records = read(join(root, folder, "results", raw));
        assert.equal(records.length, 15);
        records.forEach(validateProaRenderRun);
        for (const key of Object.keys(d.measurements.proa)) {
          const rows = records.filter((r) =>
            suite === "scaling"
              ? String(r.workload_cardinality) === key
              : r.workload === key,
          );
          assert.deepEqual(rows.map((r) => r.repeat).sort(), [0, 1, 2, 3, 4]);
        }
      }
    }
    validateProaPair(suite, pair, base, manifest);
    captures[suite] = pair;
    sourcePairs.push({
      before: sourcePath(root, suite, pair.baseline),
      after: sourcePath(root, suite, pair.merged),
      beforeRevision: manifest.beforeRevision,
      afterRevision: manifest.afterRevision,
      beforeExpected:
        pair.baseline.source?.sourceSha256 ??
        pair.baseline.provenance.source_sha256,
      afterExpected:
        pair.merged.source?.sourceSha256 ??
        pair.merged.provenance.source_sha256,
      prefix: suite === "rendering" || suite === "scaling" ? "/" : "",
    });
  }
  execFileSync("python3", [join(root, "tooling/check-proa-refresh.py")], {
    input: JSON.stringify(sourcePairs),
    stdio: ["pipe", "pipe", "pipe"],
  });
  return { manifest, captures };
}
