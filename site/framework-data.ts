import type { Capture, Phase } from "../benchmarks/framework-ssr/report.ts";
import {
  validateResult,
  workloadDefinitions,
} from "../benchmarks/framework-ssr/report.ts";
import { summarize } from "../tooling/stats.mjs";
import type { Percentiles } from "./benchmark-types.ts";

const median = (values: number[]) => summarize(values).p50;
const percentiles = (phases: Phase[], key: "complete" | "scheduledComplete") =>
  Object.fromEntries(
    (["p50", "p95", "p99"] as const).map((p) => [
      p,
      median(phases.map((v) => v.latencyMs[key][p])),
    ]),
  ) as Percentiles;
export function frameworkRows(
  capture: Capture,
  workload = capture.scenario.workloads?.[0].id || "catalog",
) {
  validateResult(capture);
  return capture.engines.map((engine) => {
    const phases = engine.phases.filter(
      (p) => !p.workload || p.workload === workload,
    );
    const closed = phases.filter((p) => p.mode === "closed");
    const open = phases.filter((p) => p.mode === "open");
    const rate = workloadDefinitions(capture).find(
      (w) => w.id === workload,
    )?.fixedRateRps;
    if (!rate) throw new Error(`Missing Framework SSR workload: ${workload}`);
    const parity = engine.parityByWorkload?.[workload] || engine.parity;
    const seriesSamples = {
      throughput: closed.map((p) => p.completionThroughputRps),
      cpu: closed.map((p) => p.cpu.cpuMsPerSuccessfulRequest),
      rss: closed.map((p) => p.memory.peakSampledRssBytes / 1048576),
      p50: open.map((p) => p.latencyMs.scheduledComplete.p50),
      p99: open.map((p) => p.latencyMs.scheduledComplete.p99),
    };
    return {
      id: engine.id,
      ...Object.fromEntries(
        Object.entries(seriesSamples).map(([k, v]) => [k, median(v)]),
      ),
      seriesSamples,
      percentiles: {
        capacity: percentiles(closed, "complete"),
        equalLoad: percentiles(open, "scheduledComplete"),
      },
      runPercentiles: {
        capacity: closed.map((p) => p.latencyMs.complete),
        equalLoad: open.map((p) => p.latencyMs.scheduledComplete),
      },
      equalLoadRps: rate,
      errors: phases.reduce((sum, p) => sum + p.errorCount, 0),
      detail: `${engine.framework}; ${engine.runtime}; ${parity.responseBytes} response bytes. Production HTTP → complete SSR HTML; ${capture.methodology.concurrency} connections at capacity; equal load ${rate} requests/s.`,
    };
  });
}
