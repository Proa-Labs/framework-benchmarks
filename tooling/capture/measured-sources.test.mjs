import { expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { readMeasuredSources } from "./measured-sources.mjs";

test("data-only manifests never execute runners and reject unsafe/ambiguous paths", async () => {
  const dir = await mkdtemp(join(tmpdir(), "measured-sources-"));
  const file = join(dir, "run.mjs");
  try {
    await writeFile(file, 'throw new Error("Never execute this runner");');
    await writeFile(join(dir, "sources.json"), '["bun.lock","src/server.mjs"]');
    expect(await readMeasuredSources(pathToFileURL(file))).toEqual([
      "bun.lock",
      "src/server.mjs",
    ]);
    for (const invalid of [
      [],
      ["../outside"],
      ["/absolute"],
      ["same", "same"],
      ["z", "a"],
    ]) {
      await writeFile(join(dir, "sources.json"), JSON.stringify(invalid));
      await expect(readMeasuredSources(file)).rejects.toThrow();
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
