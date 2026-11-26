import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import { posix } from "node:path";
import { pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";

const registryPath = "benchmarks/rendering/canonical/adapters.json";

export function changedRenderingAdapters(before, after, paths) {
  const implementationPaths = paths.filter(
    (path) => !path.endsWith(".md") && !path.includes("/results/"),
  );
  const matrix = [];
  for (const [id, entry] of Object.entries(after)) {
    assert.match(id, /^[a-z][a-z0-9-]*$/);
    assert.equal(entry.id, id);
    const directory = posix.normalize(entry.cwd).replace(/\/$/, "");
    const changedFiles = implementationPaths.some(
      (path) =>
        path.startsWith(`benchmarks/rendering/external/${id}/`) ||
        (directory !== "." && path.startsWith(`${directory}/`)),
    );
    if (changedFiles || !isDeepStrictEqual(before[id], entry)) {
      assert.match(entry.setup, /^[a-z][a-z0-9-]*$/);
      matrix.push({ id, setup: entry.setup });
    }
  }
  return matrix.sort((a, b) => a.id.localeCompare(b.id, "en"));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const git = (args) => execFileSync("git", args, { encoding: "utf8" });
  // pull_request checks out the tested merge commit. Its first parent is the
  // exact base of that merge, so base-branch changes do not select adapters.
  const base = git(["rev-parse", "HEAD^1"]).trim();
  const before = JSON.parse(git(["show", `${base}:${registryPath}`]));
  const after = JSON.parse(git(["show", `HEAD:${registryPath}`]));
  const paths = git(["diff", "--name-only", "--no-renames", "-z", base, "HEAD"])
    .split("\0")
    .filter(Boolean);
  const output = JSON.stringify(changedRenderingAdapters(before, after, paths));
  if (process.env.GITHUB_OUTPUT)
    appendFileSync(process.env.GITHUB_OUTPUT, `matrix=${output}\n`);
  console.log(output);
}
