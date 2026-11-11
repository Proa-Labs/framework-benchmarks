import { verifyRefresh } from "../scripts/proa-refresh-evidence.mjs";
// Renders the cold-start capture into its README section.

import { verifyRetainedSource } from "../tooling/retained-source.mjs";
import { createHash } from "node:crypto";
import { readMeasuredSources } from "../tooling/measured-sources.mjs";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const resultPath = join(here, "results", "latest.json");
const readmePath = join(root, "http-capacity.md");
export const startMarker = "<!-- cold-start:start -->";
export const endMarker = "<!-- cold-start:end -->";
const check = process.argv.includes("--check");
const EXPECTED_ENGINES = ["proa", "react", "marko", "go-html-template", "sveltekit"];
const EXPECTED_STARTS = 15;
const EXPECTED_WARMUP_STARTS = 2;
// The runner owns the measured-source manifest.
export const benchmarkSourceFiles = await readMeasuredSources(join(here, "run.mjs"));

const fixed = (value, digits = 1) => Number(value).toFixed(digits);
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
  if (result.engines?.length === 4) verifyRetainedSource(join(here, "results"), result);
  const fail = (message) => {
    throw new Error(`invalid cold-start publication artifact: ${message}`);
  };
  if (result.status !== "pass" || result.captureKind !== "publication") fail(`status/capture kind is ${result.status}/${result.captureKind}`);
  if (result.schemaVersion !== 1) fail(`schema version is ${result.schemaVersion}`);
  if (result.scenario?.id !== "cold_start_products_v1") fail(`scenario is ${result.scenario?.id}`);
  if (result.methodology?.starts !== EXPECTED_STARTS || result.methodology?.warmupStarts !== EXPECTED_WARMUP_STARTS) {
    fail("start counts do not match the publication protocol");
  }
  if (JSON.stringify(result.engines?.map(({ id }) => id)) !== JSON.stringify(result.engines?.length === 4 ? EXPECTED_ENGINES.slice(0, 4) : EXPECTED_ENGINES)) fail("engine roster differs");
  if (!/^[a-f0-9]{64}$/.test(result.source?.sourceSha256 ?? "")) fail("source SHA-256 is missing");
  for (const engine of result.engines) {
    if (engine.starts?.length !== EXPECTED_STARTS) fail(`${engine.id} recorded ${engine.starts?.length} starts`);
    for (const start of engine.starts) {
      for (const [label, value] of [["first response", start.firstResponseMs], ["first byte", start.firstByteMs], ["RSS", start.rssAfterFirstResponseBytes]]) {
        if (!Number.isFinite(value) || value <= 0) fail(`${engine.id} has an invalid ${label}`);
      }
    }
    if (!Number.isFinite(engine.summary?.firstResponseMs?.p50)) fail(`${engine.id} summary is missing`);
  }
}

export function render(result) {
  validateResult(result);
  const date = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "America/Los_Angeles" }).format(new Date(result.capturedAt));
  const proaRevision = result.source.proaRevision.slice(0, 8);
  const proaBranch = result.source.proaBranch && result.source.proaBranch !== "main" ? ` (${result.source.proaBranch})` : "";
  const load = result.host?.loadAverage1m;
  const loadNote = Number.isFinite(load) ? `${load.toFixed(2)} on ${result.host.logicalCpuCount} logical CPUs` : "not recorded";
  const proa = result.engines.find(({ id }) => id === "proa");
  const react = result.engines.find(({ id }) => id === "react");
  const rows = result.engines
    .map((engine) => {
      const s = engine.summary;
      const label = engine.id === "proa" ? `Proa 0.3.0 @ ${proaRevision}${proaBranch}` : engine.label;
      return `| ${label} | ${ms(s.firstResponseMs.p50)} | ${ms(s.firstResponseMs.p95)} | ${ms(s.firstResponseMs.max)} | ${ms(s.firstByteMs.p50)} | ${mib(s.rssAfterFirstResponseBytes.p50)} |`;
    })
    .join("\n");
  return `${startMarker}
## Cold start to first response

${result.refresh ? "> **PROA-only refresh.** " + result.refresh.note + "\n" : ""}
**${date} · ${result.host.cpuModel} · ${result.methodology.starts} fresh processes per engine**

Every autoscaling event, cold serverless instance, per-tenant process, and developer restart pays this cost. Each row spawns the same production server used in the HTTP capacity section, polls its port every millisecond, and stops the clock when the first complete product-grid response ends; that response must be byte-identical to the engine's canonical dump. Proa's first response arrived in ${ms(proa.summary.firstResponseMs.p50)} at the median against ${ms(react.summary.firstResponseMs.p50)} for React, whose figure includes ${result.host.javascriptRuntime || (result.host.node ? `Node ${result.host.node}` : "JavaScript runtime")} start-up and loading React and the page module. Engines rotate every start, ${result.methodology.warmupStarts} untimed starts warm the disk cache, and the RSS column is sampled immediately after the first response.

| Engine | First response P50 | P95 | Max | First byte P50 | RSS after first response |
| --- | ---: | ---: | ---: | ---: | ---: |
${rows}

- Capture: [cold-start/results/latest.json](cold-start/results/latest.json); reproduce with \`bun run bench:cold-start\`.
- Servers, ports, and per-core limits are the same as the [HTTP capacity section](#canonical-pages-over-http-one-core-each). Wall time includes process creation, runtime start-up, module or binary loading, fixture construction, and the first render.
- Host one-minute load average when the capture started: ${loadNote}. Cold start is a few milliseconds of wall time, so it is the measurement most sensitive to other work on the machine; rerun it on an idle host before quoting absolute values.
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
  if (result.source?.sourceSha256 !== sourceSha256) {
    verifyRetainedSource(join(here, "results"), result);
  }
  const block = render(result);
  const start = readme.indexOf(startMarker);
  const end = readme.indexOf(endMarker);
  let next;
  if (start === -1 && end === -1) {
    const anchor = "<!-- suspense-load:start -->";
    const at = readme.indexOf(anchor);
    if (at === -1) throw new Error(`README anchor not found: ${anchor}`);
    next = `${readme.slice(0, at)}${block}\n\n${readme.slice(at)}`;
  } else if (start !== -1 && end !== -1 && end > start) {
    next = `${readme.slice(0, start)}${block}${readme.slice(end + endMarker.length)}`;
  } else {
    throw new Error("README has an unmatched cold-start marker");
  }
  if (check) {
    if (next !== readme) throw new Error("http-capacity.md cold-start block is stale; run bun cold-start/report.mjs");
    console.log("Cold-start http-capacity.md block is current.");
  } else {
    await writeFile(readmePath, next);
    console.log("Updated the http-capacity.md cold-start section.");
  }
}
