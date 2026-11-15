import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { frameworkSourceFiles } from "../../benchmarks/framework-ssr/sources.ts";
import { validateProaRenderRun } from "../../benchmarks/rendering/canonical/render-contract.mjs";
import { renderingSourceFiles } from "../../benchmarks/rendering/canonical/source_fingerprint.mjs";
import suites from "../../benchmarks/suites.json" with { type: "json" };
import { sourceDigest } from "../capture/captures.mjs";
import { readMeasuredSources } from "../capture/measured-sources.mjs";
import { repositoryRoot } from "../repository.mjs";
import { validateCapture } from "./validate.mjs";

// Contributor checks and previews can inspect historical results. Merging and
// production publication require a complete fresh campaign. Each comparison
// stays on one machine; independent suites may use matching isolated hosts.
export function validatePublication(results) {
  assert.deepEqual(
    Object.keys(results).sort(),
    Object.keys(suites).sort(),
    "Publication requires all five benchmark suites",
  );
  const reference = results.rendering.host;
  assert.match(
    reference?.machineId || "",
    /^[a-f0-9]{64}$/,
    "Rerun all benchmarks: machine identity is missing",
  );
  assert.match(
    reference.campaignId || "",
    /^publication-[a-zA-Z0-9-]+$/,
    "Rerun all benchmarks together with BENCH_CAMPAIGN_ID=publication-<unique-id>",
  );
  assert.equal(
    results.rendering.capture_kind,
    "canonical",
    "Renderer publication requires a full rerun, not a Proa-only refresh",
  );
  assert.ok(
    !results.rendering.refresh,
    "Refreshed baselines cannot satisfy publication readiness",
  );
  const affinity = reference.server_cpu_affinity;
  assert.match(
    affinity || "",
    /^\d+$/,
    "Pin benchmark servers to one logical CPU",
  );
  const parallel = reference.campaignProtocol === "per-suite-host-v1";
  const profile = (host) => ({
    machineClass: host.machineClass,
    cpuModel: host.cpuModel,
    logicalCpuCount: host.logicalCpuCount,
    arch: host.arch,
    release: host.release,
  });
  if (parallel) {
    assert.match(
      reference.sourceRevision || "",
      /^[a-f0-9]{40}$/,
      "Missing immutable campaign revision",
    );
    assert.equal(reference.machineClass, "c4-standard-16-lssd");
    assert.equal(reference.logicalCpuCount, 16);
    assert.equal(reference.arch, "x64");
    assert.ok(reference.cpuModel && reference.release && reference.nodeName);
  } else assert.ok(!reference.campaignProtocol, "Unknown campaign protocol");
  for (const [id, result] of Object.entries(results)) {
    assert.equal(result.status, "pass", `${id}: capture failed`);
    assert.match(
      result.host?.machineId || "",
      /^[a-f0-9]{64}$/,
      `${id}: missing machine identity`,
    );
    if (parallel) {
      assert.equal(
        result.host.campaignProtocol,
        reference.campaignProtocol,
        `${id}: mixed campaign protocols`,
      );
      assert.equal(
        result.host.sourceRevision,
        reference.sourceRevision,
        `${id}: different source revision`,
      );
      assert.deepEqual(
        profile(result.host),
        profile(reference),
        `${id}: different benchmark hardware or OS profile`,
      );
      assert.ok(
        result.host.nodeName,
        `${id}: missing isolated worker identity`,
      );
    } else {
      assert.ok(
        !result.host.campaignProtocol,
        `${id}: mixed campaign protocols`,
      );
      assert.equal(
        result.host.machineId,
        reference.machineId,
        `${id}: different benchmark machine`,
      );
    }
    assert.equal(
      result.host?.campaignId,
      reference.campaignId,
      `${id}: different benchmark campaign`,
    );
    assert.equal(
      result.host?.serverCpuAffinity ?? result.host?.server_cpu_affinity,
      affinity,
      `${id}: different server CPU affinity`,
    );
    if (id !== "rendering")
      assert.equal(
        result.captureKind,
        "publication",
        `${id}: full publication capture required`,
      );
    assert.ok(
      !result.refresh,
      `${id}: partial refresh cannot satisfy publication readiness`,
    );
  }
  return {
    machineId: reference.machineId,
    campaignId: reference.campaignId,
    protocol: parallel ? "per-suite-host-v1" : "single-host",
    machines: Object.fromEntries(
      Object.entries(results).map(([id, result]) => [
        id,
        result.host.machineId,
      ]),
    ),
  };
}

