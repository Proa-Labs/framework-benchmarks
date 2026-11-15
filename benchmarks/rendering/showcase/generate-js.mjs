import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseFragment } from "parse5";
import { fixtures, loadFixture } from "./fixture.mjs";
import { styleObject } from "./style.mjs";

export const propertyName = (name) =>
  ({
    class: "className",
    for: "htmlFor",
    tabindex: "tabIndex",
    readonly: "readOnly",
    autofocus: "autoFocus",
    charset: "charSet",
    crossorigin: "crossOrigin",
    srcset: "srcSet",
    fetchpriority: "fetchPriority",
    viewbox: "viewBox",
    colspan: "colSpan",
    rowspan: "rowSpan",
  })[name] ??
  (name.startsWith("data-") || name.startsWith("aria-")
    ? name
    : name.replace(/[:-]([a-z])/g, (_, c) => c.toUpperCase()));
const booleans = new Set([
  "hidden",
  "disabled",
  "checked",
  "selected",
  "multiple",
  "required",
  "autofocus",
  "readonly",
  "open",
  "reversed",
  "novalidate",
  "controls",
  "loop",
  "muted",
  "autoplay",
  "playsinline",
]);
const quote = JSON.stringify;
const escapeText = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
const _escapeAttr = (value) => escapeText(value).replaceAll('"', "&quot;");
const read = (value, data = "data") =>
  "literal" in value ? quote(value.literal) : `${data}.texts[${value.slot}]`;
function reactSource(definition) {
  const definitions = [];
  let currentComponent = -1;
  const fieldExpression = (v) =>
    currentComponent === definition.entry &&
    v.slot === definition.controls.requestIndex
      ? `(request??data.texts[${v.slot}])`
      : read(v);
  function node(n) {
    if (n.kind === "raw") {
      const style = parseFragment(n.value).childNodes[0];
      assert.equal(style.tagName, "style");
      return `h('style',{${style.attrs.map((a) => `${quote(propertyName(a.name))}:${quote(a.value)}`).join(",")}${style.attrs.length ? "," : ""}dangerouslySetInnerHTML:{__html:${quote(style.childNodes.map((n) => n.value).join(""))}}})`;
    }
    if (n.kind === "text") return fieldExpression(n.value);
    if (n.kind === "fragment")
      return `h(Fragment,null,${n.children.map(node).join(",")})`;
    if (n.kind === "repeat")
      return `data.groups[${n.group}].map(record=>C${n.template}({data:record}))`;
    if (n.kind === "variant")
      return (
        n.cases
          .slice(0, -1)
          .map((c, i) => `data.variants[${n.selector}]===${i}?${node(c)}:`)
          .join("") + node(n.cases.at(-1))
      );
    const attrs = n.attrs.map(([name, value]) => {
      const expr =
        name === "style"
          ? "literal" in value
            ? quote(styleObject(value.literal))
            : `data.styles[${value.slot}]`
          : booleans.has(name)
            ? "true"
            : fieldExpression(value);
      return `${quote(propertyName(name))}:${expr}`;
    });
    return `h(${quote(n.tag)},{${attrs.join(",")}}${n.children.length ? `,${n.children.map(node).join(",")}` : ""})`;
  }
  for (const [index, template] of definition.templates.entries()) {
    currentComponent = index;
    definitions.push(
      `function C${index}({data,request}){return ${node(template)};}`,
    );
  }
  currentComponent = definition.entry;
  const html = definition.templates[definition.entry].children.find(
    (n) => n.tag === "html",
  );
  const head = html.children.find((n) => n.tag === "head"),
    body = html.children.find((n) => n.tag === "body");
  const bodyProps = body.attrs
    .map(
      ([name, value]) =>
        `${quote(propertyName(name))}:${name === "style" && "literal" in value ? quote(styleObject(value.literal)) : fieldExpression(value)}`,
    )
    .join(",");
  const htmlProps = html.attrs
    .map(
      ([name, value]) =>
        `${quote(propertyName(name))}:${fieldExpression(value)}`,
    )
    .join(",");
  return `// Generated native React components. No HTML-tree interpreter runs in a render.\nimport {createElement as h,Fragment} from 'react';\n${definitions.join("\n")}\nexport const Page=C${definition.entry};\nexport function Head({data,request}){return ${node({ kind: "fragment", children: head.children })};}\nexport function Body({data,request}){return ${node({ kind: "fragment", children: body.children })};}\nexport function bodyProps(data){return {${bodyProps}};}\nexport function htmlProps(data){return {${htmlProps}};}\n`;
}

export function generateJS(directory) {
  mkdirSync(directory, { recursive: true });
  for (const { id } of fixtures) {
    const { definition, records, prepared } = loadFixture(id);
    writeFileSync(join(directory, `${id}.react.mjs`), reactSource(definition));
    const raw = records.map((record, i) =>
      Object.keys(prepared[i].styles).length
        ? { ...record, styles: prepared[i].styles }
        : record,
    );
    writeFileSync(
      join(directory, `${id}.data.mjs`),
      `import{hydrateRecords}from'../prepare.mjs';\nconst records=${JSON.stringify(raw)};\nexport function createInput(){const prepared=hydrateRecords(records);return{prepared,data:prepared[${definition.root}]};}\nexport const {prepared,data}=createInput();\nexport const controls=${JSON.stringify(definition.controls)};\n`,
    );
  }
}
if (import.meta.main)
  generateJS(new URL("./.generated/", import.meta.url).pathname);
