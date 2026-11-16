import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const percentile = (values, p) =>
  [...values].sort((a, b) => a - b)[Math.ceil(values.length * p) - 1];

export function verifyHeroCaptures() {
  let processes = 0;
  for (const [file, primed] of [
    ["landing-hero.json", true],
    ["landing-hero-default.json", false],
  ]) {
    const summary = JSON.parse(
      readFileSync(join(root, "experiments/showcase/results", file), "utf8"),
    );
    assert.match(
      summary.raw_artifact.path,
      /^experiments\/showcase\/results\/raw\/landing-hero\/[a-z0-9-]+\.json\.gz$/,
    );
    const bytes = readFileSync(join(root, summary.raw_artifact.path));
    assert.equal(sha(bytes), summary.raw_artifact.sha256);
    const raw = JSON.parse(gunzipSync(bytes));
    const { records, ...metadata } = raw;
    const { raw_artifact, ...selected } = summary;
    assert.deepEqual(
      metadata,
      selected,
      "Only the artifact location may differ from the original capture",
    );
    assert.equal(
      raw.native_source_sha256,
      sha(readFileSync(join(root, "fixtures/landing-hero/src/main.rs"))),
    );
    assert.equal(raw.output_contract, "fresh-owned-render-buffer");
    assert.equal(raw.github_row_policy, "render-and-highlight-each-iteration");
    assert.equal(
      raw.allocator_policy,
      primed ? "explicit-warm-seed" : "render-warmups-only",
    );
    assert.equal(records.length, 30);
    for (const page of ["github", "sentry", "airbnb"]) {
      assert.equal(raw.parity[page].negative_control, "rejected");
      assert.equal(
        raw.parity[page].proa.dom_sha256,
        raw.parity[page].react.dom_sha256,
      );
      for (const engine of ["proa", "react"]) {
        const runs = records.filter(
          (r) => r.page === page && r.engine === engine,
        );
        assert.deepEqual(runs.map((r) => r.repeat).sort(), [1, 2, 3, 4, 5]);
        for (const run of runs) {
          assert.equal(run.iterations, page === "sentry" ? 300 : 2000);
          assert.equal(run.warmup, page === "sentry" ? 100 : 1000);
          assert.equal(run.samples_us.length, run.iterations);
          assert.ok(run.samples_us.every((n) => Number.isFinite(n) && n > 0));
          assert.equal(run.p50_us, percentile(run.samples_us, 0.5));
          assert.equal(run.p95_us, percentile(run.samples_us, 0.95));
          assert.equal(run.output_bytes, raw.parity[page][engine].bytes);
          if (engine === "proa") {
            assert.equal(run.debug_assertions, false);
            assert.equal(run.output_kind, "owned-render-buffer");
            assert.equal(run.allocator_primed, primed);
          }
          processes++;
        }
        const medians = runs.map((r) => r.p50_us);
        assert.equal(
          raw.summaries[page][engine].p50_us,
          percentile(medians, 0.5),
        );
        assert.deepEqual(raw.summaries[page][engine].process_p50_range_us, [
          Math.min(...medians),
          Math.max(...medians),
        ]);
      }
      const pair = raw.summaries[page];
      assert.equal(pair.react_over_proa, pair.react.p50_us / pair.proa.p50_us);
    }
  }
  return processes;
}

if (process.argv[1] === fileURLToPath(import.meta.url))
  console.log(
    `Verified ${verifyHeroCaptures()} retained paired processes and all ordered samples.`,
  );
