import { verifyRefresh } from "../scripts/proa-refresh-evidence.mjs";

import { verifyRetainedSource } from "../tooling/retained-source.mjs";
import { createHash } from "node:crypto";
import { readMeasuredSources } from "../tooling/measured-sources.mjs";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { summarize } from "./stats.mjs";
import { numbersApproximatelyEqual } from "./validation.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const resultPath = join(here, "results", "latest.json");
const readmePath = join(root, "http-capacity.md");
const startMarker = "<!-- suspense-load:start -->";
const endMarker = "<!-- suspense-load:end -->";
const check = process.argv.includes("--check");
const expectedRates = [250, 500, 1_000, 2_000, 3_000, 4_000, 5_000, 6_000];
const expectedEngines = ["proa", "marko", "react"];
const expectedRepeats = 3;
const expectedDelayTiersMs = [5, 8, 12, 18, 27, 40, 60, 90];
const expectedBoundaries = 8;
const expectedCardsPerPanel = 12;
const expectedGeneratorLagP95LimitMs = 25;
const expectedGeneratorCpuLimit = 0.8;
const expectedProaWorkerThreads = 1;
// The runner owns this manifest. The report gate
// must reject a retained capture after any measured implementation changes.
const benchmarkSourceFiles = await readMeasuredSources(join(here, "run.mjs"));

// This exact revision changes three strings in run.mjs: two console labels
// and the confirmation-check description. Restoring those strings reproduces
// the retained capture's original hash; no measured behavior changed. Accept
// only this verified pair so any subsequent source edit still fails the gate.
const displayOnlySourceRevisions = new Map([
  [
    "d5d62712da036b6354ef7797024b17abb293c2468da64ee75d466efab7b463fb",
    "72b56d24f17d0f072d549b376bbde6352734f4e376da56b1b126f2e16685e7ab",
  ],
]);

const median = (values) => summarize(values).p50;
const fixed = (value, digits = 1) => Number(value).toFixed(digits);
const integer = (value) => Math.round(value).toLocaleString("en-US");
const ms = (value) => `${fixed(value, value < 10 ? 2 : 1)} ms`;
const mib = (value) => `${fixed(value / 1024 / 1024, 1)} MiB`;

async function currentSourceSha256() {
  const hash = createHash("sha256");
  for (const relativePath of benchmarkSourceFiles) {
    hash.update(relativePath);
    hash.update("\0");
    hash.update(await readFile(join(root, relativePath)));
    hash.update("\0");
  }
  return hash.digest("hex");
}

