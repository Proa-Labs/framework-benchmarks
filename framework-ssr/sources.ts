import { execFileSync } from "node:child_process";

// Shared by capture and publication checks, including newly added adapter files.
export function frameworkSourceFiles(root: string) {
  return execFileSync(
    "git",
    [
      "ls-files",
      "-z",
      "--cached",
      "--others",
      "--exclude-standard",
      "--",
      "framework-ssr",
      "tooling/captures.mjs",
      "tooling/verify-source.mjs",
      "load/driver.mjs",
      "load/worker.mjs",
      "suspense-load/stats.mjs",
      "Cargo.lock",
      "Cargo.toml",
      "package.json",
      "bun.lock",
      "rendering/src",
      "rendering/Cargo.toml",
      "rendering/external/shared/suite_data.mjs",
      "rendering/external/shared/suite_data.d.mts",
    ],
    { cwd: root, encoding: "utf8" },
  )
    .split("\0")
    .filter((p) => p && !p.startsWith("framework-ssr/results/"))
    .sort();
}
