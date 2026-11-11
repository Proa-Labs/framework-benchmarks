import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { appendFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(readFileSync(join(here, "wrangler.json")));
const number = process.env.PR_NUMBER;
assert.match(number ?? "", /^\d+$/);
assert.ok(process.env.CLOUDFLARE_API_TOKEN, "Missing Cloudflare deploy token");
const endpoint = `https://api.cloudflare.com/client/v4/accounts/${config.account_id}/workers/scripts/${config.name}/subdomain`;
const headers = {
  authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
  "content-type": "application/json",
};
async function cloudflare(options = {}) {
  const response = await fetch(endpoint, { headers, ...options });
  const result = await response.json();
  assert.ok(
    response.ok && result.success,
    `Cloudflare preview settings failed: HTTP ${response.status}; ${JSON.stringify(result.errors)}`,
  );
  return result.result;
}
const settings = await cloudflare();
if (!settings.previews_enabled)
  await cloudflare({
    method: "POST",
    body: JSON.stringify({ enabled: settings.enabled, previews_enabled: true }),
  });

const output = join(
  process.env.RUNNER_TEMP ?? "/tmp",
  `frameworks-preview-${number}.jsonl`,
);
execFileSync(
  process.execPath,
  [
    "--bun",
    join(here, "node_modules/wrangler/bin/wrangler.js"),
    "versions",
    "upload",
    "--preview-alias",
    `pr-${number}`,
    "--message",
    `PR #${number}: ${process.env.GITHUB_SHA}`,
  ],
  {
    cwd: here,
    stdio: "inherit",
    env: { ...process.env, WRANGLER_OUTPUT_FILE_PATH: output },
  },
);
const upload = readFileSync(output, "utf8")
  .trim()
  .split("\n")
  .map((line) => JSON.parse(line))
  .findLast((entry) => entry.type === "version-upload");
const url = upload?.preview_alias_url ?? upload?.preview_url;
assert.ok(url, "Cloudflare returned no version preview URL");
for (let attempt = 0; ; attempt++) {
  const response = await fetch(upload.preview_url ?? url);
  if (response.ok) break;
  assert.ok(attempt < 10, `Preview is not reachable: HTTP ${response.status}`);
  await Bun.sleep(2000);
}
appendFileSync(process.env.GITHUB_OUTPUT, `url=${url}\n`);
appendFileSync(
  process.env.GITHUB_STEP_SUMMARY,
  `### Cloudflare preview\n\n[Open PR #${number}](${url}) · ${process.env.GITHUB_SHA}\n\nProduction frameworks.run is unchanged.\n`,
);
const marker = "<!-- frameworks-run-preview -->";
const body = `${marker}\n**Cloudflare preview:** ${url}\n\nUpdated for \`${process.env.GITHUB_SHA?.slice(0, 7)}\`. This version does not change production.`;
const api = (args, input) =>
  execFileSync("gh", ["api", ...args], { input, encoding: "utf8" });
const path = `repos/${process.env.GITHUB_REPOSITORY}/issues/${number}/comments`;
const comments = JSON.parse(api([`${path}?per_page=100`]));
const existing = comments.find(
  (comment) =>
    comment.user?.login === "github-actions[bot]" &&
    comment.body?.includes(marker),
);
api(
  [
    existing
      ? `repos/${process.env.GITHUB_REPOSITORY}/issues/comments/${existing.id}`
      : path,
    "--method",
    existing ? "PATCH" : "POST",
    "--input",
    "-",
  ],
  JSON.stringify({ body }),
);
console.log(`Preview ready: ${url}`);
