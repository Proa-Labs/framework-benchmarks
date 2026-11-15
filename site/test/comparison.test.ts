import { test } from "bun:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadInputs, normalize } from "../data.ts";
import { createChartMarkup } from "../src/charts/chart-markup.ts";
import { createDashboardModel } from "../src/charts/dashboard-model.ts";
import { ChartMarkup } from "../src/charts/InitialDashboard.tsx";

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
  const id = data.framework.rows[0].id;
  for (const w of data.workloads)
    data.rendering.rows[w.id] = data.rendering.rows[w.id].filter(
      (r) => r.id !== id,
    );
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
  assert.ok(html.includes("Strict rows pass the unchanged HTML fixture"));
  const empty = createDashboardModel(data, "?selected=");
  assert.equal(empty.comparisonMeasurements().length, 0);
  assert.ok(!createChartMarkup(empty).draw([]).html.includes("<table"));
});

test("Exact discloses native fixture differences and keeps strict-fixture limitations explicit", async () => {
  const data = normalize((await loadInputs()).input);
  const model = createDashboardModel(data, "?selected=exact");
  const html = createChartMarkup(model).draw(model.visibleRows()).html;
  const adaptation = data.renderers.find(
    (r) => r.id === "exact",
  )?.renderingAdaptation;
  assert.ok(adaptation?.source.includes("#styling-and-layout"));
  assert.ok(
    adaptation?.details.includes(
      "/benchmarks/rendering/showcase/README.md#exacts-explicit-adaptation",
    ),
  );
  assert.ok(html.includes('class="fw-fixture-adapted"'));
  assert.ok(html.includes('data-render-adaptation="exact"'));
  for (const row of model.comparisonMeasurements()) {
    assert.match(row.fixture ?? "", /^exact-(?:showcase-)?native-v1$/);
    assert.deepEqual(row.adaptation, adaptation);
  }
  for (const workload of data.workloads) {
    const support = model.renderingCoverage("exact", workload.id);
    assert.equal(support.status, "unsupported");
    assert.ok(support.reason.length > 0);
    assert.match(support.version, /94b8671f70fe/);
    if (!data.rendering.rows[workload.id].some((r) => r.id === "exact"))
      assert.ok(html.includes(`data-support-workload="${workload.id}"`));
  }
});

test("adapted measurements cannot be published without their linked disclosure", async () => {
  const { input } = await loadInputs();
  if (!input.rendering.renderers.some((r) => r.id === "exact")) return;
  const changed = structuredClone(input);
  const exact = changed.catalog.find((r) => r.id === "exact");
  assert.ok(exact);
  delete exact.renderingAdaptation;
  assert.throws(() => normalize(changed), /linked disclosure/);
});

test("the directory is server-rendered on its own route and deferred on performance pages", async () => {
  const data = normalize((await loadInputs()).input);
  const catalog = (search: string) =>
    renderToStaticMarkup(
      createElement(ChartMarkup, {
        model: createDashboardModel(data, search),
        slot: "catalog",
      }),
    );
  assert.equal(catalog(""), '<div data-catalog=""></div>');
  const direct = catalog("?section=ecosystem");
  assert.equal(
    (direct.match(/class="fw-catalog-row"/g) || []).length,
    data.ecosystem.length,
  );
});
