import { test } from "bun:test";
import assert from "node:assert/strict";
import {
  memoryMetric,
  memoryScope,
  summarizeMemory,
} from "../../tooling/capture/process-memory.mjs";
import { loadInputs, normalize } from "../data.ts";
import { createChartMarkup } from "../src/charts/chart-markup.ts";
import { createDashboardModel } from "../src/charts/dashboard-model.ts";

function withoutMemory(input: import("../benchmark-types.ts").Inputs) {
  for (const run of input.processSummaries) delete run.memory;
  for (const workloads of Object.values(input.rendering.measurements))
    for (const measurement of Object.values(workloads))
      delete measurement.memory;
  return input;
}

test("old renderer captures cannot acquire invented memory values", async () => {
  const data = normalize(withoutMemory((await loadInputs()).input));
  const model = createDashboardModel(
    data,
    "?view=rendering&render=rss&workload=cards&chart=bars",
  );
  assert.equal(model.unit(), "MiB");
  assert.deepEqual(model.getRows(), []);
  assert.deepEqual(model.comparisonMeasurements(), []);
  assert.match(createChartMarkup(model).draw([]).html, /RSS was not recorded/);
  assert.equal(model.renderingCoverage("exact", "cards").status, "unmeasured");
  assert.match(model.suites.rendering.scope, /not allocation per render/);
  assert.match(model.suites.rendering.method, /native renderer/);
});
test("RSS charts, popovers and exports use process peaks without changing render latency", async () => {
  const { input } = await loadInputs();
  withoutMemory(input);
  for (const [id, offset] of [
    ["proa", 40],
    ["askama", 0],
  ] as const) {
    const runs = input.processSummaries.filter(
      (r) => r.framework_id === id && r.workload === "cards",
    );
    for (const run of runs)
      run.memory = {
        metric: memoryMetric,
        method: "os-process-resource-usage",
        scope: memoryScope,
        peak_rss_bytes: (offset + 10 + run.repeat) * 1048576,
      };
    input.rendering.measurements[id].cards.memory = summarizeMemory(runs);
  }
  const data = normalize(input);
  const original = input.rendering.measurements.proa.cards.p50_us;
  assert.equal(
    data.rendering.rows.cards.find((r) => r.id === "proa")?.p50,
    original,
  );
  const model = createDashboardModel(
    data,
    "?view=rendering&render=rss&workload=cards&chart=bars",
  );
  assert.equal(model.visibleRows()[0].id, "askama");
  const proa = model.getRows().find((r) => r.id === "proa");
  assert.ok(proa);
  assert.equal(model.value(proa), 52);
  assert.deepEqual(model.samples(proa), [50, 51, 52, 53, 54]);
  assert.equal(model.latencyStats(proa)?.unit, "MiB");
  assert.match(
    model.latencyStats(proa)?.scope ?? "",
    /not allocation per render/,
  );
  assert.ok(model.comparisonMeasurements().every((r) => r.unit === "MiB"));
  const table = createChartMarkup(model).draw(
    model.visibleRows(),
    "table",
  ).html;
  assert.match(table, /Median peak RSS \(MiB\)/);
  assert.doesNotMatch(table, /Latency P50|µs/);
  const comparison = createChartMarkup(model).draw(
    model.visibleRows(),
    "compare",
  ).html;
  assert.match(comparison, /peak process RSS/);
  assert.doesNotMatch(comparison, /<small>µs<\/small>/);
  const memory = input.rendering.measurements.proa.cards.memory;
  assert.ok(memory);
  memory.peak_rss_bytes++;
  assert.throws(() => normalize(input), /memory differs from raw/);
});
