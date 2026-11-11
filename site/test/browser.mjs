// Optional browser regression suite for local development and CI. Manual
// desktop-app browser verification can also use the same visible controls.
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright";
import { siteRoot } from "../build.mjs";
import { startServer } from "../dev.mjs";
import { featureProjects } from "../feature-additions.mjs";
import { features } from "../feature-schema.mjs";
import { contrastRatio, readableBrand } from "../src/brand-colors.mjs";
import { sortCoverageRows } from "../src/feature-summary.mjs";

const server = await startServer({ port: 0, live: false });
const browser = await chromium.launch({ headless: true });
const errors = [];
const checks = [];
let page;
const ready = () => page.locator('[data-app-ready="true"]').waitFor();
const navigate = async (url) => {
  await page.goto(url);
  await ready();
};
const reload = async () => {
  await page.reload();
  await ready();
};

await mkdir(join(siteRoot, "test-results"), { recursive: true });
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
  });
  page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400)
      errors.push(`${response.status()} ${response.url()}`);
  });
  await navigate(`${server.url}/?chart=bars`);
  await page.locator(".fw-row").first().waitFor();
  assert.equal(await page.locator(".fw-row").count(), 17);
  const renderingInfo = page.getByRole("button", {
    name: "About SSR Rendering",
    exact: true,
  });
  await renderingInfo.hover();
  assert.equal(await page.locator("#rendering-info").isVisible(), true);
  await page.locator("#rendering-info").hover();
  assert.equal(await page.locator("#rendering-info").isVisible(), true);
  await page.locator("h1").hover();
  await page.locator("#rendering-info").waitFor({ state: "hidden" });
  await page.locator("#experiment-rendering").focus();
  await page.locator("#experiment-rendering").press("Tab");
  assert.equal(await page.locator("#rendering-info").isVisible(), true);
  await renderingInfo.press("Escape");
  assert.equal(await page.locator("#rendering-info").isVisible(), false);
  await page.screenshot({
    path: join(siteRoot, "test-results/desktop.png"),
    fullPage: true,
  });
  const initialTheme = await page.locator("html").getAttribute("data-theme");
  const toggledTheme = initialTheme === "dark" ? "light" : "dark";
  const toggle = page.getByRole("button", {
    name: "Toggle theme",
    exact: true,
  });
  await toggle.click();
  assert.equal(
    await page.locator("html").getAttribute("data-theme"),
    toggledTheme,
  );
  assert.equal(
    await toggle.getAttribute("aria-pressed"),
    String(toggledTheme === "dark"),
  );
  await reload();
  assert.equal(
    await page.locator("html").getAttribute("data-theme"),
    toggledTheme,
  );
  await page.getByRole("link", { name: "About", exact: true }).click();
  assert.equal(
    await page.locator("html").getAttribute("data-theme"),
    toggledTheme,
  );
  await page
    .getByRole("button", { name: "Toggle theme", exact: true })
    .press("Enter");
  await navigate(server.url);
  assert.equal(
    await page.locator("html").getAttribute("data-theme"),
    initialTheme,
  );
  const systemContext = await browser.newContext({ colorScheme: "light" });
  const systemPage = await systemContext.newPage();
  await systemPage.goto(server.url);
  assert.equal(
    await systemPage.locator("html").getAttribute("data-theme"),
    "light",
  );
  await systemPage.emulateMedia({ colorScheme: "dark" });
  await systemPage.waitForFunction(
    () => document.documentElement.dataset.theme === "dark",
  );
  await systemPage
    .getByRole("button", { name: "Toggle theme", exact: true })
    .click();
  await systemPage.emulateMedia({ colorScheme: "light" });
  await systemPage.emulateMedia({ colorScheme: "dark" });
  assert.equal(
    await systemPage.locator("html").getAttribute("data-theme"),
    "light",
  );
  await systemContext.close();
  await page.bringToFront();
  checks.push(
    "theme toggle, keyboard, persistence, navigation and system preference",
  );
  for (const suite of ["rendering", "http", "streaming", "startup"]) {
    await page.locator(`[data-view="${suite}"]`).click();
    if (suite === "rendering")
      await page.locator('[data-workload="cards"]').click();
    for (const chart of suite === "streaming"
      ? ["lines"]
      : ["bars", "lines", "balls", "table"]) {
      if (suite !== "streaming")
        await page.locator(`[data-chart="${chart}"]`).click();
      assert.equal(
        await page
          .locator(`[data-chart="${chart}"]`)
          .getAttribute("aria-pressed"),
        "true",
      );
      assert.ok(
        (await page.locator("[data-results]").textContent()).length > 0 ||
          (await page.locator(".fw-chart").count()) > 0,
      );
      checks.push(`${suite}/${chart}`);
    }
  }
  await page.locator('[data-view="http"]').click();
  await page.locator('[data-chart="bars"]').click();
  await page.locator("[data-http-view]").selectOption("waterfall");
  assert.match(
    await page.locator("[data-chart-note]").textContent(),
    /waterfall/,
  );
  await page.locator("[data-http-view]").selectOption("breakdown");
  assert.match(
    await page.locator("[data-results]").textContent(),
    /not separated/,
  );
  await page.getByRole("link", { name: "About", exact: true }).click();
  assert.equal(await page.getByRole("heading", { level: 1 }).count(), 1);
  assert.equal(
    new URL(
      await page
        .locator('.fw-top-actions [aria-current="page"]')
        .getAttribute("href"),
      page.url(),
    ).pathname,
    "/about",
  );
  assert.equal(
    await page.locator('.fw-sections a[href="/features"]').count(),
    1,
  );
  await navigate(server.url);
  await page.locator('[data-view="streaming"]').click();
  assert.equal(await page.locator(".fw-stream-panel").count(), 2);
  assert.equal(await page.locator("[data-load-points]").isVisible(), false);
  await page.locator("[data-stream-view]").selectOption("throughput");
  await page.locator('[data-view="rendering"]').click();
  assert.equal(await page.locator(".fw-comparison").count(), 1);
  assert.equal(
    await page.locator('[data-chart="compare"]').getAttribute("aria-pressed"),
    "true",
  );
  await page.locator('[data-workload="cards"]').click();
  await page.locator('[data-chart="bars"]').click();
  await page.locator('[data-view="streaming"]').click();
  assert.equal(await page.locator(".fw-view-switch").isVisible(), false);
  assert.equal(
    await page.locator("[data-stream-view]").inputValue(),
    "throughput",
  );
  await page.locator('[data-view="rendering"]').click();
  assert.equal(
    await page.locator('[data-workload="cards"]').getAttribute("aria-pressed"),
    "true",
  );
  assert.equal(
    await page.locator('[data-chart="bars"]').getAttribute("aria-pressed"),
    "true",
  );
  assert.equal(await page.locator(".fw-row").count(), 17);
  await reload();
  assert.equal(
    await page.locator('[data-workload="cards"]').getAttribute("aria-pressed"),
    "true",
  );
  assert.equal(
    await page.locator('[data-chart="bars"]').getAttribute("aria-pressed"),
    "true",
  );
  checks.push(
    "experiment tabs restore their own workload, chart and load without leaking state",
  );
  await navigate(server.url);
  await page.locator('[data-section="ecosystem"]').click();
  assert.equal(
    await page.locator(".fw-catalog-row").count(),
    20 + featureProjects.length,
  );
  await navigate(
    `${server.url}/?view=http&chart=table&workload=table&http=rss&selected=react,marko`,
  );
  assert.equal(await page.locator(".fw-data-table tbody tr").count(), 2);
  assert.equal(await page.locator("[data-http-view]").inputValue(), "rss");
  await page.getByText("Method & data", { exact: true }).click();
  const exported = await page.locator("[data-json]").getAttribute("href");
  const decoded = JSON.parse(
    decodeURIComponent(exported.split(",").slice(1).join(",")),
  );
  assert.deepEqual(
    new Set(decoded.rows.map((r) => r.id)),
    new Set(["react", "marko"]),
  );
  for (const width of [360, 390, 768]) {
    await page.setViewportSize({ width, height: 1000 });
    await navigate(`${server.url}/?chart=bars`);
    await page.locator(".fw-row").first().waitFor();
    const size = await page.evaluate(() => ({
      viewport: innerWidth,
      content: document.documentElement.scrollWidth,
    }));
    assert.ok(
      size.content <= size.viewport + 1,
      `${width}px viewport overflows: ${size.content}`,
    );
    await page.screenshot({
      path: join(siteRoot, `test-results/mobile-${width}.png`),
      fullPage: true,
    });
    checks.push(`responsive/${width}`);
  }
  await navigate(server.url);
  assert.equal(
    await page.locator(".fw-comparison tbody tr:not(.fw-uncaptured)").count(),
    17,
  );
  assert.equal(
    await page
      .locator(".fw-comparison tbody tr:not(.fw-uncaptured) td")
      .count(),
    51,
  );
  await page.locator('[data-sort-workload="table"]').click();
  assert.equal(
    await page
      .locator('[data-sort-workload="table"]')
      .locator("..")
      .getAttribute("aria-sort"),
    "ascending",
  );
  const comparisonExport = JSON.parse(
    decodeURIComponent(
      (await page.locator("[data-json]").getAttribute("href"))
        .split(",")
        .slice(1)
        .join(","),
    ),
  );
  assert.equal(comparisonExport.workload, "all");
  assert.equal(comparisonExport.rows.length, 51);
  assert.deepEqual(
    new Set(comparisonExport.rows.map((r) => r.workload)),
    new Set(["cards", "products", "table"]),
  );
  await page.locator('[data-workload="products"]').click();
  assert.equal(await page.locator(".fw-row").count(), 17);
  await page.locator('[data-workload="cards"]').click();
  assert.equal(await page.locator(".fw-row").count(), 17);
  checks.push(
    "all-workload comparison, column sorting, complete exports and direct workload switching",
  );
  await page
    .getByRole("button", { name: "All workloads", exact: true })
    .click();
  assert.equal(await page.locator(".fw-uncaptured").count(), 4);
  assert.match(
    await page
      .locator(".fw-uncaptured")
      .allTextContents()
      .then((rows) => rows.join(" ")),
    /SvelteKit/,
  );
  await page.locator('[data-type="frameworks"]').click();
  assert.equal(await page.locator('[data-type="baselines"]').count(), 0);
  assert.equal(await page.locator(".fw-uncaptured").count(), 0);
  const filtered = JSON.parse(
    decodeURIComponent(
      (await page.locator("[data-json]").getAttribute("href"))
        .split(",")
        .slice(1)
        .join(","),
    ),
  );
  assert.deepEqual(filtered.toolTypes, ["templates"]);
  assert.equal(new Set(filtered.rows.map((r) => r.id)).size, 8);
  assert.ok(filtered.rows.some((r) => r.id === "php"));
  assert.ok(filtered.rows.some((r) => r.id === "go-html-template"));
  await reload();
  assert.equal(
    await page.locator('[data-type="frameworks"]').isChecked(),
    false,
  );
  await page
    .getByRole("button", { name: "Preview Component page", exact: true })
    .click();
  assert.equal(
    await page.locator(".fw-fixture-dialog").evaluate((el) => el.open),
    true,
  );
  assert.equal(
    await page.locator("[data-fixture-frame]").getAttribute("src"),
    "previews/cards.html",
  );
  await page
    .getByRole("button", { name: "Close workload preview", exact: true })
    .press("Escape");
  assert.equal(
    await page.locator(".fw-fixture-dialog").evaluate((el) => el.open),
    false,
  );
  checks.push(
    "type filters, URL persistence, explicit unmeasured entries and real fixture preview",
  );
  await page.setViewportSize({ width: 1200, height: 1000 });
  await navigate(`${server.url}/?view=streaming&log=true`);
  assert.equal(
    await page.getByRole("group", { name: "Chart scale", exact: true }).count(),
    0,
  );
  assert.equal(
    await page.locator(".fw-chart text").filter({ hasText: /^0 s$/ }).count(),
    2,
  );
  assert.equal(await page.locator(".fw-stream-panel").count(), 2);
  assert.equal(await page.locator("[data-load-points]").isVisible(), false);
  assert.equal(await page.locator(".fw-view-switch").isVisible(), false);
  const streamingExport = JSON.parse(
    decodeURIComponent(
      (await page.locator("[data-json]").getAttribute("href"))
        .split(",")
        .slice(1)
        .join(","),
    ),
  );
  const measuredSeries = await page
    .locator('[data-completion-panel="P50"] [data-series]')
    .count();
  assert.equal(streamingExport.rows.length, measuredSeries * 8 * 2);
  assert.deepEqual(
    new Set(streamingExport.rows.map((r) => r.metric)),
    new Set(["completeP50", "completeP99"]),
  );
  checks.push(
    "paired P50/P99 load curves, linear-only scales and complete exports",
  );
  for (const legacyChart of ["balls", "bars", "table"]) {
    await navigate(
      `${server.url}/?view=streaming&chart=${legacyChart}&rate=3000`,
    );
    assert.equal(await page.locator(".fw-view-switch").isVisible(), false);
    assert.equal(await page.locator("[data-load-points]").isVisible(), false);
    assert.equal(await page.locator(".fw-stream-panel").count(), 2);
  }
  checks.push(
    "streaming is load-curve-only and legacy chart links recover safely",
  );
  await navigate(`${server.url}/?chart=bars`);
  const miniature = await page
    .locator(".fw-workload-thumb iframe")
    .first()
    .elementHandle();
  await page.locator('[data-workload="products"]').click();
  assert.equal(await miniature.evaluate((el) => el.isConnected), true);
  const firstRow = page.locator(".fw-row").first();
  const before = await firstRow.boundingBox();
  await firstRow.hover();
  const popupBefore = await page
    .locator("[data-percentile-popup]")
    .boundingBox();
  await firstRow.click();
  const after = await firstRow.boundingBox();
  assert.deepEqual(after, before);
  assert.deepEqual(
    await page.locator("[data-percentile-popup]").boundingBox(),
    popupBefore,
  );
  assert.equal(await page.locator("[data-percentile-popup]").isVisible(), true);
  checks.push("workload iframe identity and stable row/popover geometry");
  await firstRow.press("Escape");
  const jte = page.locator('.fw-row[data-focus="jte"]');
  await jte.hover();
  const colors = await jte.evaluate((el) => {
    const color = getComputedStyle(el).color;
    return {
      color,
      label: getComputedStyle(el.querySelector(".fw-renderer")).color,
      value: getComputedStyle(el.querySelector(".fw-number")).color,
      logo: getComputedStyle(el.querySelector(".fw-logo-mark"), "::after")
        .backgroundColor,
      logoOpacity: getComputedStyle(
        el.querySelector(".fw-logo-mark"),
        "::after",
      ).opacity,
      box: getComputedStyle(el.querySelector(".fw-box")).borderColor,
      median: getComputedStyle(el.querySelector(".fw-median")).backgroundColor,
    };
  });
  assert.equal(colors.logoOpacity, "1");
  for (const key of ["label", "value", "logo", "box", "median"])
    assert.equal(colors[key], colors.color);
  checks.push("row label, value, logo and boxplot share the hover color");
  await page
    .getByRole("button", { name: "All workloads", exact: true })
    .click();
  for (const workload of ["cards", "products", "table"]) {
    const cell = page.locator(
      `[data-focus="askama"][data-stat-workload="${workload}"]`,
    );
    await cell.hover();
    assert.equal(
      await page.locator("[data-percentile-popup]").isVisible(),
      true,
    );
    const expected = await page.evaluate(async (workload) => {
      const data = await (await fetch("/data/results.json")).json();
      return data.rendering.rows[workload].find((r) => r.id === "askama");
    }, workload);
    assert.deepEqual(
      await page
        .locator(".fw-percentile-number .fw-popover-unit")
        .allTextContents(),
      ["µs", "µs", "µs"],
    );
    assert.equal(await page.locator(".fw-popover-heading > span").count(), 0);
    const shown = await page
      .locator(".fw-percentile-value strong")
      .allTextContents();
    for (const [index, percentile] of ["p50", "p95", "p99"].entries())
      assert.ok(
        Math.abs(
          Number(shown[index].replaceAll(",", "")) - expected[percentile],
        ) < 0.01,
      );
  }
  const comparisonCell = page.locator(
    '[data-focus="askama"][data-stat-workload="table"]',
  );
  const comparisonTip = await page
    .locator("[data-percentile-popup]")
    .boundingBox();
  await comparisonCell.click();
  assert.deepEqual(
    await page.locator("[data-percentile-popup]").boundingBox(),
    comparisonTip,
  );
  await page
    .locator('[data-focus="sailfish"][data-stat-workload="products"]')
    .hover();
  assert.equal(
    await page.locator(".fw-popover-title").textContent(),
    "Sailfish",
  );
  assert.match(
    await page.locator(".fw-popover-scope").textContent(),
    /Product grid/,
  );
  await comparisonCell.press("Escape");
  assert.equal(
    await page.locator("[data-percentile-popup]").isVisible(),
    false,
  );
  await comparisonCell.press("Shift+Tab");
  assert.equal(await page.locator("[data-percentile-popup]").isVisible(), true);
  checks.push(
    "comparison cells show their own workload percentiles on hover and keyboard focus without click shifts",
  );
  await page.locator('[data-view="framework"]').click();
  await page.locator('[data-chart="bars"]').click();
  assert.equal(await page.locator(".fw-row").count(), 4);
  assert.equal(
    await page.locator("[data-framework-view]").inputValue(),
    "throughput",
  );
  await page.locator("[data-framework-view]").selectOption("p99");
  assert.match(
    await page.locator("[data-heading]").textContent(),
    /equal-load P99/,
  );
  for (const chart of ["lines", "table"]) {
    await page.locator(`[data-chart="${chart}"]`).click();
    assert.equal(
      await page
        .locator(`[data-chart="${chart}"]`)
        .getAttribute("aria-pressed"),
      "true",
    );
  }
  await page
    .getByRole("button", { name: "Preview 32-card catalog", exact: true })
    .click();
  await page
    .frameLocator("[data-fixture-frame]")
    .locator("[data-bench-card]")
    .nth(31)
    .waitFor();
  assert.equal(
    await page
      .frameLocator("[data-fixture-frame]")
      .locator("[data-bench-card]")
      .count(),
    32,
  );
  await page
    .getByRole("button", { name: "Close workload preview", exact: true })
    .click();
  checks.push(
    "separate full-framework suite with measured rows, metrics and admitted catalog preview",
  );
  await navigate(`${server.url}/features`);
  const featureData = await page.evaluate(async () =>
    (await fetch("/data/features.json")).json(),
  );
  const expectedOrder = sortCoverageRows(
    featureData.rows,
    "all",
    "support",
    "desc",
  ).map((row) => row.id);
  const actualOrder = () =>
    page
      .locator("[data-feature-summary-row]")
      .evaluateAll((nodes) =>
        nodes
          .filter((node) => !node.hidden)
          .map((node) => node.dataset.featureSummaryRow),
      );
  assert.deepEqual(await actualOrder(), expectedOrder);
  const visibleTotals = () =>
    page
      .locator(
        "[data-feature-summary-row]:visible [data-feature-summary-total]",
      )
      .allTextContents()
      .then((values) =>
        values.map((value) => Number(value.split("/")[0].trim())),
      );
  const assertCoverageGeometry = async () => {
    const rows = await page
      .locator("[data-feature-summary-row]:visible")
      .evaluateAll((nodes) =>
        nodes.map((node) => {
          const bar = node.querySelector(".fw-coverage-bar");
          const segments = [...bar.querySelectorAll("[data-coverage]")];
          const [supported, total] = node
            .querySelector("[data-feature-summary-total]")
            .textContent.split("/")
            .map(Number);
          return {
            id: node.dataset.featureSummaryRow,
            supported,
            total,
            fullWidth: bar.getBoundingClientRect().width,
            filledWidth: segments.reduce(
              (sum, segment) => sum + segment.getBoundingClientRect().width,
              0,
            ),
            states: segments.map((segment) => segment.dataset.coverage),
          };
        }),
      );
    for (const row of rows) {
      assert.ok(
        Math.abs(
          row.filledWidth - (row.fullWidth * row.supported) / row.total,
        ) < 1,
        `bar length matches ${row.id} supported count`,
      );
      assert.ok(
        row.states.every((state) =>
          ["native", "official", "community"].includes(state),
        ),
      );
    }
    for (let index = 1; index < rows.length; index++)
      assert.ok(
        rows[index].filledWidth <= rows[index - 1].filledWidth + 1,
        "bar lengths follow descending totals",
      );
  };
  await assertCoverageGeometry();
  const descendingTotals = await visibleTotals();
  assert.deepEqual(
    descendingTotals,
    [...descendingTotals].sort((a, b) => b - a),
  );
  for (const row of featureData.rows) {
    const supported = Object.values(row.capabilities).filter((cell) =>
      ["native", "official", "community"].includes(cell.status),
    ).length;
    assert.equal(
      Number(
        (
          await page
            .locator(`[data-feature-summary-total="${row.id}"]`)
            .textContent()
        )
          .split("/")[0]
          .trim(),
      ),
      supported,
    );
  }
  await page
    .getByRole("button", { name: "What counts as supported?", exact: true })
    .focus();
  assert.equal(await page.locator("#supported-definition").isVisible(), true);
  await page
    .getByRole("button", { name: "What counts as supported?", exact: true })
    .press("Tab");

  assert.equal(await page.locator(".fw-feature-selection").isVisible(), false);
  assert.equal(await page.locator("[data-feature-summary-context]").count(), 0);
  const featureRow = page.locator('[data-feature-summary-row="nuxt"]');
  await featureRow.hover();
  const featureColors = await featureRow.evaluate((el) => ({
    brand: getComputedStyle(el).color,
    title: getComputedStyle(el.querySelector(".fw-coverage-project")).color,
    total: getComputedStyle(el.querySelector(".fw-coverage-total")).color,
    logo: getComputedStyle(el.querySelector(".fw-logo-mark"), "::after")
      .backgroundColor,
    opacity: getComputedStyle(el.querySelector(".fw-logo-mark"), "::after")
      .opacity,
  }));
  assert.equal(featureColors.title, featureColors.brand);
  assert.equal(featureColors.total, featureColors.brand);
  assert.equal(featureColors.logo, featureColors.brand);
  assert.equal(featureColors.opacity, "1");
  const brandAudit = [];
  const cssHex = (value) =>
    `#${value
      .match(/[\d.]+/g)
      .slice(0, 3)
      .map((channel) =>
        Math.round(Number(channel) * (value.startsWith("color(srgb") ? 255 : 1))
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")}`;
  for (const theme of ["light", "dark"]) {
    if ((await page.locator("html").getAttribute("data-theme")) !== theme)
      await page
        .getByRole("button", { name: "Toggle theme", exact: true })
        .click();
    for (const row of featureData.rows) {
      const target = page.locator(`[data-feature-summary-row="${row.id}"]`);
      const segmentColors = await target
        .locator("[data-coverage]")
        .evaluateAll((nodes) =>
          nodes.map((node) => getComputedStyle(node).backgroundColor),
        );
      await target.locator("[data-feature-profile]").hover();
      const colors = await target.evaluate((el) => ({
        row: getComputedStyle(el).color,
        background: getComputedStyle(el).backgroundColor,
        name: getComputedStyle(el.querySelector(".fw-coverage-project")).color,
        total: getComputedStyle(el.querySelector(".fw-coverage-total")).color,
        denominator: getComputedStyle(
          el.querySelector(".fw-coverage-total small"),
        ).color,
        logo: getComputedStyle(el.querySelector(".fw-logo-mark"), "::after")
          .backgroundColor,
        maskOpacity: getComputedStyle(
          el.querySelector(".fw-logo-mark"),
          "::after",
        ).opacity,
        imageOpacity: getComputedStyle(el.querySelector(".fw-logo")).opacity,
        loaded: el.querySelector(".fw-logo").naturalWidth > 0,
      }));
      for (const part of ["name", "total", "denominator", "logo"])
        assert.equal(colors[part], colors.row, `${row.id}/${theme}/${part}`);
      assert.equal(colors.maskOpacity, "1");
      assert.equal(colors.imageOpacity, "0");
      assert.equal(colors.loaded, true, `${row.id} logo loaded`);
      const actual = cssHex(colors.row);
      const expected =
        row.color === "var(--fw-fg)"
          ? theme === "light"
            ? "#202630"
            : "#efeff1"
          : readableBrand(row.color, theme === "light" ? "#eaf0f7" : "#0e1116");
      assert.equal(actual, expected, `${row.id}/${theme} palette`);
      const contrast = contrastRatio(actual, cssHex(colors.background));
      assert.ok(contrast >= 4.5, `${row.id}/${theme} contrast ${contrast}`);
      assert.deepEqual(
        await target
          .locator("[data-coverage]")
          .evaluateAll((nodes) =>
            nodes.map((node) => getComputedStyle(node).backgroundColor),
          ),
        segmentColors,
        "support-state colors remain stable",
      );
      await page.locator("h1").hover();
      await target.locator("[data-feature-profile]").focus();
      assert.equal(
        await target.evaluate((el) => getComputedStyle(el).color),
        colors.row,
        `${row.id}/${theme} keyboard highlight`,
      );
      for (const segment of await target.locator("[data-coverage]").all()) {
        await segment.hover();
        const segmentStyle = await segment.evaluate((el) => ({
          color: getComputedStyle(el).color,
          background: getComputedStyle(el).backgroundColor,
          filter: getComputedStyle(el).filter,
        }));
        assert.equal(
          segmentStyle.filter,
          "none",
          "hover keeps support labels readable",
        );
        assert.ok(
          contrastRatio(
            cssHex(segmentStyle.color),
            cssHex(segmentStyle.background),
          ) >= 4.5,
          `${row.id}/${theme} segment label contrast`,
        );
      }
      brandAudit.push({
        id: row.id,
        theme,
        sourceColor: row.color,
        hoverColor: actual,
        contrast,
      });
    }
  }
  await writeFile(
    join(siteRoot, "test-results/brand-hover-audit.json"),
    JSON.stringify(brandAudit, null, 2),
  );
  checks.push(
    "all 27 brand highlights in both themes: hover, keyboard focus, logo masks and text contrast",
  );
  for (const width of [751, 390, 1440]) {
    await page.setViewportSize({ width, height: 1100 });
    const headingCenters = await page
      .locator(".fw-coverage-head")
      .evaluate((el) =>
        [
          ...el.querySelectorAll(
            "[data-coverage-sort], .fw-coverage-help > button",
          ),
        ].map((node) => {
          const rect = node.getBoundingClientRect();
          return { center: rect.top + rect.height / 2, height: rect.height };
        }),
      );
    for (const heading of headingCenters) {
      assert.ok(
        Math.abs(heading.center - headingCenters[0].center) <= 1,
        `heading center at ${width}px`,
      );
      assert.equal(heading.height, 30);
    }
  }
  await page.locator('[data-coverage-sort="support"]').click();
  assert.deepEqual(
    await actualOrder(),
    sortCoverageRows(featureData.rows, "all", "support", "asc").map(
      (row) => row.id,
    ),
  );
  await reload();
  assert.equal(
    await page
      .locator('[data-coverage-sort="support"]')
      .locator("..")
      .getAttribute("aria-sort"),
    "ascending",
  );
  const ascendingTotals = await visibleTotals();
  assert.deepEqual(
    ascendingTotals,
    [...ascendingTotals].sort((a, b) => a - b),
  );
  await page.locator('[data-coverage-sort="supported"]').click();
  const supportedTotals = await visibleTotals();
  assert.deepEqual(
    supportedTotals,
    [...supportedTotals].sort((a, b) => b - a),
  );
  await page
    .locator('[data-feature-summary-row="php"] [data-feature-profile]')
    .click();
  const profile = page.locator(".fw-feature-dialog");
  assert.equal(await profile.isVisible(), true);
  assert.equal(await profile.locator(".fw-feature-detail[open]").count(), 0);
  assert.equal(
    await profile.locator(".fw-feature-detail").count(),
    features.filter((feature) => feature.group === "rendering").length,
  );
  const streamingFinding = profile
    .locator(".fw-feature-detail")
    .filter({ hasText: "HTML streaming" });
  await streamingFinding.locator(":scope > summary").click();
  assert.equal(
    await streamingFinding
      .getByRole("link", { name: "Source", exact: false })
      .isVisible(),
    true,
  );
  await streamingFinding.getByText("What we compare", { exact: true }).click();
  assert.equal(
    await streamingFinding.locator(".fw-feature-definition p").isVisible(),
    true,
  );
  await profile.locator('[data-profile-category="database"]').click();
  assert.equal(
    await profile.locator(".fw-feature-detail").count(),
    features.filter((feature) => feature.group === "database").length,
  );
  assert.equal(
    await profile
      .locator('[data-profile-category="database"]')
      .getAttribute("aria-pressed"),
    "true",
  );
  for (const width of [390, 751, 1440]) {
    await page.setViewportSize({ width, height: 935 });
    const geometry = await profile.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return {
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
        width: el.clientWidth,
        scroll: el.scrollWidth,
      };
    });
    assert.ok(geometry.left >= 0 && geometry.right <= width);
    assert.ok(geometry.top >= 0 && geometry.bottom <= 935);
    assert.ok(
      geometry.scroll <= geometry.width + 1,
      "profile has no horizontal overflow",
    );
  }
  await profile.getByRole("button", { name: "Close feature details" }).click();
  assert.equal(await profile.isVisible(), false);
  await page
    .locator('[data-feature-summary-row="php"] [data-feature-profile]')
    .click();
  await profile.press("Escape");
  assert.equal(await profile.isVisible(), false);
  checks.push(
    "compact feature profiles, category navigation, expandable evidence and responsive dialog bounds",
  );
  await page.locator('[data-feature-group="database"]').click();
  await assertCoverageGeometry();
  await page.locator('[data-feature-display="matrix"]').click();
  await page.locator('[data-feature-cell="rails/orm"]').click();
  assert.equal(await page.locator(".fw-feature-dialog").isVisible(), true);
  assert.match(
    await page.locator(".fw-feature-detail-status").textContent(),
    /Built-in/,
  );
  await page.locator(".fw-feature-dialog").press("Escape");
  await page.locator('[data-feature-group="accessibility"]').click();
  assert.equal(
    await page.locator("thead [data-feature-column]:visible").count(),
    2,
  );
  await page.locator('[data-feature-cell="proa/a11yChecks"]').click();
  assert.match(
    await page.locator(".fw-feature-dialog").textContent(),
    /Compile-time checks/,
  );
  assert.match(
    await page.locator(".fw-feature-dialog").textContent(),
    /2026-11-11/,
  );
  await page.locator(".fw-feature-dialog").press("Escape");
  await page.locator('[data-feature-group="security"]').click();
  await page.locator('[data-feature-cell="rails/htmlSanitization"]').click();
  assert.match(
    await page.locator(".fw-feature-detail-status").textContent(),
    /Built-in/,
  );
  await page.locator(".fw-feature-dialog").press("Escape");
  checks.push(
    "expanded accessibility and security categories expose dated, sourced findings",
  );
  await navigate(`${server.url}/features?tools=solid,solidstart`);
  assert.equal(await page.locator(".fw-feature-selection").isVisible(), true);
  assert.equal(await page.locator("[data-tool-remove]").count(), 2);
  assert.equal(
    await page.locator("[data-feature-summary-row]:visible").count(),
    2,
  );
  await navigate(
    `${server.url}/features?group=rendering&display=matrix&tools=exact,nuxt`,
  );
  await page.locator('[data-feature-cell="exact/suspense"]').click();
  assert.match(
    await page.locator(".fw-feature-detail-status").textContent(),
    /Not documented/,
  );
  await page.locator(".fw-feature-dialog").press("Escape");
  assert.match(
    await page.locator('[data-feature-cell="nuxt/streaming"]').textContent(),
    /Experimental SSR streaming/,
  );
  assert.doesNotMatch(
    await page.locator(".fw-feature-table").textContent(),
    /See note/,
  );
  checks.push(
    "feature-only roster, qualified evidence, default support sorting, URL persistence, chips and branded hover",
  );
  // Internal links retain the document and React state; route effects must
  // dispose chart listeners before mounting a new performance explorer.
  await page.evaluate(() => {
    window.reactNavigationProbe = "retained";
  });
  await page.getByRole("link", { name: "About", exact: true }).click();
  await page
    .getByRole("heading", { name: "Why frameworks.run exists", exact: true })
    .waitFor();
  await ready();
  assert.equal(await page.title(), "Why frameworks.run exists · Frameworks");
  await page.getByRole("link", { name: "Features", exact: true }).click();
  await page.locator("#feature-comparison").waitFor();
  await ready();
  assert.equal(await page.title(), "Features · Frameworks");
  for (let mount = 0; mount < 2; mount++) {
    await page.getByRole("link", { name: "Performance", exact: true }).click();
    await page.locator("#experiment-rendering").waitFor();
    await ready();
    assert.equal(await page.locator(".fw-comparison tbody tr").count(), 21);
    await page.locator(".fw-comparison tbody tr").first().hover();
    await page.locator("[data-percentile-popup]").waitFor({ state: "visible" });
    await page.getByRole("link", { name: "Features", exact: true }).click();
    await page.locator("#feature-comparison").waitFor();
    await ready();
  }
  assert.equal(
    await page.evaluate(() => window.reactNavigationProbe),
    "retained",
  );
  checks.push(
    "React routes preserve the document, page titles and remounted chart hover behavior",
  );
  const reduced = await browser.newContext({ reducedMotion: "reduce" });
  const reducedPage = await reduced.newPage();
  await reducedPage.goto(`${server.url}/?chart=balls`);
  await reducedPage.locator('[data-app-ready="true"]').waitFor();
  assert.equal(await reducedPage.locator("[data-play]").isDisabled(), true);
  await reduced.close();
  assert.deepEqual(errors, []);
  await writeFile(
    join(siteRoot, "test-results/browser.json"),
    JSON.stringify({ checks, errors }, null, 2),
  );
  console.log(
    `Passed ${checks.length} browser scenarios, exports, URL state, About, and reduced motion.`,
  );
  await context.close();
} catch (error) {
  if (page && !page.isClosed()) {
    await writeFile(
      join(siteRoot, "test-results/failure.json"),
      JSON.stringify(
        {
          url: page.url(),
          checks,
          errors,
          error: error.message,
          rendering: await page
            .locator('[data-view="rendering"]')
            .evaluateAll((nodes) =>
              nodes.map((node) => ({
                html: node.outerHTML,
                rect: node.getBoundingClientRect().toJSON(),
                display: getComputedStyle(node).display,
                visibility: getComputedStyle(node).visibility,
              })),
            ),
        },
        null,
        2,
      ),
    );
    try {
      await page.screenshot({
        path: join(siteRoot, "test-results/failure.png"),
        fullPage: true,
        timeout: 5000,
      });
    } catch {
      /* A rendering failure must not hide the original test error. */
    }
  }
  throw error;
} finally {
  await browser.close();
  await server.close();
}
