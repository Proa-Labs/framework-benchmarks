import { test } from "bun:test";
import assert from "node:assert/strict";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { siteRoot } from "../prepare-data.ts";

// Build output and dependencies contain JavaScript; authored website code must not.
test("website source, scripts and tests remain TypeScript", async () => {
  const generated = new Set([
    "node_modules",
    ".generated",
    ".wrangler",
    "dist",
    "test-results",
  ]);
  const javascript: string[] = [];
  async function inspect(directory: string) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (entry.isDirectory() && !generated.has(entry.name))
        await inspect(join(directory, entry.name));
      else if (entry.isFile() && /\.(?:js|jsx|mjs|cjs)$/.test(entry.name))
        javascript.push(join(directory, entry.name));
    }
  }
  await inspect(siteRoot);
  assert.deepEqual(javascript, []);
});