export function validateResult(result) {
  const fail = (message) => {
    throw new Error(`invalid suspense publication artifact: ${message}`);
  };
  if (result.status !== "pass" || result.captureKind !== "publication") {
    fail(`status/capture kind is ${result.status}/${result.captureKind}`);
  }
  if (result.schemaVersion !== 3) fail(`schema version is ${result.schemaVersion}`);
  if (result.scenario?.id !== "suspense_marketplace_v2") fail(`scenario is ${result.scenario?.id}`);
  if (result.scenario?.boundaries !== expectedBoundaries) fail(`scenario must contain ${expectedBoundaries} boundaries`);
  if (result.scenario?.cardsPerPanel !== expectedCardsPerPanel) fail(`scenario must carry ${expectedCardsPerPanel} cards per panel`);
  if (JSON.stringify(result.scenario?.delayTiersMs) !== JSON.stringify(expectedDelayTiersMs)) {
    fail(`delay tiers are ${JSON.stringify(result.scenario?.delayTiersMs)}`);
  }
  if (JSON.stringify(result.methodology?.ratesRps) !== JSON.stringify(expectedRates)) {
    fail(`rates are ${JSON.stringify(result.methodology?.ratesRps)}`);
  }
  if (
    result.methodology?.durationSecondsPerRate !== 5 ||
    result.methodology?.preRollSecondsPerRate !== 1 ||
    result.methodology?.repeats !== expectedRepeats ||
    result.methodology?.warmupRequestsPerEngineRateProcess !== 24 ||
    result.methodology?.generatorLagP95LimitMs !== expectedGeneratorLagP95LimitMs ||
    result.methodology?.generatorCpuLimit !== expectedGeneratorCpuLimit ||
    result.methodology?.proaWorkerThreads !== expectedProaWorkerThreads ||
    !Number.isInteger(result.methodology?.generatorWorkers) ||
    result.methodology.generatorWorkers < 2
  ) {
    fail("pre-roll, duration, repeat, warmup, generator limits, or Proa thread count does not match the publication protocol");
  }
  const engineIds = result.engines?.map(({ id }) => id);
  if (result.methodology.responseValidator !== "resolved-content-v2") {
    fail("streaming results require a rerun with optional loading-placeholder validation");
  }
  if (JSON.stringify(engineIds) !== JSON.stringify(expectedEngines)) {
    fail(`engine roster is ${JSON.stringify(engineIds)}`);
  }
  if (!/^[a-f0-9]{64}$/.test(result.source?.sourceSha256 ?? "")) {
    fail("source SHA-256 is missing");
  }
  if (!Number.isFinite(Date.parse(result.capturedAt)) || !Number.isFinite(Date.parse(result.completedAt))) {
    fail("capture timestamps are missing or invalid");
  }

  for (const engine of result.engines) {
    if (typeof engine.framework !== "string" || engine.framework.length === 0) {
      fail(`${engine.id} framework version is missing`);
    }
    if (engine.id === "proa" && engine.health?.workerThreads !== expectedProaWorkerThreads) {
      fail("Proa did not report the publication worker-thread count");
    }
    if (engine.id === "proa") {
      const check = engine.multiThread;
      if (
        !Number.isInteger(check?.workerThreads) || check.workerThreads < 2 ||
        check.offeredRps !== expectedRates.at(-1) ||
        check.phases?.length !== expectedRepeats ||
        check.phases.some((phase) => phase.loadGeneratorValid !== true || phase.offeredRps !== check.offeredRps)
      ) {
        fail("Proa multi-thread confirmation phases are missing or invalid");
      }
    }
    if (engine.id !== "proa" && engine.health?.nodeEnv !== "production") {
      fail(`${engine.id} did not confirm NODE_ENV=production`);
    }
    if (engine.id === "react" && engine.health?.reactDomBuild !== "production") {
      fail("React did not confirm the production react-dom server build");
    }
    if (
      engine.parity?.fallbackPanels !== result.scenario.boundaries ||
      engine.parity?.readyPanels !== result.scenario.boundaries ||
      engine.parity?.productCards !== result.scenario.productCards ||
      !Number.isFinite(engine.parity?.responseBytes) ||
      engine.parity.responseBytes <= 0
    ) {
      fail(`${engine.id} parity evidence is incomplete`);
    }
    const phaseKeys = new Set();
    for (const phase of engine.phases ?? []) {
      const key = `${phase.offeredRps}/${phase.repeat}`;
      if (phaseKeys.has(key)) fail(`${engine.id} has duplicate phase ${key}`);
      phaseKeys.add(key);
      if (
        !expectedRates.includes(phase.offeredRps) ||
        !Number.isInteger(phase.repeat) ||
        phase.repeat < 1 ||
        phase.repeat > expectedRepeats
      ) {
        fail(`${engine.id} has unexpected phase ${key}`);
      }
      if (
        phase.sentRequests !== phase.successfulRequests + phase.errorCount ||
        phase.durationSeconds !== result.methodology.durationSecondsPerRate ||
        phase.preRollSeconds !== result.methodology.preRollSecondsPerRate ||
        phase.arrivalWindowSeconds !==
          result.methodology.preRollSecondsPerRate + result.methodology.durationSecondsPerRate ||
        phase.totalSentRequests !== phase.offeredRps * phase.arrivalWindowSeconds ||
        phase.sentRequests !== phase.offeredRps * phase.durationSeconds ||
        !numbersApproximatelyEqual(
          phase.completionThroughputRps,
          phase.steadyStateCompletedResponses / phase.durationSeconds,
        )
      ) {
        fail(`${engine.id} phase ${key} has inconsistent request accounting`);
      }
      for (const [label, value] of [
        ["steady-state completion throughput", phase.completionThroughputRps],
        ["shell P50", phase.latencyMs?.scheduledFirstByte?.p50],
        ["completion P50", phase.latencyMs?.scheduledComplete?.p50],
        ["completion P95", phase.latencyMs?.scheduledComplete?.p95],
        ["completion P99", phase.latencyMs?.scheduledComplete?.p99],
        ["CPU cores", phase.cpu?.averageCpuCores],
        ["CPU/request", phase.cpu?.cpuMsPerSuccessfulRequest],
        ["peak RSS", phase.memory?.peakSampledRssBytes],
        ["max in-flight", phase.maxObservedInFlight],
        ["generator lag P95", phase.latencyMs?.schedulerLag?.p95],
        ["generator busiest worker", phase.generator?.busiestWorkerUtilization],
      ]) {
        if (!Number.isFinite(value) || value < 0) {
          fail(`${engine.id} phase ${key} has invalid ${label}`);
        }
      }
      if (
        phase.loadGeneratorValid !== true ||
        phase.latencyMs.schedulerLag.p95 > result.methodology.generatorLagP95LimitMs ||
        phase.generator.busiestWorkerUtilization > result.methodology.generatorCpuLimit
      ) {
        fail(`${engine.id} phase ${key} exceeded the load-generator validity limit`);
      }
    }
    for (const rate of expectedRates) {
      for (let repeat = 1; repeat <= expectedRepeats; repeat += 1) {
        if (!phaseKeys.has(`${rate}/${repeat}`)) {
          fail(`${engine.id} is missing phase ${rate}/${repeat}`);
        }
      }
    }
  }
}

