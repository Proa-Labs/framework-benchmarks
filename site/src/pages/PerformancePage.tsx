import { Link, useLocation } from "@tanstack/react-router";
import { Fragment, useLayoutEffect, useMemo, useRef } from "react";
import benchmarkData from "../../.generated/results.json";
import type { BenchmarkData } from "../../benchmark-types.ts";
import { required } from "../../required.ts";
import { createChartMarkup } from "../charts/chart-markup.ts";
import { mountDashboard } from "../charts/dashboard-controller.ts";
import type { DashboardModel } from "../charts/dashboard-model.ts";
import { createDashboardModel } from "../charts/dashboard-model.ts";
import {
  ChartMarkup,
  ToolTypes,
  WorkloadChoices,
} from "../charts/InitialDashboard.tsx";
import { Footer } from "../components/Footer.tsx";
import { Header } from "../components/Header.tsx";
export function PerformancePage({
  data = benchmarkData as BenchmarkData,
}: {
  data?: BenchmarkData;
}) {
  const location = useLocation();
  // Hydrate the initial server snapshot once. D3 owns later updates inside
  // this boundary; React must not replace its live SVG nodes on URL changes.
  const snapshot = useRef<DashboardModel | null>(null);
  if (snapshot.current?.data !== data)
    snapshot.current = createDashboardModel(data, location.searchStr);
  const model = snapshot.current;
  const { state } = model;
  const initialChart = useMemo(
    () => createChartMarkup(model).draw(model.visibleRows()),
    [model],
  );
  const capture = data[state.view];
  const validationNote = model.validationNote();
  const captureNote = model.captureNote();
  const experimentDescription = model.experimentDescription();
  const root = useRef<HTMLElement>(null);
  const controller = useRef<ReturnType<typeof mountDashboard> | null>(null);
  useLayoutEffect(() => {
    const dispose = mountDashboard(required(root.current), data);
    controller.current = dispose;
    required(root.current).dataset.appReady = "true";
    return dispose;
  }, [data]);
  useLayoutEffect(() => {
    controller.current?.setLocation(location.searchStr);
  }, [location.searchStr]);
  return (
    <section
      ref={root}
      id="frameworks-explorer"
      data-app-ready="false"
      data-compare={state.chart === "compare"}
      aria-label="Framework performance research dashboard"
    >
      <Header active={state.section} interactive />
      <section className="fw-intro" aria-labelledby="site-title">
        <h1 id="site-title">
          {state.section === "ecosystem"
            ? "The ecosystem"
            : "Web framework benchmarks"}
        </h1>
      </section>

      <main data-performance="" hidden={state.section !== "performance"}>
        <div
          className="fw-lab-nav"
          aria-label="Performance experiment"
          role="tablist"
        >
          <div className="fw-experiment-tab" role="presentation">
            <button
              type="button"
              className="cursor-interaction"
              role="tab"
              id="experiment-rendering"
              aria-controls="experiment-panel"
              aria-selected={state.view === "rendering"}
              data-view="rendering"
              aria-describedby="rendering-info"
              aria-current={state.view === "rendering" ? "page" : undefined}
            >
              SSR Rendering
              <span className="fw-experiment-info" aria-hidden="true">
                <svg
                  viewBox="0 0 20 20"
                  width="15"
                  height="15"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden="true"
                >
                  <circle cx="10" cy="10" r="7.5"></circle>
                  <path d="M10 9v5"></path>
                  <circle
                    cx="10"
                    cy="6"
                    r=".5"
                    fill="currentColor"
                    stroke="none"
                  ></circle>
                </svg>
              </span>
            </button>
          </div>
          <button
            type="button"
            className="cursor-interaction"
            role="tab"
            id="experiment-framework"
            aria-controls="experiment-panel"
            aria-selected={state.view === "framework"}
            aria-current={state.view === "framework" ? "page" : undefined}
            data-view="framework"
            hidden={!data.framework}
          >
            Framework SSR
          </button>
          <button
            type="button"
            className="cursor-interaction"
            role="tab"
            id="experiment-http"
            aria-controls="experiment-panel"
            aria-selected={state.view === "http"}
            aria-current={state.view === "http" ? "page" : undefined}
            data-view="http"
          >
            HTTP
          </button>
          <button
            type="button"
            className="cursor-interaction"
            role="tab"
            id="experiment-streaming"
            aria-controls="experiment-panel"
            aria-selected={state.view === "streaming"}
            aria-current={state.view === "streaming" ? "page" : undefined}
            data-view="streaming"
          >
            Streaming
          </button>
          <button
            type="button"
            className="cursor-interaction"
            role="tab"
            id="experiment-startup"
            aria-controls="experiment-panel"
            aria-selected={state.view === "startup"}
            aria-current={state.view === "startup" ? "page" : undefined}
            data-view="startup"
          >
            Cold Start
          </button>
        </div>
        <div
          className="fw-experiment-layout"
          id="experiment-panel"
          role="tabpanel"
          aria-labelledby={`experiment-${state.view}`}
        >
          <aside className="fw-scenarios" aria-label="Workloads">
            <h2 className="fw-sidebar-label">Workloads</h2>
            <fieldset
              className="fw-workload-tabs"
              aria-label="Choose workloads"
            >
              <WorkloadChoices model={model} />
            </fieldset>
            <fieldset className="fw-type-filters" aria-label="Tool types">
              <ToolTypes model={model} />
            </fieldset>
          </aside>
          <section
            className="fw-results-area"
            id="results-heading"
            tabIndex={-1}
            aria-label="Benchmark results"
          >
            <div
              className="fw-main-heading"
              data-results-title=""
              hidden={state.view === "rendering"}
            >
              <div>
                <h2 data-heading="">{model.heading()}</h2>
              </div>
            </div>
            <p
              className="mb-4 text-xs leading-relaxed text-muted"
              data-experiment-description
              hidden={!experimentDescription}
            >
              {experimentDescription}
            </p>
            <p
              className="fw-validation-note"
              data-validation-note
              role="status"
              hidden={!validationNote}
            >
              {validationNote}
            </p>
            <div className="fw-toolbar">
              <fieldset
                className="fw-view-switch"
                aria-label="Chart view"
                hidden={state.view === "streaming"}
              >
                <button
                  type="button"
                  className="cursor-interaction"
                  data-chart="bars"
                  aria-pressed={state.chart === "bars"}
                >
                  Bars
                </button>
                <button
                  type="button"
                  className="cursor-interaction"
                  data-chart="lines"
                  aria-pressed={state.chart === "lines"}
                >
                  Lines
                </button>
                <button
                  type="button"
                  className="cursor-interaction"
                  data-chart="balls"
                  aria-pressed={state.chart === "balls"}
                >
                  Flow
                </button>
                <button
                  type="button"
                  data-chart="table"
                  aria-pressed={state.chart === "table"}
                >
                  Table
                </button>
              </fieldset>
              <select
                data-framework-view
                className="fw-native-select"
                aria-label="Framework SSR analysis"
                hidden={state.view !== "framework"}
                defaultValue={state.framework}
              >
                <option value="throughput">Capacity</option>
                <option value="p50">Equal-load P50</option>
                <option value="p99">Equal-load P99</option>
                <option value="cpu">CPU / response</option>
                <option value="rss">Memory</option>
              </select>
              <select
                data-http-view=""
                className="fw-native-select"
                aria-label="HTTP analysis"
                hidden={state.view !== "http"}
                defaultValue={state.http}
              >
                <option value="throughput">Capacity</option>
                <option value="cpu">CPU / response</option>
                <option value="utilization">CPU utilization</option>
                <option value="waterfall">Response waterfall</option>
                <option value="breakdown">DB / framework split</option>
                <option value="p99">Equal-load P99</option>
                <option value="rss">Memory</option>
              </select>
              <select
                data-stream-view=""
                className="fw-native-select"
                aria-label="Streaming analysis"
                hidden={state.view !== "streaming"}
                defaultValue={state.stream}
              >
                <option value="completion">Completion · P50 + P99</option>
                <option value="completeP99">Complete P99</option>
                <option value="completeP50">Complete P50</option>
                <option value="shellP50">Shell P50</option>
                <option value="throughput">Throughput</option>
              </select>
              <fieldset
                className="fw-load-points"
                data-load-points=""
                aria-label="Inspect offered load"
                hidden={true}
              ></fieldset>
              <button
                type="button"
                className="cursor-interaction fw-mono"
                data-play=""
                hidden={true}
              >
                Play
              </button>
            </div>
            <ChartMarkup model={model} initialChart={initialChart} />

            <div className="fw-chart-note" data-chart-note="">
              {initialChart.note}
            </div>
            <footer className="fw-footer block">
              <details className="group">
                <summary className="cursor-interaction m-0 flex w-full flex-col gap-3 text-left text-xs sm:flex-row sm:items-center sm:justify-between [&::-webkit-details-marker]:hidden">
                  <span className="inline-flex shrink-0 items-center gap-2">
                    <svg
                      viewBox="0 0 20 20"
                      width="14"
                      height="14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="transition-transform group-open:rotate-90"
                      aria-hidden="true"
                    >
                      <path d="m7 4 6 6-6 6" />
                    </svg>
                    <span>Method &amp; data</span>
                  </span>
                  <span className="fw-capture-metadata flex-none justify-start text-left font-mono text-[11px] text-muted sm:flex-1 sm:justify-end sm:text-right">
                    <span data-capture="">{`${capture.host?.cloud || capture.host?.cpu_model || capture.host?.cpuModel || "Recorded host"} · ${capture.date}`}</span>
                    <span
                      data-cpu-context
                      hidden={
                        !/^\d+$/.test(capture.host?.serverCpuAffinity ?? "")
                      }
                    >
                      1 logical CPU per server
                    </span>
                  </span>
                </summary>
                <div className="fw-evidence">
                  <span data-coverage="">
                    {(() => {
                      const missing = data.renderers.filter(
                        (r) =>
                          model.isVisible(r) &&
                          !(
                            state.chart === "compare"
                              ? model.comparisonMeasurements()
                              : model.getRows()
                          ).some((v) => v.id === r.id),
                      );
                      return missing.length
                        ? `${missing.length} roster entries not measured here`
                        : "";
                    })()}
                  </span>
                  <p data-capture-note hidden={!captureNote}>
                    {captureNote}
                  </p>
                  <p data-scope="">{model.suites[state.view].scope}</p>
                  <p data-method="">{model.suites[state.view].method}</p>
                  <details className="fw-recorded-versions">
                    <summary className="m-0">Recorded versions</summary>
                    <dl data-versions="">
                      {Object.entries(capture.versions).map(([id, version]) => (
                        <Fragment key={id}>
                          <dt>{model.renderer(id)?.label || id}</dt>
                          <dd>
                            {typeof version === "string"
                              ? version
                              : JSON.stringify(version)}
                          </dd>
                        </Fragment>
                      ))}
                    </dl>
                  </details>
                  <div className="fw-options"></div>
                  <div className="fw-export">
                    <button
                      type="button"
                      className="cursor-interaction"
                      data-all=""
                    >
                      All renderers
                    </button>
                    <a
                      data-json=""
                      download="frameworks-results.json"
                      href="data/results.json"
                    >
                      JSON
                    </a>
                    <a
                      data-csv=""
                      download="frameworks-results.csv"
                      href="data:text/csv;charset=utf-8,renderer%2Cvalue"
                    >
                      CSV
                    </a>
                  </div>
                  <p data-source="">
                    <a href={capture.download} download>
                      Original capture ↗
                    </a>
                    {" · "}
                    <a
                      href={`https://github.com/Proa-Labs/framework-benchmarks/blob/main/${capture.source}`}
                    >
                      View source ↗
                    </a>
                    <br />
                    <span className="fw-source-hash">
                      Source SHA-256 {capture.hash} · Artifact SHA-256{" "}
                      {capture.artifactSha256}
                    </span>
                    {capture.note && (
                      <>
                        <br />
                        {capture.note}
                      </>
                    )}
                  </p>
                  <p>
                    Maintained by Proa Labs. Proa is included in the
                    comparisons. Each experiment identifies its recorded host,
                    source and capture date. Some captures include uncommitted
                    source changes. No external database is included.
                  </p>
                </div>
              </details>
            </footer>
          </section>
        </div>
      </main>
      <section
        data-ecosystem=""
        hidden={state.section !== "ecosystem"}
        aria-label="Ecosystem directory"
      >
        <ChartMarkup model={model} slot="catalog" />
        <p className="fw-chart-note">
          <Link to="/features">Compare documented features ↗</Link>
        </p>
      </section>
      <Footer comparisonActions />
      <dialog className="fw-fixture-dialog" aria-labelledby="fixture-title">
        <div className="fw-fixture-toolbar">
          <h2 id="fixture-title">Workload preview</h2>
          <a
            data-preview-link=""
            target="_blank"
            rel="noreferrer"
            href="previews/cards.html"
          >
            Open full page ↗
          </a>
          <button
            type="button"
            data-close-preview=""
            aria-label="Close workload preview"
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="m6 6 12 12M18 6 6 18"></path>
            </svg>
          </button>
        </div>
        <p>
          Tags shown as text, such as <code>&lt;b&gt;plain text&lt;/b&gt;</code>
          , intentionally test that dynamic data is escaped safely. Preview
          styling and images are outside the timed benchmark.
        </p>
        <iframe
          data-fixture-frame=""
          sandbox=""
          title="Rendered workload"
        ></iframe>
      </dialog>
      <div
        id="rendering-info"
        className="fw-experiment-popover"
        popover="manual"
        role="tooltip"
      >
        <strong>SSR render latency</strong>
        <p>
          Time to turn prepared data into complete, freshly owned HTML output.
          Each adapter uses its declared native output type; Proa’s RenderBuffer
          avoids String conversion. Includes rendering, formatting and output
          allocation. Excludes HTTP, routing, data loading and hydration.
        </p>
      </div>
      <div
        id="fw-percentile-popover"
        className="fw-percentile-popover"
        data-percentile-popup=""
        role="tooltip"
        hidden={true}
      ></div>
    </section>
  );
}
