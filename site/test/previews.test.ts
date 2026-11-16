import { test } from "bun:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type DefaultTreeAdapterMap, parse } from "parse5";
import {
  fixtures,
  loadFixture,
  renderReference,
} from "../../benchmarks/rendering/showcase/fixture.mjs";
import showcaseAssets from "../data/performance/showcase/assets.json";
import { loadInputs } from "../data.ts";
import {
  buildPreviews,
  showcasePreview,
  staticPreviewState,
  thumbnailHtml,
  thumbnailSourceHash,
} from "../previews.ts";

test("thumbnail generation binds original sources while rendering static preview annotations", async () => {
  const directory = await mkdtemp(join(tmpdir(), "preview-sources-"));
  try {
    const { input } = await loadInputs();
    const hashes = await buildPreviews(
      directory,
      input.framework,
      [{ id: "sentry-otel" }],
      { raster: false },
    );
    const { definition, data } = loadFixture("sentry-otel");
    const source = showcasePreview(renderReference(definition, data));
    const emitted = await readFile(
      join(directory, "previews/sentry-otel.html"),
      "utf8",
    );
    assert.equal(hashes["sentry-otel.html"], thumbnailSourceHash(source));
    assert.notEqual(hashes["sentry-otel.html"], thumbnailSourceHash(emitted));
    assert.match(emitted, /data-preview-sentry/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("Sentry previews finish visibly without changing any measured log rows", () => {
  const { definition, data } = loadFixture("sentry-otel");
  const source = showcasePreview(renderReference(definition, data));
  const rows = (html: string) =>
    [...html.matchAll(/<details class="log-row[\s\S]*?<\/details>/g)].map(
      (match) => match[0],
    );
  assert.equal(rows(source).length, 400);
  for (const filename of ["sentry-otel.html", "framework-sentry-otel.html"]) {
    const preview = staticPreviewState(filename, source);
    assert.deepEqual(rows(preview), rows(source));
    assert.match(preview, /data-visible-batches="10"/);
    assert.equal((preview.match(/data-preview-sentry/g) || []).length, 1);
    assert.match(preview, /class="loading-more" role="note">[^<]*400/);
    assert.doesNotMatch(preview, /class="loading-more"[^>]*>\s*<i/);
    assert.match(
      preview,
      /class="auto-refresh"[^>]*disabled=""[^>]*aria-pressed="false"/,
    );
  }
  assert.match(source, /class="loading-more">\s*<i/);
  assert.match(source, /data-visible-batches="1"/);
  assert.equal(
    staticPreviewState("sentry-otel.html", source),
    staticPreviewState("framework-sentry-otel.html", source),
  );
  assert.equal(staticPreviewState("cards.html", source), source);
});

test("showcase previews preserve page CSS and replace only the requested utility sheet in cascade order", () => {
  const ownCss = "<style>body{line-height:normal}svg{display:inline}</style>";
  const standalone = `<html><head>${ownCss}</head><body><svg></svg></body></html>`;
  assert.equal(showcasePreview(standalone), standalone);
  const linked = `<html><head><link rel="stylesheet" href="/proa.css">${ownCss}</head><body><img src="/images/sample.jpg"></body></html>`;
  const preview = showcasePreview(linked);
  assert.equal((preview.match(/<style/g) || []).length, 2);
  assert.ok(preview.indexOf("data-preview-utility") < preview.indexOf(ownCss));
  assert.doesNotMatch(preview, /href="\/proa.css"/);
  assert.match(preview, /src="https:\/\/proa.so\/images\/sample.jpg"/);
});

test("preview asset paths encode literal percent signs without double encoding existing escapes", () => {
  const source =
    '<img src="/images/nike/NEXT%+4.png" srcset="/images/nike/NEXT%+4.png 1x, /images/nike/NEXT%25+4.png 2x"><style>.hero{background:url("/images/nike/NEXT%+4.png")}</style>';
  const preview = showcasePreview(source);
  assert.match(
    preview,
    /src="https:\/\/proa.so\/images\/nike\/NEXT%25\+4.png"/,
  );
  assert.match(
    preview,
    /NEXT%25\+4.png 1x, https:\/\/proa.so\/images\/nike\/NEXT%25\+4.png 2x/,
  );
  assert.match(
    preview,
    /url\("https:\/\/proa.so\/images\/nike\/NEXT%25\+4.png"\)/,
  );
  assert.doesNotMatch(preview, /%2525/);
});

test("every showcase keeps its original style rules and stylesheet order", () => {
  const sheets = (html: string) => {
    const result: string[] = [];
    function visit(node: DefaultTreeAdapterMap["node"]) {
      if ("tagName" in node && node.tagName === "style")
        result.push(
          node.childNodes.map((c) => ("value" in c ? c.value : "")).join(""),
        );
      if ("childNodes" in node)
        for (const child of node.childNodes) visit(child);
    }
    for (const child of parse(html).childNodes) visit(child);
    return result;
  };
  for (const { id } of fixtures) {
    const { definition, data } = loadFixture(id);
    assert.ok("source" in definition, `${id}: fixture source metadata missing`);
    const metadata = definition.source;
    assert.ok(
      metadata && typeof metadata === "object" && "revision" in metadata,
    );
    assert.equal(metadata.revision, showcaseAssets.revision, id);
    const source = renderReference(definition, data);
    const preview = showcasePreview(source);
    const requestedUtility = source.includes('href="/proa.css"');
    const originalRules = sheets(source).map((css) =>
      css.replace(
        /url\((\s*["']?)\/images\//g,
        "url($1https://proa.so/images/",
      ),
    );
    const previewRules = sheets(preview);
    assert.deepEqual(
      previewRules.slice(requestedUtility ? 1 : 0),
      originalRules,
      id,
    );
    assert.equal(
      previewRules.length,
      originalRules.length + Number(requestedUtility),
      id,
    );
    assert.equal(
      preview.includes("data-preview-utility"),
      requestedUtility,
      id,
    );
  }
});

test("thumbnail documents bound hidden rows without changing visible inputs or full fixtures", () => {
  const html = `<html><head><title>Fixture</title></head><body><table><tbody>${Array.from({ length: 1000 }, (_, index) => `<tr data-row="${index}"><td>User ${index} &amp; team</td></tr>`).join("")}</tbody></table></body></html>`;
  const thumbnail = thumbnailHtml(html);
  assert.equal((thumbnail.match(/<tr /g) || []).length, 10);
  assert.match(thumbnail, /data-row="9"/);
  assert.doesNotMatch(thumbnail, /data-row="10"/);
  assert.match(thumbnail, /User 0 &amp; team/);
  assert.equal((html.match(/<tr /g) || []).length, 1000);
  assert.equal(thumbnailHtml(thumbnail), thumbnail);
});

test("thumbnail source hashes ignore runtime scripts and request attributes, while retaining business content", () => {
  const doc = (request: string, text: string) =>
    `<html><head><title>Fixture</title></head><body><main data-bench-request="${request}"><p>${text}</p></main><script>${request}</script></body></html>`;
  assert.equal(
    thumbnailSourceHash(doc("first", "Content")),
    thumbnailSourceHash(doc("second", "Content")),
  );
  assert.notEqual(
    thumbnailSourceHash(doc("first", "Content")),
    thumbnailSourceHash(doc("first", "Changed")),
  );
});

test("thumbnail cards are bounded for div-based and article-based fixtures", () => {
  for (const tag of ["div", "article"]) {
    const html = `<main>${Array.from({ length: 4 }, (_, group) => `<section><h2>Group ${group}</h2><div class="card-grid"><div class="spacer"></div>${Array.from({ length: 8 }, (_, i) => `<${tag} class="card" data-card="${group * 8 + i}"><h3>Card ${i}</h3></${tag}>`).join("")}</div></section>`).join("")}</main>`;
    const thumbnail = thumbnailHtml(html);
    assert.equal((thumbnail.match(/data-card=/g) || []).length, 8);
    assert.match(thumbnail, /data-card="7"/);
    assert.doesNotMatch(thumbnail, /data-card="8"/);
    assert.equal((html.match(/data-card=/g) || []).length, 32);
  }
});
