import { test } from "bun:test";
import assert from "node:assert/strict";
import { loadInputs, normalize } from "../data.ts";
import { createChartMarkup } from "../src/charts/chart-markup.ts";
import { createDashboardModel } from "../src/charts/dashboard-model.ts";

test("SSR comparison uses one render-only column per workload and exports only that experiment", async () => {
  const data = normalize((await loadInputs()).input);
  const model = createDashboardModel(data);
  const rows = model.comparisonMeasurements();
  const chart = createChartMarkup(model).draw(model.visibleRows());
  assert.equal((chart.html.match(/<table /g) || []).length, 1);
  assert.equal(
    (chart.html.match(/scope="col"/g) || []).length,
    1 + data.workloads.length,
  );
  assert.equal(
    (chart.html.match(/class="fw-comparison-value"/g) || []).length,
    rows.length,
  );
  assert.equal(rows.length, Object.values(data.rendering.rows).flat().length);
  assert.ok(!chart.html.includes('data-stat-suite="framework"'));
  assert.ok(!chart.html.includes("data-framework-comparison"));
  for (const row of rows) {
    const source = data.rendering.rows[row.workload].find(
      (r) => r.id === row.id,
    );
    assert.equal(row.p50, source?.p50);
    assert.equal(row.suite, "rendering");
    assert.equal(row.unit, "µs");
    assert.equal(row.capturedAt, source?.capturedAt);
    assert.equal(row.latency.values.p50, row.p50);
  }
});

test("missing render-only coverage stays explicit and a legacy URL cannot substitute HTTP timings", async () => {
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
  assert.equal(model.comparisonMeasurements().length, 0);
  const html = createChartMarkup(model).draw([]).html;
  assert.equal((html.match(/data-renderer-pending/g) || []).length, 1);
  assert.equal(
    (html.match(/data-support-workload=/g) || []).length,
    data.workloads.length,
  );
  assert.ok(!html.includes("fw-comparison-value"));
  assert.ok(!html.includes('data-stat-suite="framework"'));
  assert.ok(html.includes("Only entries that pass the same unchanged fixture"));
  const empty = createDashboardModel(data, "?selected=");
  assert.equal(empty.comparisonMeasurements().length, 0);
  assert.ok(!createChartMarkup(empty).draw([]).html.includes("<table"));
});

test("unsupported literal-class fixtures have per-workload explanations and never acquire latency samples", async () => {
  const data = normalize((await loadInputs()).input);
  const model = createDashboardModel(data, "?selected=exact");
  const html = createChartMarkup(model).draw(model.visibleRows()).html;
  assert.equal(model.comparisonMeasurements().length, 0);
  assert.equal(
    (html.match(/>Unsupported<span/g) || []).length,
    data.workloads.length,
  );
  for (const workload of data.workloads) {
    const support = model.renderingCoverage("exact", workload.id);
    assert.equal(support.status, "unsupported");
    assert.ok(support.reason.length > 0);
    assert.match(support.version, /94b8671f70fe/);
    assert.ok(html.includes(`data-support-workload="${workload.id}"`));
  }
});
