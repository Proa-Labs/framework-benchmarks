import { test } from "bun:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { validateCanonicalResult } from "../../benchmarks/rendering/canonical/report.mjs";
import { capturedRenderingContract } from "../capture/rendering-contract.mjs";
import { repositoryRoot } from "../repository.mjs";
import { validateAdmissionChecks } from "./publication.mjs";

const root = repositoryRoot(import.meta.url);
test("captured renderer rosters remain fixed when supported coverage grows", () => {
  const original = JSON.parse(
    readFileSync(
      join(root, "benchmarks/rendering/results/latest.json"),
      "utf8",
    ),
  );
  const contract = capturedRenderingContract(root, original);
  const current = JSON.parse(
    readFileSync(
      join(root, "benchmarks/rendering/canonical/roster.json"),
      "utf8",
    ),
  );
  current.renderers.push({ ...current.renderers[0], id: "future-renderer" });
  validateCanonicalResult(original, contract.roster, contract.workloads);
  assert.throws(
    () => validateCanonicalResult(original, current, contract.workloads),
    /roster entries missing/,
  );
});

test("publication exclusion evidence requires every unchanged fixture on the captured machine, campaign and source", () => {
  const capture = {
    host: { machineId: "a".repeat(64), campaignId: "publication-test" },
    provenance: { source_sha256: "b".repeat(64) },
    workloads: ["cards", "products", "table"].map((id) => ({ id })),
  };
  const checks = ["exact"].map((engine) => ({
    engine,
    version: "pinned-version",
    sourceSha256: capture.provenance.source_sha256,
    host: structuredClone(capture.host),
    cells: capture.workloads.map(({ id: workload }) => ({
      workload,
      status: engine === "exact" ? "unsupported" : "parity-failed",
      ...(engine === "exact"
        ? { diagnostic: "type-class-name" }
        : {
            businessDomParity: "pass",
            frameworkScriptNodes: 1,
            expectedDocumentMode: "BackCompat",
            actualDocumentMode: "CSS1Compat",
          }),
    })),
  }));
  validateAdmissionChecks(checks, capture);
  for (const mutate of [
    (data) => data.pop(),
    (data) => {
      data[0].cells.pop();
    },
    (data) => {
      data[0].cells[0].status = "included";
    },
    (data) => {
      data[0].cells[0].diagnostic = "unrelated-build-failure";
    },
    (data) => {
      data[0].sourceSha256 = "c".repeat(64);
    },
    (data) => {
      data[0].host.machineId = "d".repeat(64);
    },
    (data) => {
      data[0].host.campaignId = "publication-other";
    },
  ]) {
    const changed = structuredClone(checks);
    mutate(changed);
    assert.throws(() => validateAdmissionChecks(changed, capture));
  }
});
