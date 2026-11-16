// These groups use the same declared roles shown in the classification guide.
export const TOOL_GROUPS = [
  {
    id: "frameworks",
    label: "Component Frameworks & Libraries",
    kinds: ["Application framework", "UI framework", "UI library", "Renderer"],
  },
  {
    id: "templates",
    label: "Template engines",
    kinds: ["Template engine", "Native templates"],
  },
];
export const ALL_GROUPS = TOOL_GROUPS.map((group) => group.id);
export function normalizeGroups(groups: string[]) {
  const expanded = groups.flatMap((id) =>
    id === "web-frameworks" || id === "components"
      ? ["frameworks"]
      : id === "baselines"
        ? ["templates"]
        : [id],
  );
  return ALL_GROUPS.filter((id) => expanded.includes(id));
}
export function matchesGroups(renderer: { kind: string }, groups: string[]) {
  const selected = normalizeGroups(groups);
  return TOOL_GROUPS.some(
    (group) =>
      selected.includes(group.id) && group.kinds.includes(renderer.kind),
  );
}
