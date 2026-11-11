import { bisector, extent } from "d3-array";
import { scaleLinear } from "d3-scale";
import { line } from "d3-shape";
import { ALL_GROUPS, matchesGroups, TOOL_GROUPS } from "./filters.mjs";

const d3 = { extent, bisector, scaleLinear, line };

(() => {
  const root = document.getElementById("frameworks-explorer"),
    data = JSON.parse(
      document.getElementById("frameworks-explorer-data").textContent,
    ),
    $ = (s) => root.querySelector(s),
    $$ = (s) => Array.from(root.querySelectorAll(s));
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
    `<span class="fw-logo-mark" style="--logo-mask:url('${id === "jte" ? "logos/jte-mark.svg" : renderer(id).logo}')" aria-hidden="true"><img class="fw-logo" data-logo="${id}" src="${renderer(id).logo}" width="18" height="18" alt=""></span>`;
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
  const restore = () => {
    Object.assign(state, defaults, {
      selected: [...defaults.selected],
      types: [...ALL_GROUPS],
    });
    const params = new URLSearchParams(location.search);
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
  restore();
  const save = () => {
    const params = new URLSearchParams();
    for (const key of [
      "section",
      "view",
      "workload",
      "chart",
      "rate",
      "http",
      "framework",
      "stream",
    ])
      params.set(key, String(state[key]));
    if (state.selected.length !== data.renderers.length)
      params.set("selected", state.selected.join(","));
    if (state.focus) params.set("focus", state.focus);
    if (state.types.length !== ALL_GROUPS.length)
      params.set("types", state.types.join(","));
    history.replaceState(null, "", `${location.pathname}?${params.toString()}`);
  };
  let playing = false,
    lastWidth = 0,
    flowRuntime = null,
    flowFrame = null,
    flowElapsed = 0,
    flowOrigin = 0;
  const reduced = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const percentilePopup = $("[data-percentile-popup]");
  let popupAnchor = null,
    popupPinned = false;
  const percentileTarget = ".fw-row[data-focus], .fw-comparison [data-focus]";
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
  function hidePercentiles(force = false) {
    if (popupPinned && !force) return;
    popupPinned = false;
    percentilePopup.hidden = true;
    if (popupAnchor) {
      popupAnchor.removeAttribute("aria-describedby");
      popupAnchor = null;
    }
  }
  function placePercentiles(event, anchor) {
    const rootRect = root.getBoundingClientRect(),
      anchorRect = anchor.getBoundingClientRect();
    percentilePopup.style.maxWidth = `${Math.min(440, rootRect.width - 16, window.innerWidth - 20)}px`;
    const width = percentilePopup.offsetWidth,
      height = percentilePopup.offsetHeight;
    const clientX = Number.isFinite(event?.clientX)
      ? event.clientX
      : anchorRect.left + anchorRect.width / 2;
    const clientY = Number.isFinite(event?.clientY)
      ? event.clientY
      : anchorRect.top;
    const leftEdge = Math.max(8, -rootRect.left + 8),
      rightEdge = Math.min(
        rootRect.width - 8,
        window.innerWidth - rootRect.left - 8,
      );
    let x = clientX - rootRect.left + 14;
    if (x + width > rightEdge) x = clientX - rootRect.left - width - 14;
    x = Math.max(leftEdge, Math.min(x, rightEdge - width));
    let y = clientY - rootRect.top - height - 14;
    if (y + rootRect.top < 8) y = clientY - rootRect.top + 18;
    y = Math.max(
      8 - rootRect.top,
      Math.min(y, window.innerHeight - rootRect.top - height - 8),
    );
    percentilePopup.style.left = `${x}px`;
    percentilePopup.style.top = `${y}px`;
  }
  function showPercentiles(entries, event, anchor, heading = "") {
    const ready = entries.filter((e) => e.stats?.values);
    if (!ready.length) {
      hidePercentiles();
      return;
    }
    if (popupAnchor && popupAnchor !== anchor)
      popupAnchor.removeAttribute("aria-describedby");
    popupAnchor = anchor;
    anchor.setAttribute("aria-describedby", "fw-percentile-popover");
    const single = ready.length === 1,
      first = ready[0];
    percentilePopup.innerHTML = single
      ? `<div class="fw-popover-heading"><div class="fw-popover-identity">${logo(first.id)}<span class="fw-popover-title">${esc(name(first.id))}</span></div></div><div class="fw-percentile-values">${["p50", "p95", "p99"].map((q) => `<div class="fw-percentile-value"><small>${q.toUpperCase()}</small><div class="fw-percentile-number"><strong>${pctFmt(first.stats.values[q])}</strong><span class="fw-popover-unit">${esc(first.stats.unit)}</span></div></div>`).join("")}</div><div class="fw-popover-scope">${esc(first.stats.scope)}</div>`
      : `<div class="fw-popover-heading">${esc(heading)}</div><div class="fw-percentile-grid"><span></span><span>P50</span><span>P95</span><span>P99</span>${ready.map((e) => `<span class="fw-popover-renderer">${esc(name(e.id))}</span>${["p50", "p95", "p99"].map((q) => `<span>${pctFmt(e.stats.values[q])}<span class="fw-popover-unit">${esc(e.stats.unit)}</span></span>`).join("")}`).join("")}</div><div class="fw-popover-scope">${esc(first.stats.scope)}</div>`;
    percentilePopup.hidden = false;
    placePercentiles(event, anchor);
  }
  function showRowPercentiles(row) {
    const workload = row.dataset.statWorkload,
      r = (workload ? data.rendering.rows[workload] : getRows()).find(
        (r) => r.id === row.dataset.focus,
      ),
      stats = latencyStats(r, { flow: state.chart === "balls" });
    if (workload && stats)
      stats.scope = `${data.workloads.find((w) => w.id === workload).label} · ${stats.scope}`;
    showPercentiles(
      [
        {
          id: r?.id,
          stats,
        },
      ],
      null,
      row,
    );
  }
  root.addEventListener("mouseover", (event) => {
    const row = event.target.closest(percentileTarget);
    if (row && !row.contains(event.relatedTarget)) {
      if (popupAnchor !== row) popupPinned = false;
      showRowPercentiles(row);
    }
  });
  root.addEventListener("pointerout", (event) => {
    const row = event.target.closest(percentileTarget);
    if (row && !row.contains(event.relatedTarget)) hidePercentiles();
  });
  root.addEventListener("focusin", (event) => {
    const row = event.target.closest(percentileTarget);
    if (row) showRowPercentiles(row, null);
  });
  root.addEventListener("focusout", (event) => {
    if (event.target.closest(percentileTarget)) hidePercentiles();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") hidePercentiles(true);
  });
  window.addEventListener("resize", () => {
    if (!percentilePopup.hidden && popupAnchor?.isConnected)
      placePercentiles(null, popupAnchor);
  });
  window.addEventListener(
    "scroll",
    () => {
      if (popupPinned && popupAnchor?.isConnected)
        placePercentiles(null, popupAnchor);
      else hidePercentiles();
    },
    { passive: true },
  );

  function stop() {
    hidePercentiles(true);
    cancelAnimationFrame(flowFrame);
    flowRuntime = null;
    flowElapsed = 0;
    playing = false;
    $("[data-play]").textContent = "Play";
    $("[data-play]").disabled = false;
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
  function renderScenarios() {
    const fixed = ["streaming", "startup"].includes(state.view),
      active =
        state.view === "framework"
          ? "catalog"
          : fixed
            ? "products"
            : state.workload,
      compare = state.chart === "compare";
    if (!$(".fw-workload-tabs").childElementCount)
      $(".fw-workload-tabs").innerHTML =
        `<button type="button" data-chart="compare" aria-pressed="${compare}">All workloads</button>` +
        [...orderedWorkloads(), frameworkWorkload]
          .map(
            (w) =>
              `<div class="fw-workload-choice" data-active="${!compare && active === w.id}"><span class="fw-workload-thumb" aria-hidden="true"><iframe src="previews/${w.id}.html" sandbox="" loading="lazy" tabindex="-1" title="${esc(w.label)} miniature"></iframe></span><button type="button" data-workload="${w.id}" aria-pressed="${!compare && active === w.id}" ${fixed && w.id !== "products" ? "disabled" : ""}>${esc(w.label)}</button><button type="button" data-preview="${w.id}" aria-label="Preview ${esc(w.label)}" title="Preview ${esc(w.label)}"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg></button></div>`,
          )
          .join("");
    $('.fw-workload-tabs [data-chart="compare"]').hidden =
      state.view !== "rendering";
    $('.fw-workload-tabs [data-chart="compare"]').setAttribute(
      "aria-pressed",
      String(compare),
    );
    $$(".fw-workload-choice").forEach((choice) => {
      const button = choice.querySelector("[data-workload]"),
        selected = !compare && button.dataset.workload === active;
      choice.hidden =
        state.view === "framework"
          ? button.dataset.workload !== "catalog"
          : button.dataset.workload === "catalog";
      choice.dataset.active = String(selected);
      button.setAttribute("aria-pressed", String(selected));
      button.disabled = fixed && button.dataset.workload !== "products";
    });
    if (!$(".fw-type-filters").childElementCount)
      $(".fw-type-filters").innerHTML =
        `<span>Tool type</span>${TOOL_GROUPS.map((g) => `<label><input type="checkbox" data-type="${g.id}"><span>${g.label}</span></label>`).join("")}`;
    $$("[data-type]").forEach((input) => {
      input.checked = state.types.includes(input.dataset.type);
    });
  }
  function uncaptured() {
    return data.renderers.filter(
      (r) => r.status === "unmeasured" && isVisible(r),
    );
  }
  function drawComparison(rows) {
    const workloads = orderedWorkloads(),
      scales = Object.fromEntries(
        workloads.map((w) => {
          const values = data.rendering.rows[w.id]
              .filter((r) => isVisible(r))
              .map((r) => r.p50),
            max = Math.max(...values, 1) * 1.04;
          return [w.id, (v) => (100 * v) / max];
        }),
      );
    $("[data-results]").innerHTML =
      `<table class="fw-comparison"><caption class="sr-only">SSR render latency in microseconds across workloads. Select a column heading to sort.</caption><thead><tr><th scope="col">Renderer</th>${workloads.map((w) => `<th scope="col" aria-sort="${state.workload === w.id ? "ascending" : "none"}"><button type="button" data-sort-workload="${w.id}" title="Sort by ${esc(w.label)}">${esc(w.label)}${state.workload === w.id ? " ↓" : ""}<small>µs</small></button></th>`).join("")}</tr></thead><tbody>${rows
        .map(
          (r) =>
            `<tr style="--brand:${renderer(r.id).color}" class="${state.focus === r.id ? "fw-comparison-focused" : ""}"><th scope="row"><button type="button" data-focus="${r.id}" aria-pressed="${state.focus === r.id}">${label(r.id)}</button></th>${workloads
              .map((w) => {
                const cell = data.rendering.rows[w.id].find(
                  (v) => v.id === r.id,
                );
                return cell
                  ? `<td class="fw-comparison-cell"><button type="button" data-focus="${r.id}" data-stat-workload="${w.id}" aria-pressed="${state.focus === r.id}" aria-label="${esc(name(r.id))}, ${esc(w.label)}, ${fmt(cell.p50)} µs"><span class="fw-comparison-value">${fmt(cell.p50)}</span><span class="fw-comparison-track" aria-hidden="true"><span style="width:${scales[w.id](cell.p50)}%"></span></span></button></td>`
                  : "<td>—</td>";
              })
              .join("")}</tr>`,
        )
        .join("")}${uncaptured()
        .map(
          (r) =>
            `<tr class="fw-uncaptured"><th scope="row">${label(r.id)}<small>Not measured</small></th><td colspan="3"><span>—</span> ${esc(r.coverageReason)} <a href="${esc(r.coverageSource)}" target="_blank" rel="noreferrer">Details ↗</a>${data.framework?.rows.some((v) => v.id === r.id) ? ' · <a href="?view=framework">Measured in Framework SSR ↗</a>' : ""}</td></tr>`,
        )
        .join("")}</tbody></table>`;
    $("[data-chart-note]").textContent =
      "Median SSR render latency · µs · lower is better · sort by any workload heading · bars scale linearly within each column";
  }
  function renderCatalog() {
    const groups = [
      [
        "Frameworks & UI systems",
        ["Application framework", "UI framework", "UI library", "Renderer"],
      ],
      ["Template engines", ["Template engine", "Native templates"]],
    ];
    $("[data-catalog]").innerHTML = groups
      .map(
        ([group, kinds]) =>
          `<div class="fw-catalog-group">${group}</div>${(
            data.ecosystem || data.renderers
          )
            .filter((r) => kinds.includes(r.kind))
            .map(
              (r) =>
                `<div class="fw-catalog-row">${label(r.id)}<small>${esc(r.kind)}${r.status === "feature-only" ? '<br><span class="fw-coverage-status">Features reviewed · not benchmarked</span>' : r.status === "unmeasured" ? `<br><span class="fw-coverage-status">${data.framework?.rows.some((v) => v.id === r.id) ? "Measured in Framework SSR" : "Not measured"}</span>` : ""}</small><small>${esc(r.language)}</small><a href="${esc(r.homepage)}" target="_blank" rel="noreferrer" aria-label="${esc(r.label)} project website">Project ↗</a></div>`,
            )
            .join("")}`,
      )
      .join("");
  }
  function rowButton(r, inside, number, extra = "") {
    return `<button type="button" class="fw-row cursor-interaction ${extra}" style="--brand:${renderer(r.id).color}" data-focus="${r.id}" aria-pressed="${state.focus === r.id}" aria-label="${esc(name(r.id))}, ${esc(number)} ${unit()}${r.errors ? `, ${r.errors} errors` : ""}">${label(r.id)}${inside}<span class="fw-number">${number}<small class="fw-value-unit">${unit() === "responses/s" ? "req/s" : unit() === "% of one core" ? "%" : unit()}</small></span></button>`;
  }
  function drawBars(rows) {
    const u = unit(),
      _higher = metric() === "throughput",
      allValues = rows
        .flatMap((r) => [value(r), ...samples(r)])
        .filter((v) => Number.isFinite(v) && v > 0),
      high = Math.max(...allValues, 1) * 1.04;
    const x = (v) => (100 * v) / high;
    const note =
      state.view === "rendering"
        ? "Bar: median render time · box: five process medians · whiskers: min–max"
        : state.view === "startup"
          ? "Bar: median cold start · box: middle 50% of 15 starts · whiskers: min–max"
          : "Bar: median · box: middle 50% of three runs · whiskers: min–max";
    if (metric() === "breakdown") {
      $("[data-results]").innerHTML =
        '<div class="fw-empty"><h3>Attribution needs a traced workload.</h3><p style="margin-top:8px">Database: excluded · framework / runtime / OS: not separated</p><p class="fw-muted" style="margin-top:14px">Next capture: instrument DB wait, DB CPU, render CPU, and server overhead separately.</p></div>';
      $("[data-chart-note]").textContent =
        "No database workload or profiling spans were collected. Aggregate process CPU cannot identify framework CPU cycles.";
      return;
    }
    if (["waterfall", "utilization"].includes(metric())) {
      drawHttp(rows);
      return;
    }
    $("[data-results]").innerHTML = `${rows
      .map((r) => {
        const box = summary(samples(r)),
          v = value(r);
        const _tooltip = box
          ? `${name(r.id)} · ${fmt(v)} ${u}; run min ${fmt(box.min)}, Q1 ${fmt(box.q1)}, median ${fmt(box.median)}, Q3 ${fmt(box.q3)}, max ${fmt(box.max)}; n=${samples(r).length}`
          : r.detail;
        const marks = box
          ? `<span class="fw-whisker" style="--lo:${x(box.min)}%;--range:${x(box.max) - x(box.min)}%"></span><span class="fw-cap" style="left:${x(box.min)}%"></span><span class="fw-cap" style="left:${x(box.max)}%"></span><span class="fw-box" style="--q1:${x(box.q1)}%;--iqr:${x(box.q3) - x(box.q1)}%"></span><span class="fw-median" style="--med:${x(box.median)}%"></span>`
          : "";
        return rowButton(
          r,
          `<span class="fw-track"  aria-hidden="true"><span class="fw-bar" style="--fw-length:${x(v)}%"></span>${marks}</span>`,
          fmt(v),
        );
      })
      .join(
        "",
      )}<div class="fw-axis"><span></span><div class="fw-ticks">${[0, high / 2, high].map((v) => `<span>${fmt(v >= 1000 ? v / 1000 : v)}${v >= 1000 ? "k" : ""}</span>`).join("")}</div><span>${u}</span></div>`;
    $("[data-chart-note]").textContent = note;
  }
  function drawHttp(rows) {
    const cpu = metric() === "utilization",
      max = cpu
        ? Math.max(100, ...rows.map((r) => r.cpuPercent))
        : Math.max(...rows.map((r) => r.waterfall.complete)) * 1.05;
    $("[data-results]").innerHTML =
      `<div class="fw-stage-legend">${cpu ? '<span><i class="fw-before"></i>Process CPU</span><span>Reference: 100% = one core</span>' : '<span><i class="fw-before"></i>Request → first byte</span><span><i class="fw-body"></i>First byte → body end</span>'}</div>${rows
        .map((r) => {
          const w = r.waterfall;
          return rowButton(
            r,
            `<span class="fw-stack" ><span class="fw-before" style="width:${(100 * (cpu ? r.cpuPercent : w.firstByte)) / max}%"></span>${cpu ? `<span style="position:absolute;left:${10000 / max}%;top:-3px;height:20px;width:1px;background:var(--fw-fg);opacity:.4"></span>` : `<span class="fw-body" style="width:${(100 * (w.complete - w.firstByte)) / max}%"></span>`}</span>`,
            fmt(cpu ? r.cpuPercent : w.complete),
          );
        })
        .join("")}`;
    $("[data-chart-note]").textContent = cpu
      ? "Process CPU / wall time at capacity · three-run median · totals may exceed one core. No DB attribution."
      : "Aggregate response waterfall · mean stages from one representative equal-load run per renderer. Request tracing and database spans were not captured.";
  }
  const lineDash = (id) =>
    state.view === "streaming"
      ? { proa: "", marko: "7 4", react: "2 4" }[id] || ""
      : "";
  const pointMarker = (id, x, y, size = 3, attributes = "") => {
    const shape =
      state.view === "streaming"
        ? { proa: "circle", marko: "triangle", react: "square" }[id] || "circle"
        : "circle";
    const body =
      shape === "triangle"
        ? `<polygon points="0,${-size * 1.3} ${size * 1.2},${size} ${-size * 1.2},${size}"/>`
        : shape === "square"
          ? `<rect x="${-size}" y="${-size}" width="${size * 2}" height="${size * 2}"/>`
          : `<circle r="${size}"/>`;
    return `<g class="fw-point" data-marker="${shape}" transform="translate(${x} ${y})" ${attributes}>${body}</g>`;
  };
  const lineKey = (id) =>
    state.view === "streaming"
      ? `<svg width="24" height="12" viewBox="0 0 24 12" aria-hidden="true"><path d="M0 6h24" stroke="currentColor" stroke-width="1.6" stroke-dasharray="${lineDash(id)}"/>${pointMarker(id, 12, 6, 3, 'fill="currentColor"')}</svg>`
      : "";
  function lineSeries(rows, selectedMetric = metric()) {
    if (state.view === "streaming")
      return rows.map((r) => ({
        id: r.id,
        points: data.rates.map((rate) => ({
          x: rate,
          y: data.streaming.rows[String(rate)].find((v) => v.id === r.id)[
            selectedMetric
          ],
        })),
      }));
    return rows.map((r) => ({
      id: r.id,
      points: samples(r).map((y, i) => ({ x: i + 1, y })),
    }));
  }
  function drawLines(
    rows,
    {
      target = $("[data-results]"),
      selectedMetric = metric(),
      height = 260,
      legend = true,
      chartLabel = null,
    } = {},
  ) {
    const local = (selector) => target.querySelector(selector);
    if (["waterfall", "utilization", "breakdown"].includes(metric())) {
      drawBars(rows);
      return;
    }
    if (!d3) {
      target.innerHTML =
        '<p class="fw-empty">The line chart library could not load. Bars remain available.</p>';
      return;
    }
    const series = lineSeries(rows, selectedMetric).filter(
        (s) => s.points.length,
      ),
      active = state.focus || null,
      width = Math.max(250, Math.floor(target.getBoundingClientRect().width)),
      left = 67,
      right = state.view === "streaming" ? 66 : 15,
      top = 15,
      bottom = 45;
    const points = series.flatMap((s) => s.points),
      extX = d3.extent(points, (p) => p.x),
      extY = d3.extent(points, (p) => p.y);
    const x = d3
      .scaleLinear()
      .domain(extX[0] === extX[1] ? [0, extX[1] + 1] : extX)
      .range([left + 4, width - right - 4]);
    const y = d3
      .scaleLinear()
      .domain([0, Math.max(extY[1] * 1.12, 1)])
      .range([height - bottom - 4, top + 4]);
    const line = d3
      .line()
      .x((p) => x(p.x))
      .y((p) => y(p.y));
    const candidates = y
      .ticks(4)
      .filter((v) => v >= y.domain()[0] && v <= y.domain()[1]);
    const yTicks = candidates
        .filter(
          (v, i, ticks) => i === 0 || Math.abs(y(v) - y(ticks[i - 1])) >= 22,
        )
        .slice(0, 5),
      xTicks =
        state.view === "streaming"
          ? x.ticks(width < 450 ? 3 : 6)
          : x.ticks(width < 450 ? 3 : 5).filter(Number.isInteger);
    const f = (v) => (v >= 1000 ? `${fmt(v / 1000)}k` : fmt(v));
    const latencyCurve =
      state.view === "streaming" && selectedMetric !== "throughput";
    const yAxisTitle =
      state.view === "streaming"
        ? latencyCurve
          ? "Latency (seconds) · lower is better"
          : "Throughput (responses/s) · higher is better"
        : unit();
    const endLabels = (state.view === "streaming" ? series : [])
      .map((s) => ({
        id: s.id,
        point: s.points.at(-1),
        labelY: y(s.points.at(-1).y),
      }))
      .sort((a, b) => a.labelY - b.labelY);
    for (let i = 1; i < endLabels.length; i++)
      endLabels[i].labelY = Math.max(
        endLabels[i].labelY,
        endLabels[i - 1].labelY + 16,
      );
    for (let i = endLabels.length - 1; i >= 0; i--)
      endLabels[i].labelY = Math.min(
        endLabels[i].labelY,
        i === endLabels.length - 1
          ? height - bottom - 4
          : endLabels[i + 1].labelY - 16,
      );
    const seriesLabel = (id) => {
      const label = endLabels.find((label) => label.id === id);
      if (!label) return "";
      return `<path class="fw-label-connector" d="M${x(label.point.x) + 5} ${y(label.point.y)} L${width - right + 4} ${label.labelY}" fill="none" stroke-width=".8"/><text class="fw-line-label" x="${width - right + 8}" y="${label.labelY}" dominant-baseline="middle">${esc(name(id))}</text>`;
    };
    target.innerHTML = `<svg class="fw-chart" role="img" aria-label="${state.view === "streaming" ? chartLabel || "Streaming response versus offered load" : "Independent run measurements"}" viewBox="0 0 ${width} ${height}"><title>${esc(chartLabel || suites[state.view].title)} · ${latencyCurve ? "seconds" : unit()}</title><rect data-chart-frame x="${left}" y="${top}" width="${width - left - right}" height="${height - top - bottom}" fill="none" stroke="var(--fw-border)"/>${yTicks.map((v) => `<line x1="${left}" x2="${width - right}" y1="${y(v)}" y2="${y(v)}" stroke="var(--fw-line)"/><text x="${left - 9}" y="${y(v) + 4}" text-anchor="end">${latencyCurve ? `${fmt(v / 1000)} s` : f(v)}</text>`).join("")}${xTicks.map((v) => `<text x="${x(v)}" y="${height - bottom + 20}" text-anchor="middle">${f(v)}</text>`).join("")}<text class="axis-title" data-axis="y" x="${left}" y="11">${yAxisTitle}</text><text class="axis-title" data-axis="x" x="${(left + width - right) / 2}" y="${height - 3}" text-anchor="middle">${state.view === "streaming" ? "Offered load (requests/s)" : `Independent ${state.view === "startup" ? "start" : "process run"} · index`}</text>${series
      .map(
        (s) =>
          `<g data-series="${s.id}" class="fw-series ${s.id === active ? "active" : ""}" style="--series:${renderer(s.id).color};opacity:${active && active !== s.id ? 0.2 : 1}"><path d="${line(s.points)}" stroke-dasharray="${lineDash(s.id)}" fill="none" stroke-width="${s.id === active ? 2 : 1.3}"/>${s.points.map((p) => pointMarker(s.id, x(p.x), y(p.y))).join("")}${seriesLabel(s.id)}</g>`,
      )
      .join(
        "",
      )}<line data-guide x1="${left}" x2="${left}" y1="${top}" y2="${height - bottom}" stroke="#afb9c7" opacity="0"/><g data-hover-marks></g><rect data-chart-hit data-chart-hover-overlay="cross-series" x="${left}" y="${top}" width="${width - left - right}" height="${height - top - bottom}" fill="transparent"/></svg>${legend ? `<div class="fw-legend">${series.map((s) => `<button type="button" class="cursor-interaction" data-focus="${s.id}" aria-pressed="${active === s.id}">${lineKey(s.id)}${logo(s.id)}${esc(name(s.id))}</button>`).join("")}</div>` : ""}<div class="fw-line-tip" aria-live="off">Hover to compare the same x-position.</div>`;
    $$(".fw-legend [data-focus]").forEach((b) => {
      b.addEventListener("pointerenter", () => {
        $$("[data-series]").forEach((g) => {
          g.classList.toggle("active", g.dataset.series === b.dataset.focus);
        });
      });
      b.addEventListener("pointerleave", () => {
        $$("[data-series]").forEach((g) => {
          g.classList.toggle("active", g.dataset.series === state.focus);
        });
      });
    });
    const svg = local(".fw-chart"),
      guide = local("[data-guide]"),
      marks = local("[data-hover-marks]"),
      hit = local("[data-chart-hover-overlay]");
    let pinned = false;
    const move = (e) => {
      const rect = svg.getBoundingClientRect(),
        rawPx = Math.max(
          left,
          Math.min(
            width - right,
            ((e.clientX - rect.left) * width) / rect.width,
          ),
        ),
        rawAt = x.invert(rawPx),
        at =
          state.view === "streaming"
            ? data.rates[d3.bisector((v) => v).center(data.rates, rawAt)]
            : rawAt,
        px = x(at);
      guide.setAttribute("x1", px);
      guide.setAttribute("x2", px);
      guide.setAttribute("opacity", "1");
      const values = series.map((s) => {
        const i = d3.bisector((p) => p.x).center(s.points, at),
          nearest = s.points[i],
          a = s.points[Math.max(0, nearest.x > at ? i - 1 : i)],
          b =
            s.points[Math.min(s.points.length - 1, nearest.x > at ? i : i + 1)],
          v =
            a.x === b.x ? a.y : a.y + ((b.y - a.y) * (at - a.x)) / (b.x - a.x);
        return {
          id: s.id,
          value: v,
          errors:
            state.view === "streaming"
              ? data.streaming.rows[String(at)].find((row) => row.id === s.id)
                  ?.errors || 0
              : 0,
        };
      });
      marks.innerHTML = values
        .map((v) =>
          pointMarker(
            v.id,
            px,
            y(v.value),
            4,
            `data-chart-hover-marker fill="${renderer(v.id).color}"`,
          ),
        )
        .join("");
      local(".fw-line-tip").innerHTML =
        `<span>${state.view === "streaming" ? `Offered load ${fmt(at)} req/s` : `Run ${fmt(at)}`}</span>${values.map((v) => `<span>${esc(name(v.id))} ${latencyCurve ? `${fmt(v.value / 1000)} s` : `${fmt(v.value)} ${unit()}`}${v.errors ? ` · ${fmt(v.errors)} errors` : ""}</span>`).join("")}`;
      if (state.view === "streaming" && selectedMetric === "throughput") {
        if (popupAnchor && popupAnchor !== hit)
          popupAnchor.removeAttribute("aria-describedby");
        popupAnchor = hit;
        hit.setAttribute("aria-describedby", "fw-percentile-popover");
        percentilePopup.innerHTML = `<div class="fw-popover-heading">Successful completions</div><div class="fw-throughput-grid"><span></span><span>Completed/s</span><span>Errors</span>${values.map((v) => `<span>${esc(name(v.id))}</span><span>${fmt(v.value)}<span class="fw-popover-unit">responses/s</span></span><span>${fmt(v.errors)}</span>`).join("")}</div><div class="fw-popover-scope">Offered load ${fmt(at)} req/s · throughput is the median of 3 runs; errors are summed across those runs.</div>`;
        percentilePopup.hidden = false;
        placePercentiles(e, hit);
        return;
      }
      const nearest =
        series[0].points[d3.bisector((p) => p.x).center(series[0].points, at)]
          .x;
      const entries = series.map((s) => {
        const r = rows.find((r) => r.id === s.id);
        let stats = latencyStats(
          r,
          state.view === "streaming" ? { rate: nearest } : { run: nearest },
        );
        if (latencyCurve && stats)
          stats = {
            ...stats,
            unit: "s",
            values: Object.fromEntries(
              ["p50", "p95", "p99"].map((percentile) => [
                percentile,
                stats.values[percentile] / 1000,
              ]),
            ),
          };
        return {
          id: s.id,
          stats,
        };
      });
      showPercentiles(
        entries,
        e,
        hit,
        state.view === "streaming"
          ? `${selectedMetric === "shellP50" ? "First-shell" : "Completion"} latency · offered load ${fmt(nearest)} req/s`
          : state.view === "startup"
            ? "Cold-start percentiles"
            : `Measured run ${fmt(nearest)}`,
      );
    };
    hit.addEventListener("pointermove", (e) => {
      if (!pinned) move(e);
    });
    hit.addEventListener("click", (e) => {
      pinned = !pinned;
      popupPinned = pinned;
      move(e);
    });
    hit.addEventListener("pointerleave", () => {
      if (!pinned) {
        guide.setAttribute("opacity", "0");
        marks.innerHTML = "";
        hidePercentiles();
      }
    });
    $("[data-chart-note]").textContent =
      state.view === "streaming"
        ? selectedMetric === "throughput"
          ? `Successful full responses completed inside each ${data.streaming.methodology.durationSecondsPerRate}-second observation window · three-run medians. Responses finishing later are excluded.`
          : "Measured load curve · three-phase medians at each rate · scheduled-arrival latency includes queueing."
        : "Measured runs in capture order · connected for comparison, not a continuous telemetry stream.";
  }
  function drawCompletionPanels(rows) {
    $("[data-results]").innerHTML =
      ["P50", "P99"]
        .map(
          (p) =>
            `<section class="fw-stream-panel" aria-label="Completion ${p}"><h3>Completion latency · ${p}</h3><div data-completion-panel="${p}"></div></section>`,
        )
        .join("") +
      `<div class="fw-legend">${rows.map((r) => `<button type="button" data-focus="${r.id}" aria-pressed="${state.focus === r.id}">${lineKey(r.id)}${logo(r.id)}${esc(name(r.id))}</button>`).join("")}</div>`;
    for (const p of ["P50", "P99"])
      drawLines(rows, {
        target: $(`[data-completion-panel="${p}"]`),
        selectedMetric: `complete${p}`,
        height: 215,
        legend: false,
        chartLabel: `Completion latency ${p} versus offered load`,
      });
    $("[data-chart-note]").textContent =
      "P50 and P99 across all measured load levels. Each chart uses its own latency range; offered load is aligned. Points show three-phase medians; hover snaps to measured loads.";
  }
  function drawTable(rows) {
    const stats = rows.map((r) => ({ r, stats: latencyStats(r) }));
    const latencyUnit = stats.find((v) => v.stats)?.stats.unit || "ms";
    $("[data-results]").innerHTML =
      `<div class="fw-table-scroll"><table class="fw-data-table"><caption class="sr-only">${esc(suites[state.view].title)} · ${esc(unit())}</caption><thead><tr><th scope="col">Renderer</th><th scope="col">${esc(metric() === "p50" ? "Median" : metric())} (${esc(unit())})</th><th scope="col">Latency P50 (${latencyUnit})</th><th scope="col">P95 (${latencyUnit})</th><th scope="col">P99 (${latencyUnit})</th><th scope="col">Errors</th></tr></thead><tbody>${stats.map(({ r, stats }) => `<tr><th scope="row">${label(r.id)}</th><td>${pctFmt(value(r))}</td><td>${pctFmt(stats?.values?.p50)}</td><td>${pctFmt(stats?.values?.p95)}</td><td>${pctFmt(stats?.values?.p99)}</td><td>${r.errors === undefined ? "—" : fmt(r.errors)}</td></tr>`).join("")}</tbody></table></div>`;
    $("[data-chart-note]").textContent =
      "Absolute measurements from the selected capture. Latency percentiles describe the scope shown in Method & data; errors remain visible.";
  }
  function drawBalls(rows) {
    const paired = state.view === "http" || state.view === "streaming";
    const entries = rows.map((r) => ({
      row: r,
      latency: paired
        ? r.flow.meanMs
        : r.p50 / (state.view === "rendering" ? 1000 : 1),
      rps: paired ? r.flow.rps : null,
    }));
    if (paired) entries.sort((a, b) => b.rps - a.rps);
    const clock = 1100 / Math.min(...entries.map((e) => e.latency));
    const maxOccupancy = Math.max(
      ...entries.map((e) => (paired ? (e.rps * e.latency) / 1000 : 1)),
    );
    const peakRate = paired
      ? Math.max(...entries.map((e) => e.rps)) / clock
      : 0;
    const group = paired
      ? 2 ** Math.ceil(Math.log2(Math.max(1, peakRate / 12, maxOccupancy / 36)))
      : 1;
    const start =
      state.view === "startup"
        ? "Spawn"
        : state.view === "rendering"
          ? "Data"
          : "Requests";
    const end = state.view === "rendering" ? "HTML" : "Responses";
    const header = `<div class="fw-flow-heading"><span>Renderer</span><span class="fw-flow-direction"><span>${start}</span><span>→</span><span>${end}</span></span><span class="fw-flow-measure">${paired ? "Throughput / mean" : "Median time"}</span></div>`;
    $("[data-results]").innerHTML =
      header +
      entries
        .map((e) => {
          const r = e.row,
            duration = e.latency * clock,
            interval = paired ? (1000 * clock * group) / e.rps : duration,
            count = Math.ceil(duration / interval) + 1;
          const durationText =
            state.view === "rendering"
              ? `${fmt(r.p50)} µs`
              : `${fmt(e.latency)} ms`;
          const tip = paired
            ? `${name(r.id)}: ${fmt(e.rps)} successful responses/s; ${fmt(e.latency)} ms mean latency; representative repeat ${r.flow.repeat ?? "not recorded"}. ${state.view === "http" ? "64 closed-loop connections." : "Scheduled-arrival latency includes queueing; only successful responses are shown."}`
            : `${name(r.id)}: ${durationText}. Sequential timing illustration; no measured request rate.`;
          return `<button type="button" class="fw-row fw-flow-row cursor-interaction" style="--brand:${renderer(r.id).color}" data-focus="${r.id}" aria-pressed="${state.focus === r.id}" aria-label="${esc(tip)}">${label(r.id)}<svg class="fw-pipe" height="48" width="100%" role="img" aria-label="${esc(tip)}" data-flow-lane="${r.id}" data-duration="${duration}" data-interval="${interval}" ><title>${esc(tip)}</title><rect class="fw-pipe-bed" x="1%" y="17" width="98%" height="14" rx="7"/><line class="fw-pipe-port" x1="3%" x2="3%" y1="12" y2="36"/><line class="fw-pipe-port" x1="97%" x2="97%" y1="12" y2="36"/>${Array.from({ length: count }, (_, i) => `<circle class="fw-packet" data-packet="${i}" cx="4%" cy="24" r="3.5"/>`).join("")}</svg><span class="fw-flow-value">${paired ? `<span>${fmt(e.rps)}<small> /s</small></span><small>${durationText}</small>` : `<span>${durationText}</span>`}</span></button>`;
        })
        .join("");
    flowRuntime = {
      lanes: $$("[data-flow-lane]").map((el) => ({
        duration: Number(el.dataset.duration),
        interval: Number(el.dataset.interval),
        packets: Array.from(el.querySelectorAll("[data-packet]")),
      })),
      paired,
      clock,
      group,
    };
    paintFlow(0);
    $("[data-heading]").textContent = paired
      ? "Requests in motion"
      : state.view === "startup"
        ? "Spawn → first response"
        : "Data → HTML";

    const note = paired
      ? `Aggregate-data illustration · ● = ${fmt(group)} response${group === 1 ? "" : "s"} · shared clock slowed ${fmt(clock)}× · pipe width fixed`
      : "Timing illustration · one ball per job · shared clock · throughput and bandwidth not measured";
    $("[data-chart-note]").textContent = note;
    $("[data-play]").textContent = reduced()
      ? "Motion off"
      : state.flowPlaying
        ? "Pause"
        : "Play";
    $("[data-play]").disabled = reduced();
    if (state.flowPlaying && !reduced()) startFlow();
  }
  function paintFlow(time) {
    if (!flowRuntime) return;
    for (const lane of flowRuntime.lanes) {
      const age = (time + lane.duration * 0.37) % lane.interval;
      lane.packets.forEach((packet, i) => {
        const t = age + i * lane.interval,
          visible = t < lane.duration;
        packet.style.display = visible ? "" : "none";
        if (visible)
          packet.setAttribute("cx", `${4 + (92 * t) / lane.duration}%`);
      });
    }
  }
  function startFlow() {
    if (!flowRuntime || reduced()) return;
    playing = true;
    flowOrigin = performance.now() - flowElapsed;
    const frame = (now) => {
      if (!playing) return;
      flowElapsed = now - flowOrigin;
      paintFlow(flowElapsed);
      flowFrame = requestAnimationFrame(frame);
    };
    flowFrame = requestAnimationFrame(frame);
  }
  function play() {
    if (!flowRuntime || reduced()) return;
    if (playing) {
      cancelAnimationFrame(flowFrame);
      playing = false;
      state.flowPlaying = false;
      $("[data-play]").textContent = "Play";
    } else {
      state.flowPlaying = true;
      $("[data-play]").textContent = "Pause";
      startFlow();
    }
    save();
  }
  function render() {
    stop();
    if (state.view === "streaming") state.chart = "lines";
    if (state.view === "framework" && !data.framework) state.view = "rendering";
    if (state.view === "framework") {
      state.workload = "catalog";
      if (state.chart === "balls") state.chart = "bars";
    } else if (state.workload === "catalog") state.workload = "cards";
    $("[data-view=framework]").hidden = !data.framework;
    if (state.chart === "compare" && state.view !== "rendering")
      state.chart = "bars";
    root.dataset.compare = String(state.chart === "compare");
    const aggregate = ["waterfall", "utilization", "breakdown"].includes(
      metric(),
    );
    if (aggregate) state.chart = "bars";
    $$("[data-chart]").forEach((b) => {
      b.disabled =
        (aggregate && b.dataset.chart !== "bars") ||
        (state.view === "framework" && b.dataset.chart === "balls");
      if (b.disabled)
        b.setAttribute(
          "data-tooltip",
          "Aggregate measurements. Select capacity or latency for run and flow views.",
        );
      else b.removeAttribute("data-tooltip");
    });
    const fixed = ["startup", "streaming"].includes(state.view);
    if (fixed) state.workload = "products";
    $$("[data-section]").forEach((b) => {
      b.removeAttribute("aria-current");
      if (b.dataset.section === state.section)
        b.setAttribute("aria-current", "page");
    });
    $("[data-performance]").hidden = state.section !== "performance";
    $("[data-ecosystem]").hidden = state.section !== "ecosystem";
    $("[data-results-title]").hidden = state.view === "rendering";
    const exclusions =
      state.view === "streaming" ? data.streaming.excluded || [] : [];
    const validationNote = $("[data-validation-note]");
    if (validationNote) {
      const refreshNote =
        state.view === "rendering" ? data.rendering.refresh?.note : null;
      validationNote.hidden = !exclusions.length && !refreshNote;
      validationNote.textContent = exclusions.length
        ? `${exclusions.map((entry) => name(entry.id)).join(", ")} streaming results withheld: placeholder validation was incorrect. Corrected rerun pending.`
        : refreshNote || "";
    }
    $("#site-title").textContent =
      state.section === "ecosystem"
        ? "The ecosystem"
        : "Web framework benchmarks";
    if (state.section === "ecosystem") {
      renderCatalog();
      return;
    }
    renderScenarios();
    $$("[data-view]").forEach((b) => {
      b.removeAttribute("aria-current");
      b.setAttribute("aria-selected", String(b.dataset.view === state.view));
      b.tabIndex = b.dataset.view === state.view ? 0 : -1;
      if (b.dataset.view === state.view) b.setAttribute("aria-current", "page");
    });
    $$("[data-chart]").forEach((b) => {
      b.setAttribute("aria-pressed", String(b.dataset.chart === state.chart));
    });
    $('[data-chart="balls"]').hidden = ["framework", "streaming"].includes(
      state.view,
    );
    $('[data-chart="table"]').hidden = state.view === "streaming";
    $(".fw-view-switch").hidden = state.view === "streaming";
    $("[data-framework-view]").hidden = state.view !== "framework";
    $("[data-framework-view]").value = state.framework;
    $("[data-http-view]").hidden =
      state.view !== "http" || state.chart === "balls";
    $("[data-http-view]").value = state.http;
    $("[data-stream-view]").hidden =
      state.view !== "streaming" || state.chart === "balls";
    $("[data-stream-view]").value =
      state.chart === "bars" && state.stream === "completion"
        ? "completeP99"
        : state.stream;
    $('[data-stream-view] option[value="completion"]').hidden =
      state.chart === "bars";
    $("[data-load-points]").hidden =
      state.view !== "streaming" || state.chart !== "bars";
    $$("[data-load]").forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        String(
          state.chart !== "lines" && Number(button.dataset.load) === state.rate,
        ),
      );
    });
    $('[data-chart="lines"]').textContent =
      state.view === "streaming" ? "Load curve" : "Lines";
    $("[data-play]").hidden =
      state.chart !== "balls" ||
      ["waterfall", "utilization", "breakdown"].includes(metric());
    $("#experiment-panel").setAttribute(
      "aria-labelledby",
      `experiment-${state.view}`,
    );
    const all = getRows(),
      rows = all
        .filter((r) => isVisible(r))
        .sort((a, b) =>
          metric() === "throughput" ? value(b) - value(a) : value(a) - value(b),
        );
    if (state.focus && !rows.some((row) => row.id === state.focus))
      state.focus = null;
    const titles = {
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
    };
    $("[data-heading]").textContent =
      state.view === "framework"
        ? {
            throughput: "Framework SSR capacity",
            p50: "Framework SSR · equal-load P50",
            p99: "Framework SSR · equal-load P99",
            cpu: "Framework SSR · CPU per response",
            rss: "Framework SSR · peak memory",
          }[metric()]
        : state.view === "streaming" &&
            state.chart === "lines" &&
            state.stream === "completion"
          ? "Stream completion latency · P50 & P99"
          : titles[metric()] || suites[state.view].title;
    if (!rows.length) {
      $("[data-results]").innerHTML =
        '<div class="fw-empty">No measurements for this selection.</div>';
      $("[data-chart-note]").textContent = "";
    } else if (state.chart === "compare") drawComparison(rows);
    else if (
      state.chart === "lines" &&
      state.view === "streaming" &&
      state.stream === "completion"
    )
      drawCompletionPanels(rows);
    else if (state.chart === "lines") drawLines(rows);
    else if (state.chart === "balls") drawBalls(rows);
    else if (state.chart === "table") drawTable(rows);
    else drawBars(rows);
    if (
      state.view === "rendering" &&
      (state.chart !== "compare" || !rows.length) &&
      uncaptured().length
    )
      $("[data-results]").insertAdjacentHTML(
        "beforeend",
        `<div class="fw-unmeasured-list"><h3>Not measured</h3>${uncaptured()
          .map(
            (r) =>
              `<div>${label(r.id)}<span>${esc(r.coverageReason)} <a href="${esc(r.coverageSource)}" target="_blank" rel="noreferrer">Details ↗</a>${data.framework?.rows.some((v) => v.id === r.id) ? ' · <a href="?view=framework">Measured in Framework SSR ↗</a>' : ""}</span></div>`,
          )
          .join("")}</div>`,
      );
    const errorRows = (
      state.view === "streaming" && state.chart === "lines"
        ? rows.map((r) => ({
            ...r,
            errors: data.rates.reduce(
              (sum, rate) =>
                sum +
                (data.streaming.rows[String(rate)].find((v) => v.id === r.id)
                  ?.errors || 0),
              0,
            ),
          }))
        : rows
    ).filter((r) => r.errors > 0);
    if (errorRows.length)
      $("[data-chart-note]").textContent +=
        ` · Errors across ${state.view === "streaming" && state.chart === "lines" ? "all displayed load levels" : "selected phases"}: ${errorRows.map((r) => `${name(r.id)} ${fmt(r.errors)}`).join("; ")}`;
    const s = data[state.view];
    $("[data-versions]").innerHTML = Object.entries(s.versions)
      .map(
        ([id, version]) =>
          `<dt>${esc(renderer(id)?.label || id)}</dt><dd>${esc(typeof version === "string" ? version : JSON.stringify(version))}</dd>`,
      )
      .join("");
    const cpuContext = $("[data-cpu-context]");
    if (cpuContext)
      cpuContext.hidden =
        state.view !== "streaming" ||
        !/^\d+$/.test(s.host?.serverCpuAffinity ?? "");
    $("[data-capture]").textContent =
      `${s.host?.cloud || s.host?.cpu_model || s.host?.cpuModel || "Recorded host"} · ${s.date}`;
    const missing = data.renderers.filter(
      (r) => isVisible(r) && !all.some((v) => v.id === r.id),
    );
    $("[data-coverage]").textContent = missing.length
      ? `${missing.length} roster entries not measured here`
      : "";
    $("[data-scope]").textContent = suites[state.view].scope;
    $("[data-method]").textContent = suites[state.view].method;
    $("[data-source]").innerHTML =
      `<a href="${s.download}" download>Original capture ↗</a> · <a href="https://github.com/Proa-Labs/framework-benchmarks/blob/main/${s.source}" target="_blank" rel="noreferrer">View source ↗</a><br><span class="fw-source-hash">${s.sourceSnapshot ? `<a href="${s.sourceSnapshot}" download>Captured source snapshot ↗</a><br>` : ""}Source SHA-256 ${esc(s.hash)} · Artifact SHA-256 ${esc(s.artifactSha256)}</span>${s.note ? `<br>${esc(s.note)}` : ""}`;
    $$("[data-engine]").forEach((el) => {
      el.checked = state.selected.includes(el.dataset.engine);
    });
    const exportRows =
      metric() === "breakdown"
        ? []
        : state.view === "streaming" && state.chart === "lines"
          ? data.rates.flatMap((rate) =>
              data.streaming.rows[String(rate)]
                .filter(isVisible)
                .flatMap((row) =>
                  (state.stream === "completion"
                    ? ["completeP50", "completeP99"]
                    : [metric()]
                  ).map((key) => ({
                    ...row,
                    rate,
                    exportMetric: key,
                    exportValue: row[key],
                    exportSamples: row.seriesSamples[key],
                  })),
                ),
            )
          : state.chart === "compare"
            ? rows.flatMap((row) =>
                data.workloads.map((w) => ({
                  ...data.rendering.rows[w.id].find((r) => r.id === row.id),
                  workload: w.id,
                })),
              )
            : rows;
    const exportData = {
      measurementStatus:
        metric() === "breakdown" ? "not instrumented" : "measured",
      experiment: state.view,
      toolTypes: state.types,
      unmeasured: (state.view === "rendering"
        ? uncaptured()
        : data.renderers.filter(
            (r) => isVisible(r) && !all.some((v) => v.id === r.id),
          )
      ).map((r) => ({
        id: r.id,
        reason:
          state.view === "rendering"
            ? r.coverageReason
            : s.excluded?.find((entry) => entry.id === r.id)?.reason ||
              "No capture in this experiment",
      })),
      metric:
        state.view === "streaming" &&
        state.chart === "lines" &&
        state.stream === "completion"
          ? "completeP50+completeP99"
          : metric(),
      presentation:
        state.chart === "balls"
          ? "Aggregate flow illustration"
          : "Measured values",
      flowModel:
        state.chart === "balls"
          ? {
              clock: flowRuntime?.clock,
              responsesPerBall: flowRuntime?.group,
              bandwidth: "not measured",
              pairedRun: state.view === "http" || state.view === "streaming",
            }
          : null,
      workload: state.chart === "compare" ? "all" : state.workload,
      rate:
        state.view === "streaming" && state.chart !== "lines"
          ? state.rate
          : null,
      unit: unit(),
      capturedAt: s.capturedAt,
      source: suites[state.view].path,
      hash: s.hash,
      method: suites[state.view].method,
      scope: suites[state.view].scope,
      rows: exportRows.map((r) => ({
        id: r.id,
        workload: r.workload ?? state.workload,
        metric: r.exportMetric || metric(),
        rate: r.rate ?? (state.view === "streaming" ? state.rate : null),
        value: r.exportValue ?? value(r),
        samples: r.exportSamples ?? samples(r),
        detail: r.detail,
        errors: r.errors ?? null,
        latencyPercentiles: latencyStats(r, { rate: r.rate ?? null }),
        ...(state.chart === "balls" && r.flow
          ? { pairedFlowMeasurement: r.flow }
          : {}),
      })),
    };
    $("[data-json]").href =
      `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(exportData, null, 2))}`;
    const cell = (v) => `"${String(v).replace(/"/g, '""')}"`;
    $("[data-csv]").href = `data:text/csv;charset=utf-8,${encodeURIComponent(
      [
        [
          "renderer",
          "value",
          "unit",
          "metric",
          "workload",
          "offered_rps",
          "captured_at",
          "latency_p50",
          "latency_p95",
          "latency_p99",
          "latency_unit",
          "errors",
        ],
        ...exportRows.map((r) => {
          const latency = latencyStats(r, { rate: r.rate ?? null });
          return [
            name(r.id),
            r.exportValue ?? value(r),
            unit(),
            r.exportMetric || metric(),
            r.workload ?? state.workload,
            r.rate ?? (state.view === "streaming" ? state.rate : ""),
            s.capturedAt,
            latency?.values.p50 ?? "",
            latency?.values.p95 ?? "",
            latency?.values.p99 ?? "",
            latency?.unit ?? "",
            r.errors ?? "",
          ];
        }),
      ]
        .map((row) => row.map(cell).join(","))
        .join("\r\n"),
    )}`;
  }
  $("[data-load-points]").innerHTML =
    `<span>Inspect load · req/s</span>${data.rates.map((rate) => `<button type="button" data-load="${rate}" aria-label="Inspect ${rate.toLocaleString("en-US")} requests per second" aria-pressed="false">${rate.toLocaleString("en-US")}</button>`).join("")}`;
  $(".fw-options").innerHTML = data.renderers
    .map(
      (r) =>
        `<label class="cursor-interaction"><input type="checkbox" data-engine="${r.id}">${esc(r.label)}</label>`,
    )
    .join("");
  const infoButton = $(".fw-experiment-info");
  const infoPopup = $("#rendering-info");
  let infoHovered = false,
    infoFocused = false,
    infoHideTimer;
  const showInfo = () => {
    clearTimeout(infoHideTimer);
    const bounds = infoButton.getBoundingClientRect();
    const width = Math.min(320, window.innerWidth - 32);
    infoPopup.style.left = `${Math.min(Math.max(16, bounds.left), window.innerWidth - width - 16)}px`;
    infoPopup.style.top = `${bounds.bottom + 8}px`;
    if (!infoPopup.matches(":popover-open")) infoPopup.showPopover();
  };
  const hideInfoSoon = () => {
    clearTimeout(infoHideTimer);
    infoHideTimer = setTimeout(() => {
      if (!infoHovered && !infoFocused && infoPopup.matches(":popover-open"))
        infoPopup.hidePopover();
    }, 150);
  };
  for (const element of [infoButton, infoPopup]) {
    element.addEventListener("pointerenter", () => {
      infoHovered = true;
      showInfo();
    });
    element.addEventListener("pointerleave", () => {
      infoHovered = false;
      hideInfoSoon();
    });
  }
  infoButton.addEventListener("focus", () => {
    infoFocused = infoButton.matches(":focus-visible");
    if (infoFocused) showInfo();
  });
  infoButton.addEventListener("blur", () => {
    infoFocused = false;
    hideInfoSoon();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && infoPopup.matches(":popover-open"))
      infoPopup.hidePopover();
  });
  root.addEventListener("click", (e) => {
    const el = e.target.closest("button");
    if (!el) return;
    if (el.hasAttribute("data-share")) {
      (navigator.clipboard
        ? navigator.clipboard.writeText(location.href)
        : Promise.reject()
      )
        .then(() => {
          $("[data-share-status]").textContent = "Comparison link copied";
        })
        .catch(() => {
          $("[data-share-status]").textContent =
            "Copy the URL from your address bar to share this comparison.";
        });
      return;
    }
    if (el.dataset.preview) {
      const w = [...data.workloads, frameworkWorkload].find(
        (w) => w.id === el.dataset.preview,
      );
      $("#fixture-title").textContent = w.label;
      $("[data-fixture-frame]").src = `previews/${w.id}.html`;
      $("[data-preview-link]").href = `previews/${w.id}.html`;
      $(".fw-fixture-dialog").showModal();
      return;
    }
    if (el.hasAttribute("data-close-preview")) {
      $(".fw-fixture-dialog").close();
      return;
    }
    if (el.hasAttribute("data-play")) {
      play();
      return;
    }
    if (el.dataset.section) state.section = el.dataset.section;
    else if (el.dataset.view) {
      switchView(el.dataset.view);
    } else if (el.dataset.chart) {
      state.chart = el.dataset.chart;
      if (state.chart === "balls") {
        if (state.view === "http") state.http = "throughput";
        if (state.view === "streaming") state.stream = "completeP50";
      }
    } else if (el.dataset.load) {
      const deselect =
        state.chart !== "lines" && state.rate === Number(el.dataset.load);
      state.rate = Number(el.dataset.load);
      state.chart = deselect ? "lines" : "bars";
      state.focus = null;
    } else if (el.dataset.sortWorkload) {
      state.workload = el.dataset.sortWorkload;
    } else if (el.dataset.workload) {
      state.workload = el.dataset.workload;
      if (state.chart === "compare") state.chart = "bars";
      state.focus = null;
    } else if (el.dataset.focus) {
      state.focus = state.focus === el.dataset.focus ? null : el.dataset.focus;
      if (el.classList.contains("fw-row")) {
        $$(".fw-row[data-focus]").forEach((row) => {
          row.setAttribute(
            "aria-pressed",
            String(row.dataset.focus === state.focus),
          );
        });
        save();
        return;
      }
      if (el.closest(".fw-comparison")) {
        $$(".fw-comparison [data-focus]").forEach((button) => {
          button.setAttribute(
            "aria-pressed",
            String(button.dataset.focus === state.focus),
          );
          button
            .closest("tr")
            .classList.toggle(
              "fw-comparison-focused",
              button.dataset.focus === state.focus,
            );
        });
        save();
        return;
      }
    } else if (el.hasAttribute("data-all")) {
      state.selected = data.renderers.map((r) => r.id);
      state.types = [...ALL_GROUPS];
    } else return;
    render();
    save();
    const focusSelector = el.dataset.type
      ? `[data-type="${el.dataset.type}"]`
      : el.dataset.workload
        ? `[data-workload="${el.dataset.workload}"]`
        : el.dataset.sortWorkload
          ? `[data-sort-workload="${el.dataset.sortWorkload}"]`
          : null;
    if (focusSelector) $(focusSelector)?.focus({ preventScroll: true });
  });
  root.addEventListener("change", (e) => {
    const el = e.target;
    if (el.dataset.type)
      state.types = el.checked
        ? [...new Set([...state.types, el.dataset.type])]
        : state.types.filter((id) => id !== el.dataset.type);
    else if (el.hasAttribute("data-framework-view")) state.framework = el.value;
    else if (el.hasAttribute("data-http-view")) state.http = el.value;
    else if (el.hasAttribute("data-stream-view")) state.stream = el.value;
    else if (el.dataset.engine)
      state.selected = el.checked
        ? [...new Set([...state.selected, el.dataset.engine])]
        : state.selected.filter((id) => id !== el.dataset.engine);
    else return;
    state.focus = null;
    render();
    save();
  });
  root.addEventListener("click", (event) => {
    const row = event.target.closest(percentileTarget);
    if (row) {
      if (row.isConnected) {
        popupPinned = true;
        showRowPercentiles(row);
      }
    }
  });
  document.addEventListener("pointerdown", (event) => {
    if (!event.target.closest(".fw-row,.fw-comparison,.fw-chart"))
      hidePercentiles(true);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(flowFrame);
      playing = false;
    } else if (state.flowPlaying && flowRuntime) startFlow();
  });
  $(".fw-lab-nav").addEventListener("keydown", (event) => {
    const tabs = $$("[data-view]").filter((tab) => !tab.hidden);
    const index = tabs.indexOf(event.target);
    if (
      index < 0 ||
      !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
    )
      return;
    event.preventDefault();
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? tabs.length - 1
          : (index + (event.key === "ArrowRight" ? 1 : tabs.length - 1)) %
            tabs.length;
    tabs[next].click();
    tabs[next].focus({ preventScroll: true });
    tabs[next].scrollIntoView({
      block: "nearest",
      inline: "nearest",
      behavior: "auto",
    });
  });
  window.addEventListener("popstate", () => {
    rememberView();
    restore();
    render();
  });
  render();
  if (globalThis.ResizeObserver)
    new ResizeObserver((entries) => {
      const w = Math.floor(entries[0].contentRect.width);
      if (w !== lastWidth) {
        lastWidth = w;
        if (state.chart === "lines" && state.section === "performance")
          render();
      }
    }).observe(root);
})();
