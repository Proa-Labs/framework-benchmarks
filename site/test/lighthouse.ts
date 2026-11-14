// Run after changes: bun site/test/lighthouse.ts --runs 3
// Uses a real production build, standard Lighthouse mobile/desktop presets,
// all four scored categories, and a pinned Lighthouse CLI outside app dependencies.
import assert from "node:assert/strict";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createServer, request } from "node:http";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { createBrotliCompress } from "node:zlib";
import { chromium } from "playwright";
import { siteRoot } from "../build.ts";
import { startServer } from "../dev.ts";

const { values } = parseArgs({
  options: {
    runs: { type: "string", default: "1" },
    pages: { type: "string", default: "/,/features,/about,/methodology" },
    device: { type: "string", default: "both" },
  },
});
const runs = Number(values.runs);
assert.ok(Number.isSafeInteger(runs) && runs > 0);
assert.ok(["both", "mobile", "desktop"].includes(values.device || ""));
const devices =
  values.device === "both" ? ["mobile", "desktop"] : [values.device];
const paths = (values.pages || "/").split(",");
assert.ok(paths.every((path) => /^\/[a-z/]*$/.test(path)));
const directory = join(siteRoot, "test-results/lighthouse");
// A failed or interrupted run must not leave a previous passing summary selected.
await rm(directory, { recursive: true, force: true });
await mkdir(directory, { recursive: true });
const server = await startServer({ port: 0, live: false });
// Forward the real production Host to exercise its actual indexing policy.
// No response bytes, audit rules or scores are rewritten. Direct local and
// workers.dev previews continue to return their required noindex headers.
const proxy = createServer((incoming, outgoing) => {
  const upstream = request(
    new URL(incoming.url || "/", server.url),
    {
      method: incoming.method,
      headers: { ...incoming.headers, host: "frameworks.run" },
    },
    (response) => {
      const headers = { ...response.headers };
      // Cloudflare compresses text at the edge. Local Vite preview does not;
      // reproduce that transport here without changing decoded asset bytes.
      const compress =
        response.statusCode === 200 &&
        !headers["content-encoding"] &&
        !headers["cache-control"]?.includes("no-transform") &&
        /text|javascript|json|svg|xml/.test(headers["content-type"] || "") &&
        incoming.headers["accept-encoding"]?.includes("br");
      if (compress) {
        delete headers["content-length"];
        headers["content-encoding"] = "br";
        headers.vary = "Accept-Encoding";
      }
      outgoing.writeHead(response.statusCode || 502, headers);
      if (compress) response.pipe(createBrotliCompress()).pipe(outgoing);
      else response.pipe(outgoing);
    },
  );
  upstream.on("error", () => {
    outgoing.writeHead(502);
    outgoing.end();
  });
  incoming.pipe(upstream);
});
await new Promise<void>((done) => proxy.listen(0, "127.0.0.1", done));
const address = proxy.address();
assert.ok(address && typeof address !== "string");
const origin = `http://127.0.0.1:${address.port}`;
const summary: Record<string, unknown> = {
  lighthouseVersion: "13.6.0",
  runs,
  pages: {},
};
const results: Record<string, Record<string, number[]>> = {};
try {
  const response = await fetch(origin);
  assert.equal(response.status, 200);
  assert.equal(
    response.headers.get("x-robots-tag"),
    null,
    "Audit must use the production indexing policy",
  );
  for (const device of devices)
    for (const path of paths)
      for (let run = 1; run <= runs; run++) {
        const name = `${device}-${path.slice(1) || "home"}-${run}`;
        const output = join(directory, `${name}.json`);
        const child = Bun.spawn(
          [
            "npm",
            "exec",
            "--yes",
            "--package=lighthouse@13.6.0",
            "--",
            "lighthouse",
            origin + path,
            "--quiet",
            "--chrome-flags=--headless --no-sandbox",
            "--output=json",
            `--output-path=${output}`,
            ...(device === "desktop" ? ["--preset=desktop"] : []),
          ],
          {
            env: { ...process.env, CHROME_PATH: chromium.executablePath() },
            stdout: "inherit",
            stderr: "inherit",
          },
        );
        assert.equal(
          await child.exited,
          0,
          `${name}: Lighthouse could not run`,
        );
        const report = JSON.parse(await readFile(output, "utf8"));
        assert.ok(!report.runtimeError, report.runtimeError?.message);
        const key = `${device} ${path}`;
        results[key] ||= {};
        for (const category of [
          "performance",
          "accessibility",
          "best-practices",
          "seo",
        ]) {
          const score = report.categories[category].score;
          assert.equal(
            typeof score,
            "number",
            `${key}: ${category} was not scored`,
          );
          results[key][category] ||= [];
          results[key][category].push(Math.round(score * 100));
        }
        console.log(
          `${key} (${run}/${runs}): ${JSON.stringify(Object.fromEntries(Object.entries(results[key]).map(([category, scores]) => [category, scores.at(-1)])))}`,
        );
      }
  const pages = Object.fromEntries(
    Object.entries(results).map(([page, categories]) => [
      page,
      Object.fromEntries(
        Object.entries(categories).map(([category, scores]) => [
          category,
          {
            scores,
            median: [...scores].sort((a, b) => a - b)[
              Math.floor(scores.length / 2)
            ],
          },
        ]),
      ),
    ]),
  );
  summary.pages = pages;
  await writeFile(
    join(directory, "summary.json"),
    `${JSON.stringify(summary, null, 2)}\n`,
  );
  for (const [page, categories] of Object.entries(pages))
    for (const [category, result] of Object.entries(categories))
      assert.equal(
        result.median,
        100,
        `${page}: ${category} must score 100 (observed ${result.scores.join(", ")})`,
      );
} finally {
  proxy.closeAllConnections();
  if (proxy.listening)
    await new Promise<void>((done, reject) =>
      proxy.close((error) => (error ? reject(error) : done())),
    );
  await server.close();
}
