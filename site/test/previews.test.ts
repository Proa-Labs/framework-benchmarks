import { test } from "bun:test";
import assert from "node:assert/strict";
import { thumbnailHtml, thumbnailSvg } from "../previews.ts";

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

test("thumbnail images serialize inert XHTML with escaped values", () => {
  const svg = thumbnailSvg(
    '<html><head><style>p > span{color:red}</style></head><body><p title="&quot;&amp;">&lt;hello&gt;<img src="data:image/png;base64,AA=="></p><script>throw new Error("no")</script></body></html>',
  );
  assert.match(svg, /xmlns="http:\/\/www.w3.org\/1999\/xhtml"/);
  assert.match(svg, /&lt;hello&gt;/);
  assert.match(svg, /title="&quot;&amp;"/);
  assert.doesNotMatch(svg, /<script/);
});

test("thumbnail cards are bounded for div-based and article-based fixtures", () => {
  for (const tag of ["div", "article"]) {
    const html = `<main class="card-grid"><div class="spacer"></div>${Array.from({ length: 32 }, (_, i) => `<${tag} class="card" data-card="${i}"><h2>Card ${i}</h2></${tag}>`).join("")}</main>`;
    const thumbnail = thumbnailHtml(html);
    assert.equal((thumbnail.match(/data-card=/g) || []).length, 8);
    assert.match(thumbnail, /data-card="7"/);
    assert.doesNotMatch(thumbnail, /data-card="8"/);
    assert.equal((html.match(/data-card=/g) || []).length, 32);
  }
});
