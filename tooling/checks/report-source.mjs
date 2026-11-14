import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { verifySourceSnapshot } from "../capture/verify-source.mjs";

// The old rendering fingerprint includes this report test, although the timed
// runner never executes it. Verify the complete original snapshot, then allow
// only this test's bytes to differ. Every implementation, lock and roster byte
// still contributes to the original digest; changing any of them fails.
const reportTest = "benchmarks/rendering/canonical/report.test.mjs";
export function verifyReportTestOnlyChange(root, files, archive, expected) {
  verifySourceSnapshot(archive, expected, { prefix: "/" });
  assert.ok(files.includes(reportTest));
  const originalTest = execFileSync("tar", ["-xOzf", archive, reportTest]);
  const hash = createHash("sha256");
  for (const path of files) {
    hash.update(`/${path}\0`);
    hash.update(
      path === reportTest ? originalTest : readFileSync(join(root, path)),
    );
    hash.update("\0");
  }
  assert.equal(
    hash.digest("hex"),
    expected,
    "Measured implementation changed; rerun the complete campaign",
  );
}
