import { TOOL_GROUPS } from "../filters.ts";
import type { ChartOutput } from "./chart-markup.ts";
import { createChartMarkup } from "./chart-markup.ts";
import type { DashboardModel } from "./dashboard-model.ts";
// All chart strings come from our shared renderer, which escapes capture text.
// D3 enhances these exact server-rendered marks after hydration.
export function ChartMarkup({
  model,
  slot = "results",
  initialChart,
}: {
  model: DashboardModel;
  slot?: string;
  initialChart?: ChartOutput;
}) {
  const markup = createChartMarkup(model);
  const chart =
    initialChart ||
    (slot === "catalog"
      ? { html: markup.catalog() }
      : markup.draw(model.visibleRows()));
  return (
    <div
      data-initial-chart={
        slot === "results" ? JSON.stringify(model.state) : undefined
      }
      {...(slot === "catalog"
        ? { "data-catalog": "" }
        : { "data-results": "", "aria-live": "off" })}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: shared chart renderer escapes dynamic text and owns the SVG/table markup.
      dangerouslySetInnerHTML={{ __html: chart.html }}
    />
  );
}
export function WorkloadChoices({ model }: { model: DashboardModel }) {
  const { state, orderedWorkloads, frameworkWorkloads } = model;
  const fixed = ["streaming", "startup"].includes(state.view),
    compare = state.chart === "compare";
  return (
    <>
      <button
        type="button"
        data-chart="compare"
        aria-pressed={compare}
        hidden={state.view !== "rendering"}
      >
        All workloads
      </button>
      {[
        ...orderedWorkloads(),
        ...frameworkWorkloads().filter(
          (w) => !orderedWorkloads().some((v) => v.id === w.id),
        ),
      ].map((w) => (
        <div
          key={w.id}
          className="fw-workload-choice"
          data-active={!compare && state.workload === w.id}
          hidden={
            state.view === "framework"
              ? !frameworkWorkloads().some((v) => v.id === w.id)
              : w.id === "catalog"
          }
        >
          <span className="fw-workload-thumb" aria-hidden="true">
            <img
              src={`/thumbnails/${state.view === "framework" && frameworkWorkloads().some((v) => v.id === w.id) ? "framework-" : ""}${w.id}.svg`}
              alt=""
              width="800"
              height="640"
              loading="lazy"
              tabIndex={-1}
              title={`${w.label} miniature`}
            />
          </span>
          <button
            type="button"
            data-workload={w.id}
            aria-pressed={!compare && state.workload === w.id}
            disabled={fixed && w.id !== "products"}
          >
            {w.label}
          </button>
          <button
            type="button"
            data-preview={w.id}
            aria-label={`Preview ${w.label}`}
            title={`Preview ${w.label}`}
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>
      ))}
    </>
  );
}
export function ToolTypes({ model }: { model: DashboardModel }) {
  return (
    <>
      <span>Tool type</span>
      {TOOL_GROUPS.map((g) => (
        <label key={g.id}>
          <input
            type="checkbox"
            data-type={g.id}
            defaultChecked={model.state.types.includes(g.id)}
          />
          {g.label}
        </label>
      ))}
    </>
  );
}
