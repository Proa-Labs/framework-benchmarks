import { required } from "./required.ts";
// Render the existing canonical adapter; preview styling stays outside timing.

import { mkdir, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";
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
export async function buildPreviews(
  directory: string,
  frameworkCapture: Capture,
  workloads: { id: string }[],
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
      const body = await readFile(
        new URL(
          `../benchmarks/framework-ssr/results/raw/${frameworkCapture.captureId}/${filename}`,
          import.meta.url,
        ),
        "utf8",
      );
      const expected = (proa.parityByWorkload?.[id] || proa.parity)
        .semanticSha256;
      if (
        validateSemanticHtml(
          body,
          "fresh-b",
          id as "cards" | "products" | "table" | "catalog",
        ) !== expected
      )
        throw new Error(
          `Framework ${id} preview differs from admitted business content`,
        );
      const frameworkStyle = `${style}main[data-bench-page=cards] section{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}main[data-bench-page=cards] section>h2{grid-column:1/-1}article{background:white;border:1px solid #dce1e8;border-radius:8px;padding:14px}main[data-bench-page=products],main[data-bench-page=catalog]{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}main[data-bench-page]>h1,main[data-bench-page]>[data-bench-request]{grid-column:1/-1}article h2,article h3{font-size:16px}[role=list]{font-size:12px;color:#64748b}@media(max-width:650px){main[data-bench-page=products],main[data-bench-page=catalog],main[data-bench-page=cards] section{grid-template-columns:repeat(2,minmax(0,1fr))}}`;
      await writeFile(
        join(directory, `previews/framework-${id}.html`),
        body.replace("<head>", `<head><style>${frameworkStyle}</style>`),
      );
      if (id === "catalog")
        await writeFile(
          join(directory, "previews/catalog.html"),
          body.replace("<head>", `<head><style>${frameworkStyle}</style>`),
        );
    }
  }
  for (const { id } of workloads) {
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
    await writeFile(join(directory, "previews", `${id}.html`), html);
  }
}
