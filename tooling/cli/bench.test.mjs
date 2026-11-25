import { expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
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
import { planAdapterCheck, planRun, root, scaffoldAdapter } from "./bench.mjs";

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
    const canonical = join(destination, "benchmarks/rendering/canonical");
    mkdirSync(canonical, { recursive: true });
    mkdirSync(join(destination, "benchmarks/rendering/external"));
    mkdirSync(join(destination, "tooling/adapters"), { recursive: true });
    for (const file of [
      "benchmarks/rendering/canonical/workloads.json",
      "tooling/adapters/string-adapter.mjs",
    ]) {
      copyFileSync(join(root, file), join(destination, file));
    }
    writeFileSync(join(canonical, "adapters.json"), "{}");
    const roster = '{"renderers":[]}';
    writeFileSync(join(canonical, "roster.json"), roster);

    const label = 'Example "Renderer" $& ADAPTER_ID';
    scaffoldAdapter("example", destination, [
      "--label",
      label,
      "--package",
      "@example/renderer@1.2.3-rc.1+build",
    ]);

    const example = readAdapters(destination).example;
    expect(example).toMatchObject({
      command: "{bun}",
      setup: "bun",
      label,
      versionPackage: "@example/renderer",
    });
    expect(readFileSync(join(canonical, "roster.json"), "utf8")).toBe(roster);
    expect(
      JSON.parse(readFileSync(join(destination, example.cwd, "package.json"))),
    ).toEqual({
      name: "proa-bench-example",
      private: true,
      type: "module",
      dependencies: { "@example/renderer": "1.2.3-rc.1+build" },
    });

    const { command, smoke } = planAdapterCheck("example", [], destination);
    expect(smoke).toBe(false);
    expect(command.slice(0, -2)).toEqual([
      suites.rendering.entry,
      "--smoke",
      "--renderers",
      "example",
      "--workloads",
      "cards",
      "--parity-only",
    ]);

    const invocation = adapterInvocation(example, destination, {
      bun: process.execPath,
    });
    const run = spawnSync(
      invocation.command,
      [...invocation.args, "--workload", "cards", "--dump-only"],
      { cwd: invocation.cwd, encoding: "utf8" },
    );
    expect(run.status).toBe(1);
    expect(run.stderr).toContain("Implement example render(cards)");
    const sourcePath = join(invocation.cwd, invocation.args[0]);
    writeFileSync(
      sourcePath,
      readFileSync(sourcePath, "utf8").replace(
        /throw new Error\(.*\);/,
        'return "<p>Test output</p>";',
      ),
    );
    const outputPath = join(destination, "result.json");
    const result = spawnSync(
      invocation.command,
      [
        ...invocation.args,
        "--workload",
        "cards",
        "--warmup",
        "0",
        "--iterations",
        "1",
        "--out",
        outputPath,
      ],
      { cwd: invocation.cwd, encoding: "utf8" },
    );
    expect(result.status).toBe(0);
    expect(JSON.parse(readFileSync(outputPath, "utf8"))).toMatchObject({
      framework_id: "example",
      framework: label,
      iterations: 1,
    });

    expect(() => scaffoldAdapter("example", destination)).toThrow();
    expect(() => scaffoldAdapter("../bad", destination)).toThrow();
    for (const spec of [
      "@example/renderer",
      "@example/renderer@latest",
      "renderer@^1.2.3",
      "renderer@1.2",
      "renderer@01.2.3",
      "renderer@1.2.3-01",
      "renderer@https://example.com/renderer.tgz",
    ]) {
      expect(() =>
        scaffoldAdapter("invalid", destination, ["--package", spec]),
      ).toThrow("exact version");
    }
    expect(Object.keys(readAdapters(destination))).toEqual(["example"]);
  } finally {
    rmSync(destination, { recursive: true, force: true });
  }
});
test("focused checks accept workload selection and keep smoke output local", () => {
  const path = "benchmarks/rendering/results/local/react-check.json";
  const { command, workloads, smoke } = planAdapterCheck("react", [
    "--workloads",
    "cards, table",
    "--smoke",
    "--out",
    path,
  ]);
  expect(smoke).toBe(true);
  expect(workloads).toBe("cards,table");
  expect(command).toEqual([
    suites.rendering.entry,
    "--smoke",
    "--renderers",
    "react",
    "--workloads",
    "cards,table",
    "--out",
    path,
  ]);
  expect(() => planAdapterCheck("not-registered", [])).toThrow(
    "Unknown rendering adapter",
  );
  expect(() =>
    planAdapterCheck("react", ["--workloads", "cards,cards"]),
  ).toThrow("Invalid workload selection");
  expect(() => planAdapterCheck("react", ["--publish"])).toThrow();
  expect(() => planAdapterCheck("react", ["--out", path])).toThrow(
    "--out requires --smoke",
  );
  expect(() =>
    planAdapterCheck("react", [
      "--smoke",
      "--out",
      "benchmarks/rendering/results/latest.json",
    ]),
  ).toThrow("results/local");
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
