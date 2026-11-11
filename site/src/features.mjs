import { featureGroups, features, supportStates } from "../feature-schema.mjs";
import { readToolSelection } from "./feature-selection.mjs";
import {
  renderCoverageBar,
  sortCoverageRows,
  summarizeCapabilities,
} from "./feature-summary.mjs";
import { TOOL_GROUPS } from "./filters.mjs";

const root = document.querySelector(".fw-features");
const evidence = JSON.parse(
  document.getElementById("framework-features-data").textContent,
);
const dialog = root.querySelector("dialog");
const detail = root.querySelector("[data-feature-detail]");
const picker = root.querySelector("[data-tool-picker-trigger]");
const pickerPanel = root.querySelector("#fw-tool-picker");
const search = root.querySelector("[data-tool-search]");
const options = [...root.querySelectorAll("[data-tool-option]")];
let selectedTools = null;
let activeOption = null;
const types = [...root.querySelectorAll("[data-feature-type]")];
const esc = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
let group = "all";
let displayMode = "overview";
let coverageSort = "support";
let coverageDirection = "desc";

function updateSummary() {
  for (const row of evidence.rows) {
    const summaryRow = root.querySelector(
      `[data-feature-summary-row="${row.id}"]`,
    );
    summaryRow.hidden = root.querySelector(
      `[data-feature-row="${row.id}"]`,
    ).hidden;
    const { supported, total } = summarizeCapabilities(row, group);
    const bar = root.querySelector(`[data-feature-summary-bar="${row.id}"]`);
    if (bar.dataset.coverageGroup !== group) {
      bar.innerHTML = renderCoverageBar(row, group);
      bar.dataset.coverageGroup = group;
    }
    root.querySelector(`[data-feature-summary-total="${row.id}"]`).innerHTML =
      `${supported}<small> / ${total}</small>`;
  }
  const ordered = sortCoverageRows(
    evidence.rows,
    group,
    coverageSort,
    coverageDirection,
  );
  const container = root.querySelector("[data-feature-summary-rows]");
  ordered.forEach((row, index) => {
    const node = root.querySelector(`[data-feature-summary-row="${row.id}"]`);
    if (container.children[index] !== node)
      container.insertBefore(node, container.children[index] || null);
  });
  for (const button of root.querySelectorAll("[data-coverage-sort]")) {
    const active = button.dataset.coverageSort === coverageSort;
    button
      .closest('[role="columnheader"]')
      .setAttribute(
        "aria-sort",
        active
          ? coverageDirection === "asc"
            ? "ascending"
            : "descending"
          : "none",
      );
    button.querySelector("[data-sort-arrow]").textContent = active
      ? coverageDirection === "asc"
        ? "↑"
        : "↓"
      : "";
  }
  root.querySelector("[data-feature-overview]").hidden =
    displayMode !== "overview";
  root.querySelector(".fw-feature-table-scroll").hidden =
    displayMode !== "matrix";
  for (const button of root.querySelectorAll("[data-feature-display]"))
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.featureDisplay === displayMode),
    );
}

