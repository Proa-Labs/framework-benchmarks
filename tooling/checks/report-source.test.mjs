import { test } from "bun:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { sourceDigest } from "../capture/captures.mjs";
import { verifyReportTestOnlyChange } from "./report-source.mjs";

test("report-test edits preserve source evidence; renderer and roster edits require recapture", () => {
  const root = mkdtempSync(join(tmpdir(), "report-source-"));
  try {
    const testFile = "benchmarks/rendering/canonical/report.test.mjs";
    const files = [testFile, "renderer.mjs", "roster.json"].sort();
    mkdirSync(join(root, "benchmarks/rendering/canonical"), {
      recursive: true,
    });
    for (const path of files) writeFileSync(join(root, path), "original");
    const expected = sourceDigest(root, files, "/");
    const archive = join(root, "source.tar.gz");
    execFileSync("tar", ["-czf", archive, "-C", root, ...files]);
    writeFileSync(join(root, testFile), "new test without archived data");
    verifyReportTestOnlyChange(root, files, archive, expected);
    for (const path of ["renderer.mjs", "roster.json"]) {
      writeFileSync(join(root, path), "changed");
      assert.throws(
        () => verifyReportTestOnlyChange(root, files, archive, expected),
        /Measured implementation changed/,
      );
      writeFileSync(join(root, path), "original");
    }
    writeFileSync(archive, "tampered");
    assert.throws(() =>
      verifyReportTestOnlyChange(root, files, archive, expected),
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
