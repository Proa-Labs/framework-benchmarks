// Recheck retained shard evidence during publication, after collection has ended.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  sha256,
  validateSemanticHtml,
} from "../../benchmarks/framework-ssr/parity.mjs";
import { isShowcase } from "../../benchmarks/rendering/showcase/admission.mjs";
import { mergeFrameworkShards } from "../capture/framework-shards.mjs";
import { readRaw, readRawJson } from "../capture/raw.mjs";

export function verifyFrameworkShardEvidence(
  result,
  directory,
  { smoke = false } = {},
) {
  if (result.host.campaignProtocol !== "per-workload-host-v1") return;
  assert.match(result.captureId, /^[a-zA-Z0-9-]+$/);
  const shards = result.scenario.workloads.map(({ id }) => {
    const proof = result.workloadCaptures[id];
    assert.equal(
      proof.artifact,
      `raw/${result.captureId}/shards/${id}.json.gz`,
    );
    const file = join(directory, proof.artifact);
    assert.equal(
      sha256(readFileSync(file)),
      proof.artifactSha256,
      `${id}: retained shard changed`,
    );
    const shard = readRawJson(file);
    assert.equal(shard.shard.workload, id);
    assert.equal(shard.captureId, proof.captureId);
    assert.equal(shard.capturedAt, proof.capturedAt);
    assert.equal(shard.host.machineId, proof.machineId);
    assert.equal(shard.source.sourceSha256, proof.sourceSha256);
    for (const engine of shard.engines) {
      const html = readRaw(
        join(
          directory,
          "raw",
          result.captureId,
          `${engine.id}-${id}-parity.html.gz`,
        ),
      );
      const parity = engine.parityByWorkload[id];
      assert.equal(html.length, parity.responseBytes);
      assert.equal(
        sha256(html),
        parity.responseSha256,
        `${engine.id}/${id}: retained response changed`,
      );
      assert.equal(
        validateSemanticHtml(html.toString(), "fresh-b", id, {
          adapted: engine.id === "exact" && isShowcase(id),
        }),
        parity.semanticSha256,
      );
    }
    return shard;
  });
  const expected = mergeFrameworkShards(shards, { smoke, retained: true });
  for (const key of [
    "status",
    "captureKind",
    "capturedAt",
    "host",
    "scenario",
    "methodology",
    "source",
    "engines",
    "limitations",
  ])
    assert.deepEqual(
      result[key],
      expected[key],
      `Aggregate ${key} differs from retained workload shards`,
    );
}
