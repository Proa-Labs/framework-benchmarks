// Explicit asset authoring command: bun site/generate-brand-assets.ts.
// Commit the PNGs so builds and social crawlers do not need a browser renderer.
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const browser = await chromium.launch();
try {
  for (const [source, output, width, height] of [
    [
      "data/branding/social-card.svg",
      "src/assets/frameworks-og.png",
      1200,
      630,
    ],
    ["public/favicon.svg", "public/apple-touch-icon.png", 180, 180],
  ] as const) {
    const page = await browser.newPage({
      viewport: { width, height },
      deviceScaleFactor: 1,
      colorScheme: "light",
    });
    const svg = await readFile(new URL(source, import.meta.url), "utf8");
    await page.setContent(
      `<style>html,body{margin:0;width:100%;height:100%;background:#fafbfc}svg{display:block;width:100%;height:100%}</style>${svg}`,
    );
    await page.screenshot({
      path: fileURLToPath(new URL(output, import.meta.url)),
    });
    await page.close();
  }
} finally {
  await browser.close();
}
