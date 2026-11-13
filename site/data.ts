// Presentation adapters only. Benchmark execution, fixtures, and statistics stay
// in their existing suites. Never add measurements to the site's source files.
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { workloadDefinitions } from "../framework-ssr/report.ts";
import { validateCanonicalResult } from "../rendering/canonical/report.mjs";
import { summarize } from "../suspense-load/stats.mjs";
import { capturedRenderingContract } from "../tooling/rendering-contract.mjs";
import suites from "../tooling/suites.json" with { type: "json" };
import type {
  BenchmarkData,
  CaptureMeta,
  Inputs,
  Percentiles,
  Renderer,
  View,
} from "./benchmark-types.ts";
import featureProjects from "./feature-projects.json" with { type: "json" };
import { frameworkRows } from "./framework-data.ts";
import { required } from "./required.ts";

export const repositoryRoot = dirname(dirname(fileURLToPath(import.meta.url)));
export const captures = Object.fromEntries(
  Object.values(suites).map((suite) => [
    suite.view,
    `${suite.directory}/results/latest.json`,
  ]),
) as Record<View, string>;
const median = (values: number[]) => summarize(values).p50;
const percentiles = (values: Percentiles[]) =>
  Object.fromEntries(
    (["p50", "p95", "p99"] as const).map((key) => [
      key,
      median(values.map((v) => v[key])),
    ]),
  ) as Percentiles;
