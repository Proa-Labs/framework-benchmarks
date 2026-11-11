import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation } from "react-router";
import evidence from "../../.generated/features.json";
import {
  featureGroups,
  features,
  supportStates,
} from "../../feature-schema.mjs";
import { brandStyle } from "../brand-colors.mjs";
import { Footer } from "../components/Footer.jsx";
import { Header } from "../components/Header.jsx";
import { Logo } from "../components/Logo.jsx";
import { readToolSelection } from "../feature-selection.mjs";
import {
  SUPPORTED_STATES,
  sortCoverageRows,
  summarizeCapabilities,
} from "../feature-summary.mjs";
import { TOOL_GROUPS } from "../filters.mjs";

const defaults = {
  group: "all",
  display: "overview",
  sort: "support",
  order: "desc",
  tools: null,
  types: ["frameworks", "templates"],
};
const categories = [{ id: "all", label: "All features" }, ...featureGroups];
const count = (group) =>
  features.filter((feature) => group === "all" || feature.group === group)
    .length;
const colorStyle = (color) =>
  Object.fromEntries(
    brandStyle(color)
      .split(";")
      .map((entry) => {
        const separator = entry.indexOf(":");
        return [entry.slice(0, separator), entry.slice(separator + 1)];
      }),
  );
const statusLabel = (capability) =>
  capability.status === "partial"
    ? capability.label
    : supportStates[capability.status].label;

function readSettings(search) {
  const params = new URLSearchParams(search);
  const requested =
    params.get("group") === "application" ? "routing" : params.get("group");
  const tools = readToolSelection(params, evidence.rows);
  const sort = ["tool", "support", "supported"].includes(params.get("sort"))
    ? params.get("sort")
    : "support";
  return {
    group: categories.some((group) => group.id === requested)
      ? requested
      : "all",
    display: params.get("display") === "matrix" ? "matrix" : "overview",
    sort,
    order: ["asc", "desc"].includes(params.get("order"))
      ? params.get("order")
      : sort === "tool"
        ? "asc"
        : "desc",
    tools: tools === null ? null : [...tools],
    types: params.has("types")
      ? params
          .get("types")
          .split(",")
          .filter((type) => defaults.types.includes(type))
      : defaults.types,
  };
}
function writeSettings(settings) {
  const url = new URL(location.href);
  url.searchParams.set("group", settings.group);
  url.searchParams.set("display", settings.display);
  for (const key of ["sort", "order", "tools", "types", "q"])
    url.searchParams.delete(key);
  if (settings.sort !== "support" || settings.order !== "desc") {
    url.searchParams.set("sort", settings.sort);
    url.searchParams.set("order", settings.order);
  }
  if (settings.tools !== null)
    url.searchParams.set("tools", [...settings.tools].sort().join(","));
  if (settings.types.length !== defaults.types.length)
    url.searchParams.set("types", settings.types.join(","));
  history.replaceState(history.state, "", url);
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="m5 5 10 10M15 5 5 15" />
    </svg>
  );
}
function Chevron() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="m5 6 3 3 3-3" />
    </svg>
  );
}

