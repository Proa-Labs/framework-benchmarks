import { readFileSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import {
  loadProaRefresh,
  type RefreshManifest,
  refreshFolders,
} from "../tooling/capture/proa-refresh.mjs";
import type { Inputs, View } from "./benchmark-types.ts";
import {
  copyGenerated as cp,
  writeGenerated as writeFile,
} from "./generated-files.ts";

// Derive a review comparison without rewriting either immutable capture.
// The publication gate rejects this selection until a full campaign replaces it.
export function applyProaRefresh(
  root: string,
  input: Inputs,
  buffers: Record<View, Buffer>,
) {
  const { manifest, captures } = loadProaRefresh(root, input, buffers);
  const selected = <T>(suite: string): T =>
    (captures as Record<string, { merged: unknown }>)[suite].merged as T;
  input.reviewRefresh = {} as NonNullable<Inputs["reviewRefresh"]>;
  for (const view of [
    "rendering",
    "framework",
    "http",
    "streaming",
    "startup",
  ] as const) {
    const suite = view;
    const base = input[view];
    const peerId = "capture_id" in base ? base.capture_id : base.captureId;
    const peerDate = "captured_at" in base ? base.captured_at : base.capturedAt;
    const fresh = selected<Inputs[typeof view]>(suite);
    const proaId = "capture_id" in fresh ? fresh.capture_id : fresh.captureId;
    const proaDate =
      "captured_at" in fresh ? fresh.captured_at : fresh.capturedAt;
    const note = `Proa refreshed to ${manifest.afterRevision.slice(0, 8)} on ${proaDate.slice(0, 10)} at ${proaDate.slice(11, 16)} UTC. Peers retain the ${peerDate.slice(0, 10)} ${peerDate.slice(11, 16)} UTC campaign. Matching isolated GCP C4 machines; separate runs.${view === "streaming" ? " Proa used 32 generator workers; peers used 24. Server limits and offered loads are unchanged." : ""}`;
    const info = {
      renderer: "proa",
      baseline_capture_id: peerId,
      baseline_captured_at: peerDate,
      baseline_sha256: manifest.baseline[suite].sha256,
      proa_capture_id: proaId,
      proa_captured_at: proaDate,
      proa_revision: manifest.afterRevision,
      peer_host: structuredClone(base.host),
      proa_host: structuredClone(fresh.host),
      note,
    };
    input.reviewRefresh[view] = info;
    if (view === "rendering") {
      const r = selected<Inputs["rendering"]>(suite);
      Object.assign(input.rendering, {
        capture_kind: "proa_refresh",
        capture_id: r.capture_id,
        captured_at: r.captured_at,
        completed_at: r.completed_at,
        provenance: r.provenance,
        host: r.host,
        refresh: info,
        proa_output: r.proa_output,
      });
      input.rendering.measurements.proa = r.measurements.proa;
      input.rendering.parity.proa = r.parity.proa;
      input.rendering.versions.Proa = r.versions.Proa;
      const records = JSON.parse(
        readFileSync(
          join(
            root,
            "benchmarks/rendering/results/raw",
            r.capture_id,
            "process-summaries.json",
          ),
          "utf8",
        ),
      ) as Inputs["processSummaries"];
      input.processSummaries = [
        ...input.processSummaries.filter((r) => r.framework_id !== "proa"),
        ...records,
      ];
    } else {
      const f = selected<Inputs["framework"]>(suite);
      // Existing normalizers require a full roster. Only the Proa engine is
      // replaced; exported payloads below are explicitly marked as review data.
      const target = input[view];
      const engine = f.engines[0];
      Object.assign(target, {
        engines: target.engines.map((e) => (e.id === "proa" ? engine : e)),
        source: f.source,
        capturedAt: f.capturedAt,
        completedAt: "completedAt" in fresh ? fresh.completedAt : f.capturedAt,
        captureId: f.captureId,
        host: f.host,
        refresh: info,
      });
    }
    const payload = {
      ...input[view],
      ...(view === "rendering" ? {} : { captureKind: "review" }),
      refresh: info,
    };
    buffers[view] = Buffer.from(`${JSON.stringify(payload, null, 2)}\n`);
  }
}

export async function copyProaRefreshEvidence(
  root: string,
  output: string,
  sources: Record<View, string>,
) {
  const manifest = JSON.parse(
    readFileSync(join(root, "site/data/performance/proa-refresh.json"), "utf8"),
  ) as RefreshManifest;
  const target = join(output, "data/proa-refresh");
  await mkdir(join(target, "baseline"), { recursive: true });
  await writeFile(
    join(target, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  await Promise.all(
    Object.entries(sources).map(async ([view, path]) => {
      await cp(join(root, path), join(target, "baseline", `${view}.json`));
      const suite = view;
      await cp(
        join(
          root,
          refreshFolders[suite],
          "results/raw",
          manifest.baseline[suite].captureId,
          "source.tar.gz",
        ),
        join(target, "baseline", `${view}-source.tar.gz`),
      );
    }),
  );
  await Promise.all(
    Object.entries(manifest.runs).flatMap(([suite, lanes]) =>
      Object.values(lanes).map(async (id) => {
        const folder = refreshFolders[suite],
          results = join(target, folder, "results");
        await mkdir(join(results, "archive"), { recursive: true });
        await cp(
          join(root, folder, "results/archive", `${id}.json`),
          join(results, "archive", `${id}.json`),
        );
        await cp(
          join(root, folder, "results/raw", id),
          join(results, "raw", id),
        );
      }),
    ),
  );
}
