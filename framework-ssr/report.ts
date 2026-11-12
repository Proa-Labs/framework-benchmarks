import assert from "node:assert/strict";
import { summarize } from "../suspense-load/stats.mjs";
import contract from "./contract.json";
import legacyContract from "./contract-v1.json";
export interface Phase {
  repeat: number;
  workload?: string;
  offeredRps?: number | null;
  durationSeconds: number;
  mode: string;
  errorCount: number;
  loadGeneratorValid: boolean;
  completionThroughputRps: number;
  latencyMs: {
    complete: { p50: number; p95: number; p99: number };
    scheduledComplete: { p50: number; p95: number; p99: number };
  };
  cpu: { cpuMsPerSuccessfulRequest: number };
  memory: { peakSampledRssBytes: number };
}
export interface Capture {
  captureId: string;
  commands: { runtime: string; build: string; capture: string };
  limitations: string[];
  schemaVersion: number;
  status: string;
  captureKind: string;
  capturedAt: string;
  scenario: {
    id: string;
    boundary?: string;
    workloads?: {
      id: string;
      label: string;
      fixedRateRps: number;
      capacityDurationSeconds?: number;
    }[];
  };
  methodology: typeof contract.publication | typeof legacyContract.publication;
  host: Record<string, unknown>;
  source: { sourceSha256: string };
  engines: {
    id: string;
    framework: string;
    runtime: string;
    phases: Phase[];
    parity: { pass: boolean; responseBytes: number; semanticSha256: string };
    parityByWorkload?: Record<
      string,
      {
        pass: boolean;
        responseBytes: number;
        semanticSha256: string;
        negativeControls: number;
      }
    >;
  }[];
}
export const median = (values: number[]) => summarize(values).p50;
export function workloadDefinitions(result: Capture) {
  const definitions = result.scenario.workloads || [
    {
      id: "catalog",
      label: "32-card catalog",
      fixedRateRps:
        "fixedRateRps" in result.methodology
          ? result.methodology.fixedRateRps
          : legacyContract.publication.fixedRateRps,
    },
  ];
  return definitions.map((w) => ({
    ...w,
    capacityDurationSeconds:
      result.captureKind === "smoke"
        ? result.methodology.durationSeconds
        : w.capacityDurationSeconds || result.methodology.durationSeconds,
    latencyDurationSeconds: result.methodology.durationSeconds,
  }));
}
export function validateResult(result: Capture, publication = true) {
  assert.ok([1, 2].includes(result.schemaVersion));
  const expected = result.schemaVersion === 1 ? legacyContract : contract;
  assert.equal(result.status, "pass");
  assert.equal(result.scenario.id, expected.id);
  if (result.schemaVersion === 2)
    assert.deepEqual(result.scenario.workloads, contract.workloads);
  assert.deepEqual(
    [...result.engines.map((e) => e.id)].sort(),
    [...expected.engines].sort(),
  );
  assert.ok(Number.isFinite(Date.parse(result.capturedAt)));
  assert.match(result.source.sourceSha256, /^[a-f0-9]{64}$/);
  if (publication) {
    assert.equal(result.captureKind, "publication");
    assert.deepEqual(result.methodology, expected.publication);
  }
  for (const engine of result.engines) {
    assert.equal(engine.parity.pass, true);
    if (engine.id !== "proa") assert.equal(engine.runtime, contract.runtime);
    const workloads = workloadDefinitions(result);
    assert.equal(
      engine.phases.length,
      result.methodology.repeats * 2 * workloads.length,
    );
    for (const workload of workloads) {
      if (result.schemaVersion === 2) {
        const parity = engine.parityByWorkload?.[workload.id];
        assert.ok(parity, `${engine.id}/${workload.id} missing parity`);
        assert.equal(parity.pass, true);
        assert.ok(parity.responseBytes > 0);
        assert.match(parity.semanticSha256, /^[a-f0-9]{64}$/);
        assert.equal(
          parity.semanticSha256,
          result.engines[0].parityByWorkload?.[workload.id]?.semanticSha256,
          `${engine.id}/${workload.id} business output differs`,
        );
        assert.ok(parity.negativeControls >= 3);
      }
      for (const mode of ["closed", "open"]) {
        const phases = engine.phases.filter(
          (p) =>
            p.mode === mode &&
            (result.schemaVersion === 1 || p.workload === workload.id),
        );
        assert.deepEqual(
          phases.map((p) => p.repeat).sort(),
          Array.from({ length: result.methodology.repeats }, (_, i) => i + 1),
        );
        for (const phase of phases) {
          assert.equal(
            phase.durationSeconds,
            publication && result.schemaVersion === 2 && mode === "closed"
              ? contract.workloads.find((w) => w.id === workload.id)
                  ?.capacityDurationSeconds
              : result.methodology.durationSeconds,
            `${engine.id}/${workload.id} wrong observation window`,
          );
          if (result.schemaVersion === 2 && mode === "open")
            assert.equal(
              phase.offeredRps,
              workload.fixedRateRps,
              `${engine.id}/${workload.id} unequal offered load`,
            );
          assert.equal(phase.errorCount, 0, `${engine.id} failed requests`);
          if (publication)
            assert.equal(
              phase.loadGeneratorValid,
              true,
              `${engine.id} generator limited`,
            );
          assert.ok(phase.completionThroughputRps > 0);
          assert.ok(phase.latencyMs.scheduledComplete.p99 > 0);
        }
      }
    }
  }
  return result;
}
export function renderReport(result: Capture) {
  validateResult(result, result.captureKind === "publication");
  const workloads = workloadDefinitions(result);
  const rows = workloads.flatMap((workload) =>
    result.engines.map((engine) => {
      const phases = engine.phases.filter(
          (p) => !p.workload || p.workload === workload.id,
        ),
        closed = phases.filter((p) => p.mode === "closed"),
        open = phases.filter((p) => p.mode === "open");
      return `| ${workload.label} | ${engine.framework} | ${engine.runtime} | ${median(closed.map((p) => p.completionThroughputRps)).toFixed(1)} | ${median(open.map((p) => p.latencyMs.scheduledComplete.p50)).toFixed(3)} | ${median(open.map((p) => p.latencyMs.scheduledComplete.p99)).toFixed(3)} |`;
    }),
  );
  const limited = result.engines
    .flatMap((e) => e.phases)
    .filter((p) => !p.loadGeneratorValid).length;
  const validation = limited
    ? `No request errors; ${limited} generator-limited phases retained for functional diagnosis only.`
    : "No errors or generator-limited phases.";
  return `# Full-framework SSR\n\n${result.scenario.boundary || legacyContract.boundary}\n\nCaptured: ${result.capturedAt}. ${result.captureKind}.\n\n| Workload | Framework | Runtime | Capacity (responses/s) | Equal-load P50 (ms) | Equal-load P99 (ms) |\n| --- | --- | --- | ---: | ---: | ---: |\n${rows.join("\n")}\n\nEqual load by workload: ${workloads.map((w) => `${w.label}: ${w.fixedRateRps} requests/s`).join("; ")}. ${result.methodology.repeats} independent server starts per phase kind. ${validation}\n\n${result.limitations.join("\n\n")}\n`;
}
