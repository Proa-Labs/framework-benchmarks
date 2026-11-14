import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";

// Same path + NUL + bytes + NUL framing as tooling/load/driver.mjs:sourceSha256.
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
    assert.match(path, /^[a-zA-Z0-9_./+()[\]-]+$/);
    assert.ok(!path.startsWith("/") && !path.split("/").includes(".."));
    // BSD tar treats member arguments as patterns even without a wildcard flag;
    // GNU tar treats these arguments literally. Preserve route brackets on both.
    const member =
      process.platform === "linux" ? path : path.replace(/[[\]]/g, "\\$&");
    const body = execFileSync("tar", ["-xOzf", archive, member], {
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

// Some older engineering captures declare hashes per input rather than one
// aggregate source fingerprint. Retain and verify those exact bytes too.
export function verifySourceInputs(archive, inputs) {
  const paths = execFileSync("tar", ["-tzf", archive], { encoding: "utf8" })
    .trim()
    .split("\n");
  assert.equal(new Set(paths).size, paths.length);
  assert.deepEqual(
    [...paths].sort(),
    inputs.map(({ path }) => path).sort(),
    "Retained input roster differs",
  );
  const types = execFileSync("tar", ["-tvzf", archive], { encoding: "utf8" })
    .trim()
    .split("\n");
  assert.ok(
    types.every((line) => line.startsWith("-")),
    "Source inputs must be regular files",
  );
  for (const input of inputs) {
    assert.match(input.path, /^[a-zA-Z0-9_./+()[\]-]+$/);
    assert.ok(
      !input.path.startsWith("/") && !input.path.split("/").includes(".."),
    );
    const member =
      process.platform === "linux"
        ? input.path
        : input.path.replace(/[[\]]/g, "\\$&");
    const body = execFileSync("tar", ["-xOzf", archive, member], {
      maxBuffer: 8 * 1024 * 1024,
    });
    assert.equal(
      createHash("sha256").update(body).digest("hex"),
      input.sha256,
      `Retained source changed: ${input.path}`,
    );
  }
}
