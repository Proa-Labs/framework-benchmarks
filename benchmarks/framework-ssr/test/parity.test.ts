import { expect, test } from "bun:test";
import { cards, price } from "../fixture.mjs";
import { createValidator, sha256, validateSemanticHtml } from "../parity.mjs";

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ] ?? c,
  );
function document(request = "test") {
  return `<main data-bench-page="catalog"><h1>Product catalog</h1><div data-bench-request="true">${request}</div>${cards.map((c) => `<article data-bench-card="${c.id}"><h2 data-bench-title="${c.id}">${escapeHtml(c.title)}</h2><div data-bench-category="${c.id}">${c.category}</div><div data-bench-description="${c.id}">${escapeHtml(c.description)}</div><div data-bench-price="${c.id}">${price(c)}</div><div data-bench-stock="${c.id}">${c.inStock ? "In stock" : "Out of stock"}</div><div role="list" aria-label="Tags" data-bench-tags="${c.id}">${c.tags.map((tag) => `<div role="listitem">${escapeHtml(tag)}</div>`).join("")}</div></article>`).join("")}</main>`;
}
test("shared contract validates content, order, escaping, roles and current request", () => {
  const body = document();
  expect(validateSemanticHtml(body, "test")).toMatch(/^[a-f0-9]{64}$/);
  for (const [from, to] of [
    ["Product catalog", "Wrong"],
    ['data-bench-card="1"', 'data-bench-card="0"'],
    ["$12.99", "$00.00"],
    ['role="listitem"', 'role="presentation"'],
    ["Out of stock", "In stock"],
    ["&lt;b&gt;plain text&lt;/b&gt;", "<script>plain text</script>"],
  ]) {
    expect(() =>
      validateSemanticHtml(body.replace(from, to), "test"),
    ).toThrow();
  }
  expect(() => validateSemanticHtml(body, "stale")).toThrow();
});
test("every response is checked against the complete admitted body, including framework shell", () => {
  const body = `<!doctype html><html><body>${document()}<script>hydration</script></body></html>`;
  const validator = createValidator({ expectedSha256: sha256(body) });
  expect(() => validator(Buffer.from(body))).not.toThrow();
  expect(() =>
    validator(Buffer.from(body.replace("hydration", "changed"))),
  ).toThrow();
});
