import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { workspaceSources } from "../../../tooling/capture/workspace-sources.mjs";

const sourcePaths = [
  ".nvmrc",
  "Cargo.lock",
  "tooling/maintenance/proa-refresh-evidence.mjs",
  "Cargo.toml",
  "package.json",
  "bunfig.toml",
  "turbo.json",
  "bun.lock",
  "tooling/adapters/adapters.mjs",
  "tooling/capture/captures.mjs",
  "tooling/capture/verify-source.mjs",
  "tooling/adapters/string-adapter.mjs",
  "tooling/adapters/owned-adapter.mjs",
  "tooling/capture/rendering-contract.mjs",
  "tooling/load/driver.mjs",
  "tooling/stats.mjs",
  "benchmarks/rendering/Cargo.toml",
  "benchmarks/rendering/build.rs",
  "benchmarks/rendering/canonical",
  "benchmarks/rendering/src",
  "fixtures/legacy-ebay-chrome",
  "benchmarks/rendering/templates",
  "benchmarks/rendering/external",
];

export function renderingSourceFiles(workspaceDirectory) {
  const output = execFileSync(
    "git",
    [
      "ls-files",
      "-z",
      "--cached",
      "--others",
      "--exclude-standard",
      "--",
      ...sourcePaths,
    ],
    { cwd: workspaceDirectory, encoding: "utf8" },
  );
  return [
    ...new Set([
      ...output.split("\0").filter(Boolean),
      ...workspaceSources(workspaceDirectory),
    ]),
  ].sort();
}

export function renderingSourceFingerprint(workspaceDirectory) {
  const hash = createHash("sha256");
  for (const relativePath of renderingSourceFiles(workspaceDirectory)) {
    hash.update(`/${relativePath}`);
    hash.update("\0");
    try {
      hash.update(readFileSync(join(workspaceDirectory, relativePath)));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      hash.update("<deleted>");
    }
    hash.update("\0");
  }
  return hash.digest("hex");
}
