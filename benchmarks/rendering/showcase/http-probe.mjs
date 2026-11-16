#!/usr/bin/env bun
// Production HTTP admission, independent of render-only API probes. Servers are
// local child processes and are always stopped; no timing numbers are collected.
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { validateShowcaseHtml } from "./admission.mjs";
import { fixtures, loadFixture, renderReference } from "./fixture.mjs";
import { canonicalDigest } from "./import.mjs";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const option = (key) => {
  const i = process.argv.indexOf(key);
  return i < 0 ? undefined : process.argv[i + 1];
};
const selected = option("--workload");
const engine = option("--engine"),
  port = Number(option("--port") ?? 4481);
assert.ok(["proa", "astro", "sveltekit", "nextjs", "exact"].includes(engine));
const temporary = mkdtempSync(join(tmpdir(), `showcase-http-${engine}-`));
const directory = join(
  root,
  "benchmarks/framework-ssr/adapters",
  engine === "nextjs" ? "next" : engine,
);
if (engine === "exact")
  assert.ok(selected, "Pass --workload when testing an isolated Exact app");
const args =
  engine === "exact"
    ? [
        process.execPath,
        join(root, "benchmarks/rendering/showcase/full-exact-server.mjs"),
      ]
    : engine === "proa"
      ? [option("--binary") ?? join(root, "target/release/framework-ssr-proa")]
      : [process.execPath, engine === "sveltekit" ? "server.ts" : "server.mjs"];
const child = Bun.spawn(args, {
  cwd: directory,
  env: {
    ...process.env,
    NODE_ENV: "production",
    PORT: String(port),
    HOST: "127.0.0.1",
    EXACT_SHOWCASE_WORKLOAD: selected,
    NEXT_TELEMETRY_DISABLED: "1",
  },
  stdout: Bun.file(join(temporary, "server.log")),
  stderr: Bun.file(join(temporary, "server-errors.log")),
});
try {
  let ready = false;
  for (let i = 0; i < 200; i++) {
    if (child.exitCode !== null)
      throw Error(`${engine} exited before listening; logs: ${temporary}`);
    try {
      const response = await fetch(`http://127.0.0.1:${port}/health`);
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {}
    await Bun.sleep(100);
  }
  assert.ok(ready, `${engine} startup timeout; logs: ${temporary}`);
  const results = [],
    firstBodies = new Map();
  for (const { id } of fixtures.filter((f) => !selected || f.id === selected))
    for (const request of ["first-request", "changed<&\"'✓", "first-request"]) {
      const { definition, data } = loadFixture(id);
      data.texts[definition.controls.requestIndex] = request;
      const url = new URL(`http://127.0.0.1:${port}/showcase/${id}`);
      url.searchParams.set("request", request);
      const response = await fetch(url, {
          headers: { "accept-encoding": "identity" },
        }),
        html = await response.text();
      writeFileSync(join(temporary, `${id}-${results.length}.html`), html);
      assert.equal(
        response.status,
        200,
        `${engine}/${id}: HTTP status; logs: ${temporary}`,
      );
      assert.match(response.headers.get("content-type") ?? "", /text\/html/);
      if (engine === "exact")
        validateShowcaseHtml(html, id, request, { adapted: true });
      else
        assert.equal(
          canonicalDigest(html),
          canonicalDigest(renderReference(definition, data)),
          `${engine}/${id}: complete HTTP document differs; logs: ${temporary}`,
        );
      if (request === "first-request") {
        if (firstBodies.has(id))
          assert.equal(
            html,
            firstBodies.get(id),
            `${engine}/${id}: repeated URL must be byte stable`,
          );
        else firstBodies.set(id, html);
      }
      results.push({ engine, id, request, status: "pass" });
    }
  console.log(JSON.stringify({ results, evidence: temporary }));
} finally {
  child.kill();
  await child.exited;
}
