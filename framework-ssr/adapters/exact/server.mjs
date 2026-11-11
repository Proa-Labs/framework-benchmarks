import { dirname, extname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const source = process.env.EXACT_SOURCE || resolve(here, "../../.cache/exact");
const { renderer, pageServer } = await import(
  pathToFileURL(resolve(source, "host/web-js/render.mjs")).href
);
const dist = resolve(here, "dist");
const page = pageServer(dist, renderer(dist), () => {});
if (process.env.NODE_ENV !== "production")
  throw new Error("Production build required");
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
      const usage = process.cpuUsage();
      return Response.json({ cpuTimeMicros: usage.user + usage.system });
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
