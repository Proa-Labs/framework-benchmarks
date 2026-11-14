import { test } from "bun:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { validateProaPair } from "../../tooling/proa-refresh.mjs";
import { loadInputs, normalize, repositoryRoot } from "../data.ts";
import { createDashboardModel } from "../src/charts/dashboard-model.ts";

const reviewTest = test.skipIf(
  !existsSync(join(repositoryRoot, "site/data/performance/proa-refresh.json")),
);

reviewTest(
  "review selection updates every Proa suite while retaining peer measurements and capture dates",
  async () => {
    const base = (await loadInputs(repositoryRoot, { refresh: false })).input;
    const review = (await loadInputs()).input;
    const data = normalize(review);
    assert.equal(
      data.rendering.rows.cards.find((r) => r.id === "proa")?.p50,
      1.091,
    );
    assert.equal(createDashboardModel(data).visibleRows()[0].id, "proa");
    for (const renderer of base.rendering.renderers.filter(
      (r) => r.id !== "proa",
    ))
      assert.deepEqual(
        review.rendering.measurements[renderer.id],
        base.rendering.measurements[renderer.id],
      );
    for (const view of ["framework", "http", "streaming", "startup"] as const) {
      assert.deepEqual(
        review[view].engines.filter((e) => e.id !== "proa"),
        base[view].engines.filter((e) => e.id !== "proa"),
      );
      assert.ok(
        data[view].reviewRefresh?.note.includes("Separate runs") ||
          data[view].reviewRefresh?.note.includes("separate runs"),
      );
    }
    for (const row of data.rendering.rows.cards)
      assert.equal(
        row.capturedAt,
        row.id === "proa"
          ? review.rendering.captured_at
          : base.rendering.captured_at,
      );
    assert.ok(
      data.streaming.reviewRefresh?.note.includes("32 generator workers"),
    );
  },
);

reviewTest(
  "review evidence rejects changed fixtures, wrong revisions and unpaired hosts",
  async () => {
    const manifest = JSON.parse(
      await readFile(
        join(repositoryRoot, "site/data/performance/proa-refresh.json"),
        "utf8",
      ),
    );
    const read = async (id: string) =>
      JSON.parse(
        await readFile(
          join(repositoryRoot, "rendering/results/archive", `${id}.json`),
          "utf8",
        ),
      );
    const pair = {
      baseline: await read(manifest.runs.rendering.baseline),
      merged: await read(manifest.runs.rendering.merged),
    };
    const base = (await loadInputs(repositoryRoot, { refresh: false })).input
      .rendering;
    for (const change of [
      (p: typeof pair) => {
        p.merged.host.machineId = "different";
      },
      (p: typeof pair) => {
        p.merged.parity.proa.cards.canonical_sha256 = "0".repeat(64);
      },
      (p: typeof pair) => {
        p.merged.versions.Proa = "wrong revision";
      },
    ]) {
      const bad = structuredClone(pair);
      change(bad);
      assert.throws(() => validateProaPair("rendering", bad, base, manifest));
    }
  },
);
