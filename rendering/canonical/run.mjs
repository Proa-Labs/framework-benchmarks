#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { cpus, release as osRelease, tmpdir, totalmem } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { acquireRunLock, hostMetadata } from "../../load/driver.mjs";
import {
  adapterInvocation,
  readAdapters,
  selectIds,
} from "../../tooling/adapters.mjs";
import {
  atomicWrite,
  captureId as newCaptureId,
  retainCapture,
} from "../../tooling/captures.mjs";
import { canonicalDocument, firstDifference } from "./dom.mjs";
import { refreshProa } from "./refresh-proa.mjs";
import { validateProaRenderRun } from "./render-contract.mjs";
import { validateCanonicalResult } from "./report.mjs";
import {
  renderingSourceFiles,
  renderingSourceFingerprint,
} from "./source_fingerprint.mjs";

if (process.versions.bun !== "1.4.2")
  throw new Error("Use pinned Bun 1.4.2 via ./rendering/run-all");

const canonicalDirectory = dirname(fileURLToPath(import.meta.url));
const renderingDirectory = dirname(canonicalDirectory);
const workspaceDirectory = dirname(renderingDirectory);
const externalDirectory = join(renderingDirectory, "external");
const resultDirectory = join(renderingDirectory, "results");
const roster = JSON.parse(
  readFileSync(join(canonicalDirectory, "roster.json"), "utf8"),
);
const workloadManifest = JSON.parse(
  readFileSync(join(canonicalDirectory, "workloads.json"), "utf8"),
);
const adapters = readAdapters(workspaceDirectory);
const refresh = process.argv.includes("--refresh-proa");
const rendererIds = refresh
  ? ["proa"]
  : selectIds(
      argument("--renderers"),
      roster.renderers.map(({ id }) => id),
      Object.keys(adapters),
      "renderer",
    );
const workloads = selectIds(
  argument("--workloads"),
  workloadManifest.workloads.map(({ id }) => id),
  workloadManifest.workloads.map(({ id }) => id),
  "workload",
).map((id) => workloadManifest.workloads.find((w) => w.id === id));
const selectedRenderers = rendererIds.map((id) => adapters[id]);
const referenceId = rendererIds.includes("proa") ? "proa" : "react";
const requiredIds = [...new Set([referenceId, ...rendererIds])];
const selectedSetups = new Set(requiredIds.map((id) => adapters[id].setup));
const completeRoster =
  rendererIds.join(",") === roster.renderers.map((r) => r.id).join(",") &&
  workloads.length === workloadManifest.workloads.length;
const smoke = process.argv.includes("--smoke");
const skipSetup = process.argv.includes("--no-setup");
const parityOnly = process.argv.includes("--parity-only");
const setupOnly = process.argv.includes("--setup-only");
const productScaling = process.argv.includes("--product-scaling");

function argument(name, fallback = undefined) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
}

const knownFlags = new Set([
  "--refresh-proa",
  "--smoke",
  "--no-setup",
  "--parity-only",
  "--setup-only",
  "--product-scaling",
]);
const valueFlags = new Set([
  "--repeats",
  "--renderers",
  "--workloads",
  "--out",
]);
for (let i = 2; i < process.argv.length; i++) {
  const key = process.argv[i];
  if (valueFlags.has(key)) {
    if (!process.argv[i + 1] || process.argv[i + 1].startsWith("--"))
      throw new Error(`${key} requires a value`);
    i++;
  } else if (!knownFlags.has(key)) throw new Error(`Unknown argument: ${key}`);
}
const outputOption = argument("--out");
const explicitOutput = outputOption
  ? resolve(workspaceDirectory, outputOption)
  : null;
const engineering =
  !completeRoster || (!smoke && argument("--repeats", "5") !== "5");
if (engineering && !smoke && !explicitOutput && !parityOnly && !setupOnly)
  throw new Error(
    "Selected/custom runs require --smoke or an explicit --out path",
  );
if (
  explicitOutput &&
  [
    "rendering/results/latest.json",
    "rendering/results/product-scaling.json",
    "page-load/results/latest.json",
    "suspense-load/results/latest.json",
    "cold-start/results/latest.json",
    "framework-ssr/results/latest.json",
  ].some((path) => resolve(workspaceDirectory, path) === explicitOutput)
)
  throw new Error(
    "--out must not target a published capture; omit --out for a full publication run",
  );
