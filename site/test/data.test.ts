import assert from "node:assert/strict";
import test from "node:test";
import { summarize } from "../../suspense-load/stats.mjs";
import type { Inputs } from "../benchmark-types.ts";
import { loadInputs, normalize } from "../data.ts";
import { required } from "../required.ts";
import { createDashboardModel } from "../src/charts/dashboard-model.ts";

test("site measurements come from the canonical capture and raw process runs", async () => {
  const { input } = await loadInputs();
  const data = normalize(input);
  assert.equal(
    data.renderers.filter((r) => r.status !== "unmeasured").length,
    input.rendering.renderers.length,
  );
  assert.deepEqual(
    data.renderers.map((r) => r.label),
    [...data.renderers.map((r) => r.label)].sort((a, b) => a.localeCompare(b)),
  );
  for (const renderer of input.rendering.renderers)
    for (const workload of input.rendering.workloads) {
      const row = required(
        data.rendering.rows[workload.id].find((r) => r.id === renderer.id),
      );
      assert.equal(
        row.p50,
        input.rendering.measurements[renderer.id][workload.id].p50_us,
      );
      assert.equal(
        row.p95,
        input.rendering.measurements[renderer.id][workload.id].p95_us,
      );
      assert.equal(
        row.samples.length,
        input.rendering.measurements[renderer.id][workload.id]
          .independent_processes,
      );
    }
});
test("capture changes update derived measurements without editing presentation code", async () => {
  const { input } = await loadInputs();
  input.http.engines[0].workloads.cards.phases
    .filter((p) => p.mode === "closed")
    .forEach((p) => {
      p.completionThroughputRps = 12345;
    });
  const data = normalize(input);
  assert.equal(
    required(
      data.http.rows.cards.find((r) => r.id === input.http.engines[0].id),
    ).throughput,
    12345,
  );
});
test("renderer refreshes preserve native output and peer dates, and reject stale raw runs", async () => {
  const { input } = await loadInputs();
  const data = normalize(input);
  for (const workload of input.rendering.workloads) {
    const proa = required(
      data.rendering.rows[workload.id].find((r) => r.id === "proa"),
    );
    const peer = required(
      data.rendering.rows[workload.id].find((r) => r.id === "askama"),
    );
    assert.equal(proa.captureId, input.rendering.capture_id);
    assert.equal(proa.capturedAt, input.rendering.captured_at);
    assert.equal(
      peer.capturedAt,
      input.rendering.refresh?.baseline_captured_at ||
        input.rendering.captured_at,
    );
    assert.match(proa.outputBoundary, /RenderBuffer/);
    assert.equal(
      proa.p50,
      input.rendering.measurements.proa[workload.id].p50_us,
    );
  }
  for (const mutate of [
    (i: Inputs) => {
      const first = i.processSummaries[0];
      for (const run of i.processSummaries.filter(
        (r) =>
          r.framework_id === first.framework_id &&
          r.workload === first.workload,
      ))
        run.p50_us *= 2;
    },
    (i: Inputs) => {
      i.processSummaries[0].source_capture_id = "unrelated-capture";
    },
    (i: Inputs) => {
      const first = i.processSummaries[0];
      const other = required(
        i.processSummaries.find(
          (r) =>
            r.framework_id === first.framework_id &&
            r.workload === first.workload &&
            r.repeat !== first.repeat,
        ),
      );
      first.repeat = other.repeat;
    },
  ]) {
    const changed = structuredClone(input);
    mutate(changed);
    assert.throws(() => normalize(changed));
  }
});
test("Flow throughput and latency always come from the same recorded run", async () => {
  const { input } = await loadInputs();
  const data = normalize(input);
  for (const engine of input.http.engines)
    for (const workload of input.rendering.workloads) {
      const flow = required(
        required(data.http.rows[workload.id].find((r) => r.id === engine.id))
          .flow,
      );
      const phase = required(
        engine.workloads[workload.id].phases.find(
          (p) => p.mode === "closed" && p.repeat === flow.repeat,
        ),
      );
      assert.equal(flow.rps, phase.completionThroughputRps);
      assert.equal(flow.meanMs, phase.latencyMs.complete.mean);
    }
  for (const engine of input.streaming.engines)
    for (const rate of data.rates) {
      const row = required(
        data.streaming.rows[rate].find((r) => r.id === engine.id),
      );
      if (!row) {
        assert.ok(
          data.streaming.excluded.some((entry) => entry.id === engine.id),
        );
        continue;
      }
      const phase = required(
        engine.phases.find(
          (p) => p.offeredRps === rate && p.repeat === row.flow.repeat,
        ),
      );
      assert.equal(row.flow.rps, phase.completionThroughputRps);
      assert.equal(row.flow.meanMs, phase.latencyMs.scheduledComplete.mean);
      assert.equal(
        row.errors,
        engine.phases
          .filter((p) => p.offeredRps === rate)
          .reduce((total, p) => total + p.errorCount, 0),
      );
    }
});
test("streaming captures affected by the placeholder validator are withheld until rerun", async () => {
  const { input } = await loadInputs();
  Reflect.deleteProperty(input.streaming.methodology, "responseValidator");
  required(
    input.streaming.engines.find((engine) => engine.id === "marko"),
  ).phases[0].errorSamples = [
    "response contract failed: missing 1 fallbacks and 0 ready panels",
  ];
  const data = normalize(input);
  assert.ok(data.streaming.excluded.some((entry) => entry.id === "marko"));
  for (const rows of Object.values(data.streaming.rows))
    assert.ok(rows.every((row) => row.id !== "marko"));
  input.streaming.methodology.responseValidator = "resolved-content-v2";
  assert.equal(normalize(input).streaming.excluded.length, 0);
});
test("startup percentiles and original capture provenance are preserved", async () => {
  const { input } = await loadInputs();
  const data = normalize(input);
  for (const engine of input.startup.engines) {
    const row = required(data.startup.rows.find((r) => r.id === engine.id));
    assert.equal(
      row.p50,
      summarize(engine.starts.map((s) => s.firstResponseMs)).p50,
    );
    assert.equal(row.p99, engine.summary.firstResponseMs.p99);
  }
  assert.equal(data.http.capturedAt, input.http.capturedAt);
  assert.equal(
    (data.http.provenance as Inputs["http"]["source"]).dirty,
    input.http.source.dirty,
  );
  assert.equal(data.rendering.hash, input.rendering.provenance.source_sha256);
});
test("failed captures, broken parity and incomplete runs cannot become website data", async () => {
  const { input } = await loadInputs();
  for (const mutate of [
    (i: Inputs) => {
      i.http.status = "fail";
    },
    (i: Inputs) => {
      i.http.generatorLimitedPhases = [{ engine: "test" }];
    },
    (i: Inputs) => {
      i.http.engines[0].workloads.cards.parity.byteIdenticalToCanonicalDump = false;
    },
    (i: Inputs) => {
      i.streaming.engines[0].phases.pop();
    },
    (i: Inputs) => {
      i.startup.engines[0].starts.pop();
    },
    (i: Inputs) => {
      i.processSummaries.pop();
    },
  ]) {
    const changed = structuredClone(input);
    mutate(changed);
    assert.throws(() => normalize(changed));
  }
});

