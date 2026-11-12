import { test } from "bun:test";
import assert from "node:assert/strict";
import { loadInputs, normalize } from "../data.ts";
import { createChartMarkup } from "../src/charts/chart-markup.ts";
import { createDashboardModel } from "../src/charts/dashboard-model.ts";

test("one comparison table preserves both boundaries, one tool row, and every measured export cell", async () => {
  const data = normalize((await loadInputs()).input);
  const model = createDashboardModel(data);
  const measurements = model.comparisonMeasurements();
  const chart = createChartMarkup(model).draw(model.visibleRows());
  assert.equal((chart.html.match(/<table /g) || []).length, 1);
  const ids = new Set(measurements.map((r) => r.id));
  assert.equal((chart.html.match(/scope="row"/g) || []).length, ids.size);
  assert.equal(
    (chart.html.match(/class="fw-comparison-value"/g) || []).length,
    measurements.length,
  );
  for (const suite of ["rendering", "framework"] as const) {
    const rows = measurements.filter((r) => r.suite === suite);
    const expected =
      suite === "rendering" ? data.rendering.rows : data.framework.workloads;
    assert.equal(rows.length, Object.values(expected).flat().length);
    for (const row of rows) {
      const source = expected[row.workload].find((r) => r.id === row.id);
      assert.equal(row.p50, source?.p50);
      assert.equal(row.unit, suite === "rendering" ? "µs" : "ms");
      assert.equal(row.capturedAt, data[suite].capturedAt);
      assert.equal(row.latency.values.p50, row.p50);
    }
  }
});

test("framework-only selections render without invented render timings and sorting survives a shared URL", async () => {
  const data = normalize((await loadInputs()).input);
  const id = data.framework.rows.find(
    (r) => !data.rendering.rows.cards.some((v) => v.id === r.id),
  )?.id;
  assert.ok(id);
  const model = createDashboardModel(
    data,
    `?selected=${id}&comparison=framework&workload=table`,
  );
  assert.equal(model.visibleRows().length, 0);
  assert.equal(model.state.comparison, "framework");
  const html = createChartMarkup(model).draw(model.visibleRows()).html;
  assert.equal((html.match(/scope="row"/g) || []).length, 1);
  assert.equal(
    (html.match(/class="fw-comparison-value"/g) || []).length,
    data.framework.workloadDefinitions.length,
  );
  assert.ok(!html.includes('data-stat-suite="rendering"'));
  assert.equal(
    model.comparisonMeasurements().every((r) => r.suite === "framework"),
    true,
  );
  const empty = createDashboardModel(data, "?selected=");
  assert.equal(empty.comparisonMeasurements().length, 0);
  assert.ok(!createChartMarkup(empty).draw([]).html.includes("<table"));
});
