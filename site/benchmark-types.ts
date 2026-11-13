import type startup from "../cold-start/results/latest.json";
import type { Capture as FrameworkCapture } from "../framework-ssr/report.ts";
import type http from "../page-load/results/latest.json";
import type roster from "../rendering/canonical/roster.json";
import type workloadManifest from "../rendering/canonical/workloads.json";
import type rendering from "../rendering/results/latest.json";
import type streaming from "../suspense-load/results/latest.json";
import type catalog from "./catalog.json";
import type { Project } from "./feature-schema.ts";

export type Percentiles = { p50: number; p95: number; p99: number };
export type View = "rendering" | "framework" | "http" | "streaming" | "startup";
export type Metric =
  | "p50"
  | "p99"
  | "cpu"
  | "rss"
  | "throughput"
  | "utilization"
  | "waterfall"
  | "breakdown"
  | "completeP50"
  | "completeP99"
  | "shellP50";
export type ChartMode = "compare" | "bars" | "lines" | "balls" | "table";
export interface Renderer extends Project {
  language: string;
  homepage: string;
  version?: string;
  status: string;
  renderingAdaptation?: {
    label: string;
    reason: string;
    source: string;
    details: string;
    backend?: string;
  };
  coverageReason?: string;
  coverageSource?: string;
  renderingUnsupported?: Record<
    string,
    {
      status?: "unsupported" | "parity-failed";
      reason: string;
      version: string;
      source: string;
    }
  >;
}
export interface Workload {
  id: string;
  label: string;
  description: string;
  cardinality: number;
}
export interface BaseRow {
  id: string;
  source?: string;
  captureId?: string;
  capturedAt?: string;
  detail: string;
  errors?: number;
  p50?: number;
  p95?: number;
  p99?: number;
  throughput?: number;
  cpu?: number;
  rss?: number;
  cpuPercent?: number;
  completeP50?: number;
  completeP99?: number;
  shellP50?: number;
}
export interface RenderRow
  extends Omit<BaseRow, "p50" | "p95" | "p99">,
    Percentiles {
  captureId: string;
  capturedAt: string;
  outputBoundary: string;
  fixture?: string;
  adaptation?: Renderer["renderingAdaptation"];
  samples: number[];
  runPercentiles: Percentiles[];
  outputBytes: number;
}
export interface HttpRow extends BaseRow {
  seriesSamples: Partial<Record<Metric, number[]>>;
  percentiles: { capacity: Percentiles; equalLoad: Percentiles };
  runPercentiles: { capacity: Percentiles[]; equalLoad: Percentiles[] };
  equalLoadRps: number;
  waterfall?: {
    firstByte: number;
    complete: number;
    rate: number;
    repeat: number;
    percentiles: Percentiles;
  };
  flow?: {
    rps: number;
    meanMs: number;
    repeat: number;
    concurrency: number | null;
    errors: number;
    percentiles: Percentiles;
  };
}
export interface StreamRow extends BaseRow {
  seriesSamples: Partial<Record<Metric, number[]>>;
  percentiles: { complete: Percentiles; shell: Percentiles };
  flow: {
    rps: number;
    meanMs: number;
    repeat: number;
    offeredRps: number;
    errors: number;
    percentiles: Percentiles;
  };
}
export interface StartupRow
  extends Omit<BaseRow, "p50" | "p95" | "p99">,
    Percentiles {
  max: number;
  samples: number[];
}
export type ChartRow = RenderRow | HttpRow | StreamRow | StartupRow;
export interface CaptureMeta {
  reviewRefresh?: { note: string };
  date: string;
  capturedAt: string;
  capture: string;
  hash: string;
  artifactSha256: string;
  source: string;
  download: string;
  host: {
    cpu?: string;
    cpuModel?: string;
    cpu_model?: string;
    cloud?: string;
    serverCpuAffinity?: string;
    model?: string;
    cpuAffinity?: { server?: number[] };
    loadAverage1m?: number;
    [key: string]: unknown;
  };
  sourceSnapshot?: string;
  excluded?: { id: string; reason: string }[];
  provenance: unknown;
  methodology: unknown;
  versions: Record<string, string>;
  note: string;
}
export interface BenchmarkData {
  schemaVersion: number;
  renderers: Renderer[];
  ecosystem: Renderer[];
  workloads: Workload[];
  workloadOrder: string[];
  rates: number[];
  rendering: CaptureMeta & {
    rows: Record<string, RenderRow[]>;
    refresh: { note?: string } | null;
    outputBoundary: unknown;
  };
  http: CaptureMeta & { rows: Record<string, HttpRow[]> };
  streaming: CaptureMeta & {
    rows: Record<string, StreamRow[]>;
    excluded: { id: string; reason: string }[];
    methodology: typeof streaming.methodology;
  };
  startup: CaptureMeta & { rows: StartupRow[] };
  framework: CaptureMeta & {
    rows: HttpRow[];
    workloads: Record<string, HttpRow[]>;
    workloadDefinitions: {
      id: string;
      label: string;
      fixedRateRps: number;
      capacityDurationSeconds: number;
      latencyDurationSeconds: number;
    }[];
    sourceSnapshot: string;
    methodology: FrameworkCapture["methodology"];
  };
}
type RenderMeasurement = Omit<
  typeof rendering.measurements.proa.cards,
  "capture_id"
> & { capture_id?: string };
type RenderingCapture = Omit<
  typeof rendering,
  "measurements" | "refresh" | "proa_output"
> & {
  refresh?: {
    renderer: string;
    baseline_captured_at: string;
    note?: string;
  } | null;
  proa_output?: string;
  measurements: Record<string, Record<string, RenderMeasurement>>;
};
type HttpCapture = Omit<typeof http, "engines" | "generatorLimitedPhases"> & {
  generatorLimitedPhases?: unknown[];
  engines: (Omit<(typeof http.engines)[number], "workloads"> & {
    workloads: Record<
      string,
      (typeof http.engines)[number]["workloads"]["cards"]
    >;
  })[];
};
export interface RawRun {
  framework_id: string;
  workload: string;
  repeat: number;
  p50_us: number;
  p95_us: number;
  p99_us: number;
  source_capture_id?: string;
}
export interface Inputs {
  reviewRefresh?: Record<
    View,
    {
      note: string;
      baseline_capture_id: string;
      baseline_captured_at: string;
      proa_capture_id: string;
      proa_captured_at: string;
      proa_revision: string;
    }
  >;
  rendering: RenderingCapture;
  http: HttpCapture;
  streaming: typeof streaming;
  startup: typeof startup;
  framework: FrameworkCapture;
  roster: typeof roster;
  workloadManifest: typeof workloadManifest;
  catalog: typeof catalog;
  processSummaries: RawRun[];
  digests: Record<View, string>;
}
