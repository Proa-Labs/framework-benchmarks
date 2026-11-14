#!/usr/bin/env node

// Engineering comparison of the original HTTP fixture and the styled preview.
// Never writes the published capture or alters the benchmark implementation.
import { execFile as execFileCallback } from "node:child_process";
import { readFile, writeFile, mkdir, rename } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import http from "node:http";
import { performance } from "node:perf_hooks";
import { chromium } from "playwright";
import {
  acquireRunLock, closeWorkers, delay, fetchBody, fetchJson, gitMetadata,
  hostMetadata, runOpenLoopPhase, spawnWorkers, startServer, stopServer,
  waitForHealth, waitForSocketDrain, sourceSha256,
} from "../../tooling/load/driver.mjs";
import { validateBody } from "./validate.mjs";
import { summarize } from "../../tooling/stats.mjs";

const execFile = promisify(execFileCallback);
const root = fileURLToPath(new URL("../../", import.meta.url));
const option = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i < 0 ? fallback : process.argv[i + 1];
};
const engines = ["proa", "marko", "react"];
const config = {
  rates: option("--rates", "250,500,1000,2000,3000,4000,5000,6000").split(",").map(Number),
  repeats: Number(option("--repeats", 3)),
  durationSeconds: Number(option("--duration", 5)),
  preRollSeconds: 1,
  workers: Number(option("--workers", 12)),
  browserRuns: Number(option("--browser-runs", 10)),
  warmupRequests: 24,
  output: resolve(root, option("--out", "benchmarks/streaming/results/preview-comparison.json")),
};
for (const value of [...config.rates, config.repeats, config.durationSeconds, config.workers, config.browserRuns]) {
  if (!Number.isInteger(value) || value < 1) throw new Error("All controls must be positive integers");
}
if (config.output === join(root, "benchmarks/streaming/results/latest.json")) throw new Error("Use a separate engineering output");
const reportSource = await readFile(join(root, "benchmarks/streaming/report.mjs"), "utf8");
const originalSources = JSON.parse(reportSource.match(/const benchmarkSourceFiles = (\[[\s\S]*?\]);/)[1].replace(/,\s*\]/, "]"));
const sources = [...originalSources, "benchmarks/streaming/preview.mjs", "benchmarks/streaming/preview.css", "benchmarks/streaming/compare-preview.mjs"];

function commandFor(engine) {
  if (engine === "proa") return { label: engine, command: join(root, "target/release/proa_suspense_server"), args: [], cwd: root };
  return { label: engine, command: process.execPath, args: [join(root, engine === "react" ? "benchmarks/streaming/react_server.mjs" : "benchmarks/rendering/external/marko/suspense_server.mjs")], cwd: root };
}

async function withEndpoint(engine, variant, task) {
  const port = 17710;
  const previewPort = 17720;
  const agent = new http.Agent({ keepAlive: true, maxSockets: 64, maxFreeSockets: 64 });
  const upstream = startServer(commandFor(engine), { PORT: String(port), PROA_WORKER_THREADS: "1", SUSPENSE_BOUNDARIES: "8", SUSPENSE_CARDS_PER_PANEL: "12" });
  let preview;
  try {
    const health = await waitForHealth(upstream, port, agent);
    if (health.engine !== engine || health.productCards !== 96 || health.boundaries !== 8 || (engine === "proa" && health.workerThreads !== 1) || (engine !== "proa" && health.nodeEnv !== "production") || (engine === "react" && health.reactDomBuild !== "production")) throw new Error("Fixture health contract mismatch");
    if (variant === "styled") {
      preview = startServer({ label: "preview", command: process.execPath, args: [join(root, "benchmarks/streaming/preview.mjs"), "--engine", engine, "--upstream", `http://127.0.0.1:${port}/`, "--port", String(previewPort)], cwd: root });
      await waitForHealth(preview, previewPort, agent);
    }
    return await task({ port: preview ? previewPort : port, upstream, server: preview || upstream, agent, health, pids: preview ? [upstream.child.pid, preview.child.pid] : [upstream.child.pid] });
  } finally {
    agent.destroy();
    if (preview) await stopServer(preview);
    await stopServer(upstream);
    await delay(500);
  }
}

async function sampleProcesses(pids) {
  const { stdout } = await execFile("ps", ["-o", "pid=,rss=", "-p", pids.join(",")]);
  const processes = stdout.trim().split("\n").map(line => {
    const [pid, rssKiB] = line.trim().split(/\s+/).map(Number);
    return { pid, rssBytes: rssKiB * 1024 };
  });
  if (processes.length !== pids.length) throw new Error("A measured process disappeared");
  return { at: performance.now(), rssBytes: processes.reduce((sum, p) => sum + p.rssBytes, 0), processes };
}

