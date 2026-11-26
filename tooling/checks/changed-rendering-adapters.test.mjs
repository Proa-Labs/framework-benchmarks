import { expect, test } from "bun:test";
import { changedRenderingAdapters } from "../../.github/scripts/changed-rendering-adapters.mjs";

const external = "benchmarks/rendering/external/";
const adapter = (id, cwd = `${external}${id}`, setup = "bun") => ({
  id,
  cwd,
  setup,
  args: ["suite_bench.mjs"],
});

test("selects registry-only additions, changed entries and implementation paths", () => {
  const before = {
    react: adapter("react"),
    "go-html-template": adapter("go-html-template", `${external}go`, "go"),
    vue: adapter("vue"),
    removed: adapter("removed"),
  };
  const after = {
    react: { ...before.react, args: ["another_bench.mjs"] },
    "go-html-template": before["go-html-template"],
    unlisted: adapter("unlisted", "."),
    vue: before.vue,
  };
  expect(
    changedRenderingAdapters(before, after, [
      "benchmarks/rendering/canonical/adapters.json",
      `${external}go/artifact\nsuite.go`,
      `${external}go-other/adapter.go`,
      `${external}removed/suite_bench.mjs`,
      `${external}vue/README.md`,
    ]),
  ).toEqual([
    { id: "go-html-template", setup: "go" },
    { id: "react", setup: "bun" },
    { id: "unlisted", setup: "bun" },
  ]);
  expect(
    changedRenderingAdapters(after, after, [`${external}unlisted/fixture.mjs`]),
  ).toEqual([{ id: "unlisted", setup: "bun" }]);
});

test("shared, generated and unrelated changes leave the focused matrix empty", () => {
  const registry = {
    react: adapter("react"),
    proa: adapter("proa", ".", "rust"),
  };
  expect(
    changedRenderingAdapters(registry, registry, [
      "benchmarks/rendering/src/lib.rs",
      "benchmarks/rendering/canonical/workloads.json",
      `${external}react/results/local/sample.json`,
      `${external}shared/suite_data.mjs`,
      `${external}react-else/suite_bench.mjs`,
      "bun.lock",
      "site/src/index.ts",
    ]),
  ).toEqual([]);
});

test("rejects unsafe matrix values", () => {
  expect(() =>
    changedRenderingAdapters({}, { "bad name": adapter("bad name") }, []),
  ).toThrow();
  expect(() =>
    changedRenderingAdapters(
      {},
      { foo: adapter("foo", `${external}foo`, "bun\nother") },
      [],
    ),
  ).toThrow();
});
