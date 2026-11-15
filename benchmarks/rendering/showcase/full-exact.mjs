// Build the shared native Contract through Exact's ordinary production web host,
// including its real data source, head, checkpoint and response pipeline.
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { exactContract, exactPlan } from "./exact-plan.mjs";
import { fixtureDirectory, loadFixture } from "./fixture.mjs";

const root = fileURLToPath(new URL("../../../", import.meta.url));
function objectInput(plan, data) {
  const input = plan.typedInput(data),
    memo = new Map();
  function record(index, array) {
    if (memo.has(array)) return memo.get(array);
    const spec = plan.specs[index],
      value = {};
    memo.set(array, value);
    let cursor = 0;
    for (let i = 0; i < spec.texts; i++) value[`t${i}`] = array[cursor++];
    for (let i = 0; i < spec.variants; i++) value[`v${i}`] = array[cursor++];
    for (let i = 0; i < spec.styles; i++) value[`s${i}`] = array[cursor++];
    for (let i = 0; i < spec.numbers.length; i++)
      value[`n${i}`] = array[cursor++];
    for (let i = 0; i < spec.css.length; i++) value[`c${i}`] = array[cursor++];
    for (const group of spec.groups)
      value[`g${group.exactGroup}`] = array[cursor++].map((child) =>
        record(group.template, child),
      );
    if (cursor === 0) value.unused = array[cursor++];
    assert.equal(cursor, array.length);
    return value;
  }
  return record(plan.definition.entry, input);
}
export function buildFullExact(id, exactSource) {
  const fixture = loadFixture(id),
    styles = JSON.parse(
      readFileSync(
        new URL(`${id}.exact-styles.json`, fixtureDirectory),
        "utf8",
      ),
    );
  const directory = join(
      root,
      "benchmarks/rendering/showcase/.generated/exact",
      id,
    ),
    adaptation = JSON.parse(
      readFileSync(join(directory, "adaptation.json"), "utf8"),
    );
  const plan = exactPlan(fixture.definition, fixture.prepared, styles),
    native = exactContract(plan, styles, {
      omitStyles: new Set(
        adaptation.omittedStyles.map((value) => JSON.stringify(value)),
      ),
      omitAttributes: new Set(adaptation.omittedAttributes),
    });
  let source =
    `routes nav\n  page "/showcase/${id}" render=request\n  notfound render=request\n\n` +
    native.source;
  source = source
    .replace(
      "  resource freshness = preparedRequest() as shape Freshness else empty()",
      '  derive request = searchParam(top(nav), "request")',
    )
    .replace(
      `      Component${fixture.definition.entry}(data=page, request=freshness.value)`,
      `      head title=page.t${fixture.definition.controls.titleIndex}\n      Component${fixture.definition.entry}(data=page, request=request)`,
    );
  const app = join(directory, "full");
  mkdirSync(app, { recursive: true });
  writeFileSync(join(app, "app.contract"), source);
  writeFileSync(
    join(app, "input.json"),
    JSON.stringify(objectInput(plan, fixture.data)),
  );
  writeFileSync(
    join(app, "app.json"),
    JSON.stringify({
      name: fixture.data.texts[fixture.definition.controls.titleIndex],
      id: "run.frameworks.showcase",
      app: { id: "run.frameworks.showcase", name: "Framework showcase" },
      host: { web: {} },
      data: native.dataWords,
    }),
  );
  writeFileSync(
    join(app, "app.ts"),
    `import input from './input.json';export const appId='run.frameworks.showcase';export const grants='';export const answer=(source:string)=>{if(source==='prepared')return input;throw new Error('Unknown source '+source);};`,
  );
  const result = Bun.spawnSync(
    [
      process.execPath,
      join(exactSource, "host/web-js/build.mjs"),
      app,
      "--production",
      "--render",
      "js",
      "--out",
      join(app, "dist"),
    ],
    {
      cwd: exactSource,
      env: {
        ...process.env,
        EXACT_APP_DIR: app,
        EXACT_FEEDBACK: "0",
        NODE_ENV: "production",
      },
      stdout: "pipe",
      stderr: "pipe",
      maxBuffer: 24 * 1024 * 1024,
    },
  );
  writeFileSync(
    join(app, "compiler.log"),
    result.stdout.toString() + result.stderr.toString(),
  );
  assert.equal(
    result.exitCode,
    0,
    `${id}: full production host build failed; ${join(app, "compiler.log")}`,
  );
}
