import { expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { readMeasuredSources } from "../capture/measured-sources.mjs";
import { workspaceSources } from "../capture/workspace-sources.mjs";
import { repositoryRoot } from "../repository.mjs";

const root = repositoryRoot(import.meta.url);
const installed = (workspace, name) =>
  realpathSync(
    createRequire(join(root, workspace, "package.json")).resolve(
      `${name}/package.json`,
    ),
  );

test("one frozen lock serves all workspaces and shares matching versions without crossing React versions", () => {
  const locks = execFileSync(
    "git",
    [
      "ls-files",
      "--cached",
      "--others",
      "--exclude-standard",
      "--",
      "*bun.lock",
      "*package-lock.json",
      "pnpm-lock.yaml",
    ],
    { cwd: root, encoding: "utf8" },
  )
    .trim()
    .split("\n")
    .filter((path) => existsSync(join(root, path)));
  expect(locks).toEqual(["bun.lock"]);
  const baseline = installed(".", "react");
  expect(JSON.parse(readFileSync(baseline, "utf8")).version).toBe("19.2.4");
  for (const workspace of [
    "benchmarks/rendering/external/react",
    "benchmarks/rendering/external/bun",
    "benchmarks/rendering/external/next",
    "benchmarks/framework-ssr/adapters/next",
  ])
    expect(installed(workspace, "react")).toBe(baseline);
  const site = installed("site", "react");
  expect(site).not.toBe(baseline);
  expect(JSON.parse(readFileSync(site, "utf8")).version).toBe("19.3.0");
  expect(
    installed("benchmarks/framework-ssr/adapters/sveltekit", "svelte"),
  ).toBe(installed("benchmarks/rendering/external/svelte", "svelte"));
});

test("source snapshots retain all manifests needed to reproduce a frozen workspace install", async () => {
  const dependencies = workspaceSources(root);
  expect(dependencies).toContain("site/package.json");
  expect(dependencies).toContain(
    "benchmarks/framework-ssr/adapters/next/package.json",
  );
  for (const suite of [
    "benchmarks/http",
    "benchmarks/cold-start",
    "benchmarks/streaming",
  ]) {
    const files = await readMeasuredSources(join(root, suite, "run.mjs"));
    for (const path of dependencies) expect(files).toContain(path);
    for (const path of files) expect(existsSync(join(root, path))).toBe(true);
  }
});

test("parallel framework builds share one fixture prerequisite and never restore cached measurements", () => {
  const plan = JSON.parse(
    execFileSync(
      join(root, "node_modules/.bin/turbo"),
      ["run", "build", "--filter=framework-ssr-*", "--dry=json"],
      { cwd: root, encoding: "utf8" },
    ),
  );
  const builds = plan.tasks.filter((task) => task.task === "build");
  expect(builds).toHaveLength(3);
  for (const task of builds) {
    expect(task.dependencies).toContain("//#prepare:fixtures");
    expect(task.resolvedTaskDefinition.cache).toBe(false);
  }
  const config = JSON.parse(readFileSync(join(root, "turbo.json"), "utf8"));
  for (const task of ["bench", "capture", "test:browser", "deploy"])
    expect(config.tasks[task].cache).toBe(false);
});
