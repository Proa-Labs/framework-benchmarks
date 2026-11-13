import type {
  BenchmarkData,
  ChartMode,
  ChartRow,
  HttpRow,
  Metric,
  Percentiles,
  View,
} from "../../benchmark-types.ts";
import { required } from "../../required.ts";
import type { ChartPoint } from "./chart-markup.ts";

type Latency = { values: Percentiles; unit: string; scope: string };
type StatEntry = { id: string; stats: Latency | null };
type ExportRow = ChartRow & {
  workload?: string;
  rate?: number;
  exportMetric?: string;
  exportValue?: number;
  exportSamples?: number[];
  suite?: "rendering" | "framework";
  unit?: string;
  capturedAt?: string;
  source?: string;
  latency?: Latency;
};
interface FlowRuntime {
  paired: boolean;
  clock: number;
  group: number;
  lanes: { duration: number; interval: number; packets: SVGCircleElement[] }[];
}
const closest = (event: Event, selector: string) =>
  event.target instanceof Element
    ? event.target.closest<HTMLElement>(selector)
    : null;

import { bisector, extent } from "d3-array";
import { scaleLinear } from "d3-scale";
import { line } from "d3-shape";
import { ALL_GROUPS, TOOL_GROUPS } from "../filters.ts";
import { createChartMarkup } from "./chart-markup.ts";
import { createDashboardModel } from "./dashboard-model.ts";

const d3 = { extent, bisector, scaleLinear, line };

