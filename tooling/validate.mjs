import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { capturedRenderingContract } from "./rendering-contract.mjs";
import { verifyRetainedSource } from "./retained-source.mjs";
import suites from "./suites.json" with { type: "json" };

export async function validateCapture(id, path, root) {
  const suite = suites[id];
  assert.ok(suite, `Unknown suite: ${id}`);
  const result = JSON.parse(
    await readFile(
      path ?? join(root, suite.directory, "results/latest.json"),
      "utf8",
    ),
  );
  if (id === "rendering") {
    const { validateCanonicalResult } = await import(
      "../rendering/canonical/report.mjs"
    );
    const { roster, workloads } = capturedRenderingContract(root, result);
    validateCanonicalResult(result, roster, workloads);
  } else {
    const { validateResult } = await import(
      new URL(`../${suite.report}`, import.meta.url)
    );
    validateResult(result, true);
  }
  verifyRetainedSource(join(root, suite.directory, "results"), result);
  return result;
}
