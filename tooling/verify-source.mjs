import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";

// Same path + NUL + bytes + NUL framing as load/driver.mjs:sourceSha256.
// Read archive entries without extracting or executing the captured source.
export function verifySourceSnapshot(
  archive,
  expected,
  { sorted = true, prefix = "" } = {},
) {
  const paths = execFileSync("tar", ["-tzf", archive], { encoding: "utf8" })
    .trim()
    .split("\n");
  assert.ok(paths.length > 0);
  assert.equal(new Set(paths).size, paths.length);
  if (sorted) assert.deepEqual(paths, [...paths].sort());
  const hash = createHash("sha256");
  for (const path of paths) {
    assert.match(path, /^[a-zA-Z0-9_./+()-]+$/);
    assert.ok(!path.startsWith("/") && !path.split("/").includes(".."));
    const body = execFileSync("tar", ["-xOzf", archive, path], {
      maxBuffer: 8 * 1024 * 1024,
    });
    hash.update(`${prefix}${path}`);
    hash.update("\0");
    hash.update(body);
    hash.update("\0");
  }
  assert.equal(
    hash.digest("hex"),
    expected,
    "Captured source snapshot fingerprint differs",
  );
}
