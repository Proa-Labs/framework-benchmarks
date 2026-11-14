import assert from "node:assert/strict";
import { summarize } from "../../suspense-load/stats.mjs";

export function validateProaRenderRun(run) {
  assert.equal(run.framework_id, "proa");
  assert.match(run.allocation_policy || "", /fresh owned RenderBuffer/);
  assert.equal(
    run.build_profile,
    "release",
    "Proa render benchmarks require a release build",
  );
  assert.match(
    run.optimization_level || "",
    /^(1|2|3|s|z)$/,
    "Proa render optimization is disabled",
  );
  assert.equal(run.debug_assertions, false);
  assert.equal(run.timed_operation, "allocate_and_render_fresh_owned_output");
  assert.equal(run.output_destruction_timed, false);
  assert.ok(
    Array.isArray(run.samples_us) && run.samples_us.length === run.iterations,
    "Retain every Proa render observation, in capture order",
  );
  assert.ok(
    run.samples_us.every((value) => Number.isFinite(value) && value >= 0),
  );
  const summary = summarize(run.samples_us);
  for (const [field, stat] of [
    ["min_us", "min"],
    ["mean_us", "mean"],
    ["p50_us", "p50"],
    ["p95_us", "p95"],
    ["p99_us", "p99"],
    ["max_us", "max"],
  ]) {
    assert.ok(
      Math.abs(run[field] - summary[stat]) <=
        Math.max(1e-9, Math.abs(summary[stat]) * 1e-9),
      `Proa ${field} differs from retained raw samples`,
    );
  }
  return run;
}
