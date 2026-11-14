import { expect, test } from "bun:test";
import { validateProaRenderRun } from "../../benchmarks/rendering/canonical/render-contract.mjs";
import { summarize } from "../stats.mjs";

const run = () => {
  const samples = [3, 1, 4, 2];
  const summary = summarize(samples);
  return {
    framework_id: "proa",
    allocation_policy: "fresh owned RenderBuffer",
    build_profile: "release",
    optimization_level: "3",
    debug_assertions: false,
    timed_operation: "allocate_and_render_fresh_owned_output",
    output_destruction_timed: false,
    iterations: samples.length,
    samples_us: samples,
    ...Object.fromEntries(
      Object.entries(summary).map(([key, value]) => [`${key}_us`, value]),
    ),
  };
};
test("default Proa runs require native owned output, optimized release code and complete raw observations", () => {
  expect(validateProaRenderRun(run()).samples_us).toEqual([3, 1, 4, 2]);
  for (const mutate of [
    (r) => {
      r.allocation_policy = "fresh owned String";
    },
    (r) => {
      r.build_profile = "debug";
    },
    (r) => {
      r.optimization_level = "0";
    },
    (r) => {
      r.debug_assertions = true;
    },
    (r) => {
      r.output_destruction_timed = true;
    },
    (r) => {
      r.samples_us.pop();
    },
    (r) => {
      r.samples_us[0] = NaN;
    },
    (r) => {
      r.p50_us *= 2;
    },
  ]) {
    const changed = run();
    mutate(changed);
    expect(() => validateProaRenderRun(changed)).toThrow();
  }
});
