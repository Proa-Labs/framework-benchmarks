import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export function readAdapters(root) {
  const adapters = JSON.parse(
    readFileSync(
      resolve(root, "benchmarks/rendering/canonical/adapters.json"),
      "utf8",
    ),
  );
  for (const [id, entry] of Object.entries(adapters)) {
    assert.match(id, /^[a-z][a-z0-9-]*$/);
    assert.equal(entry.id, id);
    for (const key of ["label", "language", "command", "cwd"])
      assert.ok(
        typeof entry[key] === "string" && entry[key].length,
        `${id}: missing ${key}`,
      );
    assert.ok(
      [
        "bun",
        "rust",
        "rails",
        "jte",
        "rocker",
        "go",
        "jinja2",
        "php",
        "custom",
      ].includes(entry.setup),
      `${id}: unsupported setup`,
    );
    assert.ok(
      Array.isArray(entry.args) &&
        entry.args.every((x) => typeof x === "string"),
    );
    assert.ok(
      !entry.build ||
        (Array.isArray(entry.build) &&
          entry.build.length &&
          entry.build.every((x) => typeof x === "string")),
    );
    assert.ok(
      !entry.versionPackage || typeof entry.versionPackage === "string",
      `${id}: invalid versionPackage`,
    );
    assert.ok(
      !entry.versionCommand ||
        (Array.isArray(entry.versionCommand) &&
          entry.versionCommand.length &&
          entry.versionCommand.every((x) => typeof x === "string")),
      `${id}: invalid versionCommand`,
    );
    assert.ok(
      !entry.cwd.startsWith("/") && !entry.cwd.split("/").includes(".."),
      `${id}: cwd must stay in the repository`,
    );
  }
  return adapters;
}
export function selectIds(value, defaults, available, label) {
  const ids =
    value === undefined ? defaults : value.split(",").map((x) => x.trim());
  assert.ok(
    ids.length > 0 &&
      new Set(ids).size === ids.length &&
      ids.every((id) => available.includes(id)),
    `Invalid ${label} selection. Choose unique IDs from: ${available.join(", ")}`,
  );
  return ids;
}
export function adapterInvocation(entry, root, { bun, bundle } = {}) {
  const substitute = (value) =>
    value.replace(/\{(root|bun|bundle|id)\}/g, (_, key) => {
      const replacement = { root, bun, bundle, id: entry.id }[key];
      assert.ok(replacement, `Missing ${key} for ${entry.id}`);
      return replacement;
    });
  return {
    command: substitute(entry.command),
    args: entry.args.map(substitute),
    cwd: resolve(root, entry.cwd),
  };
}
