// Native production routes shared by render-only and complete-request suites.
// Route source is generated before framework compilation, never during a timer.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { nativeTemplate } from "./emit-template.mjs";
import { fixtures, loadFixture } from "./fixture.mjs";
import { generateJS } from "./generate-js.mjs";

const adapters = fileURLToPath(
  new URL("../../framework-ssr/adapters/", import.meta.url),
);
const generated = fileURLToPath(new URL("./.generated/", import.meta.url));
const specifier = (file, target) => {
  const path = relative(dirname(file), target).replaceAll("\\", "/");
  return path.startsWith(".") ? path : `./${path}`;
};
const write = (path, content) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
};
const escapeHtml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;");
export function generateFrameworks() {
  generateJS(generated);
  const shells = {};
  for (const { id } of fixtures) {
    const { definition, data } = loadFixture(id),
      html = definition.templates[definition.entry].children.find(
        (n) => n.tag === "html",
      );
    const head = html.children.find((n) => n.tag === "head"),
      body = html.children.find((n) => n.tag === "body");
    const opening = (n) =>
      `<${n.tag}${n.attrs.map(([key, v]) => ` ${key}="${escapeHtml("literal" in v ? v.literal : data.texts[v.slot])}"`).join("")}>`;
    shells[id] = { html: opening(html), body: opening(body) };
    const astro = join(adapters, "astro/src/pages/showcase", `${id}.astro`);
    const native = nativeTemplate(definition, "astro");
    write(
      astro,
      `---\nimport {data as preparedData} from ${JSON.stringify(specifier(astro, join(generated, `${id}.data.mjs`)))};\nconst data=Astro.props.benchmarkData??preparedData;\nconst request=Astro.props.benchmarkRequest??Astro.url.searchParams.get('request')??data.texts[${definition.controls.requestIndex}];\nconst styles=${JSON.stringify(native.styles)};\nAstro.response.headers.set('cache-control','no-store');\n---\n<!DOCTYPE html>${native.markup}`,
    );
    const next = join(adapters, "next/app/(showcase)/showcase", id, "page.jsx");
    const component = specifier(next, join(generated, `${id}.react.mjs`)),
      input = specifier(next, join(generated, `${id}.data.mjs`));
    write(
      next,
      `import {Page as FullPage,Body} from ${JSON.stringify(component)};\nimport {data as preparedData} from ${JSON.stringify(input)};\nexport const dynamic='force-dynamic';export const revalidate=0;\nexport default async function Page({searchParams,benchmarkData,benchmarkRequest,benchmarkFullDocument=false}){const data=benchmarkData??preparedData;const request=benchmarkRequest??(await searchParams)?.request??data.texts[${definition.controls.requestIndex}];return benchmarkFullDocument?<FullPage data={data} request={request}/>:<Body data={data} request={request}/>;}`,
    );
    write(
      join(dirname(next), "layout.jsx"),
      `import {Head,bodyProps,htmlProps} from ${JSON.stringify(component)};\nimport {data} from ${JSON.stringify(input)};\nexport const dynamic='force-dynamic';\nexport default function Layout({children}){return <html {...htmlProps(data)}><head><Head data={data}/></head><body {...bodyProps(data)}>{children}</body></html>;}`,
    );
    const svelte = join(
      adapters,
      "sveltekit/src/routes/showcase",
      id,
      "+page.svelte",
    );
    const styles = [];
    const headMarkup = nativeTemplate(definition, "svelte", {
      entry: { kind: "fragment", children: head.children },
      stylePool: styles,
    }).markup;
    const bodyMarkup = nativeTemplate(definition, "svelte", {
      entry: { kind: "fragment", children: body.children },
      stylePool: styles,
    }).markup;
    write(
      svelte,
      `<svelte:options preserveWhitespace={true}/><script>let {data:envelope}=$props();let data=$derived(envelope.fixtureData);let styles=$derived(envelope.styles);let request=$derived(envelope.request);</script><svelte:head>${headMarkup}</svelte:head>${bodyMarkup}`,
    );
    const loader = join(dirname(svelte), "+page.server.js");
    write(
      loader,
      `import {data} from ${JSON.stringify(specifier(loader, join(generated, `${id}.data.mjs`)))};\nconst styles=${JSON.stringify(styles)};\nexport function load({url,setHeaders}){setHeaders({'cache-control':'no-store'});return {fixtureData:data,styles,request:url.searchParams.get('request')??data.texts[${definition.controls.requestIndex}]};}`,
    );
    write(
      join(adapters, "sveltekit/.showcase-generated", `${id}.shell.mjs`),
      `export const shell=${JSON.stringify(shells[id])};export const styles=${JSON.stringify(styles)};`,
    );
  }
  write(
    join(adapters, "sveltekit/.showcase-generated/shells.mjs"),
    `export default ${JSON.stringify(shells)};`,
  );
}
if (import.meta.main) generateFrameworks();
