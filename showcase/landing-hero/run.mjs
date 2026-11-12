// Copyright Proa Labs, Inc.
// SPDX-License-Identifier: Apache-2.0
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
import { cpus, platform, release, loadavg, totalmem } from "node:os";
import { build } from "esbuild";
import { chromium } from "playwright";
import {firstDifference} from "../../rendering/canonical/dom.mjs";
import {canonicalDocument} from "./dom.mjs";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const proaArg = process.argv.indexOf("--proa");
if (proaArg < 0)
  throw new Error(
    "Usage: node showcase/landing-hero/run.mjs --proa <checkout> [--binary <binary>] [--parity-only] [--out <summary.json>]",
  );
const proa = resolve(process.argv[proaArg + 1]);
const resultArg = process.argv.indexOf("--out");
const resultFile = resultArg < 0
  ? join(root, "showcase/results/landing-hero-live-rows.json")
  : resolve(process.argv[resultArg + 1]);
if (!resultFile.endsWith(".json")) throw new Error("--out must end in .json");
const rawFile = resultFile.slice(0, -5) + "-raw.json.gz";
const revision = "6952e336b338181a7bd4118756977608f7f36dc9";
const paths = [
  "proa_demo/react-ssr-shared",
  "proa_demo/src/github_pr_diff.rs",
  "proa_demo/src/github_pr_diff_fixtures.rs",
  "proa_showcase",
];
execFileSync("git", ["diff", "--exit-code", revision, "--", ...paths], {
  cwd: proa,
});
const binaryArg = process.argv.indexOf("--binary");
const binary =
  binaryArg < 0
    ? join(root, "showcase/landing-hero/out/landing-hero-bench")
    : resolve(process.argv[binaryArg + 1]);
const out = join(root, "showcase/landing-hero/out");
mkdirSync(out, { recursive: true });
const entry = readFileSync(
  join(root, "showcase/landing-hero/react-worker.ts"),
  "utf8",
).replaceAll("__PROA__", proa.replaceAll("\\", "/"));
writeFileSync(join(out, "react-worker.ts"), entry);
await build({
  entryPoints: [join(out, "react-worker.ts")],
  outfile: join(out, "react-worker.cjs"),
  bundle: true,
  platform: "node",
  format: "cjs",
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"' },
  nodePaths: [join(root, "node_modules")],
  plugins: [
    {
      name: "prepare-shared-css",
      setup(b) {
        b.onLoad({ filter: /[/\\]css\.ts$/ }, () => ({
          contents:
            "export const SHARED_CSS=" +
            JSON.stringify(
              readFileSync(
                join(proa, "proa_showcase/src/airbnb/shared.css"),
                "utf8",
              ),
            ),
          loader: "ts",
        }));
      },
    },
  ],
});
const env = { ...process.env, NODE_ENV: "production", PROA_ROOT: proa };
const allocatorPrimed = process.env.PROA_PRIME_ALLOCATOR !== undefined;
const run = (engine, page, ...args) =>
  execFileSync(
    engine === "proa" ? binary : process.execPath,
    engine === "proa"
      ? [page, ...args]
      : [join(out, "react-worker.cjs"), page, ...args],
    { env, maxBuffer: 64 * 1024 * 1024 },
  );
