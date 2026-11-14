import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { parse, type DefaultTreeAdapterTypes as Tree } from "parse5";
import {
  date,
  headers,
  money,
  products,
  rows,
  score,
  sections,
  starPath,
  timestamp,
  titles,
  type Workload,
} from "./workloads.ts";

type Node = Tree.ChildNode | Tree.Document | Tree.DocumentFragment;
const attr = (n: Node, name: string) =>
  "attrs" in n ? n.attrs.find((a) => a.name === name)?.value : undefined;
const children = (n: Node): Node[] => ("childNodes" in n ? n.childNodes : []);
const all = (n: Node): Node[] => [n, ...children(n).flatMap(all)];
const text = (n: Node): string =>
  "value" in n ? n.value : children(n).map(text).join("");
const tag = (n: Node) => ("tagName" in n ? n.tagName : "");
const elements = (n: Node) => children(n).filter((n) => "tagName" in n);
const digest = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
export function validateWorkloadHtml(
  body: string | Buffer,
  request: string,
  workload: Workload,
) {
  const doc = all(parse(String(body))),
    roots = doc.filter((n) => attr(n, "data-bench-page") === workload);
  assert.equal(roots.length, 1, "one workload landmark");
  const root = roots[0];
  assert.equal(tag(root), "main");
  const nodes = all(root);
  assert.equal(
    nodes.some((n) => tag(n) === "script"),
    false,
    "business text must stay escaped",
  );
  assert.deepEqual(
    nodes.filter((n) => tag(n) === "h1").map(text),
    [titles[workload]],
    "page heading",
  );
  assert.deepEqual(
    nodes.filter((n) => attr(n, "data-bench-request") === "true").map(text),
    [request],
    "current URL freshness",
  );
  if (workload === "cards") {
    const groups = nodes.filter(
      (n) => attr(n, "data-bench-section") !== undefined,
    );
    assert.equal(groups.length, 4);
    groups.forEach((group, i) => {
      const expected = sections[i];
      assert.equal(attr(group, "data-bench-section"), expected.id);
      assert.deepEqual(
        all(group)
          .filter((n) => tag(n) === "h2")
          .map(text),
        [expected.title],
      );
      const articles = all(group).filter(
        (n) => attr(n, "data-bench-card") !== undefined,
      );
      assert.equal(articles.length, 8);
      articles.forEach((article, j) => {
        const card = expected.cards[j];
        assert.equal(tag(article), "article");
        assert.equal(attr(article, "data-bench-card"), card.id);
        const inside = all(article);
        assert.deepEqual(inside.filter((n) => tag(n) === "h3").map(text), [
          card.title,
        ]);
        assert.deepEqual(
          inside
            .filter((n) => attr(n, "data-bench-description") === card.id)
            .map(text),
          [card.description],
        );
        const lists = inside.filter((n) => attr(n, "role") === "list");
        assert.equal(lists.length, 1);
        assert.equal(attr(lists[0], "aria-label"), "Features");
        assert.deepEqual(
          all(lists[0])
            .filter((n) => attr(n, "role") === "listitem")
            .map(text),
          card.features,
        );
      });
    });
  } else if (workload === "products") {
    const articles = nodes.filter(
      (n) => attr(n, "data-bench-product") !== undefined,
    );
    assert.equal(articles.length, 96);
    articles.forEach((article, i) => {
      const product = products[i];
      assert.equal(tag(article), "article");
      assert.equal(attr(article, "data-bench-product"), String(product.id));
      const inside = all(article),
        parts = elements(article);
      assert.deepEqual(inside.filter((n) => tag(n) === "h2").map(text), [
        product.name,
      ]);
      assert.deepEqual(
        inside.filter((n) => tag(n) === "a").map((n) => attr(n, "href")),
        [`/products/${product.id}`],
      );
      assert.equal(text(parts[1]), product.category);
      assert.equal(text(parts[2]), money(product.priceCents));
      assert.equal(
        text(parts[3]),
        `${(product.ratingTenths / 10).toFixed(1)} (${product.reviewCount})`,
      );
      const stars = inside.filter((n) => tag(n) === "svg");
      assert.equal(stars.length, 5);
      stars.forEach((star, index) => {
        assert.equal(
          attr(star, "viewBox") ?? attr(star, "viewbox"),
          "0 0 20 20",
        );
        assert.equal(attr(star, "aria-hidden"), "true");
        assert.equal(
          attr(star, "data-filled"),
          index < Math.floor((product.ratingTenths + 5) / 10)
            ? "true"
            : "false",
        );
        assert.deepEqual(
          all(star)
            .filter((n) => tag(n) === "path")
            .map((n) => attr(n, "d")),
          [starPath],
        );
      });
    });
  } else {
    assert.deepEqual(nodes.filter((n) => tag(n) === "caption").map(text), [
      "Customer Accounts",
    ]);
    assert.deepEqual(
      nodes
        .filter((n) => tag(n) === "th")
        .map((n) => {
          assert.equal(attr(n, "scope"), "col");
          return text(n);
        }),
      headers,
    );
    const trs = nodes.filter((n) => attr(n, "data-bench-row") !== undefined);
    assert.equal(trs.length, 1000);
    trs.forEach((tr, i) => {
      const row = rows[i];
      assert.equal(tag(tr), "tr");
      assert.equal(attr(tr, "data-bench-row"), String(row.id));
      const cells = elements(tr);
      assert.equal(cells.length, 12);
      assert.ok(cells.every((n) => tag(n) === "td"));
      assert.equal(
        attr(cells[3], "data-active"),
        row.status === "Active" ? "true" : "false",
      );
      assert.deepEqual(cells.slice(0, 11).map(text), [
        String(row.id),
        row.name,
        row.email,
        row.status,
        money(row.amountCents),
        money(row.taxCents),
        money(row.amountCents + row.taxCents),
        date(row.createdUnix),
        timestamp(row.updatedUnix),
        score(row.scoreBps),
        row.country,
      ]);
      const lists = all(cells[11]).filter((n) => attr(n, "role") === "list");
      assert.equal(lists.length, 1);
      assert.equal(attr(lists[0], "aria-label"), "Tags");
      assert.deepEqual(
        all(lists[0])
          .filter((n) => attr(n, "role") === "listitem")
          .map(text),
        row.tags,
      );
    });
  }
  return digest({
    workload,
    request,
    fixture:
      workload === "cards"
        ? sections
        : workload === "products"
          ? products
          : rows,
  });
}
export function negativeControls(workload: Workload): [string, string][] {
  return workload === "cards"
    ? [
        [titles.cards, "Wrong heading"],
        ['data-bench-card="1"', 'data-bench-card="0"'],
        ['role="listitem"', 'role="presentation"'],
      ]
    : workload === "products"
      ? [
          [titles.products, "Wrong heading"],
          ['data-bench-product="1000"', 'data-bench-product="0"'],
          ['data-filled="true"', 'data-filled="false"'],
        ]
      : [
          [titles.table, "Wrong heading"],
          ['data-bench-row="100000"', 'data-bench-row="0"'],
          ['scope="col"', 'scope="row"'],
        ];
}
