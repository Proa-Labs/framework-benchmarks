#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { summarize } from "./stats.mjs";

const option = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i < 0 ? fallback : process.argv[i + 1];
};
const input = resolve(option("--input", "suspense-load/results/preview-comparison.json"));
const output = resolve(option("--out", "suspense-load/results/preview-comparison.md"));
const result = JSON.parse(await readFile(input, "utf8"));
if (result.status !== "pass") throw new Error("Only completed comparisons can be reported");
const expected = 3 * 2 * result.config.rates.length * result.config.repeats;
if (result.http.length !== expected || result.http.some(p => !p.loadGeneratorValid) || result.browser.length !== 6) throw new Error("Comparison is incomplete or generator limited");
const median = values => summarize(values).p50;
const phases = (engine, variant, rate) => result.http.filter(p => p.engine === engine && p.variant === variant && p.offeredRps === rate);
const med = (engine, variant, rate, fn) => median(phases(engine, variant, rate).map(fn));
const fixed = (value, places=1) => value.toFixed(places);
const lines = [
  "# Suspense benchmark: original endpoint versus styled preview",
  "",
  `Captured ${result.capturedAt} to ${result.completedAt} on ${result.host.cpuModel}; ${result.host.logicalCpuCount} logical CPUs; Node ${result.host.node}.`,
  "",
  "This measures the actual styled preview, including its additional Node HTTP proxy, against a fresh run of the original endpoint. The published benchmark capture is not replaced. Both versions render eight delayed boundaries and 96 product cards. CSS artwork, type, spacing, and the document wrapper belong to the styled version.",
  "",
  `HTTP: ${result.config.repeats} repeats per engine/version/rate, fresh server processes each time, ${result.config.preRollSeconds} second pre-roll and ${result.config.durationSeconds} second observation window, ${result.config.warmupRequests} warmup requests, ${result.config.workers} independent generator workers. Original engine concurrency stays one worker thread or Node process; styled adds a separate Node proxy process. The resource figures for styled sum both processes and therefore are not a one-core renderer comparison. Every response is validated. Generator limits are P95 scheduling lag ≤25 ms and busiest-worker CPU utilization ≤80%.`,
  "",
  "Throughput counts successful full responses completed inside the observation window. Latency is measured from scheduled arrival and includes queueing. CPU/request follows the existing driver: total server CPU delta divided by all successful responses over the complete phase, including drain. RSS is the peak sum of simultaneous 100 ms samples, not a sum of each process's independent peak. The HTTP phase fetches only the HTML document; the browser comparison below includes the stylesheet request.",
  "",
  "## HTTP results",
  "",
  "Each cell is the median across repeats. Paired values are **original / styled**. Errors are observation-window request errors summed across repeats.",
  "",
];
for (const engine of ["proa", "marko", "react"]) {
  lines.push(`### ${engine[0].toUpperCase()+engine.slice(1)}`, "", "| Offered req/s | Completed req/s | P50 ms | P95 ms | P99 ms | CPU ms/response | Peak RSS MiB | Errors |", "| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |");
  for (const rate of result.config.rates) {
    const pair = (fn, places=1) => ["direct", "styled"].map(v => fixed(med(engine,v,rate,fn),places)).join(" / ");
    const errors = ["direct", "styled"].map(v => phases(engine,v,rate).reduce((sum,p)=>sum+p.errorCount,0)).join(" / ");
    lines.push(`| ${rate} | ${pair(p=>p.completionThroughputRps,0)} | ${pair(p=>p.latencyMs.scheduledComplete.p50)} | ${pair(p=>p.latencyMs.scheduledComplete.p95)} | ${pair(p=>p.latencyMs.scheduledComplete.p99)} | ${pair(p=>p.cpu.cpuMsPerSuccessfulRequest,3)} | ${pair(p=>p.memory.peakSampledRssBytes/1048576)} | ${errors} |`);
  }
  lines.push("");
}
lines.push("## Browser results", "", `Chromium; 1440×1120 desktop viewport; ${result.config.browserRuns} measured navigations per engine/version and one discarded warmup. Every navigation uses a fresh browser context with a cold cache, includes the stylesheet when styled, and checks all eight panels and 96 cards. These are idle-server browser loads, not browser loads during the HTTP stress sweep. No CPU/network throttling.`, "", "The all-panels metric waits for every ready panel and then two animation frames. It indicates a paint opportunity, not a verified compositor paint timestamp. Layout and script CPU come from Chromium's Performance domain. Medians are original / styled.", "", "| Engine | All panels + two frames ms | First byte ms | Layout CPU ms | Script CPU ms | Browser task CPU ms | Transferred KiB |", "| --- | ---: | ---: | ---: | ---: | ---: | ---: |");
for (const engine of ["proa", "marko", "react"]) {
  const pair = (key,scale=1) => ["direct","styled"].map(variant=>fixed(result.browser.find(x=>x.engine===engine&&x.variant===variant).summaries[key].p50/scale)).join(" / ");
  lines.push(`| ${engine} | ${pair("allPanelsPaintOpportunityMs")} | ${pair("firstByteMs")} | ${pair("layoutMs")} | ${pair("scriptMs")} | ${pair("taskMs")} | ${pair("transferredBytes",1024)} |`);
}
lines.push("", "## Provenance and limits", "", `Comparison source SHA-256: \`${result.source.sourceSha256}\`. Original benchmark source SHA-256: \`${result.originalSourceSha256}\`. Repository commit: \`${result.source.repositoryCommit}\`; local preview files were uncommitted during capture. Full phase records, component CPU deltas, process RSS breakdowns, browser samples, and generator diagnostics are in \`${input}\`.`, "", "This is a local engineering capture on a shared desktop. Medians over three short phases show practical differences; they do not establish statistical equivalence or universal capacity. The comparison includes the implementation choice of a proxy: it does not isolate the cost of CSS alone. HTTP payload and idle browser render costs are measured separately. Historical published numbers are not used as the comparison baseline.", "");
await writeFile(output, lines.join("\n"));
console.log(`Saved ${output}`);