const sha = (b) => createHash("sha256").update(b).digest("hex");
const pages = ["github", "sentry", "airbnb"];
const parity = {};
const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ javaScriptEnabled: false });
  await context.route("**/*", (r) => r.abort());
  for (const page of pages) {
    const dom = {};
    parity[page] = {};
    for (const engine of ["proa", "react"]) {
      const html = run(engine, page, "dump");
      writeFileSync(join(out, `${page}-${engine}.html`), html);
      const tab = await context.newPage();
      dom[engine] = JSON.stringify(
        await canonicalDocument(tab, html.toString()),
      );
      await tab.close();
      writeFileSync(join(out, `${page}-${engine}-dom.json`), dom[engine]);
      parity[page][engine] = {
        bytes: html.length,
        sha256: sha(html),
        dom_sha256: sha(dom[engine]),
      };
    }
    if (dom.proa !== dom.react)
      throw new Error(
        `${page}: DOM mismatch ` +
          JSON.stringify(firstDifference(dom.proa, dom.react)),
      );
    const negative = await context.newPage();
    const changed = JSON.stringify(
      await canonicalDocument(
        negative,
        run("react", page, "dump")
          .toString()
          .replace("<body", '<body data-negative-control="changed"'),
      ),
    );
    await negative.close();
    if (changed === dom.proa)
      throw new Error("Parity negative control did not fail");
    parity[page].negative_control = "rejected";
    console.log(
      page + ": DOM parity and changed-output negative control passed",
    );
  }
  await context.close();
} finally {
  await browser.close();
}
if (process.argv.includes("--parity-only")) process.exit(0);
const host = {
  cpu: cpus()[0].model,
  logical_cpus: cpus().length,
  memory_bytes: totalmem(),
  platform: platform(),
  release: release(),
  load_average_at_start: loadavg(),
};
const percentile = (values, p) => {
  const s = [...values].sort((a, b) => a - b);
  return s[Math.max(0, Math.ceil(s.length * p) - 1)];
};
const records = [];
const started = new Date().toISOString();
for (let repeat = 0; repeat < 5; repeat++) {
  for (let i = 0; i < pages.length; i++) {
    const page = pages[(i + repeat) % pages.length];
    const engines = repeat % 2 ? ["react", "proa"] : ["proa", "react"];
    for (const engine of engines) {
      const warmup = page === "sentry" ? 100 : 1000;
      const iterations = page === "sentry" ? 300 : 2000;
      console.log(
        `${repeat + 1}/5 ${page} ${engine}: ${warmup} warmups, ${iterations} samples`,
      );
      const record = JSON.parse(
        run(engine, page, String(warmup), String(iterations)),
      );
      if (
        record.samples_us.length !== iterations ||
        record.samples_us.some((n) => !Number.isFinite(n) || n <= 0)
      )
        throw new Error("Invalid timing samples");
      if (engine === "proa" && (record.output_kind !== "owned-render-buffer" || record.debug_assertions !== false || record.allocator_primed !== allocatorPrimed))
        throw new Error("Native benchmark must render a fresh owned buffer in release mode");
      if (record.output_bytes !== parity[page][engine].bytes)
        throw new Error("Output size changed during timing");
      records.push({
        ...record,
        page,
        engine,
        repeat: repeat + 1,
        warmup,
        iterations,
        p50_us: percentile(record.samples_us, 0.5),
        p95_us: percentile(record.samples_us, 0.95),
      });
    }
  }
}
const summaries = Object.fromEntries(
  pages.map((page) => {
    const cell = (engine) => {
      const values = records
        .filter((r) => r.page === page && r.engine === engine)
        .map((r) => r.p50_us);
      return {
        p50_us: percentile(values, 0.5),
        process_p50_range_us: [Math.min(...values), Math.max(...values)],
      };
    };
    const proa = cell("proa"),
      react = cell("react");
    return [page, { proa, react, react_over_proa: react.p50_us / proa.p50_us }];
  }),
);
const files = execFileSync("git", ["ls-files", ...paths], {
  cwd: proa,
  encoding: "utf8",
})
  .trim()
  .split("\n");
const source_files = Object.fromEntries(
  files.map((path) => [path, sha(readFileSync(join(proa, path)))]),
);
const result = {
  schema_version: 2,
  captured_at: started,
  completed_at: new Date().toISOString(),
  host,
  method:
    "Same-host production render-only; Proa allocates and returns a fresh owned RenderBuffer, React returns its native String. Allocation and rendering included. Flattening, encoding, output destruction, prepared inputs, parity checks and I/O outside timer. GitHub rows and syntax highlighting regenerated every iteration in both engines; no runtime row-HTML cache. Allocator policy recorded separately. Median of five independent process P50s per engine/page; process order alternates and page order rotates.",
  output_contract: "fresh-owned-render-buffer",
  github_row_policy: "render-and-highlight-each-iteration",
  allocator_policy: allocatorPrimed ? "explicit-warm-seed" : "render-warmups-only",
  native_source_sha256: sha(readFileSync(join(root, "fixtures/landing-hero/src/main.rs"))),
  proa_revision: revision,
  harness_revision: execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: root,
    encoding: "utf8",
  }).trim(),
  node: process.version,
  react: records.find((r) => r.react).react,
  rustc: execFileSync("rustc", ["--version"], { encoding: "utf8" }).trim(),
  binary_sha256: sha(readFileSync(binary)),
  react_bundle_sha256: sha(readFileSync(join(out, "react-worker.cjs"))),
  source_files,
  parity,
  summaries,
  records,
};
mkdirSync(dirname(resultFile), { recursive: true });
const raw = gzipSync(JSON.stringify(result));
writeFileSync(rawFile, raw);
delete result.records;
result.raw_artifact = {
  path: relative(root, rawFile),
  sha256: sha(raw),
};
writeFileSync(
  resultFile,
  JSON.stringify(result, null, 2) + "\n",
);
console.log(JSON.stringify(summaries, null, 2));
