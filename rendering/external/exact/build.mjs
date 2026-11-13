import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const here = fileURLToPath(new URL("./", import.meta.url));
export const source =
  process.env.EXACT_SOURCE ||
  resolve(here, "../../../framework-ssr/.cache/exact");
export const version = "94b8671f70fe2e25b307a40e7fce66dc27c9f802";
if (!existsSync(resolve(source, "Cargo.toml"))) {
  mkdirSync(resolve(source, ".."), { recursive: true });
  execFileSync(
    "git",
    [
      "clone",
      "--no-checkout",
      "--filter=blob:none",
      "https://github.com/expo/exact.git",
      source,
    ],
    { stdio: "inherit" },
  );
  execFileSync("git", ["fetch", "--depth=1", "origin", version], {
    cwd: source,
    stdio: "inherit",
  });
  execFileSync("git", ["checkout", "--detach", version], {
    cwd: source,
    stdio: "inherit",
  });
}
assert.equal(
  execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: source,
    encoding: "utf8",
  }).trim(),
  version,
);
execFileSync("git", ["diff", "--quiet"], { cwd: source });
execFileSync(process.execPath, ["install", "--frozen-lockfile"], {
  cwd: source,
  stdio: "inherit",
});
for (const workload of ["cards", "products", "table"]) {
  const app = resolve(here, "build", workload);
  mkdirSync(app, { recursive: true });
  copyFileSync(
    resolve(here, `${workload}.contract`),
    resolve(app, "app.contract"),
  );
  writeFileSync(
    resolve(app, "app.json"),
    JSON.stringify({
      name: "SSR adapted fixture",
      id: "run.frameworks.render",
      app: { id: "run.frameworks.render", name: "SSR adapted fixture" },
      host: { web: {} },
      data: ["section", "card-id", "row-id"],
    }),
  );
  execFileSync(
    process.execPath,
    [
      resolve(source, "host/web-js/build.mjs"),
      app,
      "--production",
      "--render",
      "js",
      "--out",
      resolve(app, "dist"),
    ],
    {
      cwd: source,
      stdio: "inherit",
      env: {
        ...process.env,
        EXACT_APP_DIR: app,
        EXACT_FEEDBACK: "0",
        NODE_ENV: "production",
      },
    },
  );
  // Keep the official compiler output and runtime unchanged. The benchmark entry
  // exposes only app construction, resource seeding and native serialization.
  writeFileSync(
    resolve(app, "dist/.gen/bench-entry.js"),
    `import app from './app.js';\nimport {checkpoint} from './rt.js';\nglobalThis.prepareInput = value => { checkpoint().kept = new Map([['${workload === "cards" ? "sections" : workload === "products" ? "products" : "rows"}',[[],value]]]); };\nglobalThis.renderFixture = () => { app(); return '<div id="exact-root">' + document.rootHTML() + '</div>'; };\n`,
  );
  const result = await Bun.build({
    entrypoints: [resolve(app, "dist/.gen/bench-entry.js")],
    target: "bun",
    format: "iife",
    minify: false,
    define: {
      "globalThis.__exactRender": "true",
      "import.meta.url": JSON.stringify(
        pathToFileURL(resolve(app, "dist/app.js")).href,
      ),
    },
  });
  assert.ok(result.success, "Compile native Exact benchmark entry");
  writeFileSync(resolve(app, "bench.js"), await result.outputs[0].text());
}
