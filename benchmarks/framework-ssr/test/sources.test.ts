import { expect, test } from "bun:test";
import { fileURLToPath } from "node:url";
import contract from "../contract.json";
import { frameworkSourceFiles } from "../sources.ts";

test("the measured source includes the Leptos adapter and fixture inputs", () => {
  const root = fileURLToPath(new URL("../../../", import.meta.url));
  const files = frameworkSourceFiles(root);
  const adapter = "benchmarks/framework-ssr/adapters/leptos";
  for (const file of [
    `${adapter}/Cargo.toml`,
    `${adapter}/Cargo.lock`,
    `${adapter}/src/main.rs`,
    `${adapter}/src/workloads.rs`,
    "benchmarks/framework-ssr/workloads.ts",
    "benchmarks/rendering/build.rs",
    "benchmarks/rendering/external/shared/suite_data.mjs",
    "benchmarks/rendering/showcase/generate-rust.mjs",
    "benchmarks/rendering/showcase/generate-views.mjs",
    "benchmarks/rendering/src/showcase/mod.rs",
    ...contract.workloads
      .slice(3)
      .flatMap(({ id }) => [
        `benchmarks/rendering/showcase/fixtures/${id}.json`,
        `benchmarks/rendering/showcase/fixtures/${id}.jsonl`,
      ]),
  ]) {
    expect(files).toContain(file);
  }
  expect(files).not.toContain(`${adapter}/fixture.json`);
});