function update(save = true) {
  const selectedTypes = types
    .filter((input) => input.checked)
    .map((input) => input.dataset.featureType);
  let visible = 0;
  for (const row of root.querySelectorAll("[data-feature-row]")) {
    const kindMatches = TOOL_GROUPS.some(
      (type) =>
        selectedTypes.includes(type.id) &&
        type.kinds.includes(row.dataset.featureKind),
    );
    row.hidden =
      !kindMatches ||
      (selectedTools !== null && !selectedTools.has(row.dataset.featureRow));
    if (!row.hidden) visible++;
  }
  root.querySelector("[data-feature-mobile-category]").value = group;
  const category = featureGroups.find((entry) => entry.id === group);
  root.querySelector("[data-feature-category-title]").textContent =
    category?.label || "All features";
  root.querySelector("[data-feature-category-description]").textContent =
    category?.description ||
    "Counts depend on the capability list, not API quality. Select a category for a focused comparison, or a finding for its source and limitations.";
  for (const column of root.querySelectorAll("[data-feature-column]"))
    column.hidden = group !== "all" && column.dataset.featureCategory !== group;
  for (const button of root.querySelectorAll("[data-feature-group]"))
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.featureGroup === group),
    );
  root.querySelector("[data-feature-count]").textContent =
    `${visible} ${visible === 1 ? "tool" : "tools"}`;
  root.querySelector("[data-feature-empty]").hidden = visible !== 0;
  root.querySelector("[data-tool-picker-count]").textContent =
    selectedTools === null ? "All" : selectedTools.size;
  root.querySelector("[data-tool-selection-status]").textContent =
    selectedTools === null
      ? "All tools selected"
      : `${selectedTools.size} selected`;
  const chips = root.querySelector("[data-tool-chips]");
  chips.parentElement.hidden = selectedTools === null;
  const selectedRows = evidence.rows.filter((row) =>
    selectedTools?.has(row.id),
  );
  chips.innerHTML =
    selectedTools === null
      ? ""
      : selectedRows
          .slice(0, 4)
          .map(
            (row) =>
              `<button type="button" class="fw-tool-chip" data-tool-remove="${row.id}" aria-label="Remove ${esc(row.label)}">${esc(row.label)}<span aria-hidden="true">×</span></button>`,
          )
          .join("") +
          (selectedRows.length > 4
            ? `<button type="button" class="fw-tool-chip" data-tool-show-more>+${selectedRows.length - 4} more</button>`
            : "") ||
        '<span class="fw-feature-selection-label">No tools selected</span>';
  updateOptions();
  updateSummary();
  if (save) {
    const url = new URL(location.href);
    url.searchParams.set("group", group);
    url.searchParams.set("display", displayMode);
    if (coverageSort === "support" && coverageDirection === "desc") {
      url.searchParams.delete("sort");
      url.searchParams.delete("order");
    } else {
      url.searchParams.set("sort", coverageSort);
      url.searchParams.set("order", coverageDirection);
    }
    url.searchParams.delete("q");
    if (selectedTools === null) url.searchParams.delete("tools");
    else url.searchParams.set("tools", [...selectedTools].sort().join(","));
    if (selectedTypes.length === types.length) url.searchParams.delete("types");
    else url.searchParams.set("types", selectedTypes.join(","));
    history.replaceState(null, "", url);
  }
}

function restore() {
  const params = new URLSearchParams(location.search);
  const allowed = [...featureGroups.map((group) => group.id), "all"];
  const requested =
    params.get("group") === "application" ? "routing" : params.get("group");
  group = allowed.includes(requested) ? requested : "all";
  displayMode = ["overview", "matrix"].includes(params.get("display"))
    ? params.get("display")
    : "overview";
  coverageSort = ["tool", "support", "supported"].includes(params.get("sort"))
    ? params.get("sort")
    : "support";
  coverageDirection = ["asc", "desc"].includes(params.get("order"))
    ? params.get("order")
    : coverageSort === "tool"
      ? "asc"
      : "desc";
  selectedTools = readToolSelection(params, evidence.rows);
  for (const input of types)
    input.checked =
      !params.has("types") ||
      params.get("types").split(",").includes(input.dataset.featureType);
  update(false);
}

function updateOptions() {
  const query = search.value.trim().toLowerCase();
  const selectedTypes = types
    .filter((input) => input.checked)
    .map((input) => input.dataset.featureType);
  let matches = 0;
  for (const option of options) {
    const row = evidence.rows.find(
      (row) => row.id === option.dataset.toolOption,
    );
    option.hidden =
      !row.label.toLowerCase().includes(query) ||
      !TOOL_GROUPS.some(
        (type) =>
          selectedTypes.includes(type.id) && type.kinds.includes(row.kind),
      );
    option.setAttribute(
      "aria-selected",
      String(selectedTools === null || selectedTools.has(row.id)),
    );
    if (!option.hidden) matches++;
    option.removeAttribute("data-active");
  }
  activeOption = null;
  search.removeAttribute("aria-activedescendant");
  root.querySelector("[data-tool-no-match]").hidden = matches !== 0;
}

function setPickerOpen(open, returnFocus = false) {
  pickerPanel.hidden = !open;
  picker.setAttribute("aria-expanded", String(open));
  search.setAttribute("aria-expanded", String(open));
  if (open) {
    search.value = "";
    updateOptions();
    search.focus();
  } else if (returnFocus) picker.focus();
}

function toggleTool(id) {
  if (selectedTools === null)
    selectedTools = new Set(evidence.rows.map((row) => row.id));
  if (selectedTools.has(id)) selectedTools.delete(id);
  else selectedTools.add(id);
  update();
}

