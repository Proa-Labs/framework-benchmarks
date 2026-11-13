import { expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { verifyPublication } from "./publication.mjs";

test("a selected Proa-only review blocks merging and production publication", async () => {
  const root = mkdtempSync(join(tmpdir(), "proa-review-gate-"));
  try {
    mkdirSync(join(root, "site"));
    writeFileSync(join(root, "site/proa-refresh.json"), "{}");
    await expect(verifyPublication(root)).rejects.toThrow(
      "Proa-only review refresh selected",
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
