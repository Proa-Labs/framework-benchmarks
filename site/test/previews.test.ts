import { test } from "bun:test";
import assert from "node:assert/strict";
import { thumbnailHtml, thumbnailSourceHash } from "../previews.ts";

test("thumbnail documents bound hidden rows without changing visible inputs or full fixtures", () => {
  const html = `<html><head><title>Fixture</title></head><body><table><tbody>${Array.from({ length: 1000 }, (_, index) => `<tr data-row="${index}"><td>User ${index} &amp; team</td></tr>`).join("")}</tbody></table></body></html>`;
  const thumbnail = thumbnailHtml(html);
  assert.equal((thumbnail.match(/<tr /g) || []).length, 10);
  assert.match(thumbnail, /data-row="9"/);
  assert.doesNotMatch(thumbnail, /data-row="10"/);
  assert.match(thumbnail, /User 0 &amp; team/);
  assert.equal((html.match(/<tr /g) || []).length, 1000);
  assert.equal(thumbnailHtml(thumbnail), thumbnail);
});

test("thumbnail source hashes ignore runtime scripts and request attributes, while retaining business content", () => {
  const doc = (request: string, text: string) =>
    `<html><head><title>Fixture</title></head><body><main data-bench-request="${request}"><p>${text}</p></main><script>${request}</script></body></html>`;
  assert.equal(
    thumbnailSourceHash(doc("first", "Content")),
    thumbnailSourceHash(doc("second", "Content")),
  );
  assert.notEqual(
    thumbnailSourceHash(doc("first", "Content")),
    thumbnailSourceHash(doc("first", "Changed")),
  );
});

test("thumbnail cards are bounded for div-based and article-based fixtures", () => {
  for (const tag of ["div", "article"]) {
    const html = `<main>${Array.from({ length: 4 }, (_, group) => `<section><h2>Group ${group}</h2><div class="card-grid"><div class="spacer"></div>${Array.from({ length: 8 }, (_, i) => `<${tag} class="card" data-card="${group * 8 + i}"><h3>Card ${i}</h3></${tag}>`).join("")}</div></section>`).join("")}</main>`;
    const thumbnail = thumbnailHtml(html);
    assert.equal((thumbnail.match(/data-card=/g) || []).length, 8);
    assert.match(thumbnail, /data-card="7"/);
    assert.doesNotMatch(thumbnail, /data-card="8"/);
    assert.equal((html.match(/data-card=/g) || []).length, 32);
  }
});
