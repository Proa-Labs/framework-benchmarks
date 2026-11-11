import assert from "node:assert/strict";
import test from "node:test";
import { summarize } from "../../suspense-load/stats.mjs";
import { loadInputs, normalize } from "../data.mjs";

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
      const row = data.rendering.rows[workload.id].find(
        (r) => r.id === renderer.id,
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
    data.http.rows.cards.find((r) => r.id === input.http.engines[0].id)
      .throughput,
    12345,
  );
});
test("renderer refreshes preserve native output and peer dates, and reject stale raw runs", async () => {
  const { input } = await loadInputs();
  const data = normalize(input);
  for (const workload of input.rendering.workloads) {
    const proa = data.rendering.rows[workload.id].find((r) => r.id === "proa");
    const peer = data.rendering.rows[workload.id].find(
      (r) => r.id === "askama",
    );
    assert.equal(proa.captureId, input.rendering.capture_id);
    assert.equal(proa.capturedAt, input.rendering.captured_at);
    assert.equal(peer.capturedAt, input.rendering.refresh.baseline_captured_at);
    assert.match(proa.outputBoundary, /RenderBuffer/);
    assert.equal(
      proa.p50,
      input.rendering.measurements.proa[workload.id].p50_us,
    );
  }
  for (const mutate of [
    (i) => {
      const first = i.processSummaries[0];
      for (const run of i.processSummaries.filter(
        (r) =>
          r.framework_id === first.framework_id &&
          r.workload === first.workload,
      ))
        run.p50_us *= 2;
    },
    (i) => {
      i.processSummaries[0].source_capture_id = "unrelated-capture";
    },
    (i) => {
      const first = i.processSummaries[0];
      const other = i.processSummaries.find(
        (r) =>
          r.framework_id === first.framework_id &&
          r.workload === first.workload &&
          r.repeat !== first.repeat,
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
      const flow = data.http.rows[workload.id].find(
        (r) => r.id === engine.id,
      ).flow;
      const phase = engine.workloads[workload.id].phases.find(
        (p) => p.mode === "closed" && p.repeat === flow.repeat,
      );
      assert.equal(flow.rps, phase.completionThroughputRps);
      assert.equal(flow.meanMs, phase.latencyMs.complete.mean);
    }
  for (const engine of input.streaming.engines)
    for (const rate of data.rates) {
      const row = data.streaming.rows[rate].find((r) => r.id === engine.id);
      if (!row) {
        assert.ok(
          data.streaming.excluded.some((entry) => entry.id === engine.id),
        );
        continue;
      }
      const phase = engine.phases.find(
        (p) => p.offeredRps === rate && p.repeat === row.flow.repeat,
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
  input.streaming.methodology.responseValidator = undefined;
  input.streaming.engines.find(
    (engine) => engine.id === "marko",
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
    const row = data.startup.rows.find((r) => r.id === engine.id);
    assert.equal(
      row.p50,
      summarize(engine.starts.map((s) => s.firstResponseMs)).p50,
    );
    assert.equal(row.p99, engine.summary.firstResponseMs.p99);
  }
  assert.equal(data.http.capturedAt, input.http.capturedAt);
  assert.equal(data.http.provenance.dirty, input.http.source.dirty);
  assert.equal(data.rendering.hash, input.rendering.provenance.source_sha256);
});
test("failed captures, broken parity and incomplete runs cannot become website data", async () => {
  const { input } = await loadInputs();
  for (const mutate of [
    (i) => {
      i.http.status = "fail";
    },
    (i) => {
      i.http.generatorLimitedPhases = [{ engine: "test" }];
    },
    (i) => {
      i.http.engines[0].workloads.cards.parity.byteIdenticalToCanonicalDump = false;
    },
    (i) => {
      i.streaming.engines[0].phases.pop();
    },
    (i) => {
      i.startup.engines[0].starts.pop();
    },
    (i) => {
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
    const renderer = data.renderers.find((r) => r.id === id);
    assert.equal(renderer.status, "unmeasured");
    assert.ok(renderer.coverageReason);
    for (const rows of Object.values(data.rendering.rows))
      assert.equal(
        rows.some((r) => r.id === id),
        false,
      );
  }
});

test("full-framework measurements stay separate and reject invalid publication captures", async () => {
  const { input } = await loadInputs();
  const data = normalize(input);
  assert.deepEqual(
    new Set(data.framework.rows.map((r) => r.id)),
    new Set(["proa", "exact", "nextjs", "astro"]),
  );
  for (const engine of input.framework.engines) {
    const row = data.framework.rows.find((r) => r.id === engine.id);
    assert.equal(
      row.throughput,
      summarize(
        engine.phases
          .filter((p) => p.mode === "closed")
          .map((p) => p.completionThroughputRps),
      ).p50,
    );
  }
  for (const change of [
    (c) => {
      c.captureKind = "smoke";
    },
    (c) => {
      c.engines.pop();
    },
    (c) => {
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
