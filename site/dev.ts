import { execFile, spawn } from "node:child_process";
import { type FSWatcher, watch } from "node:fs";
import { createServer as createSocket } from "node:net";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify, stripVTControlCharacters } from "node:util";
import { buildSite, siteRoot } from "./build.ts";
import { captures, repositoryRoot } from "./data.ts";
import { prepareData } from "./prepare-data.ts";
export async function startServer({
  port = Number(process.env.PORT || 4317),
  live = true,
  build = true,
} = {}) {
  if (live) await prepareData();
  else if (build) await buildSite();
  if (!port) {
    const socket = createSocket();
    await new Promise((done) =>
      socket.listen(0, "127.0.0.1", () => done(undefined)),
    );
    const address = socket.address();
    if (!address || typeof address === "string")
      throw new Error("No local TCP address");
    port = address.port;
    await new Promise((done) => socket.close(done));
  }
  // Bun runs the project scripts and build. Cloudflare's local HTTP/Miniflare
  // bridge hangs under Bun 1.4.2 (including static assets), so only this vendor
  // CLI host uses Node >=22.12. The application runs in workerd in both cases.
  const child = spawn(
    "node",
    [
      join(siteRoot, "node_modules/vite/bin/vite.js"),
      live ? "dev" : "preview",
      "--host",
      "127.0.0.1",
      "--port",
      String(port),
      "--strictPort",
    ],
    { cwd: siteRoot, env: process.env, stdio: ["ignore", "pipe", "pipe"] },
  );
  let output = "";
  const exited = new Promise((resolve) => child.once("exit", resolve));
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`TanStack Start startup timed out: ${output}`));
    }, 30000);
    const read = (chunk: Buffer) => {
      const text = chunk.toString();
      output = (output + text).slice(-12000);
      if (
        /Local:\s+http:\/\/127\.0\.0\.1:\d+/.test(
          stripVTControlCharacters(output),
        )
      ) {
        clearTimeout(timer);
        resolve();
      }
    };
    child.stdout.on("data", read);
    child.stderr.on("data", read);
    child.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.once("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`TanStack Start exited (${code}): ${output}`));
    });
  });
  const watchers: FSWatcher[] = [];
  let timer: ReturnType<typeof setTimeout> | undefined,
    running = false,
    pending = false;
  const regenerate = async () => {
    if (running) {
      pending = true;
      return;
    }
    running = true;
    try {
      await promisify(execFile)(process.execPath, [
        join(siteRoot, "prepare-data.ts"),
      ]);
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
    } finally {
      running = false;
      if (pending) {
        pending = false;
        void regenerate();
      }
    }
  };
  if (live) {
    const changed = () => {
      clearTimeout(timer);
      timer = setTimeout(regenerate, 120);
    };
    watchers.push(
      watch(siteRoot, (_event, name) => {
        if (
          name &&
          /^(feature.*\.(ts|json)|catalog\.json|proa-refresh\.json|data\.ts)$/.test(
            name,
          )
        )
          changed();
      }),
    );
    for (const capture of Object.values(captures)) {
      const file = join(repositoryRoot, capture);
      watchers.push(
        watch(file.slice(0, file.lastIndexOf("/")), (_event, name) => {
          if (name === file.slice(file.lastIndexOf("/") + 1)) changed();
        }),
      );
    }
  }
  const url = `http://127.0.0.1:${port}`;
  console.log(`TanStack Start ${live ? "dev" : "Cloudflare preview"}: ${url}`);
  return {
    url,
    close: async () => {
      clearTimeout(timer);
      for (const watcher of watchers) watcher.close();
      child.kill("SIGTERM");
      const kill = setTimeout(() => child.kill("SIGKILL"), 5000);
      await exited;
      clearTimeout(kill);
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
