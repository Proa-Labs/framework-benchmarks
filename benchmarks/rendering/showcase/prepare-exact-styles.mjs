#!/usr/bin/env bun
// Untimed desktop styling projection for Exact's named native styles. This
// intentionally records a fixed viewport; unsupported CSS values are audited by
// the pinned compiler rather than silently treated as full browser CSS support.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { chromium } from "playwright";
import {
  fixtureDirectory,
  fixtures,
  loadFixture,
  renderReference,
} from "./fixture.mjs";
import { utilityStylesheet } from "./styles.mjs";

const properties = [
  "display",
  "box-sizing",
  "position",
  "top",
  "right",
  "bottom",
  "left",
  "z-index",
  "width",
  "height",
  "min-width",
  "max-width",
  "min-height",
  "max-height",
  "margin-top",
  "margin-right",
  "margin-bottom",
  "margin-left",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "border-top-width",
  "border-right-width",
  "border-bottom-width",
  "border-left-width",
  "border-top-style",
  "border-right-style",
  "border-bottom-style",
  "border-left-style",
  "border-top-color",
  "border-right-color",
  "border-bottom-color",
  "border-left-color",
  "border-top-left-radius",
  "border-top-right-radius",
  "border-bottom-left-radius",
  "border-bottom-right-radius",
  "color",
  "background-color",
  "font-family",
  "font-size",
  "font-weight",
  "line-height",
  "letter-spacing",
  "text-align",
  "text-transform",
  "text-decoration-line",
  "white-space",
  "word-break",
  "overflow-wrap",
  "overflow-x",
  "overflow-y",
  "text-overflow",
  "flex-grow",
  "flex-shrink",
  "flex-basis",
  "flex-direction",
  "flex-wrap",
  "align-items",
  "align-self",
  "justify-content",
  "grid-template-columns",
  "grid-template-rows",
  "column-gap",
  "row-gap",
  "object-fit",
  "opacity",
];
const css = await utilityStylesheet(),
  browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
  });
  await page.route("**/*", (route) => route.abort());
  const selected = process.argv.indexOf("--workload");
  for (const { id } of fixtures.filter(
    (f) => selected < 0 || f.id === process.argv[selected + 1],
  )) {
    const { definition, data, prepared } = loadFixture(id);
    await page.setContent(renderReference(definition, data), {
      waitUntil: "domcontentloaded",
    });
    await page.addStyleTag({ content: css });
    const values = await page.evaluate(
      (properties) =>
        [document.body, ...document.body.querySelectorAll("*")].map(
          (element) => {
            const style = getComputedStyle(element);
            return {
              ...Object.fromEntries(
                properties.map((p) => [p, style.getPropertyValue(p)]),
              ),
              $scope:
                element instanceof SVGElement
                  ? element.tagName === "svg"
                    ? "svg-root"
                    : ["text", "tspan"].includes(element.tagName)
                      ? "svg-text"
                      : "svg-geometry"
                  : "html",
            };
          },
        ),
      properties,
    );
    const palette = [],
      recordStyles = prepared.map(() => []),
      indices = new Map(prepared.map((r, i) => [r, i])),
      keys = new Map();
    const annotated = structuredClone(definition);
    for (const template of annotated.templates) {
      let count = 0;
      function assign(n) {
        if (n.kind === "element") n.exactStyle = count++;
        for (const child of n.children ?? n.cases ?? []) assign(child);
      }
      assign(template);
    }
    let cursor = 0;
    function visit(n, r, inBody = false) {
      if (n.kind === "repeat") {
        for (const child of r.groups[n.group])
          visit(annotated.templates[n.template], child, inBody);
        return;
      }
      if (n.kind === "variant") {
        visit(n.cases[r.variants[n.selector]], r, inBody);
        return;
      }
      if (n.tag === "body") inBody = true;
      if (n.kind === "element" && inBody) {
        const value = values[cursor++];
        assert.ok(value, `${id}: browser element count differs`);
        // SVG geometry is expressed by its original attributes, not computed
        // CSS dimensions that would override the SVG coordinate system.
        const key = JSON.stringify(value);
        let index = keys.get(key);
        if (index === undefined) {
          index = palette.length;
          palette.push(value);
          keys.set(key, index);
        }
        recordStyles[indices.get(r)][n.exactStyle] = index;
      }
      for (const child of n.children ?? []) visit(child, r, inBody);
    }
    visit(annotated.templates[annotated.entry], data);
    assert.equal(cursor, values.length);
    const result = {
      schemaVersion: 1,
      fixtureDomSha256: definition.expectedDomSha256,
      utilityCssSha256: createHash("sha256").update(css).digest("hex"),
      viewport: { width: 1280, height: 800, deviceScaleFactor: 1 },
      browser: browser.version(),
      properties,
      palette,
      recordStyles,
    };
    writeFileSync(
      new URL(`${id}.exact-styles.json`, fixtureDirectory),
      `${JSON.stringify(result)}\n`,
    );
    console.log(
      `${id}: ${cursor} elements, ${palette.length} native style candidates`,
    );
  }
} finally {
  await browser.close();
}
