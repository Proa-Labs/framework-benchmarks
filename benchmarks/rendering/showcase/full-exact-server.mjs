// Exact's official production renderer/pageServer, one isolated app per workload.
import assert from "node:assert/strict";
import { extname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { fixtures } from "./fixture.mjs";

const id = process.env.EXACT_SHOWCASE_WORKLOAD;
assert.equal(process.env.NODE_ENV, "production");
assert.ok(fixtures.some((f) => f.id === id));
const root = fileURLToPath(new URL("../../../", import.meta.url));
const source =
  process.env.EXACT_SOURCE ??
  join(root, "benchmarks/framework-ssr/.cache/exact");
const { renderer, pageServer } = await import(
  pathToFileURL(join(source, "host/web-js/render.mjs")).href
);
const dist = join(
  root,
  "benchmarks/rendering/showcase/.generated/exact",
  id,
  "full/dist",
);
const page = pageServer(dist, renderer(dist), () => {});
Bun.serve({
  hostname: "127.0.0.1",
  port: Number(process.env.PORT),
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/health")
      return Response.json({
        status: "ok",
        engine: "exact",
        framework: "Exact 94b8671f70fe",
        runtime: `Bun ${Bun.version}`,
        nodeEnv: process.env.NODE_ENV,
      });
    if (url.pathname === "/metrics") {
      const cpu = process.cpuUsage();
      return Response.json({ cpuTimeMicros: cpu.user + cpu.system });
    }
    const file = resolve(dist, `.${url.pathname}`);
    if (
      file.startsWith(`${dist}/`) &&
      !file.includes("/.gen/") &&
      extname(file) &&
      (await Bun.file(file).exists())
    )
      return new Response(Bun.file(file));
    const { status, headers, body } = await page(
      url.pathname + url.search,
      (name) => request.headers.get(name),
    );
    return new Response(body, { status, headers });
  },
});
