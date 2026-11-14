// Run each suite with --engines proa --out <suite>/results/proa-pr83.json first.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { verifyRefresh } from "./proa-refresh-evidence.mjs";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
for (const suite of ["benchmarks/http", "benchmarks/cold-start", "benchmarks/streaming"]) {
	const directory = join(root, suite, "results");
	const baselineText = readFileSync(join(directory, "latest.json"), "utf8");
	const baseline = JSON.parse(baselineText);
	if (baseline.refresh)
		throw new Error(
			`${suite}: restore the original baseline before refreshing again`,
		);
	const freshText = readFileSync(join(directory, "proa-pr83.json"), "utf8");
	const fresh = JSON.parse(freshText);
	if (
		fresh.status !== "pass" ||
		fresh.engines.length !== 1 ||
		fresh.engines[0].id !== "proa"
	)
		throw new Error(`${suite}: missing successful PROA-only capture`);
	if (JSON.stringify(fresh.host) !== JSON.stringify(baseline.host)) {
		// Load averages, hostname and OS release may vary; CPU and physical machine must match.
		for (const field of [
			"cpuModel",
			"logicalCpuCount",
			"totalMemoryBytes",
			"platform",
			"arch",
		])
			if (fresh.host[field] !== baseline.host[field])
				throw new Error(`${suite}: different host ${field}`);
	}
	const id = `proa-${fresh.capturedAt.replace(/[:.]/g, "-")}`;
	const raw = join(directory, "raw", id);
	mkdirSync(raw, { recursive: true });
	writeFileSync(join(raw, "baseline.json"), baselineText);
	writeFileSync(join(raw, "proa.json"), freshText);
	const result = structuredClone(baseline);
	result.engines = baseline.engines.map((engine) =>
		engine.id === "proa" ? fresh.engines[0] : engine,
	);
	result.capturedAt = fresh.capturedAt;
	result.completedAt = fresh.completedAt;
	result.source = fresh.source;
	result.host = fresh.host;
	result.methodology = { ...baseline.methodology };
	for (const field of ["executionSequence", "engineExecutionOrder"]) {
		if (
			field === "executionSequence" &&
			Array.isArray(baseline.methodology[field])
		) {
			result.methodology[field] = [
				...baseline.methodology[field]
					.filter((entry) => entry.engine !== "proa")
					.map((entry) => ({
						...entry,
						sourceCapturedAt: baseline.capturedAt,
					})),
				...(fresh.methodology[field] ?? []).map((entry) => ({
					...entry,
					sourceCapturedAt: fresh.capturedAt,
				})),
			];
		}
	}

	result.refresh = {
		renderer: "proa",
		baseline_captured_at: baseline.capturedAt,
		baseline_path: `raw/${id}/baseline.json`,
		baseline_sha256: createHash("sha256").update(baselineText).digest("hex"),
		proa_path: `raw/${id}/proa.json`,
		proa_sha256: createHash("sha256").update(freshText).digest("hex"),
		note: `Only Proa was rerun on ${fresh.capturedAt.slice(0, 10)}; peer rows retain their ${baseline.capturedAt.slice(0, 10)} capture. Both runs used the same machine and suite protocol; they were not measured together.`,
	};
	verifyRefresh(result, directory);
	writeFileSync(
		join(directory, "latest.json"),
		JSON.stringify(result, null, 2) + "\n",
	);
	console.log(`${suite}: ${result.refresh.note}`);
}
