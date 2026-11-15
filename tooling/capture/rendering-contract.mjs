import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { retainedId } from "./captures.mjs";

// A retained capture keeps its original admission contract when the current
// roster grows. This reads JSON only; validateCapture separately verifies the
// complete source archive. Publication still requires current source hashes.
export function capturedRenderingContract(root, capture) {
  const id = retainedId(capture);
  assert.match(id, /^[a-zA-Z0-9-]+$/);
  const archive = join(
    root,
    "benchmarks/rendering/results/raw",
    id,
    "source.tar.gz",
  );
  const entries = new Set(
    execFileSync("tar", ["-tzf", archive], { encoding: "utf8" })
      .trim()
      .split("\n"),
  );
  const directories = [
    "benchmarks/rendering/canonical",
    "rendering/canonical",
  ].filter((directory) =>
    ["roster", "workloads"].every((name) =>
      entries.has(`${directory}/${name}.json`),
    ),
  );
  assert.equal(
    directories.length,
    1,
    "Source archive must contain one complete rendering contract",
  );
  const read = (name) =>
    JSON.parse(
      execFileSync(
        "tar",
        ["-xOzf", archive, `${directories[0]}/${name}.json`],
        { encoding: "utf8", maxBuffer: 1024 * 1024 },
      ),
    );
  return {
    roster: read("roster"),
    workloads: read("workloads"),
    sourceDirectory: directories[0],
  };
}