const storageDirectory =
  smoke || engineering || explicitOutput
    ? join(resultDirectory, "local")
    : resultDirectory;
const repeats = Number(argument("--repeats", smoke ? 1 : 5));
if (!Number.isInteger(repeats) || repeats < 1) {
  throw new Error("--repeats must be a positive integer");
}
if (productScaling && parityOnly) {
  throw new Error("--product-scaling cannot be combined with --parity-only");
}
if (productScaling && !smoke && repeats !== 5) {
  throw new Error(
    "publication product-scaling captures require five process rotations; use --smoke for a quick validation run",
  );
}

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: workspaceDirectory,
    encoding: "utf8",
    maxBuffer: 128 * 1024 * 1024,
    ...options,
  });
}

function commandExists(command, args = ["--version"], options = {}) {
  try {
    run(command, args, { ...options, stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function resolveRuby() {
  const candidates = [
    process.env.CANONICAL_SUITE_RUBY,
    "/opt/homebrew/opt/ruby/bin/ruby",
    "/usr/local/opt/ruby/bin/ruby",
    "ruby",
  ].filter(Boolean);
  const versionCheck =
    "major, minor = RUBY_VERSION.split('.').first(2).map(&:to_i); exit(major > 3 || (major == 3 && minor >= 2) ? 0 : 1)";
  const ruby = candidates.find((candidate) =>
    commandExists(candidate, ["-e", versionCheck]),
  );
  if (!ruby) throw new Error("Ruby 3.2+ is required for Rails");
  const rubyPath = ruby.includes("/") ? ruby : run("which", [ruby]).trim();
  const rubyDirectory = dirname(rubyPath);
  const bundleCandidate = join(rubyDirectory, "bundle");
  const bundle = commandExists(bundleCandidate, ["-v"])
    ? bundleCandidate
    : "bundle";
  return { ruby: rubyPath, bundle, rubyDirectory };
}

function resolveJavaEnvironment() {
  const homes = [
    process.env.JAVA_HOME,
    "/opt/homebrew/opt/openjdk/libexec/openjdk.jdk/Contents/Home",
    "/usr/local/opt/openjdk/libexec/openjdk.jdk/Contents/Home",
  ].filter(Boolean);
  const javaHome = homes.find((home) => existsSync(join(home, "bin", "java")));
  if (!javaHome) throw new Error("Java 17+ is required for jte and Rocker");
  return {
    JAVA_HOME: javaHome,
    PATH: `${join(javaHome, "bin")}:${process.env.PATH}`,
  };
}

const ruby = selectedSetups.has("rails") ? resolveRuby() : null;
const javaEnvironment =
  selectedSetups.has("jte") || selectedSetups.has("rocker")
    ? resolveJavaEnvironment()
    : null;
const railsDirectory = join(externalDirectory, "rails");
const rustBinary = join(
  workspaceDirectory,
  "target",
  "release",
  "representative_suite_bench",
);
const goBinary = join(externalDirectory, "go", "build", "canonical_suite");
const jteBinary = join(
  externalDirectory,
  "jte",
  "build",
  "install",
  "proa-jte-bench",
  "bin",
  "proa-jte-bench",
);
const rockerBinary = join(
  externalDirectory,
  "rocker",
  "build",
  "install",
  "proa-rocker-bench",
  "bin",
  "proa-rocker-bench",
);

function railsOptions() {
  return {
    cwd: railsDirectory,
    env: { ...process.env, PATH: `${ruby.rubyDirectory}:${process.env.PATH}` },
  };
}

function buildAll() {
  console.log(`Building selected adapters: ${requiredIds.join(", ")}`);
  for (const id of requiredIds) {
    const adapter = adapters[id];
    if (adapter.setup === "bun")
      run(process.execPath, ["install", "--frozen-lockfile"], {
        cwd: resolve(workspaceDirectory, adapter.cwd),
        stdio: "inherit",
      });
    if (adapter.build)
      run(
        adapter.build[0] === "{bun}" ? process.execPath : adapter.build[0],
        adapter.build.slice(1),
        { cwd: resolve(workspaceDirectory, adapter.cwd), stdio: "inherit" },
      );
  }
  if (selectedSetups.has("rust"))
    run(
      "cargo",
      [
        "build",
        "--locked",
        "--release",
        "-p",
        "proa_bench",
        "--features",
        "topcoat",
        "--bin",
        "representative_suite_bench",
      ],
      { stdio: "inherit" },
    );
  if (selectedSetups.has("rails")) {
    try {
      run(ruby.bundle, ["check"], { ...railsOptions(), stdio: "ignore" });
    } catch {
      run(ruby.bundle, ["install"], { ...railsOptions(), stdio: "inherit" });
    }
  }
  if (selectedSetups.has("go")) {
    mkdirSync(dirname(goBinary), { recursive: true });
    run("go", ["build", "-trimpath", "-o", goBinary, "suite_bench.go"], {
      cwd: join(externalDirectory, "go"),
      stdio: "inherit",
    });
  }
  if (selectedSetups.has("jinja2")) {
    const cwd = join(externalDirectory, "jinja");
    if (!existsSync(join(cwd, ".venv/bin/python3")))
      run("python3", ["-m", "venv", ".venv"], { cwd, stdio: "inherit" });
    run(
      join(cwd, ".venv/bin/pip"),
      ["install", "-q", "-r", "requirements.txt"],
      { cwd, stdio: "inherit" },
    );
  }
  for (const id of ["jte", "rocker"])
    if (selectedSetups.has(id)) {
      run(
        "gradle",
        [
          "--no-daemon",
          "--quiet",
          "installDist",
          ...(id === "jte" ? ["copyJteBinaryStaticContent"] : []),
        ],
        {
          cwd: join(externalDirectory, id),
          env: { ...process.env, ...javaEnvironment },
          stdio: "inherit",
        },
      );
    }
  if (selectedSetups.has("php") && !commandExists("php", ["--version"]))
    throw new Error("PHP is required for this adapter");
}

function invocation(rendererId, workloadId, extraArguments) {
  const adapter = adapters[rendererId];
  const selected = adapterInvocation(adapter, workspaceDirectory, {
    bun: process.execPath,
    bundle: ruby?.bundle,
  });
  return {
    ...selected,
    args: [...selected.args, "--workload", workloadId, ...extraArguments],
    options: {
      cwd: selected.cwd,
      env: {
        ...process.env,
        ...(adapter.setup === "jte" || adapter.setup === "rocker"
          ? javaEnvironment
          : {}),
        NODE_ENV: "production",
        ...(adapter.setup === "rails"
          ? { PATH: `${ruby.rubyDirectory}:${process.env.PATH}` }
          : {}),
      },
    },
  };
}

function runCell(rendererId, workloadId, extraArguments) {
  const selected = invocation(rendererId, workloadId, extraArguments);
  return run(selected.command, selected.args, selected.options);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

const parityBytes = {};
async function parityGate(temporaryDirectory, activeWorkloads = workloads) {
  console.log(
    `Parity gate: ${rendererIds.length} renderers × ${activeWorkloads.length} workloads`,
  );
  const browser = await chromium.launch({ headless: true });
  const browserVersion = browser.version();
  const page = await browser.newPage();
  const parity = Object.fromEntries(requiredIds.map((id) => [id, {}]));
  try {
    for (const workload of activeWorkloads) {
      let expectedHtml;
      let expectedCanonical;
      for (const rendererId of requiredIds) {
        const dumpPath = join(
          temporaryDirectory,
          `${workload.id}-${rendererId}.html`,
        );
        runCell(rendererId, workload.id, ["--dump", dumpPath, "--dump-only"]);
        const html = readFileSync(dumpPath, "utf8");
        const canonical = JSON.stringify(await canonicalDocument(page, html));
        if (rendererId === referenceId) {
          expectedHtml = html;
          expectedCanonical = canonical;
          const control =
            workload.negative_control ??
            workloadManifest.workloads.find((w) => w.id === workload.id)
              ?.negative_control;
          if (!control?.from || !control?.to || !html.includes(control.from))
            throw new Error(
              `${workload.id} needs a negative_control fixture mutation`,
            );
          const adversarial = html.replace(control.from, control.to);
          const changed = JSON.stringify(
            await canonicalDocument(page, adversarial),
          );
          if (changed === canonical) {
            throw new Error(
              `${workload.id} parity negative control did not fail`,
            );
          }
        } else if (canonical !== expectedCanonical) {
          const difference = firstDifference(expectedCanonical, canonical);
          throw new Error(
            `${rendererId}/${workload.id} failed semantic DOM parity at canonical byte ${difference.index}\nexpected: ${difference.expected}\nactual:   ${difference.actual}`,
          );
        }
        parityBytes[rendererId] ??= {};
        parityBytes[rendererId][workload.id] = Buffer.byteLength(html);
        parity[rendererId][workload.id] = {
          status: "pass",
          mode: "semantic DOM",
          canonical_sha256: sha256(canonical),
          output_bytes: Buffer.byteLength(html),
          payload_delta_bytes:
            Buffer.byteLength(html) - Buffer.byteLength(expectedHtml),
          byte_equal_to_proa: html === expectedHtml,
        };
        process.stdout.write(".");
      }
      console.log(
        ` ${workload.id} ${parity[referenceId][
          workload.id
        ].canonical_sha256.slice(0, 16)}`,
      );
    }
  } finally {
    await page.close();
    await browser.close();
  }
  return { parity, browserVersion };
}

function median(values) {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function benchmark(temporaryDirectory, activeWorkloads = workloads) {
  console.log(
    `Benchmarking ${
      rendererIds.length * activeWorkloads.length
    } cells across ${repeats} independent process rotations`,
  );
  const processResults = [];
  for (let repeat = 0; repeat < repeats; repeat += 1) {
    for (
      let workloadIndex = 0;
      workloadIndex < activeWorkloads.length;
      workloadIndex += 1
    ) {
      const workload = activeWorkloads[workloadIndex];
      const iterations = smoke ? 3 : workload.iterations;
      const warmup = smoke ? 1 : workload.warmup;
      const rotated = rendererIds.map(
        (_, index) =>
          rendererIds[(index + repeat + workloadIndex) % rendererIds.length],
      );
      for (const rendererId of rotated) {
        const resultPath = join(
          temporaryDirectory,
          `run-${repeat}-${workload.id}-${rendererId}.json`,
        );
        const output = runCell(rendererId, workload.id, [
          "--iterations",
          String(iterations),
          "--warmup",
          String(warmup),
          "--out",
          resultPath,
        ]).trim();
        const cell = JSON.parse(readFileSync(resultPath, "utf8"));
        if (rendererId === "proa") validateProaRenderRun(cell);
        if (cell.framework_id !== rendererId || cell.workload !== workload.id) {
          throw new Error(
            `${rendererId}/${workload.id} returned identity ${cell.framework_id}/${cell.workload}`,
          );
        }
        if (cell.workload_cardinality !== workload.cardinality) {
          throw new Error(
            `${rendererId}/${workload.id} returned cardinality ${cell.workload_cardinality}; expected ${workload.cardinality}`,
          );
        }
        if (/reus|pool|cached output/i.test(cell.allocation_policy)) {
          throw new Error(
            `${rendererId}/${workload.id} does not declare fresh independently owned output: ${cell.allocation_policy}`,
          );
        }
        for (const metric of [
          "min_us",
          "mean_us",
          "p50_us",
          "p95_us",
          "p99_us",
          "max_us",
        ]) {
          if (!Number.isFinite(cell[metric]) || cell[metric] < 0)
            throw new Error(`${rendererId}/${workload.id}: invalid ${metric}`);
        }
        if (
          !(
            cell.min_us <= cell.p50_us &&
            cell.p50_us <= cell.p95_us &&
            cell.p95_us <= cell.p99_us &&
            cell.p99_us <= cell.max_us
          ) ||
          cell.iterations !== iterations ||
          cell.warmup !== warmup ||
          cell.output_bytes !== parityBytes[rendererId]?.[workload.id]
        )
          throw new Error(
            `${rendererId}/${workload.id}: timing/output contract mismatch`,
          );
        processResults.push({ ...cell, repeat });
        console.log(output.split("\n")[0]);
      }
    }
  }

  const measurements = Object.fromEntries(rendererIds.map((id) => [id, {}]));
  for (const rendererId of rendererIds) {
    for (const workload of activeWorkloads) {
      const cells = processResults.filter(
        (cell) =>
          cell.framework_id === rendererId && cell.workload === workload.id,
      );
      if (cells.length !== repeats) {
        throw new Error(
          `${rendererId}/${workload.id} has ${cells.length}/${repeats} process results`,
        );
      }
      const sizes = new Set(cells.map(({ output_bytes }) => output_bytes));
      if (sizes.size !== 1) {
        throw new Error(
          `${rendererId}/${workload.id} payload changed between processes`,
        );
      }
      const p50s = cells.map(({ p50_us }) => p50_us);
      measurements[rendererId][workload.id] = {
        p50_us: median(p50s),
        p95_us: median(cells.map(({ p95_us }) => p95_us)),
        p99_us: median(cells.map(({ p99_us }) => p99_us)),
        mean_us: median(cells.map(({ mean_us }) => mean_us)),
        process_p50_min_us: Math.min(...p50s),
        process_p50_max_us: Math.max(...p50s),
        independent_processes: repeats,
        samples_per_process: cells[0].iterations,
        warmups_per_process: cells[0].warmup,
        output_bytes: cells[0].output_bytes,
        allocation_policy: cells[0].allocation_policy,
      };
    }
  }
  return { processResults, measurements };
}

async function captureProductScaling(temporaryDirectory) {
  const counts = [12, 96, 768];
  const capturedAt = new Date().toISOString();
  const fingerprint = sourceFingerprint();
  const previousCount = process.env.PROA_BENCH_PRODUCT_COUNT;
  const measurements = Object.fromEntries(rendererIds.map((id) => [id, {}]));
  const parity = Object.fromEntries(rendererIds.map((id) => [id, {}]));
  const processResults = [];
  let browserVersion = null;

  try {
    for (const count of counts) {
      process.env.PROA_BENCH_PRODUCT_COUNT = String(count);
      const workload = {
        id: "products",
        label: `${count}-product grid`,
        cardinality: count,
        description: `${count} product cards and ${count * 5} SVG stars`,
        iterations: count === 12 ? 2_000 : count === 96 ? 500 : 100,
        warmup: count === 12 ? 200 : count === 96 ? 50 : 10,
      };
      const countDirectory = join(temporaryDirectory, String(count));
      mkdirSync(countDirectory, { recursive: true });
      const parityRun = await parityGate(countDirectory, [workload]);
      browserVersion ??= parityRun.browserVersion;
      const benchmarkResult = benchmark(countDirectory, [workload]);
      for (const rendererId of rendererIds) {
        parity[rendererId][count] = parityRun.parity[rendererId].products;
        measurements[rendererId][count] =
          benchmarkResult.measurements[rendererId].products;
      }
      processResults.push(...benchmarkResult.processResults);
    }
  } finally {
    if (previousCount === undefined)
      delete process.env.PROA_BENCH_PRODUCT_COUNT;
    else process.env.PROA_BENCH_PRODUCT_COUNT = previousCount;
  }

  const benchmarkVersion = "product-scaling-v1";
  const captureId = newCaptureId(benchmarkVersion, capturedAt);
  const environment = metadata(capturedAt, fingerprint, browserVersion);
  if (!smoke) {
    const rawDirectory = join(storageDirectory, "raw", captureId);
    mkdirSync(rawDirectory, { recursive: true });
    writeFileSync(
      join(rawDirectory, "process-summaries.json"),
      `${JSON.stringify(processResults, null, 2)}\n`,
    );
  }
  const result = {
    schema_version: 1,
    benchmark_version: benchmarkVersion,
    capture_id: captureId,
    capture_kind: smoke ? "smoke" : "engineering",
    status: "pass",
    captured_at: capturedAt,
    completed_at: new Date().toISOString(),
    host: environment.host,
    counts,
    renderers: selectedRenderers.map(({ id, label, language }) => ({
      id,
      label,
      language,
    })),
    parity,
    measurements,
    versions: environment.versions,
    provenance: environment.provenance,
    command: `./rendering/run-all --product-scaling${smoke ? " --smoke" : ""}`,
    limitations: [
      "Renderer-only latency excludes routing, middleware, databases, HTTP transfer, hydration, and network latency.",
      "Every row builds a fresh independently owned response; fixture data construction is outside the timed region.",
      "This engineering capture describes one machine and one scaling workload; it is not a universal application ranking.",
    ],
    ...(smoke
      ? {}
      : { raw_artifact: `raw/${captureId}/process-summaries.json` }),
  };
  const outputName =
    smoke || engineering
      ? "product-scaling-smoke.json"
      : "product-scaling.json";
  retainCapture(
    workspaceDirectory,
    storageDirectory,
    result,
    renderingSourceFiles(workspaceDirectory),
    { prefix: "/" },
  );
  atomicWrite(
    explicitOutput ?? join(resultDirectory, outputName),
    `${JSON.stringify(result, null, 2)}\n`,
  );
  console.log(
    `Product-scaling capture passed and wrote rendering/results/${outputName}.`,
  );
}

function sourceFingerprint() {
  return renderingSourceFingerprint(workspaceDirectory);
}

function firstLine(command, args, options = {}) {
  try {
    return run(command, args, options).trim().split("\n")[0];
  } catch {
    return null;
  }
}

function packageVersion(directory, name) {
  const packagePath = join(directory, "node_modules", name, "package.json");
  return existsSync(packagePath)
    ? JSON.parse(readFileSync(packagePath, "utf8")).version
    : null;
}

function cargoPackage(name) {
  const lockfile = readFileSync(join(workspaceDirectory, "Cargo.lock"), "utf8");
  for (const block of lockfile.split("[[package]]").slice(1)) {
    if (block.match(/^\s*name = "([^"]+)"/m)?.[1] !== name) continue;
    const version = block.match(/^version = "([^"]+)"/m)?.[1] ?? "unknown";
    const source = block.match(/^source = "([^"]+)"/m)?.[1] ?? null;
    return { version, source };
  }
  return { version: "unknown", source: null };
}

function dependencyVersion(path, pattern) {
  return readFileSync(path, "utf8").match(pattern)?.[1] ?? "unknown";
}

function proaVersion() {
  const dependency = cargoPackage("proa_core");
  const commit = dependency.source?.match(/#([a-f0-9]{40})$/)?.[1];
  const branch = decodeURIComponent(
    dependency.source?.match(/[?&]branch=([^&#]+)/)?.[1] ?? "",
  );
  const branchNote = branch && branch !== "main" ? ` (${branch})` : "";
  return `${dependency.version}${commit ? ` @ ${commit}` : ""}${branchNote}`;
}

function adapterVersions(base) {
  for (const adapter of selectedRenderers)
    if (!base[adapter.label]) {
      if (adapter.versionPackage)
        base[adapter.label] = packageVersion(
          resolve(workspaceDirectory, adapter.cwd),
          adapter.versionPackage,
        );
      else if (adapter.versionCommand) {
        const selected = adapterInvocation(
          {
            ...adapter,
            command: adapter.versionCommand[0],
            args: adapter.versionCommand.slice(1),
          },
          workspaceDirectory,
          { bun: process.execPath, bundle: ruby?.bundle },
        );
        base[adapter.label] = firstLine(selected.command, selected.args, {
          cwd: selected.cwd,
        });
      }
      if (!base[adapter.label]) {
        if (!smoke && !engineering && !explicitOutput)
          throw new Error(
            `${adapter.id}: set versionPackage or versionCommand before publication`,
          );
        base[adapter.label] = "local adapter; see captured source";
      }
    }
  return Object.fromEntries(
    Object.entries(base).filter(([label]) =>
      [
        "Playwright",
        "Chromium",
        ...selectedRenderers.map((r) => r.label),
      ].includes(label),
    ),
  );
}

function metadata(capturedAt, fingerprint, browserVersion) {
  const firstCpu = cpus()[0];
  const node = process.versions.bun
    ? `Bun ${process.versions.bun}`
    : `Node ${process.version}`;
  const rust = selectedSetups.has("rust")
    ? firstLine("rustc", ["--version"])
    : null;
  const rubyVersion = ruby ? firstLine(ruby.ruby, ["-v"]) : null;
  const railsVersion = ruby
    ? firstLine(ruby.bundle, ["exec", "rails", "--version"], railsOptions())
    : null;
  const java = javaEnvironment
    ? firstLine(join(javaEnvironment.JAVA_HOME, "bin", "java"), ["--version"], {
        env: { ...process.env, ...javaEnvironment },
      })
    : null;
  const go = selectedSetups.has("go") ? firstLine("go", ["version"]) : null;
  const python = selectedSetups.has("jinja2")
    ? firstLine(join(externalDirectory, "jinja", ".venv", "bin", "python3"), [
        "--version",
      ])
    : null;
  const php = selectedSetups.has("php")
    ? firstLine("php", ["--version"])
    : null;
  const jinja = selectedSetups.has("jinja2")
    ? firstLine(join(externalDirectory, "jinja", ".venv", "bin", "python3"), [
        "-c",
        "import jinja2; print(jinja2.__version__)",
      ])
    : null;
  const jte = dependencyVersion(
    join(externalDirectory, "jte", "build.gradle"),
    /gg\.jte:jte:([^']+)'/,
  );
  const rocker = dependencyVersion(
    join(externalDirectory, "rocker", "build.gradle"),
    /version = '([^']+)'/,
  );
  return {
    captured_at: capturedAt,
    host: {
      machineId: hostMetadata().machineId,
      campaignId: hostMetadata().campaignId,
      cpu_model: firstCpu?.model ?? "unknown CPU",
      cloud: process.env.BENCH_HOST_LABEL || null,
      server_cpu_affinity: process.env.BENCH_SERVER_CPU || null,
      logical_cpus: cpus().length,
      memory_bytes: totalmem(),
      architecture: process.arch,
      os_name:
        process.platform === "darwin" ? "macOS (Darwin)" : process.platform,
      os_release: osRelease(),
    },
    versions: adapterVersions({
      Proa: `${proaVersion()} / ${rust}`,
      Marko: `${packageVersion(
        join(externalDirectory, "marko"),
        "marko",
      )} / ${node}`,
      React: `${packageVersion(
        join(externalDirectory, "react"),
        "react",
      )} / ${node}`,
      Vue: `${packageVersion(join(externalDirectory, "vue"), "vue")} / ${node}`,
      Svelte: `${packageVersion(
        join(externalDirectory, "svelte"),
        "svelte",
      )} / ${node}`,
      Rails: `${railsVersion} / ${rubyVersion}`,
      jte: `${jte} / ${java}`,
      Rocker: `${rocker} / ${java}`,
      Handlebars: `${packageVersion(
        join(externalDirectory, "handlebars"),
        "handlebars",
      )} / ${node}`,
      "Go html/template": go,
      Jinja2: `${jinja} / ${python}`,
      PHP: php,
      Askama: `${cargoPackage("askama").version} / ${rust}`,
      Sailfish: `${cargoPackage("sailfish").version} / ${rust}`,
      Leptos: `${cargoPackage("leptos").version} / ${rust}`,
      Dioxus: `${cargoPackage("dioxus").version} + dioxus-ssr ${
        cargoPackage("dioxus-ssr").version
      } / ${rust}`,
      Topcoat: `${cargoPackage("topcoat").version} / ${rust}`,
      Playwright: packageVersion(workspaceDirectory, "playwright"),
      Chromium: browserVersion,
    }),
    provenance: {
      harness_commit: run("git", ["rev-parse", "HEAD"], {
        cwd: workspaceDirectory,
      }).trim(),
      dirty:
        run("git", ["status", "--porcelain"], {
          cwd: workspaceDirectory,
        }).trim().length > 0,
      source_sha256: fingerprint,
    },
  };
}

const releaseRunLock = await acquireRunLock(workspaceDirectory, "canonical");
let temporaryDirectory;
try {
  if (refresh) {
    if (
      smoke ||
      parityOnly ||
      setupOnly ||
      explicitOutput ||
      repeats !== 5 ||
      argument("--renderers") ||
      argument("--workloads")
    )
      throw new Error(
        "PROA refresh requires the full five-process protocol without custom selections/output",
      );
    if (!skipSetup) buildAll();
    temporaryDirectory = mkdtempSync(join(tmpdir(), "proa-refresh-"));
    await refreshProa({
      root: workspaceDirectory,
      workloads,
      benchmark,
      parityGate,
      fingerprint: sourceFingerprint(),
      temporaryDirectory,
      scaling: productScaling,
    });
  } else {
    if (!skipSetup) buildAll();
    if (setupOnly) {
      console.log("All canonical adapters are built and ready.");
      await releaseRunLock();
      process.exit(0);
    }
    for (const path of [
      ["rust", rustBinary],
      ["go", goBinary],
      ["jte", jteBinary],
      ["rocker", rockerBinary],
    ]
      .filter(([setup]) => selectedSetups.has(setup))
      .map(([, path]) => path)) {
      if (!existsSync(path)) {
        throw new Error(`canonical adapter build output is missing: ${path}`);
      }
    }

    mkdirSync(resultDirectory, { recursive: true });
    temporaryDirectory = mkdtempSync(join(tmpdir(), "proa-canonical-"));
    if (productScaling) {
      await captureProductScaling(temporaryDirectory);
    } else {
      const capturedAt = new Date().toISOString();
      const fingerprint = sourceFingerprint();
      const parityRun = await parityGate(temporaryDirectory);
      const parity = parityRun.parity;
      if (parityOnly) {
        writeFileSync(
          join(resultDirectory, "canonical-parity.json"),
          `${JSON.stringify(
            {
              schema_version: 1,
              captured_at: capturedAt,
              browser_version: parityRun.browserVersion,
              parity,
            },
            null,
            2,
          )}\n`,
        );
        console.log(
          "All canonical parity cells passed; timing was not requested.",
        );
      }
      if (!parityOnly) {
        const benchmarkResult = benchmark(temporaryDirectory);
        const captureId = newCaptureId("canonical-ssr-v1", capturedAt);
        for (const renderer of selectedRenderers) {
          for (const workload of workloads) {
            benchmarkResult.measurements[renderer.id][workload.id].capture_id =
              captureId;
          }
        }
        const environment = metadata(
          capturedAt,
          fingerprint,
          parityRun.browserVersion,
        );
        const result = {
          schema_version: 2,
          benchmark_version: "canonical-ssr-v1",
          capture_id: captureId,
          capture_kind: smoke
            ? "smoke"
            : engineering
              ? "engineering"
              : "canonical",
          status: "pass",
          captured_at: capturedAt,
          completed_at: new Date().toISOString(),
          host: environment.host,
          workloads,
          renderers: selectedRenderers.map(({ id, label, language }) => ({
            id,
            label,
            language,
            status: "included",
          })),
          parity,
          measurements: benchmarkResult.measurements,
          proa_output:
            "Fresh owned RenderBuffer per iteration. Allocation and rendering are timed; flattening/copying, encoding, parity, hashing and output destruction are outside the render timer.",
          versions: environment.versions,
          provenance: environment.provenance,
          commands: [
            "bun install --frozen-lockfile (JavaScript adapter directories)",
            "bundle check || bundle install (Rails adapter directory)",
            "cargo build --locked --release -p proa_bench --features topcoat --bin representative_suite_bench",
            "go build -trimpath -o rendering/external/go/build/canonical_suite rendering/external/go/suite_bench.go",
            "python3 -m venv rendering/external/jinja/.venv && pip install -r rendering/external/jinja/requirements.txt",
            "gradle --no-daemon --quiet installDist copyJteBinaryStaticContent (jte adapter directory)",
            "gradle --no-daemon --quiet installDist (Rocker adapter directory)",
            ["bun", "rendering/canonical/run.mjs", ...process.argv.slice(2)]
              .map((value) => JSON.stringify(value))
              .join(" "),
          ],
          limitations: [
            "Renderer-only latency excludes routing, middleware, databases, HTTP transfer, hydration, and network latency.",
            "Semantic DOM parity permits documented serializer metadata and whitespace differences; payload deltas remain visible.",
            "This capture describes one machine and these three workloads; it is not a universal application ranking.",
          ],
          raw_artifacts: [
            {
              label: "Per-process summaries",
              path: `raw/${captureId}/process-summaries.json`,
            },
            { label: "Result-table migration map", path: "../MIGRATION.md" },
          ],
        };
        const rawDirectory = join(storageDirectory, "raw", captureId);
        mkdirSync(rawDirectory, { recursive: true });
        writeFileSync(
          join(rawDirectory, "process-summaries.json"),
          `${JSON.stringify(benchmarkResult.processResults, null, 2)}\n`,
          { flag: "wx" },
        );
        if (smoke || engineering || explicitOutput) {
          retainCapture(
            workspaceDirectory,
            storageDirectory,
            result,
            renderingSourceFiles(workspaceDirectory),
            { prefix: "/" },
          );
          atomicWrite(
            explicitOutput ?? join(resultDirectory, "canonical-smoke.json"),
            `${JSON.stringify(result, null, 2)}\n`,
          );
          console.log(
            `Local capture ${captureId} passed; public latest files were not modified.`,
          );
        } else {
          validateCanonicalResult(result, roster, workloadManifest);
          retainCapture(
            workspaceDirectory,
            storageDirectory,
            result,
            renderingSourceFiles(workspaceDirectory),
            { prefix: "/" },
          );
          atomicWrite(
            join(resultDirectory, "latest.json"),
            `${JSON.stringify(result, null, 2)}\n`,
          );
          run(
            process.execPath,
            [join(renderingDirectory, "generate-report.mjs")],
            {
              cwd: workspaceDirectory,
              stdio: "inherit",
            },
          );
          console.log(`Canonical capture ${captureId} is complete.`);
        }
      }
    }
  }
} finally {
  if (temporaryDirectory)
    rmSync(temporaryDirectory, { recursive: true, force: true });
  await releaseRunLock();
}
