import { readFileSync } from "node:fs";
import http from "node:http";
import { handler } from "./dist/server/entry.mjs";

if (!globalThis.Bun)
  throw new Error("Run this adapter with the pinned Bun runtime");
if (process.env.NODE_ENV !== "production")
  throw new Error("Production build required");
const version = JSON.parse(
  readFileSync(new URL("./node_modules/astro/package.json", import.meta.url)),
).version;
http
  .createServer((request, response) => {
    if (request.url === "/health" || request.url === "/metrics") {
      response.writeHead(200, {
        "content-type": "application/json",
        "cache-control": "no-store",
      });
      const usage = process.cpuUsage();
      response.end(
        JSON.stringify(
          request.url === "/health"
            ? {
                status: "ok",
                engine: "astro",
                framework: `Astro ${version}`,
                nodeEnv: process.env.NODE_ENV,
                runtime: `Bun ${Bun.version}`,
              }
            : { cpuTimeMicros: usage.user + usage.system },
        ),
      );
    } else
      handler(request, response, () => {
        response.statusCode = 404;
        response.end("Not found");
      });
  })
  .listen(Number(process.env.PORT), "127.0.0.1");
