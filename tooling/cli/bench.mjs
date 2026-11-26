#!/usr/bin/env bun
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { chromium } from "playwright";
import renderingWorkloads from "../../benchmarks/rendering/canonical/workloads.json" with {
  type: "json",
};
import suites from "../../benchmarks/suites.json" with { type: "json" };
import { readAdapters, selectIds } from "../adapters/adapters.mjs";
import { atomicWrite, captureId } from "../capture/captures.mjs";
import { repositoryRoot } from "../repository.mjs";

export const root = repositoryRoot(import.meta.url);
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
      join(root, "benchmarks/rendering/results/product-scaling.json"),
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
export function planAdapterCheck(id, args, destination = root) {
  assert.ok(
    Object.hasOwn(readAdapters(destination), id),
    `Unknown rendering adapter ${id ?? ""}. Run bun run bench list`,
  );
  const { values } = parseArgs({
    args,
    options: {
      workloads: { type: "string" },
      smoke: { type: "boolean", default: false },
      out: { type: "string" },
    },
    allowPositionals: false,
  });
  if (values.out !== undefined) {
    assert.ok(values.smoke, "--out requires --smoke");
    const localResults = join(
      root,
      suites.rendering.directory,
      "results/local",
    );
    assert.ok(
      resolve(root, values.out).startsWith(localResults + sep),
      "Save check-adapter output under benchmarks/rendering/results/local/",
    );
  }
  const workloads = selectIds(
    values.workloads,
    ["cards"],
    renderingWorkloads.workloads.map(({ id }) => id),
    "workload",
  ).join(",");
  const flags = ["--renderers", id, "--workloads", workloads];
  if (!values.smoke) flags.push("--parity-only");
  if (values.out !== undefined) flags.push("--out", values.out);
  return {
    command: planRun("rendering", flags),
    workloads,
    smoke: values.smoke,
  };
}

function checkAdapter(id, args) {
  const { command, workloads, smoke } = planAdapterCheck(id, args);
  run(command);
  const evidence = smoke
    ? command[command.indexOf("--out") + 1]
    : "benchmarks/rendering/results/canonical-parity.json";
  console.log(`${id} passed ${smoke ? "smoke" : "parity"} for ${workloads}.`);
  console.log(`Evidence saved to ${evidence}`);
  console.log("Include the command and result in your pull request.");
}

function parsePinnedPackage(specifier) {
  const separator = specifier.lastIndexOf("@");
  const name = specifier.slice(0, separator);
  const version = specifier.slice(separator + 1);
  const semver =
    /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-([a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*))?(?:\+[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*)?$/.exec(
      version,
    );
  assert.ok(
    separator > 0 &&
      /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/.test(name) &&
      semver &&
      !semver[1]?.split(".").some((identifier) => /^0\d+$/.test(identifier)),
    "--package needs a name and exact version, e.g. @scope/renderer@1.2.3",
  );
  return { name, version };
}

export function scaffoldAdapter(id, destination = root, args = []) {
  assert.match(id ?? "", /^[a-z][a-z0-9-]*$/, "Use a lowercase adapter ID");
  const { values } = parseArgs({
    args,
    options: { label: { type: "string" }, package: { type: "string" } },
    allowPositionals: false,
  });
  const label = values.label?.trim() ?? id;
  assert.ok(label && !/[\r\n]/.test(label), "Use a single-line display label");
  const dependency =
    values.package === undefined ? null : parsePinnedPackage(values.package);
  const registry = readAdapters(destination);
  assert.ok(!Object.hasOwn(registry, id), "Adapter already exists");
  const workspace = `benchmarks/rendering/external/${id}`;
  const directory = join(destination, workspace);
  assert.ok(!existsSync(directory), "Adapter directory already exists");
  const template = readFileSync(
    join(root, "tooling/adapters/templates/adapter.mjs.txt"),
    "utf8",
  );
  const manifest = {
    name: `proa-bench-${id}`,
    private: true,
    type: "module",
    ...(dependency && {
      dependencies: { [dependency.name]: dependency.version },
    }),
  };
  registry[id] = {
    id,
    label,
    language: "JavaScript",
    setup: "bun",
    cwd: workspace,
    command: "{bun}",
    args: ["suite_bench.mjs"],
    ...(dependency && { versionPackage: dependency.name }),
  };
  mkdirSync(directory);
  try {
    writeFileSync(
      join(directory, "suite_bench.mjs"),
      template.replace(/ADAPTER_ID|ADAPTER_LABEL/g, (token) =>
        JSON.stringify(token === "ADAPTER_ID" ? id : label),
      ),
      { flag: "wx" },
    );
    writeFileSync(
      join(directory, "package.json"),
      `${JSON.stringify(manifest, null, 2)}\n`,
      { flag: "wx" },
    );
    atomicWrite(
      join(destination, "benchmarks/rendering/canonical/adapters.json"),
      `${JSON.stringify(registry, null, 2)}\n`,
    );
  } catch (error) {
    rmSync(directory, { recursive: true, force: true });
    throw error;
  }
  console.log(
    [
      `Created ${workspace}/suite_bench.mjs and package.json for ${id}.`,
      dependency
        ? "Run bun install at the repository root to record the pinned dependency."
        : "Add a pinned renderer dependency to the new workspace.",
      `Implement render() in ${workspace}/suite_bench.mjs.`,
      `Run bun run bench check-adapter ${id} to verify the component page.`,
      "See CONTRIBUTING.md#add-a-renderer for the review and publication steps.",
    ].join("\n"),
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
    const { validateCapture } = await import("../checks/validate.mjs");
    await validateCapture(id, args[0], root);
    console.log(`${id}: publication contract and retained source verified`);
  } else if (command === "new-adapter") scaffoldAdapter(id, root, args);
  else if (command === "check-adapter") checkAdapter(id, args);
  else if (command === "check") {
    for (const task of ["lint", "typecheck", "test:contracts", "test:site"])
      run(["run", task]);
    for (const key of Object.keys(suites))
      run(["tooling/cli/bench.mjs", "validate", key]);
    run(["experiments/sveltekit-streaming/report.mjs", "--check"]);
    run(["site/build.ts"]);
  } else {
    console.log(
      [
        "bun run bench list",
        "bun run bench doctor <suite>",
        "bun run bench run <suite> [options]            # local smoke",
        "bun run bench run <suite> --publish            # full publication protocol",
        "bun run bench validate <suite> [capture.json]  # retained publication evidence",
        "bun run bench new-adapter <id> [--label <name>] [--package <name>@<version>]",
        "bun run bench check-adapter <id> [--workloads <ids>] [--smoke [--out <capture.json>]]",
        "bun run bench check                            # portable contributor checks",
        "",
        "See CONTRIBUTING.md for adding adapters and reproducing captures.",
      ].join("\n"),
    );
    if (command && !["--help", "help"].includes(command)) process.exitCode = 1;
  }
}
if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
