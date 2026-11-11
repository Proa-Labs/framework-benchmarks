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
