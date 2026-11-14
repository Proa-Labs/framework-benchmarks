import { expect, test } from "bun:test";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import suites from "../../benchmarks/suites.json" with { type: "json" };
import {
  adapterInvocation,
  readAdapters,
  selectIds,
} from "../adapters/adapters.mjs";
import { runStringAdapter } from "../adapters/string-adapter.mjs";
import { planRun, root, scaffoldAdapter } from "./bench.mjs";

test("run plans default to local smoke and reject ambiguous publication options", () => {
  for (const id of Object.keys(suites)) {
    const args = planRun(id, []);
    expect(args[0]).toBe(suites[id].entry);
    expect(args[args.indexOf("--out") + 1]).toContain("/results/local/");
    expect(planRun(id, ["--publish"])).toEqual([suites[id].entry]);
    expect(() =>
      planRun(id, ["--out", "benchmarks/rendering/results/latest.json"]),
    ).toThrow();
    expect(() => planRun(id, ["--unknown"])).toThrow();
    expect(() => planRun(id, ["--out"])).toThrow();
    expect(() => planRun(id, ["--out", "a", "--out", "b"])).toThrow();
  }
  const custom = planRun("http", ["--duration", "2", "--out", "test.json"]);
  expect(custom.filter((x) => x === "--duration")).toHaveLength(1);
  expect(custom[custom.indexOf("--duration") + 1]).toBe("2");
  expect(() => planRun("http", ["--smoke", "--publish"])).toThrow();
});
test("registry covers public roster and selection does not silently admit unknown IDs", () => {
  const adapters = readAdapters(root);
  const roster = JSON.parse(
    readFileSync(join(root, "benchmarks/rendering/canonical/roster.json")),
  );
  for (const row of roster.renderers) {
    expect(adapters[row.id].label).toBe(row.label);
    expect(adapters[row.id].language).toBe(row.language);
  }
  expect(selectIds("vue,react", [], Object.keys(adapters), "renderer")).toEqual(
    ["vue", "react"],
  );
  for (const value of ["", "unknown", "react,react"])
    expect(() =>
      selectIds(value, [], Object.keys(adapters), "renderer"),
    ).toThrow();
  expect(adapterInvocation(adapters.react, root, { bun: "/bun" }).command).toBe(
    "/bun",
  );
});
test("scaffold adds local adapter wiring, refuses overwrites, and leaves public roster alone", () => {
  const destination = mkdtempSync(join(tmpdir(), "adapter-scaffold-"));
  try {
    mkdirSync(join(destination, "benchmarks/rendering/canonical"), {
      recursive: true,
    });
    mkdirSync(join(destination, "benchmarks/rendering/external"));
    writeFileSync(
      join(destination, "benchmarks/rendering/canonical/adapters.json"),
      "{}",
    );
    scaffoldAdapter("example", destination);
    expect(readAdapters(destination).example.command).toBe("{bun}");
    expect(
      readFileSync(
        join(
          destination,
          "benchmarks/rendering/external/example/suite_bench.mjs",
        ),
        "utf8",
      ),
    ).toContain('id: "example"');
    expect(() => scaffoldAdapter("example", destination)).toThrow();
    expect(() => scaffoldAdapter("../bad", destination)).toThrow();
  } finally {
    rmSync(destination, { recursive: true, force: true });
  }
});
test("shared string harness times calls, retains a complete result and refuses asynchronous output", () => {
  let calls = 0;
  const result = runStringAdapter(
    {
      id: "sample",
      label: "Sample",
      language: "JS",
      allocationPolicy: "fresh owned string",
      render: () => `<p>${++calls}</p>`,
    },
    ["--workload", "cards", "--warmup", "2", "--iterations", "5"],
  );
  expect(calls).toBe(8);
  expect(result.iterations).toBe(5);
  expect(result.p50_us).toBeGreaterThanOrEqual(0);
  expect(() =>
    runStringAdapter({ render: async () => "HTML" }, ["--workload", "cards"]),
  ).toThrow();
});
