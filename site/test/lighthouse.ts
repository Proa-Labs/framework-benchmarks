// Run after changes: bun site/test/lighthouse.ts --runs 3
// Uses a real production build, standard Lighthouse mobile/desktop presets,
// every scored category, and a pinned Lighthouse CLI outside app dependencies.
import assert from "node:assert/strict";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { createServer, request } from "node:http";
import { join } from "node:path";
import { parseArgs, promisify } from "node:util";
import { brotliCompress, createBrotliCompress } from "node:zlib";
import { chromium } from "playwright";
import { outputDirectory, siteRoot } from "../build.ts";
import { startServer } from "../dev.ts";

const { values } = parseArgs({
  options: {
    runs: { type: "string", default: "1" },
    pages: {
      type: "string",
      default: "/,/features,/?section=ecosystem,/about,/methodology",
    },
    device: { type: "string", default: "both" },
    "save-assets": { type: "boolean", default: false },
  },
});
const runs = Number(values.runs);
assert.ok(Number.isSafeInteger(runs) && runs > 0);
assert.ok(["both", "mobile", "desktop"].includes(values.device || ""));
const devices =
  values.device === "both" ? ["mobile", "desktop"] : [values.device];
const paths = (values.pages || "/").split(",");
assert.ok(
  paths.every(
    (path) => /^\/[a-z/]*$/.test(path) || path === "/?section=ecosystem",
  ),
);
const directory = join(siteRoot, "test-results/lighthouse");
// A failed or interrupted run must not leave a previous passing summary selected.
await rm(directory, { recursive: true, force: true });
await mkdir(directory, { recursive: true });
const server = await startServer({ port: 0, live: false });
// Compression runs at Cloudflare, outside a visitor's device. Prepare immutable
// asset encodings before Chrome starts so the localhost proxy does not compete
// with its renderer for the CI VM's CPUs. Each audit still downloads every byte.
const encodedAssets = new Map<string, Buffer>();
let precompressedResponses = 0;
const encode = promisify(brotliCompress);
for (const asset of await readdir(join(outputDirectory, "assets"))) {
  if (/\.(?:js|css|json|svg|xml)$/.test(asset))
    encodedAssets.set(
      `/assets/${asset}`,
      await encode(await readFile(join(outputDirectory, "assets", asset))),
    );
}
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
      const encoded =
        compress && headers["cache-control"]?.includes("immutable")
          ? encodedAssets.get(new URL(incoming.url || "/", server.url).pathname)
          : undefined;
      if (encoded) {
        precompressedResponses++;
        response.resume();
        outgoing.end(encoded);
      } else if (compress) response.pipe(createBrotliCompress()).pipe(outgoing);
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
  browserLifecycle:
    "Lighthouse batch per device; cold HTTP and site storage for every navigation",
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
  // Lighthouse's native batch mode reuses Chrome across URLs. Every navigation
  // still clears HTTP/site storage and uses the standard throttling presets.
  // Avoid measuring repeated browser/font-service startup on a shared CI VM.
  for (const device of devices) {
    const output = join(directory, device || "");
    await mkdir(output, { recursive: true });
    const child = Bun.spawn(
      [
        "npm",
        "exec",
        "--yes",
        "--package=lighthouse@13.6.0",
        "--",
        "lighthouse",
        ...paths.flatMap((path) =>
          Array.from({ length: runs }, () => origin + path),
        ),
        "--quiet",
        "--chrome-flags=--headless --no-sandbox",
        "--output=json",
        ...(values["save-assets"] ? ["--save-assets"] : []),
        `--output-path=${output}`,
        ...(device === "desktop" ? ["--preset=desktop"] : []),
      ],
      {
        env: { ...process.env, CHROME_PATH: chromium.executablePath() },
        stdout: "inherit",
        stderr: "inherit",
      },
    );
    assert.equal(await child.exited, 0, `${device}: Lighthouse could not run`);
    const files = (await readdir(output)).filter((file) =>
      file.endsWith(".report.json"),
    );
    assert.equal(
      files.length,
      paths.length * runs,
      "Every requested audit must produce a report",
    );
    const reports = await Promise.all(
      files.map(async (file) =>
        JSON.parse(await readFile(join(output, file), "utf8")),
      ),
    );
    reports.sort((a, b) => Date.parse(a.fetchTime) - Date.parse(b.fetchTime));
    const counts = new Map<string, number>();
    for (const report of reports) {
      assert.ok(!report.runtimeError, report.runtimeError?.message);
      const url = new URL(report.requestedUrl);
      assert.equal(url.origin, origin);
      assert.ok(paths.includes(url.pathname + url.search));
      assert.equal(
        report.configSettings.disableStorageReset,
        false,
        "Every audit must use a cold page cache",
      );
      assert.equal(report.configSettings.throttlingMethod, "simulate");
      assert.equal(
        report.configSettings.throttling.cpuSlowdownMultiplier,
        device === "mobile" ? 4 : 1,
      );
      const requests = report.audits["network-requests"].details.items;
      assert.ok(
        requests.some(
          (item: { url: string; transferSize: number }) =>
            /\/assets\/index-[^/]+\.js$/.test(item.url) &&
            item.transferSize > 0,
        ),
        "Every audit must download its application entry script",
      );
      const path = url.pathname + url.search;
      const run = (counts.get(path) || 0) + 1;
      counts.set(path, run);
      const key = `${device} ${path}`;
      results[key] ||= {};
      for (const category of [
        "performance",
        "accessibility",
        "best-practices",
        "seo",
      ])
        assert.ok(
          report.categories[category],
          `${key}: missing ${category} category`,
        );
      for (const [category, value] of Object.entries(report.categories) as [
        string,
        { score: number | null },
      ][]) {
        if (value.score === null) continue;
        assert.equal(
          typeof value.score,
          "number",
          `${key}: ${category} was not scored`,
        );
        results[key][category] ||= [];
        results[key][category].push(Math.round(value.score * 100));
      }
      console.log(
        `${key} (${run}/${runs}): ${JSON.stringify(Object.fromEntries(Object.entries(results[key]).map(([category, scores]) => [category, scores.at(-1)])))}`,
      );
    }
    for (const path of paths)
      assert.equal(counts.get(path), runs, `${device} ${path}: missing repeat`);
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
  summary.precompressedAssetResponses = precompressedResponses;
  assert.ok(
    precompressedResponses > 0,
    "Audit must serve the immutable build assets",
  );
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