export function validateProcessRepeats(runs) {
  assert.deepEqual(
    runs.map((run) => run.repeat).sort((a, b) => a - b),
    [0, 1, 2, 3, 4],
    "Proa raw observations must cover all five independent processes",
  );
}

export function validateAdmissionChecks(checks, result) {
  assert.deepEqual(checks.map((check) => check.engine).sort(), ["exact"]);
  for (const check of checks) {
    assert.ok(typeof check.version === "string" && check.version.length > 0);
    assert.equal(
      check.sourceSha256,
      result.provenance.source_sha256,
      "Admission evidence has stale sources",
    );
    assert.equal(
      check.host?.machineId,
      result.host.machineId,
      "Admission evidence came from a different machine",
    );
    assert.equal(
      check.host?.campaignId,
      result.host.campaignId,
      "Admission evidence came from a different campaign",
    );
    assert.deepEqual(
      check.cells.map((cell) => cell.workload).sort(),
      result.workloads.map((workload) => workload.id).sort(),
    );
    for (const cell of check.cells) {
      assert.equal(cell.status, "unsupported");
      assert.equal(cell.diagnostic, "type-class-name");
    }
  }
}

export async function verifyPublication(root) {
  assert.ok(
    !existsSync(join(root, "site/data/performance/proa-refresh.json")),
    "Proa-only review refresh selected: rerun the complete comparison campaign before merge or launch, then remove site/data/performance/proa-refresh.json",
  );
  const results = {};
  // Check the campaign first so historical data reports the actionable blocker.
  for (const [id, suite] of Object.entries(suites)) {
    results[id] = JSON.parse(
      await readFile(
        join(root, suite.directory, "results/latest.json"),
        "utf8",
      ),
    );
  }
  const campaign = validatePublication(results);
  for (const [id, suite] of Object.entries(suites)) {
    const result = await validateCapture(id, undefined, root);
    if (id === "rendering") {
      const admissions = result.raw_artifacts.find((artifact) =>
        [
          "Unranked fixture admission checks",
          "Unchanged fixture admission checks",
        ].includes(artifact.label),
      );
      assert.equal(
        admissions?.path,
        `raw/${result.capture_id}/admissions.json`,
        "Retain current fixture admission checks before publication",
      );
      validateAdmissionChecks(
        JSON.parse(
          await readFile(
            join(root, suite.directory, "results", admissions.path),
            "utf8",
          ),
        ),
        result,
      );
      const runs = JSON.parse(
        await readFile(
          join(
            root,
            suite.directory,
            "results/raw",
            result.capture_id,
            "process-summaries.json",
          ),
          "utf8",
        ),
      );
      for (const workload of result.workloads) {
        const proa = runs.filter(
          (run) => run.framework_id === "proa" && run.workload === workload.id,
        );
        validateProcessRepeats(proa);
        for (const run of proa) validateProaRenderRun(run);
      }
    }
    const rendering = id === "rendering";
    const files = rendering
      ? renderingSourceFiles(root)
      : id === "framework"
        ? frameworkSourceFiles(root)
        : await readMeasuredSources(join(root, suite.entry));
    assert.equal(
      sourceDigest(root, files, rendering ? "/" : ""),
      rendering ? result.provenance.source_sha256 : result.source.sourceSha256,
      `${id}: measured sources changed; rerun the complete campaign before publication`,
    );
  }
  return campaign;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = repositoryRoot(import.meta.url);
  const campaign = await verifyPublication(root);
  console.log(
    `Publication ready: all five suites validated (${campaign.protocol}) (${campaign.campaignId})`,
  );
}
