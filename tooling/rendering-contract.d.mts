import type roster from "../rendering/canonical/roster.json";
import type workloads from "../rendering/canonical/workloads.json";
export function capturedRenderingContract(
  root: string,
  capture: unknown,
): {
  roster: typeof roster;
  workloads: typeof workloads;
};