test("requested roster entries never acquire invented measurements", async () => {
  const { input } = await loadInputs();
  const data = normalize(input);
  for (const id of ["exact", "nextjs", "astro"]) {
    const renderer = required(data.renderers.find((r) => r.id === id));
    assert.equal(renderer.status, "unmeasured");
    assert.ok(renderer.coverageReason);
    for (const rows of Object.values(data.rendering.rows))
      assert.equal(
        rows.some((r) => r.id === id),
        false,
      );
  }
});

test("coverage links follow recorded suites without substituting renderer timings", async () => {
  const { input } = await loadInputs();
  const data = normalize(input);
  const model = createDashboardModel(data);
  for (const id of ["astro", "exact", "nextjs"])
    assert.deepEqual(model.measurementLinks(id), [
      { label: "Framework SSR", href: "?view=framework" },
    ]);
  assert.deepEqual(
    model.measurementLinks("sveltekit").map((link) => link.label),
    ["Framework SSR", "HTTP", "Cold Start"],
  );
  data.framework.rows = data.framework.rows.filter((r) => r.id !== "astro");
  assert.deepEqual(model.measurementLinks("astro"), []);
  for (const rows of Object.values(data.rendering.rows))
    assert.equal(
      rows.some((r) => r.id === "sveltekit"),
      false,
    );
});

