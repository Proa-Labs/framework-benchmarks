import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { workspaceSources } from "../../tooling/capture/workspace-sources.mjs";

// Shared by capture and publication checks, including newly added adapter files.
export function frameworkSourceFiles(root: string) {
  const files = execFileSync(
    "git",
    [
      "ls-files",
      "-z",
      "--cached",
      "--others",
      "--exclude-standard",
      "--",
      "benchmarks/framework-ssr",
      "tooling/capture/captures.mjs",
      "tooling/capture/raw.mjs",
      "tooling/capture/verify-source.mjs",
      "tooling/load/driver.mjs",
      "tooling/load/worker.mjs",
      "tooling/stats.mjs",
      "Cargo.lock",
      "Cargo.toml",
      "package.json",
      "bun.lock",
      "bunfig.toml",
      "turbo.json",
      "benchmarks/rendering/src",
      "benchmarks/rendering/build.rs",
      "benchmarks/rendering/showcase",
      "benchmarks/rendering/Cargo.toml",
      "benchmarks/rendering/external/shared/suite_data.mjs",
      "benchmarks/rendering/external/shared/suite_data.d.mts",
    ],
    { cwd: root, encoding: "utf8" },
  )
    .split("\0")
    .filter(
      (p) =>
        p &&
        existsSync(join(root, p)) &&
        !p.startsWith("benchmarks/framework-ssr/results/") &&
        !p.endsWith(".md") &&
        !/\.test\.[cm]?[jt]sx?$/.test(p),
    )
    .sort();
  return [...new Set([...files, ...workspaceSources(root)])].sort();
}
