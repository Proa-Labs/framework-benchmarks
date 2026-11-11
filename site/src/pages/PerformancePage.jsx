import { useLayoutEffect, useRef } from "react";
import { Link } from "react-router";
import benchmarkData from "../../.generated/results.json";
import { mountDashboard } from "../charts/dashboard-controller.mjs";
import { Header } from "../components/Header.jsx";
export function PerformancePage({ data = benchmarkData }) {
  const root = useRef(null);
  useLayoutEffect(() => {
    const dispose = mountDashboard(root.current, data);
    root.current.dataset.appReady = "true";
    return dispose;
  }, [data]);
  return (
    <section
      ref={root}
      id="frameworks-explorer"
      data-app-ready="false"
      aria-label="Framework performance research dashboard"
    >
      <Header interactive />
      <section className="fw-intro" aria-labelledby="site-title">
        <h1 id="site-title">Web framework benchmarks</h1>
      </section>

      <main data-performance="">
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
              aria-selected="true"
              data-view="rendering"
              aria-current="page"
            >
              SSR Rendering
            </button>
            <button
              type="button"
              className="fw-experiment-info"
              aria-label="About SSR Rendering"
              aria-describedby="rendering-info"
            >
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
            </button>
          </div>
          <button
            type="button"
            className="cursor-interaction"
            role="tab"
            id="experiment-framework"
            aria-controls="experiment-panel"
            aria-selected="false"
            data-view="framework"
            hidden
          >
            Framework SSR
          </button>
          <button
            type="button"
            className="cursor-interaction"
            role="tab"
            id="experiment-http"
            aria-controls="experiment-panel"
            aria-selected="false"
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
            aria-selected="false"
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
            aria-selected="false"
            data-view="startup"
          >
            Startup
          </button>
        </div>
        <div
          className="fw-experiment-layout"
          id="experiment-panel"
          role="tabpanel"
          aria-labelledby="experiment-rendering"
        >
          <aside className="fw-scenarios" aria-label="Workloads">
            <h2 className="fw-sidebar-label">Workloads</h2>
            <fieldset
              className="fw-workload-tabs"
              aria-label="Choose workloads"
            ></fieldset>
            <fieldset
              className="fw-type-filters"
              aria-label="Tool types"
            ></fieldset>
          </aside>
          <section
            className="fw-results-area"
            id="results-heading"
            tabIndex="-1"
            aria-label="Benchmark results"
          >
            <div className="fw-main-heading" data-results-title="" hidden>
              <div>
                <h2 data-heading="">Render time</h2>
              </div>
            </div>
            <p
              className="fw-validation-note"
              data-validation-note
              role="status"
              hidden
            ></p>
            <div className="fw-toolbar">
              <fieldset className="fw-view-switch" aria-label="Chart view">
                <button
                  type="button"
                  className="cursor-interaction"
                  data-chart="bars"
                  aria-pressed="true"
                >
                  Bars
                </button>
                <button
                  type="button"
                  className="cursor-interaction"
                  data-chart="lines"
                  aria-pressed="false"
                >
                  Lines
                </button>
                <button
                  type="button"
                  className="cursor-interaction"
                  data-chart="balls"
                  aria-pressed="false"
                >
                  Flow
                </button>
                <button type="button" data-chart="table" aria-pressed="false">
                  Table
                </button>
              </fieldset>
              <select
                data-framework-view
                aria-label="Framework SSR analysis"
                hidden
              >
                <option value="throughput">Capacity</option>
                <option value="p50">Equal-load P50</option>
                <option value="p99">Equal-load P99</option>
                <option value="cpu">CPU / response</option>
                <option value="rss">Memory</option>
              </select>
              <select
                data-http-view=""
                aria-label="HTTP analysis"
                hidden={true}
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
                aria-label="Streaming analysis"
                hidden={true}
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
            <div data-results="" aria-live="off"></div>
            <noscript>
              <p>
                This explorer needs JavaScript.{" "}
                <a href="data/results.json">Download the complete dataset</a> or
                read the{" "}
                <a href="https://github.com/Proa-Labs/framework-benchmarks/blob/main/scoreboard.md">
                  static result tables
                </a>
                .
              </p>
            </noscript>
            <div className="fw-chart-note" data-chart-note=""></div>
            <footer className="fw-footer">
              <div className="fw-capture-metadata">
                <span data-capture=""></span>
                <span data-cpu-context hidden>
                  1 logical CPU per server
                </span>
              </div>
              <span data-coverage=""></span>
              <details>
                <summary className="cursor-interaction">
                  Method &amp; data
                </summary>
                <div className="fw-evidence">
                  <p data-scope=""></p>
                  <p data-method=""></p>
                  <details className="fw-recorded-versions">
                    <summary>Recorded versions</summary>
                    <dl data-versions=""></dl>
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
                  <p data-source=""></p>
                  <p>
                    Maintained by Andrew Hariri, founder of Proa Labs. Proa is
                    included in the comparisons. Each experiment identifies its
                    recorded host, source and capture date. Some captures
                    include uncommitted source changes. No external database is
                    included.
                  </p>
                </div>
              </details>
            </footer>
          </section>
        </div>
      </main>
      <section data-ecosystem="" hidden={true} aria-label="Ecosystem directory">
        <div data-catalog=""></div>
        <p className="fw-chart-note">
          <Link to="/features">Compare documented features ↗</Link>
        </p>
        <div className="fw-footer">
          <span>Frameworks.run</span>
          <span>Open research · affiliation disclosed</span>
        </div>
      </section>
      <div className="fw-site-footer">
        <span>Frameworks / 2026</span>
        <div>
          <Link to="/about">Ownership &amp; disclosure</Link>
          <a
            href="https://github.com/Proa-Labs/framework-benchmarks/issues"
            target="_blank"
            rel="noreferrer"
          >
            Challenge a result ↗
          </a>
          <button type="button" data-share="">
            Copy comparison link ↗
          </button>
        </div>
        <span data-share-status="" role="status" aria-live="polite"></span>
      </div>
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
