import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { hostMetadata } from "../../../load/driver.mjs";
import { renderingSourceFingerprint } from "../../canonical/source_fingerprint.mjs";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const source =
  process.env.EXACT_SOURCE || join(root, "framework-ssr/.cache/exact");
const expected = "94b8671f70fe2e25b307a40e7fce66dc27c9f802";
const revision = Bun.spawnSync(["git", "rev-parse", "HEAD"], { cwd: source });
assert.equal(revision.exitCode, 0);
assert.equal(
  revision.stdout.toString().trim(),
  expected,
  "Recheck capability evidence when Exact changes",
);
const temporary = await mkdtemp(join(tmpdir(), "exact-fixture-admission-"));
const cells = [];
try {
  for (const workload of ["cards", "products", "table"]) {
    const fixture = await readFile(
      join(root, `rendering/external/svelte/suite_${workload}.svelte`),
      "utf8",
    );
    const literalClass = /class="([^"]+)"/.exec(fixture)?.[1];
    assert.ok(literalClass);
    const app = join(temporary, workload);
    await mkdir(app);
    await writeFile(
      join(app, "app.json"),
      JSON.stringify({
        name: "Shared SSR fixture admission",
        id: "run.frameworks.fixture",
        start_url: "/",
        app: {
          id: "run.frameworks.fixture",
          name: "Shared SSR fixture admission",
        },
        host: { web: {} },
      }),
    );
    await writeFile(
      join(app, "app.contract"),
      `routes nav\n  page "/" render=request\n\ncomponent App\n  view\n    view class=${JSON.stringify(literalClass)}\n      text "${workload}"\n`,
    );
    const build = Bun.spawnSync(
      [
        process.execPath,
        join(source, "host/web-js/build.mjs"),
        app,
        "--production",
        "--render",
        "js",
        "--out",
        join(app, "dist"),
      ],
      {
        cwd: source,
        env: {
          ...process.env,
          EXACT_APP_DIR: app,
          EXACT_FEEDBACK: "0",
          NODE_ENV: "production",
        },
        stdout: "pipe",
        stderr: "pipe",
      },
    );
    const diagnostics = build.stderr.toString() + build.stdout.toString();
    assert.notEqual(
      build.exitCode,
      0,
      "Reassess unsupported status when Exact accepts the unchanged fixture attribute",
    );
    assert.match(
      diagnostics,
      /\[type-class-name\]/,
      "Only the verified compiler capability error can justify this status",
    );
    cells.push({
      workload,
      status: "unsupported",
      literalClass,
      diagnostic: "type-class-name",
    });
  }
} finally {
  await rm(temporary, { recursive: true, force: true });
}
const directory = join(root, "rendering/results/local/admission");
await mkdir(directory, { recursive: true });
await writeFile(
  join(directory, "exact.json"),
  `${JSON.stringify({ engine: "exact", version: expected, sourceSha256: renderingSourceFingerprint(root), host: hostMetadata(), cells }, null, 2)}\n`,
);
console.log(
  "Exact: literal class attributes from all three unchanged fixtures rejected by pinned compiler. No timing admitted.",
);
