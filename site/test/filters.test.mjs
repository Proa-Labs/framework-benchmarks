import assert from "node:assert/strict";
import test from "node:test";
import { loadInputs, normalize } from "../data.mjs";
import { ALL_GROUPS, matchesGroups } from "../src/filters.mjs";

test("tool filters match declared roles, combine by union, and allow no selection", async () => {
  const { input } = await loadInputs();
  const { renderers } = normalize(input);
  const ids = (groups) =>
    renderers.filter((r) => matchesGroups(r, groups)).map((r) => r.id);
  assert.equal(ids(ALL_GROUPS).length, renderers.length);
  assert.deepEqual(ids([]), []);
  assert.ok(ids(["templates"]).includes("askama"));
  assert.ok(!ids(["templates"]).includes("react"));
  assert.ok(ids(["frameworks"]).includes("react"));
  assert.ok(ids(["templates"]).includes("php"));
  assert.ok(ids(["templates"]).includes("go-html-template"));
  assert.deepEqual(
    new Set(ids(["frameworks", "templates"])),
    new Set([...ids(["frameworks"]), ...ids(["templates"])]),
  );
});
