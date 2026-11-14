import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { workspaceSources } from "./workspace-sources.mjs";

// Data-only manifest: importing a runner would start a capture.
export async function readMeasuredSources(runner) {
  const path =
    runner instanceof URL || String(runner).startsWith("file:")
      ? fileURLToPath(runner)
      : runner;
  const files = JSON.parse(
    await readFile(join(dirname(path), "sources.json"), "utf8"),
  );
  assert.ok(
    Array.isArray(files) && files.length > 0,
    "sources.json must be a nonempty array",
  );
  assert.equal(new Set(files).size, files.length, "Duplicate measured source");
  assert.deepEqual(files, [...files].sort(), "Measured paths must be sorted");
  for (const file of files) {
    assert.equal(typeof file, "string");
    assert.match(file, /^[a-zA-Z0-9_./+()[\]-]+$/);
    assert.ok(!file.startsWith("/") && !file.split("/").includes(".."));
  }
  return [
    ...new Set([...files, ...workspaceSources(dirname(dirname(path)))]),
  ].sort();
}
