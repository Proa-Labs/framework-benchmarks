import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

// Exercise the deployed assets too: a successful upload does not prove that
// clean URLs, route chunks and production hover handlers work together.
export async function verifyPreview(url) {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const errors = [];
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
  await verifyPreview(process.argv[2]);
