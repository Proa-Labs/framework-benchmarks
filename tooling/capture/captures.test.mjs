import { expect, test } from "bun:test";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  atomicWrite,
  captureId,
  retainCapture,
  sourceDigest,
} from "./captures.mjs";
import { verifyRetainedSource } from "./retained-source.mjs";

test("same-clock reruns have distinct IDs, immutable evidence and atomic pointers", () => {
  const root = mkdtempSync(join(tmpdir(), "captures-"));
  try {
    writeFileSync(join(root, "source.mjs"), "export const fixture = 32;");
    const files = ["source.mjs"];
    const id = captureId("test", "2026-11-10T00:00:00Z");
    expect(captureId("test", "2026-11-10T00:00:00Z")).not.toBe(id);
    const result = {
      status: "pass",
      captureKind: "publication",
      captureId: id,
      source: { sourceSha256: sourceDigest(root, files) },
    };
    const results = join(root, "results");
    atomicWrite(join(results, "latest.json"), "previous publication");
    const retained = retainCapture(root, results, result, files);
    verifyRetainedSource(results, result);
    expect(() => retainCapture(root, results, result, files)).toThrow();
    expect(readFileSync(join(results, "latest.json"), "utf8")).toBe(
      "previous publication",
    );
    writeFileSync(
      join(root, "source.mjs"),
      "source changed during measurement",
    );
    const next = { ...result, captureId: captureId("test") };
    expect(() => retainCapture(root, results, next, files)).toThrow(/changed/);
    expect(existsSync(join(results, "archive", `${next.captureId}.json`))).toBe(
      false,
    );
    // A historical snapshot remains verifiable even after the current source changes.
    verifyRetainedSource(results, result);
    expect(() =>
      verifyRetainedSource(results, { ...result, status: "incomplete" }),
    ).toThrow();
    expect(() =>
      retainCapture(root, results, { ...next, status: "incomplete" }, files),
    ).toThrow();
    writeFileSync(retained.snapshot, "corrupt archive");
    expect(() => verifyRetainedSource(results, result)).toThrow();
    atomicWrite(join(results, "latest.json"), "replacement");
    expect(readFileSync(join(results, "latest.json"), "utf8")).toBe(
      "replacement",
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
