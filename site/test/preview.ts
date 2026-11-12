import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import type { BenchmarkData } from "../benchmark-types.ts";
import { required } from "../required.ts";

// Exercise the deployed assets too: a successful upload does not prove that
// clean URLs, route chunks and production hover handlers work together.
export async function verifyPreview(url: string) {
  const browser = await chromium.launch({ headless: true });
  try {
    const initial = await browser.newPage({ javaScriptEnabled: false });
    const initialResponse = required(
      await initial.goto(new URL("/", url).href, {
        waitUntil: "domcontentloaded",
      }),
    );
    assert.equal(
      initialResponse.headers()["content-security-policy"],
      "object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
    );
    if (new URL(url).hostname.endsWith(".workers.dev"))
      // Cloudflare's version-preview layer may replace this header with
      // its own noindex value. Test the required directive, not formatting.
      assert.match(
        initialResponse.headers()["x-robots-tag"] || "",
        /(?:^|,\s*)noindex(?:,|$)/i,
      );
    assert.equal(await initial.locator('meta[name="description"]').count(), 1);
    assert.equal(
      await initial.locator('link[rel="canonical"]').getAttribute("href"),
      "https://frameworks.run/",
    );
    assert.ok(
      (await initial.locator("[data-renderer-comparison] tbody tr").count()) >
        0,
      "Preview must include benchmark results without JavaScript",
    );
    const data: BenchmarkData = await (
      await initial.request.get(new URL("/data/results.json", url).href)
    ).json();
    const table = initial.locator("[data-framework-comparison]");
    assert.equal(await initial.locator(".fw-uncaptured").count(), 0);
    assert.equal(
      await table.locator("tbody tr[data-framework-row]").count(),
      data.framework.rows.length,
    );
    for (const workload of data.framework.workloadDefinitions)
      for (const row of data.framework.workloads[workload.id]) {
        const expected = Number(row.p50).toLocaleString("en-US", {
          maximumFractionDigits: Number(row.p50) < 10 ? 2 : 1,
        });
        assert.equal(
          await table
            .locator(
              `td [data-stat-suite="framework"][data-focus="${row.id}"][data-stat-workload="${workload.id}"] .fw-comparison-value`,
            )
            .textContent(),
          expected,
          `${row.id}/${workload.id} must be in the server HTML`,
        );
      }
    await initial.goto(
      new URL("/features?group=server&display=matrix&tools=astro,nextjs", url)
        .href,
      { waitUntil: "domcontentloaded" },
    );
    assert.equal(
      await initial.locator(".fw-feature-table tbody tr:visible").count(),
      2,
      "Server must apply query-string selections",
    );
    await initial.close();
    const page = await browser.newPage();
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("response", (response) => {
      if (response.status() >= 400)
        errors.push(`${response.status()} ${response.url()}`);
    });
    await page.goto(new URL("/features", url).href);
    await page.locator('[data-app-ready="true"]').waitFor();
    await page.getByRole("button", { name: "Matrix", exact: true }).click();
    await page.locator(".fw-feature-table").waitFor({ state: "visible" });
    await page.getByRole("button", { name: "Overview", exact: true }).click();
    await page.locator(".fw-feature-overview").waitFor({ state: "visible" });
    await page.getByRole("link", { name: "Performance", exact: true }).click();
    await page
      .locator("[data-renderer-comparison]")
      .waitFor({ state: "visible" });
    await page.locator('[data-app-ready="true"]').waitFor();
    await page.locator("[data-stat-workload]").first().hover();
    await page.locator("[data-percentile-popup]").waitFor({ state: "visible" });
    for (const workload of data.framework.workloadDefinitions)
      for (const row of data.framework.workloads[workload.id]) {
        const cell = page.locator(
          `[data-framework-comparison] td [data-stat-suite="framework"][data-focus="${row.id}"][data-stat-workload="${workload.id}"]`,
        );
        await cell.hover();
        const popup = page.locator("[data-percentile-popup]");
        await popup.waitFor({ state: "visible" });
        assert.equal(
          await popup.locator(".fw-popover-unit").first().textContent(),
          "ms",
        );
        assert.match(
          required(await popup.locator(".fw-popover-scope").textContent()),
          /Full-framework HTTP request/,
        );
        const expectedPercentiles = (["p50", "p95", "p99"] as const).map(
          (q) => {
            const value = row.percentiles.equalLoad[q];
            return value.toLocaleString("en-US", {
              maximumFractionDigits: value >= 1000 ? 0 : value < 10 ? 3 : 2,
            });
          },
        );
        assert.deepEqual(
          await popup.locator(".fw-percentile-number strong").allTextContents(),
          expectedPercentiles,
        );
      }
    assert.deepEqual(errors, [], "Deployed preview has browser errors");
    console.log(
      `Verified preview routes, feature views, all framework cells without JavaScript and their hover percentiles: ${url}`,
    );
  } finally {
    await browser.close();
  }
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1])
  await verifyPreview(required(process.argv[2]));
