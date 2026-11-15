import { expect, test } from "bun:test";
import { verifyHeroCaptures } from "../../experiments/showcase/landing-hero/verify.mjs";

test("paired landing-page evidence preserves raw samples, allocator controls, parity and owned output", () => {
  expect(verifyHeroCaptures()).toBe(60);
});