test("full-framework measurements stay separate and reject invalid publication captures", async () => {
  const { input } = await loadInputs();
  const data = normalize(input);
  assert.deepEqual(
    new Set(data.framework.rows.map((r) => r.id)),
    new Set(["proa", "exact", "nextjs", "astro", "sveltekit"]),
  );
  for (const workload of input.framework.scenario.workloads || []) {
    const model = createDashboardModel(
      data,
      `?view=framework&workload=${workload.id}`,
    );
    assert.equal(model.state.workload, workload.id);
    assert.equal(model.getRows().length, 5);
    for (const engine of input.framework.engines) {
      const row = required(
        data.framework.workloads[workload.id].find((r) => r.id === engine.id),
      );
      assert.equal(
        row.throughput,
        summarize(
          engine.phases
            .filter((p) => p.mode === "closed" && p.workload === workload.id)
            .map((p) => p.completionThroughputRps),
        ).p50,
      );
      assert.equal(row.equalLoadRps, workload.fixedRateRps);
      assert.ok(
        row.detail.includes(
          String(
            required(engine.parityByWorkload?.[workload.id]).responseBytes,
          ),
        ),
      );
    }
  }
  for (const change of [
    (c: Inputs["framework"]) => {
      c.captureKind = "smoke";
    },
    (c: Inputs["framework"]) => {
      c.engines.pop();
    },
    (c: Inputs["framework"]) => {
      c.engines[0].phases[0].loadGeneratorValid = false;
    },
  ]) {
    const invalid = structuredClone(input);
    change(invalid.framework);
    assert.throws(() => normalize(invalid));
  }
});

test("new suite engines appear without duplicate ecosystem or invented render measurements", async () => {
  const { input } = await loadInputs();
  const data = normalize(input);
  assert.ok(data.http.rows.cards.some((r) => r.id === "sveltekit"));
  assert.equal(data.ecosystem.filter((r) => r.id === "sveltekit").length, 1);
  assert.ok(!data.rendering.rows.cards.some((r) => r.id === "sveltekit"));
});

test("shared URLs recover from invalid controls and preserve intentional empty filters", async () => {
  const data = normalize((await loadInputs()).input);
  const model = createDashboardModel(
    data,
    "?view=__proto__&chart=%3Cscript%3E&workload=missing&rate=Infinity&focus=unknown",
  );
  assert.equal(model.state.view, "rendering");
  assert.equal(model.state.chart, "compare");
  assert.equal(model.state.workload, "cards");
  assert.equal(model.state.focus, null);
  assert.ok(data.rates.includes(model.state.rate));
  assert.equal(model.visibleRows().length, data.rendering.rows.cards.length);
  for (const search of ["?selected=", "?types=unknown", "?selected=__proto__"])
    assert.deepEqual(createDashboardModel(data, search).visibleRows(), []);
  const legacy = createDashboardModel(
    data,
    "?view=framework&workload=catalog&chart=balls",
  );
  assert.equal(legacy.state.chart, "bars");
  assert.ok(legacy.visibleRows().length > 0);
});
