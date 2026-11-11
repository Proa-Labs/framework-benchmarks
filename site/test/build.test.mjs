import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { buildSite, outputDirectory } from "../build.mjs";
import { loadInputs } from "../data.mjs";
import { startServer } from "../dev.mjs";

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
  const index = await readFile(join(outputDirectory, "index.html"), "utf8");
  const versionedAssets = [];
  for (const asset of ["app.js", "styles.css"]) {
    const version = createHash("sha256")
      .update(await readFile(join(outputDirectory, asset)))
      .digest("hex")
      .slice(0, 12);
    const url = `${asset}?v=${version}`;
    assert.ok(index.includes(`"${url}"`), `${asset} URL tracks its content`);
    versionedAssets.push(`/${url}`);
  }
  const embedded = JSON.parse(
    index.match(/id="frameworks-explorer-data">([\s\S]*?)<\/script>/)[1],
  );
  assert.deepEqual(embedded, data);
  assert.doesNotMatch(
    index,
    /cdn\.jsdelivr|window\.openai|independent research/i,
  );
  assert.match(index, /Maintained by Andrew Hariri, founder of Proa Labs/);
  assert.match(index, /href="\/features"/);
  assert.ok(
    index.indexOf("data-initial-theme") < index.indexOf("data-theme-bootstrap"),
  );
  assert.ok(
    index.indexOf("data-theme-bootstrap") < index.indexOf('rel="stylesheet"'),
  );
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
  assert.equal((productsPreview.match(/href="\/products\//g) ?? []).length, 96);
  assert.equal(
    (
      tablePreview.match(/<tbody>[\s\S]*?<\/tbody>/)?.[0].match(/<tr[ >]/g) ??
      []
    ).length,
    1000,
  );
  const server = await startServer({ port: 0, live: false, build: false });
  try {
    const legacyFeatures = await fetch(
      `${server.url}/features.html?group=server&display=matrix`,
      { redirect: "manual" },
    );
    assert.equal(legacyFeatures.status, 307);
    assert.equal(
      legacyFeatures.headers.get("location"),
      "/features?group=server&display=matrix",
    );
    for (const path of [
      "/",
      "/app.js",
      "/theme.js",
      "/styles.css",
      ...versionedAssets,
      "/favicon.svg",
      "/previews/cards.html",
      "/previews/products.html",
      "/previews/table.html",
      "/about.html",
      "/methodology.html",
      "/features.html",
      "/features",
      "/features.js",
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
});
