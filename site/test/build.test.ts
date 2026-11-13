import { test } from "bun:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Manifest } from "vite";
import { buildSite, outputDirectory } from "../build.ts";
import { loadInputs } from "../data.ts";
import { startServer } from "../dev.ts";
import { required } from "../required.ts";

test("build preserves source bytes, emits provenance and serves a self-contained site", async () => {
  const { data } = await buildSite();
  const { buffers } = await loadInputs();
  const manifest = JSON.parse(
    await readFile(join(outputDirectory, "data/manifest.json"), "utf8"),
  );
  for (const [id, original] of Object.entries(buffers)) {
    const copied = await readFile(
      join(outputDirectory, "data/captures", `${id}.json`),
    );
    assert.deepEqual(copied, original);
    assert.equal(
      createHash("sha256").update(copied).digest("hex"),
      manifest.captures[id].artifactSha256,
    );
  }
  const server = await startServer({ port: 0, live: false, build: false });
  try {
    const initialResponse = await fetch(server.url);
    assert.equal(initialResponse.status, 200);
    assert.equal(
      initialResponse.headers.get("x-content-type-options"),
      "nosniff",
    );
    assert.equal(
      initialResponse.headers.get("x-robots-tag"),
      "noindex, nofollow",
    );
    assert.equal(
      initialResponse.headers.get("content-security-policy"),
      "object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
    );
    const index = await initialResponse.text();
    assert.match(index, /name="description"/);
    assert.match(index, /rel="canonical" href="https:\/\/frameworks.run\/"/);
    const fixtureResponse = await fetch(
      `${server.url}/previews/framework-cards.html`,
    );
    assert.equal(
      fixtureResponse.headers.get("content-security-policy"),
      null,
      "Static fixture must remain embeddable",
    );
    const viteManifest: Manifest = JSON.parse(
      await readFile(join(outputDirectory, ".vite/manifest.json"), "utf8"),
    );
    const entry = required(
      Object.values(viteManifest).find((entry) => entry.isEntry),
    );
    assert.equal(entry.isEntry, true);
    assert.match(entry.file, /^assets\/index-[\w-]+\.js$/);
    const versionedAssets = Object.values(viteManifest)
      .flatMap((asset) => [asset.file, ...(asset.css || [])])
      .filter(Boolean)
      .map((asset) => `/${asset}`);
    assert.ok(index.includes(`src="/${entry.file}"`));
    const cssAssets = Object.values(viteManifest).filter((asset) =>
      asset.file.endsWith(".css"),
    );
    assert.ok(cssAssets.length > 0);
    for (const css of cssAssets)
      assert.ok(index.includes(`href="/${css.file}"`));
    const generatedData = JSON.parse(
      await readFile(join(outputDirectory, "data/results.json"), "utf8"),
    );
    assert.deepEqual(generatedData, data);
    assert.doesNotMatch(
      index,
      /cdn\.jsdelivr|window\.openai|independent research/i,
    );
    assert.match(index, /href="https:\/\/github\.com\/Proa-Labs"/);
    assert.match(index, /href="\/features"/);
    assert.ok(
      index.indexOf("data-initial-theme") <
        index.indexOf("data-theme-bootstrap"),
    );
    assert.ok(index.indexOf("data-theme-bootstrap") < index.indexOf("</head>"));
    assert.doesNotMatch(index, /<script src="theme\.js/);
    const cardsPreview = await readFile(
      join(outputDirectory, "previews/cards.html"),
      "utf8",
    );
    const productsPreview = await readFile(
      join(outputDirectory, "previews/products.html"),
      "utf8",
    );
    const tablePreview = await readFile(
      join(outputDirectory, "previews/table.html"),
      "utf8",
    );
    assert.equal((cardsPreview.match(/data-card-id=/g) ?? []).length, 32);
    assert.equal(
      (productsPreview.match(/href="\/products\//g) ?? []).length,
      96,
    );
    assert.equal(
      (
        tablePreview.match(/<tbody>[\s\S]*?<\/tbody>/)?.[0].match(/<tr[ >]/g) ??
        []
      ).length,
      1000,
    );
    const legacyFeatures = await fetch(
      `${server.url}/features.html?group=server&display=matrix`,
      { redirect: "manual" },
    );
    assert.equal(legacyFeatures.status, 301);
    assert.equal(
      legacyFeatures.headers.get("location"),
      "/features?group=server&display=matrix",
    );
    for (const path of [
      "/",
      ...versionedAssets,
      "/favicon.svg",
      "/licenses/devicon.txt",
      "/licenses/simple-icons.txt",
      "/logos/sources.json",
      "/previews/cards.html",
      "/previews/products.html",
      "/previews/table.html",
      "/previews/framework-cards.html",
      "/previews/framework-products.html",
      "/previews/framework-table.html",
      "/about.html",
      "/methodology.html",
      "/features.html",
      "/features",
      "/data/features.json",
      "/data/results.json",
      "/data/manifest.json",
      ...data.renderers.map((r) => `/${r.logo}`),
    ]) {
      const response = await fetch(server.url + path);
      assert.equal(response.status, 200, path);
      assert.ok((await response.arrayBuffer()).byteLength > 0, path);
    }
    assert.equal((await fetch(`${server.url}/not-a-page`)).status, 404);
    assert.notEqual(
      (await fetch(`${server.url}/%2e%2e%2fpackage.json`)).status,
      200,
    );
    assert.doesNotMatch(
      await (await fetch(server.url)).text(),
      /new EventSource/,
    );
  } finally {
    await server.close();
  }
}, 60_000);
