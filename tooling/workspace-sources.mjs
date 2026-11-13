import { existsSync, globSync, readFileSync } from "node:fs";
import { join } from "node:path";

// A source snapshot must be able to reproduce the frozen workspace install,
// including manifests for workspaces outside the suite being measured.
export function workspaceSources(root) {
  const manifest = join(root, "package.json");
  if (!existsSync(manifest)) return [];
  const { workspaces } = JSON.parse(readFileSync(manifest, "utf8"));
  if (!workspaces) return [];
  const patterns = Array.isArray(workspaces) ? workspaces : workspaces.packages;
  return [
    "package.json",
    "bun.lock",
    "bunfig.toml",
    "turbo.json",
    "tooling/workspace-sources.mjs",
    "tooling/workspace-sources.d.mts",
    ...globSync(
      patterns.map((path) => `${path}/package.json`),
      { cwd: root },
    ),
  ].sort();
}
