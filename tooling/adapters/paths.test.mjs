import { test } from "bun:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { repositoryRoot } from "../repository.mjs";
import { readAdapters } from "./adapters.mjs";

test("native adapter binaries resolve inside their current build directory", () => {
  const root = repositoryRoot(import.meta.url);
  for (const adapter of Object.values(readAdapters(root))) {
    const cwd = resolve(root, adapter.cwd);
    assert.ok(existsSync(cwd), `${adapter.id}: missing working directory`);
    if (!adapter.command.startsWith("{root}/") || adapter.setup === "rust")
      continue;
    let parent = dirname(adapter.command.replace("{root}", root));
    while (!existsSync(parent)) parent = dirname(parent);
    assert.ok(
      !relative(cwd, parent).startsWith(".."),
      `${adapter.id}: binary points outside its build directory`,
    );
  }
});