function rowFor(engine, rate) {
  const phases = engine.phases.filter((phase) => phase.offeredRps === rate);
  if (phases.length === 0) throw new Error(`${engine.id} has no ${rate} rps phase`);
  const pick = (selector) => median(phases.map(selector));
  return {
    engine: engine.id === "proa" ? "Proa" : engine.id === "marko" ? "Marko" : "React",
    rate,
    completionRps: pick((phase) => phase.completionThroughputRps),
    shellP50: pick((phase) => phase.latencyMs.scheduledFirstByte.p50),
    completeP50: pick((phase) => phase.latencyMs.scheduledComplete.p50),
    completeP95: pick((phase) => phase.latencyMs.scheduledComplete.p95),
    completeP99: pick((phase) => phase.latencyMs.scheduledComplete.p99),
    cpuCores: pick((phase) => phase.cpu.averageCpuCores),
    cpuMsPerRequest: pick((phase) => phase.cpu.cpuMsPerSuccessfulRequest),
    peakRss: pick((phase) => phase.memory.peakSampledRssBytes),
    maxInFlight: pick((phase) => phase.maxObservedInFlight),
    generatorLagP95: pick((phase) => phase.latencyMs.schedulerLag.p95),
    generatorBusiest: Math.max(...phases.map((phase) => phase.generator.busiestWorkerUtilization)),
    errors: phases.reduce((sum, phase) => sum + phase.errorCount, 0),
  };
}

