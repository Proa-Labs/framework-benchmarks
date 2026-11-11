import { validateResult } from "../framework-ssr/report.ts";
import { summarize } from "../suspense-load/stats.mjs";

const median = (values) => summarize(values).p50;
const percentiles = (phases, key) =>
  Object.fromEntries(
    ["p50", "p95", "p99"].map((p) => [
      p,
      median(phases.map((v) => v.latencyMs[key][p])),
    ]),
  );
export function frameworkRows(capture) {
  validateResult(capture);
  return capture.engines.map((engine) => {
    const closed = engine.phases.filter((p) => p.mode === "closed");
    const open = engine.phases.filter((p) => p.mode === "open");
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
      equalLoadRps: capture.methodology.fixedRateRps,
      errors: engine.phases.reduce((sum, p) => sum + p.errorCount, 0),
      detail: `${engine.framework}; ${engine.runtime}; ${engine.parity.responseBytes} response bytes. Production HTTP → complete SSR HTML; ${capture.methodology.concurrency} connections at capacity; equal load ${capture.methodology.fixedRateRps} requests/s.`,
    };
  });
}