function aggregateSampler(pids) {
  const samples = [];
  let pending;
  let failure;
  const sample = () => {
    if (pending) return;
    pending = sampleProcesses(pids).then(value => samples.push(value)).catch(error => { failure = error; }).finally(() => { pending = null; });
  };
  sample();
  const timer = setInterval(sample, 100);
  return { async stop() { clearInterval(timer); await pending; if (failure) throw failure; return samples; } };
}

async function measureHttp(workers, engine, variant, rate, repeat) {
  return withEndpoint(engine, variant, async ({ port, upstream, server, agent, health, pids }) => {
    const response = await fetchBody(port, "/", agent);
    if (response.statusCode !== 200) throw new Error("Parity request failed");
    const parity = validateBody(response.body.toString("utf8"), 8, 12);
    await Promise.all(Array.from({ length: config.warmupRequests }, () => fetchBody(port, "/", agent)));
    await delay(250);
    const drain = await waitForSocketDrain();
    const baseline = await sampleProcesses(pids);
    const before = await fetchJson(port, "/metrics", agent);
    const sampler = aggregateSampler(pids);
    let phase;
    let samples;
    try {
      phase = await runOpenLoopPhase({ workers, server, port, path: "/", headers: { accept: "text/html", "accept-encoding": "identity" }, rate, preRollSeconds: config.preRollSeconds, durationSeconds: config.durationSeconds, validatorModule: join(root, "benchmarks/streaming/validate.mjs"), validatorOptions: { boundaries: 8, cardsPerPanel: 12 }, validateEvery: 1, metricsAgent: agent });
    } finally { samples = await sampler.stop(); }
    const after = await fetchJson(port, "/metrics", agent);
    const rss = samples.map(s => s.rssBytes);
    phase.memory = {
      scope: "sum of simultaneous upstream and preview RSS; direct has only upstream",
      baselineRssBytes: baseline.rssBytes,
      averageRssBytes: rss.reduce((sum, value) => sum + value, 0) / rss.length,
      peakSampledRssBytes: Math.max(...rss),
      peakRssGrowthBytes: Math.max(...rss) - baseline.rssBytes,
      sampleCount: samples.length,
      processCount: pids.length,
      perProcessPeakRssBytes: pids.map(pid => ({ role: pid === upstream.child.pid ? "upstream" : "preview", rssBytes: Math.max(...samples.map(s => s.processes.find(p => p.pid === pid).rssBytes)) })),
    };
    phase.cpu.scope = variant === "styled" ? "sum of upstream and preview process CPU" : "upstream process CPU";
    phase.cpu.componentCpuTimeMs = variant === "styled" ? { upstream: (after.upstreamCpuTimeMicros - before.upstreamCpuTimeMicros) / 1000, preview: (after.previewCpuTimeMicros - before.previewCpuTimeMicros) / 1000 } : { upstream: (after.cpuTimeMicros - before.cpuTimeMicros) / 1000 };
    phase.socketDrainBeforeAggregateSampler = drain;
    return { engine, variant, repeat, health, parity, responseBytes: response.body.length, ...phase };
  });
}

async function measureBrowser(browser, engine, variant) {
  return withEndpoint(engine, variant, async ({ port }) => {
    const samples = [];
    for (let run = 0; run < config.browserRuns + 1; run += 1) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 1120 }, deviceScaleFactor: 1 });
      try {
        const page = await context.newPage();
        const errors = [];
        page.on("pageerror", error => errors.push(error.message));
        const client = await context.newCDPSession(page);
        await client.send("Performance.enable");
        await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "load" });
        await page.waitForFunction(() => document.querySelectorAll("[data-panel-ready]").length === 8);
        const sample = await page.evaluate(async () => {
          await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
          const nav = performance.getEntriesByType("navigation")[0];
          const resources = performance.getEntriesByType("resource");
          return { allPanelsPaintOpportunityMs: performance.now(), firstByteMs: nav.responseStart, responseEndMs: nav.responseEnd, loadEventEndMs: nav.loadEventEnd, transferredBytes: nav.transferSize + resources.reduce((sum, item) => sum + item.transferSize, 0), cssResourceCount: resources.filter(item => item.initiatorType === "link").length, readyPanels: document.querySelectorAll("[data-panel-ready]").length, productCards: document.querySelectorAll('a[href^="/products/"]').length, pageHeight: document.documentElement.scrollHeight, pageWidth: document.documentElement.scrollWidth };
        });
        const metrics = Object.fromEntries((await client.send("Performance.getMetrics")).metrics.map(({ name, value }) => [name, value]));
        Object.assign(sample, { layoutMs: metrics.LayoutDuration * 1000, scriptMs: metrics.ScriptDuration * 1000, taskMs: metrics.TaskDuration * 1000, errors });
        if (sample.productCards !== 96 || errors.length || (variant === "styled" && sample.cssResourceCount !== 1)) throw new Error(`Browser validation failed: ${JSON.stringify(sample)}`);
        if (run > 0) samples.push(sample);
      } finally { await context.close(); }
    }
    return { engine, variant, samples, summaries: Object.fromEntries(["allPanelsPaintOpportunityMs", "firstByteMs", "responseEndMs", "loadEventEndMs", "transferredBytes", "layoutMs", "scriptMs", "taskMs"].map(key => [key, summarize(samples.map(sample => sample[key]))])) };
  });
}

