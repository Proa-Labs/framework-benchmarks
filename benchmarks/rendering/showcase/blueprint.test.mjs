import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { compileBlueprint } from "./blueprint.mjs";
import { renderReference } from "./fixture.mjs";
import { canonicalDigest } from "./import.mjs";
import { hydrateRecords } from "./prepare.mjs";
import { styleObject } from "./style.mjs";

test("shared template compiler preserves variable collection lengths, branches and literal code whitespace", () => {
  const html =
    "<html><head><title>Fixture</title></head><body><main><article><h2>One &amp; two</h2><ul><li>a</li><li>b</li></ul></article><article><h2>Three</h2><ul><li>c</li></ul></article><article><p>Alternate &lt;layout&gt;</p></article><pre><span>{ literal } </span>next</pre></main></body></html>";
  const { definition, records } = compileBlueprint(html, {
    id: "fixture",
    label: "Fixture",
    source: {},
  });
  assert.equal(
    canonicalDigest(renderReference(definition, hydrateRecords(records)[0])),
    canonicalDigest(html, { addRequest: true }),
  );
  assert.ok(
    definition.templates.some((t) => JSON.stringify(t).includes('"variant"')),
  );
});
test("prepared style parsing preserves quoted semicolons, data URLs and shorthand order", () => {
  assert.deepEqual(
    styleObject(
      'background-image:url("data:image/svg+xml;a;b");--x:"a;b";margin-top:1px;margin:2px;margin-top:3px',
    ),
    {
      backgroundImage: 'url("data:image/svg+xml;a;b")',
      "--x": '"a;b"',
      margin: "2px",
      marginTop: "3px",
    },
  );
});
for (const engine of ["react", "svelte", "vue", "handlebars", "marko"])
  test(`${engine}: every showcase passes complete HTML and changed-input admission`, {
    timeout: 60000,
  }, () => {
    const result = JSON.parse(
      execFileSync(
        process.execPath,
        [
          fileURLToPath(new URL("./native-probe.mjs", import.meta.url)),
          "--engine",
          engine,
        ],
        {
          env: { ...process.env, NODE_ENV: "production" },
          encoding: "utf8",
          maxBuffer: 4 * 1024 * 1024,
          timeout: 55000,
        },
      ),
    );
    assert.equal(result.length, 5);
    assert.ok(
      result.every((r) => r.status === "pass" && r.controls.length === 5),
    );
  });
