import { test } from "bun:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { formatReportLinks } from "./reports.mjs";
import {
  currentPath,
  evidencePath,
  findRepositoryRoot,
} from "./repository.mjs";

test("workspace discovery follows the manifest rather than script depth", () => {
  const root = mkdtempSync(join(tmpdir(), "benchmark-layout-"));
  try {
    mkdirSync(join(root, "nested/adapter/src"), { recursive: true });
    writeFileSync(join(root, "package.json"), '{"name":"@proa/benchmarks"}');
    writeFileSync(
      join(root, "nested/adapter/package.json"),
      '{"name":"an-adapter"}',
    );
    assert.equal(
      findRepositoryRoot(join(root, "nested/adapter/src/run.mjs")),
      root,
    );
    assert.equal(findRepositoryRoot(join(root, "missing/file.mjs")), root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("historical paths locate moved evidence without overriding archived originals", () => {
  const root = mkdtempSync(join(tmpdir(), "benchmark-evidence-"));
  try {
    mkdirSync(join(root, "benchmarks/http/results"), { recursive: true });
    writeFileSync(
      join(root, "benchmarks/http/results/latest.json"),
      "new location",
    );
    assert.equal(
      evidencePath(root, "page-load/results/latest.json"),
      join(root, "benchmarks/http/results/latest.json"),
    );
    mkdirSync(join(root, "page-load/results"), { recursive: true });
    writeFileSync(
      join(root, "page-load/results/latest.json"),
      "archived original",
    );
    assert.equal(
      evidencePath(root, "page-load/results/latest.json"),
      join(root, "page-load/results/latest.json"),
    );
    assert.equal(
      currentPath("page-load/results/latest.json"),
      "benchmarks/http/results/latest.json",
    );
    assert.equal(currentPath("page-load-v2/file"), "page-load-v2/file");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("generated report links resolve from their output location and preserve pinned sources", () => {
  const original =
    "[raw](page-load/results/latest.json#capture) [report](engineering.md) ![figure](docs/figures/a.svg) [source](https://github.com/o/r/blob/sha/rendering/run.mjs) [local](../protocol.md)";
  const expected =
    "[raw](../../benchmarks/http/results/latest.json#capture) [report](engineering.md) ![figure](../figures/a.svg) [source](https://github.com/o/r/blob/sha/rendering/run.mjs) [local](../protocol.md)";
  assert.equal(
    formatReportLinks(original, "docs/reports/scoreboard.md"),
    expected,
  );
  assert.equal(
    formatReportLinks(expected, "docs/reports/scoreboard.md"),
    expected,
  );
  assert.equal(
    formatReportLinks(
      '<img src="docs/figures/a.svg">',
      "docs/reports/scoreboard.md",
    ),
    '<img src="../figures/a.svg">',
  );
});