function CapabilityDetail({ row, feature, expanded = false }) {
  const capability = row.capabilities[feature.id];
  const status = supportStates[capability.status];
  const assessment = capability.assessment;
  return (
    <details className="fw-feature-detail" open={expanded || undefined}>
      <summary>
        <span className="fw-feature-detail-name">{feature.label}</span>
        <span
          className="fw-feature-detail-status"
          data-support={capability.status}
        >
          {status.symbol} {statusLabel(capability)}
        </span>
        <Chevron />
      </summary>
      <div className="fw-feature-evidence">
        {capability.label && capability.status !== "partial" && (
          <span className="fw-feature-evidence-label">{capability.label}</span>
        )}
        <p>{capability.note}</p>
        {assessment && (
          <aside className="fw-api-assessment">
            <h4>Design assessment</h4>
            <p>{assessment.summary}</p>
            <h5>Strengths</h5>
            <ul>
              {assessment.strengths.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            <h5>Tradeoffs &amp; review gaps</h5>
            <ul>
              {assessment.tradeoffs.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            <small>
              Based on linked documentation; hands-on ergonomics have not been
              rated.
            </small>
          </aside>
        )}
        <div className="fw-feature-evidence-footer">
          <details className="fw-feature-definition">
            <summary>What we compare</summary>
            <p>{feature.definition}</p>
          </details>
          {capability.url && (
            <a href={capability.url} target="_blank" rel="noreferrer">
              Source ↗
            </a>
          )}
        </div>
      </div>
    </details>
  );
}

function FeatureDialog({ selection, group, onClose, rows = evidence.rows }) {
  const dialog = useRef(null);
  const panel = useRef(null);
  const [category, setCategory] = useState("rendering");
  useLayoutEffect(() => {
    if (!selection) return;
    setCategory(group === "all" ? featureGroups[0].id : group);
    dialog.current.showModal();
    panel.current.scrollTop = 0;
  }, [selection, group]);
  const row = rows.find((row) => row.id === selection?.row);
  const feature = features.find((feature) => feature.id === selection?.feature);
  const summary = row && summarizeCapabilities(row);
  const selected =
    row && selection?.status
      ? features.filter(
          (feature) =>
            (group === "all" || feature.group === group) &&
            row.capabilities[feature.id].status === selection.status,
        )
      : [];
  const title = selection?.definition
    ? feature?.label
    : row
      ? `${row.label}${selection.status ? ` · ${supportStates[selection.status].label}` : ""}`
      : "";
  const close = () => dialog.current.close();
  return (
    <dialog
      ref={dialog}
      className="fw-feature-dialog"
      aria-labelledby="feature-dialog-title"
      onClose={onClose}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          close();
        }
      }}
      onClick={(event) => {
        if (event.target !== dialog.current) return;
        const box = dialog.current.getBoundingClientRect();
        if (
          event.clientX < box.left ||
          event.clientX > box.right ||
          event.clientY < box.top ||
          event.clientY > box.bottom
        )
          close();
      }}
    >
      <div className="fw-feature-dialog-heading">
        <h2 id="feature-dialog-title">
          {row && (
            <img
              className="fw-logo"
              data-logo={row.id}
              src={`/${row.logo}`}
              width="26"
              height="26"
              alt=""
            />
          )}
          {title}
        </h2>
        <button
          type="button"
          data-close-feature=""
          aria-label="Close feature details"
          onClick={close}
        >
          <CloseIcon />
        </button>
      </div>
      <div ref={panel} data-feature-detail="">
        {selection?.definition ? (
          <p className="fw-profile-findings">{feature.definition}</p>
        ) : (
          row && (
            <>
              <div className="fw-profile-intro">
                <p>
                  {selection.status
                    ? `${selected.length} of ${summarizeCapabilities(row, group).total} capabilities. ${supportStates[selection.status].description}`
                    : row.scope}
                </p>
                {!selection.status && (
                  <span>
                    {feature
                      ? `Reviewed ${row.capabilities[feature.id].reviewedOn || row.reviewedOn}`
                      : `${summary.supported} supported · Updated ${row.updatedOn || row.reviewedOn}`}
                  </span>
                )}
              </div>
              {selection.status ? (
                <div className="fw-profile-findings">
                  {selected.map((feature) => (
                    <CapabilityDetail
                      key={feature.id}
                      row={row}
                      feature={feature}
                    />
                  ))}
                </div>
              ) : feature ? (
                <div className="fw-profile-findings">
                  <CapabilityDetail row={row} feature={feature} expanded />
                </div>
              ) : (
                <div className="fw-profile-layout">
                  <nav
                    className="fw-profile-nav"
                    aria-label="Profile categories"
                  >
                    {featureGroups.map((entry) => (
                      <button
                        key={entry.id}
                        type="button"
                        data-profile-category={entry.id}
                        aria-pressed={category === entry.id}
                        onClick={() => {
                          setCategory(entry.id);
                          panel.current.querySelector(
                            ".fw-profile-capabilities",
                          ).scrollTop = 0;
                        }}
                      >
                        <span>{entry.label}</span>
                        <small>{count(entry.id)}</small>
                      </button>
                    ))}
                  </nav>
                  <section
                    className="fw-profile-capabilities"
                    aria-label="Category capabilities"
                  >
                    <h3 className="fw-profile-category-title">
                      {
                        featureGroups.find((entry) => entry.id === category)
                          ?.label
                      }
                    </h3>
                    {features
                      .filter((feature) => feature.group === category)
                      .map((feature) => (
                        <CapabilityDetail
                          key={feature.id}
                          row={row}
                          feature={feature}
                        />
                      ))}
                  </section>
                </div>
              )}
            </>
          )
        )}
      </div>
    </dialog>
  );
}

