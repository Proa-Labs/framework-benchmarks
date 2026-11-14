import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { currentPath, evidencePath } from "../repository.mjs";
import { verifySourceInputs } from "./verify-source.mjs";

const digest = (body) => createHash("sha256").update(body).digest("hex");

// Source relocation cannot make an old capture describe the current harness.
// When its declared inputs have changed, validate the retained measured bytes
// and raw records instead. New captures still verify their current inputs.
export function verifyCapturedInputs(root, capture, expectedInputs) {
  const inputs = capture.provenance.inputs;
  assert.deepEqual(
    inputs.map(({ path }) => currentPath(path)),
    expectedInputs,
    "Capture input roster changed",
  );
  if (
    inputs.every(({ path, sha256 }) => {
      const file = evidencePath(root, path);
      return existsSync(file) && digest(readFileSync(file)) === sha256;
    })
  )
    return;
  const raw = capture.raw_artifact;
  assert.ok(
    raw && raw.encoding === "gzip",
    "Changed capture inputs require retained raw evidence",
  );
  assert.match(raw.path, /^[a-zA-Z0-9_./+-]+\.json\.gz$/);
  assert.ok(!raw.path.startsWith("/") && !raw.path.split("/").includes(".."));
  const file = evidencePath(root, raw.path);
  const compressed = readFileSync(file);
  assert.equal(digest(compressed), raw.sha256, "Retained raw artifact changed");
  const decoded = gunzipSync(compressed);
  assert.equal(
    digest(decoded),
    raw.uncompressed_sha256,
    "Retained raw samples changed",
  );
  // Published records omit only the bulky per-sample array, retained in gzip.
  const records = JSON.parse(decoded.toString()).map(
    ({ raw_ns, ...record }) => {
      assert.ok(
        Array.isArray(raw_ns) && raw_ns.length > 0,
        "Retained samples missing",
      );
      return record;
    },
  );
  assert.deepEqual(
    records,
    capture.records,
    "Capture records differ from retained raw samples",
  );
  verifySourceInputs(file.replace(/\.json\.gz$/, ".sources.tar.gz"), inputs);
}