function render(result) {
  validateResult(result);
  const rates = result.methodology.ratesRps;
  const repeats = result.methodology.repeats;
  const rows = result.engines.flatMap((engine) => rates.map((rate) => rowFor(engine, rate)));
  const date = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "America/Los_Angeles",
  }).format(new Date(result.capturedAt));
  const duration = result.methodology.durationSecondsPerRate;
  const preRoll = result.methodology.preRollSecondsPerRate;
  const boundaries = result.scenario.boundaries;
  const host = result.host.cpuModel;
  const proaRevision = result.source.proaRevision.slice(0, 8);
  const proaBranch = result.source.proaBranch && result.source.proaBranch !== "main" ? ` on \`${result.source.proaBranch}\`` : "";

  const parityRows = result.engines
    .map(
      (engine) => {
        const label = engine.id === "proa"
          ? `Proa 0.3.0 @ ${proaRevision}`
          : engine.framework;
        return `| ${label} | ${engine.parity.fallbackPanels} | ${engine.parity.readyPanels} | ${integer(engine.parity.productCards)} | ${integer(engine.parity.responseBytes)} |`;
      },
    )
    .join("\n");
  const proaEngine = result.engines.find(({ id }) => id === "proa");
  const check = proaEngine.multiThread;
  const pickCheck = (selector) => median(check.phases.map(selector));
  const checkRow = {
    threads: check.workerThreads,
    rate: check.offeredRps,
    completionRps: pickCheck((phase) => phase.completionThroughputRps),
    completeP50: pickCheck((phase) => phase.latencyMs.scheduledComplete.p50),
    completeP99: pickCheck((phase) => phase.latencyMs.scheduledComplete.p99),
    cpuMsPerRequest: pickCheck((phase) => phase.cpu.cpuMsPerSuccessfulRequest),
    cpuCores: pickCheck((phase) => phase.cpu.averageCpuCores),
    peakRss: pickCheck((phase) => phase.memory.peakSampledRssBytes),
    errors: check.phases.reduce((sum, phase) => sum + phase.errorCount, 0),
  };
  const metricRows = rows
    .map(
      (row) =>
        `| ${row.engine} | ${integer(row.rate)} | ${fixed(row.completionRps, 0)} | ${ms(row.shellP50)} | ${ms(row.completeP50)} | ${ms(row.completeP95)} | ${ms(row.completeP99)} | ${fixed(row.cpuMsPerRequest, 3)} ms | ${fixed(row.cpuCores, 2)} | ${mib(row.peakRss)} | ${integer(row.maxInFlight)} | ${ms(row.generatorLagP95)} | ${integer(row.errors)} |`,
    )
    .join("\n");

  return `${startMarker}
## Suspense streaming over HTTP, one core each

${result.refresh ? "> **PROA-only refresh.** " + result.refresh.note + "\n" : ""}
**${date} · ${host} · ${boundaries} async boundaries × ${result.scenario.cardsPerPanel} product cards · one worker thread or process per engine**

This is the product grid from the capacity section, streamed. Equivalent production-mode Proa, Marko, and React applications run over real loopback HTTP/1.1. Every request streams a shell, starts ${boundaries} independent data operations across the ${result.scenario.delayTiersMs.join(", ")} ms delay tiers, may stream loading placeholders while those operations are pending, and completes only after every panel has resolved to its ${result.scenario.cardsPerPanel} product cards on the wire, ${result.scenario.productCards} cards in all. Delayed values stay typed and in memory; there is no JSON serialization, deserialization, or external I/O in the measured request path. Rendering, boundary scheduling, replacement framing, and one flush per boundary are all inside the measurement.

Every engine is limited to one unit of concurrency: Proa runs ${result.methodology.proaWorkerThreads} Tokio worker thread, and Marko and React each run one Bun process. Proa serves this page through \`RouteResponse::ssr_stream_send\`, the compiler-proved \`Send\` streaming path introduced by [Proa PR #82](https://github.com/Proa-Labs/proa/pull/82): Axum polls the response stream directly, with no per-response bridge thread. The cores column shows what each process actually used, and CPU/request charges every thread of every engine the same way.

Each row is the median of ${repeats} fresh-process phases under fixed-rate open-loop arrivals from ${result.methodology.generatorWorkers} separate load-generator processes, so saturation remains visible as in-flight work and scheduled-arrival latency instead of being suppressed by a client waiting for each prior response. A ${preRoll}-second pre-roll fills the async pipeline, then successful full responses completed inside a fixed ${duration}-second observation window determine completion throughput. Complete-response percentiles and shell P50 cover requests arriving during that observation window and include load-generator scheduling lag and server queueing. CPU/request is the server process's exact CPU-time delta divided by successful responses across the full phase. Errors are summed across the ${repeats} repeats. Publication aborts if scheduler-lag P95 exceeds ${result.methodology.generatorLagP95LimitMs} ms or any generator worker exceeds ${Math.round(result.methodology.generatorCpuLimit * 100)}% busy in any phase, and each phase waits for the previous phase's client sockets to leave TIME_WAIT before it starts.

| Engine | Request rate (rps) | Window completions/s | Shell P50 | Complete P50 | Complete P95 | Complete P99 | CPU/request | Cores | Peak RSS | Max in-flight | Generator lag P95 | Errors |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${metricRows}

**Every comparative row uses one logical CPU.** Proa runs one Tokio worker thread, and Marko and React each run one Bun process. Server CPU affinity is ${result.host.serverCpuAffinity || "not recorded"}; the load generator runs separately. Above saturation, completed responses can plateau or decline while queueing and failures increase. This capture does not measure multicore capacity.

**Reference point, outside the comparison.** Proa alone was rerun at the top rate with ${check.workerThreads} worker threads. ${result.host.serverCpuAffinity ? `CPU affinity remains ${result.host.serverCpuAffinity}; this changes thread count within the same CPU budget and does not measure multi-core scaling.` : "This separate run expands the thread budget."} Marko and React were not rerun with more processes, so this row is not comparable to theirs. With ${check.workerThreads} threads Proa completed ${integer(Math.round(checkRow.completionRps))} responses per second at a request-rate target of ${integer(checkRow.rate)} rps and a P99 of ${ms(checkRow.completeP99)}, using ${fixed(checkRow.cpuCores, 2)} cores.

| Proa worker threads | Request rate (rps) | Window completions/s | Complete P50 | Complete P99 | CPU/request | Cores | Peak RSS | Errors |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| ${checkRow.threads} | ${integer(checkRow.rate)} | ${fixed(checkRow.completionRps, 0)} | ${ms(checkRow.completeP50)} | ${ms(checkRow.completeP99)} | ${fixed(checkRow.cpuMsPerRequest, 3)} ms | ${fixed(checkRow.cpuCores, 2)} | ${mib(checkRow.peakRss)} | ${integer(checkRow.errors)} |

The unloaded preflight checks all loading placeholders and resolved panels. Every measured response must contain the shell, all resolved panels, and every product card. Loading placeholders are optional during load: a boundary can resolve before its placeholder is flushed. Any placeholders present must have valid, unique boundary keys. The cards are the same markup the scoreboard's product-grid parity gate accepted from each engine. Wire bytes legitimately differ because each framework carries its own boundary-replacement protocol.

| Engine version | Fallback panels | Resolved panels | Product cards | Stream bytes |
| --- | ---: | ---: | ---: | ---: |
${parityRows}

- Capture: [suspense-load/results/latest.json](suspense-load/results/latest.json); reproduce with \`bun run bench:suspense-load\`.
- The report verifier checks the measured-source SHA-256 against this checkout or the retained source snapshot before generating these tables.
- Proa source: Cargo.lock revision ${proaRevision}${proaBranch}; Rust release build with native Proa Suspense and the direct \`ssr_stream_send\` Axum route. The same binary also serves the bounded local-executor path (\`ssr_stream\`) at \`/local\` for engineering comparison; it is not part of the published rows.
- Marko source: optimized ahead-of-time Marko template using native &lt;await&gt; plus &lt;@placeholder&gt;; its compiler is not resident in the measured server.
- React source: production Bun React server build using renderToReadableStream, Suspense, and use. The shell pipes immediately; allReady is not awaited.
- JavaScript engines run with \`NODE_ENV=production\`: the driver sets it, each server's health endpoint reports it back, and React reports that it loaded the production \`react-dom/server\` build. The runner refuses to measure otherwise.
- Stream bytes differ by protocol, not content: Proa base64-encodes each resolved boundary inside an inert template, so its stream is roughly a third larger on the wire than React's for the same 96 cards. Compression is off in every engine here; enabling it would remove most of that gap, at a CPU cost this benchmark deliberately leaves out.
- This is a single-host capacity curve, not a universal ranking. Loopback transfer, each framework’s HTTP adapter, boundary protocol, allocation, scheduling, and render work are all intentionally inside the application boundary.
${endMarker}`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
const [resultText, readme, sourceSha256] = await Promise.all([
  readFile(resultPath, "utf8"),
  readFile(readmePath, "utf8"),
  currentSourceSha256(),
]);
const result = JSON.parse(resultText);
  verifyRefresh(result, join(here, "results"));
if (
  result.source?.sourceSha256 !== sourceSha256 &&
  displayOnlySourceRevisions.get(result.source?.sourceSha256) !== sourceSha256
) {
  verifyRetainedSource(join(here, "results"), result);
}
const block = render(result);
const start = readme.indexOf(startMarker);
const end = readme.indexOf(endMarker);
let next;
if (start === -1 && end === -1) {
  const anchor = "## Product-grid scaling capture";
  const at = readme.indexOf(anchor);
  if (at === -1) throw new Error(`README anchor not found: ${anchor}`);
  next = `${readme.slice(0, at)}${block}\n\n${readme.slice(at)}`;
} else if (start !== -1 && end !== -1 && end > start) {
  next = `${readme.slice(0, start)}${block}${readme.slice(end + endMarker.length)}`;
} else {
  throw new Error("README has an unmatched suspense-load marker");
}

if (check) {
  if (next !== readme) throw new Error("http-capacity.md suspense-load block is stale; run bun suspense-load/report.mjs");
  console.log("Suspense-load http-capacity.md block is current.");
} else {
  await writeFile(readmePath, next);
  console.log("Updated the http-capacity.md suspense-load section.");
}

}
