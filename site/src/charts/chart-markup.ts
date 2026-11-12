import type {
  ChartMode,
  ChartRow,
  HttpRow,
  Metric,
  Renderer,
} from "../../benchmark-types.ts";
import { required } from "../../required.ts";
import type { DashboardModel } from "./dashboard-model.ts";
export interface ChartOutput {
  html: string;
  note: string;
  heading?: string;
  flow?: { paired: boolean; clock: number; group: number };
}
interface LineOptions {
  width?: number;
  selectedMetric?: Metric;
  height?: number;
  legend?: boolean;
  chartLabel?: string | null;
}
export interface ChartPoint {
  x: number;
  y: number;
}
const getFlow = (row: ChartRow) => {
  if (!("flow" in row) || !row.flow)
    throw new Error(`No measured flow for ${row.id}`);
  return row.flow;
};

import { bisector, extent } from "d3-array";
import { scaleLinear } from "d3-scale";
import { line } from "d3-shape";

const d3 = { extent, bisector, scaleLinear, line };
export function createChartMarkup(model: DashboardModel) {
  const {
    data,
    state,
    esc,
    fmt,
    pctFmt,
    orderedWorkloads,
    renderer,
    name,
    logo,
    label,
    isVisible,
    suites,
    metric,
    samples,
    value,
    unit,
    summary,
    uncaptured,
    latencyStats,
    heading,
  } = model;
  let output: ChartOutput = { html: "", note: "" };
  function coverage(r: Renderer) {
    const links = model.measurementLinks(r.id);
    return links.length
      ? `Renderer-only timing not recorded. View ${links.map((link) => `<a href="${esc(link.href)}">${esc(link.label)} results ↗</a>`).join(" · ")}`
      : `${esc(r.coverageReason || "Renderer-only timing not recorded.")} <a href="${esc(r.coverageSource || r.homepage)}" target="_blank" rel="noreferrer">Details ↗</a>`;
  }
  function drawComparison(rows: ChartRow[]) {
    const workloads = orderedWorkloads(),
      scales = Object.fromEntries(
        workloads.map((w) => {
          const values = data.rendering.rows[w.id]
              .filter((r) => isVisible(r))
              .map((r) => r.p50),
            max = Math.max(...values, 1) * 1.04;
          return [w.id, (v: number) => (100 * v) / max];
        }),
      );
    output.html = `<table class="fw-comparison"><caption class="sr-only">SSR render latency in microseconds across workloads. Select a column heading to sort.</caption><thead><tr><th scope="col">Renderer</th>${workloads.map((w) => `<th scope="col" aria-sort="${state.workload === w.id ? "ascending" : "none"}"><button type="button" data-sort-workload="${w.id}" title="Sort by ${esc(w.label)}">${esc(w.label)}${state.workload === w.id ? " ↓" : ""}<small>µs</small></button></th>`).join("")}</tr></thead><tbody>${rows
      .map(
        (r) =>
          `<tr style="--brand:${required(renderer(r.id)).color}" class="${state.focus === r.id ? "fw-comparison-focused" : ""}"><th scope="row"><button type="button" data-focus="${r.id}" aria-pressed="${state.focus === r.id}">${label(r.id)}</button></th>${workloads
            .map((w) => {
              const cell = data.rendering.rows[w.id].find((v) => v.id === r.id);
              return cell
                ? `<td class="fw-comparison-cell"><button type="button" data-focus="${r.id}" data-stat-workload="${w.id}" aria-pressed="${state.focus === r.id}" aria-label="${esc(name(r.id))}, ${esc(w.label)}, ${fmt(cell.p50)} µs"><span class="fw-comparison-value">${fmt(cell.p50)}</span><span class="fw-comparison-track" aria-hidden="true"><span style="width:${scales[w.id](cell.p50)}%"></span></span></button></td>`
                : "<td>—</td>";
            })
            .join("")}</tr>`,
      )
      .join("")}${uncaptured()
      .map(
        (r) =>
          `<tr class="fw-uncaptured"><th scope="row">${label(r.id)}<small>${model.measurementLinks(r.id).length ? "Measured separately" : "Not measured here"}</small></th><td colspan="3">${coverage(r)}</td></tr>`,
      )
      .join("")}</tbody></table>`;
    output.note =
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
    output.html = groups
      .map(
        ([group, kinds]) =>
          `<div class="fw-catalog-group">${group}</div>${(
            data.ecosystem || data.renderers
          )
            .filter((r) => (kinds as string[]).includes(r.kind))
            .map(
              (r) =>
                `<div class="fw-catalog-row">${label(r.id)}<small>${esc(r.kind)}${
                  r.status === "feature-only"
                    ? '<br><span class="fw-coverage-status">Features reviewed · not benchmarked</span>'
                    : r.status === "unmeasured"
                      ? `<br><span class="fw-coverage-status">${
                          model.measurementLinks(r.id).length
                            ? `Measured in ${model
                                .measurementLinks(r.id)
                                .map((l) => l.label)
                                .join(" / ")}`
                            : "Not measured"
                        }</span>`
                      : ""
                }</small><small>${esc(r.language)}</small><a href="${esc(r.homepage)}" target="_blank" rel="noreferrer" aria-label="${esc(r.label)} project website">Project ↗</a></div>`,
            )
            .join("")}`,
      )
      .join("");
  }
  function rowButton(r: ChartRow, inside: string, number: string, extra = "") {
    return `<button type="button" class="fw-row cursor-interaction ${extra}" style="--brand:${required(renderer(r.id)).color}" data-focus="${r.id}" aria-pressed="${state.focus === r.id}" aria-label="${esc(name(r.id))}, ${esc(number)} ${unit()}${r.errors ? `, ${r.errors} errors` : ""}">${label(r.id)}${inside}<span class="fw-number">${number}<small class="fw-value-unit">${unit() === "responses/s" ? "req/s" : unit() === "% of one core" ? "%" : unit()}</small></span></button>`;
  }
  function drawBars(rows: ChartRow[]) {
    const u = unit(),
      allValues = rows
        .flatMap((r) => [value(r), ...samples(r)])
        .filter((v) => Number.isFinite(v) && v > 0),
      high = Math.max(...allValues, 1) * 1.04;
    const x = (v: number) => (100 * v) / high;
    const note =
      state.view === "rendering"
        ? "Bar: median render time · box: five process medians · whiskers: min–max"
        : state.view === "startup"
          ? "Bar: median cold start · box: middle 50% of 15 starts · whiskers: min–max"
          : "Bar: median · box: middle 50% of three runs · whiskers: min–max";
    if (metric() === "breakdown") {
      output.html =
        '<div class="fw-empty"><h3>Attribution needs a traced workload.</h3><p style="margin-top:8px">Database: excluded · framework / runtime / OS: not separated</p><p class="fw-muted" style="margin-top:14px">Next capture: instrument DB wait, DB CPU, render CPU, and server overhead separately.</p></div>';
      output.note =
        "No database workload or profiling spans were collected. Aggregate process CPU cannot identify framework CPU cycles.";
      return;
    }
    if (["waterfall", "utilization"].includes(metric())) {
      drawHttp(rows);
      return;
    }
    output.html = `${rows
      .map((r) => {
        const box = summary(samples(r)),
          v = value(r);
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
    output.note = note;
  }
  function drawHttp(rows: ChartRow[]) {
    const cpu = metric() === "utilization",
      max = cpu
        ? Math.max(100, ...rows.map((r) => r.cpuPercent ?? 0))
        : Math.max(
            ...rows.map((r) => required((r as HttpRow).waterfall).complete),
          ) * 1.05;
    output.html = `<div class="fw-stage-legend">${cpu ? '<span><i class="fw-before"></i>Process CPU</span><span>Reference: 100% = one core</span>' : '<span><i class="fw-before"></i>Request → first byte</span><span><i class="fw-body"></i>First byte → body end</span>'}</div>${rows
      .map((r) => {
        const w = required((r as HttpRow).waterfall);
        return rowButton(
          r,
          `<span class="fw-stack" ><span class="fw-before" style="width:${(100 * (cpu ? (r.cpuPercent ?? 0) : w.firstByte)) / max}%"></span>${cpu ? `<span style="position:absolute;left:${10000 / max}%;top:-3px;height:20px;width:1px;background:var(--fw-fg);opacity:.4"></span>` : `<span class="fw-body" style="width:${(100 * (w.complete - w.firstByte)) / max}%"></span>`}</span>`,
          fmt(cpu ? (r.cpuPercent ?? 0) : w.complete),
        );
      })
      .join("")}`;
    output.note = cpu
      ? "Process CPU / wall time at capacity · three-run median · totals may exceed one core. No DB attribution."
      : "Aggregate response waterfall · mean stages from one representative equal-load run per renderer. Request tracing and database spans were not captured.";
  }
  const lineDash = (id: string) =>
    state.view === "streaming"
      ? ({ proa: "", marko: "7 4", react: "2 4" } as Record<string, string>)[
          id
        ] || ""
      : "";
  const pointMarker = (
    id: string,
    x: number,
    y: number,
    size = 3,
    attributes = "",
  ) => {
    const shape =
      state.view === "streaming"
        ? (
            { proa: "circle", marko: "triangle", react: "square" } as Record<
              string,
              string
            >
          )[id] || "circle"
        : "circle";
    const body =
      shape === "triangle"
        ? `<polygon points="0,${-size * 1.3} ${size * 1.2},${size} ${-size * 1.2},${size}"/>`
        : shape === "square"
          ? `<rect x="${-size}" y="${-size}" width="${size * 2}" height="${size * 2}"/>`
          : `<circle r="${size}"/>`;
    return `<g class="fw-point" data-marker="${shape}" transform="translate(${x} ${y})" ${attributes}>${body}</g>`;
  };
  const lineKey = (id: string) =>
    state.view === "streaming"
      ? `<svg width="24" height="12" viewBox="0 0 24 12" aria-hidden="true"><path d="M0 6h24" stroke="currentColor" stroke-width="1.6" stroke-dasharray="${lineDash(id)}"/>${pointMarker(id, 12, 6, 3, 'fill="currentColor"')}</svg>`
      : "";
  function lineSeries(rows: ChartRow[], selectedMetric = metric()) {
    if (state.view === "streaming")
      return rows.map((r) => ({
        id: r.id,
        points: data.rates.map((rate) => ({
          x: rate,
          y:
            required(
              data.streaming.rows[String(rate)].find((v) => v.id === r.id),
            )[
              selectedMetric as
                | "completeP50"
                | "completeP99"
                | "shellP50"
                | "throughput"
            ] ?? 0,
        })),
      }));
    return rows.map((r) => ({
      id: r.id,
      points: samples(r).map((y, i) => ({ x: i + 1, y })),
    }));
  }
  function lineMarkup(
    rows: ChartRow[],
    {
      width = 720,
      selectedMetric = metric(),
      height = 260,
      legend = true,
      chartLabel = null,
    }: LineOptions = {},
  ) {
    const series = lineSeries(rows, selectedMetric).filter(
        (s) => s.points.length,
      ),
      active = state.focus || null,
      left = 67,
      right = state.view === "streaming" ? 66 : 15,
      top = 15,
      bottom = 45;
    const points = series.flatMap((s) => s.points),
      extX = d3.extent(points, (p) => p.x) as [number, number],
      extY = d3.extent(points, (p) => p.y) as [number, number];
    const x = d3
      .scaleLinear()
      .domain(extX[0] === extX[1] ? [0, extX[1] + 1] : extX)
      .range([left + 4, width - right - 4]);
    const y = d3
      .scaleLinear()
      .domain([0, Math.max(extY[1] * 1.12, 1)])
      .range([height - bottom - 4, top + 4]);
    const line = d3
      .line<ChartPoint>()
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
    const f = (v: number) => (v >= 1000 ? `${fmt(v / 1000)}k` : fmt(v));
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
        point: required(s.points.at(-1)),
        labelY: y(required(s.points.at(-1)).y),
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
    const seriesLabel = (id: string) => {
      const label = endLabels.find((label) => label.id === id);
      if (!label) return "";
      return `<path class="fw-label-connector" d="M${x(label.point.x) + 5} ${y(label.point.y)} L${width - right + 4} ${label.labelY}" fill="none" stroke-width=".8"/><text class="fw-line-label" x="${width - right + 8}" y="${label.labelY}" dominant-baseline="middle">${esc(name(id))}</text>`;
    };
    const html = `<svg class="fw-chart" role="img" aria-label="${state.view === "streaming" ? chartLabel || "Streaming response versus offered load" : "Independent run measurements"}" viewBox="0 0 ${width} ${height}"><title>${esc(chartLabel || suites[state.view].title)} · ${latencyCurve ? "seconds" : unit()}</title><rect data-chart-frame x="${left}" y="${top}" width="${width - left - right}" height="${height - top - bottom}" fill="none" stroke="var(--fw-border)"/>${yTicks.map((v) => `<line x1="${left}" x2="${width - right}" y1="${y(v)}" y2="${y(v)}" stroke="var(--fw-line)"/><text x="${left - 9}" y="${y(v) + 4}" text-anchor="end">${latencyCurve ? `${fmt(v / 1000)} s` : f(v)}</text>`).join("")}${xTicks.map((v) => `<text x="${x(v)}" y="${height - bottom + 20}" text-anchor="middle">${f(v)}</text>`).join("")}<text class="axis-title" data-axis="y" x="${left}" y="11">${yAxisTitle}</text><text class="axis-title" data-axis="x" x="${(left + width - right) / 2}" y="${height - 3}" text-anchor="middle">${state.view === "streaming" ? "Offered load (requests/s)" : `Independent ${state.view === "startup" ? "start" : "process run"} · index`}</text>${series
      .map(
        (s) =>
          `<g data-series="${s.id}" class="fw-series ${s.id === active ? "active" : ""}" style="--series:${required(renderer(s.id)).color};opacity:${active && active !== s.id ? 0.2 : 1}"><path d="${line(s.points)}" stroke-dasharray="${lineDash(s.id)}" fill="none" stroke-width="${s.id === active ? 2 : 1.3}"/>${s.points.map((p) => pointMarker(s.id, x(p.x), y(p.y))).join("")}${seriesLabel(s.id)}</g>`,
      )
      .join(
        "",
      )}<line data-guide x1="${left}" x2="${left}" y1="${top}" y2="${height - bottom}" stroke="#afb9c7" opacity="0"/><g data-hover-marks></g><rect data-chart-hit data-chart-hover-overlay="cross-series" x="${left}" y="${top}" width="${width - left - right}" height="${height - top - bottom}" fill="transparent"/></svg>${legend ? `<div class="fw-legend">${series.map((s) => `<button type="button" class="cursor-interaction" data-focus="${s.id}" aria-pressed="${active === s.id}">${lineKey(s.id)}${logo(s.id)}${esc(name(s.id))}</button>`).join("")}</div>` : ""}<div class="fw-line-tip" aria-live="off">Hover to compare the same x-position.</div>`;
    const note =
      state.view === "streaming"
        ? selectedMetric === "throughput"
          ? `Successful full responses completed inside each ${data.streaming.methodology.durationSecondsPerRate}-second observation window · three-run medians. Responses finishing later are excluded.`
          : "Measured load curve · three-phase medians at each rate · scheduled-arrival latency includes queueing."
        : "Measured runs in capture order · connected for comparison, not a continuous telemetry stream.";
    return {
      html,
      note,
      series,
      width,
      height,
      left,
      right,
      top,
      bottom,
      x,
      y,
      latencyCurve,
      selectedMetric,
      active,
    };
  }
  function drawLines(rows: ChartRow[], options: LineOptions = {}) {
    const chart = lineMarkup(rows, options);
    output.html = chart.html;
    output.note = chart.note;
    return chart;
  }
  function drawTable(rows: ChartRow[]) {
    const stats = rows.map((r) => ({ r, stats: latencyStats(r) }));
    const latencyUnit = stats.find((v) => v.stats)?.stats?.unit || "ms";
    output.html = `<div class="fw-table-scroll"><table class="fw-data-table"><caption class="sr-only">${esc(suites[state.view].title)} · ${esc(unit())}</caption><thead><tr><th scope="col">Renderer</th><th scope="col">${esc(metric() === "p50" ? "Median" : metric())} (${esc(unit())})</th><th scope="col">Latency P50 (${latencyUnit})</th><th scope="col">P95 (${latencyUnit})</th><th scope="col">P99 (${latencyUnit})</th><th scope="col">Errors</th></tr></thead><tbody>${stats.map(({ r, stats }) => `<tr><th scope="row">${label(r.id)}</th><td>${pctFmt(value(r))}</td><td>${pctFmt(stats?.values?.p50)}</td><td>${pctFmt(stats?.values?.p95)}</td><td>${pctFmt(stats?.values?.p99)}</td><td>${r.errors === undefined ? "—" : fmt(r.errors)}</td></tr>`).join("")}</tbody></table></div>`;
    output.note =
      "Absolute measurements from the selected capture. Latency percentiles describe the scope shown in Method & data; errors remain visible.";
  }
  function drawBalls(rows: ChartRow[]) {
    const paired = state.view === "http" || state.view === "streaming";
    const entries = rows.map((r) => ({
      row: r,
      latency: paired
        ? getFlow(r).meanMs
        : (r.p50 ?? 0) / (state.view === "rendering" ? 1000 : 1),
      rps: paired ? getFlow(r).rps : 0,
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
    output.html =
      header +
      entries
        .map((e) => {
          const r = e.row,
            duration = e.latency * clock,
            interval = paired ? (1000 * clock * group) / e.rps : duration,
            count = Math.ceil(duration / interval) + 1;
          const durationText =
            state.view === "rendering"
              ? `${fmt(r.p50 ?? 0)} µs`
              : `${fmt(e.latency)} ms`;
          const tip = paired
            ? `${name(r.id)}: ${fmt(e.rps)} successful responses/s; ${fmt(e.latency)} ms mean latency; representative repeat ${getFlow(r).repeat ?? "not recorded"}. ${state.view === "http" ? "64 closed-loop connections." : "Scheduled-arrival latency includes queueing; only successful responses are shown."}`
            : `${name(r.id)}: ${durationText}. Sequential timing illustration; no measured request rate.`;
          return `<button type="button" class="fw-row fw-flow-row cursor-interaction" style="--brand:${required(renderer(r.id)).color}" data-focus="${r.id}" aria-pressed="${state.focus === r.id}" aria-label="${esc(tip)}">${label(r.id)}<svg class="fw-pipe" height="48" width="100%" role="img" aria-label="${esc(tip)}" data-flow-lane="${r.id}" data-duration="${duration}" data-interval="${interval}" ><title>${esc(tip)}</title><rect class="fw-pipe-bed" x="1%" y="17" width="98%" height="14" rx="7"/><line class="fw-pipe-port" x1="3%" x2="3%" y1="12" y2="36"/><line class="fw-pipe-port" x1="97%" x2="97%" y1="12" y2="36"/>${Array.from({ length: count }, (_, i) => `<circle class="fw-packet" data-packet="${i}" cx="4%" cy="24" r="3.5"/>`).join("")}</svg><span class="fw-flow-value">${paired ? `<span>${fmt(e.rps)}<small> /s</small></span><small>${durationText}</small>` : `<span>${durationText}</span>`}</span></button>`;
        })
        .join("");
    output.flow = { paired, clock, group };
    output.heading = paired
      ? "Requests in motion"
      : state.view === "startup"
        ? "Spawn → first response"
        : "Data → HTML";
    output.note = paired
      ? `Aggregate-data illustration · ● = ${fmt(group)} responses · shared clock slowed ${fmt(clock)}× · pipe width fixed`
      : "Timing illustration · one ball per job · shared clock · throughput and bandwidth not measured";
  }

  function drawCompletionPanels(rows: ChartRow[], width: number) {
    output.html = `${(["P50", "P99"] as const).map((p) => `<section class="fw-stream-panel" aria-label="Completion ${p}"><h3>Completion latency · ${p}</h3><div data-completion-panel="${p}">${lineMarkup(rows, { width, selectedMetric: `complete${p}`, height: 215, legend: false, chartLabel: `Completion latency ${p} versus offered load` }).html}</div></section>`).join("")}<div class="fw-legend">${rows.map((r) => `<button type="button" data-focus="${r.id}" aria-pressed="${state.focus === r.id}">${lineKey(r.id)}${logo(r.id)}${esc(name(r.id))}</button>`).join("")}</div>`;
    output.note =
      "P50 and P99 across all measured load levels. Each chart uses its own latency range; offered load is aligned. Points show three-phase medians; hover snaps to measured loads.";
  }
  function draw(rows: ChartRow[], mode: ChartMode = state.chart, width = 720) {
    output = { html: "", note: "", heading: heading() };
    if (!rows.length)
      output.html =
        '<div class="fw-empty">No measurements for this selection.</div>';
    else if (mode === "compare") drawComparison(rows);
    else if (
      mode === "lines" &&
      state.view === "streaming" &&
      state.stream === "completion"
    )
      drawCompletionPanels(rows, width);
    else if (mode === "lines") drawLines(rows, { width });
    else if (mode === "table") drawTable(rows);
    else if (mode === "balls") drawBalls(rows);
    else drawBars(rows);
    return output;
  }
  return {
    draw,
    line: lineMarkup,
    lineKey,
    pointMarker,
    coverage,
    catalog: () => {
      output = { html: "", note: "" };
      renderCatalog();
      return output.html;
    },
  };
}
