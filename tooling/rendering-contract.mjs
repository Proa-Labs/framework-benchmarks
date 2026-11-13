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
  const archive = join(root, "rendering/results/raw", id, "source.tar.gz");
  const read = (name) =>
    JSON.parse(
      execFileSync(
        "tar",
        ["-xOzf", archive, `rendering/canonical/${name}.json`],
        { encoding: "utf8", maxBuffer: 1024 * 1024 },
      ),
    );
  return { roster: read("roster"), workloads: read("workloads") };
}
