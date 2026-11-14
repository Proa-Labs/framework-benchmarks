import { test } from "bun:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { copyGenerated, writeGenerated } from "../generated-files.ts";
import { generatedDirectory, prepareData } from "../prepare-data.ts";

test("unchanged generated files retain their inode and modification time", async () => {
  const dir = await mkdtemp(join(tmpdir(), "generated-stable-"));
  try {
    const source = join(dir, "source.json"),
      target = join(dir, "copied.json");
    await writeGenerated(source, '{"value":1}');
    await copyGenerated(source, target);
    const before = await stat(target);
    assert.equal(await writeGenerated(target, '{"value":1}'), false);
    await copyGenerated(source, target);
    const after = await stat(target);
    assert.equal(after.ino, before.ino);
    assert.equal(after.mtimeMs, before.mtimeMs);
    assert.equal(await writeGenerated(target, '{"value":2}'), true);
    assert.deepEqual(JSON.parse(await readFile(target, "utf8")), { value: 2 });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("concurrent readers see complete old or new JSON documents", async () => {
  const dir = await mkdtemp(join(tmpdir(), "generated-atomic-"));
  try {
    const path = join(dir, "results.json");
    await writeGenerated(
      path,
      JSON.stringify({ version: 1, payload: "a".repeat(500_000) }),
    );
    let done = false;
    const writer = writeGenerated(
      path,
      JSON.stringify({ version: 2, payload: "b".repeat(500_000) }),
    ).then(() => {
      done = true;
    });
    do {
      const snapshot = JSON.parse(await readFile(path, "utf8"));
      assert.ok(snapshot.version === 1 || snapshot.version === 2);
      assert.equal(snapshot.payload.length, 500_000);
      assert.equal(
        snapshot.payload,
        snapshot.version === 1 ? "a".repeat(500_000) : "b".repeat(500_000),
      );
    } while (!done);
    await writer;
    assert.equal(JSON.parse(await readFile(path, "utf8")).version, 2);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("revalidating unchanged captures does not rewrite live app inputs or previews", async () => {
  await prepareData();
  const paths = [
    "results.json",
    "features.json",
    "metadata.json",
    "public/previews/cards.html",
    "public/data/captures/framework.json",
  ];
  const before = await Promise.all(
    paths.map((p) => stat(join(generatedDirectory, p))),
  );
  await prepareData();
  const after = await Promise.all(
    paths.map((p) => stat(join(generatedDirectory, p))),
  );
  for (let i = 0; i < paths.length; i++) {
    assert.equal(after[i].mtimeMs, before[i].mtimeMs, paths[i]);
    assert.equal(after[i].ino, before[i].ino, paths[i]);
  }
}, 20000);
