import { readFileSync } from "node:fs";
import http from "node:http";
import next from "next";

const version = JSON.parse(
  readFileSync(new URL("./node_modules/next/package.json", import.meta.url)),
).version;
if (!globalThis.Bun)
  throw new Error("Run this adapter with the pinned Bun runtime");
if (process.env.NODE_ENV !== "production")
  throw new Error("Production build required");
const app = next({ dev: false, dir: new URL(".", import.meta.url).pathname });
await app.prepare();
const handler = app.getRequestHandler();
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
                engine: "nextjs",
                framework: `Next.js ${version}`,
                nodeEnv: process.env.NODE_ENV,
                runtime: `Bun ${Bun.version}`,
              }
            : { cpuTimeMicros: usage.user + usage.system },
        ),
      );
    } else
      handler(request, response).catch((error) => {
        console.error(error);
        response.statusCode = 500;
        response.end("SSR failed");
      });
  })
  .listen(Number(process.env.PORT), "127.0.0.1");