const release = await acquireRunLock(root, "suspense-load");
let workers = [];
const result = { schemaVersion: 1, status: "incomplete", captureKind: "engineering", capturedAt: new Date().toISOString(), config, host: hostMetadata(), source: await gitMetadata(root, sources), originalSourceSha256: await sourceSha256(root, originalSources), methodology: { http: "Original load driver: fixed-rate HTTP/1.1 loopback, no compression, 1 s pre-roll, 5 s window by default, validation of every response, fresh server processes for every phase; alternating direct/styled order per repeat and rotating engine order", styled: "Actual preview.mjs proxy plus the unchanged upstream fixture; combined process CPU and RSS. HTTP phases request the document only (warm stylesheet assumption); browser phases include a cold stylesheet request.", browser: "Chromium, fresh browser context per navigation, 1440x1120, no throttling, one discarded warmup; all panels present followed by two animation frames is a paint opportunity, not an instrumented actual paint timestamp", generatorLimits: { p95LagMs: 25, busiestWorkerUtilization: .8 } }, http: [], browser: [] };
const partial = `${config.output}.partial`;
await mkdir(dirname(config.output), { recursive: true });
const checkpoint = () => writeFile(partial, `${JSON.stringify(result, null, 2)}\n`);
try {
  workers = await spawnWorkers(config.workers);
  for (const rate of config.rates) {
    for (let repeat = 1; repeat <= config.repeats; repeat += 1) {
      const rotated = engines.map((_, i) => engines[(i + repeat - 1) % engines.length]);
      const variants = repeat % 2 ? ["direct", "styled"] : ["styled", "direct"];
      for (const engine of rotated) for (const variant of variants) {
        const phase = await measureHttp(workers, engine, variant, rate, repeat);
        result.http.push(phase);
        await checkpoint();
        console.log(`${engine.padEnd(5)} ${variant.padEnd(6)} r${repeat} ${rate} offered → ${phase.completionThroughputRps.toFixed(0)} rps; P50/P95 ${phase.latencyMs.scheduledComplete.p50.toFixed(1)}/${phase.latencyMs.scheduledComplete.p95.toFixed(1)} ms; CPU ${phase.cpu.cpuMsPerSuccessfulRequest.toFixed(3)} ms/req; RSS ${(phase.memory.peakSampledRssBytes/1048576).toFixed(1)} MiB; ${phase.errorCount} errors; generator ${phase.loadGeneratorValid ? "valid" : "INVALID"}`);
        if (!phase.loadGeneratorValid) throw new Error("Generator validity limit exceeded; partial data retained, rerun with more workers");
      }
    }
  }
  await closeWorkers(workers);
  workers = [];
  const browser = await chromium.launch();
  try {
    for (const engine of engines) for (const variant of ["direct", "styled"]) {
      const measurement = await measureBrowser(browser, engine, variant);
      result.browser.push(measurement);
      await checkpoint();
      console.log(`Browser ${engine} ${variant}: ${measurement.summaries.allPanelsPaintOpportunityMs.p50.toFixed(1)} ms all-panels median; ${measurement.summaries.layoutMs.p50.toFixed(1)} ms layout`);
    }
  } finally { await browser.close(); }
  result.status = "pass";
  result.completedAt = new Date().toISOString();
  await checkpoint();
  await rename(partial, config.output);
  console.log(`Saved ${config.output}`);
} finally {
  await closeWorkers(workers);
  await release();
}
