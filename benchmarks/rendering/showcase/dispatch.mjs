#!/usr/bin/env bun
// Process adapter selection and result normalization are untimed. The native
// driver starts and stops its own clock around fresh owned output construction.
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runWithMemory } from "../../../tooling/capture/process-memory.mjs";
import { summarize } from "../../../tooling/stats.mjs";
import { fixtures } from "./fixture.mjs";
import { generateTemplates } from "./generate-templates.mjs";

const root = fileURLToPath(new URL("../../../", import.meta.url)),
  directory = fileURLToPath(new URL("./", import.meta.url));
const args = process.argv.slice(2),
  option = (key, fallback) => {
    const i = args.indexOf(key);
    return i < 0 ? fallback : args[i + 1];
  };
const id = option("--framework"),
  workload = option("--workload");
const fixture = fixtures.find((f) => f.id === workload);
assert.ok(fixture);
const roster = JSON.parse(
  readFileSync(
    join(root, "benchmarks/rendering/canonical/roster.json"),
    "utf8",
  ),
).renderers;
const engine = roster.find((r) => r.id === id);
assert.ok(engine);
const manifest = JSON.parse(
  readFileSync(
    join(root, "benchmarks/rendering/canonical/workloads.json"),
    "utf8",
  ),
).workloads.find((w) => w.id === workload);
const temporary = mkdtempSync(join(tmpdir(), "showcase-process-"));
try {
  let command,
    childArgs,
    cwd = root;
  const output = join(temporary, "result.json"),
    generated = join(directory, ".generated");
  const common = [
    "--iterations",
    String(option("--iterations", manifest.iterations)),
    "--warmup",
    String(option("--warmup", manifest.warmup)),
    "--out",
    output,
  ];
  if (option("--dump")) common.push("--dump", option("--dump"));
  if (args.includes("--dump-only")) common.push("--dump-only");
  if (option("--dump-css")) common.push("--dump-css", option("--dump-css"));
  if (
    ["proa", "askama", "sailfish", "leptos", "dioxus", "topcoat"].includes(id)
  ) {
    command = join(
      resolve(root, process.env.CARGO_TARGET_DIR ?? "target"),
      "release/showcase_suite_bench",
    );
    childArgs = ["--framework", id, "--workload", workload, ...common];
  } else if (
    [
      "react",
      "svelte",
      "vue",
      "marko",
      "handlebars",
      "astro",
      "sveltekit",
      "nextjs",
      "exact",
    ].includes(id)
  ) {
    command = process.execPath;
    childArgs = [
      join(directory, "suite-bench.mjs"),
      "--framework",
      id,
      "--workload",
      workload,
      ...common,
    ];
  } else if (["jte", "rocker"].includes(id)) {
    command = process.env.JAVA_HOME
      ? join(process.env.JAVA_HOME, "bin/java")
      : "java";
    cwd = join(root, "benchmarks/rendering/external", id);
    childArgs = [
      "-cp",
      join(cwd, `build/install/proa-${id}-bench/lib/*`),
      "proa.bench.showcase.Admission",
      "--workload",
      workload,
      ...common,
    ];
  } else {
    generateTemplates(generated);
    const kind = {
      rails: "erb",
      jinja2: "jinja",
      php: "php",
      "go-html-template": "go",
    }[id];
    assert.ok(kind);
    childArgs = ["--input", join(generated, `${workload}.${kind}`), ...common];
    if (id === "rails") {
      command = "ruby";
      childArgs.unshift(join(directory, "drivers/rails.rb"));
    }
    if (id === "jinja2") {
      command = join(
        root,
        "benchmarks/rendering/external/jinja/.venv/bin/python3",
      );
      childArgs.unshift(join(directory, "drivers/jinja.py"));
    }
    if (id === "php") {
      command = "php";
      childArgs.unshift(
        "-d",
        "opcache.enable_cli=1",
        "-d",
        "opcache.validate_timestamps=0",
        join(directory, "drivers/php.php"),
      );
    }
    if (id === "go-html-template") command = join(generated, "go-admission");
  }
  const native = runWithMemory(command, childArgs, {
    cwd,
    env: { ...process.env, NODE_ENV: "production" },
    maxBuffer: 4 * 1024 * 1024,
  });
  if (!args.includes("--dump-only")) {
    const result = JSON.parse(readFileSync(output, "utf8"));
    result.memory = native.memory;
    assert.equal(result.framework_id, id);
    assert.equal(result.samples_us.length, result.iterations);
    assert.ok(result.samples_us.every((n) => Number.isFinite(n) && n >= 0));
    const stats = summarize(result.samples_us);
    Object.assign(result, {
      schema_version: 1,
      framework: engine.label,
      language: engine.language,
      workload,
      workload_cardinality: fixture.cardinality,
      timed_operation: "allocate_and_render_fresh_owned_output",
      output_destruction_timed: false,
    });
    for (const key of ["min", "mean", "p50", "p95", "p99", "max"])
      result[`${key}_us`] = stats[key];
    if (option("--out"))
      writeFileSync(option("--out"), `${JSON.stringify(result)}\n`);
    console.log(`${engine.label} ${workload}: ${result.p50_us.toFixed(2)} µs`);
  }
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
