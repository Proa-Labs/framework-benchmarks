import { test } from "bun:test";
import assert from "node:assert/strict";
import { loadInputs, normalize } from "../data.ts";
import { createDashboardModel } from "../src/charts/dashboard-model.ts";

// Display selections must not turn unmeasured roster entries into controls.
test("evidence tool choices follow the active experiment and survive deselection", async () => {
  const data = normalize((await loadInputs()).input);
  for (const view of [
    "rendering",
    "framework",
    "http",
    "streaming",
    "startup",
  ] as const) {
    const model = createDashboardModel(
      data,
      `?view=${view}&chart=bars&workload=cards`,
    );
    model.normalizeState();
    const expected = new Set(model.getRows().map((row) => row.id));
    assert.deepEqual(
      new Set(model.experimentTools().map((tool) => tool.id)),
      expected,
    );
    model.state.selected = [];
    assert.deepEqual(
      new Set(model.experimentTools().map((tool) => tool.id)),
      expected,
    );
  }
});

test("comparison controls include measurements from every displayed workload", async () => {
  const data = normalize((await loadInputs()).input);
  const model = createDashboardModel(
    data,
    "?view=rendering&chart=compare&workload=cards",
  );
  const expected = new Set(
    data.workloads.flatMap((workload) =>
      model.renderingRows(workload.id).map((row) => row.id),
    ),
  );
  assert.deepEqual(
    new Set(model.experimentTools().map((tool) => tool.id)),
    expected,
  );
});
