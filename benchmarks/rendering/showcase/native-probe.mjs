#!/usr/bin/env bun
// Untimed native renderer admission: complete DOM, original styles, mutable
// prepared text and escaped per-request attributes. Never records a latency.
import assert from "node:assert/strict";
import { fixtures, loadFixture, renderReference } from "./fixture.mjs";
import { canonicalDigest } from "./import.mjs";
import { prepareNativeJS } from "./native-js.mjs";

const engine = process.argv[process.argv.indexOf("--engine") + 1];
const results = [];
for (const { id } of fixtures.filter(
  (f) =>
    !process.argv.includes("--workload") ||
    f.id === process.argv[process.argv.indexOf("--workload") + 1],
)) {
  const { definition } = loadFixture(id);
  const { data, prepared, render } = await prepareNativeJS(id, engine);
  assert.equal(
    canonicalDigest(await render()),
    definition.expectedDomSha256,
    `${engine}/${id}: baseline DOM or CSS differs`,
  );
  const title = data.texts[definition.controls.titleIndex];
  data.texts[definition.controls.titleIndex] =
    '</title><img id="escaped-probe" src=x> & < > " \' ✓';
  const titleDigest = canonicalDigest(renderReference(definition, data));
  assert.notEqual(titleDigest, definition.expectedDomSha256);
  assert.equal(
    canonicalDigest(await render()),
    titleDigest,
    `${engine}/${id}: changed title or escaping differs`,
  );
  data.texts[definition.controls.titleIndex] = title;
  const field = definition.controls.text;
  assert.ok(field, "The fixture needs a dynamic collection-text control");
  const record = prepared[field.record],
    original = record.texts[field.slot];
  record.texts[field.slot] =
    '</span><img id="escaped-probe" src=x> & < > " \' ✓';
  const textDigest = canonicalDigest(renderReference(definition, data));
  assert.notEqual(textDigest, definition.expectedDomSha256);
  assert.equal(
    canonicalDigest(await render()),
    textDigest,
    `${engine}/${id}: changed collection text or escaping differs`,
  );
  record.texts[field.slot] = original;
  const request = data.texts[definition.controls.requestIndex];
  data.texts[definition.controls.requestIndex] = "req<&\"'✓";
  assert.equal(
    canonicalDigest(await render(data.texts[definition.controls.requestIndex])),
    canonicalDigest(renderReference(definition, data)),
    `${engine}/${id}: request freshness or attribute escaping differs`,
  );
  data.texts[definition.controls.requestIndex] = request;
  assert.equal(
    canonicalDigest(await render()),
    definition.expectedDomSha256,
    `${engine}/${id}: rendering mutated shared data`,
  );
  results.push({
    engine,
    id,
    status: "pass",
    controls: [
      "baseline",
      "title",
      "collection-text",
      "request",
      "unchanged-input",
    ],
  });
}
console.log(JSON.stringify(results));
