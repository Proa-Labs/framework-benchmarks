import { features, supportStates } from "../feature-schema.mjs";

export const SUPPORTED_STATES = ["native", "official", "community"];

// Counts retain support states; no weights or implicit quality score.
export function summarizeCapabilities(row, group = "all") {
  const selected = features.filter(
    (feature) => group === "all" || feature.group === group,
  );
  const counts = Object.fromEntries(
    Object.keys(supportStates).map((status) => [status, 0]),
  );
  for (const feature of selected) counts[row.capabilities[feature.id].status]++;
  return {
    total: selected.length,
    counts,
    supported: SUPPORTED_STATES.reduce(
      (sum, status) => sum + counts[status],
      0,
    ),
  };
}

export function sortCoverageRows(rows, group, key = "tool", direction = "asc") {
  const count = (row) => {
    return summarizeCapabilities(row, group).supported;
  };
  const sign = direction === "desc" ? -1 : 1;
  return [...rows].sort((left, right) => {
    const name = left.label.localeCompare(right.label, "en", {
      sensitivity: "base",
    });
    return key === "tool"
      ? sign * name
      : sign * (count(left) - count(right)) || name;
  });
}

export function renderCoverageBar(row, group = "all") {
  const { total, counts } = summarizeCapabilities(row, group);
  const escapeLabel = (value) =>
    String(value).replace(
      /[&<>"']/g,
      (char) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[char],
    );
  return Object.entries(counts)
    .filter(([status, count]) => SUPPORTED_STATES.includes(status) && count > 0)
    .map(([status, count]) => {
      const label = `${row.label}: ${count} of ${total} ${supportStates[status].label.toLowerCase()}`;
      return `<button type="button" data-coverage="${status}" data-coverage-detail="${row.id}/${status}" style="--coverage-width:${(count / total) * 100}%" aria-label="${escapeLabel(label)}. View findings" title="${escapeLabel(label)}">${count / total >= 0.075 ? `<span class="fw-coverage-count">${count}</span>` : ""}</button>`;
    })
    .join("");
}
