#!/usr/bin/env node

// Presentation-only wrapper around the real streaming fixture. Benchmark
// runners continue to request the original server directly.
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import http from "node:http";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

const root = fileURLToPath(new URL("../../", import.meta.url));
const option = (name, fallback) => {
  const index = process.argv.indexOf(name);
  return index < 0 ? fallback : process.argv[index + 1];
};
const engine = option("--engine", "react");
if (!["proa", "react", "marko"].includes(engine)) {
  throw new Error("--engine must be proa, react, or marko");
}
const css = await readFile(new URL("./preview.css", import.meta.url));
let child;
let upstreamUrl = option("--upstream", null);
if (!upstreamUrl) {
  const probe = http.createServer();
  await new Promise((resolve) => probe.listen(0, "127.0.0.1", resolve));
  const port = probe.address().port;
  await new Promise((resolve) => probe.close(resolve));
  const commands = {
    proa: ["./target/release/proa_suspense_server", []],
    react: [process.execPath, ["benchmarks/streaming/react_server.mjs"]],
    marko: [process.execPath, ["benchmarks/rendering/external/marko/suspense_server.mjs"]],
  };
  const [command, args] = commands[engine];
  child = spawn(command, args, {
    cwd: root,
    env: { ...process.env, NODE_ENV: "production", PORT: String(port), PROA_HOST: "127.0.0.1", SUSPENSE_HOST: "127.0.0.1", PROA_WORKER_THREADS: "1" },
    stdio: ["ignore", "inherit", "inherit"],
  });
  let startupError;
  child.on("error", (error) => { startupError = error; });
  upstreamUrl = `http://127.0.0.1:${port}/`;
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (startupError) throw startupError;
    if (child.exitCode !== null) throw new Error(`${engine} server exited before startup`);
    try {
      const response = await fetch(new URL("/health", upstreamUrl), { signal: AbortSignal.timeout(1_000) });
      if (response.ok) { ready = true; break; }
    } catch {}
    await delay(100);
  }
  if (!ready) { child.kill(); throw new Error("Streaming fixture did not become ready"); }
}

const head = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Fieldnote — Suspense marketplace preview</title><link rel="stylesheet" href="/preview.css"></head><body>
<header class="site-header"><a class="wordmark" href="/">fieldnote<span>®</span></a><span class="brand-note">GOOD FINDS. LONG STORIES.</span><a class="browse-link" href="#collections">Explore the collection <span>↗</span></a></header>
<div class="page-kicker" id="collections"><span>THE COLLECTOR'S EDIT</span><span>OBJECTS WORTH KEEPING / VOL. 08</span></div>`;
const tail = `<footer class="site-footer"><span>fieldnote® — A little more considered.</span><span>Suspense marketplace · ${engine} preview</span></footer></body></html>`;
const server = http.createServer((request, response) => {
  if (request.url === "/health" || request.url === "/metrics") {
    const upstream = http.get(new URL(request.url, upstreamUrl), (stream) => {
      const chunks = [];
      stream.on("data", (chunk) => chunks.push(chunk));
      stream.on("end", () => {
        try {
          const value = JSON.parse(Buffer.concat(chunks).toString("utf8"));
          if (request.url === "/metrics") {
            const usage = process.resourceUsage();
            value.upstreamCpuTimeMicros = value.cpuTimeMicros;
            value.previewCpuTimeMicros = usage.userCPUTime + usage.systemCPUTime;
            value.cpuTimeMicros += value.previewCpuTimeMicros;
          } else {
            value.preview = { status: "ok", pid: process.pid };
          }
          response.writeHead(stream.statusCode, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
          response.end(JSON.stringify(value));
        } catch { response.writeHead(502).end("Invalid fixture metrics"); }
      });
      stream.on("error", () => response.destroy());
    });
    upstream.on("error", () => response.writeHead(502).end("Streaming fixture unavailable"));
    response.on("close", () => upstream.destroy());
    return;
  }
  if (request.url === "/preview.css") {
    response.writeHead(200, { "content-type": "text/css; charset=utf-8" });
    response.end(css);
    return;
  }
  if (request.url !== "/") { response.writeHead(404).end("Not found"); return; }
  const upstream = http.get(upstreamUrl, (stream) => {
    if (stream.statusCode !== 200) {
      response.writeHead(502).end("Streaming fixture returned an error");
      stream.resume();
      return;
    }
    response.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
    response.write(head);
    stream.pipe(response, { end: false });
    stream.on("end", () => response.end(tail));
    stream.on("error", () => response.destroy());
  });
  upstream.on("error", () => {
    if (!response.headersSent) response.writeHead(502).end("Streaming fixture unavailable");
    else response.destroy();
  });
  response.on("close", () => upstream.destroy());
});
server.on("error", (error) => { child?.kill(); throw error; });
const stop = () => { child?.kill(); server.close(); };
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
server.listen(Number(option("--port", 5720)), "127.0.0.1", () => {
  console.log(`Styled ${engine} preview: http://127.0.0.1:${server.address().port}`);
});
