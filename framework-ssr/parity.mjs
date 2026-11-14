import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { parse } from "parse5";
import { cards, price } from "./fixture.mjs";
import { validateWorkloadHtml } from "./workload-parity.ts";

const attr = (node, name) => node.attrs?.find((a) => a.name === name)?.value;
const descendants = (node) => [
  node,
  ...(node.childNodes || []).flatMap(descendants),
];
const text = (node) =>
  node.nodeName === "#text"
    ? node.value
    : (node.childNodes || []).map(text).join("");
export const sha256 = (body) => createHash("sha256").update(body).digest("hex");
export function validateSemanticHtml(body, request, workload = "catalog") {
  if (workload !== "catalog")
    return validateWorkloadHtml(body, request, workload);
  const nodes = descendants(parse(String(body)));
  const roots = nodes.filter((n) => attr(n, "data-bench-page") === "catalog");
  assert.equal(roots.length, 1, "one catalog landmark required");
  const root = roots[0];
  assert.equal(root.tagName, "main", "catalog must be a main landmark");
  const inside = descendants(root);
  assert.equal(
    inside.some((n) => n.tagName === "script"),
    false,
    "fixture text must never become script markup",
  );
  assert.deepEqual(inside.filter((n) => n.tagName === "h1").map(text), [
    "Product catalog",
  ]);
  assert.deepEqual(
    inside.filter((n) => attr(n, "data-bench-request") === "true").map(text),
    [request],
    "request value must come from the current URL",
  );
  const articles = inside.filter(
    (n) => attr(n, "data-bench-card") !== undefined,
  );
  assert.equal(articles.length, cards.length, "card count");
  const projection = articles.map((article, index) => {
    const card = cards[index];
    assert.equal(article.tagName, "article", "card element");
    assert.equal(
      attr(article, "data-bench-card"),
      card.id,
      "card order/identity",
    );
    const inner = descendants(article);
    const field = (name, expected) => {
      const matches = inner.filter(
        (n) => attr(n, `data-bench-${name}`) === card.id,
      );
      assert.equal(matches.length, 1, `${card.id}/${name} cardinality`);
      assert.equal(
        text(matches[0]),
        expected,
        `${card.id}/${name} content and escaping`,
      );
      return matches[0];
    };
    assert.equal(
      field("title", card.title).tagName,
      "h2",
      "card title heading",
    );
    field("category", card.category);
    field("description", card.description);
    field("price", price(card));
    field("stock", card.inStock ? "In stock" : "Out of stock");
    const tags = inner.filter((n) => attr(n, "data-bench-tags") === card.id);
    assert.equal(tags.length, 1, "one tag list");
    assert.equal(attr(tags[0], "role"), "list");
    assert.equal(attr(tags[0], "aria-label"), "Tags");
    assert.deepEqual(
      descendants(tags[0])
        .filter((n) => attr(n, "role") === "listitem")
        .map(text),
      card.tags,
      "tag order/content",
    );
    return card;
  });
  return sha256(JSON.stringify({ request, projection }));
}
// Workers validate the COMPLETE original response, including framework payload.
// An engine is admitted only if repeated requests with this same URL are byte stable.
export function createValidator({ expectedSha256 }) {
  return (buffer) =>
    assert.equal(
      sha256(buffer),
      expectedSha256,
      "response differs from parity-gated production HTML",
    );
}
