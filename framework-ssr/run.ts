import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import http from "node:http";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  acquireRunLock,
  closeWorkers,
  fetchBody,
  gitMetadata,
  hostMetadata,
  runClosedLoopPhase,
  runOpenLoopPhase,
  spawnWorkers,
  startServer,
  stopServer,
  waitForHealth,
} from "../load/driver.mjs";
import {
  atomicWrite,
  captureId as newCaptureId,
  retainCapture,
} from "../tooling/captures.mjs";
import { buildAll, environment, here, root, targetDirectory } from "./build.ts";
import contract from "./contract.json";
import { sha256, validateSemanticHtml } from "./parity.mjs";
import {
  type Capture,
  type Phase,
  renderReport,
  validateResult,
} from "./report.ts";
import { frameworkSourceFiles } from "./sources.ts";
import { negativeControls } from "./workload-parity.ts";
import type { Workload } from "./workloads.ts";

if (!globalThis.Bun || Bun.version !== "1.4.2")
  throw new Error("Use Bun 1.4.2");
const smoke = process.argv.includes("--smoke");
const parityOnly = process.argv.includes("--parity-only");
const noBuild = process.argv.includes("--no-build");
const argument = (name: string, fallback: string) => {
  const i = process.argv.indexOf(name);
  return i < 0 ? fallback : process.argv[i + 1];
};
const policy = smoke
  ? {
      ...contract.publication,
      repeats: 1,
      concurrency: 4,
      warmupRequests: 2,
      preRollSeconds: 0.2,
      // At the table's 1 req/s rate, one second would schedule only the
      // pre-roll request and leave the measured window empty.
      durationSeconds: 2,
    }
  : contract.publication;
const output = resolve(
  argument(
    "--out",
    join(here, "results", smoke ? "smoke.json" : "latest.json"),
  ),
);
assert.ok(output.endsWith(".json"), "Capture output must end in .json");
if (smoke && output === join(here, "results/latest.json"))
  throw new Error("Smoke captures cannot replace latest.json");
