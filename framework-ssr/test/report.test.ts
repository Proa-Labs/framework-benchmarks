import { expect, test } from "bun:test";
import contract from "../contract.json";
import { type Capture, renderReport, validateResult } from "../report.ts";

function capture(smoke = false): Capture {
  const phase = {
    errorCount: 0,
    loadGeneratorValid: true,
    completionThroughputRps: 100,
    latencyMs: {
      complete: { p50: 1, p95: 1.5, p99: 2 },
      scheduledComplete: { p50: 1, p95: 1.5, p99: 2 },
    },
    cpu: { cpuMsPerSuccessfulRequest: 1 },
    memory: { peakSampledRssBytes: 1024 },
  };
  return {
    schemaVersion: 2,
    status: "pass",
    captureKind: smoke ? "smoke" : "publication",
    captureId: "test",
    capturedAt: "2026-11-09T00:00:00Z",
    scenario: contract,
    methodology: contract.publication,
    host: {},
    source: { sourceSha256: "a".repeat(64) },
    commands: { runtime: "Bun 1.4.2", build: "test", capture: "test" },
    limitations: [],
    engines: contract.engines.map((id) => ({
      id,
      framework: id,
      runtime: id === "proa" ? "Rust" : "Bun 1.4.2",
      parity: {
        pass: true,
        responseBytes: 100,
        semanticSha256: "a".repeat(64),
      },
      parityByWorkload: Object.fromEntries(
        contract.workloads.map((w) => [
          w.id,
          {
            pass: true,
            responseBytes: 100,
            semanticSha256: "a".repeat(64),
            negativeControls: 3,
          },
        ]),
      ),
      phases: contract.workloads.flatMap((workload) =>
        ["closed", "open"].flatMap((mode) =>
          [1, 2, 3].map((repeat) => ({
            ...phase,
            mode,
            repeat,
            workload: workload.id,
            offeredRps: mode === "open" ? workload.fixedRateRps : null,
            durationSeconds:
              mode === "closed" && !smoke
                ? workload.capacityDurationSeconds
                : contract.publication.durationSeconds,
          })),
        ),
      ),
    })),
  };
}
test("publication rejects incomplete rosters, duplicate repeats, failures and generator limits", () => {
  expect(() => validateResult(capture())).not.toThrow();
  const mutations: ((c: Capture) => void)[] = [
    (c) => {
      c.engines.pop();
    },
    (c) => {
      c.engines[0].phases.pop();
    },
    (c) => {
      c.engines[0].phases[0].repeat = 2;
    },
    (c) => {
      c.engines[0].phases[0].errorCount = 1;
    },
    (c) => {
      c.engines[0].phases[0].loadGeneratorValid = false;
    },
    (c) => {
      c.engines[0].phases[0].durationSeconds = 1;
    },
    (c) => {
      c.engines[1].runtime = "Node";
    },
    (c) => {
      c.captureKind = "smoke";
    },
    (c) => {
      c.engines[0].parity.pass = false;
    },
  ];
  for (const mutate of mutations) {
    const c = capture();
    mutate(c);
    expect(() => validateResult(c)).toThrow();
  }
  const missingParity = capture();
  delete missingParity.engines[0].parityByWorkload?.table;
  expect(() => validateResult(missingParity)).toThrow();
  const mixedWorkloads = capture();
  mixedWorkloads.engines[0].phases[0].workload = "table";
  expect(() => validateResult(mixedWorkloads)).toThrow();
  const differentOutput = capture();
  const parity = differentOutput.engines[1].parityByWorkload?.products;
  if (!parity) throw new Error("Fixture is missing product parity");
  parity.semanticSha256 = "b".repeat(64);
  expect(() => validateResult(differentOutput)).toThrow();
  const unequalLoad = capture();
  const open = unequalLoad.engines[0].phases.find((p) => p.mode === "open");
  if (!open) throw new Error("Fixture is missing the open phase");
  open.offeredRps = 999;
  expect(() => validateResult(unequalLoad)).toThrow();
});
test("a smoke result retaining a generator limit is never accepted as a publication capture", () => {
  const c = capture(true);
  c.engines[0].phases[0].loadGeneratorValid = false;
  expect(() => validateResult(c, false)).not.toThrow();
  expect(() => validateResult(c)).toThrow();
});

test("smoke reports disclose generator-limited phases", () => {
  const c = capture(true);
  c.engines[0].phases[0].loadGeneratorValid = false;
  expect(renderReport(c)).toContain("1 generator-limited phases retained");
  expect(renderReport(c)).not.toContain(
    "No errors or generator-limited phases.",
  );
});
