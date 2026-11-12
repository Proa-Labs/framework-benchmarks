import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { required } from "../required.ts";

// Exercise the deployed assets too: a successful upload does not prove that
// clean URLs, route chunks and production hover handlers work together.
export async function verifyPreview(url: string) {
  const browser = await chromium.launch({ headless: true });
  try {
    const initial = await browser.newPage({ javaScriptEnabled: false });
    await initial.goto(new URL("/", url).href, {
      waitUntil: "domcontentloaded",
    });
    assert.ok(
      (await initial.locator(".fw-comparison tbody tr").count()) > 0,
      "Preview must include benchmark results without JavaScript",
    );
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
    await page.locator(".fw-comparison").waitFor({ state: "visible" });
    await page.locator('[data-app-ready="true"]').waitFor();
    await page.locator("[data-stat-workload]").first().hover();
    await page.locator("[data-percentile-popup]").waitFor({ state: "visible" });
    assert.deepEqual(errors, [], "Deployed preview has browser errors");
    console.log(
      `Verified preview routes, feature views and hover details: ${url}`,
    );
  } finally {
    await browser.close();
  }
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1])
  await verifyPreview(required(process.argv[2]));
