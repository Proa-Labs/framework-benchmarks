import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { isShowcase } from "../benchmarks/rendering/showcase/admission.mjs";
import {
  loadFixture,
  renderReference,
} from "../benchmarks/rendering/showcase/fixture.mjs";
import { readRaw } from "../tooling/capture/raw.mjs";
import showcaseAssets from "./data/performance/showcase/assets.json";
import rasterManifest from "./data/performance/thumbnails/manifest.json";
import { copyGenerated } from "./generated-files.ts";
import { required } from "./required.ts";
// Render the existing canonical adapter; preview styling stays outside timing.

import { mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";
import { type DefaultTreeAdapterMap, parse, serialize } from "parse5";
import type { ComponentType } from "react";
import type { Capture } from "../benchmarks/framework-ssr/report.ts";
import { writeGenerated as writeFile } from "./generated-files.ts";

const requireFixture = createRequire(
  new URL(
    "../benchmarks/rendering/external/react/package.json",
    import.meta.url,
  ),
);
const style = `
:root{font:14px/1.5 system-ui,sans-serif;color:#202630;background:#f7f9fc;color-scheme:light}*{box-sizing:border-box}body{margin:0;padding:28px}h1{font-size:26px;margin:0 0 12px}h2{font-size:20px}h3{font-size:15px}p{margin:8px 0}a{color:inherit;text-decoration:none}header,footer{padding:12px 0}.hero-section{border-bottom:1px solid #dce1e8}.subtitle,footer{color:#64748b}.card-grid,main>div[class*="grid"]{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}.card,main>div[class*="grid"]>a{border:1px solid #dce1e8;border-radius:8px;background:white;overflow:hidden}.card-body,main>div[class*="grid"]>a{padding:14px}.card-image{width:100%;height:92px;object-fit:cover;background:#e9eef5}.card-title{margin:0}.feature-list{padding-left:18px;font-size:12px}.btn-primary{border:0;background:#334155;color:white;padding:7px 10px;border-radius:4px}main>div[class*="grid"]>a>div:first-child{height:100px;display:grid;place-items:center;background:#edf1f7;border-radius:5px;color:#6c7d95;font-size:22px}main>div[class*="grid"]>a>div:nth-of-type(2){display:flex;gap:2px;align-items:center}svg{width:14px;height:14px;color:#ba934e;fill:currentColor}table{width:100%;border-collapse:collapse;white-space:nowrap;font-size:12px}th,td{text-align:left;padding:8px 12px;border-bottom:1px solid #dce1e8}th{background:#e9eef5}tr:nth-child(even){background:#f0f4f8}.overflow-x-auto{overflow:auto}[class*="font-mono"]{font-family:monospace}@media(max-width:650px){.card-grid,main>div[class*="grid"]{grid-template-columns:repeat(2,minmax(0,1fr))}body{padding:16px}}
`;
const chart = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100"><rect width="200" height="100" fill="#e9eef5"/><path d="M35 25h125M35 50h85M35 75h45" stroke="#7185a1" stroke-width="12"/></svg>`;
// Miniatures only show the top of a page. Avoid downloading a thousand rows
// for a 32px thumbnail; the full admitted fixture remains available on demand.
export function thumbnailHtml(html: string) {
  const document = parse(html);
  const counts: Record<string, number> = {};
  function trim(node: DefaultTreeAdapterMap["node"]) {
    if (!("childNodes" in node)) return;
    const grid =
      "attrs" in node &&
      node.attrs.some(
        ({ name, value }) => name === "class" && /grid/.test(value),
      );
    node.childNodes = node.childNodes.filter((child) => {
      if (!("tagName" in child)) return true;
      const card = child.attrs.some(
        ({ name, value }) =>
          name === "class" && value.split(/\s+/).includes("card"),
      );
      const limit =
        child.tagName === "tr"
          ? 10
          : card ||
              child.tagName === "article" ||
              (grid && child.tagName === "a")
            ? 8
            : Infinity;
      const key = card || child.tagName === "article" ? "card" : child.tagName;
      counts[key] = (counts[key] || 0) + 1;
      return counts[key] <= limit;
    });
    for (const child of node.childNodes) trim(child);
  }
  trim(document);
  return serialize(document);
}
// Bind raster illustrations to their source HTML, excluding request attributes
// and framework scripts that do not change the workload's appearance.
export function thumbnailSourceHash(html: string) {
  const doc = parse(thumbnailHtml(html));
  function strip(node: DefaultTreeAdapterMap["node"]) {
    if (!("childNodes" in node)) return;
    node.childNodes = node.childNodes.filter(
      (child) => !("tagName" in child) || child.tagName !== "script",
    );
    if ("attrs" in node)
      node.attrs = node.attrs.filter(
        (attr) => attr.name !== "data-bench-request",
      );
    for (const child of node.childNodes) strip(child);
  }
  strip(doc);
  return createHash("sha256").update(serialize(doc)).digest("hex");
}

export function showcasePreview(html: string) {
  const css = readFileSync(
    new URL("./data/performance/showcase/proa.css", import.meta.url),
    "utf8",
  );
  if (
    createHash("sha256").update(css).digest("hex") !==
    showcaseAssets.utilityStylesheet.sha256
  )
    throw new Error("Upstream showcase stylesheet snapshot changed");
  // Replace only a stylesheet the original page actually requests, in place:
  // its order relative to the page's own rules is part of the cascade.
  const document = parse(html);
  const asset = (value: string) => {
    if (!value.startsWith("/images/")) return value;
    // Nike's source filenames include literal percent signs. Preserve valid
    // escapes while encoding stray % characters that the asset server rejects.
    return `https://proa.so${value.replace(/%(?![\da-f]{2})/gi, "%25")}`;
  };
  const cssAssets = (value: string) =>
    value.replace(
      /url\((\s*["']?)(\/images\/[^)"']+)/g,
      (_, quote, path) => `url(${quote}${asset(path)}`,
    );
  function visit(node: DefaultTreeAdapterMap["node"]) {
    if (!("childNodes" in node)) return;
    if ("attrs" in node) {
      const attr = (name: string) => node.attrs.find((a) => a.name === name);
      if (
        node.tagName === "link" &&
        attr("rel")?.value === "stylesheet" &&
        attr("href")?.value === "/proa.css"
      ) {
        node.tagName = node.nodeName = "style";
        node.attrs = [{ name: "data-preview-utility", value: "" }];
        node.childNodes = [{ nodeName: "#text", value: css, parentNode: node }];
      }
      for (const a of node.attrs) {
        if (["src", "href", "poster"].includes(a.name))
          a.value = asset(a.value);
        if (a.name === "srcset")
          a.value = a.value.replace(
            /(^|,\s*)(\/images\/\S+)/g,
            (_, separator, path) => `${separator}${asset(path)}`,
          );
        if (a.name === "style") a.value = cssAssets(a.value);
      }
      if (node.tagName === "style")
        for (const child of node.childNodes)
          if ("value" in child) child.value = cssAssets(child.value);
    }
    for (const child of node.childNodes) visit(child);
  }
  visit(document);
  return serialize(document);
}

// These are inert workload illustrations, not running showcase applications.
// Annotate the emitted preview only; admission, timing and thumbnail bindings
// continue to use the unchanged measured document supplied to writePreview.
export function staticPreviewState(filename: string, html: string) {
  if (!/^(?:framework-)?sentry-otel\.html$/.test(filename)) return html;
  const document = parse(html);
  let rows = 0;
  const footers: DefaultTreeAdapterMap["element"][] = [];
  function visit(node: DefaultTreeAdapterMap["node"]) {
    if (!("childNodes" in node)) return;
    if ("tagName" in node) {
      const classes =
        node.attrs.find((a) => a.name === "class")?.value.split(/\s+/) ?? [];
      if (classes.includes("log-row")) rows++;
      if (classes.includes("loading-more")) footers.push(node);
      if (classes.includes("auto-refresh")) {
        node.attrs = node.attrs.filter(
          (a) => !["disabled", "aria-pressed", "title"].includes(a.name),
        );
        node.attrs.push(
          { name: "disabled", value: "" },
          { name: "aria-pressed", value: "false" },
          {
            name: "title",
            value:
              "Live updates are disabled in this static benchmark preview.",
          },
        );
      }
    }
    for (const child of node.childNodes) visit(child);
  }
  visit(document);
  for (const footer of footers) {
    footer.attrs.push({ name: "role", value: "note" });
    footer.childNodes = [
      {
        nodeName: "#text",
        value: `Static preview · all ${rows.toLocaleString("en-US")} log entries are shown.`,
        parentNode: footer,
      },
    ];
  }
  return serialize(document);
}
export async function buildPreviews(
  directory: string,
  frameworkCapture: Capture,
  workloads: { id: string }[],
  { raster = true } = {},
) {
  let React: typeof import("react"),
    renderToString: typeof import("react-dom/server").renderToString,
    ROOTS: Record<string, ComponentType>;
  try {
    React = requireFixture("react");
    ({ renderToString } = requireFixture("react-dom/server"));
    ({ ROOTS } = await import(
      "../benchmarks/rendering/external/react/suite_components.mjs"
    ));
  } catch (error) {
    throw new Error(
      "Install canonical preview dependencies with: bun install --frozen-lockfile (repository root)",
      { cause: error },
    );
  }
  await mkdir(join(directory, "previews"), { recursive: true });
  await mkdir(join(directory, "thumbnails"), { recursive: true });
  async function writePreview(filename: string, html: string) {
    await writeFile(
      join(directory, "previews", filename),
      staticPreviewState(filename, html),
    );
    if (raster) {
      const snapshots = rasterManifest.thumbnails as Record<
        string,
        { sourceSha256: string; file: string }
      >;
      const snapshot = snapshots[filename];
      if (!snapshot || snapshot.sourceSha256 !== thumbnailSourceHash(html))
        throw new Error(
          `Thumbnail source changed for ${filename}; run bun site/generate-thumbnails.ts`,
        );
      if (!/^[a-z0-9-]+\.webp$/.test(snapshot.file))
        throw new Error("Invalid thumbnail path");
      const source = new URL(
        `./data/performance/thumbnails/${snapshot.file}`,
        import.meta.url,
      );
      // A damaged/missing source asset must fail the build, not become a blank icon.
      const image = readFileSync(source);
      if (
        image.subarray(0, 4).toString() !== "RIFF" ||
        image.subarray(8, 12).toString() !== "WEBP"
      )
        throw new Error("Invalid WebP thumbnail");
      await copyGenerated(
        source.pathname,
        join(directory, "thumbnails", filename.replace(/\.html$/, ".webp")),
      );
    }
  }
  if (frameworkCapture) {
    const { validateSemanticHtml } = await import(
      "../benchmarks/framework-ssr/parity.mjs"
    );
    const proa = required(
      frameworkCapture.engines.find((e) => e.id === "proa"),
    );
    const definitions = frameworkCapture.scenario.workloads || [
      { id: "catalog" },
    ];
    for (const definition of definitions) {
      const id = definition.id;
      const filename =
        frameworkCapture.schemaVersion === 2
          ? `proa-${id}-parity.html`
          : "proa-parity.html";
      const rawPath = new URL(
        `../benchmarks/framework-ssr/results/raw/${frameworkCapture.captureId}/${filename}`,
        import.meta.url,
      );
      let body = readRaw(
        existsSync(rawPath) ? rawPath.pathname : `${rawPath.pathname}.gz`,
      ).toString("utf8");
      const parity = proa.parityByWorkload?.[id] || proa.parity;
      const expected = parity.semanticSha256;
      if (isShowcase(id)) {
        const { definition, data } = loadFixture(id);
        const { canonicalDigest } = await import(
          "../benchmarks/rendering/showcase/import.mjs"
        );
        data.texts[definition.controls.requestIndex] = "fresh-b";
        const reference = renderReference(definition, data);
        if (canonicalDigest(body) !== canonicalDigest(reference)) {
          // A corrected fixture must not inherit the old page's latency. The
          // dashboard detects this same mismatch and withholds stale rankings.
          if (
            createHash("sha256").update(body).digest("hex") !==
            ("responseSha256" in parity ? parity.responseSha256 : undefined)
          )
            throw new Error(`Framework ${id} retained preview was modified`);
          body = reference;
          validateSemanticHtml(body, "fresh-b", id);
        } else if (validateSemanticHtml(body, "fresh-b", id) !== expected)
          throw new Error(
            `Framework ${id} preview differs from admitted business content`,
          );
      }
      if (
        !isShowcase(id) &&
        validateSemanticHtml(body, "fresh-b", id) !== expected
      )
        throw new Error(
          `Framework ${id} preview differs from admitted business content`,
        );
      const frameworkStyle = `${style}main[data-bench-page=cards] section{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}main[data-bench-page=cards] section>h2{grid-column:1/-1}article{background:white;border:1px solid #dce1e8;border-radius:8px;padding:14px}main[data-bench-page=products],main[data-bench-page=catalog]{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}main[data-bench-page]>h1,main[data-bench-page]>[data-bench-request]{grid-column:1/-1}article h2,article h3{font-size:16px}[role=list]{font-size:12px;color:#64748b}@media(max-width:650px){main[data-bench-page=products],main[data-bench-page=catalog],main[data-bench-page=cards] section{grid-template-columns:repeat(2,minmax(0,1fr))}}`;
      await writePreview(
        `framework-${id}.html`,
        isShowcase(id)
          ? showcasePreview(body)
          : body.replace("<head>", `<head><style>${frameworkStyle}</style>`),
      );
      if (id === "catalog")
        await writePreview(
          "catalog.html",
          body.replace("<head>", `<head><style>${frameworkStyle}</style>`),
        );
    }
  }
  for (const { id } of workloads) {
    if (isShowcase(id)) {
      const { definition, data } = loadFixture(id);
      await writePreview(
        `${id}.html`,
        showcasePreview(renderReference(definition, data)),
      );
      continue;
    }
    if (!ROOTS[id])
      throw new Error(
        `Preview fixture missing for ${id}: add it to benchmarks/rendering/external/react/suite_components.mjs`,
      );
    const raw = renderToString(React.createElement(ROOTS[id]));
    // The original sample's header names an obsolete Rust-only roster. Give
    // the illustration neutral labels without changing any measured fixture.
    const labelled =
      id === "cards"
        ? raw.replace(
            /<header class="hero-section">[\s\S]*?<\/header>/,
            '<header class="hero-section"><h1 class="title">Component page preview</h1><p class="subtitle">Shared component-page workload</p></header>',
          )
        : raw;
    const body = labelled.replaceAll(
      "/images/benchmark.png",
      `data:image/svg+xml,${encodeURIComponent(chart)}`,
    );
    const html = /<head>/.test(body)
      ? body.replace("<head>", `<head><style>${style}</style>`)
      : `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${id} workload</title><style>${style}</style></head><body>${body}</body></html>`;
    await writePreview(`${id}.html`, html);
  }
}
