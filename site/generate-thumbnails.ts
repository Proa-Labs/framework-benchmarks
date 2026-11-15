// Refresh the small, inert workload illustrations after changing a fixture.
// Chrome renders them here, never on a visitor's device or in the benchmark timer.
import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { fixtures } from "../benchmarks/rendering/showcase/fixture.mjs";
import { loadInputs } from "./data.ts";
import { buildPreviews, thumbnailSourceHash } from "./previews.ts";

const here = fileURLToPath(new URL(".", import.meta.url));
const target = join(here, "data/performance/thumbnails");
const temporary = await mkdtemp(join(tmpdir(), "benchmark-thumbnails-"));
const { input } = await loadInputs();
const workloads = [
  ...input.workloadManifest.workloads,
  ...fixtures.filter(
    (f) => !input.workloadManifest.workloads.some((w) => w.id === f.id),
  ),
];
await buildPreviews(temporary, input.framework, workloads, { raster: false });
// Before a new campaign exists, the strict Proa fixture also supplies its
// Framework SSR illustration. Fresh captures replace this identical source.
for (const { id } of fixtures) {
  const path = join(temporary, "previews", `framework-${id}.html`);
  if (!(await Bun.file(path).exists()))
    await writeFile(
      path,
      await readFile(join(temporary, "previews", `${id}.html`)),
    );
}
const browser = await chromium.launch({ headless: true });
try {
  await mkdir(target, { recursive: true });
  const page = await browser.newPage({
    viewport: { width: 800, height: 640 },
    deviceScaleFactor: 1,
  });
  const thumbnails: Record<string, { sourceSha256: string; file: string }> = {};
  const byHash = new Map<string, string>();
  for (const filename of (await readdir(join(temporary, "previews"))).sort()) {
    const html = await readFile(join(temporary, "previews", filename), "utf8");
    const sourceSha256 = thumbnailSourceHash(html);
    let file = byHash.get(sourceSha256);
    if (!file) {
      file = filename.replace(/\.html$/, ".webp");
      await page.setContent(html, { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      const png = await page.screenshot({
        type: "png",
        animations: "disabled",
      });
      const encoded = await page.evaluate(async (base64) => {
        const image = new Image();
        image.src = `data:image/png;base64,${base64}`;
        await image.decode();
        const canvas = document.createElement("canvas");
        canvas.width = 320;
        canvas.height = 256;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas unavailable");
        context.drawImage(image, 0, 0, 320, 256);
        return canvas.toDataURL("image/webp", 0.85).split(",")[1];
      }, png.toString("base64"));
      await writeFile(join(target, file), Buffer.from(encoded, "base64"));
      byHash.set(sourceSha256, file);
    }
    thumbnails[filename] = { sourceSha256, file };
    console.log(`${filename}: ${file}`);
  }
  const retained = new Set(
    Object.values(thumbnails).map((value) => value.file),
  );
  for (const name of await readdir(target))
    if (name.endsWith(".webp") && !retained.has(name))
      await rm(join(target, name));
  await writeFile(
    join(target, "manifest.json"),
    `${JSON.stringify({ schemaVersion: 1, thumbnails }, null, 2)}\n`,
  );
} finally {
  await browser.close();
  await rm(temporary, { recursive: true, force: true });
}
