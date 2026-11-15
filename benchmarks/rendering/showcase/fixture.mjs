import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { hydrateRecords, prepareStyles } from "./prepare.mjs";

export const fixtures = [
  ["airbnb-home", "Airbnb landing page", 49],
  ["nike-catalog", "Nike catalog", 117],
  ["github-pr", "GitHub PR review", 16],
  ["sentry-otel", "Sentry logs", 400],
  ["espn", "ESPN game page", 2],
].map(([id, label, cardinality]) => ({ id, label, cardinality }));
export const fixtureDirectory = new URL("./fixtures/", import.meta.url);
export function loadFixture(id) {
  assert.ok(
    fixtures.some((f) => f.id === id),
    "Unknown showcase fixture",
  );
  const definition = JSON.parse(
    readFileSync(new URL(`${id}.json`, fixtureDirectory), "utf8"),
  );
  const records = readFileSync(new URL(`${id}.jsonl`, fixtureDirectory), "utf8")
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line));
  assert.equal(definition.schemaVersion, 1);
  const prepared = hydrateRecords(records);
  prepareStyles(definition, prepared[definition.root]);
  return { definition, records, prepared, data: prepared[definition.root] };
}
const escapeText = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
const escapeAttribute = (value) => escapeText(value).replaceAll('"', "&quot;");
export const voidTags = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);
// Correctness oracle only. Timed adapters execute ahead-of-time generated native
// components/templates; they must never import or call this serializer.
export function renderReference(definition, data) {
  const field = (value, record) =>
    "literal" in value ? value.literal : record.texts[value.slot];
  function template(index, record) {
    return node(definition.templates[index], record);
  }
  function node(n, record) {
    if (n.kind === "raw") return n.value;
    if (n.kind === "text") return escapeText(field(n.value, record));
    if (n.kind === "repeat")
      return record.groups[n.group]
        .map((child) => template(n.template, child))
        .join("");
    if (n.kind === "variant")
      return node(n.cases[record.variants[n.selector]], record);
    const children = () =>
      n.children.map((child) => node(child, record)).join("");
    if (n.kind === "fragment") return children();
    assert.equal(n.kind, "element");
    return (
      `<${n.tag}${n.attrs.map(([name, value]) => ` ${name}="${escapeAttribute(field(value, record))}"`).join("")}>` +
      (voidTags.has(n.tag) ? "" : `${children()}</${n.tag}>`)
    );
  }
  return `<!DOCTYPE html>${template(definition.entry, data)}`;
}

export const booleanAttributes = new Set([
  "allowfullscreen",
  "async",
  "autofocus",
  "autoplay",
  "checked",
  "controls",
  "default",
  "defer",
  "disabled",
  "formnovalidate",
  "hidden",
  "inert",
  "ismap",
  "itemscope",
  "loop",
  "multiple",
  "muted",
  "nomodule",
  "novalidate",
  "open",
  "playsinline",
  "readonly",
  "required",
  "reversed",
  "selected",
]);
