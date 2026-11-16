#!/usr/bin/env bun
// Separate adapted admission: business text, images, links, data attributes and
// freshness must survive Exact's native tree. Never labels native HTML strict.
import assert from "node:assert/strict";
import { parse } from "parse5";
import { validateExactStylesheet } from "./admission.mjs";
import { semantic } from "./business.mjs";
import { fixtures, loadFixture, renderReference } from "./fixture.mjs";
import { prepareNativeExact } from "./native-exact.mjs";

if (import.meta.main) await main();
async function main() {
  const option = (key) => {
    const i = process.argv.indexOf(key);
    return i < 0 ? undefined : process.argv[i + 1];
  };
  const results = [];
  for (const { id } of fixtures)
    if (!option("--workload") || option("--workload") === id) {
      const fixture = loadFixture(id),
        native = await prepareNativeExact(id, fixture);
      for (const probe of [
        "baseline",
        "title",
        "text",
        "request",
        "restored",
      ]) {
        const fresh = loadFixture(id),
          { definition } = fixture,
          controls = definition.controls;
        // Restore independent inputs before each probe, outside the render timer.
        for (let i = 0; i < fixture.prepared.length; i++)
          fixture.prepared[i].texts.splice(
            0,
            Infinity,
            ...fresh.prepared[i].texts,
          );
        const changed = '</span><img id="escaped-probe" src=x> & < > " \' ✓';
        if (probe === "title")
          fixture.data.texts[controls.titleIndex] = changed;
        if (probe === "text")
          fixture.prepared[controls.text.record].texts[controls.text.slot] =
            changed;
        if (probe === "request")
          fixture.data.texts[controls.requestIndex] = changed;
        native.refreshPreparedInput();
        const expected = renderReference(definition, fixture.data),
          actual = native.render();
        validateExactStylesheet(actual, native.sheet);
        assert.throws(() =>
          validateExactStylesheet(
            actual.replace(native.sheet, ""),
            native.sheet,
          ),
        );
        const reference = semantic(expected),
          allowed = new Set(reference.data.flat().map(([name]) => name));
        assert.deepEqual(
          semantic(actual, allowed),
          reference,
          `${id}/${probe}: adapted business data differs`,
        );
        const expectedTitle = parse(expected)
          .childNodes.find((n) => n.tagName === "html")
          .childNodes.find((n) => n.tagName === "head")
          .childNodes.find((n) => n.tagName === "title")
          .childNodes.map((n) => n.value)
          .join("");
        const actualTitle = parse(actual)
          .childNodes.find((n) => n.tagName === "html")
          .childNodes.find((n) => n.tagName === "head")
          .childNodes.find((n) => n.tagName === "title")
          .childNodes.map((n) => n.value)
          .join("");
        assert.equal(actualTitle, expectedTitle);
        results.push({ id, probe, status: "adapted-pass" });
      }
    }
  console.log(JSON.stringify(results));
}
