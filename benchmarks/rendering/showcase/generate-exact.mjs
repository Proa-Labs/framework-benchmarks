#!/usr/bin/env bun
// Compile Exact's closest admitted native styling. Every rejected declaration is
// retained as capability evidence; a non-style error stops the build.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { exactContract, exactPlan } from "./exact-plan.mjs";
import { fixtureDirectory, fixtures, loadFixture } from "./fixture.mjs";
import { buildFullExact } from "./full-exact.mjs";

const root = fileURLToPath(new URL("../../../", import.meta.url));
export const exactSource =
  process.env.EXACT_SOURCE ??
  join(root, "benchmarks/framework-ssr/.cache/exact");
export const exactRevision = "94b8671f70fe2e25b307a40e7fce66dc27c9f802";
export async function buildExact(id) {
  const revision = Bun.spawnSync(["git", "rev-parse", "HEAD"], {
    cwd: exactSource,
  });
  assert.equal(revision.stdout.toString().trim(), exactRevision);
  assert.equal(
    Bun.spawnSync(["git", "diff", "--quiet"], { cwd: exactSource }).exitCode,
    0,
  );
  const { definition, prepared } = loadFixture(id),
    styles = JSON.parse(
      readFileSync(
        new URL(`${id}.exact-styles.json`, fixtureDirectory),
        "utf8",
      ),
    );
  const plan = exactPlan(definition, prepared, styles),
    directory = join(
      root,
      "benchmarks/rendering/showcase/.generated/exact",
      id,
    );
  mkdirSync(directory, { recursive: true });
  const priorPath = existsSync(join(directory, "adaptation.json"))
    ? join(directory, "adaptation.json")
    : existsSync(join(directory, "css-progress.json"))
      ? join(directory, "css-progress.json")
      : new URL(`${id}.exact-admission.json`, fixtureDirectory);
  const portablePath = new URL(`${id}.exact-admission.json`, fixtureDirectory);
  const prior = existsSync(priorPath)
    ? JSON.parse(readFileSync(priorPath, "utf8"))
    : undefined;
  const paletteSha256 = createHash("sha256")
    .update(JSON.stringify(styles))
    .digest("hex");
  const priorMatches =
    prior?.engineRevision === exactRevision &&
    prior.fixtureDomSha256 === definition.expectedDomSha256 &&
    (!prior.stylePaletteSha256 || prior.stylePaletteSha256 === paletteSha256);
  // Reuse explicit rejections from this pinned compiler, then recompile the
  // entire retained CSS palette. No omitted value is inferred from a timeout.
  const omitStyles = new Set(
      priorMatches ? prior.omittedStyles.map(JSON.stringify) : [],
    ),
    omitAttributes = new Set(priorMatches ? prior.omittedAttributes : []),
    evidence = priorMatches ? [...prior.evidence] : [];
  let cssValidated = false,
    styleValidationSha256;
  for (let attempt = 0; attempt < 250; attempt++) {
    const native = exactContract(plan, styles, { omitStyles, omitAttributes });
    const source = cssValidated
      ? native.source
      : native.source.split("\ncomponent App\n")[0] +
        "\ncomponent App\n  view\n    view\n" +
        styles.palette
          .map((style, i) =>
            style.$scope === "svg-root"
              ? `      svg class=Style${i}\n`
              : style.$scope === "svg-geometry"
                ? `      svg\n        path d="M0 0" class=Style${i}\n`
                : style.$scope === "svg-text"
                  ? `      svg\n        text "Label" class=Style${i}\n`
                  : `      view class=Style${i}\n`,
          )
          .join("");
    const sourceSha256 = createHash("sha256").update(source).digest("hex");
    const compilerLog = `compiler-${sourceSha256}.log`;
    writeFileSync(join(directory, "app.contract"), source);
    writeFileSync(
      join(directory, "app.json"),
      JSON.stringify({
        name: "Showcase native adaptation",
        id: "run.frameworks.showcase",
        app: {
          id: "run.frameworks.showcase",
          name: "Showcase native adaptation",
        },
        host: { web: {} },
        data: native.dataWords,
      }),
    );
    const build = Bun.spawnSync(
      [
        process.execPath,
        join(exactSource, "host/web-js/build.mjs"),
        directory,
        "--production",
        "--render",
        "js",
        "--out",
        join(directory, "dist"),
      ],
      {
        cwd: exactSource,
        env: { ...process.env, NODE_ENV: "production", EXACT_FEEDBACK: "0" },
        stdout: "pipe",
        stderr: "pipe",
        maxBuffer: 24 * 1024 * 1024,
      },
    );
    const log = build.stdout.toString() + build.stderr.toString();
    writeFileSync(join(directory, compilerLog), log);
    if (build.exitCode === 0) {
      if (!cssValidated) {
        cssValidated = true;
        styleValidationSha256 = sourceSha256;
        console.log(`${id}: native literal CSS validation passed`);
        continue;
      }
      writeFileSync(
        join(directory, "adaptation.json"),
        JSON.stringify({
          schemaVersion: 1,
          engineRevision: exactRevision,
          fixtureDomSha256: definition.expectedDomSha256,
          viewport: styles.viewport,
          nativeCssSha256: createHash("sha256")
            .update(readFileSync(join(directory, "dist/style.css")))
            .digest("hex"),
          stylePaletteSha256: createHash("sha256")
            .update(JSON.stringify(styles))
            .digest("hex"),
          nativeSourceSha256: sourceSha256,
          styleValidationSha256,
          omittedStyles: [...omitStyles].map(JSON.parse),
          omittedAttributes: [...omitAttributes],
          evidence,
          styleCandidates: styles.palette.length,
        }),
      );
      const entry = join(directory, "dist/.gen/bench-entry.js");
      writeFileSync(
        entry,
        `import app from './app.js';import {checkpoint}from'./rt.js';globalThis.prepareInput=(value,request)=>{checkpoint().kept=new Map([['page',[[],value]],['freshness',[[],[request]]]]);};globalThis.renderFixture=()=>{app();return '<div id="exact-root">'+document.rootHTML()+'</div>';};`,
      );
      const bundle = await Bun.build({
        entrypoints: [entry],
        target: "bun",
        format: "iife",
        minify: false,
        define: {
          "globalThis.__exactRender": "true",
          "import.meta.url": JSON.stringify(
            pathToFileURL(join(directory, "dist/app.js")).href,
          ),
        },
      });
      assert.ok(bundle.success, JSON.stringify(bundle.logs));
      writeFileSync(
        join(directory, "bench.js"),
        await bundle.outputs[0].text(),
      );
      if (process.argv.includes("--write-admission"))
        writeFileSync(
          portablePath,
          `${JSON.stringify({
            schemaVersion: 1,
            engineRevision: exactRevision,
            fixtureDomSha256: definition.expectedDomSha256,
            stylePaletteSha256: paletteSha256,
            omittedStyles: [...omitStyles].map(JSON.parse),
            omittedAttributes: [...omitAttributes],
            evidence,
          })}\n`,
        );
      buildFullExact(id, exactSource);
      console.log(
        `${id}: production Exact build; ${omitStyles.size} unsupported CSS values recorded`,
      );
      return;
    }
    const diagnostics = [
      ...log.matchAll(/app\.contract:(\d+):(\d+) \[([^\]]+)\] ([^\n]+)/g),
    ];
    let changed = 0;
    for (const match of diagnostics) {
      const row = Number(match[1]),
        style = native.styleLines.get(row);
      // Only compiler-rejected declarations are omitted. Unknown tags, types,
      // data bindings or source positions are implementation errors to fix.
      if (
        !style &&
        match[3] === "lower-unknown-attr" &&
        native.attrLines.has(row)
      ) {
        const name = /attribute `([^`]+)`/.exec(match[4])?.[1];
        if (
          name &&
          native.attrLines.get(row).includes(name) &&
          !omitAttributes.has(name)
        ) {
          omitAttributes.add(name);
          evidence.push({
            compilerLog,
            sourceSha256,
            code: match[3],
            message: match[4],
            attribute: name,
          });
          changed++;
          continue;
        }
      }
      if (!style)
        throw Error(
          `${id}: native Contract needs a code fix; ${join(directory, compilerLog)}\n${match[0]}`,
        );
      if (!omitStyles.has(style.key)) {
        omitStyles.add(style.key);
        evidence.push({
          compilerLog,
          sourceSha256,
          code: match[3],
          message: match[4],
          ...style,
        });
        changed++;
      }
    }
    assert.ok(
      changed,
      `${id}: compiler failed without a removable CSS declaration; ${join(directory, compilerLog)}`,
    );
    writeFileSync(
      join(directory, "css-progress.json"),
      JSON.stringify({
        engineRevision: exactRevision,
        fixtureDomSha256: definition.expectedDomSha256,
        stylePaletteSha256: paletteSha256,
        omittedStyles: [...omitStyles].map(JSON.parse),
        omittedAttributes: [...omitAttributes],
        evidence,
      }),
    );
    console.log(
      `${id}: ${changed} CSS value rejection(s), retrying native build`,
    );
  }
  throw Error(`${id}: unsupported CSS projection did not converge`);
}
if (import.meta.main) {
  const index = process.argv.indexOf("--workload");
  for (const { id } of fixtures)
    if (index < 0 || id === process.argv[index + 1]) await buildExact(id);
}
