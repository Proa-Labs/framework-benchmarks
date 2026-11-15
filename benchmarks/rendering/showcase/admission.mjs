// One correctness boundary for both renderer-only and production HTTP captures.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { parse } from "parse5";
import { semantic } from "./business.mjs";
import { fixtures, loadFixture, renderReference } from "./fixture.mjs";
import { canonicalDigest } from "./import.mjs";

const cache = new Map();
const get = (id) => {
  if (!cache.has(id)) cache.set(id, loadFixture(id));
  return cache.get(id);
};
export const isShowcase = (id) => fixtures.some((f) => f.id === id);
export const showcasePath = (id) => `/showcase/${id}`;
export function validateShowcaseHtml(
  html,
  id,
  request,
  { adapted = false } = {},
) {
  const { definition, data } = get(id);
  data.texts[definition.controls.requestIndex] = request;
  const expected = renderReference(definition, data),
    reference = semantic(expected);
  if (adapted) {
    const allowed = new Set(reference.data.flat().map(([name]) => name));
    validateExactStyleBindings(html);
    assert.deepEqual(
      semantic(String(html), allowed),
      reference,
      `${id}: adapted business data differs`,
    );
  } else
    assert.equal(
      canonicalDigest(String(html)),
      canonicalDigest(expected),
      `${id}: business DOM or CSS differs`,
    );
  function title(html) {
    const doc = parse(html);
    return doc.childNodes
      .find((n) => n.tagName === "html")
      .childNodes.find((n) => n.tagName === "head")
      .childNodes.find((n) => n.tagName === "title")
      .childNodes.map((n) => n.value)
      .join("");
  }
  assert.equal(
    title(String(html)),
    title(expected),
    `${id}: document title differs`,
  );
  return createHash("sha256").update(JSON.stringify(reference)).digest("hex");
}
export function showcaseNegativeControls(id) {
  const { definition, data, prepared } = get(id),
    field = definition.controls.text;
  const source = prepared[field.record].texts[field.slot];
  assert.ok(source.length > 0);
  // This control is intentionally serialization-independent business text.
  const escapeHtml = (value) =>
    value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  const expected = semantic(renderReference(definition, data));
  const link = expected.links.find((value) =>
    /^[A-Za-z0-9/:._#?=-]+$/.test(value),
  );
  assert.ok(link, `${id} needs a link negative control`);
  return [
    [escapeHtml(source), `${escapeHtml(source)} changed`],
    ['data-bench-request="fresh-b"', 'data-bench-request="wrong"'],
    [`href="${link}"`, `href="${link}wrong"`],
  ];
}

function exactCss(html) {
  const doc = parse(String(html)),
    classes = [],
    sheets = [];
  function visit(n) {
    if (n.tagName === "script") return;
    if (n.tagName === "style")
      sheets.push(n.childNodes.map((c) => c.value).join(""));
    for (const attr of n.attrs ?? [])
      if (attr.name === "class")
        classes.push(
          ...attr.value.split(/\s+/).filter((name) => /^c\d+$/.test(name)),
        );
    for (const child of n.childNodes ?? []) visit(child);
  }
  visit(doc);
  return { classes, sheets };
}
export function validateExactStyleBindings(html) {
  const { classes, sheets } = exactCss(html),
    css = sheets.join("\n");
  assert.ok(css.length > 0, "Exact must return native CSS");
  assert.ok(classes.length > 0, "Exact must apply native style classes");
  for (const name of new Set(classes))
    assert.ok(
      new RegExp(`\\.${name}(?![\\w-])`).test(css),
      `Exact style class ${name} has no returned CSS rule`,
    );
  return {
    cssSha256: createHash("sha256").update(css).digest("hex"),
    styledElements: classes.length,
    styleClasses: new Set(classes).size,
  };
}
export function validateExactStylesheet(html, sheet) {
  assert.deepEqual(
    exactCss(html).sheets,
    [sheet],
    "Exact must return its complete compiled native stylesheet",
  );
  return validateExactStyleBindings(html);
}
