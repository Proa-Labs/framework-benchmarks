// Combine whole-framework comparisons measured independently by workload.
// A shard contains the full cohort on one isolated physical host.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { copyFileSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import currentContract from "../../benchmarks/framework-ssr/contract.json" with {
  type: "json",
};
import previousContract from "../../benchmarks/framework-ssr/contract-v4.json" with {
  type: "json",
};
import {
  sha256,
  validateSemanticHtml,
} from "../../benchmarks/framework-ssr/parity.mjs";
import { validateResult } from "../../benchmarks/framework-ssr/report.ts";
import { frameworkSourceFiles } from "../../benchmarks/framework-ssr/sources.ts";
import { isShowcase } from "../../benchmarks/rendering/showcase/admission.mjs";
import {
  atomicWrite,
  captureId,
  retainCapture,
  sourceDigest,
} from "./captures.mjs";
import { readRaw, writeRawJson } from "./raw.mjs";
import { verifySourceSnapshot } from "./verify-source.mjs";

export function mergeFrameworkShards(
  shards,
  { smoke = false, retained = false } = {},
) {
  const first = shards[0];
  const historical = retained && first?.scenario.id === previousContract.id;
  const contract = historical ? previousContract : currentContract;
  assert.equal(
    shards.length,
    contract.workloads.length,
    "Every workload needs one complete shard",
  );
  const byId = new Map();
  const profile = (h) => [
    h.machineClass,
    h.cpuModel,
    h.logicalCpuCount,
    h.arch,
    h.release,
  ];
  for (const shard of shards) {
    validateResult(shard, false);
    assert.equal(shard.captureKind, "shard");
    assert.equal(shard.scenario.id, contract.id);
    assert.equal(shard.shard.smoke, smoke);
    const id = shard.shard.workload;
    assert.ok(!byId.has(id), `Duplicate workload shard: ${id}`);
    assert.equal(
      shard.source.sourceSha256,
      first.source.sourceSha256,
      "Shards must use identical measured sources",
    );
    assert.equal(
      shard.host.campaignId,
      first.host.campaignId,
      "Shards must share a campaign",
    );
    assert.equal(
      shard.host.sourceRevision,
      first.host.sourceRevision,
      "Shards must share an immutable revision",
    );
    assert.deepEqual(
      profile(shard.host),
      profile(first.host),
      "Shard hardware/OS profiles differ",
    );
    assert.deepEqual(
      shard.methodology,
      first.methodology,
      "Shard policies differ",
    );
    if (!smoke) {
      assert.equal(shard.source.repositoryCommit, shard.host.sourceRevision);
      assert.equal(shard.source.dirty, false);
      assert.match(shard.host.machineId ?? "", /^[a-f0-9]{64}$/);
      assert.equal(shard.host.machineClass, "c4-standard-16-lssd");
      assert.equal(shard.host.logicalCpuCount, 16);
      assert.equal(shard.host.arch, "x64");
      assert.equal(shard.host.serverCpuAffinity, "0");
      assert.ok(shard.host.nodeName);
      assert.equal(shard.host.campaignProtocol, "per-suite-host-v1");
      assert.match(shard.host.sourceRevision ?? "", /^[a-f0-9]{40}$/);
    }
    byId.set(id, shard);
  }
  for (const w of contract.workloads)
    assert.ok(byId.has(w.id), `Missing workload shard: ${w.id}`);
  const ordered = contract.workloads.map((w) => byId.get(w.id));
  const engines = contract.engines.map((id) => {
    const entries = ordered.map((s) => s.engines.find((e) => e.id === id));
    for (const e of entries) {
      assert.equal(e.framework, entries[0].framework);
      assert.equal(e.runtime, entries[0].runtime);
    }
    const parityByWorkload = Object.fromEntries(
      ordered.map((s, i) => [
        s.shard.workload,
        entries[i].parityByWorkload[s.shard.workload],
      ]),
    );
    return {
      ...entries[0],
      parity: parityByWorkload.cards,
      parityByWorkload,
      phases: entries.flatMap((e) => e.phases),
    };
  });
  const result = {
    schemaVersion: 2,
    status: "pass",
    captureKind: smoke ? "smoke" : "publication",
    captureId: captureId("framework-ssr"),
    capturedAt: ordered
      .map((s) => s.capturedAt)
      .sort()
      .at(-1),
    host: {
      ...first.host,
      machineId: null,
      nodeName: null,
      cloud: "GCP C4 c4-standard-16-lssd · isolated host per workload",
      campaignProtocol: "per-workload-host-v1",
      workloadHosts: Object.fromEntries(
        ordered.map((s) => [s.shard.workload, s.host]),
      ),
    },
    scenario: contract,
    methodology: first.methodology,
    source: first.source,
    engines,
    commands: {
      runtime: contract.runtime,
      build: "bun benchmarks/framework-ssr/build.ts",
      capture: "bun tooling/cloud/campaign.mjs --framework-shards",
    },
    limitations: [
      ...contract.limitations,
      `Workloads run in parallel on matching isolated C4 hosts. All ${historical ? "five " : ""}competitors within each workload share one physical host. Individual workload hosts and immutable shard captures are retained; no cross-host numbers are combined within a workload ranking.`,
    ],
    workloadCaptures: Object.fromEntries(
      ordered.map((s) => [
        s.shard.workload,
        {
          captureId: s.captureId,
          capturedAt: s.capturedAt,
          machineId: s.host.machineId,
          sourceSha256: s.source.sourceSha256,
        },
      ]),
    ),
  };
  validateResult(result, !smoke);
  return result;
}

