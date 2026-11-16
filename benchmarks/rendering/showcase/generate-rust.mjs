import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { nativeTemplate } from "./emit-template.mjs";
import { fixtures, loadFixture, voidTags } from "./fixture.mjs";
import { viewModule } from "./generate-views.mjs";

export function rustString(value) {
  return (
    '"' +
    [...value]
      .map((c) =>
        c === "\\"
          ? "\\\\"
          : c === '"'
            ? '\\"'
            : c === "\n"
              ? "\\n"
              : c === "\r"
                ? "\\r"
                : c === "\t"
                  ? "\\t"
                  : c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127
                    ? `\\u{${c.codePointAt(0).toString(16)}}`
                    : c,
      )
      .join("") +
    '"'
  );
}
const boolAttrs = new Set([
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
function hoistVariants(original) {
  const definition = structuredClone(original);
  function rewrite(n, root = false) {
    if (n.kind === "variant" && !root) {
      const template = definition.templates.length;
      definition.templates.push(n);
      return { kind: "call", template };
    }
    if (n.kind === "variant")
      return { ...n, cases: n.cases.map((c) => rewrite(c)) };
    return n.children
      ? { ...n, children: n.children.map((c) => rewrite(c)) }
      : n;
  }
  for (let i = 0; i < definition.templates.length; i++)
    definition.templates[i] = rewrite(definition.templates[i], true);
  return definition;
}
function proaModule(original) {
  const definition = hoistVariants(original);
  let current;
  const value = (v) =>
    "literal" in v
      ? rustString(v.literal)
      : current === definition.entry &&
          v.slot === definition.controls.requestIndex
        ? "self.request"
        : `self.data.texts[${v.slot}].as_str()`;
  function node(n, depth = 1) {
    const indent = "    ".repeat(depth);
    if (n.kind === "raw")
      return `{proa_core::StaticRaw(${rustString(n.value)})}`;
    if (n.kind === "text")
      return "literal" in n.value
        ? rustString(n.value.literal)
        : `{${value(n.value)}}`;
    if (n.kind === "fragment")
      return n.children.map((c) => node(c, depth)).join(`\n${indent}`);
    if (n.kind === "call") return `{C${n.template}{data:self.data}}`;
    if (n.kind === "repeat")
      return `{for data in &self.data.groups[${n.group}] { C${n.template} { data } }}`;
    assert.equal(n.kind, "element");
    const attrs = n.attrs
      .map(([name, v]) =>
        boolAttrs.has(name)
          ? ` ${name}={true}`
          : name === "style" && "slot" in v
            ? ` style={proa_core::style_ok(${value(v)})}`
            : ` ${name}=${"literal" in v ? value(v) : `{${value(v)}}`}`,
      )
      .join("");
    return `<${n.tag}${attrs}${voidTags.has(n.tag) ? "/>" : `>\n${indent}    ${n.children.map((c) => node(c, depth + 1)).join(`\n${indent}    `)}\n${indent}</${n.tag}>`}`;
  }
  // Styles are immutable prepared CSS from the pinned fixture, never request input.
  const parts = [
    "use super::super::Data;",
    "use proa_core::{DataLoader,WebContext,WebRenderSync,WriteError};",
    "use proa_macros::html_sync;",
  ];
  for (const [index, template] of definition.templates.entries()) {
    current = index;
    const root = index === definition.entry,
      type = root ? `C${index}<'_>` : `C${index}`;
    parts.push(
      `#[allow(dead_code)] struct C${index}${root ? "<'a>" : ""}{ data:&'static Data${root ? ",request:&'a str" : ""} }`,
    );
    const body = (t) =>
      `html_sync!{\n    ${root ? "<!DOCTYPE html>\n    " : ""}${node(t)}\n}.render(cx)`;
    const render =
      template.kind === "variant"
        ? `match self.data.variants[${template.selector}]{${template.cases.map((c, i) => `${i}=>${body(c)}`).join(",")},_=>unreachable!("invalid prepared variant")}`
        : body(template);
    parts.push(
      `impl<L:DataLoader> WebRenderSync<L> for ${type}{fn render(self,cx:&mut WebContext<L>)->Result<(),WriteError>{${render}}}`,
    );
  }
  parts.push(
    `pub fn render(data:&'static Data,request:&str)->proa_core::RenderBuffer{crate::native_output::render_buffer(C${definition.entry}{data,request})}`,
  );
  parts.push(
    `pub fn render_into<L:DataLoader>(data:&'static Data,request:&str,cx:&mut WebContext<L>)->Result<(),WriteError>{C${definition.entry}{data,request}.render(cx)}`,
  );
  return parts.join("\n");
}
function templateModule(definition, kind, directory) {
  const { markup, styles } = nativeTemplate(definition, kind);
  const styleType = "&'static [&'static str]";
  const styleValues = `&[${styles.map(rustString).join(",")}]`;
  let derive;
  if (kind === "askama")
    derive = `#[derive(askama::Template)] #[template(source=${rustString(`<!DOCTYPE html>${markup}`)},ext="html")]`;
  else {
    const path = join(directory, `${definition.id}.stpl`);
    writeFileSync(
      path,
      "<% let data=self.data; let request=self.request; let styles=self.styles; %><!DOCTYPE html>" +
        markup,
    );
    derive = `#[derive(sailfish::TemplateOnce)] #[template(path=${rustString(path)})]`;
  }
  const trait =
    kind === "askama" ? "askama::Template" : "sailfish::TemplateOnce";
  const method = kind === "askama" ? "render" : "render_once";
  return `use super::super::Data; use ${trait};
${derive}
struct Page<'a>{data:&'static Data,request:&'a str,styles:${styleType}}
pub fn render(data:&'static Data,request:&str)->String { Page{data,request,styles:${styleValues}}.${method}().unwrap() }`;
}
export function generateRust(directory) {
  mkdirSync(directory, { recursive: true });
  let output =
    "// Generated native HTML components; see showcase/generate-rust.mjs.\n";
  for (const engine of [
    "proa",
    "askama",
    "sailfish",
    "leptos",
    "dioxus",
    "topcoat",
  ]) {
    output += `${engine === "topcoat" ? '#[cfg(feature="topcoat")] ' : ""}pub mod ${engine} {\n`;
    for (const { id } of fixtures) {
      const { definition } = loadFixture(id);
      output += `pub mod ${id.replaceAll("-", "_")}{${engine === "proa" ? proaModule(definition) : ["askama", "sailfish"].includes(engine) ? templateModule(definition, engine, directory) : viewModule(definition, engine, rustString)}}\n`;
    }
    output += "}\n";
  }
  writeFileSync(join(directory, "showcase_generated.rs"), output);
}
if (import.meta.main) {
  const out = process.argv[process.argv.indexOf("--out") + 1];
  assert.ok(out);
  generateRust(out);
}
