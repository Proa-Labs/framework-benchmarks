import assert from "node:assert/strict";
import test from "node:test";
import {
  showcaseNegativeControls,
  validateShowcaseHtml,
} from "./admission.mjs";
import { fixtures, loadFixture, renderReference } from "./fixture.mjs";
import { canonicalDigest } from "./import.mjs";

const document = (head, body) =>
  `<!doctype html><html><head><title>Fixture</title>${head}</head><body>${body}</body></html>`;
test("transport normalization preserves business markup, styles and meaningful whitespace", () => {
  const html = document(
    '<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>.a{color:red}.b{color:blue}</style>',
    '<main class="a"><input disabled><img src="/image%27s.png"><pre> x\ny </pre><div hidden>Business</div></main>',
  );
  const equivalent = html
    .replace("<head>", "<head> \n")
    .replace(
      '<meta charset="utf-8">',
      '<meta charset="UTF-8"><meta charset="utf-8">',
    )
    .replace("initial-scale=1", "initial-scale=1.0")
    .replace("<input disabled>", '<input disabled="disabled">')
    .replace("/image%27s.png", "/image's.png")
    .replace("</body>", '<div hidden=""><!--$--><!--/$--></div>\n</body>');
  assert.equal(canonicalDigest(html), canonicalDigest(equivalent));
  for (const changed of [
    html.replace('class="a"', 'class="b"'),
    html.replace("color:red", "color:green"),
    html.replace(".a{color:red}.b{color:blue}", ".b{color:blue}.a{color:red}"),
    html.replace(" x\ny ", "x\ny"),
    html.replace("<div hidden>Business</div>", ""),
    html.replace("/image%27s.png", "/image%2Fs.png"),
  ]) {
    assert.notEqual(canonicalDigest(html), canonicalDigest(changed));
  }
});
for (const { id } of fixtures)
  test(`${id}: business, request and link mutations fail strict admission`, () => {
    const { definition, data } = loadFixture(id);
    data.texts[definition.controls.requestIndex] = "fresh-b";
    const html = renderReference(definition, data);
    validateShowcaseHtml(html, id, "fresh-b");
    for (const [from, to] of showcaseNegativeControls(id)) {
      const changed = html.replaceAll(from, to);
      assert.notEqual(changed, html);
      assert.throws(() => validateShowcaseHtml(changed, id, "fresh-b"));
    }
  });