function requireValue(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Site data: ${message}`);
}
function positive(value: number, label: string) {
  requireValue(
    Number.isFinite(value) && value > 0,
    `${label} must be finite and positive`,
  );
  return value;
}
function publication(
  capture: Inputs["http"] | Inputs["streaming"] | Inputs["startup"],
  name: string,
  version: number,
) {
  requireValue(
    capture.schemaVersion === version,
    `${name} schema is unsupported`,
  );
  requireValue(
    capture.status === "pass" && capture.captureKind === "publication",
    `${name} is not a publication capture`,
  );
  requireValue(
    Number.isFinite(Date.parse(capture.capturedAt)),
    `${name} has no valid capture date`,
  );
  const ids = capture.engines.map((engine) => engine.id);
  requireValue(
    new Set(ids).size === ids.length,
    `${name} has duplicate engines`,
  );
}
const meta = (
  capture: Inputs[View],
  digest: string,
  name: View,
): CaptureMeta => {
  const rendering = "captured_at" in capture;
  const capturedAt = rendering ? capture.captured_at : capture.capturedAt;
  return {
    date: capturedAt.slice(0, 10),
    capturedAt,
    capture: rendering ? capture.capture_id : capture.scenario.id,
    hash: rendering
      ? capture.provenance.source_sha256
      : capture.source.sourceSha256,
    artifactSha256: digest,
    source: captures[name],
    download: `data/captures/${name}.json`,
    host: capture.host,
    provenance: rendering ? capture.provenance : capture.source,
    methodology:
      "methodology" in capture
        ? capture.methodology
        : "commands" in capture
          ? capture.commands
          : undefined,
    versions: rendering
      ? capture.versions
      : Object.fromEntries(
          capture.engines.map((engine) => {
            const runtime =
              "runtime" in engine
                ? engine.runtime
                : ["react", "marko", "exact", "nextjs", "astro"].includes(
                      engine.id,
                    )
                  ? "javascriptRuntime" in capture.host
                    ? capture.host.javascriptRuntime
                    : null
                  : null;
            return [
              engine.id,
              `${"framework" in engine ? engine.framework : engine.label}${runtime ? ` / ${runtime}` : ""}`,
            ];
          }),
        ),
    note: "limitations" in capture ? capture.limitations.join(" ") : "",
  };
};

export async function loadInputs(root = repositoryRoot) {
  const buffers = {} as Record<View, Buffer>;
  const input = {} as Inputs;
  await Promise.all(
    Object.entries(captures).map(async ([id, path]) => {
      const buffer = await readFile(join(root, path));
      buffers[id as View] = buffer;
      input[id as View] = JSON.parse(buffer.toString());
    }),
  );
  const contract = capturedRenderingContract(root, input.rendering);
  input.roster = contract.roster;
  input.workloadManifest = contract.workloads;
  input.catalog = JSON.parse(
    await readFile(join(root, "site/catalog.json"), "utf8"),
  );
  const processArtifact = input.rendering.raw_artifacts.find((artifact) =>
    /process summaries/i.test(artifact.label),
  );
  requireValue(
    processArtifact,
    "rendering capture has no per-process artifact",
  );
  input.processSummaries = JSON.parse(
    await readFile(
      join(root, "rendering/results", processArtifact.path),
      "utf8",
    ),
  );
  input.digests = Object.fromEntries(
    Object.entries(buffers).map(([id, buffer]) => [
      id,
      createHash("sha256").update(buffer).digest("hex"),
    ]),
  ) as Record<View, string>;
  return { input, buffers };
}

export function normalize(input: Inputs): BenchmarkData {
  const {
    rendering,
    framework,
    http,
    streaming,
    startup,
    roster,
    workloadManifest,
    catalog,
    processSummaries,
    digests,
  } = input;
  for (const project of catalog) {
    for (const [workload, support] of Object.entries(
      project.renderingUnsupported || {},
    )) {
      requireValue(
        workloadManifest.workloads.some((w) => w.id === workload),
        `${project.id}: unsupported status has an unknown workload`,
      );
      requireValue(
        ["unsupported", "parity-failed"].includes(support.status),
        `${project.id}/${workload}: invalid support status`,
      );
      requireValue(
        Boolean(support.reason && support.version && support.source),
        `${project.id}/${workload}: support explanation is incomplete`,
      );
    }
  }
  validateCanonicalResult(rendering, roster, workloadManifest);
  publication(http, "HTTP", 1);
  publication(streaming, "streaming", 3);
  publication(startup, "startup", 1);
  requireValue(
    !http.generatorLimitedPhases?.length,
    "HTTP capture is load-generator limited",
  );
  const rendererIds = new Set(rendering.renderers.map((r) => r.id));
  const renderers: Renderer[] = rendering.renderers
    .map<Renderer>((r) => {
      const display = catalog.find((item) => item.id === r.id);
      requireValue(display, `missing display metadata for ${r.id}`);
      const { renderingUnsupported, ...presentation } = display;
      return {
        ...presentation,
        ...r,
        ...(renderingUnsupported
          ? {
              renderingUnsupported:
                renderingUnsupported as Renderer["renderingUnsupported"],
            }
          : {}),
        logo: `logos/${r.id}.svg`,
        version: (rendering.versions as Record<string, string>)[r.label],
      };
    })
    .concat(
      catalog
        .filter((r) => r.status === "unmeasured" && !rendererIds.has(r.id))
        .map((r) => ({ ...r, logo: `logos/${r.id}.svg` }) as Renderer),
    )
    .sort((a, b) => a.label.localeCompare(b.label));
  // A project admitted to HTTP/startup need not be in the pure-renderer roster.
  const measuredIds = new Set(
    [http, streaming, startup, framework].flatMap((capture) =>
      capture.engines.map((e) => e.id),
    ),
  );
  for (const id of measuredIds) {
    if (renderers.some((r) => r.id === id)) continue;
    const project = featureProjects.find((r) => r.id === id);
    requireValue(project, `missing display metadata for measured engine ${id}`);
    renderers.push({
      ...project,
      status: "unmeasured",
      coverageReason:
        "Measured in application-server suites; no renderer-only capture.",
      coverageSource: project.homepage,
    });
  }
  renderers.sort((a, b) => a.label.localeCompare(b.label));
  for (const capture of [http, streaming, startup, framework]) {
    requireValue(capture.engines.length > 0, "capture has no engines");
    for (const engine of capture.engines)
      requireValue(
        renderers.some((r) => r.id === engine.id),
        `unknown engine ${engine.id}`,
      );
  }
  const output: BenchmarkData = {
    schemaVersion: 1,
    renderers,
    ecosystem: [
      ...renderers,
      ...featureProjects.filter((r) => !renderers.some((v) => v.id === r.id)),
    ].sort((a, b) => a.label.localeCompare(b.label)),
    workloads: rendering.workloads,
    workloadOrder:
      workloadManifest.display_order ??
      workloadManifest.workloads.map((w) => w.id),
    rendering: {
      ...meta(rendering, digests.rendering, "rendering"),
      rows: {},
      refresh: rendering.refresh ?? null,
      outputBoundary: rendering.proa_output ?? null,
    },
    http: { ...meta(http, digests.http, "http"), rows: {} },
    streaming: {
      ...meta(streaming, digests.streaming, "streaming"),
      rows: {},
      excluded: [],
      methodology: streaming.methodology,
    },
    startup: { ...meta(startup, digests.startup, "startup"), rows: [] },
    framework: {
      ...meta(framework, digests.framework, "framework"),
      rows: frameworkRows(framework),
      workloads: Object.fromEntries(
        workloadDefinitions(framework).map((w) => [
          w.id,
          frameworkRows(framework, w.id),
        ]),
      ),
      workloadDefinitions: workloadDefinitions(framework),
      methodology: framework.methodology,
      sourceSnapshot: "data/sources/framework.tar.gz",
    },
    rates: streaming.methodology.ratesRps,
  };
  for (const workload of rendering.workloads) {
    output.rendering.rows[workload.id] = rendering.renderers
      .filter((r) => r.status === "included")
      .map((renderer) => {
        const m = rendering.measurements[renderer.id][workload.id];
        const runs = processSummaries
          .filter(
            (run) =>
              run.framework_id === renderer.id && run.workload === workload.id,
          )
          .sort((a, b) => a.repeat - b.repeat);
        requireValue(
          runs.length === m.independent_processes,
          `${renderer.id}/${workload.id} has missing raw runs`,
        );
        requireValue(
          new Set(runs.map((run) => run.repeat)).size === runs.length,
          `${renderer.id}/${workload.id} has duplicate raw runs`,
        );
        for (const run of runs) {
          requireValue(
            !run.source_capture_id ||
              run.source_capture_id === (m.capture_id ?? rendering.capture_id),
            `${renderer.id}/${workload.id} raw run belongs to another capture`,
          );
          for (const key of ["p50_us", "p95_us", "p99_us"] as const)
            positive(run[key], `${renderer.id}/${workload.id} raw ${key}`);
        }
        for (const key of ["p50_us", "p95_us", "p99_us"] as const)
          requireValue(
            Math.abs(median(runs.map((run) => run[key])) - m[key]) <=
              1e-9 * Math.max(1, m[key]),
            `${renderer.id}/${workload.id} headline differs from raw ${key}`,
          );
        const values = { p50: m.p50_us, p95: m.p95_us, p99: m.p99_us };
        positive(values.p50, `${renderer.id}/${workload.id} render time`);
        return {
          id: renderer.id,
          captureId: m.capture_id ?? rendering.capture_id,
          capturedAt:
            rendering.refresh && renderer.id !== rendering.refresh.renderer
              ? rendering.refresh.baseline_captured_at
              : rendering.captured_at,
          outputBoundary: m.allocation_policy,
          ...values,
          samples: runs.map((r) => r.p50_us),
          runPercentiles: runs.map((r) => ({
            p50: r.p50_us,
            p95: r.p95_us,
            p99: r.p99_us,
          })),
          outputBytes: m.output_bytes,
          detail: `${m.output_bytes.toLocaleString("en-US")} output bytes. ${m.allocation_policy}.`,
        };
      });
    output.http.rows[workload.id] = http.engines.map((engine) => {
      const fixture = engine.workloads[workload.id];
      requireValue(
        fixture?.parity?.byteIdenticalToCanonicalDump === true,
        `${engine.id}/${workload.id} has no HTTP parity`,
      );
      const closed = fixture.phases.filter((p) => p.mode === "closed");
      const open = fixture.phases.filter((p) => p.mode === "open");
      requireValue(
        closed.length === http.methodology.repeats &&
          open.length === http.methodology.repeats,
        `${engine.id}/${workload.id} has missing HTTP phases`,
      );
      const selected = [...closed].sort(
        (a, b) => a.completionThroughputRps - b.completionThroughputRps,
      )[Math.floor(closed.length / 2)];
      const waterfall = [...open].sort(
        (a, b) => a.latencyMs.complete.mean - b.latencyMs.complete.mean,
      )[Math.floor(open.length / 2)];
      const seriesSamples = {
        throughput: closed.map((p) =>
          positive(p.completionThroughputRps, "HTTP throughput"),
        ),
        cpu: closed.map((p) => p.cpu.cpuMsPerSuccessfulRequest),
        rss: closed.map((p) => p.memory.peakSampledRssBytes / 1048576),
        p99: open.map((p) => p.latencyMs.scheduledComplete.p99),
      };
      return {
        id: engine.id,
        ...Object.fromEntries(
          Object.entries(seriesSamples).map(([key, samples]) => [
            key,
            median(samples),
          ]),
        ),
        seriesSamples,
        cpuPercent: median(closed.map((p) => p.cpu.averageCpuPercent)),
        waterfall: {
          firstByte: waterfall.latencyMs.firstByte.mean,
          complete: waterfall.latencyMs.complete.mean,
          rate: required(waterfall.offeredRps),
          repeat: waterfall.repeat,
          percentiles: waterfall.latencyMs.complete,
        },
        flow: {
          rps: selected.completionThroughputRps,
          meanMs: selected.latencyMs.complete.mean,
          repeat: selected.repeat,
          concurrency: selected.concurrency,
          errors: selected.errorCount,
          percentiles: selected.latencyMs.complete,
        },
        percentiles: {
          capacity: percentiles(closed.map((p) => p.latencyMs.complete)),
          equalLoad: percentiles(
            open.map((p) => p.latencyMs.scheduledComplete),
          ),
        },
        runPercentiles: {
          capacity: closed.map((p) => p.latencyMs.complete),
          equalLoad: open.map((p) => p.latencyMs.scheduledComplete),
        },
        equalLoadRps: required(open[0].offeredRps),
        errors: fixture.phases.reduce(
          (sum, phase) => sum + phase.errorCount,
          0,
        ),
        detail: `${engine.server}; ${http.methodology.closedLoopConcurrency} connections at capacity; equal-load comparison at ${required(open[0].offeredRps).toLocaleString("en-US")} requests/s. ${fixture.canonicalDump.bytes.toLocaleString("en-US")} response bytes.`,
      };
    });
  }
  for (const rate of output.rates) {
    output.streaming.rows[rate] = streaming.engines.map((engine) => {
      requireValue(
        engine.parity?.readyPanels === streaming.scenario.boundaries,
        `${engine.id} streaming parity is missing`,
      );
      const phases = engine.phases.filter((phase) => phase.offeredRps === rate);
      requireValue(
        phases.length === streaming.methodology.repeats,
        `${engine.id}/${rate} has missing streaming phases`,
      );
      const selected = [...phases].sort(
        (a, b) => a.completionThroughputRps - b.completionThroughputRps,
      )[Math.floor(phases.length / 2)];
      const seriesSamples = {
        shellP50: phases.map((p) => p.latencyMs.scheduledFirstByte.p50),
        completeP50: phases.map((p) => p.latencyMs.scheduledComplete.p50),
        completeP99: phases.map((p) => p.latencyMs.scheduledComplete.p99),
        throughput: phases.map((p) => p.completionThroughputRps),
      };
      const errors = phases.reduce((sum, p) => sum + p.errorCount, 0);
      return {
        id: engine.id,
        ...Object.fromEntries(
          Object.entries(seriesSamples).map(([key, values]) => [
            key,
            median(values),
          ]),
        ),
        seriesSamples,
        errors,
        flow: {
          rps: selected.completionThroughputRps,
          meanMs: selected.latencyMs.scheduledComplete.mean,
          repeat: selected.repeat,
          offeredRps: rate,
          errors: selected.errorCount,
          percentiles: selected.latencyMs.scheduledComplete,
        },
        percentiles: {
          complete: percentiles(
            phases.map((p) => p.latencyMs.scheduledComplete),
          ),
          shell: percentiles(phases.map((p) => p.latencyMs.scheduledFirstByte)),
        },
        detail: `${rate.toLocaleString("en-US")} offered requests/s; ${errors.toLocaleString("en-US")} errors across ${phases.length} phases. ${engine.parity.responseBytes.toLocaleString("en-US")} streamed bytes.`,
      };
    });
  }
  output.streaming.excluded =
    streaming.methodology.responseValidator === "resolved-content-v2"
      ? []
      : streaming.engines
          .filter((engine) =>
            engine.phases.some((phase) =>
              phase.errorSamples?.some((error) =>
                /missing [1-9]\d* fallbacks and 0 ready panels/.test(error),
              ),
            ),
          )
          .map((engine) => ({
            id: engine.id,
            reason:
              "The capture incorrectly required loading placeholders. A corrected streaming rerun is pending.",
          }));
  for (const rate of output.rates)
    output.streaming.rows[rate] = output.streaming.rows[rate].filter(
      (row) => !output.streaming.excluded.some((entry) => entry.id === row.id),
    );
  output.streaming.note =
    "Multi-thread confirmation runs are excluded. Wire protocols differ. Failed requests stay visible; Flow illustrates successful completions only.";
  output.startup.rows = startup.engines.map((engine) => {
    requireValue(
      engine.starts.length === startup.methodology.starts,
      `${engine.id} has missing startup samples`,
    );
    const stats = engine.summary.firstResponseMs;
    return {
      id: engine.id,
      p50: positive(stats.p50, "startup median"),
      p95: stats.p95,
      p99: stats.p99,
      max: stats.max,
      samples: engine.starts.map((s) => s.firstResponseMs),
      detail: `${engine.starts.length} fresh processes; ${(engine.summary.rssAfterFirstResponseBytes.p50 / 1048576).toFixed(1)} MiB median RSS after the first response.`,
    };
  });
  output.startup.note = `Host load average: ${startup.host.loadAverage1m}. Startup is sensitive to other activity.`;
  return output;
}
