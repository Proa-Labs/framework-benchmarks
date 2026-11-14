import assert from "node:assert/strict";
import { createHash } from "node:crypto";

export const fixture = "exact-native-v1";
export const mode = "adapted content and styles";
const digest = (value) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");

// This is deliberately separate from strict canonicalDocument. Only Exact's
// explicitly disclosed adaptation may use this content/attribute projection.
// It does not declare different tags, classes or native wrappers DOM-identical.
export async function adaptedProjection(page, html, workload, css = "") {
  await page.setContent(html, { waitUntil: "domcontentloaded" });
  if (css) {
    assert.equal(
      await page.locator("#exact-root").count(),
      1,
      "Timed HTML must carry Exact’s generated CSS scope",
    );
    await page.addStyleTag({ content: css });
  }
  return page.evaluate(
    ({ workload, native }) => {
      const text = (e) => e?.textContent?.replace(/\s+/g, " ").trim() ?? "";
      const all = (selector, parent = document) =>
        Array.from(parent.querySelectorAll(selector));
      const styles = [];
      const check = (selector, properties, expected) => {
        for (const e of all(selector)) {
          const s = getComputedStyle(e);
          const actual = properties.map((p) => s.getPropertyValue(p));
          if (JSON.stringify(actual) !== JSON.stringify(expected))
            throw new Error(
              `Adapted CSS mismatch ${selector}: ${JSON.stringify(actual)} != ${JSON.stringify(expected)}`,
            );
          styles.push([selector, actual]);
        }
      };
      if (document.querySelector("script,iframe"))
        throw new Error("Unexpected active markup in render fixture");
      let content;
      if (workload === "cards") {
        const sections = all("main section");
        content = [
          text(document.querySelector("h1")),
          text(document.querySelector("header")?.children[1]),
          sections.map((s) => [
            s.getAttribute("data-section"),
            text(s.querySelector("h2")),
            all("article", s).map((c) => {
              const body = c.children[1],
                image = c.querySelector("img"),
                button = c.querySelector("button");
              return [
                c.getAttribute("data-card-id"),
                image?.getAttribute("src"),
                image?.getAttribute("alt"),
                text(c.querySelector("h3")),
                text(body?.children[1]),
                all(native ? '[role="listitem"]' : "li", c).map(text),
                button?.getAttribute("type"),
                text(button),
              ];
            }),
          ]),
          text(document.querySelector("footer")),
        ];
        if (native) {
          check(
            "article",
            ["border-top-width", "border-radius", "background-color"],
            ["1px", "8px", "rgb(255, 255, 255)"],
          );
          check("article img", ["height", "object-fit"], ["92px", "cover"]);
          check(
            "button",
            ["background-color", "color", "padding-top", "padding-left"],
            ["rgb(51, 65, 85)", "rgb(255, 255, 255)", "7px", "10px"],
          );
          check(
            'article [role="list"]',
            ["padding-left", "font-size"],
            ["18px", "12px"],
          );
          check(
            "main section > div",
            ["display", "column-gap"],
            ["grid", "16px"],
          );
        }
      } else if (workload === "products") {
        content = [
          text(document.querySelector("h1")),
          all('main a[href^="/products/"]').map((p) => {
            const c = p.children,
              stars = all("svg", p);
            return [
              p.getAttribute("href"),
              text(c[0]),
              text(c[1]),
              text(c[2]),
              stars.map((s) => [
                s.getAttribute("viewBox"),
                s.getAttribute("aria-hidden"),
                s.querySelector("path")?.getAttribute("d"),
                native
                  ? getComputedStyle(s).color === "rgb(251, 191, 36)"
                  : s.classList.contains("text-amber-400"),
              ]),
              text(c[3]?.children[1]),
              text(c[4]),
            ];
          }),
        ];
        if (native) {
          check(
            'main a[href^="/products/"]',
            [
              "display",
              "flex-direction",
              "padding-top",
              "border-radius",
              "border-top-color",
            ],
            ["flex", "column", "16px", "12px", "rgb(226, 232, 240)"],
          );
          check("svg", ["width", "height"], ["16px", "16px"]);
          for (const star of all("svg"))
            if (getComputedStyle(star).fill !== getComputedStyle(star).color)
              throw new Error("SVG fill must follow rating color");
          check("main > div", ["display", "column-gap"], ["grid", "16px"]);
        }
      } else {
        content = [
          text(document.querySelector("h1")),
          text(document.querySelector("header")?.children[1]),
          all("thead th").map(text),
          all("tbody tr").map((r) => [
            r.getAttribute("data-row-id"),
            all("td", r).map((c, i) =>
              i === 11 ? Array.from(c?.children || []).map(text) : text(c),
            ),
          ]),
        ];
        if (native) {
          check("td", ["padding-top", "padding-left"], ["8px", "12px"]);
          check(
            "tbody tr:nth-child(odd)",
            ["background-color"],
            ["rgb(255, 255, 255)"],
          );
          check(
            "tbody tr:nth-child(even)",
            ["background-color"],
            ["rgb(249, 250, 251)"],
          );
          check(
            "td:nth-child(5),td:nth-child(6),td:nth-child(7),td:nth-child(10)",
            ["text-align", "font-family"],
            ["right", "monospace"],
          );
          const palette = {
            Active: "rgb(220, 252, 231)",
            Pending: "rgb(254, 249, 195)",
            Disabled: "rgb(243, 244, 246)",
            Cancelled: "rgb(254, 226, 226)",
            Refunded: "rgb(243, 232, 255)",
          };
          for (const e of all("tbody td:nth-child(4) > *")) {
            if (getComputedStyle(e).backgroundColor !== palette[text(e)])
              throw new Error("Status branch/style mismatch");
            styles.push(["status", text(e)]);
          }
        }
      }
      return { content, styleChecks: styles.length };
    },
    { workload, native: !!css },
  );
}
export async function validateAdaptedFixture(
  page,
  expectedHtml,
  html,
  workload,
  css,
) {
  assert.ok(css?.length, "Retain the native generated stylesheet");
  await assert.rejects(
    () =>
      adaptedProjection(
        page,
        html.replace('id="exact-root"', 'id="missing-root"'),
        workload,
        css,
      ),
    "Removing the native CSS scope must fail",
  );
  const expected = await adaptedProjection(page, expectedHtml, workload);
  const actual = await adaptedProjection(page, html, workload, css);
  assert.deepEqual(
    actual.content,
    expected.content,
    `${workload}: adapted content/attributes/formatting differ`,
  );
  assert.ok(actual.styleChecks > 0);
  const controls = {
    cards: ["Latency Analysis", "Changed card title"],
    products: ["All products", "Changed product heading"],
    table: ["Customer Accounts", "Changed table heading"],
  };
  const [from, to] = controls[workload];
  assert.ok(html.includes(from));
  const changed = await adaptedProjection(
    page,
    html.replace(from, to),
    workload,
    css,
  );
  assert.notDeepEqual(
    changed.content,
    expected.content,
    "Adapted content negative control must fail",
  );
  await assert.rejects(
    () =>
      adaptedProjection(
        page,
        html,
        workload,
        css +
          "\n#exact-root#exact-root article,#exact-root#exact-root a,#exact-root#exact-root td{padding-top:999px!important;padding-left:999px!important;border-top-width:999px!important}",
      ),
    "Adapted CSS negative control must fail",
  );
  return {
    fixture,
    mode,
    semantics_sha256: digest(actual.content),
    reference_semantics_sha256: digest(expected.content),
    style_checks: actual.styleChecks,
    negative_controls: "pass",
  };
}