export function CoverageBar({ row, group, onSelect }) {
  const { counts, total } = summarizeCapabilities(row, group);
  return SUPPORTED_STATES.filter((status) => counts[status] > 0).map(
    (status) => {
      const label = `${row.label}: ${counts[status]} of ${total} ${supportStates[status].label.toLowerCase()}`;
      return (
        <button
          key={status}
          type="button"
          data-coverage={status}
          data-coverage-detail={`${row.id}/${status}`}
          style={{ "--coverage-width": `${(counts[status] / total) * 100}%` }}
          aria-label={`${label}. View findings`}
          title={label}
          onClick={() => onSelect({ row: row.id, status })}
        >
          {counts[status] / total >= 0.075 && (
            <span className="fw-coverage-count">{counts[status]}</span>
          )}
        </button>
      );
    },
  );
}

export function FeaturesPage({ rows = evidence.rows }) {
  const location = useLocation();
  const [settings, setSettings] = useState(defaults);
  const [ready, setReady] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(null);
  const [selection, setSelection] = useState(null);
  const trigger = useRef(null);
  const search = useRef(null);
  const table = useRef(null);
  const { group, display, sort, order, tools, types } = settings;
  useLayoutEffect(() => {
    document.title = "Features · Frameworks";
    setSettings(readSettings(location.search));
    setReady(true);
  }, [location.search]);
  useLayoutEffect(() => {
    if (pickerOpen) search.current.focus();
  }, [pickerOpen]);
  useEffect(() => {
    if (!pickerOpen) return;
    const outside = (event) => {
      if (!event.target.closest(".fw-tool-select")) setPickerOpen(false);
    };
    document.addEventListener("click", outside);
    document.addEventListener("focusin", outside);
    return () => {
      document.removeEventListener("click", outside);
      document.removeEventListener("focusin", outside);
    };
  }, [pickerOpen]);
  const change = (update) => {
    const next = { ...settings, ...update };
    setSettings(next);
    writeSettings(next);
  };
  const visible = (row) =>
    TOOL_GROUPS.some(
      (type) => types.includes(type.id) && type.kinds.includes(row.kind),
    ) &&
    (tools === null || tools.includes(row.id));
  const optionMatches = (row) =>
    row.label.toLowerCase().includes(query.trim().toLowerCase()) &&
    TOOL_GROUPS.some(
      (type) => types.includes(type.id) && type.kinds.includes(row.kind),
    );
  const selected = (row) => tools === null || tools.includes(row.id);
  const toggleTool = (id) => {
    const current = tools ?? rows.map((row) => row.id);
    change({
      tools: current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    });
    search.current.focus();
  };
  const openPicker = () => {
    setQuery("");
    setActive(null);
    setPickerOpen(true);
  };
  const closePicker = () => {
    setPickerOpen(false);
    trigger.current.focus();
  };
  const category = featureGroups.find((entry) => entry.id === group);
  const sortBy = (key) =>
    change({
      sort: key,
      order:
        key === sort
          ? order === "asc"
            ? "desc"
            : "asc"
          : key === "tool"
            ? "asc"
            : "desc",
    });
  const selectGroup = (group) => {
    change({ group });
    table.current.scrollLeft = 0;
  };
  const selectedRows = rows.filter((row) => tools?.includes(row.id));
  const sortButton = (key, label) => (
    <button type="button" data-coverage-sort={key} onClick={() => sortBy(key)}>
      {label}{" "}
      <span data-sort-arrow="" aria-hidden="true">
        {key === sort ? (order === "asc" ? "↑" : "↓") : ""}
      </span>
    </button>
  );
  const sortAria = (key) =>
    sort === key ? (order === "asc" ? "ascending" : "descending") : "none";
  return (
    <div
      id="frameworks-explorer"
      className="fw-features-shell"
      data-app-ready={ready}
    >
      <Header active="features" />
      <section className="fw-intro" aria-labelledby="site-title">
        <h1 id="site-title">Features</h1>
      </section>
      <main className="fw-features" id="feature-comparison">
        <div className="fw-features-layout">
          <aside className="fw-feature-sidebar" aria-label="Feature categories">
            <label className="fw-feature-mobile-category">
              Category
              <select
                data-feature-mobile-category=""
                value={group}
                onChange={(event) => selectGroup(event.target.value)}
              >
                {categories.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </label>
            <fieldset className="fw-feature-groups">
              <legend>Categories</legend>
              {categories.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  data-feature-group={entry.id}
                  aria-pressed={group === entry.id}
                  onClick={() => selectGroup(entry.id)}
                >
                  <span>{entry.label}</span>
                  <small>{count(entry.id)}</small>
                </button>
              ))}
            </fieldset>
          </aside>
          <section
            className="fw-feature-results"
            aria-labelledby="feature-category-title"
          >
            <div className="fw-features-controls">
              <div className="fw-feature-heading">
                <h2 id="feature-category-title" data-feature-category-title="">
                  {category?.label || "All features"}
                </h2>
                <details className="fw-feature-category-info">
                  <summary aria-label="About this feature category">ⓘ</summary>
                  <p data-feature-category-description="">
                    {category?.description ||
                      "Counts depend on the capability list, not API quality. Select a category for a focused comparison, or a finding for its source and limitations."}
                  </p>
                </details>
              </div>
              <div className="fw-tool-select">
                <button
                  ref={trigger}
                  type="button"
                  className="fw-tool-select-trigger"
                  data-tool-picker-trigger=""
                  aria-expanded={pickerOpen}
                  aria-controls="fw-tool-picker"
                  aria-haspopup="dialog"
                  onClick={() => (pickerOpen ? closePicker() : openPicker())}
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
                    <path d="M3 5h14M5 10h10M8 15h4" />
                  </svg>
                  <span>Tools</span>
                  <span
                    className="fw-tool-select-count"
                    data-tool-picker-count=""
                  >
                    {tools === null ? "All" : tools.length}
                  </span>
                  <Chevron />
                </button>
                <div
                  id="fw-tool-picker"
                  className="fw-tool-picker"
                  role="dialog"
                  aria-label="Filter tools"
                  hidden={!pickerOpen}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      event.preventDefault();
                      event.stopPropagation();
                      closePicker();
                    }
                  }}
                >
                  <label className="fw-tool-search">
                    <svg
                      viewBox="0 0 20 20"
                      width="15"
                      height="15"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      aria-hidden="true"
                    >
                      <circle cx="8.5" cy="8.5" r="5.5" />
                      <path d="m13 13 4 4" />
                    </svg>
                    <input
                      ref={search}
                      type="search"
                      role="combobox"
                      data-tool-search=""
                      aria-label="Search tools"
                      aria-autocomplete="list"
                      aria-expanded={pickerOpen}
                      aria-controls="fw-tool-options"
                      aria-activedescendant={
                        active ? `tool-option-${active}` : undefined
                      }
                      placeholder="Search tools…"
                      autoComplete="off"
                      value={query}
                      onChange={(event) => {
                        setQuery(event.target.value);
                        setActive(null);
                      }}
                      onKeyDown={(event) => {
                        const options = rows.filter(optionMatches);
                        const index = options.findIndex(
                          (row) => row.id === active,
                        );
                        if (
                          ["ArrowDown", "ArrowUp", "Home", "End"].includes(
                            event.key,
                          ) &&
                          options.length
                        ) {
                          event.preventDefault();
                          const next =
                            event.key === "Home"
                              ? 0
                              : event.key === "End"
                                ? options.length - 1
                                : event.key === "ArrowDown"
                                  ? (index + 1) % options.length
                                  : (index <= 0 ? options.length : index) - 1;
                          setActive(options[next].id);
                          document
                            .getElementById(`tool-option-${options[next].id}`)
                            ?.scrollIntoView({ block: "nearest" });
                        }
                        if (event.key === "Enter" && active) {
                          event.preventDefault();
                          toggleTool(active);
                        }
                      }}
                    />
                  </label>
                  <fieldset
                    className="fw-tool-types"
                    aria-label="Project types"
                  >
                    {TOOL_GROUPS.map((type) => (
                      <label key={type.id}>
                        <input
                          type="checkbox"
                          data-feature-type={type.id}
                          checked={types.includes(type.id)}
                          onChange={(event) => {
                            change({
                              types: event.target.checked
                                ? [...types, type.id]
                                : types.filter((id) => id !== type.id),
                            });
                            setActive(null);
                          }}
                        />{" "}
                        {type.id === "frameworks"
                          ? "Frameworks & UI"
                          : "Templates"}
                      </label>
                    ))}
                  </fieldset>
                  <div className="fw-tool-picker-actions">
                    <button
                      type="button"
                      data-tool-select-all=""
                      onClick={() => {
                        change({ tools: null });
                        search.current.focus();
                      }}
                    >
                      All tools
                    </button>
                    <button
                      type="button"
                      data-tool-select-none=""
                      onClick={() => {
                        change({ tools: [] });
                        search.current.focus();
                      }}
                    >
                      Clear
                    </button>
                  </div>
                  <div
                    id="fw-tool-options"
                    role="listbox"
                    aria-label="Tools"
                    aria-multiselectable="true"
                  >
                    {rows.map((row) => (
                      <button
                        key={row.id}
                        type="button"
                        role="option"
                        id={`tool-option-${row.id}`}
                        data-tool-option={row.id}
                        data-active={active === row.id ? "" : undefined}
                        aria-selected={selected(row)}
                        tabIndex={-1}
                        hidden={!optionMatches(row)}
                        onClick={() => toggleTool(row.id)}
                      >
                        <span className="fw-tool-check" aria-hidden="true">
                          ✓
                        </span>
                        <Logo row={row} size={17} />
                        <span>
                          {row.label}
                          <small>{row.kind}</small>
                        </span>
                      </button>
                    ))}
                  </div>
                  <p
                    className="fw-tool-no-match"
                    data-tool-no-match=""
                    hidden={rows.some(optionMatches)}
                  >
                    No matching tools.
                  </p>
                  <div className="fw-tool-picker-footer">
                    <span data-tool-selection-status="" role="status">
                      {tools === null
                        ? "All tools selected"
                        : `${tools.length} selected`}
                    </span>
                    <button
                      type="button"
                      data-tool-picker-done=""
                      onClick={closePicker}
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="fw-feature-selection" hidden={tools === null}>
              <div data-tool-chips="" className="fw-tool-chips">
                {selectedRows.slice(0, 4).map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    className="fw-tool-chip"
                    data-tool-remove={row.id}
                    aria-label={`Remove ${row.label}`}
                    onClick={() => {
                      change({ tools: tools.filter((id) => id !== row.id) });
                      trigger.current.focus();
                    }}
                  >
                    {row.label}
                    <span aria-hidden="true">×</span>
                  </button>
                ))}
                {selectedRows.length > 4 && (
                  <button
                    type="button"
                    className="fw-tool-chip"
                    data-tool-show-more=""
                    onClick={openPicker}
                  >
                    +{selectedRows.length - 4} more
                  </button>
                )}
                {tools?.length === 0 && (
                  <span className="fw-feature-selection-label">
                    No tools selected
                  </span>
                )}
              </div>
            </div>
            <span className="sr-only" data-feature-count="" role="status">
              {rows.filter(visible).length} tools
            </span>
            <div className="fw-feature-display-controls">
              <fieldset
                className="fw-feature-display"
                aria-label="Comparison display"
              >
                {["overview", "matrix"].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    data-feature-display={mode}
                    aria-pressed={display === mode}
                    onClick={() => change({ display: mode })}
                  >
                    {mode === "overview" ? "Overview" : "Matrix"}
                  </button>
                ))}
              </fieldset>
            </div>
            <section
              className="fw-feature-overview"
              data-feature-overview=""
              aria-label="Capability coverage overview"
              hidden={display !== "overview"}
            >
              <p className="fw-feature-summary-note">
                Bar length shows supported features. Select a segment for
                evidence.
              </p>
              <div className="fw-coverage-key">
                {SUPPORTED_STATES.map((status) => (
                  <span key={status}>
                    <i data-coverage={status} aria-hidden="true" />
                    {supportStates[status].label}
                  </span>
                ))}
              </div>
              <table
                className="fw-coverage-table"
                aria-label="Capability coverage counts"
              >
                <thead>
                  <tr className="fw-coverage-head">
                    <th scope="col" aria-sort={sortAria("tool")}>
                      {sortButton("tool", "Tool")}
                    </th>
                    <th scope="col" aria-sort={sortAria("support")}>
                      {sortButton("support", "Support breakdown")}
                    </th>
                    <th scope="col" aria-sort={sortAria("supported")}>
                      <span className="fw-coverage-heading">
                        {sortButton("supported", "Supported")}
                        <span className="fw-coverage-help">
                          <button
                            type="button"
                            aria-label="What counts as supported?"
                            aria-describedby="supported-definition"
                          >
                            ⓘ
                          </button>
                          <span role="tooltip" id="supported-definition">
                            Built-in + official packages + third-party packages.
                            Qualified and planned features are excluded. The
                            total follows the selected category.
                          </span>
                        </span>
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody data-feature-summary-rows="">
                  {sortCoverageRows(rows, group, sort, order).map((row) => {
                    const summary = summarizeCapabilities(row, group);
                    return (
                      <tr
                        key={row.id}
                        className="fw-coverage-row"
                        data-feature-summary-row={row.id}
                        hidden={!visible(row)}
                        style={colorStyle(row.color)}
                      >
                        <td>
                          <button
                            type="button"
                            className="fw-coverage-project"
                            data-feature-profile={row.id}
                            onClick={() => setSelection({ row: row.id })}
                          >
                            <Logo row={row} />
                            {row.label}
                          </button>
                        </td>
                        <td
                          className="fw-coverage-bar"
                          data-coverage-group={group}
                          data-feature-summary-bar={row.id}
                        >
                          <CoverageBar
                            row={row}
                            group={group}
                            onSelect={setSelection}
                          />
                        </td>
                        <td
                          className="fw-coverage-total"
                          data-feature-summary-total={row.id}
                        >
                          {summary.supported}
                          <small> / {summary.total}</small>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
            {/* biome-ignore-start lint/a11y/noNoninteractiveTabindex: The scroll region needs keyboard focus so arrow keys can scroll the wide matrix. */}
            <section
              ref={table}
              className="fw-feature-table-scroll"
              hidden={display !== "matrix"}
              aria-label="Scrollable capability comparison"
              tabIndex={0}
            >
              <table className="fw-feature-table">
                <caption className="sr-only">
                  Framework capability comparison. Cells open documentation
                  notes. No overall feature score is assigned.
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Tool</th>
                    {features.map((feature) => (
                      <th
                        key={feature.id}
                        scope="col"
                        data-feature-column={feature.id}
                        data-feature-category={feature.group}
                        hidden={group !== "all" && feature.group !== group}
                      >
                        <button
                          type="button"
                          data-feature-definition={feature.id}
                          onClick={() =>
                            setSelection({
                              feature: feature.id,
                              definition: true,
                            })
                          }
                        >
                          {feature.label} <span aria-hidden="true">ⓘ</span>
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      data-feature-row={row.id}
                      data-feature-kind={row.kind}
                      data-feature-name={row.label.toLowerCase()}
                      hidden={!visible(row)}
                    >
                      <th scope="row">
                        <button
                          type="button"
                          className="fw-feature-project"
                          data-feature-profile={row.id}
                          aria-label={`${row.label}, ${row.kind}. View profile`}
                          onClick={() => setSelection({ row: row.id })}
                        >
                          <Logo row={row} />
                          <span>{row.label}</span>
                        </button>
                      </th>
                      {features.map((feature) => {
                        const capability = row.capabilities[feature.id],
                          state = supportStates[capability.status];
                        return (
                          <td
                            key={feature.id}
                            data-feature-column={feature.id}
                            data-feature-category={feature.group}
                            hidden={group !== "all" && feature.group !== group}
                          >
                            <button
                              type="button"
                              data-feature-cell={`${row.id}/${feature.id}`}
                              data-support={capability.status}
                              aria-label={`${row.label}: ${feature.label}, ${statusLabel(capability)}. View evidence`}
                              onClick={() =>
                                setSelection({
                                  row: row.id,
                                  feature: feature.id,
                                })
                              }
                            >
                              <span>
                                <b aria-hidden="true">{state.symbol}</b>{" "}
                                {statusLabel(capability)}
                              </span>
                              {capability.label &&
                                capability.status !== "partial" && (
                                  <small>{capability.label}</small>
                                )}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
            {/* biome-ignore-end lint/a11y/noNoninteractiveTabindex: End keyboard-scrollable matrix region. */}
            <p
              className="fw-feature-empty"
              data-feature-empty=""
              hidden={rows.some(visible)}
            >
              No tools selected. Open Tools to change the filters.
            </p>
            <div className="fw-feature-review-bar">
              <span>
                Updated <time dateTime={evidence.updatedOn}>Nov 11, 2026</time>
              </span>
              <details className="fw-feature-key">
                <summary>Support key</summary>
                <section
                  className="fw-feature-legend"
                  aria-label="Support legend"
                >
                  {Object.entries(supportStates).map(([status, state]) => (
                    <div key={status} data-support={status}>
                      <span>
                        <b aria-hidden="true">{state.symbol}</b> {state.label}
                      </span>
                      <p>{state.description}</p>
                    </div>
                  ))}
                </section>
              </details>
              <a href="/data/features.json" download>
                Evidence JSON ↗
              </a>
            </div>
          </section>
        </div>
        <details className="fw-feature-method">
          <summary>How this comparison works</summary>
          <p>
            Base documentation review: Nov 10, 2026. Expanded behavior, security
            and backend review: Nov 11, 2026. Each cell names its API boundary
            and source. Support can differ from the versions used in benchmark
            captures.
          </p>
          <p>
            Overview bars show supported capabilities, grouped by built-in,
            official package and third-party package. Each capability uses the
            same width; unfilled space is excluded from the count. Category and
            tool filters apply to both views. Qualified, planned, not documented
            and outside-scope findings remain in the matrix and each tool’s
            profile. No weights or quality score are assigned.
          </p>
          <p>
            “Not documented” means the linked API or guide was reviewed without
            establishing the defined behavior; it does not prove absence.
            “Outside scope” means the reviewed core delegates that
            responsibility. Built-in establishes ownership, not API quality:
            read the evidence for limitations and composition or override
            behavior.
          </p>
          <dl>
            {features.map((feature) => (
              <div key={feature.id}>
                <dt>{feature.label}</dt>
                <dd>{feature.definition}</dd>
              </div>
            ))}
          </dl>
          <a
            href="https://github.com/Proa-Labs/framework-benchmarks/issues/new"
            target="_blank"
            rel="noreferrer"
          >
            Propose a feature or correction ↗
          </a>
        </details>
        <FeatureDialog
          rows={rows}
          selection={selection}
          group={group}
          onClose={() => setSelection(null)}
        />
      </main>
      <Footer />
    </div>
  );
}
