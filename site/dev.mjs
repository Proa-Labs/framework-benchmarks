import { execFile } from "node:child_process";
import { watch } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { createServer as createViteServer } from "vite";
import { buildSite, outputDirectory, siteRoot } from "./build.mjs";
import { captures, repositoryRoot } from "./data.mjs";
import { prepareData } from "./prepare-data.mjs";

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".xml": "application/xml",
  ".txt": "text/plain",
  ".png": "image/png",
  ".webp": "image/webp",
};
export async function startServer({
  port = Number(process.env.PORT || 4317),
  live = true,
  build = true,
} = {}) {
  if (live) return startViteDev(port);
  if (build) await buildSite();
  const server = createServer(async (request, response) => {
    let url, pathname;
    try {
      url = new URL(request.url, "http://localhost");
      pathname = decodeURIComponent(url.pathname);
    } catch {
      response.writeHead(400).end("Invalid URL");
      return;
    }
    if (pathname === "/features.html") {
      response.writeHead(307, { location: `/features${url.search}` }).end();
      return;
    }
    pathname =
      {
        "/features": "/features.html",
        "/about": "/about.html",
        "/methodology": "/methodology.html",
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
      if (!(await stat(file)).isFile()) throw new Error("Not a file");
      response.writeHead(200, {
        "content-type": types[extname(file)] || "application/octet-stream",
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
      });
      response.end(await readFile(file));
    } catch {
      response.writeHead(404, { "content-type": "text/html; charset=utf-8" });
      response.end(await readFile(join(outputDirectory, "404.html")));
    }
  });
  await new Promise((ready, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", ready);
  });
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    close: async () => {
      server.closeAllConnections();
      await new Promise((done) => server.close(done));
    },
  };
}
async function startViteDev(port) {
  await prepareData();
  let vite;
  const server = createServer((request, response) => {
    const url = new URL(request.url, "http://localhost");
    if (url.pathname === "/features.html") {
      response.writeHead(307, { location: `/features${url.search}` }).end();
      return;
    }
    if (!vite) {
      response.writeHead(503).end("Starting Vite");
      return;
    }
    vite.middlewares(request, response, async () => {
      try {
        const template = await vite.transformIndexHtml(
          request.url,
          await readFile(join(siteRoot, "index.html"), "utf8"),
        );
        const { render } = await vite.ssrLoadModule("/src/entry-server.jsx");
        const known = [
          "/",
          "/features",
          "/about",
          "/about.html",
          "/methodology",
          "/methodology.html",
        ].includes(url.pathname);
        response.writeHead(known ? 200 : 404, {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store",
        });
        response.end(
          template.replace("<!--app-html-->", await render(request.url)),
        );
      } catch (error) {
        vite.ssrFixStacktrace(error);
        console.error(error);
        response
          .writeHead(500)
          .end(
            "Vite could not render this page. See the terminal for details.",
          );
      }
    });
  });
  await new Promise((ready, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", ready);
  });
  const actualPort = server.address().port;
  vite = await createViteServer({
    configFile: join(siteRoot, "vite.config.mjs"),
    appType: "custom",
    server: { middlewareMode: true, ws: { server, clientPort: actualPort } },
  });
  let timer;
  let pending = false;
  let running = false;
  const regenerate = async () => {
    if (running) {
      pending = true;
      return;
    }
    running = true;
    try {
      await promisify(execFile)(process.execPath, [
        join(siteRoot, "prepare-data.mjs"),
      ]);
    } catch (error) {
      console.error(error.stderr || error.message);
    } finally {
      running = false;
      if (pending) {
        pending = false;
        void regenerate();
      }
    }
  };
  const watchers = [
    watch(siteRoot, (_event, filename) => {
      if (
        filename &&
        /^(feature.*\.mjs|features-data\.mjs|catalog\.json|data\.mjs)$/.test(
          filename,
        )
      ) {
        clearTimeout(timer);
        timer = setTimeout(regenerate, 120);
      }
    }),
  ];
  for (const capture of Object.values(captures)) {
    const file = join(repositoryRoot, capture);
    watchers.push(
      watch(file.slice(0, file.lastIndexOf("/")), (_event, filename) => {
        if (filename === file.slice(file.lastIndexOf("/") + 1)) {
          clearTimeout(timer);
          timer = setTimeout(regenerate, 120);
        }
      }),
    );
  }
  console.log(`React + Vite preview: http://127.0.0.1:${actualPort}`);
  return {
    url: `http://127.0.0.1:${actualPort}`,
    close: async () => {
      clearTimeout(timer);
      watchers.forEach((watcher) => {
        watcher.close();
      });
      await vite.close();
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
