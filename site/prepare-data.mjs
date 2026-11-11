import { cp, mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import suites from "../tooling/suites.json" with { type: "json" };
import { validateCapture } from "../tooling/validate.mjs";
import { verifySourceSnapshot } from "../tooling/verify-source.mjs";
import { loadInputs, normalize } from "./data.mjs";
import {
  featureRows,
  features,
  reviewedOn,
  supportStates,
  updatedOn,
} from "./features-data.mjs";
import { buildPreviews } from "./previews.mjs";
export const siteRoot = dirname(fileURLToPath(import.meta.url));
export const generatedDirectory = join(siteRoot, ".generated");
export async function prepareData() {
  for (const id of Object.keys(suites))
    await validateCapture(id, undefined, dirname(siteRoot));
  const { input, buffers } = await loadInputs();
  const data = normalize(input);
  const outputDirectory = join(generatedDirectory, "public");
  await mkdir(join(outputDirectory, "data/captures"), { recursive: true });
  await cp(join(siteRoot, "public"), outputDirectory, { recursive: true });
  await Promise.all(
    Object.entries(buffers).map(([id, buffer]) =>
      writeFile(join(outputDirectory, "data/captures", `${id}.json`), buffer),
    ),
  );
  await writeFile(
    join(outputDirectory, "data/results.json"),
    `${JSON.stringify(data, null, 2)}\n`,
  );
  await writeFile(
    join(outputDirectory, "data/manifest.json"),
    `${JSON.stringify({ schemaVersion: 1, site: "https://frameworks.run", captures: Object.fromEntries(Object.keys(buffers).map((id) => [id, { source: data[id].source, capturedAt: data[id].capturedAt, sourceSha256: data[id].hash, artifactSha256: data[id].artifactSha256 }])) }, null, 2)}\n`,
  );
  if (input.framework) {
    verifySourceSnapshot(
      join(
        siteRoot,
        "../framework-ssr/results/raw",
        input.framework.captureId,
        "source.tar.gz",
      ),
      input.framework.source.sourceSha256,
    );
    await mkdir(join(outputDirectory, "data/sources"), { recursive: true });
    await cp(
      join(
        siteRoot,
        "../framework-ssr/results/raw",
        input.framework.captureId,
        "source.tar.gz",
      ),
      join(outputDirectory, "data/sources/framework.tar.gz"),
    );
  }
  await buildPreviews(
    outputDirectory,
    input.framework,
    input.workloadManifest.workloads,
  );

  const capabilityData = {
    reviewedOn,
    updatedOn,
    features,
    supportStates,
    rows: featureRows(data.ecosystem),
  };
  const dates = Object.keys(buffers)
    .map((id) => new Date(data[id].capturedAt))
    .sort((a, b) => a - b);
  const dateRange = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).formatRange(dates[0], dates.at(-1));
  const metadata = {
    dateRange,
    framework: {
      scenario: input.framework.scenario,
      methodology: input.framework.methodology,
    },
    captures: Object.keys(buffers).map((id) => ({ id, ...data[id] })),
  };
  // Metadata needs only provenance, not another copy of measured series.
  metadata.captures = metadata.captures.map(
    ({ id, download, date, capture }) => ({ id, download, date, capture }),
  );
  for (const [name, value] of Object.entries({
    results: data,
    features: capabilityData,
    metadata,
  })) {
    await writeFile(
      join(generatedDirectory, `${name}.json`),
      `${JSON.stringify(value)}\n`,
    );
  }
  await writeFile(
    join(outputDirectory, "data/features.json"),
    `${JSON.stringify(capabilityData, null, 2)}\n`,
  );
  return { data, capabilityData, metadata };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1])
  await prepareData();
