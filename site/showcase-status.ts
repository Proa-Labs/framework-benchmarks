import { createHash } from "node:crypto";
import { semantic } from "../benchmarks/rendering/showcase/business.mjs";
import {
  fixtures,
  loadFixture,
  renderReference,
} from "../benchmarks/rendering/showcase/fixture.mjs";
import type { Inputs } from "./benchmark-types.ts";

// An illustration may advance before a replacement timing campaign. Keep the
// immutable samples downloadable, but never rank them beside a different page.
export function pendingShowcaseFixtures(
  input: Pick<Inputs, "rendering" | "framework">,
) {
  const pending: Record<"rendering" | "framework", Record<string, string>> = {
    rendering: {},
    framework: {},
  };
  for (const { id } of fixtures) {
    const { definition, data } = loadFixture(id);
    const reason =
      "Results pending: this workload changed and must be remeasured across all frameworks.";
    if (
      input.rendering.parity.proa[id]?.canonical_sha256 !==
      definition.expectedDomSha256
    )
      pending.rendering[id] = reason;
    data.texts[definition.controls.requestIndex] = "fresh-b";
    const expected = createHash("sha256")
      .update(JSON.stringify(semantic(renderReference(definition, data))))
      .digest("hex");
    const engine = input.framework.engines.find((e) => e.id === "proa");
    if (
      (engine?.parityByWorkload?.[id] ?? engine?.parity)?.semanticSha256 !==
      expected
    )
      pending.framework[id] = reason;
  }
  return pending;
}