function capabilityDetail(row, feature, expanded = false) {
  const capability = row.capabilities[feature.id];
  const status = supportStates[capability.status];
  const stateLabel =
    capability.status === "partial" ? capability.label : status.label;
  const assessment = capability.assessment;
  const assessmentMarkup = assessment
    ? `<aside class="fw-api-assessment"><h4>Design assessment</h4><p>${esc(assessment.summary)}</p><h5>Strengths</h5><ul>${assessment.strengths.map((point) => `<li>${esc(point)}</li>`).join("")}</ul><h5>Tradeoffs &amp; review gaps</h5><ul>${assessment.tradeoffs.map((point) => `<li>${esc(point)}</li>`).join("")}</ul><small>Based on linked documentation; hands-on ergonomics have not been rated.</small></aside>`
    : "";
  return `<details class="fw-feature-detail"${expanded ? " open" : ""}><summary><span class="fw-feature-detail-name">${esc(feature.label)}</span><span class="fw-feature-detail-status" data-support="${capability.status}">${status.symbol} ${esc(stateLabel)}</span><svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m5 6 3 3 3-3"/></svg></summary><div class="fw-feature-evidence">${capability.label && capability.status !== "partial" ? `<span class="fw-feature-evidence-label">${esc(capability.label)}</span>` : ""}<p>${esc(capability.note)}</p>${assessmentMarkup}<div class="fw-feature-evidence-footer"><details class="fw-feature-definition"><summary>What we compare</summary><p>${esc(feature.definition)}</p></details>${capability.url ? `<a href="${esc(capability.url)}" target="_blank" rel="noreferrer">Source ↗</a>` : ""}</div></div></details>`;
}

let profileRow = null;

function openFeatureDialog(title, content, row = null) {
  profileRow = row;
  root.querySelector("#feature-dialog-title").innerHTML = row
    ? `<img class="fw-logo" data-logo="${esc(row.id)}" src="${esc(row.logo)}" width="26" height="26" alt="">${esc(title)}`
    : esc(title);
  detail.innerHTML = content;
  detail.scrollTop = 0;
  dialog.showModal();
}

function profileCategory(row, categoryId) {
  const category = featureGroups.find((entry) => entry.id === categoryId);
  return `<h3 class="fw-profile-category-title">${esc(category.label)}</h3>${features
    .filter((feature) => feature.group === categoryId)
    .map((feature) => capabilityDetail(row, feature))
    .join("")}`;
}

function profileContent(row) {
  const selectedGroup = group === "all" ? featureGroups[0].id : group;
  const summary = summarizeCapabilities(row, "all");
  return `<div class="fw-profile-intro"><p>${esc(row.scope)}</p><span>${summary.supported} supported · Updated ${esc(row.updatedOn || row.reviewedOn)}</span></div><div class="fw-profile-layout"><nav class="fw-profile-nav" aria-label="Profile categories">${featureGroups.map((category) => `<button type="button" data-profile-category="${category.id}" aria-pressed="${category.id === selectedGroup}"><span>${esc(category.label)}</span><small>${features.filter((feature) => feature.group === category.id).length}</small></button>`).join("")}</nav><section class="fw-profile-capabilities" aria-label="Category capabilities">${profileCategory(row, selectedGroup)}</section></div>`;
}