const workersCount = Number(argument("--workers", "8"));
const headers = {
  accept: "text/html",
  "accept-encoding": "identity",
  "cache-control": "no-store",
};
const sourceFiles = frameworkSourceFiles(root);
const release = await acquireRunLock(root, "framework-ssr");
let workers: Awaited<ReturnType<typeof spawnWorkers>> | undefined;
const agent = new http.Agent({ keepAlive: true, maxSockets: 16 });
const labels: Record<string, string> = {
  proa: "Proa",
  exact: "Exact",
  nextjs: "Next.js",
  astro: "Astro",
  sveltekit: "SvelteKit",
};
const portFor = (id: string) => 16230 + contract.engines.indexOf(id);
function serverFor(id: string) {
  const dir = id === "nextjs" ? "next" : id;
  return startServer(
    {
      label: labels[id],
      command:
        id === "proa"
          ? join(targetDirectory, "release/framework-ssr-proa")
          : process.execPath,
      args:
        id === "proa"
          ? []
          : [
              join(
                here,
                "adapters",
                dir,
                id === "sveltekit" ? "server.ts" : "server.mjs",
              ),
            ],
      cwd: root,
    },
    { ...environment, PORT: String(portFor(id)) },
  );
}
async function ready(server: ReturnType<typeof startServer>, id: string) {
  const health = (await waitForHealth(server, portFor(id), agent)) as {
    engine: string;
    runtime?: string;
    framework: string;
    nodeEnv?: string;
    workerThreads?: number;
  };
  assert.equal(health.engine, id);
  if (id !== "proa") {
    assert.equal(health.nodeEnv, "production");
    assert.equal(health.runtime, contract.runtime);
  } else assert.equal(health.workerThreads, 1);
  return health;
}
async function response(id: string, request: string, workload: string) {
  const result = await fetchBody(
    portFor(id),
    `/${workload}?request=${encodeURIComponent(request)}`,
    agent,
    headers,
  );
  assert.equal(result.statusCode, 200);
  assert.match(
    String(result.headers["cache-control"]),
    /no-store/,
    "full-document cache must be disabled",
  );
  return result;
}
try {
  if (!noBuild) await buildAll();
  const source = await gitMetadata(root, sourceFiles);
  const captureId = newCaptureId("framework-ssr");
  const captureDirectory = join(
    here,
    "results",
    smoke || parityOnly ? "local" : ".",
  );
  const raw = join(captureDirectory, "raw", captureId);
  await mkdir(raw, { recursive: true });
  const engines: Array<
    Capture["engines"][number] & {
      parity: {
        pass: boolean;
        semanticSha256: string;
        negativeControls: number;
        responseBytes: number;
      };
    }
  > = [];
  // Complete the entire admission matrix before any timed phase starts.
  for (const id of contract.engines) {
    const server = serverFor(id);
    try {
      const health = await ready(server, id);
      const parityByWorkload: NonNullable<
        Capture["engines"][number]["parityByWorkload"]
      > = {};
      for (const workload of contract.workloads) {
        const key = workload.id as Workload;
        await response(id, "fresh-a", key);
        const first = await response(id, "fresh-b", key),
          second = await response(id, "fresh-b", key);
        const semantic = validateSemanticHtml(
          first.body.toString(),
          "fresh-b",
          key,
        );
        assert.equal(
          sha256(first.body),
          sha256(second.body),
          "same-URL responses must be byte stable",
        );
        const controls = negativeControls(key);
        for (const [from, to] of controls) {
          const changed = first.body.toString().replaceAll(from, to);
          assert.notEqual(changed, first.body.toString());
          assert.throws(
            () => validateSemanticHtml(changed, "fresh-b", key),
            "negative control must fail",
          );
        }
        const fresh = await response(id, "fresh-c", key);
        validateSemanticHtml(fresh.body.toString(), "fresh-c", key);
        await writeFile(join(raw, `${id}-${key}-parity.html`), first.body);
        parityByWorkload[key] = {
          pass: true,
          semanticSha256: semantic,
          negativeControls: controls.length,
          responseBytes: first.body.length,
        };
        console.log(
          `${labels[id]}/${key}: production SSR parity, negative controls and freshness passed`,
        );
      }
      engines.push({
        id,
        framework: health.framework,
        runtime: health.runtime || "Rust / Tokio",
        parity: parityByWorkload.cards,
        parityByWorkload,
        phases: [] as Phase[],
      });
      console.log(`${labels[id]}: production SSR parity and freshness passed`);
    } finally {
      await stopServer(server);
    }
  }
  if (parityOnly) {
    console.log(
      "All 15 framework/workload admission cells passed; no timings collected.",
    );
  } else {
    workers = await spawnWorkers(workersCount);
    for (const workload of contract.workloads)
      for (const mode of ["closed", "open"] as const)
        for (let repeat = 1; repeat <= policy.repeats; repeat++) {
          const order = contract.engines.map(
            (_, i) =>
              contract.engines[(i + repeat - 1) % contract.engines.length],
          );
          for (const id of order) {
            const engine = engines.find((e) => e.id === id);
            assert.ok(engine, `Missing admitted adapter: ${id}`);
            const server = serverFor(id);
            try {
              await ready(server, id);
              const request = `${captureId}-${workload.id}-${mode}-${repeat}`;
              const expected = await response(id, request, workload.id);
              validateSemanticHtml(
                expected.body.toString(),
                request,
                workload.id as Workload,
              );
              for (let i = 0; i < policy.warmupRequests; i++)
                assert.equal(
                  sha256((await response(id, request, workload.id)).body),
                  sha256(expected.body),
                );
              const options: Parameters<typeof runClosedLoopPhase>[0] = {
                workers,
                server,
                port: portFor(id),
                path: `/${workload.id}?request=${encodeURIComponent(request)}`,
                headers,
                concurrency: policy.concurrency,
                rate: workload.fixedRateRps,
                preRollSeconds: policy.preRollSeconds,
                durationSeconds:
                  mode === "closed" && !smoke
                    ? workload.capacityDurationSeconds
                    : policy.durationSeconds,
                timeoutMs: policy.requestTimeoutMs,
                validatorModule: pathToFileURL(join(here, "parity.mjs")).href,
                validatorOptions: { expectedSha256: sha256(expected.body) },
                metricsAgent: agent,
              };
              const phase: Awaited<ReturnType<typeof runClosedLoopPhase>> =
                await (mode === "closed"
                  ? runClosedLoopPhase(options)
                  : runOpenLoopPhase(options));
              if (phase.errorCount || !phase.loadGeneratorValid)
                await writeFile(
                  join(raw, "rejected-phase.json"),
                  JSON.stringify(
                    {
                      engine: id,
                      workload: workload.id,
                      repeat,
                      phase,
                    },
                    null,
                    2,
                  ),
                );
              assert.equal(
                phase.errorCount,
                0,
                `${id} ${mode} request failures`,
              );
              if (!smoke)
                assert.equal(
                  phase.loadGeneratorValid,
                  true,
                  `${id} load generator limited`,
                );
              engine.phases.push({ ...phase, repeat, workload: workload.id });
              console.log(
                `${id}/${workload.id} ${mode} ${repeat}: ${phase.completionThroughputRps.toFixed(1)} responses/s; P99 ${phase.latencyMs.scheduledComplete.p99.toFixed(2)}ms`,
              );
            } finally {
              await stopServer(server);
            }
          }
        }
    const result = {
      schemaVersion: 2,
      status: "pass",
      captureKind: smoke ? "smoke" : "publication",
      captureId,
      capturedAt: new Date().toISOString(),
      host: {
        ...hostMetadata(),
        cloud: process.env.BENCH_HOST_LABEL || null,
        serverCpu: process.env.BENCH_SERVER_CPU || null,
      },
      scenario: contract,
      methodology: policy,
      source,
      engines,
      commands: {
        runtime: contract.runtime,
        build: "bun framework-ssr/build.ts",
        capture: "bun framework-ssr/run.ts",
      },
      limitations: contract.limitations,
    } satisfies Capture;
    validateResult(result, !smoke);
    await mkdir(join(here, "results"), { recursive: true });
    retainCapture(root, captureDirectory, result, sourceFiles);
    atomicWrite(output, `${JSON.stringify(result, null, 2)}\n`);
    atomicWrite(output.replace(/\.json$/, ".md"), renderReport(result));
    console.log(`Validated ${result.captureKind} capture: ${output}`);
  }
} finally {
  if (workers) await closeWorkers(workers);
  agent.destroy();
  await release();
}
