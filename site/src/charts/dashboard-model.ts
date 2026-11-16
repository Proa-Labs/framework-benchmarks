import type {
  BenchmarkData,
  ChartMode,
  ChartRow,
  HttpRow,
  Metric,
  Renderer,
  RenderRow,
  StartupRow,
  StreamRow,
  View,
} from "../../benchmark-types.ts";
import { required } from "../../required.ts";
export interface DashboardState {
  section: string;
  view: View;
  workload: string;
  rate: number;
  chart: ChartMode;
  flowPlaying: boolean;
  render: "p50" | "rss";
  http: Metric;
  framework: Metric;
  stream: Metric | "completion";
  selected: string[];
  focus: string | null;
  types: string[];
}
export interface StatTarget {
  run?: number | null;
  rate?: number | null;
  flow?: boolean;
}
export type DashboardModel = ReturnType<typeof createDashboardModel>;

import { ALL_GROUPS, matchesGroups, normalizeGroups } from "../filters.ts";

const fineNumbers = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});
const regularNumbers = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
});
export function createDashboardModel(data: BenchmarkData, search = "") {
  const esc = (v: unknown) =>
    String(v).replace(
      /[&<>"']/g,
      (c) =>
        (
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          }) as Record<string, string>
        )[c],
    );
  const fmt = (n: number) =>
    (n < 10 ? fineNumbers : regularNumbers).format(Number(n));
  const workloadOrder = data.workloadOrder ?? data.workloads.map((w) => w.id);
  const orderedWorkloads = () =>
    workloadOrder.map((id) =>
      required(data.workloads.find((w) => w.id === id)),
    );
  const renderersById = new Map(data.ecosystem.map((r) => [r.id, r]));
  const renderer = (id: string | null): Renderer | undefined =>
      id === null ? undefined : renderersById.get(id),
    name = (id: string) => renderer(id)?.label || id;
  const logo = (id: string) =>
    `<span class="fw-logo-mark" style="--logo-mask:url('${id === "jte" ? "/logos/jte-mark.svg" : `/${required(renderer(id)).logo}`}')" aria-hidden="true"><img class="fw-logo" data-logo="${id}" src="/${required(renderer(id)).logo}" width="18" height="18" loading="lazy" decoding="async" alt=""></span>`;
  const frameworkUsesJsSsr = () =>
    /\bBun\b/.test(data.framework.versions.exact || "");
  const label = (
    id: string,
    framework = state.view === "framework" && state.section === "performance",
  ) =>
    `<span class="fw-renderer">${logo(id)}<span>${renderer(id)?.renderingAdaptation && state.view === "rendering" && state.section === "performance" ? `<span class="fw-fixture-adapted">${esc(name(id))}</span><sup>†</sup>` : esc(name(id))}${id === "exact" && ((framework && frameworkUsesJsSsr()) || (state.view === "rendering" && state.section === "performance" && renderer(id)?.renderingAdaptation)) ? " (JS SSR)" : ""}</span></span>`;
  const repositoryLink = (id: string) => {
    const repository = renderer(id)?.repository;
    return repository
      ? `<a class="fw-repo-link" href="${esc(repository)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(name(id))} GitHub repository (opens in a new tab)" title="${esc(name(id))} on GitHub"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h6v6M21 3l-9 9"/><path d="M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5"/></svg></a>`
      : "";
  };
  const defaults: DashboardState = {
    section: "performance",
    view: "rendering",
    workload: "cards",
    rate: 1000,
    chart: "compare",
    flowPlaying: true,
    render: "p50",
    http: "throughput",
    framework: "throughput",
    stream: "completion",
    selected: data.renderers.map((r) => r.id),
    focus: null,
    types: [...ALL_GROUPS],
  };
  const state = { ...defaults, selected: [...defaults.selected] };
  const isVisible = (r: { id: string }) =>
    state.selected.includes(r.id) &&
    matchesGroups(required(renderer(r.id)), state.types);
  const frameworkWorkloads = () => data.framework.workloadDefinitions;
  const suites = {
    framework: {
      title: "Framework SSR",
      path: "benchmarks/framework-ssr/results/latest.json",
      method: `${data.framework.methodology.repeats} rotated independent production server processes per phase kind. Capacity settings are shared within each workload. ${frameworkWorkloads()
        .map(
          (w) =>
            `${w.label}: ${w.capacityConcurrency} connections, ${w.capacityDurationSeconds}s capacity window; latency at ${w.fixedRateRps} scheduled requests/s for ${w.latencyDurationSeconds}s`,
        )
        .join(
          ". ",
        )}. Every response is validated; generator-limited phases are rejected.`,
      scope: `Production HTTP routing → complete SSR HTML. Shared workloads (${frameworkWorkloads()
        .map((w) => w.label)
        .join(
          ", ",
        )}) with escaping, branches, lists and a request-specific value. Framework shells may differ. ${frameworkUsesJsSsr() ? "Exact uses its production JavaScript SSR backend on Bun; its native Rust render host is not measured in this capture. " : ""}No full-document cache, database, external I/O or browser hydration timing.`,
    },
    rendering: {
      get title() {
        return state.render === "rss"
          ? "SSR process peak RSS"
          : "SSR render latency";
      },
      path: "benchmarks/rendering/results/latest.json",
      get method() {
        return state.render === "rss"
          ? "The OS records peak RSS for each native renderer process; reading it after exit adds no work to the render timer. The headline is the median of five independent process peaks. No launcher or build process is substituted for the native renderer."
          : "Five independent processes. Bars show the median process P50; boxes summarize those five process medians, not individual render latency. Each render allocates fresh output using its native API. Sailfish learns the output size during warmup. There is no separate allocator-priming step.";
      },
      get scope() {
        return state.render === "rss"
          ? "Whole-process lifetime: runtime startup, prepared data, template initialization, warmup, rendering and output verification. This is resident process memory, not allocation per render. Compare within this workload and memory metric."
          : "Prepared data → a complete, freshly owned HTML output. Each adapter uses its declared native output type; Proa may return a RenderBuffer without String conversion. Includes rendering, formatting, and output allocation. Excludes data setup, HTTP, routing, databases, hydration, and network transfer. Strict rows passed unchanged DOM/class parity. Exact† uses separately checked native styles and markup; its adaptation is disclosed.";
      },
    },
    http: {
      title: "HTTP capacity",
      path: "benchmarks/http/results/latest.json",
      method:
        "Three fresh server processes per workload. Capacity and CPU: 64 closed-loop connections. Equal-load latency: fixed-rate arrivals.",
      scope:
        "HTTP/1.1 loopback, keep-alive, compression off; one core of work. Every response matches its parity-gated dump. No database or external I/O.",
    },
    streaming: {
      title: "Streaming",
      path: "benchmarks/streaming/results/latest.json",
      method:
        "Median of three independent phases per offered rate. Latency starts at scheduled arrival and includes queueing.",
      scope:
        "96 cards across eight async boundaries with 5–90 ms in-memory delays. Per-core servers, compression off. No database. Wire protocols differ.",
    },
    startup: {
      title: "Cold start",
      path: "benchmarks/cold-start/results/latest.json",
      method:
        "15 fresh process starts; two untimed starts warm the disk cache. Boxes show the start-time distribution, with min–max whiskers.",
      scope:
        "Process spawn → first complete product-grid response, including runtime, fixture setup, and first render. Sensitive to other host activity.",
    },
  };
  const viewDefaults: Record<
    View,
    Pick<DashboardState, "chart" | "workload">
  > = {
    rendering: { chart: "compare", workload: "cards" },
    framework: { chart: "bars", workload: frameworkWorkloads()[0].id },
    http: { chart: "bars", workload: "cards" },
    streaming: { chart: "lines", workload: "products" },
    startup: { chart: "bars", workload: "products" },
  };
  const viewStateKeys = [
    "chart",
    "workload",
    "rate",
    "render",
    "http",
    "framework",
    "stream",
  ] as const;
  const rememberedViews = new Map<View, Partial<DashboardState>>();
  const rememberView = () =>
    rememberedViews.set(
      state.view,
      Object.fromEntries(viewStateKeys.map((key) => [key, state[key]])),
    );
  const switchView = (view: View) => {
    if (view === state.view) return;
    rememberView();
    Object.assign(
      state,
      Object.fromEntries(viewStateKeys.map((key) => [key, defaults[key]])),
      viewDefaults[view],
      rememberedViews.get(view),
      { view, focus: null },
    );
  };
  // The URL is the shareable state. It contains only allowlisted UI values.
  const restore = (search: string) => {
    Object.assign(state, defaults, {
      selected: [...defaults.selected],
      types: [...ALL_GROUPS],
    });
    const params = new URLSearchParams(search);
    const allowed = {
      section: ["performance", "ecosystem"],
      view: Object.keys(suites),
      workload: [
        ...data.workloads.map((w) => w.id),
        ...frameworkWorkloads().map((w) => w.id),
        "catalog",
      ],
      render: ["p50", "rss"],
      framework: ["throughput", "p50", "p99", "cpu", "rss"],
      chart: ["compare", "bars", "lines", "balls", "table"],
      http: [
        "throughput",
        "cpu",
        "utilization",
        "waterfall",
        "breakdown",
        "p99",
        "rss",
      ],
      stream: [
        "completion",
        "completeP99",
        "completeP50",
        "shellP50",
        "throughput",
      ],
    };
    const view = allowed.view.includes(params.get("view") ?? "")
      ? (params.get("view") as View)
      : defaults.view;
    Object.assign(state, viewDefaults[view], { view });
    for (const [key, values] of Object.entries(allowed))
      if (values.includes(params.get(key) ?? ""))
        Object.assign(state, { [key]: params.get(key) });
    if (
      state.render === "rss" &&
      state.view === "rendering" &&
      state.chart === "balls"
    )
      state.chart = "bars";
    if (data.rates.includes(Number(params.get("rate"))))
      state.rate = Number(params.get("rate"));
    if (
      state.view === "streaming" &&
      (!params.has("chart") || !["bars", "lines"].includes(state.chart))
    )
      state.chart = "lines";
    if (
      state.view === "streaming" &&
      state.chart === "lines" &&
      ["completeP50", "completeP99"].includes(state.stream)
    )
      state.stream = "completion";
    if (params.has("types"))
      state.types = normalizeGroups(required(params.get("types")).split(","));
    if (params.has("selected"))
      state.selected = required(params.get("selected"))
        .split(",")
        .filter((id) => renderer(id));
    if (renderer(params.get("focus"))) state.focus = params.get("focus");
    rememberView();
  };
  restore(search);
  const pctFmt = (n: number | undefined) =>
    n !== undefined && Number.isFinite(n)
      ? Number(n).toLocaleString("en-US", {
          maximumFractionDigits: n >= 1000 ? 0 : n < 10 ? 3 : 2,
        })
      : "—";
  function latencyStats(
    r: ChartRow | undefined,
    { run = null, rate = null, flow = false }: StatTarget = {},
  ) {
    if (!r) return null;
    const runIndex = run == null ? null : Math.max(0, Math.round(run) - 1);
    if (state.view === "rendering" && state.render === "rss") {
      const memory = (r as RenderRow).memory;
      if (!memory) return null;
      const sample = runIndex == null ? undefined : memory.samples[runIndex];
      return {
        values:
          sample == null
            ? memory.percentiles
            : { p50: sample, p95: sample, p99: sample },
        unit: "MiB",
        scope: `Peak process RSS · ${runIndex == null ? "distribution across independent process peaks" : `process run ${runIndex + 1}`} · includes startup, prepared data and warmup; not allocation per render`,
      };
    }
    if (state.view === "rendering")
      return {
        values:
          runIndex == null
            ? (r as RenderRow)
            : (r as RenderRow).runPercentiles[runIndex],
        unit: "µs",
        scope:
          runIndex == null
            ? "Render duration · median of 5 run percentiles"
            : `Render duration · process run ${runIndex + 1}`,
      };
    if (state.view === "startup")
      return {
        values: r as StartupRow,
        unit: "ms",
        scope: "Spawn → first complete response · 15 starts",
      };
    if (state.view === "http" || state.view === "framework") {
      const row = r as HttpRow;
      if (flow && row.flow)
        return {
          values: row.flow.percentiles,
          unit: "ms",
          scope: `Response latency · capacity run ${row.flow.repeat} · 64 connections`,
        };
      if (metric() === "waterfall")
        return {
          values: required(row.waterfall).percentiles,
          unit: "ms",
          scope: `Response latency · ${fmt(required(row.waterfall).rate)} requests/s · run ${required(row.waterfall).repeat}`,
        };
      const equal =
          metric() === "p99" ||
          (state.view === "framework" && metric() === "p50"),
        key = equal ? "equalLoad" : "capacity";
      return {
        values:
          runIndex == null
            ? row.percentiles[key]
            : row.runPercentiles[key][runIndex],
        unit: "ms",
        scope:
          (equal
            ? `Scheduled response · ${fmt(row.equalLoadRps)} requests/s`
            : "Response latency · capacity · 64 connections") +
          (runIndex == null
            ? " · median of 3 run percentiles"
            : ` · run ${runIndex + 1}`),
      };
    }
    if (state.view === "streaming") {
      const row =
        rate == null
          ? (r as StreamRow)
          : required(
              data.streaming.rows[String(rate)].find((v) => v.id === r.id),
            );
      if (flow)
        return {
          values: row.flow.percentiles,
          unit: "ms",
          scope: `Scheduled completion · ${fmt(row.flow.offeredRps)} requests/s · run ${row.flow.repeat}`,
        };
      const shell = metric() === "shellP50";
      return {
        values: row.percentiles[shell ? "shell" : "complete"],
        unit: "ms",
        scope: `Scheduled ${shell ? "first shell" : "completion"} · ${fmt(rate ?? state.rate)} requests/s · median of 3 run percentiles`,
      };
    }
    return null;
  }
  function metric(): Metric {
    if (state.view === "rendering") return state.render;
    return state.view === "framework"
      ? state.framework
      : state.view === "http"
        ? state.http
        : state.view === "streaming"
          ? state.stream === "completion"
            ? "completeP99"
            : state.stream
          : "p50";
  }
  function renderingRows(workload: string): RenderRow[] {
    if (data.rendering.pendingWorkloads?.[workload]) return [];
    const rows = data.rendering.rows[workload] || [];
    if (state.render !== "rss") return rows;
    return rows
      .filter((row) => row.memory)
      .map((row) => {
        const memory = required(row.memory);
        return {
          ...row,
          ...memory.percentiles,
          samples: memory.samples,
          runPercentiles: memory.samples.map((value) => ({
            p50: value,
            p95: value,
            p99: value,
          })),
          detail: memory.scope,
        };
      });
  }
  function getRows(): ChartRow[] {
    if (data[state.view].pendingWorkloads?.[state.workload]) return [];
    switch (state.view) {
      case "rendering":
        return renderingRows(state.workload);
      case "http":
        return data.http.rows[state.workload];
      case "streaming":
        return data.streaming.rows[String(state.rate)];
      case "framework":
        return data.framework.workloads[state.workload];
      case "startup":
        return data.startup.rows;
    }
  }
  function samples(r: ChartRow) {
    return "samples" in r ? r.samples : r.seriesSamples[metric()] || [];
  }
  function comparisonMeasurements() {
    return orderedWorkloads().flatMap((w) =>
      renderingRows(w.id)
        .filter(isVisible)
        .map((row) => ({
          ...row,
          workload: w.id,
          suite: "rendering" as const,
          unit: state.render === "rss" ? "MiB" : "µs",
          capturedAt: row.capturedAt,
          source: row.source ?? suites.rendering.path,
          latency: {
            values: row,
            unit: state.render === "rss" ? "MiB" : "µs",
            scope:
              state.render === "rss"
                ? "Peak process RSS · distribution across independent process peaks; not allocation per render"
                : "Render duration · median of 5 run percentiles",
          },
        })),
    );
  }
  function value(r: ChartRow): number {
    const key = metric();
    if (key === "breakdown") return 0;
    if (key === "utilization") return r.cpuPercent ?? 0;
    if (key === "waterfall") return (r as HttpRow).waterfall?.complete ?? 0;
    return r[key] ?? 0;
  }
  function unit() {
    return metric() === "breakdown"
      ? "unmeasured"
      : metric() === "throughput"
        ? "responses/s"
        : metric() === "rss"
          ? "MiB"
          : metric() === "utilization"
            ? "% of one core"
            : state.view === "rendering"
              ? "µs"
              : "ms";
  }
  function summary(a: number[]) {
    const sorted = a.slice().sort((a, b) => a - b);
    if (!sorted.length) return null;
    const q = (p: number) => {
      const i = (sorted.length - 1) * p,
        l = Math.floor(i);
      return sorted[l] + (sorted[Math.ceil(i)] - sorted[l]) * (i - l);
    };
    return {
      min: sorted[0],
      q1: q(0.25),
      median: q(0.5),
      q3: q(0.75),
      max: required(sorted.at(-1)),
    };
  }
  function uncaptured() {
    return data.renderers.filter(
      (r) => r.status === "unmeasured" && isVisible(r),
    );
  }

  function renderingCoverage(id: string, workload: string) {
    const project = required(renderer(id));
    const pending = data.rendering.pendingWorkloads?.[workload];
    if (pending)
      return {
        status: "unmeasured" as const,
        reason: pending,
        version: project.version || "",
        source: "/methodology",
      };
    if (
      state.render === "rss" &&
      !data.rendering.rows[workload]?.some((row) => row.id === id && row.memory)
    )
      return {
        status: "unmeasured" as const,
        reason:
          "Peak process RSS was not recorded in this capture. Future runs record native process peak RSS, including runtime and prepared data; not allocation per render.",
        version: project.version || "",
        source: "/methodology",
      };
    const measured = data.rendering.rows[workload]?.find(
      (row) => row.id === id,
    );
    const unsupported =
      project.renderingUnsupported?.[workload] ??
      (measured?.adaptation
        ? {
            status: "unsupported" as const,
            reason: measured.adaptation.reason,
            version: project.version || "",
            source: measured.adaptation.source,
          }
        : undefined);
    return unsupported
      ? {
          ...unsupported,
          status: unsupported.status ?? ("unsupported" as const),
        }
      : {
          status: "unmeasured" as const,
          reason:
            project.coverageReason ||
            "No validated render-only capture is available for this workload. HTTP request measurements are a separate experiment.",
          version: project.version || "",
          source: project.coverageSource || project.homepage,
        };
  }

  function measurementLinks(id: string) {
    const links: { label: string; href: string }[] = [];
    if (data.framework.rows.some((r) => r.id === id))
      links.push({ label: "Framework SSR", href: "?view=framework" });
    const workload = orderedWorkloads().find((w) =>
      data.http.rows[w.id]?.some((r) => r.id === id),
    );
    if (workload)
      links.push({ label: "HTTP", href: `?view=http&workload=${workload.id}` });
    if (data.startup.rows.some((r) => r.id === id))
      links.push({ label: "Cold Start", href: "?view=startup" });
    return links;
  }

  function normalizeState() {
    if (state.view === "streaming") state.chart = "lines";
    if (state.view === "framework" && !data.framework) state.view = "rendering";
    if (state.view === "framework") {
      if (!data.framework.workloads[state.workload])
        state.workload = frameworkWorkloads()[0].id;
      if (state.chart === "balls") state.chart = "bars";
    } else if (state.workload === "catalog") state.workload = "cards";
    if (state.view === "http" && !data.http.rows[state.workload])
      state.workload = Object.keys(data.http.rows)[0];
    if (state.view === "rendering" && !data.rendering.rows[state.workload])
      state.workload = orderedWorkloads()[0].id;
    if (state.chart === "compare" && state.view !== "rendering")
      state.chart = "bars";
    if (["waterfall", "utilization", "breakdown"].includes(metric()))
      state.chart = "bars";
    if (["startup", "streaming"].includes(state.view))
      state.workload = "products";
  }
  normalizeState();
  const visibleRows = () =>
    getRows()
      .filter(isVisible)
      .sort((a, b) =>
        metric() === "throughput" ? value(b) - value(a) : value(a) - value(b),
      );
  function validationNote() {
    const exclusions =
      state.view === "streaming" ? data.streaming.excluded || [] : [];
    if (exclusions.length)
      return `${exclusions.map((entry) => name(entry.id)).join(", ")} streaming results withheld: placeholder validation was incorrect. Corrected rerun pending.`;
    return "";
  }
  function captureNote() {
    const pending = data[state.view].pendingWorkloads?.[state.workload];
    if (pending) return pending;
    if (state.view === "rendering" && state.render === "rss")
      return "Peak native process RSS includes runtime startup, prepared data, template initialization, warmup, rendering and output verification. It is not allocation per render. Older captures have no RSS measurement.";
    const review = data[state.view].reviewRefresh;
    if (review) return review.note;
    return state.view === "rendering" ? data.rendering.refresh?.note || "" : "";
  }

  function experimentDescription() {
    if (state.view === "rendering" && state.render === "rss")
      return "Peak resident memory of the native benchmark process, including its runtime and prepared data. This is measured separately from render duration.";
    if (
      state.view === "rendering" &&
      state.chart !== "compare" &&
      data.workloads.find((w) => w.id === state.workload)?.fixture ===
        "showcase-v1"
    )
      return "Each tool renders a shared re-creation of this page from prepared data. These timings are separate from benchmarks of Proa’s original app code.";
    return state.view === "startup"
      ? "Time from launching a fresh server process to receiving its first complete product-grid response. Includes runtime startup and rendering; builds run beforehand and the disk cache is warm."
      : "";
  }

  function heading() {
    if (state.view === "rendering" && state.render === "rss")
      return "SSR Rendering · memory usage";
    if (state.view === "framework")
      return {
        throughput: "Framework SSR capacity",
        p50: "Framework SSR · equal-load P50",
        p99: "Framework SSR · equal-load P99",
        cpu: "Framework SSR · CPU per response",
        rss: "Framework SSR · peak memory",
      }[metric() as "throughput" | "p50" | "p99" | "cpu" | "rss"];
    if (state.view === "streaming" && state.stream === "completion")
      return "Stream completion latency · P50 & P99";
    return (
      {
        cpu: "CPU per response",
        utilization: "CPU utilization",
        waterfall: "Response waterfall",
        breakdown: "Where the work happens",
        p99: "Equal-load P99",
        rss: "Peak memory",
        completeP99: "Stream completion latency · P99",
        completeP50: "Stream completion latency · P50",
        shellP50: "First-shell latency · P50",
        throughput:
          state.view === "streaming" ? "Streaming throughput" : "HTTP capacity",
      }[metric() as Exclude<Metric, "p50">] || suites[state.view].title
    );
  }

  return {
    data,
    state,
    defaults,
    esc,
    fmt,
    pctFmt,
    orderedWorkloads,
    renderer,
    name,
    logo,
    label,
    repositoryLink,
    isVisible,
    frameworkWorkloads,
    frameworkUsesJsSsr,
    suites,
    viewDefaults,
    viewStateKeys,
    rememberedViews,
    rememberView,
    switchView,
    restore,
    metric,
    getRows,
    samples,
    comparisonMeasurements,
    value,
    unit,
    summary,
    uncaptured,
    renderingCoverage,
    measurementLinks,
    latencyStats,
    renderingRows,
    normalizeState,
    visibleRows,
    validationNote,
    captureNote,
    experimentDescription,
    heading,
  };
}
