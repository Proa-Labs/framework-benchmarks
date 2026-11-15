#!/usr/bin/env bun
// Refresh the shared SSR fixture projection from an immutable upstream revision.
// Does not collect timings or publish results. No generated HTML is checked in.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { compileBlueprint, readDocument } from "./blueprint.mjs";
import { booleanAttributes, fixtureDirectory, fixtures } from "./fixture.mjs";
import { styleObject } from "./style.mjs";

export const upstreamRevision = "ceffd9f305acabbb0584fa181df4f4e2d7883e94";
const root = fileURLToPath(new URL("../../../", import.meta.url));
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
// Go's contextual URL escaper percent-encodes characters in asset filenames
// that peers leave literal (for example Nike's apostrophes and percent signs).
// Preserve reserved separators such as %2F: those can identify another resource.
function assetUrl(value) {
  try {
    return decodeURI(value);
  } catch {
    return value;
  }
}
function canonicalAttribute(node, name, value) {
  if (
    booleanAttributes.has(name) &&
    !(name === "hidden" && value === "until-found")
  )
    return "";
  if (name === "style")
    return JSON.stringify(Object.entries(styleObject(value)));
  if (name === "src") return assetUrl(value);
  if (node.tag === "meta" && name === "charset") return value.toLowerCase();
  if (
    node.tag === "meta" &&
    name === "content" &&
    node.attrs.some(([n, v]) => n === "name" && v === "viewport")
  )
    return value
      .split(",")
      .map((part) => {
        const [key, ...rest] = part.split("="),
          value = rest.join("=").trim();
        return [
          key.trim().toLowerCase(),
          /^(?:initial|minimum|maximum)-scale$/.test(key.trim())
            ? String(Number(value))
            : value,
        ];
      })
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(",");
  return value;
}
export function canonicalTree(node) {
  if (node.kind === "element")
    return {
      kind: node.kind,
      tag: node.tag,
      attrs: node.attrs
        .map(([name, value]) => [name, canonicalAttribute(node, name, value)])
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
      children: canonicalChildren(
        node.tag === "head"
          ? headChildren(node.children)
          : node.tag === "body"
            ? bodyChildren(node.children)
            : node.children,
      ),
    };
  if (node.kind === "fragment")
    return { kind: node.kind, children: canonicalChildren(node.children) };
  return node;
}
const structuralWhitespace = (c) =>
  c.kind === "text" && /^[\t\n\f\r ]*$/.test(c.value);
// SvelteKit adds whitespace around its root transport markers. Only trim the
// document shell's edges; whitespace inside page elements remains contractual.
function bodyChildren(children) {
  let first = 0,
    last = children.length;
  while (first < last && structuralWhitespace(children[first])) first++;
  while (last > first && structuralWhitespace(children[last - 1])) last--;
  return children.slice(first, last);
}
// React hoists titles; Next also supplies charset and viewport metadata. Coalesce
// only equivalent duplicates of these two declarations, preserving CSS order.
function headChildren(children) {
  const seen = new Set();
  const meaningful = children
    .filter((c) => !structuralWhitespace(c))
    .filter((c) => {
      if (
        c.tag !== "meta" ||
        !c.attrs.some(
          ([n, v]) => n === "charset" || (n === "name" && v === "viewport"),
        )
      )
        return true;
      const key = JSON.stringify(canonicalTree(c));
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  return [
    ...meaningful.filter((c) => c.tag !== "title"),
    ...meaningful.filter((c) => c.tag === "title"),
  ];
}
function canonicalChildren(children) {
  const result = [];
  for (const child of children) {
    const normalized = canonicalTree(child),
      last = result.at(-1);
    if (normalized.kind === "text" && last?.kind === "text")
      last.value += normalized.value;
    else result.push(normalized);
  }
  return result;
}
export function canonicalDigest(html, options) {
  return digest(JSON.stringify(canonicalTree(readDocument(html, options))));
}
export function writeFixture(id, html, source) {
  const { label } = fixtures.find((f) => f.id === id);
  const { definition, records } = compileBlueprint(html, { id, label, source });
  definition.expectedDomSha256 = canonicalDigest(html, { addRequest: true });
  definition.source.htmlSha256 = digest(html);
  // One native component definition / prepared record per line keeps this
  // generated source compact. Update upstream and reimport, never hand-edit it.
  const { templates, ...meta } = definition;
  const text =
    JSON.stringify(meta, null, 2).replace(/\n\}$/, "") +
    ',\n  "templates": [\n' +
    templates.map((t) => `    ${JSON.stringify(t)}`).join(",\n") +
    "\n  ]\n}\n";
  writeFileSync(new URL(`${id}.json`, fixtureDirectory), text);
  writeFileSync(
    new URL(`${id}.jsonl`, fixtureDirectory),
    `${records.map((r) => JSON.stringify(r)).join("\n")}\n`,
  );
  return definition;
}
async function main() {
  const argument = (key) => {
    const at = process.argv.indexOf(key);
    return at < 0 ? undefined : process.argv[at + 1];
  };
  const temporary = mkdtempSync(join(tmpdir(), "showcase-fixtures-"));
  const importer = join(root, "tooling/fixtures/showcase-import");
  try {
    let directory = argument("--html-dir");
    if (!directory) {
      const cli = argument("--proa-cli") ?? process.env.PROA_CLI;
      assert.ok(cli, "Pass --proa-cli /path/to/the/locked/proa executable");
      const binary = join(temporary, "showcase-export");
      // This is a fixture exporter, not an app with pages/layouts/data modules.
      // Targeted fmt/lint checks cover its source; keep the linked RSJS build.
      execFileSync(
        cli,
        [
          "build",
          "--root",
          importer,
          "--bin",
          "proa-showcase-fixture-export",
          "--profile",
          "release",
          "--locked",
          "--no-assets",
          "--no-check",
          "--artifact-out",
          binary,
        ],
        { stdio: "inherit" },
      );
      directory = join(temporary, "html");
      execFileSync(binary, ["--out", directory], { stdio: "inherit" });
    }
    const manifest = JSON.parse(
      readFileSync(join(directory, "manifest.json"), "utf8"),
    );
    assert.equal(manifest.schemaVersion, 1);
    assert.equal(manifest.revision, upstreamRevision);
    assert.equal(manifest.debugAssertions, false);
    const exporterSha256 = digest(
      ["Cargo.toml", "Cargo.lock", "src/main.rs"]
        .map((p) => readFileSync(join(importer, p)))
        .map((bytes) => digest(bytes))
        .join("\n"),
    );
    const source = {
      repository: "https://github.com/Proa-Labs/proa",
      revision: upstreamRevision,
      exporterSha256,
      projection:
        "SSR business HTML and original CSS; browser scripts and activation attributes omitted",
    };
    for (const { id } of fixtures) {
      const html = readFileSync(join(directory, `${id}.html`), "utf8");
      assert.equal(digest(html), manifest.pages[id].sha256);
      assert.equal(Buffer.byteLength(html), manifest.pages[id].bytes);
      const definition = writeFixture(id, html, { ...source });
      console.log(
        `${id}: ${definition.templates.length} native component definitions; source ${definition.source.htmlSha256}`,
      );
    }
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
}
if (import.meta.main) await main();
