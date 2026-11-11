import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import {
  closeSync,
  existsSync,
  fsyncSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { verifySourceSnapshot } from "./verify-source.mjs";

export function captureId(suite, at = new Date().toISOString()) {
  assert.match(suite, /^[a-z0-9-]+$/);
  assert.ok(Number.isFinite(Date.parse(at)), "Invalid capture date");
  return `${suite}-${at.replace(/[:.]/g, "-")}-${randomUUID().slice(0, 8)}`;
}
export function atomicWrite(path, body) {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.${randomUUID()}.partial`;
  let fd;
  try {
    fd = openSync(temporary, "wx");
    writeFileSync(fd, body);
    fsyncSync(fd);
    closeSync(fd);
    fd = undefined;
    renameSync(temporary, path);
  } finally {
    if (fd !== undefined) closeSync(fd);
    rmSync(temporary, { force: true });
  }
}
export function sourceDigest(root, files, prefix = "") {
  const hash = createHash("sha256");
  for (const path of files) {
    assert.match(path, /^[a-zA-Z0-9_./+()-]+$/);
    assert.ok(!path.startsWith("/") && !path.split("/").includes(".."));
    hash.update(`${prefix}${path}\0`);
    hash.update(readFileSync(join(root, path)));
    hash.update("\0");
  }
  return hash.digest("hex");
}
// Retain evidence before changing a public pointer. A duplicate ID is an error,
// including an identical result: archive paths are write-once, never an upsert.
export function retainCapture(
  root,
  results,
  result,
  files,
  { prefix = "" } = {},
) {
  assert.ok(
    result.status === "pass" ||
      (result.status === "generator-limited" &&
        result.captureKind === "engineering"),
    "Cannot retain an incomplete or invalid publication capture",
  );
  const id = retainedId(result);
  assert.match(id, /^[a-zA-Z0-9-]+$/);
  const expected =
    result.source?.sourceSha256 ?? result.provenance?.source_sha256;
  assert.ok(files.length > 0 && new Set(files).size === files.length);
  assert.equal(
    sourceDigest(root, files, prefix),
    expected,
    "Measured sources changed during capture; result was not published",
  );
  const archive = join(results, "archive", `${id}.json`);
  assert.ok(!existsSync(archive), `Capture already retained: ${id}`);
  const raw = join(results, "raw", id);
  mkdirSync(raw, { recursive: true });
  const snapshot = join(raw, "source.tar.gz");
  assert.ok(!existsSync(snapshot), `Source snapshot already exists: ${id}`);
  try {
    execFileSync("tar", ["-czf", snapshot, "-C", root, ...files], {
      stdio: "pipe",
    });
    verifySourceSnapshot(snapshot, expected, { sorted: false, prefix });
    mkdirSync(dirname(archive), { recursive: true });
    writeFileSync(archive, `${JSON.stringify(result, null, 2)}\n`, {
      flag: "wx",
    });
  } catch (error) {
    rmSync(snapshot, { force: true });
    throw error;
  }
  return { id, archive, snapshot };
}

export function retainedId(result) {
  return (
    result.captureId ??
    result.capture_id ??
    `retained-${createHash("sha256").update(JSON.stringify(result)).digest("hex").slice(0, 24)}`
  );
}
