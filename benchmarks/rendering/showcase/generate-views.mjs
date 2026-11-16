// Ahead-of-time typed views for Rust UI renderers. Only fixed stylesheet text is
// emitted as trusted HTML; every record value uses the renderer's normal escape path.
import { parseFragment } from "parse5";
import { booleanAttributes, voidTags } from "./fixture.mjs";
export function viewModule(definition, engine, quote) {
  let current;
  const root = (index) => index === definition.entry;
  const value = (v) =>
    "literal" in v
      ? quote(v.literal)
      : root(current) && v.slot === definition.controls.requestIndex
        ? engine === "leptos"
          ? "request.to_owned()"
          : "request"
        : `data.texts[${v.slot}].as_str()`;
  function node(n) {
    if (n.kind === "raw") {
      if (engine === "topcoat")
        return `(::topcoat::view::Unescaped::new_unchecked(${quote(n.value)}))`;
      const style = parseFragment(n.value).childNodes[0],
        css = style.childNodes.map((c) => c.value).join("");
      if (engine === "leptos")
        return `<style${style.attrs.map((a) => ` ${a.name}=${quote(a.value)}`).join("")} inner_html={std::convert::identity(${quote(css)})}></style>`;
      return `style {${style.attrs.map((a) => `${quote(a.name)}:concat!(${quote(a.value)}),`).join("")} dangerous_inner_html:concat!(${quote(css)}) }`;
    }
    if (n.kind === "text")
      return engine === "topcoat"
        ? `(${value(n.value)})`
        : `{${value(n.value)}}`;
    if (n.kind === "fragment") return n.children.map(node).join("\n");
    if (n.kind === "repeat") {
      if (engine === "leptos")
        return `{data.groups[${n.group}].iter().map(|data| c${n.template}(*data,"")).collect_view()}`;
      if (engine === "topcoat")
        return `for data in &data.groups[${n.group}] { (c${n.template}(cx,*data,"").await?) }`;
      return `for data in &data.groups[${n.group}] { {c${n.template}(*data,"")} }`;
    }
    if (n.kind === "variant") {
      const bodies = n.cases.map(node);
      if (engine === "topcoat")
        return bodies
          .map((b, i) => `if data.variants[${n.selector}]==${i} {${b}}`)
          .join("\n");
      if (engine === "leptos")
        return `{match data.variants[${n.selector}] {${bodies.map((b, i) => `${i}=>view!{${b}}.into_any()`).join(",")},_=>unreachable!()}}`;
      return bodies
        .map((b, i) => `if data.variants[${n.selector}]==${i} {${b}}`)
        .join("\n");
    }
    if (engine === "dioxus") {
      // Dioxus 0.6 excludes <html>; the serializer supplies this fixed outer
      // shell in the same fresh output String, as the existing core adapter does.
      if (n.tag === "html") return n.children.map(node).join("\n");
      const attrs = n.attrs
        .map(
          ([name, v]) =>
            `${quote(name)}:${booleanAttributes.has(name) ? "true" : "literal" in v ? `concat!(${value(v)})` : `super::super::escape_dioxus_attribute(${value(v)}).into_owned()`},`,
        )
        .join("");
      return `${n.tag} {${attrs}${n.children.map(node).join("\n")}}`;
    }
    const attrs = n.attrs
      .map(([name, v]) =>
        engine === "leptos" && name === "aria-level"
          ? ` {..leptos::tachys::html::attribute::custom::custom_attribute("aria-level",${value(v)})}`
          : ` ${name}=${engine === "topcoat" ? `(${value(v)})` : "literal" in v ? value(v) : `{${value(v)}}`}`,
      )
      .join("");
    return `<${n.tag}${attrs}${voidTags.has(n.tag) ? "/>" : `>${n.children.map(node).join("\n")}</${n.tag}>`}`;
  }
  let output =
    engine === "leptos"
      ? "use leptos::prelude::*;\n"
      : engine === "dioxus"
        ? "use dioxus::prelude::*;\n"
        : "use ::topcoat::{context::Cx,view::view,Result};\n";
  // Dioxus 0.6 predates HTML's <search>. Extend its native element metadata
  // so RSX emits the real semantic element instead of substituting a div.
  if (engine === "dioxus")
    output += `
use ::dioxus::prelude::dioxus_elements as native_elements;
#[allow(unused_imports, dead_code)]
mod dioxus_elements {
    pub use super::native_elements::*;
    pub mod search {
        pub const TAG_NAME: &str = "search";
        pub const NAME_SPACE: Option<&str> = None;
    }
    pub mod elements {
        pub use super::super::native_elements::elements::*;
        pub use super::search;
    }
}
`;
  output += "use super::super::Data;\n";
  for (const [i, t] of definition.templates.entries()) {
    current = i;
    const markup = node(t);
    if (engine === "leptos")
      output += `#[allow(unused_variables)] fn c${i}(data:&'static Data,request:&str)->AnyView{view!{${root(i) ? "<!DOCTYPE html>" : ""}${markup}}.into_any()}\n`;
    else if (engine === "topcoat")
      output += `#[allow(unused_variables)] async fn c${i}(cx:&Cx,data:&'static Data,request:&str)->Result{view!{cx => ${root(i) ? "<!DOCTYPE html>" : ""}${markup}}}\n`;
    else
      output += `#[allow(unused_variables)] fn c${i}(data:&'static Data,request:&str)->Element {rsx!{${markup}}}\n`;
  }
  if (engine === "leptos")
    output += `pub fn render(data:&'static Data,request:&str)->String{Owner::new().with(||c${definition.entry}(data,request).to_html())}`;
  else if (engine === "topcoat")
    output += `pub fn render(cx:&Cx,data:&'static Data,request:&str)->String{futures::executor::block_on(c${definition.entry}(cx,data,request)).unwrap().render(cx)}`;
  else {
    const html = definition.templates[definition.entry].children.find(
      (n) => n.tag === "html",
    );
    const shell =
      "<html" +
      html.attrs.map(([name, v]) => ` ${name}="${v.literal}"`).join("") +
      ">";
    output += `#[derive(Clone,Props)] struct Input{data:&'static Data,request:String}
impl PartialEq for Input{fn eq(&self,other:&Self)->bool{std::ptr::eq(self.data,other.data)&&self.request==other.request}}
fn page(input:Input)->Element{c${definition.entry}(input.data,&input.request)}
pub fn render(data:&'static Data,request:&str)->String{
let mut vdom=VirtualDom::new_with_props(page,Input{data,request:request.to_owned()});vdom.rebuild_in_place();
let mut output=String::new();output.push_str(${quote(`<!DOCTYPE html>${shell}`)});
dioxus_ssr::Renderer::new().render_to(&mut output,&vdom).unwrap();output.push_str("</html>");output
}`;
  }
  return output;
}