root.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  if (button.dataset.coverageSort) {
    const key = button.dataset.coverageSort;
    coverageDirection =
      key === coverageSort
        ? coverageDirection === "asc"
          ? "desc"
          : "asc"
        : key === "tool"
          ? "asc"
          : "desc";
    coverageSort = key;
    update();
    return;
  }
  if (button.dataset.featureDisplay) {
    displayMode = button.dataset.featureDisplay;
    update();
    return;
  }
  if (button.dataset.coverageDetail) {
    const [rowId, status] = button.dataset.coverageDetail.split("/");
    const row = evidence.rows.find((entry) => entry.id === rowId);
    const selected = features.filter(
      (feature) =>
        (group === "all" || feature.group === group) &&
        row.capabilities[feature.id].status === status,
    );
    openFeatureDialog(
      `${row.label} · ${supportStates[status].label}`,
      `<div class="fw-profile-intro"><p>${selected.length} of ${summarizeCapabilities(row, group).total} capabilities. ${esc(supportStates[status].description)}</p></div><div class="fw-profile-findings">${selected.map((feature) => capabilityDetail(row, feature)).join("")}</div>`,
      row,
    );
    return;
  }
  if (button.hasAttribute("data-tool-show-more")) {
    setPickerOpen(true);
    return;
  }
  if (button === picker) {
    setPickerOpen(pickerPanel.hidden);
    return;
  }
  if (button.hasAttribute("data-tool-picker-done")) {
    setPickerOpen(false, true);
    return;
  }
  if (
    button.hasAttribute("data-tool-select-all") ||
    button.hasAttribute("data-tool-select-none")
  ) {
    selectedTools = button.hasAttribute("data-tool-select-all")
      ? null
      : new Set();
    update();
    search.focus();
    return;
  }
  if (button.dataset.toolOption) {
    toggleTool(button.dataset.toolOption);
    search.focus();
    return;
  }
  if (button.dataset.toolRemove) {
    const id = button.dataset.toolRemove;
    selectedTools?.delete(id);
    update();
    picker.focus();
    return;
  }
  if (button.hasAttribute("data-close-feature")) {
    dialog.close();
    return;
  }
  if (button.dataset.featureGroup) {
    group = button.dataset.featureGroup;
    update();
    root.querySelector(".fw-feature-table-scroll").scrollLeft = 0;
    return;
  }
  if (button.dataset.profileCategory && profileRow) {
    for (const option of detail.querySelectorAll("[data-profile-category]"))
      option.setAttribute("aria-pressed", String(option === button));
    const panel = detail.querySelector(".fw-profile-capabilities");
    panel.innerHTML = profileCategory(
      profileRow,
      button.dataset.profileCategory,
    );
    panel.scrollTop = 0;
    return;
  }
  if (button.dataset.featureDefinition) {
    const feature = features.find(
      (entry) => entry.id === button.dataset.featureDefinition,
    );
    openFeatureDialog(
      feature.label,
      `<p class="fw-profile-findings">${esc(feature.definition)}</p>`,
    );
    return;
  }
  const [rowId, featureId] = (
    button.dataset.featureCell ||
    button.dataset.featureProfile ||
    ""
  ).split("/");
  const row = evidence.rows.find((entry) => entry.id === rowId);
  if (!row) return;
  openFeatureDialog(
    row.label,
    featureId
      ? `<div class="fw-profile-intro"><p>${esc(row.scope)}</p><span>Reviewed ${esc(row.capabilities[featureId].reviewedOn || row.reviewedOn)}</span></div><div class="fw-profile-findings">${capabilityDetail(
          row,
          features.find((feature) => feature.id === featureId),
          true,
        )}</div>`
      : profileContent(row),
    row,
  );
});
dialog.addEventListener("click", (event) => {
  if (event.target !== dialog) return;
  const rect = dialog.getBoundingClientRect();
  if (
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom
  )
    dialog.close();
});
root
  .querySelector("[data-feature-mobile-category]")
  .addEventListener("change", (event) => {
    group = event.target.value;
    update();
    root.querySelector(".fw-feature-table-scroll").scrollLeft = 0;
  });
search.addEventListener("input", updateOptions);
search.addEventListener("keydown", (event) => {
  const visible = options.filter((option) => !option.hidden);
  if (
    ["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key) &&
    visible.length
  ) {
    event.preventDefault();
    const current = visible.indexOf(activeOption);
    const index =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? visible.length - 1
          : event.key === "ArrowDown"
            ? (current + 1) % visible.length
            : (current <= 0 ? visible.length : current) - 1;
    if (activeOption) activeOption.removeAttribute("data-active");
    activeOption = visible[index];
    activeOption.setAttribute("data-active", "");
    search.setAttribute("aria-activedescendant", activeOption.id);
    activeOption.scrollIntoView({ block: "nearest" });
  } else if (event.key === "Enter" && activeOption) {
    event.preventDefault();
    const option = activeOption;
    toggleTool(option.dataset.toolOption);
    activeOption = option;
    option.setAttribute("data-active", "");
    search.setAttribute("aria-activedescendant", option.id);
  }
});
pickerPanel.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    setPickerOpen(false, true);
  }
});
document.addEventListener("click", (event) => {
  if (!pickerPanel.hidden && !event.target.closest(".fw-tool-select"))
    setPickerOpen(false);
});
document.addEventListener("focusin", (event) => {
  if (!pickerPanel.hidden && !event.target.closest(".fw-tool-select"))
    setPickerOpen(false);
});
for (const input of types) input.addEventListener("change", () => update());
window.addEventListener("popstate", restore);
restore();
