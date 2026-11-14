// Keep raw samples compact without changing the capture scripts' local formats.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { createHash } from "node:crypto";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const sha = (s) => createHash("sha256").update(s).digest("hex");
mkdirSync(join(root, "experiments/showcase/results/raw"), { recursive: true });
for (const name of ["ssr", "client_js", "memcpy-floor", "buffer-comparison"]) {
	const rawPath = join(
		root,
		`experiments/showcase/results/${name}${["ssr", "client_js"].includes(name) ? "_raw" : "-raw"}.json`,
	);
	const raw = readFileSync(rawPath);
	const compressed = gzipSync(raw, { level: 9 });
	const retained = `experiments/showcase/results/raw/proa-pr83-${name}.json.gz`;
	writeFileSync(join(root, retained), compressed);
	if (["ssr", "client_js"].includes(name)) {
		const summary = JSON.parse(raw);
		if (name === "ssr")
			summary.records = summary.records.map(({ raw_ns, ...record }) => record);
		else delete summary.records;
		summary.rawArtifact = {
			path: retained,
			sha256: sha(compressed),
			uncompressedSha256: sha(raw),
			encoding: "gzip",
		};
		writeFileSync(
			join(
				root,
				`experiments/showcase/results/${name === "ssr" ? "ssr" : "client-js"}-pr83.json`,
			),
			JSON.stringify(summary, null, 2) + "\n",
		);
	} else {
		const summaryPath = join(root, `experiments/showcase/results/${name}.json`);
		const summary = JSON.parse(readFileSync(summaryPath, "utf8"));
		summary.raw_artifact = {
			path: retained,
			sha256: sha(compressed),
			uncompressed_sha256: sha(raw),
			encoding: "gzip",
		};
		writeFileSync(summaryPath, JSON.stringify(summary, null, 2) + "\n");
	}
}
