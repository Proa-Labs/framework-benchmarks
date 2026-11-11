import { ALL_GROUPS, matchesGroups } from "../filters.mjs";
export function createDashboardModel(data, search = "") {
  const esc = (v) =>
    String(v).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const fmt = (n) =>
    Number(n).toLocaleString("en-US", {
      maximumFractionDigits: n < 10 ? 2 : 1,
    });
  const workloadOrder = data.workloadOrder ?? data.workloads.map((w) => w.id);
  const orderedWorkloads = () =>
    workloadOrder.map((id) => data.workloads.find((w) => w.id === id));
  const renderer = (id) =>
      (data.ecosystem || data.renderers).find((r) => r.id === id),
    name = (id) => renderer(id)?.label || id;
  const logo = (id) =>
    `<span class="fw-logo-mark" style="--logo-mask:url('${id === "jte" ? "/logos/jte-mark.svg" : `/${renderer(id).logo}`}')" aria-hidden="true"><img class="fw-logo" data-logo="${id}" src="/${renderer(id).logo}" width="18" height="18" alt=""></span>`;
  const label = (id) =>
    `<span class="fw-renderer">${logo(id)}<span>${esc(name(id))}</span></span>`;
  const defaults = {
    section: "performance",
    view: "rendering",
    workload: "cards",
    rate: 1000,
    chart: "compare",
    flowPlaying: true,
    http: "throughput",
    framework: "throughput",
    stream: "completion",
    selected: data.renderers.map((r) => r.id),
    focus: null,
    types: [...ALL_GROUPS],
  };
  const state = { ...defaults, selected: [...defaults.selected] };
  const isVisible = (r) =>
    state.selected.includes(r.id) && matchesGroups(renderer(r.id), state.types);
  const frameworkWorkload = { id: "catalog", label: "32-card catalog" };
  const suites = {
    framework: {
      title: "Framework SSR",
      path: "framework-ssr/results/latest.json",
      method: `${data.framework.methodology.repeats} rotated independent production server processes per phase kind. Capacity: ${data.framework.methodology.concurrency} connections. Equal-load latency: ${data.framework.methodology.fixedRateRps} scheduled requests/s. Every response is validated; generator-limited phases are rejected.`,
      scope:
        "Production HTTP routing → complete SSR HTML. Shared 32-card catalog with escaping, branches, lists and a request-specific value. Framework shells may differ. No full-document cache, database, network I/O or hydration timing.",
    },
    rendering: {
      title: "SSR render latency",
      path: "rendering/results/latest.json",
      method:
        "Five independent processes. Bars show the median process P50; boxes summarize those five process medians, not individual render latency.",
      scope:
        "Prepared data → a complete, freshly owned HTML output. Each adapter uses its declared native output type; Proa may return a RenderBuffer without String conversion. Includes rendering, formatting, and output allocation. Excludes data setup, HTTP, routing, databases, hydration, and network transfer. All captured semantic DOM parity cells passed.",
    },
    http: {
      title: "HTTP capacity",
      path: "page-load/results/latest.json",
      method:
        "Three fresh server processes per workload. Capacity and CPU: 64 closed-loop connections. Equal-load latency: fixed-rate arrivals.",
      scope:
        "HTTP/1.1 loopback, keep-alive, compression off; one core of work. Every response matches its parity-gated dump. No database or external I/O.",
    },
    streaming: {
      title: "Streaming",
      path: "suspense-load/results/latest.json",
      method:
        "Median of three independent phases per offered rate. Latency starts at scheduled arrival and includes queueing.",
      scope:
        "96 cards across eight async boundaries with 5–90 ms in-memory delays. Per-core servers, compression off. No database. Wire protocols differ.",
    },
    startup: {
      title: "Cold start",
      path: "cold-start/results/latest.json",
      method:
        "15 fresh process starts; two untimed starts warm the disk cache. Boxes show the start-time distribution, with min–max whiskers.",
      scope:
        "Process spawn → first complete product-grid response, including runtime, fixture setup, and first render. Sensitive to other host activity.",
    },
  };
  const viewDefaults = {
    rendering: { chart: "compare", workload: "cards" },
    framework: { chart: "bars", workload: "catalog" },
    http: { chart: "bars", workload: "cards" },
    streaming: { chart: "lines", workload: "products" },
    startup: { chart: "bars", workload: "products" },
  };
  const viewStateKeys = [
    "chart",
    "workload",
    "rate",
    "http",
    "framework",
    "stream",
  ];
  const rememberedViews = new Map();
  const rememberView = () =>
    rememberedViews.set(
      state.view,
      Object.fromEntries(viewStateKeys.map((key) => [key, state[key]])),
    );
  const switchView = (view) => {
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
  const restore = (search) => {
    Object.assign(state, defaults, {
      selected: [...defaults.selected],
      types: [...ALL_GROUPS],
    });
    const params = new URLSearchParams(search);
    const allowed = {
      section: ["performance", "ecosystem"],
      view: Object.keys(suites),
      workload: [...data.workloads.map((w) => w.id), "catalog"],
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
    const view = allowed.view.includes(params.get("view"))
      ? params.get("view")
      : defaults.view;
    Object.assign(state, viewDefaults[view], { view });
    for (const [key, values] of Object.entries(allowed))
      if (values.includes(params.get(key))) state[key] = params.get(key);
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
      state.types = [
        ...new Set(
          params
            .get("types")
            .split(",")
            .map((id) => (id === "baselines" ? "templates" : id))
            .filter((id) => ALL_GROUPS.includes(id)),
        ),
      ];
    if (params.has("selected"))
      state.selected = params
        .get("selected")
        .split(",")
        .filter((id) => renderer(id));
    if (renderer(params.get("focus"))) state.focus = params.get("focus");
    rememberView();
  };
  restore(search);
  const pctFmt = (n) =>
    Number.isFinite(n)
      ? Number(n).toLocaleString("en-US", {
          maximumFractionDigits: n >= 1000 ? 0 : n < 10 ? 3 : 2,
        })
      : "—";
  function latencyStats(r, { run = null, rate = null, flow = false } = {}) {
    if (!r) return null;
    const runIndex = run == null ? null : Math.max(0, Math.round(run) - 1);
    if (state.view === "rendering")
      return {
        values: runIndex == null ? r : r.runPercentiles[runIndex],
        unit: "µs",
        scope:
          runIndex == null
            ? "Render duration · median of 5 run percentiles"
            : `Render duration · process run ${runIndex + 1}`,
      };
    if (state.view === "startup")
      return {
        values: r,
        unit: "ms",
        scope: "Spawn → first complete response · 15 starts",
      };
    if (state.view === "http" || state.view === "framework") {
      if (flow)
        return {
          values: r.flow.percentiles,
          unit: "ms",
          scope: `Response latency · capacity run ${r.flow.repeat} · 64 connections`,
        };
      if (metric() === "waterfall")
        return {
          values: r.waterfall.percentiles,
          unit: "ms",
          scope: `Response latency · ${fmt(r.waterfall.rate)} requests/s · run ${r.waterfall.repeat}`,
        };
      const equal =
          metric() === "p99" ||
          (state.view === "framework" && metric() === "p50"),
        key = equal ? "equalLoad" : "capacity";
      return {
        values:
          runIndex == null
            ? r.percentiles[key]
            : r.runPercentiles[key][runIndex],
        unit: "ms",
        scope:
          (equal
            ? `Scheduled response · ${fmt(r.equalLoadRps)} requests/s`
            : "Response latency · capacity · 64 connections") +
          (runIndex == null
            ? " · median of 3 run percentiles"
            : ` · run ${runIndex + 1}`),
      };
    }
    if (state.view === "streaming") {
      const row =
        rate == null
          ? r
          : data.streaming.rows[String(rate)].find((v) => v.id === r.id);
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
  function metric() {
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
  function getRows() {
    const s = data[state.view];
    return state.view === "rendering" || state.view === "http"
      ? s.rows[state.workload]
      : state.view === "streaming"
        ? s.rows[String(state.rate)]
        : s.rows;
  }
  function samples(r) {
    return r.samples || r.seriesSamples?.[metric()] || [];
  }
  function value(r) {
    if (metric() === "breakdown") return null;
    if (metric() === "utilization") return r.cpuPercent;
    if (metric() === "waterfall") return r.waterfall.complete;
    return r[metric()] ?? 0;
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
  function summary(a) {
    const sorted = a.slice().sort((a, b) => a - b);
    if (!sorted.length) return null;
    const q = (p) => {
      const i = (sorted.length - 1) * p,
        l = Math.floor(i);
      return sorted[l] + (sorted[Math.ceil(i)] - sorted[l]) * (i - l);
    };
    return {
      min: sorted[0],
      q1: q(0.25),
      median: q(0.5),
      q3: q(0.75),
      max: sorted.at(-1),
    };
  }
  function uncaptured() {
    return data.renderers.filter(
      (r) => r.status === "unmeasured" && isVisible(r),
    );
  }

  function normalizeState() {
    if (state.view === "streaming") state.chart = "lines";
    if (state.view === "framework" && !data.framework) state.view = "rendering";
    if (state.view === "framework") {
      state.workload = "catalog";
      if (state.chart === "balls") state.chart = "bars";
    } else if (state.workload === "catalog") state.workload = "cards";
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
  function heading() {
    if (state.view === "framework")
      return {
        throughput: "Framework SSR capacity",
        p50: "Framework SSR · equal-load P50",
        p99: "Framework SSR · equal-load P99",
        cpu: "Framework SSR · CPU per response",
        rss: "Framework SSR · peak memory",
      }[metric()];
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
      }[metric()] || suites[state.view].title
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
    isVisible,
    frameworkWorkload,
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
    value,
    unit,
    summary,
    uncaptured,
    latencyStats,
    normalizeState,
    visibleRows,
    heading,
  };
}
