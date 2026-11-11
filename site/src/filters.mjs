// These groups use the same declared roles shown in the classification guide.
export const TOOL_GROUPS = [
  {
    id: "frameworks",
    label: "Frameworks & UI",
    kinds: ["Application framework", "UI framework", "UI library", "Renderer"],
  },
  {
    id: "templates",
    label: "Template engines",
    kinds: ["Template engine", "Native templates"],
  },
];
export const ALL_GROUPS = TOOL_GROUPS.map((group) => group.id);
export function matchesGroups(renderer, groups) {
  return TOOL_GROUPS.some(
    (group) => groups.includes(group.id) && group.kinds.includes(renderer.kind),
  );
}
