import { expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  captureId,
  retainCapture,
  sourceDigest,
} from "../capture/captures.mjs";
import { verifyRetainedSource } from "../capture/retained-source.mjs";

test("retained source snapshots preserve literal framework route brackets", () => {
  const root = mkdtempSync(join(tmpdir(), "route-capture-"));
  try {
    const file = "app/[workload]/page.tsx";
    mkdirSync(join(root, "app/[workload]"), { recursive: true });
    writeFileSync(
      join(root, file),
      "export default function Page() { return null; }",
    );
    const result = {
      status: "pass",
      captureKind: "publication",
      captureId: captureId("routes"),
      source: { sourceSha256: sourceDigest(root, [file]) },
    };
    const results = join(root, "results");
    retainCapture(root, results, result, [file]);
    expect(() => verifyRetainedSource(results, result)).not.toThrow();
    for (const path of [
      "app/../secret",
      "/absolute",
      "app/*.tsx",
      "app/$(whoami).tsx",
    ])
      expect(() => sourceDigest(root, [path])).toThrow();
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