export function aggregateFrameworkShards(root, { smoke = false } = {}) {
  const base = join(root, "benchmarks/framework-ssr/results");
  const directory = smoke ? join(base, "local") : base;
  const sources = frameworkSourceFiles(root),
    digest = sourceDigest(root, sources);
  const shards = currentContract.workloads.map((w) =>
    JSON.parse(
      readFileSync(
        join(base, "shards", w.id, smoke ? "smoke.json" : "latest.json"),
        "utf8",
      ),
    ),
  );
  const result = mergeFrameworkShards(shards, { smoke });
  assert.equal(
    result.source.sourceSha256,
    digest,
    "Aggregate sources differ from the workers",
  );
  const raw = join(directory, "raw", result.captureId);
  mkdirSync(join(raw, "shards"), { recursive: true });
  for (const shard of shards) {
    const folder = join(base, "shards", shard.shard.workload);
    const inputRaw = join(
      folder,
      smoke ? "local" : ".",
      "raw",
      shard.captureId,
    );
    verifySourceSnapshot(join(inputRaw, "source.tar.gz"), digest);
    const id = shard.shard.workload;
    for (const engine of shard.engines) {
      const name = `${engine.id}-${id}-parity.html.gz`;
      const input = join(inputRaw, name),
        html = readRaw(input);
      const proof = engine.parityByWorkload[id];
      assert.equal(html.length, proof.responseBytes);
      assert.equal(
        sha256(html),
        proof.responseSha256,
        `${engine.id}/${id}: parity artifact changed`,
      );
      assert.equal(
        validateSemanticHtml(html.toString(), "fresh-b", id, {
          adapted: engine.id === "exact" && isShowcase(id),
        }),
        proof.semanticSha256,
      );
      copyFileSync(input, join(raw, name));
    }
    writeRawJson(join(raw, "shards", `${id}.json.gz`), shard);
    result.workloadCaptures[id].artifact =
      `raw/${result.captureId}/shards/${id}.json.gz`;
    result.workloadCaptures[id].artifactSha256 = createHash("sha256")
      .update(readFileSync(join(raw, "shards", `${id}.json.gz`)))
      .digest("hex");
  }
  retainCapture(root, directory, result, sources);
  atomicWrite(
    join(directory, smoke ? "smoke.json" : "latest.json"),
    `${JSON.stringify(result, null, 2)}\n`,
  );
  // Verified shard evidence is now retained under the one selected capture.
  rmSync(join(base, "shards"), { recursive: true });
  return result;
}
