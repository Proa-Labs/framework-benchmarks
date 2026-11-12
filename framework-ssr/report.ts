import assert from "node:assert/strict";
import { summarize } from "../suspense-load/stats.mjs";
import contract from "./contract.json";
export interface Phase {
  repeat: number;
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
  scenario: { id: string };
  methodology: typeof contract.publication;
  host: Record<string, unknown>;
  source: { sourceSha256: string };
  engines: {
    id: string;
    framework: string;
    runtime: string;
    phases: Phase[];
    parity: { pass: boolean; responseBytes: number; semanticSha256: string };
  }[];
}
export const median = (values: number[]) => summarize(values).p50;
export function validateResult(result: Capture, publication = true) {
  assert.equal(result.schemaVersion, 1);
  assert.equal(result.status, "pass");
  assert.equal(result.scenario.id, contract.id);
  assert.deepEqual(
    [...result.engines.map((e) => e.id)].sort(),
    [...contract.engines].sort(),
  );
  assert.ok(Number.isFinite(Date.parse(result.capturedAt)));
  assert.match(result.source.sourceSha256, /^[a-f0-9]{64}$/);
  if (publication) {
    assert.equal(result.captureKind, "publication");
    assert.deepEqual(result.methodology, contract.publication);
  }
  for (const engine of result.engines) {
    assert.equal(engine.parity.pass, true);
    if (engine.id !== "proa") assert.equal(engine.runtime, contract.runtime);
    assert.equal(engine.phases.length, result.methodology.repeats * 2);
    for (const mode of ["closed", "open"]) {
      const phases = engine.phases.filter((p) => p.mode === mode);
      assert.deepEqual(
        phases.map((p) => p.repeat).sort(),
        Array.from({ length: result.methodology.repeats }, (_, i) => i + 1),
      );
      for (const phase of phases) {
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
  return result;
}
export function renderReport(result: Capture) {
  validateResult(result, result.captureKind === "publication");
  const rows = result.engines.map((engine) => {
    const closed = engine.phases.filter((p) => p.mode === "closed"),
      open = engine.phases.filter((p) => p.mode === "open");
    return `| ${engine.framework} | ${engine.runtime} | ${median(closed.map((p) => p.completionThroughputRps)).toFixed(1)} | ${median(open.map((p) => p.latencyMs.scheduledComplete.p50)).toFixed(3)} | ${median(open.map((p) => p.latencyMs.scheduledComplete.p99)).toFixed(3)} |`;
  });
  const limited = result.engines
    .flatMap((e) => e.phases)
    .filter((p) => !p.loadGeneratorValid).length;
  const validation = limited
    ? `No request errors; ${limited} generator-limited phases retained for functional diagnosis only.`
    : "No errors or generator-limited phases.";
  return `# Full-framework SSR\n\n${contract.boundary}\n\nCaptured: ${result.capturedAt}. ${result.captureKind}.\n\n| Framework | Runtime | Capacity (responses/s) | Equal-load P50 (ms) | Equal-load P99 (ms) |\n| --- | --- | ---: | ---: | ---: |\n${rows.join("\n")}\n\nEqual load: ${result.methodology.fixedRateRps} requests/s. ${result.methodology.repeats} independent server starts per phase kind. ${validation}\n\n${contract.limitations.join("\n\n")}\n`;
}
