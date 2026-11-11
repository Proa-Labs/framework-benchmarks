import {
  featureGroups,
  featureRows,
  features,
  supportStates,
  updatedOn,
} from "./features-data.mjs";
import { brandStyle } from "./src/brand-colors.mjs";
import {
  renderCoverageBar,
  SUPPORTED_STATES,
  sortCoverageRows,
  summarizeCapabilities,
} from "./src/feature-summary.mjs";

const esc = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );

export function renderFeatures(renderers) {
  const rows = featureRows(renderers);
  const categories = [{ id: "all", label: "All features" }, ...featureGroups];
  return `<main class="fw-features" id="feature-comparison">
    <div class="fw-features-layout">
    <aside class="fw-feature-sidebar" aria-label="Feature categories">
      <label class="fw-feature-mobile-category">Category<select data-feature-mobile-category>${categories.map((group) => `<option value="${group.id}"${group.id === "all" ? " selected" : ""}>${esc(group.label)}</option>`).join("")}</select></label>
      <fieldset class="fw-feature-groups"><legend>Categories</legend>${categories.map((group) => `<button type="button" data-feature-group="${group.id}" aria-pressed="${group.id === "all"}"><span>${esc(group.label)}</span><small>${group.id === "all" ? features.length : features.filter((feature) => feature.group === group.id).length}</small></button>`).join("")}</fieldset>
    </aside>
    <section class="fw-feature-results" aria-labelledby="feature-category-title">
    <div class="fw-features-controls">
      <div class="fw-feature-heading"><h2 id="feature-category-title" data-feature-category-title>All features</h2><details class="fw-feature-category-info"><summary aria-label="About this feature category">ⓘ</summary><p data-feature-category-description>Compare documented capabilities across all categories. Select a bar segment for evidence.</p></details></div>
      <div class="fw-tool-select">
        <button type="button" class="fw-tool-select-trigger" data-tool-picker-trigger aria-expanded="false" aria-controls="fw-tool-picker" aria-haspopup="dialog"><svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3 5h14M5 10h10M8 15h4"/></svg><span>Tools</span><span class="fw-tool-select-count" data-tool-picker-count>All</span><svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg></button>
        <div id="fw-tool-picker" class="fw-tool-picker" role="dialog" aria-label="Filter tools" hidden>
          <label class="fw-tool-search"><svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5"/><path d="m13 13 4 4"/></svg><input type="search" role="combobox" data-tool-search aria-label="Search tools" aria-autocomplete="list" aria-expanded="false" aria-controls="fw-tool-options" placeholder="Search tools…" autocomplete="off"></label>
          <fieldset class="fw-tool-types" aria-label="Project types"><label><input type="checkbox" data-feature-type="frameworks" checked> Frameworks &amp; UI</label><label><input type="checkbox" data-feature-type="templates" checked> Templates</label></fieldset>
          <div class="fw-tool-picker-actions"><button type="button" data-tool-select-all>All tools</button><button type="button" data-tool-select-none>Clear</button></div>
          <div id="fw-tool-options" role="listbox" aria-label="Tools" aria-multiselectable="true">${rows.map((row) => `<button type="button" role="option" id="tool-option-${row.id}" data-tool-option="${row.id}" aria-selected="true" tabindex="-1"><span class="fw-tool-check" aria-hidden="true">✓</span><span class="fw-logo-mark" style="--logo-mask:url('${row.id === "jte" ? "logos/jte-mark.svg" : esc(row.logo)}')" aria-hidden="true"><img class="fw-logo" data-logo="${esc(row.id)}" src="${esc(row.logo)}" width="17" height="17" alt=""></span><span>${esc(row.label)}<small>${esc(row.kind)}</small></span></button>`).join("")}</div>
          <p class="fw-tool-no-match" data-tool-no-match hidden>No matching tools.</p>
          <div class="fw-tool-picker-footer"><span data-tool-selection-status role="status">All tools selected</span><button type="button" data-tool-picker-done>Done</button></div>
        </div>
      </div>
    </div>
    <div class="fw-feature-selection" hidden><div data-tool-chips class="fw-tool-chips"></div></div><span class="sr-only" data-feature-count role="status">${rows.length} tools</span>
    <div class="fw-feature-display-controls"><fieldset class="fw-feature-display" aria-label="Comparison display"><button type="button" data-feature-display="overview" aria-pressed="true">Overview</button><button type="button" data-feature-display="matrix" aria-pressed="false">Matrix</button></fieldset></div>
    <section class="fw-feature-overview" data-feature-overview aria-label="Capability coverage overview">
      <p class="fw-feature-summary-note">Bar length shows supported features. Select a segment for evidence.</p>
      <div class="fw-coverage-key">${Object.entries(supportStates)
        .filter(([id]) => SUPPORTED_STATES.includes(id))
        .map(
          ([id, state]) =>
            `<span><i data-coverage="${id}" aria-hidden="true"></i>${esc(state.label)}</span>`,
        )
        .join("")}</div>
      <div role="table" aria-label="Capability coverage counts"><div class="fw-coverage-head" role="row"><span role="columnheader" aria-sort="none"><button type="button" data-coverage-sort="tool">Tool <span data-sort-arrow aria-hidden="true"></span></button></span><span role="columnheader" aria-sort="descending"><button type="button" data-coverage-sort="support" title="Sort by built-in plus official and third-party package counts; qualified support stays separate">Support breakdown <span data-sort-arrow aria-hidden="true">↓</span></button></span><span role="columnheader" aria-sort="none"><span class="fw-coverage-heading"><button type="button" data-coverage-sort="supported">Supported <span data-sort-arrow aria-hidden="true"></span></button><span class="fw-coverage-help"><button type="button" aria-label="What counts as supported?" aria-describedby="supported-definition">ⓘ</button><span role="tooltip" id="supported-definition">Built-in + official packages + third-party packages. Qualified and planned features are excluded. The total follows the selected category.</span></span></span></span></div>
      <div data-feature-summary-rows role="rowgroup">${sortCoverageRows(
        rows,
        "all",
        "support",
        "desc",
      )
        .map((row) => {
          const summary = summarizeCapabilities(row);
          return `<div class="fw-coverage-row" role="row" data-feature-summary-row="${row.id}" style="${brandStyle(row.color)}"><div role="cell"><button type="button" class="fw-coverage-project" data-feature-profile="${row.id}"><span class="fw-logo-mark" style="--logo-mask:url('${row.id === "jte" ? "logos/jte-mark.svg" : esc(row.logo)}')" aria-hidden="true"><img class="fw-logo" data-logo="${esc(row.id)}" src="${esc(row.logo)}" width="18" height="18" alt=""></span>${esc(row.label)}</button></div><div class="fw-coverage-bar" role="cell" data-coverage-group="all" data-feature-summary-bar="${row.id}">${renderCoverageBar(row)}</div><span class="fw-coverage-total" role="cell" data-feature-summary-total="${row.id}">${summary.supported}<small> / ${summary.total}</small></span></div>`;
        })
        .join("")}</div></div>
    </section>
    <div class="fw-feature-table-scroll" hidden role="region" aria-label="Scrollable capability comparison" tabindex="0"><table class="fw-feature-table"><caption class="sr-only">Framework capability comparison. Cells open documentation notes. No overall feature score is assigned.</caption><thead><tr><th scope="col">Tool</th>${features.map((feature) => `<th scope="col" data-feature-column="${feature.id}" data-feature-category="${feature.group}"${feature.group !== "rendering" ? " hidden" : ""}><button type="button" data-feature-definition="${feature.id}">${esc(feature.label)} <span aria-hidden="true">ⓘ</span></button></th>`).join("")}</tr></thead><tbody>${rows
      .map(
        (row) =>
          `<tr data-feature-row="${row.id}" data-feature-kind="${esc(row.kind)}" data-feature-name="${esc(row.label.toLowerCase())}"><th scope="row"><button type="button" class="fw-feature-project" data-feature-profile="${row.id}" aria-label="${esc(`${row.label}, ${row.kind}. View profile`)}"><span class="fw-logo-mark" style="--logo-mask:url('${row.id === "jte" ? "logos/jte-mark.svg" : esc(row.logo)}')" aria-hidden="true"><img class="fw-logo" data-logo="${esc(row.id)}" src="${esc(row.logo)}" width="18" height="18" alt=""></span><span>${esc(row.label)}</span></button></th>${features
            .map((feature) => {
              const capability = row.capabilities[feature.id];
              const state = supportStates[capability.status];
              const stateLabel =
                capability.status === "partial"
                  ? capability.label
                  : state.label;
              return `<td data-feature-column="${feature.id}" data-feature-category="${feature.group}"${feature.group !== "rendering" ? " hidden" : ""}><button type="button" data-feature-cell="${row.id}/${feature.id}" data-support="${capability.status}" aria-label="${esc(`${row.label}: ${feature.label}, ${stateLabel}. View evidence`)}"><span><b aria-hidden="true">${state.symbol}</b> ${esc(stateLabel)}</span>${capability.label && capability.status !== "partial" ? `<small>${esc(capability.label)}</small>` : ""}</button></td>`;
            })
            .join("")}</tr>`,
      )
      .join("")}</tbody></table></div>
    <p class="fw-feature-empty" data-feature-empty hidden>No tools selected. Open Tools to change the filters.</p>
    <div class="fw-feature-review-bar"><span>Updated <time datetime="${updatedOn}">Nov 11, 2026</time></span><details class="fw-feature-key"><summary>Support key</summary><div class="fw-feature-legend" aria-label="Support legend">${Object.entries(
      supportStates,
    )
      .map(
        ([id, state]) =>
          `<div data-support="${id}"><span><b aria-hidden="true">${state.symbol}</b> ${esc(state.label)}</span><p>${esc(state.description)}</p></div>`,
      )
      .join(
        "",
      )}</div></details><a href="data/features.json" download>Evidence JSON ↗</a></div>
    </section></div>
    <details class="fw-feature-method"><summary>How this comparison works</summary><p>Base documentation review: Nov 10, 2026. Expanded behavior, security and backend review: Nov 11, 2026. Each cell names its API boundary and source. Support can differ from the versions used in benchmark captures.</p><p>Overview bars show only supported capabilities, grouped by built-in, official package and third-party package. Each capability uses the same width; unfilled space is excluded from the count. They apply the same category and tool filters as the matrix. The Supported column counts built-in capabilities plus official and third-party packages, using the same total as Support breakdown sorting. Qualified, planned, not documented and outside-scope findings are excluded. Qualified and other excluded findings remain available in the matrix and each tool’s profile. No weights or quality score are assigned. The overall count depends on which capabilities we include and how finely categories are divided; compare the selected category and API evidence when choosing a stack.</p><p>“Not documented” means the linked API/guide was reviewed without establishing the defined behavior. It does not prove absence. “Outside scope” means the reviewed core delegates that responsibility to a host or another framework. “Not reviewed” is reserved for future findings that still need investigation. Planned requires an explicit roadmap. Built-in establishes ownership, not API quality: read the evidence for limitations and composition/override behavior.</p><dl>${features.map((feature) => `<dt>${esc(feature.label)}</dt><dd>${esc(feature.definition)}</dd>`).join("")}</dl><a href="https://github.com/Proa-Labs/framework-benchmarks/issues/new" target="_blank" rel="noreferrer">Propose a feature or correction ↗</a></details>
    <dialog class="fw-feature-dialog" aria-labelledby="feature-dialog-title"><div class="fw-feature-dialog-heading"><h2 id="feature-dialog-title"></h2><button type="button" data-close-feature aria-label="Close feature details"><svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15"/></svg></button></div><div data-feature-detail></div></dialog>
  </main>`;
}
