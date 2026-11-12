import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { frameworkSourceFiles } from "../framework-ssr/sources.ts";
import { validateProaRenderRun } from "../rendering/canonical/render-contract.mjs";
import { renderingSourceFiles } from "../rendering/canonical/source_fingerprint.mjs";
import { sourceDigest } from "./captures.mjs";
import { readMeasuredSources } from "./measured-sources.mjs";
import suites from "./suites.json" with { type: "json" };
import { validateCapture } from "./validate.mjs";

// Contributor checks and previews can inspect historical results. Merging and
// production publication require a complete fresh campaign on one machine.
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
    "Rerun all benchmarks on one machine: machine identity is missing",
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
  for (const [id, result] of Object.entries(results)) {
    assert.equal(result.status, "pass", `${id}: capture failed`);
    assert.equal(
      result.host?.machineId,
      reference.machineId,
      `${id}: different benchmark machine`,
    );
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
  return { machineId: reference.machineId, campaignId: reference.campaignId };
}

export async function verifyPublication(root) {
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
        assert.deepEqual(
          proa.map((run) => run.repeat).sort(),
          [1, 2, 3, 4, 5],
          "Proa raw observations must cover all five independent processes",
        );
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
  const root = dirname(dirname(fileURLToPath(import.meta.url)));
  const campaign = await verifyPublication(root);
  console.log(
    `Publication ready: all five suites validated on ${campaign.machineId} (${campaign.campaignId})`,
  );
}
