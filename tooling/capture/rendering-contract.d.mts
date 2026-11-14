import type roster from "../../benchmarks/rendering/canonical/roster.json";
import type workloads from "../../benchmarks/rendering/canonical/workloads.json";
export function capturedRenderingContract(
  root: string,
  capture: unknown,
): {
  roster: typeof roster;
  workloads: typeof workloads;
  sourceDirectory: string;
};
