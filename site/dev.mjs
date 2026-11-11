import { watch } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { buildSite, outputDirectory, siteRoot } from "./build.mjs";
import { captures, repositoryRoot } from "./data.mjs";

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};
export async function startServer({
  port = Number(process.env.PORT || 4317),
  live = true,
  build = true,
} = {}) {
  if (build) await buildSite();
  const clients = new Set();
  const bootId = crypto.randomUUID();
  let revision = 0;
  const token = () => `${bootId}:${revision}`;
  const server = createServer(async (request, response) => {
    let pathname;
    try {
      pathname = decodeURIComponent(
        new URL(request.url, "http://localhost").pathname,
      );
    } catch {
      response.writeHead(400).end("Invalid URL");
      return;
    }
    // Match Cloudflare's clean HTML route redirects in the local preview.
    if (pathname === "/features.html") {
      const search = new URL(request.url, "http://localhost").search;
      response.writeHead(307, { location: `/features${search}` }).end();
      return;
    }
    if (live && pathname === "/__reload") {
      response.writeHead(200, {
        "content-type": "text/event-stream",
        "cache-control": "no-store",
        connection: "keep-alive",
      });
      response.write(`data: ${token()}\n\n`);
      clients.add(response);
      request.on("close", () => clients.delete(response));
      return;
    }
    pathname =
      {
        "/about": "/about.html",
        "/methodology": "/methodology.html",
        "/features": "/features.html",
      }[pathname] ?? pathname;
    const file = resolve(
      outputDirectory,
      `.${pathname === "/" ? "/index.html" : pathname}`,
    );
    if (!file.startsWith(outputDirectory + sep)) {
      response.writeHead(403).end("Forbidden");
      return;
    }
    try {
      const info = await stat(file);
      if (!info.isFile()) throw new Error("not a file");
      let bytes = await readFile(file);
      if (
        live &&
        extname(file) === ".html" &&
        !pathname.startsWith("/previews/")
      )
        bytes = Buffer.from(
          bytes
            .toString()
            .replace(
              "</body>",
              `<script>new EventSource("/__reload").onmessage=({data})=>{if(data!==${JSON.stringify(token())})location.reload()}</script></body>`,
            ),
        );
      response.writeHead(200, {
        "content-type": types[extname(file)] || "application/octet-stream",
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
      });
      response.end(bytes);
    } catch {
      response.writeHead(404, { "content-type": "text/html; charset=utf-8" });
      response.end(await readFile(join(outputDirectory, "404.html")));
    }
  });
  await new Promise((ready, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", ready);
  });
  const watchers = [];
  let timer,
    rebuilding = false,
    pending = false;
  const rebuild = async () => {
    if (rebuilding) {
      pending = true;
      return;
    }
    rebuilding = true;
    try {
      await buildSite();
      revision += 1;
      for (const client of clients) client.write(`data: ${token()}\n\n`);
    } catch (error) {
      console.error(error.message);
    } finally {
      rebuilding = false;
      if (pending) {
        pending = false;
        void rebuild();
      }
    }
  };
  if (live) {
    for (const directory of [join(siteRoot, "src"), join(siteRoot, "public")]) {
      watchers.push(
        watch(directory, { recursive: true }, () => {
          clearTimeout(timer);
          timer = setTimeout(rebuild, 120);
        }),
      );
    }
    for (const file of [
      join(siteRoot, "data.mjs"),
      join(siteRoot, "catalog.json"),
      join(siteRoot, "features-data.mjs"),
      join(siteRoot, "feature-schema.mjs"),
      join(siteRoot, "feature-evidence.mjs"),
      join(siteRoot, "feature-audit.mjs"),
      join(siteRoot, "features-page.mjs"),
      ...Object.values(captures).map((path) => join(repositoryRoot, path)),
    ]) {
      watchers.push(
        watch(file, () => {
          clearTimeout(timer);
          timer = setTimeout(rebuild, 120);
        }),
      );
    }
  }
  const address = server.address();
  console.log(`Frameworks local preview: http://127.0.0.1:${address.port}`);
  return {
    url: `http://127.0.0.1:${address.port}`,
    close: async () => {
      clearTimeout(timer);
      for (const watcher of watchers) watcher.close();
      for (const client of clients) client.end();
      server.closeAllConnections();
      await new Promise((done) => server.close(done));
    },
  };
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const server = await startServer();
  for (const signal of ["SIGINT", "SIGTERM"])
    process.once(signal, async () => {
      await server.close();
      process.exit(0);
    });
}
