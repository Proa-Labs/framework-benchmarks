import assert from "node:assert/strict";
import type { Browser } from "playwright";

export async function verifyAnalytics(browser: Browser, serverUrl: string) {
  for (const origin of [
    serverUrl,
    "https://pr-16-frameworks-run.app-proa-mail.workers.dev",
    "https://frameworks.run",
    "https://www.frameworks.run",
  ]) {
    const context = await browser.newContext();
    const tagRequests: string[] = [];
    // Exercise the real application bootstrap without sending test traffic.
    await context.route("https://www.googletagmanager.com/**", (route) => {
      tagRequests.push(route.request().url());
      return route.fulfill({ contentType: "text/javascript", body: "" });
    });
    if (origin !== serverUrl)
      await context.route(`${origin}/**`, async (route) => {
        const url = new URL(route.request().url());
        const response = await context.request.get(
          `${serverUrl}${url.pathname}${url.search}`,
        );
        await route.fulfill({ response });
      });
    try {
      const page = await context.newPage();
      await page.goto(origin);
      await page.locator('[data-app-ready="true"]').waitFor();
      await page.waitForLoadState("networkidle");
      await page.getByRole("link", { name: "About", exact: true }).click();
      await page
        .getByRole("heading", { name: "Why frameworks.run exists" })
        .waitFor();
      await page.waitForLoadState("networkidle");
      await page
        .getByRole("link", { name: "Performance", exact: true })
        .click();
      await page.locator('[data-app-ready="true"]').waitFor();
      await page.waitForLoadState("networkidle");
      const expected =
        origin.includes("workers.dev") || origin === serverUrl ? 0 : 1;
      assert.equal(
        tagRequests.length,
        expected,
        `${origin}: one production-only tag`,
      );
      assert.equal(
        await page.locator("script[data-site-analytics]").count(),
        expected,
      );
      if (expected)
        assert.equal(
          new URL(tagRequests[0]).searchParams.get("id"),
          "GTM-WBJ9PW8K",
        );
    } finally {
      // Navigation/preloads can still cancel proxy routes during teardown.
      await context.unrouteAll({ behavior: "ignoreErrors" });
      await context.close();
    }
  }
}
