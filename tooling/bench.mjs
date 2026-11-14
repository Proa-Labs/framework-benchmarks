#!/usr/bin/env bun
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { readAdapters } from "./adapters.mjs";
import { atomicWrite, captureId } from "./captures.mjs";
import suites from "./suites.json" with { type: "json" };

export const root = dirname(dirname(fileURLToPath(import.meta.url)));
export function planRun(id, args) {
  const suite = suites[id];
  assert.ok(suite, `Unknown suite ${id}. Run bun run bench list`);
  const publish = args.includes("--publish");
  assert.ok(
    !(publish && args.includes("--smoke")),
    "Choose --publish or --smoke",
  );
  const forwarded = args.filter((x) => !["--publish", "--smoke"].includes(x));
  for (let i = 0; i < forwarded.length; i++) {
    const flag = forwarded[i];
    const kind = suite.options[flag.slice(2)];
    assert.ok(flag.startsWith("--") && kind, `Unknown ${id} option: ${flag}`);
    if (kind === "value") {
      assert.ok(
        forwarded[i + 1] && !forwarded[i + 1].startsWith("--"),
        `${flag} requires a value`,
      );
      i++;
    }
  }
  const flags = forwarded.filter((x) => x.startsWith("--"));
  assert.equal(
    new Set(flags).size,
    flags.length,
    "Duplicate options are not allowed",
  );
  const outputIndex = forwarded.indexOf("--out");
  if (outputIndex >= 0) {
    assert.ok(
      forwarded[outputIndex + 1] &&
        !forwarded[outputIndex + 1].startsWith("--"),
      "--out requires a path",
    );
    const output = resolve(root, forwarded[outputIndex + 1]);
    assert.ok(output.endsWith(".json"), "Capture output must end in .json");
    assert.ok(
      !Object.values(suites).some(
        (s) => output === join(root, s.directory, "results/latest.json"),
      ),
      "Use --publish to replace a public capture",
    );
    assert.notEqual(
      output,
      join(root, "rendering/results/product-scaling.json"),
    );
  }
  const smokeArgs = publish
    ? []
    : suite.smoke.filter((value, index, all) => {
        // An explicit smoke tuning option replaces that preset, rather than being
        // silently ignored by a runner that reads only its first occurrence.
        const key = value.startsWith("--") ? value : all[index - 1];
        return !flags.includes(key);
      });
  const outputArgs =
    outputIndex >= 0 || publish
      ? []
      : ["--out", `${suite.directory}/results/local/${captureId(id)}.json`];
  return [suite.entry, ...smokeArgs, ...forwarded, ...outputArgs];
}
function run(args) {
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(
      `Command failed (${result.status ?? result.signal}): bun ${args.join(" ")}`,
    );
}
function doctor(id) {
  const suite = suites[id];
  assert.ok(suite, "Select a suite from bench list");
  let failed = false;
  for (const command of suite.requires.filter((x) => /^[a-z]+$/.test(x))) {
    const result = spawnSync(
      command,
      [command === "go" ? "version" : "--version"],
      { encoding: "utf8" },
    );
    const good = result.status === 0;
    failed ||= !good;
    console.log(
      `${good ? "✓" : "✗"} ${command}: ${good ? (result.stdout || result.stderr).split("\n")[0] : "missing; see CONTRIBUTING.md"}`,
    );
  }
  if (id === "rendering") {
    const binary = chromium.executablePath();
    const good = existsSync(binary);
    failed ||= !good;
    console.log(
      `${good ? "✓" : "✗"} Chromium${good ? "" : ": bun node_modules/playwright/cli.js install chromium"}`,
    );
    console.log(
      "For Bun-only iteration: bench run rendering --renderers react,vue --workloads cards",
    );
    console.log(
      "Full roster also needs Rust, Go, Ruby 3.2+, Java 17+/Gradle, PHP and Python; selected runs build only required adapters.",
    );
  }
  if (failed) process.exitCode = 1;
}
export function scaffoldAdapter(id, destination = root) {
  assert.match(id ?? "", /^[a-z][a-z0-9-]*$/, "Use a lowercase adapter ID");
  const registry = readAdapters(destination);
  assert.ok(!registry[id], "Adapter already exists");
  const directory = join(destination, "rendering/external", id);
  assert.ok(!existsSync(directory), "Adapter directory already exists");
  mkdirSync(directory);
  writeFileSync(
    join(directory, "suite_bench.mjs"),
    readFileSync(
      join(root, "tooling/templates/adapter.mjs.txt"),
      "utf8",
    ).replaceAll("ADAPTER_ID", id),
    { flag: "wx" },
  );
  registry[id] = {
    id,
    label: id,
    language: "JavaScript",
    setup: "custom",
    cwd: `rendering/external/${id}`,
    command: "{bun}",
    args: ["suite_bench.mjs"],
  };
  atomicWrite(
    join(destination, "rendering/canonical/adapters.json"),
    `${JSON.stringify(registry, null, 2)}\n`,
  );
  console.log(
    `Created ${directory}/suite_bench.mjs and registered ${id} for local runs.\nImplement render() with your renderer, then: bun run bench run rendering --renderers ${id} --workloads cards\nPublic roster and site remain unchanged until review and a full capture.`,
  );
}
async function main() {
  assert.equal(
    process.versions.bun,
    "1.4.2",
    "Use Bun 1.4.2 (node_modules/.bin/bun)",
  );
  const [command, id, ...args] = process.argv.slice(2);
  if (command === "list") {
    for (const [key, suite] of Object.entries(suites))
      console.log(
        `${key.padEnd(11)} ${suite.title}\n            ${suite.contract}`,
      );
    console.log(
      `\nRendering adapters: ${Object.keys(readAdapters(root)).join(", ")}`,
    );
  } else if (command === "run") run(planRun(id, args));
  else if (command === "doctor") doctor(id);
  else if (command === "validate") {
    const { validateCapture } = await import("./validate.mjs");
    await validateCapture(id, args[0], root);
    console.log(`${id}: publication contract and retained source verified`);
  } else if (command === "new-adapter") scaffoldAdapter(id);
  else if (command === "check") {
    for (const task of ["lint", "typecheck", "test:contracts", "test:site"])
      run(["run", task]);
    for (const key of Object.keys(suites))
      run(["tooling/bench.mjs", "validate", key]);
    run(["sveltekit/report.mjs", "--check"]);
    run(["site/build.ts"]);
  } else {
    console.log(
      "bun run bench list\nbun run bench doctor <suite>\nbun run bench run <suite> [options]           # local smoke, preserves publication\nbun run bench run <suite> --publish          # full protocol, retains evidence\nbun run bench validate <suite> [capture.json]  # publication + source checks\nbun run bench new-adapter <id>\nbun run bench check                          # portable contributor checks\n\nSee CONTRIBUTING.md for adding adapters/workloads and reproducible capture instructions.",
    );
    if (command && !["--help", "help"].includes(command)) process.exitCode = 1;
  }
}
if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
