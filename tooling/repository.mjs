import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Find the workspace by its manifest, independently of a script's nesting.
export function findRepositoryRoot(from = import.meta.url) {
  let directory = dirname(
    from instanceof URL || String(from).startsWith("file:")
      ? fileURLToPath(from)
      : from,
  );
  for (;;) {
    const manifest = join(directory, "package.json");
    if (
      existsSync(manifest) &&
      JSON.parse(readFileSync(manifest, "utf8")).name === "@proa/benchmarks"
    )
      return directory;
    const parent = dirname(directory);
    if (parent === directory) return null;
    directory = parent;
  }
}

export function repositoryRoot(from = import.meta.url) {
  const root = findRepositoryRoot(from);
  if (!root) throw new Error(`Cannot locate benchmark workspace from ${from}`);
  return root;
}

// Historical capture payloads and source archives keep their original paths.
// Translate only when locating a file in the current checkout, never when
// hashing or rewriting captured evidence.
export const previousDirectories = {
  rendering: "benchmarks/rendering",
  "framework-ssr": "benchmarks/framework-ssr",
  "page-load": "benchmarks/http",
  "suspense-load": "benchmarks/streaming",
  "cold-start": "benchmarks/cold-start",
  sveltekit: "experiments/sveltekit-streaming",
  showcase: "experiments/showcase",
  "travel-agent": "experiments/travel-agent",
  "agent-chain": "experiments/agent-chain",
};

export function currentPath(path) {
  for (const [before, after] of Object.entries(previousDirectories)) {
    if (path === before || path.startsWith(`${before}/`))
      return after + path.slice(before.length);
  }
  return path;
}

export function evidencePath(root, path) {
  const original = join(root, path);
  return existsSync(original) ? original : join(root, currentPath(path));
}