// D3 owns only this mounted chart workspace; React owns page composition.
export function mountDashboard(root: HTMLElement, data: BenchmarkData) {
  const lifecycle = new AbortController();
  const listen = <K extends keyof (WindowEventMap & DocumentEventMap)>(
    target: EventTarget,
    type: K,
    handler: (event: (WindowEventMap & DocumentEventMap)[K]) => void,
    options: AddEventListenerOptions = {},
  ) =>
    target.addEventListener(type, handler as EventListener, {
      ...options,
      signal: lifecycle.signal,
    });
  const $ = <T extends Element = HTMLElement>(selector: string): T => {
    const element = root.querySelector<T>(selector);
    if (!element) throw new Error(`Missing dashboard element: ${selector}`);
    return element;
  };
  const $$ = <T extends Element = HTMLElement>(selector: string): T[] =>
    Array.from(root.querySelectorAll<T>(selector));
  let currentSearch = location.search;
  const model = createDashboardModel(data, currentSearch);
  const {
    state,
    esc,
    fmt,
    pctFmt,
    renderer,
    name,
    logo,
    label,
    isVisible,
    frameworkWorkloads,
    suites,
    rememberView,
    switchView,
    metric,
    getRows,
    samples,
    value,
    unit,
    uncaptured,
    latencyStats,
  } = model;
  const restore = () => model.restore(location.search);
  const markup = createChartMarkup(model);
  const { lineKey, pointMarker } = markup;
  function showChart(rows: ChartRow[], mode: ChartMode) {
    const chart = markup.draw(rows, mode);
    $("[data-results]").innerHTML = chart.html;
    $("[data-chart-note]").textContent = chart.note;
    return chart;
  }
  const syncSectionLinks = () => {
    $$<HTMLAnchorElement>("a[data-section]").forEach((link) => {
      const params = new URLSearchParams(currentSearch);
      params.set("section", required(link.dataset.section));
      link.href = `${location.pathname}?${params}`;
    });
  };
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
    ] as const)
      params.set(key, String(state[key]));
    if (state.selected.length !== data.renderers.length)
      params.set("selected", state.selected.join(","));
    if (state.focus) params.set("focus", state.focus);
    if (state.types.length !== ALL_GROUPS.length)
      params.set("types", state.types.join(","));
    currentSearch = `?${params.toString()}`;
    syncSectionLinks();
    history.replaceState(
      history.state,
      "",
      `${location.pathname}?${params.toString()}`,
    );
  };
  let playing = false,
    lastWidth = 0,
    flowElapsed = 0,
    flowOrigin = 0;
  let flowRuntime: FlowRuntime | null = null;
  let flowFrame = 0;
  const reduced = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const percentilePopup = $("[data-percentile-popup]");
  let popupAnchor: Element | null = null;
  let popupPinned = false;
  let supportHideTimer = 0;
  let returningPopupFocus = false;
  let dismissedHover = false;
  const percentileTarget =
    ".fw-row[data-focus], .fw-comparison [data-focus], .fw-comparison [data-render-support]";
  function hidePercentiles(force = false) {
    clearTimeout(supportHideTimer);
    if (popupPinned && !force) return;
    // Hiding a popup can uncover a different cell beneath the stationary mouse.
    // Wait for actual pointer movement before accepting another hover.
    if (force) dismissedHover = true;
    const restore =
      force && percentilePopup.contains(document.activeElement)
        ? popupAnchor
        : null;
    popupPinned = false;
    percentilePopup.hidden = true;
    if (popupAnchor) {
      popupAnchor.removeAttribute("aria-describedby");
      popupAnchor = null;
    }
    if (restore instanceof HTMLElement && restore.isConnected) {
      returningPopupFocus = true;
      restore.focus({ preventScroll: true });
      returningPopupFocus = false;
    }
  }
  function placePercentiles(event: MouseEvent | null, anchor: Element) {
    const rootRect = root.getBoundingClientRect(),
      anchorRect = anchor.getBoundingClientRect();
    percentilePopup.style.maxWidth = `${Math.min(440, rootRect.width - 16, window.innerWidth - 20)}px`;
    const width = percentilePopup.offsetWidth,
      height = percentilePopup.offsetHeight;
    const clientX = Number.isFinite(event?.clientX)
      ? required(event).clientX
      : anchorRect.left + anchorRect.width / 2;
    const clientY = Number.isFinite(event?.clientY)
      ? required(event).clientY
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
  function showPercentiles(
    entries: StatEntry[],
    event: MouseEvent | null,
    anchor: Element,
    heading = "",
  ) {
    const ready = entries.filter((e): e is StatEntry & { stats: Latency } =>
      Boolean(e.stats?.values),
    );
    clearTimeout(supportHideTimer);
    percentilePopup.removeAttribute("data-support-popover");
    percentilePopup.setAttribute("role", "tooltip");
    percentilePopup.removeAttribute("aria-label");
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
    const adapted =
      state.view === "rendering"
        ? renderer(first.id)?.renderingAdaptation
        : undefined;
    if (adapted) interactivePopup(`${name(first.id)} fixture notes`);
    percentilePopup.innerHTML = single
      ? `<div class="fw-popover-heading"><div class="fw-popover-identity">${logo(first.id)}<span class="fw-popover-title">${esc(name(first.id))}</span></div></div><div class="fw-percentile-values">${(["p50", "p95", "p99"] as const).map((q) => `<div class="fw-percentile-value"><small>${q.toUpperCase()}</small><div class="fw-percentile-number"><strong>${pctFmt(first.stats.values[q])}</strong><span class="fw-popover-unit">${esc(first.stats.unit)}</span></div></div>`).join("")}</div><div class="fw-popover-scope">${esc(first.stats.scope)}</div>`
      : `<div class="fw-popover-heading">${esc(heading)}</div><div class="fw-percentile-grid"><span></span><span>P50</span><span>P95</span><span>P99</span>${ready.map((e) => `<span class="fw-popover-renderer">${esc(name(e.id))}</span>${(["p50", "p95", "p99"] as const).map((q) => `<span>${pctFmt(e.stats.values[q])}<span class="fw-popover-unit">${esc(e.stats.unit)}</span></span>`).join("")}`).join("")}</div><div class="fw-popover-scope">${esc(first.stats.scope)}</div>`;
    if (adapted) percentilePopup.innerHTML += adaptationDescription(adapted);
    percentilePopup.hidden = false;
    placePercentiles(event, anchor);
  }
  function interactivePopup(label: string) {
    percentilePopup.setAttribute("data-support-popover", "");
    percentilePopup.setAttribute("role", "dialog");
    percentilePopup.setAttribute("aria-label", label);
  }
  function adaptationDescription(
    adapted: NonNullable<
      import("../../benchmark-types.ts").Renderer["renderingAdaptation"]
    >,
  ) {
    return `<div class="fw-popover-scope" data-adaptation-explanation><strong>${esc(adapted.label)}</strong><p>${esc(adapted.reason)}</p>${adapted.backend ? `<p>${esc(adapted.backend)}</p>` : ""}<p><a href="${esc(adapted.source)}" target="_blank" rel="noreferrer">Exact’s styling guide ↗</a> · <a href="${esc(adapted.details)}" target="_blank" rel="noreferrer">What we changed ↗</a></p></div>`;
  }
  function showRowPercentiles(row: HTMLElement) {
    clearTimeout(supportHideTimer);
    if (row.dataset.renderAdaptation) {
      const id = row.dataset.renderAdaptation;
      const adapted = required(renderer(id)?.renderingAdaptation);
      popupAnchor?.removeAttribute("aria-describedby");
      popupAnchor = row;
      row.setAttribute("aria-describedby", "fw-percentile-popover");
      interactivePopup(`${name(id)} fixture notes`);
      percentilePopup.innerHTML = `<div class="fw-popover-heading">${logo(id)} ${esc(name(id))}</div>${adaptationDescription(adapted)}`;
      percentilePopup.hidden = false;
      placePercentiles(null, row);
      return;
    }
    if (row.dataset.renderSupport) {
      clearTimeout(supportHideTimer);
      const id = row.dataset.renderSupport;
      const workload = required(
        data.workloads.find((w) => w.id === row.dataset.supportWorkload),
      );
      const coverage = model.renderingCoverage(id, workload.id);
      if (popupAnchor && popupAnchor !== row)
        popupAnchor.removeAttribute("aria-describedby");
      popupAnchor = row;
      interactivePopup(`${name(id)} fixture notes`);
      row.removeAttribute("title");
      row.setAttribute("aria-describedby", "fw-percentile-popover");
      const status =
        coverage.status === "unsupported"
          ? "Unsupported for this fixture"
          : coverage.status === "parity-failed"
            ? "Does not pass this fixture"
            : "Not measured";
      percentilePopup.innerHTML = `<div class="fw-popover-heading">${logo(id)} ${esc(name(id))} · ${esc(workload.label)}</div><div class="fw-popover-scope"><strong>${status}</strong><p>${esc(coverage.reason)}</p>${coverage.version ? `<p>Checked version: ${esc(coverage.version)}</p>` : ""}<p><a href="${esc(coverage.source)}" target="_blank" rel="noreferrer">Why this differs ↗</a></p></div>`;
      percentilePopup.hidden = false;
      placePercentiles(null, row);
      return;
    }
    const workload = row.dataset.statWorkload,
      framework = row.dataset.statSuite === "framework",
      r = (
        framework
          ? data.framework.workloads[required(workload)]
          : workload
            ? data.rendering.rows[workload]
            : getRows()
      ).find((r) => r.id === row.dataset.focus),
      stats =
        framework && r
          ? {
              values: (r as HttpRow).percentiles.equalLoad,
              unit: "ms",
              scope: `Full-framework HTTP request → complete HTML · equal load ${(r as HttpRow).equalLoadRps} requests/s · median of three run percentiles`,
            }
          : latencyStats(r, { flow: state.chart === "balls" });
    if (workload && stats)
      stats.scope = `${required((framework ? frameworkWorkloads() : data.workloads).find((w) => w.id === workload)).label} · ${stats.scope}`;
    showPercentiles(
      [
        {
          id: r?.id ?? "",
          stats,
        },
      ],
      null,
      row,
    );
  }
  listen(root, "mouseover", (event) => {
    const row = closest(event, percentileTarget);
    if (
      row &&
      !row.contains(
        event.relatedTarget instanceof Node ? event.relatedTarget : null,
      )
    ) {
      if (dismissedHover) return;
      if (popupAnchor !== row) popupPinned = false;
      showRowPercentiles(row);
    }
  });
  listen(root, "pointerout", (event) => {
    const row = closest(event, percentileTarget);
    if (
      row &&
      !row.contains(
        event.relatedTarget instanceof Node ? event.relatedTarget : null,
      )
    ) {
      const next =
        event.relatedTarget instanceof Node ? event.relatedTarget : null;
      if (percentilePopup.hasAttribute("data-support-popover")) {
        if (!percentilePopup.contains(next))
          supportHideTimer = window.setTimeout(() => hidePercentiles(), 150);
      } else hidePercentiles();
    }
  });
  listen(root, "pointermove", (event) => {
    if (!dismissedHover || !(event.movementX || event.movementY)) return;
    dismissedHover = false;
    const row = closest(event, percentileTarget);
    if (row) showRowPercentiles(row);
  });
  listen(percentilePopup, "pointerenter", () => clearTimeout(supportHideTimer));
  listen(percentilePopup, "pointerleave", () => {
    if (
      percentilePopup.hasAttribute("data-support-popover") &&
      !percentilePopup.contains(document.activeElement)
    )
      supportHideTimer = window.setTimeout(() => hidePercentiles(), 150);
  });
  listen(root, "focusin", (event) => {
    const row = closest(event, percentileTarget);
    if (row && !returningPopupFocus) {
      dismissedHover = false;
      showRowPercentiles(row);
    }
  });
  listen(root, "focusout", (event) => {
    const next =
      event.relatedTarget instanceof Node ? event.relatedTarget : null;
    if (percentilePopup.contains(next)) return;
    if (
      event.target instanceof Node &&
      percentilePopup.contains(event.target) &&
      next !== popupAnchor
    )
      hidePercentiles(true);
    else if (closest(event, percentileTarget)) hidePercentiles();
  });
  listen(document, "keydown", (event) => {
    if (event.key === "Escape") hidePercentiles(true);
    if (
      event.key === "Tab" &&
      !percentilePopup.hidden &&
      percentilePopup.hasAttribute("data-support-popover")
    ) {
      const links = Array.from(
        percentilePopup.querySelectorAll<HTMLAnchorElement>("a[href]"),
      );
      if (!event.shiftKey && event.target === popupAnchor && links[0]) {
        event.preventDefault();
        links[0].focus();
      } else if (
        event.shiftKey &&
        event.target === links[0] &&
        popupAnchor instanceof HTMLElement
      ) {
        event.preventDefault();
        popupAnchor.focus();
      }
    }
  });
  listen(window, "resize", () => {
    if (!percentilePopup.hidden && popupAnchor?.isConnected)
      placePercentiles(null, popupAnchor);
  });
  listen(
    window,
    "scroll",
    () => {
      if (
        popupAnchor?.isConnected &&
        (popupPinned || popupAnchor.matches(":hover, :focus-visible"))
      )
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
    $<HTMLButtonElement>("[data-play]").textContent = "Play";
    $<HTMLButtonElement>("[data-play]").disabled = false;
  }
  function renderScenarios() {
    const fixed = ["streaming", "startup"].includes(state.view),
      active = fixed ? "products" : state.workload,
      compare = state.chart === "compare";
    $('.fw-workload-tabs [data-chart="compare"]').hidden =
      state.view !== "rendering";
    $('.fw-workload-tabs [data-chart="compare"]').setAttribute(
      "aria-pressed",
      String(compare),
    );
    $$(".fw-workload-choice").forEach((choice) => {
      const button = required(
          choice.querySelector<HTMLButtonElement>("[data-workload]"),
        ),
        selected = !compare && button.dataset.workload === active;
      choice.hidden =
        state.view === "framework"
          ? !frameworkWorkloads().some((w) => w.id === button.dataset.workload)
          : button.dataset.workload === "catalog";
      const miniature = choice.querySelector<HTMLIFrameElement>("iframe");
      const src = `/previews/${state.view === "framework" && frameworkWorkloads().some((w) => w.id === button.dataset.workload) ? "framework-" : ""}${button.dataset.workload}.html`;
      if (miniature && miniature.getAttribute("src") !== src)
        miniature.src = src;
      choice.dataset.active = String(selected);
      button.setAttribute("aria-pressed", String(selected));
      button.disabled = fixed && button.dataset.workload !== "products";
    });
    if (!$(".fw-type-filters").childElementCount)
      $(".fw-type-filters").innerHTML =
        `<span>Tool type</span>${TOOL_GROUPS.map((g) => `<label><input type="checkbox" data-type="${g.id}"><span>${g.label}</span></label>`).join("")}`;
    $$<HTMLInputElement>("[data-type]").forEach((input) => {
      input.checked = state.types.includes(required(input.dataset.type));
    });
  }
  const drawComparison = (rows: ChartRow[]) => showChart(rows, "compare");
  const drawBars = (rows: ChartRow[]) => showChart(rows, "bars");
  const renderCatalog = () => {
    $("[data-catalog]").innerHTML = markup.catalog();
  };
  function drawLines(
    rows: ChartRow[],
    {
      target = $("[data-results]"),
      selectedMetric = metric(),
      height = 260,
      legend = true,
      chartLabel = null,
    }: {
      target?: HTMLElement;
      selectedMetric?: Metric;
      height?: number;
      legend?: boolean;
      chartLabel?: string | null;
    } = {},
  ) {
    const local = <T extends Element = HTMLElement>(selector: string) =>
      required(target.querySelector<T>(selector));
    const chart = markup.line(rows, {
      selectedMetric,
      height,
      legend,
      chartLabel,
      width: Math.max(250, Math.floor(target.getBoundingClientRect().width)),
    });
    target.innerHTML = chart.html;
    const { series, width, left, right, x, y, latencyCurve } = chart;
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
    const svg = local<SVGSVGElement>(".fw-chart"),
      guide = local("[data-guide]"),
      marks = local("[data-hover-marks]"),
      hit = local("[data-chart-hover-overlay]");
    let pinned = false;
    const move = (e: MouseEvent) => {
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
            ? data.rates[
                d3.bisector<number, number>((v) => v).center(data.rates, rawAt)
              ]
            : rawAt,
        px = x(at);
      guide.setAttribute("x1", String(px));
      guide.setAttribute("x2", String(px));
      guide.setAttribute("opacity", "1");
      const values = series.map((s) => {
        const i = d3
            .bisector<ChartPoint, number>((p) => p.x)
            .center(s.points, at),
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
            `data-chart-hover-marker fill="${required(renderer(v.id)).color}"`,
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
        series[0].points[
          d3
            .bisector<ChartPoint, number>((p) => p.x)
            .center(series[0].points, at)
        ].x;
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
              (["p50", "p95", "p99"] as const).map((percentile) => [
                percentile,
                required(stats).values[percentile] / 1000,
              ]),
            ) as Percentiles,
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
  function drawCompletionPanels(rows: ChartRow[]) {
    $("[data-results]").innerHTML =
      ["P50", "P99"]
        .map(
          (p) =>
            `<section class="fw-stream-panel" aria-label="Completion ${p}"><h3>Completion latency · ${p}</h3><div data-completion-panel="${p}"></div></section>`,
        )
        .join("") +
      `<div class="fw-legend">${rows.map((r) => `<button type="button" data-focus="${r.id}" aria-pressed="${state.focus === r.id}">${lineKey(r.id)}${logo(r.id)}${esc(name(r.id))}</button>`).join("")}</div>`;
    for (const p of ["P50", "P99"] as const)
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
  const drawTable = (rows: ChartRow[]) => showChart(rows, "table");
  function drawBalls(rows: ChartRow[]) {
    const chart = showChart(rows, "balls");
    flowRuntime = {
      ...required(chart.flow),
      lanes: $$("[data-flow-lane]").map((el) => ({
        duration: Number(el.dataset.duration),
        interval: Number(el.dataset.interval),
        packets: Array.from(
          el.querySelectorAll<SVGCircleElement>("[data-packet]"),
        ),
      })),
    };
    paintFlow(0);
    $("[data-heading]").textContent = chart.heading ?? "";
    $<HTMLButtonElement>("[data-play]").textContent = reduced()
      ? "Motion off"
      : state.flowPlaying
        ? "Pause"
        : "Play";
    $<HTMLButtonElement>("[data-play]").disabled = reduced();
    if (state.flowPlaying && !reduced()) startFlow();
  }
  function paintFlow(time: number) {
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
    const frame = (now: number) => {
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
      $<HTMLButtonElement>("[data-play]").textContent = "Play";
    } else {
      state.flowPlaying = true;
      $<HTMLButtonElement>("[data-play]").textContent = "Pause";
      startFlow();
    }
    save();
  }
  function render() {
    document.title = `${state.section === "ecosystem" ? "Ecosystem" : "Web framework benchmarks"} · Frameworks`;
    stop();
    model.normalizeState();
    $("[data-view=framework]").hidden = !data.framework;
    if (state.chart === "compare" && state.view !== "rendering")
      state.chart = "bars";
    root.dataset.compare = String(state.chart === "compare");
    const aggregate = ["waterfall", "utilization", "breakdown"].includes(
      metric(),
    );
    if (aggregate) state.chart = "bars";
    $$<HTMLButtonElement>("[data-chart]").forEach((b) => {
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
    const description = $("[data-experiment-description]");
    description.textContent = model.experimentDescription();
    description.hidden = !description.textContent;
    const validationNote = $("[data-validation-note]");
    const note = model.validationNote();
    validationNote.hidden = !note;
    validationNote.textContent = note;
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
    $$<HTMLButtonElement>("[data-chart]").forEach((b) => {
      b.setAttribute("aria-pressed", String(b.dataset.chart === state.chart));
    });
    $('[data-chart="balls"]').hidden = ["framework", "streaming"].includes(
      state.view,
    );
    $('[data-chart="table"]').hidden = state.view === "streaming";
    $(".fw-view-switch").hidden = state.view === "streaming";
    $<HTMLSelectElement>("[data-framework-view]").hidden =
      state.view !== "framework";
    $<HTMLSelectElement>("[data-framework-view]").value = state.framework;
    $<HTMLSelectElement>("[data-http-view]").hidden =
      state.view !== "http" || state.chart === "balls";
    $<HTMLSelectElement>("[data-http-view]").value = state.http;
    $<HTMLSelectElement>("[data-stream-view]").hidden =
      state.view !== "streaming" || state.chart === "balls";
    $<HTMLSelectElement>("[data-stream-view]").value =
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
    $<HTMLButtonElement>("[data-play]").hidden =
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
    if (
      state.focus &&
      !(state.chart === "compare" ? model.comparisonMeasurements() : rows).some(
        (row) => row.id === state.focus,
      )
    )
      state.focus = null;
    $("[data-heading]").textContent = model.heading();
    if (state.chart === "compare") drawComparison(rows);
    else if (!rows.length) {
      $("[data-results]").innerHTML =
        '<div class="fw-empty">No measurements for this selection.</div>';
      $("[data-chart-note]").textContent = "";
    } else if (
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
      uncaptured().some((r) => !data.framework.rows.some((v) => v.id === r.id))
    )
      $("[data-results]").insertAdjacentHTML(
        "beforeend",
        `<div class="fw-unmeasured-list"><h3>Outside this experiment</h3>${uncaptured()
          .filter((r) => !data.framework.rows.some((v) => v.id === r.id))
          .map(
            (r) =>
              `<div>${label(r.id)}<span>${markup.coverage(r)}</span></div>`,
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
    ).filter((r) => (r.errors ?? 0) > 0);
    if (errorRows.length)
      $("[data-chart-note]").textContent +=
        ` · Errors across ${state.view === "streaming" && state.chart === "lines" ? "all displayed load levels" : "selected phases"}: ${errorRows.map((r) => `${name(r.id)} ${fmt(r.errors ?? 0)}`).join("; ")}`;
    const s = data[state.view];
    $("[data-versions]").innerHTML = Object.entries(s.versions)
      .map(
        ([id, version]) =>
          `<dt>${esc(renderer(id)?.label || id)}</dt><dd>${esc(typeof version === "string" ? version : JSON.stringify(version))}</dd>`,
      )
      .join("");
    const cpuContext = $("[data-cpu-context]");
    if (cpuContext)
      cpuContext.hidden = !/^\d+$/.test(s.host?.serverCpuAffinity ?? "");
    $("[data-capture]").textContent =
      `${s.host?.cloud || s.host?.cpu_model || s.host?.cpuModel || "Recorded host"} · ${s.date}`;
    const missing = data.renderers.filter(
      (r) =>
        isVisible(r) &&
        !(
          state.chart === "compare" ? model.comparisonMeasurements() : all
        ).some((v) => v.id === r.id),
    );
    $("[data-coverage]").textContent = missing.length
      ? `${missing.length} roster entries not measured here`
      : "";
    $("[data-scope]").textContent = suites[state.view].scope;
    $("[data-method]").textContent = suites[state.view].method;
    const captureNote = $("[data-capture-note]");
    $("[data-review-note]").hidden = !s.reviewRefresh;
    captureNote.innerHTML = `<span data-capture-note-copy>${esc(model.captureNote())}</span>${s.reviewRefresh ? ' <a class="underline underline-offset-4" href="/data/proa-refresh/manifest.json" target="_blank" rel="noreferrer">Refresh evidence ↗</a>' : ""}`;
    captureNote.hidden = !captureNote.textContent;
    $("[data-source]").innerHTML =
      `<a href="${s.download}" download>${s.reviewRefresh ? "Review comparison" : "Original capture"} ↗</a> · <a href="${s.reviewRefresh ? "/data/proa-refresh/manifest.json" : `https://github.com/Proa-Labs/framework-benchmarks/blob/main/${s.source}`}" target="_blank" rel="noreferrer">View source ↗</a><br><span class="fw-source-hash">${s.sourceSnapshot ? `<a href="${s.sourceSnapshot}" download>Captured source snapshot ↗</a><br>` : ""}${s.reviewRefresh ? "Proa source SHA-256" : "Source SHA-256"} ${esc(s.hash)} · Artifact SHA-256 ${esc(s.artifactSha256)}</span>${s.note ? `<br>${esc(s.note)}` : ""}`;
    $$<HTMLInputElement>("[data-engine]").forEach((el) => {
      (el as HTMLInputElement).checked = state.selected.includes(
        required(el.dataset.engine),
      );
    });
    const exportRows: ExportRow[] =
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
                    exportValue:
                      row[
                        key as
                          | "throughput"
                          | "completeP50"
                          | "completeP99"
                          | "shellP50"
                      ],
                    exportSamples: row.seriesSamples[key as Metric],
                  })),
                ),
            )
          : state.chart === "compare"
            ? model.comparisonMeasurements()
            : rows;
    const exportData = {
      reviewRefresh: s.reviewRefresh,
      measurementStatus:
        metric() === "breakdown" ? "not instrumented" : "measured",
      experiment: state.view,
      captures:
        state.chart === "compare"
          ? {
              rendering: {
                source: data.rendering.source,
                hash: data.rendering.hash,
                capturedAt: data.rendering.capturedAt,
              },
            }
          : undefined,
      toolTypes: state.types,
      unmeasured: (state.view === "rendering"
        ? uncaptured()
        : data.renderers.filter(
            (r) => isVisible(r) && !all.some((v) => v.id === r.id),
          )
      ).map((r) => ({
        id: r.id,
        ...(state.view === "rendering"
          ? {
              workloads: model.orderedWorkloads().map((w) => ({
                workload: w.id,
                ...model.renderingCoverage(r.id, w.id),
              })),
            }
          : {}),
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
      unit: state.chart === "compare" ? "per row" : unit(),
      capturedAt: s.capturedAt,
      source: s.source,
      hash: s.hash,
      method: suites[state.view].method,
      scope: suites[state.view].scope,
      rows: exportRows.map((r) => ({
        id: r.id,
        workload: r.workload ?? state.workload,
        suite: r.suite ?? state.view,
        unit: r.unit ?? unit(),
        capturedAt: r.capturedAt ?? s.capturedAt,
        captureId: "captureId" in r ? r.captureId : undefined,
        source: r.source ?? suites[state.view].path,
        metric: r.exportMetric || metric(),
        rate: r.rate ?? (state.view === "streaming" ? state.rate : null),
        value: r.exportValue ?? value(r),
        samples: r.exportSamples ?? samples(r),
        detail: r.detail,
        fixture: "fixture" in r ? r.fixture : undefined,
        adaptation: "adaptation" in r ? r.adaptation : undefined,
        errors: r.errors ?? null,
        latencyPercentiles:
          r.latency ?? latencyStats(r, { rate: r.rate ?? null }),
        ...(state.chart === "balls" && "flow" in r && r.flow
          ? { pairedFlowMeasurement: r.flow }
          : {}),
      })),
    };
    $<HTMLAnchorElement>("[data-json]").href =
      `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(exportData, null, 2))}`;
    const cell = (v: unknown) => `"${String(v).replace(/"/g, '""')}"`;
    $<HTMLAnchorElement>("[data-csv]").href =
      `data:text/csv;charset=utf-8,${encodeURIComponent(
        [
          [
            "renderer",
            "suite",
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
            "fixture",
            "fixture_notes_url",
            "review_refresh",
          ],
          ...exportRows.map((r) => {
            const latency =
              r.latency ?? latencyStats(r, { rate: r.rate ?? null });
            return [
              name(r.id),
              r.suite ?? state.view,
              r.exportValue ?? value(r),
              r.unit ?? unit(),
              r.exportMetric || metric(),
              r.workload ?? state.workload,
              r.rate ?? (state.view === "streaming" ? state.rate : ""),
              r.capturedAt ?? s.capturedAt,
              latency?.values.p50 ?? "",
              latency?.values.p95 ?? "",
              latency?.values.p99 ?? "",
              latency?.unit ?? "",
              r.errors ?? "",
              "fixture" in r ? r.fixture : "",
              "adaptation" in r ? (r.adaptation?.details ?? "") : "",
              s.reviewRefresh?.note ?? "",
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
  const infoFocusTarget = $("#experiment-rendering");
  const infoPopup = $("#rendering-info");
  let infoHovered = false,
    infoFocused = false,
    infoHideTimer: ReturnType<typeof setTimeout> | undefined;
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
    listen(element, "pointerenter", () => {
      infoHovered = true;
      showInfo();
    });
    listen(element, "pointerleave", () => {
      infoHovered = false;
      hideInfoSoon();
    });
  }
  listen(infoFocusTarget, "focus", () => {
    infoFocused = infoFocusTarget.matches(":focus-visible");
    if (infoFocused) showInfo();
  });
  listen(infoFocusTarget, "blur", () => {
    infoFocused = false;
    hideInfoSoon();
  });
  listen(document, "keydown", (event) => {
    if (event.key === "Escape" && infoPopup.matches(":popover-open"))
      infoPopup.hidePopover();
  });
  listen(root, "click", (e) => {
    const sectionLink = closest(e, "a[data-section]");
    if (sectionLink) {
      // Preserve live D3 selections, which may be newer than React's route
      // snapshot. Keep real hrefs for no-JS, modified-click and new-tab use.
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
        return;
      e.preventDefault();
      state.section = required(sectionLink.dataset.section);
      render();
      save();
      return;
    }
    const el = closest(e, "button");
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
      const w = [...data.workloads, ...frameworkWorkloads()].find(
        (w) => w.id === el.dataset.preview,
      );
      $("#fixture-title").textContent = required(w).label;
      $<HTMLIFrameElement>("[data-fixture-frame]").src =
        `previews/${state.view === "framework" ? "framework-" : ""}${required(w).id}.html`;
      $<HTMLAnchorElement>("[data-preview-link]").href =
        `previews/${state.view === "framework" ? "framework-" : ""}${required(w).id}.html`;
      $<HTMLDialogElement>(".fw-fixture-dialog").showModal();
      return;
    }
    if (el.hasAttribute("data-close-preview")) {
      $<HTMLDialogElement>(".fw-fixture-dialog").close();
      return;
    }
    if (el.hasAttribute("data-play")) {
      play();
      return;
    }
    if (el.dataset.section) state.section = el.dataset.section;
    else if (el.dataset.view) {
      switchView(el.dataset.view as View);
    } else if (el.dataset.chart) {
      state.chart = el.dataset.chart as ChartMode;
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
          required(button.closest("tr")).classList.toggle(
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
  listen(root, "change", (e) => {
    const el = e.target;
    if (!(el instanceof HTMLInputElement || el instanceof HTMLSelectElement))
      return;
    if (el.dataset.type)
      state.types = (el as HTMLInputElement).checked
        ? [...new Set([...state.types, el.dataset.type])]
        : state.types.filter((id) => id !== el.dataset.type);
    else if (el.hasAttribute("data-framework-view"))
      state.framework = el.value as Metric;
    else if (el.hasAttribute("data-http-view")) state.http = el.value as Metric;
    else if (el.hasAttribute("data-stream-view"))
      state.stream = el.value as Metric | "completion";
    else if (el.dataset.engine)
      state.selected = (el as HTMLInputElement).checked
        ? [...new Set([...state.selected, el.dataset.engine])]
        : state.selected.filter((id) => id !== required(el.dataset.engine));
    else return;
    state.focus = null;
    render();
    save();
  });
  listen(root, "click", (event) => {
    const row = closest(event, percentileTarget);
    if (row) {
      if (row.isConnected) {
        dismissedHover = false;
        popupPinned = true;
        showRowPercentiles(row);
      }
    }
  });
  listen(document, "pointerdown", (event) => {
    if (
      !closest(
        event,
        ".fw-row,.fw-comparison,.fw-chart,[data-percentile-popup]",
      )
    )
      hidePercentiles(true);
  });
  listen(document, "visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(flowFrame);
      playing = false;
    } else if (state.flowPlaying && flowRuntime) startFlow();
  });
  listen($(".fw-lab-nav"), "keydown", (event) => {
    const tabs = $$("[data-view]").filter((tab) => !tab.hidden);
    const index = tabs.indexOf(event.target as HTMLElement);
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
  listen(window, "popstate", () => {
    currentSearch = location.search;
    rememberView();
    restore();
    render();
  });
  render();
  const observer = globalThis.ResizeObserver
    ? new ResizeObserver((entries) => {
        const w = Math.floor(entries[0].contentRect.width);
        if (w !== lastWidth) {
          lastWidth = w;
          if (state.chart === "lines" && state.section === "performance")
            render();
        }
      })
    : null;
  observer?.observe(root);
  const dispose = () => {
    lifecycle.abort();
    stop();
    clearTimeout(infoHideTimer);
    observer?.disconnect();
  };
  dispose.setLocation = (search: string) => {
    if (search === currentSearch) return;
    currentSearch = search;
    rememberView();
    model.restore(search);
    render();
  };
  return dispose;
}
