import { createHash } from "node:crypto";
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { build as bundle } from "esbuild";
import suites from "../tooling/suites.json" with { type: "json" };
import { validateCapture } from "../tooling/validate.mjs";
import { verifySourceSnapshot } from "../tooling/verify-source.mjs";
import { loadInputs, normalize } from "./data.mjs";
import {
  featureRows,
  features,
  reviewedOn,
  supportStates,
  updatedOn,
} from "./features-data.mjs";
import { renderFeatures } from "./features-page.mjs";
import { buildPreviews } from "./previews.mjs";

export const siteRoot = dirname(fileURLToPath(import.meta.url));
export const outputDirectory = join(siteRoot, "dist");
const escapeHtml = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ],
  );
const themeControl = `<button type="button" data-component="theme-toggle" data-theme-toggle aria-label="Toggle theme" aria-pressed="false" class="theme-toggle-button"><svg class="theme-toggle-icon theme-toggle-moon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.99 12.79A9 9 0 1 1 11.21 3.01 7 7 0 0 0 20.99 12.79Z"></path></svg><svg class="theme-toggle-icon theme-toggle-sun" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path></svg></button>`;
export async function buildSite() {
  // Fail before writing assets if a selected publication loses its evidence.
  for (const id of Object.keys(suites))
    await validateCapture(id, undefined, dirname(siteRoot));
  // Inline the shared theme before any network dependency or rendering opportunity.
  await mkdir(outputDirectory, { recursive: true });
  await bundle({
    entryPoints: [join(siteRoot, "src/theme.mjs")],
    outfile: join(outputDirectory, "theme.js"),
    bundle: true,
    minify: true,
    format: "iife",
    target: ["es2022"],
  });
  const themeStyles = await readFile(join(siteRoot, "src/theme.css"), "utf8");
  const themeBootstrap = await readFile(
    join(outputDirectory, "theme.js"),
    "utf8",
  );
  const head = (
    title,
    description,
    path = "",
    pageScript = null,
  ) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="dark light"><style data-initial-theme>${themeStyles}</style><script data-theme-bootstrap>${themeBootstrap}</script><title>${escapeHtml(title)} · Frameworks</title><meta name="description" content="${escapeHtml(description)}"><meta property="og:title" content="${escapeHtml(title)} · Frameworks"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:type" content="website"><link rel="canonical" href="https://frameworks.run/${path.replace(/\.html$/, "")}"><link rel="icon" type="image/svg+xml" href="favicon.svg"><link rel="stylesheet" href="styles.css">${pageScript ? `<script type="module" blocking="render" src="${pageScript}"></script>` : ""}</head>`;
  const document = (title, content, path, header) =>
    `${head(title, "Open, reproducible research into framework and rendering performance.", path)}<body><div id="frameworks-explorer" class="fw-document-shell">${header}<section class="fw-intro" aria-labelledby="site-title"><h1 id="site-title">${escapeHtml(title)}</h1></section></div><main class="document">${content}<footer>Maintained by Andrew Hariri, founder of <a href="https://github.com/Proa-Labs">Proa Labs</a>. <a href="https://github.com/Proa-Labs/framework-benchmarks">Source on GitHub ↗</a></footer></main></body></html>`;

  const { input, buffers } = await loadInputs();
  const data = normalize(input);
  const dates = Object.keys(buffers)
    .map((id) => new Date(data[id].capturedAt))
    .sort((a, b) => a - b);
  const dateFormat = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
  const dateRange = dateFormat.formatRange(dates[0], dates.at(-1));
  const headerTemplate = await readFile(
    join(siteRoot, "src/header.html"),
    "utf8",
  );
  const headerFor = (active = null, interactive = false) => {
    const sections = [
      ["performance", "Performance"],
      ["features", "Features"],
      ["ecosystem", "Ecosystem"],
    ];
    const navigation = sections
      .map(([id, label]) =>
        id === "features"
          ? `<a href="/features"${active === "features" ? ' aria-current="page"' : ""}>${label}</a>`
          : interactive
            ? `<button type="button" class="cursor-interaction" data-section="${id}"${id === "performance" ? ' aria-current="page"' : ""}>${label}</button>`
            : `<a href="./?section=${id}">${label}</a>`,
      )
      .join("");
    return headerTemplate
      .replace(
        "{{section_navigation}}",
        `<nav class="fw-sections" aria-label="Research section">${navigation}</nav>`,
      )
      .replace("{{theme_control}}", themeControl)
      .replace(
        "{{about_current}}",
        active === "about" ? ' aria-current="page"' : "",
      );
  };
  let dashboard = await readFile(join(siteRoot, "src/dashboard.html"), "utf8");
  dashboard = dashboard.replace("{{site_header}}", headerFor(null, true));
  const encoded = JSON.stringify(data)
    .replaceAll("<", "\\u003c")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
  const index = `${head("Web framework benchmarks", "Explore reproducible rendering, HTTP, streaming and startup benchmarks, with versioned results and open methodology.")}<body><a class="skip-link" href="#results-heading">Skip to results</a>${dashboard}<script type="application/json" id="frameworks-explorer-data">${encoded}</script><script type="module" src="app.js"></script></body></html>`;
  await mkdir(join(outputDirectory, "data/captures"), { recursive: true });
  await cp(join(siteRoot, "public"), outputDirectory, { recursive: true });
  await writeFile(join(outputDirectory, "index.html"), index);
  const stylesheet = (
    await Promise.all(
      ["theme.css", "styles.css", "page.css", "features.css"].map((name) =>
        readFile(join(siteRoot, "src", name), "utf8"),
      ),
    )
  ).join("\n");
  await writeFile(join(outputDirectory, "styles.css"), stylesheet);
  await bundle({
    entryPoints: [join(siteRoot, "src/app.mjs")],
    outfile: join(outputDirectory, "app.js"),
    bundle: true,
    minify: true,
    format: "esm",
    target: ["es2022"],
    legalComments: "linked",
  });
  await Promise.all(
    Object.entries(buffers).map(([id, buffer]) =>
      writeFile(join(outputDirectory, "data/captures", `${id}.json`), buffer),
    ),
  );
  await writeFile(
    join(outputDirectory, "data/results.json"),
    `${JSON.stringify(data, null, 2)}\n`,
  );
  await writeFile(
    join(outputDirectory, "data/manifest.json"),
    `${JSON.stringify({ schemaVersion: 1, site: "https://frameworks.run", captures: Object.fromEntries(Object.keys(buffers).map((id) => [id, { source: data[id].source, capturedAt: data[id].capturedAt, sourceSha256: data[id].hash, artifactSha256: data[id].artifactSha256 }])) }, null, 2)}\n`,
  );
  if (input.framework) {
    verifySourceSnapshot(
      join(
        siteRoot,
        "../framework-ssr/results/raw",
        input.framework.captureId,
        "source.tar.gz",
      ),
      input.framework.source.sourceSha256,
    );
    await mkdir(join(outputDirectory, "data/sources"), { recursive: true });
    await cp(
      join(
        siteRoot,
        "../framework-ssr/results/raw",
        input.framework.captureId,
        "source.tar.gz",
      ),
      join(outputDirectory, "data/sources/framework.tar.gz"),
    );
  }
  await buildPreviews(
    outputDirectory,
    input.framework,
    input.workloadManifest.workloads,
  );
  const aboutContent = `
    <p>Choose a web stack using measurements you can check. We compare the time and resources needed to render the same pages, serve requests, stream responses and start a server.</p>
    <h2 id="classification">What counts as a web framework?</h2>
    <ul>
      <li><strong>Web framework:</strong> connects routing and request handling to response generation. Built-in features and official adapters count.</li>
      <li><strong>UI framework or library:</strong> builds components and interfaces; routing and server hosting can come from separate tools. Examples: React, Vue and Svelte.</li>
      <li><strong>Templating tool:</strong> turns templates and data into HTML. Includes template engines such as Askama and Go’s <code>html/template</code>, plus native PHP templates.</li>
    </ul>
    <p>We classify the tested version by its documented capabilities. Adding a benchmark server wrapper does not turn a template engine into a web framework.</p>
    <h2>How to use the results</h2>
    <p>Compare tools within the same experiment. Render-only timing excludes HTTP; Framework SSR includes routing and rendering. Every measured adapter must pass that workload’s output checks.</p>
    <p><a href="methodology.html">Methodology &amp; raw data ↗</a> · <a href="https://github.com/Proa-Labs/framework-benchmarks/issues/new">Challenge a result ↗</a></p>
    <p class="disclosure"><strong>Who runs this:</strong> Andrew Hariri maintains this site and founded <a href="https://github.com/Proa-Labs">Proa Labs</a>. <a href="https://github.com/Proa-Labs/proa">Proa</a> is included in the benchmarks.</p>`;
  const methodologyContent = `
    <p>The current site presents captures from <strong>${escapeHtml(dateRange)}</strong>. These results describe the recorded versions on the recorded host. They are historical evidence, not a claim about every framework's latest release.</p>
    <h2>SSR Rendering</h2><p>Prepared input to one complete, independently owned HTML response. Each adapter uses its declared native output type; Proa’s fresh RenderBuffer excludes flattening to a String. Output boundaries and per-row capture dates are retained in the data. Compilation and fixture construction happen before timing; routing, HTTP, databases and hydration are excluded. The canonical suite validates semantic DOM parity before measuring. Headline values are medians of five independently measured process P50s.</p>
    <h2>Framework SSR</h2><p>${escapeHtml(input.framework.scenario.boundary)} This is a separate shared catalog contract for application frameworks. Generated classes and framework shells may differ; the same ordered business content, escaping, list roles and request-specific value must pass admission. Full-document caching is disabled. Capacity uses ${input.framework.methodology.concurrency} connections; equal-load latency uses ${input.framework.methodology.fixedRateRps} scheduled requests/s, with ${input.framework.methodology.repeats} fresh server processes per phase kind. JavaScript frameworks run on ${escapeHtml(input.framework.scenario.runtime)}. Every response is validated, and incomplete or generator-limited runs are rejected. These numbers are not combined with pure render times.</p>
    <h2>HTTP</h2><p>The normal production servers handle the same parity-gated pages over loopback HTTP/1.1. Capacity uses 64 keep-alive connections; fixed-rate phases measure latency at equal offered load. CPU and memory are server-process measurements. The load generator validates responses and checks that it is not the bottleneck.</p>
    <h2>Streaming</h2><p>A 96-card grid arrives through eight async boundaries with 5–90 ms in-memory delays. Scheduled-arrival timings include queueing. Each load point has three measured phases. Wire sizes differ by replacement protocol. Failed requests remain recorded and do not become successful Flow particles.</p>
    <h2>Startup</h2><p>Process spawn to the first complete, validated product-grid response. Fifteen fresh starts follow two untimed disk-cache warmups. Host activity influences these results. The boxes here describe individual start times.</p>
    <h2>Read the chart correctly</h2><ul><li>Rendering boxes describe variation among process medians, not a distribution of every rendered response.</li><li>HTTP and streaming boxes summarize repeated phases. Hover cards identify whether latency is a phase percentile or a median of percentiles.</li><li>Line segments connect measured points; interpolation is not a new measurement.</li><li>Flow is an aggregate illustration. Travel time and particle arrival rate use paired measurements from one representative run. Pipe width does not encode bandwidth.</li><li>Some sources include uncommitted changes. The original provenance and source hashes are preserved in the downloadable captures.</li></ul>
    <h2>Read and reproduce the evidence</h2><ul>${Object.keys(buffers)
      .map(
        (id) =>
          `<li><a href="${data[id].download}">${escapeHtml(id)}: original capture</a> · ${escapeHtml(data[id].date)} · <code>${escapeHtml(data[id].capture)}</code></li>`,
      )
      .join("")}</ul>
    <p><a href="https://github.com/Proa-Labs/framework-benchmarks/blob/main/rendering/protocol.md">Canonical protocol ↗</a> · <a href="https://github.com/Proa-Labs/framework-benchmarks/blob/main/README.md">Reproduction commands ↗</a> · <a href="data/manifest.json">Artifact hashes</a></p>
    <h2>No single overall winner</h2><p>These experiments measure different work. They do not jointly measure feature completeness, database workloads, developer experience, application complexity, native UI performance or every deployment environment.</p>`;
  const inclusionContent = `<h2 id="inclusion">Inclusion criteria</h2><p>Frameworks, UI libraries and templating tools are classified by their scope. Inclusion requires public source, documented setup and a reproducible example; popularity is not an entry requirement.</p><p>Every measured adapter must use the same workload, pass output parity checks, declare production settings and versions, and retain its runs. Missing capabilities remain unmeasured. Exceptions and author affiliations are disclosed.</p>`;
  await writeFile(
    join(outputDirectory, "about.html"),
    document(
      "Why frameworks.run exists",
      aboutContent,
      "about.html",
      headerFor("about"),
    ),
  );
  await writeFile(
    join(outputDirectory, "methodology.html"),
    document(
      "Methodology",
      `${methodologyContent}${inclusionContent}`,
      "methodology.html",
      headerFor(),
    ),
  );
  await writeFile(
    join(outputDirectory, "404.html"),
    document(
      "That page isn't in this capture.",
      '<p><a href="./">Return to the explorer</a> or inspect the <a href="data/results.json">complete dataset</a>.</p>',
      "404.html",
      headerFor(),
    ),
  );
  await bundle({
    entryPoints: [join(siteRoot, "src/features.mjs")],
    outfile: join(outputDirectory, "features.js"),
    bundle: true,
    minify: true,
    format: "esm",
    target: ["es2022"],
  });
  const capabilityData = {
    reviewedOn,
    updatedOn,
    features,
    supportStates,
    rows: featureRows(data.ecosystem),
  };
  const encodedFeatures = JSON.stringify(capabilityData)
    .replaceAll("<", "\\u003c")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
  await writeFile(
    join(outputDirectory, "data/features.json"),
    `${JSON.stringify(capabilityData, null, 2)}\n`,
  );
  await writeFile(
    join(outputDirectory, "features.html"),
    `${head("Features", "Compare documented framework capabilities: SSR, streaming, Suspense, client activation, routing, static generation, server functions, and i18n.", "features", "features.js")}<body><a class="skip-link" href="#feature-comparison">Skip to feature comparison</a><div id="frameworks-explorer" class="fw-features-shell">${headerFor("features")}<section class="fw-intro" aria-labelledby="site-title"><h1 id="site-title">Features</h1></section>${renderFeatures(data.ecosystem)}<footer class="fw-site-footer"><span>Frameworks / 2026</span><div><a href="about.html">Ownership &amp; disclosure</a><a href="https://github.com/Proa-Labs/framework-benchmarks/issues/new" target="_blank" rel="noreferrer">Suggest a correction ↗</a></div></footer></div><script type="application/json" id="framework-features-data">${encodedFeatures}</script></body></html>`,
  );
  const assetVersions = await Promise.all(
    ["app.js", "theme.js", "features.js", "styles.css"].map(async (asset) => [
      asset,
      createHash("sha256")
        .update(await readFile(join(outputDirectory, asset)))
        .digest("hex")
        .slice(0, 12),
    ]),
  );
  for (const page of [
    "index.html",
    "about.html",
    "methodology.html",
    "features.html",
    "404.html",
  ]) {
    const path = join(outputDirectory, page);
    let html = await readFile(path, "utf8");
    for (const [asset, version] of assetVersions)
      html = html.replaceAll(`"${asset}"`, `"${asset}?v=${version}"`);
    await writeFile(path, html);
  }
  console.log(
    `Built frameworks.run: ${data.renderers.length} renderers, ${Object.keys(buffers).length} capture sources → ${outputDirectory}`,
  );
  return { data, outputDirectory };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1])
  await buildSite();
