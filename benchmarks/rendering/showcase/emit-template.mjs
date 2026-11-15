// Ahead-of-time native template emitters. Prepared records are only component
// props; no renderer walks this instruction tree inside a measured invocation.
import assert from "node:assert/strict";
import { parseFragment } from "parse5";
import { voidTags } from "./fixture.mjs";

const text = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("{", "&#123;")
    .replaceAll("}", "&#125;")
    .replaceAll("$", "&#36;");
const attr = (value) => text(value).replaceAll('"', "&quot;");
const quote = JSON.stringify;
export function nativeTemplate(
  definition,
  kind,
  {
    rootContext = "data",
    entry,
    entryIsRoot = true,
    componentCall,
    stylePool = [],
  } = {},
) {
  const styles = stylePool,
    styleContents = stylePool.map((value) =>
      parseFragment(value)
        .childNodes[0].childNodes.map((n) => n.value)
        .join(""),
    );
  function rawStyle(value) {
    let index = styles.indexOf(value);
    if (index < 0) {
      index = styles.length;
      styles.push(value);
      styleContents.push(
        parseFragment(value)
          .childNodes[0].childNodes.map((n) => n.value)
          .join(""),
      );
    }
    return index;
  }
  const access = (ctx, key, index) =>
    kind === "go"
      ? `(index ${ctx}.${{ texts: "Texts", groups: "Groups", variants: "Variants" }[key]} ${index})`
      : kind === "php"
        ? `${ctx}->${key}[${index}]`
        : `${ctx}.${key}[${index}]`;
  function expression(value, ctx, root) {
    if ("literal" in value) return quote(value.literal);
    return root && value.slot === definition.controls.requestIndex
      ? kind === "go"
        ? "$request"
        : kind === "php"
          ? "$request"
          : kind === "marko"
            ? "input.request"
            : "request"
      : access(ctx, "texts", value.slot);
  }
  function escaped(value, ctx, root) {
    const v = expression(value, ctx, root);
    if (kind === "svelte" || kind === "astro") return `{${v}}`;
    if (kind === "vue") return `{{ ${v} }}`;
    if (kind === "marko") return `\${${v}}`;
    if (kind === "jinja" || kind === "askama") return `{{ ${v} }}`;
    if (kind === "sailfish") return `<%= &${v} %>`;
    if (kind === "erb") return `<%= ERB::Util.html_escape(${v}) %>`;
    if (kind === "php")
      return `<?= htmlspecialchars(${v}, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?>`;
    if (kind === "go") return `{{${v}}}`;
    if (kind === "jte") return `\${${v}}`;
    if (kind === "rocker") return `@(${v})`;
    if (kind === "handlebars") {
      if ("literal" in value) return text(value.literal);
      return root && value.slot === definition.controls.requestIndex
        ? "{{@root.request}}"
        : `{{texts.[${value.slot}]}}`;
    }
    throw Error(`Unknown template backend ${kind}`);
  }
  function node(n, ctx = rootContext, depth = 0, root = true) {
    if (n.kind === "raw") {
      const index = rawStyle(n.value);
      if (kind === "svelte") return `{@html styles[${index}]}`;
      if (kind === "astro") return `<Fragment set:html={styles[${index}]}/>`;
      if (kind === "vue") {
        const style = parseFragment(n.value).childNodes[0];
        return `<component :is="'style'"${style.attrs.map((a) => ` ${a.name}="${attr(a.value)}"`).join("")} :innerHTML="styleContents[${index}]"></component>`;
      }
      if (kind === "marko") return `$!{input.styles[${index}]}`;
      if (kind === "handlebars") return `{{{@root.styles.[${index}]}}}`;
      if (kind === "jinja" || kind === "askama")
        return `{{ styles[${index}] | safe }}`;
      if (kind === "erb") return `<%= styles[${index}] %>`;
      if (kind === "php") return `<?= $styles[${index}] ?>`;
      if (kind === "go") return `{{index $styles ${index}}}`;
      if (kind === "jte") return `\${styles[${index}]}`;
      if (kind === "rocker") return `@raw(styles[${index}])`;
      if (kind === "sailfish") return `<%- styles[${index}] %>`;
    }
    if (n.kind === "text")
      return "literal" in n.value
        ? literal(text(n.value.literal))
        : escaped(n.value, ctx, root);
    if (n.kind === "fragment")
      return n.children.map((c) => node(c, ctx, depth, root)).join("");
    if (n.kind === "repeat") {
      const variable =
        kind === "go"
          ? `$r${depth}`
          : kind === "php"
            ? `$r${depth}`
            : `${kind === "sailfish" ? "_" : ""}r${depth}`;
      const body = componentCall
          ? componentCall(n.template, variable)
          : node(definition.templates[n.template], variable, depth + 1, false),
        group = access(ctx, "groups", n.group);
      if (kind === "svelte")
        return `{#each ${group} as ${variable}}${body}{/each}`;
      if (kind === "astro")
        return `{${group}.map(${variable}=>(<Fragment>${body}</Fragment>))}`;
      if (kind === "vue")
        return `<template v-for="${variable} in ${group}">${body}</template>`;
      if (kind === "marko")
        return `<for|${variable}| of=${group}>${body}</for>`;
      if (kind === "jinja" || kind === "askama")
        return `{% for ${variable} in ${group} %}${body}{% endfor %}`;
      if (kind === "sailfish")
        return `<% for ${variable} in &${group} { %>${body}<% } %>`;
      if (kind === "erb")
        return `<% ${group}.each do |${variable}| %>${body}<% end %>`;
      if (kind === "php")
        return `<?php foreach (${group} as ${variable}) { ?>${body}<?php } ?>`;
      if (kind === "go")
        return `{{range ${variable} := ${group}}}${body}{{end}}`;
      if (kind === "jte")
        return `@for(Data ${variable} : ${group})${body}@endfor`;
      if (kind === "rocker")
        return `@for (Data ${variable} : ${group}) {${body}}`;
      if (kind === "handlebars")
        return `{{#each groups.[${n.group}]}}${node(definition.templates[n.template], "this", depth + 1, false)}{{/each}}`;
    }
    if (n.kind === "variant") {
      const selector =
        kind === "askama"
          ? `${ctx}.variant(${n.selector})`
          : access(ctx, "variants", n.selector);
      const bodies = n.cases.map((c) => node(c, ctx, depth, root));
      if (kind === "svelte")
        return `${bodies
          .map(
            (body, i) =>
              `${i === 0 ? "{#if" : "{:else if"} ${selector} === ${i}}${body}`,
          )
          .join("")}{/if}`;
      if (kind === "astro")
        return bodies
          .map(
            (body, i) =>
              `{${selector} === ${i} && (<Fragment>${body}</Fragment>)}`,
          )
          .join("");
      if (kind === "vue")
        return bodies
          .map(
            (body, i) =>
              `<template v-if="${selector} === ${i}">${body}</template>`,
          )
          .join("");
      if (kind === "marko")
        return bodies
          .map((body, i) => `<if=(${selector} === ${i})>${body}</if>`)
          .join("");
      if (kind === "jinja" || kind === "askama")
        return `${bodies
          .map(
            (body, i) =>
              `{% ${i === 0 ? "if" : "elif"} ${selector} == ${i} %}${body}`,
          )
          .join("")}{% endif %}`;
      if (kind === "erb")
        return `${bodies
          .map(
            (body, i) =>
              `<% ${i === 0 ? "if" : "elsif"} ${selector} == ${i} %>${body}`,
          )
          .join("")}<% end %>`;
      if (kind === "php")
        return bodies
          .map(
            (body, i) =>
              `<?php if (${selector} === ${i}) { ?>${body}<?php } ?>`,
          )
          .join("");
      if (kind === "go")
        return `${bodies
          .map(
            (body, i) =>
              `{{${i === 0 ? "if" : "else if"} eq ${selector} ${i}}}${body}`,
          )
          .join("")}{{end}}`;
      if (kind === "jte")
        return bodies
          .map((body, i) => `@if(${selector} == ${i})${body}@endif`)
          .join("");
      if (kind === "rocker")
        return bodies
          .map((body, i) => `@if (${selector} == ${i}) {${body}}`)
          .join("");
      if (kind === "sailfish")
        return bodies
          .map((body, i) => `<% if ${selector} == ${i} { %>${body}<% } %>`)
          .join("");
      if (kind === "handlebars")
        return bodies
          .map(
            (body, i) =>
              `{{#if (eq variants.[${n.selector}] ${i})}}${body}{{/if}}`,
          )
          .join("");
    }
    assert.equal(n.kind, "element");
    const attrs = n.attrs
      .map(([name, value]) => {
        if ("literal" in value)
          return ` ${name}="${literal(attr(value.literal))}"`;
        const v = expression(value, ctx, root);
        if (kind === "svelte" || kind === "astro") return ` ${name}={${v}}`;
        if (kind === "vue") return ` :${name}="${v}"`;
        if (kind === "marko") return ` ${name}=${v}`;
        return ` ${name}="${escaped(value, ctx, root)}"`;
      })
      .join("");
    return (
      `<${n.tag}${attrs}>` +
      (voidTags.has(n.tag)
        ? ""
        : n.children.map((c) => node(c, ctx, depth, root)).join("") +
          `</${n.tag}>`)
    );
  }
  const literal = (value) =>
    kind === "rocker"
      ? value.replaceAll("@", "@@")
      : kind === "jte"
        ? value.replaceAll("@", "&#64;")
        : value;
  const markup = node(
    entry ?? definition.templates[definition.entry],
    rootContext,
    0,
    entryIsRoot,
  );
  return { markup, styles, styleContents };
}
