// Reuse the identical freshly captured Proa HTTP sweep; rerun its browser cell.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import http from "node:http";
import { measureBrowsers } from "./browser.mjs";
import { sourceFiles } from "./sources.mjs";
import {
	acquireRunLock,
	gitMetadata,
	hostMetadata,
	startServer,
	stopServer,
	waitForHealth,
} from "../../tooling/load/driver.mjs";
const root = fileURLToPath(new URL("../../", import.meta.url));
const directory = join(root, "experiments/sveltekit-streaming/results");
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
export function verifyProaRefresh(result) {
	if (!result.refresh) return;
	const r = result.refresh;
	const text = readFileSync(join(directory, r.baseline_path), "utf8");
	assert.equal(sha(text), r.baseline_sha256);
	const baseline = JSON.parse(text);
	assert.deepEqual(result.variants, baseline.variants);
	assert.deepEqual(result.config, baseline.config);
	assert.deepEqual(
		result.http.filter((p) => p.engine !== "proa"),
		baseline.http.filter((p) => p.engine !== "proa"),
	);
	for (const field of ["samples", "controls", "summaries"])
		assert.deepEqual(
			result.browser[field].filter((p) => p.engine !== "proa"),
			baseline.browser[field].filter((p) => p.engine !== "proa"),
		);
	const freshText = readFileSync(join(directory, r.proa_path), "utf8");
	assert.equal(sha(freshText), r.proa_sha256);
	const fresh = JSON.parse(freshText);
	for (const field of ["samples", "controls", "summaries"])
		assert.deepEqual(
			result.browser[field].filter((p) => p.engine === "proa"),
			fresh.browser[field],
		);
	assert.deepEqual(
		result.http.filter((p) => p.engine === "proa"),
		fresh.http,
	);
}
async function main() {
	const text = readFileSync(join(directory, "latest.json"), "utf8");
	const baseline = JSON.parse(text);
	if (baseline.refresh)
		throw new Error("Restore the original comparison before refreshing again");
	const selectedStream = JSON.parse(
		readFileSync(join(root, "benchmarks/streaming/results/latest.json"), "utf8"),
	);
	const capturedStreamPath = join(
		"benchmarks/streaming/results",
		selectedStream.refresh.proa_path,
	);
	const streamingText = readFileSync(join(root, capturedStreamPath), "utf8");
	const streaming = JSON.parse(streamingText);
	const proa = streaming.engines[0];
	assert.equal(streaming.status, "pass");
	assert.equal(proa.id, "proa");
	for (const field of [
		"cpuModel",
		"logicalCpuCount",
		"totalMemoryBytes",
		"platform",
		"arch",
		"node",
	])
		assert.equal(streaming.host[field], baseline.host[field]);
	assert.equal(streaming.methodology.generatorWorkers, 12);
	assert.equal(streaming.methodology.repeats, 3);
	assert.equal(proa.phases.length, 24);
	const capturedAt = new Date().toISOString();
	const id = `proa-${capturedAt.replace(/[:.]/g, "-")}`;
	const raw = join(directory, "raw", id);
	mkdirSync(raw, { recursive: true });
	writeFileSync(join(raw, "baseline.json"), text);
	const release = await acquireRunLock(root, "suspense-load");
	const agent = new http.Agent({ keepAlive: true });
	const server = startServer(
		{
			command: join(root, "target/release/proa_suspense_server"),
			args: [],
			cwd: root,
			label: "Proa browser refresh",
		},
		{
			PORT: "19700",
			PROA_WORKER_THREADS: "1",
			SUSPENSE_BOUNDARIES: "8",
			SUSPENSE_CARDS_PER_PANEL: "12",
		},
	);
	let browser;
	try {
		const health = await waitForHealth(server, 19700, agent);
		assert.equal(health.workerThreads, 1);
		assert.equal(health.productCards, 96);
		browser = await measureBrowsers([
			{ ...baseline.variants[0], url: "http://127.0.0.1:19700/" },
		]);
	} finally {
		agent.destroy();
		await stopServer(server);
		await release();
	}
	const fresh = {
		capturedAt,
		completedAt: new Date().toISOString(),
		source: await gitMetadata(root, sourceFiles),
		host: hostMetadata(),
		browser,
		http: proa.phases.map((p) => ({
			...p,
			engine: "proa",
			health: proa.health,
			responseBytes: proa.parity.responseBytes,
		})),
		httpSource: {
			path: capturedStreamPath,
			sha256: sha(streamingText),
			capturedAt: streaming.capturedAt,
			note: "Same native Proa server, workload, rates, warmups, processes, duration, pre-roll and 12-worker load generator; these are the already captured 24 one-worker phases, not an additional independent run.",
		},
	};
	const freshText = JSON.stringify(fresh, null, 2) + "\n";
	writeFileSync(join(raw, "proa.json"), freshText);
	const result = structuredClone(baseline);
	result.http = [
		...baseline.http.filter((p) => p.engine !== "proa"),
		...fresh.http,
	];
	for (const field of ["samples", "controls", "summaries"])
		result.browser[field] = [
			...baseline.browser[field].filter((p) => p.engine !== "proa"),
			...browser[field],
		];
	result.capturedAt = capturedAt;
	result.completedAt = fresh.completedAt;
	result.source = fresh.source;
	result.host = fresh.host;
	result.refresh = {
		renderer: "proa",
		baseline_captured_at: baseline.capturedAt,
		baseline_path: `raw/${id}/baseline.json`,
		baseline_sha256: sha(text),
		proa_path: `raw/${id}/proa.json`,
		proa_sha256: sha(freshText),
		note: `Only Proa was refreshed on ${capturedAt.slice(0, 10)}. SvelteKit retains its ${baseline.capturedAt.slice(0, 10)} measurements. Proa HTTP phases are shared with the new Suspense capture; its 60 browser navigations and two JavaScript-disabled controls were measured afresh.`,
	};
	verifyProaRefresh(result);
	writeFileSync(
		join(directory, "latest.json"),
		JSON.stringify(result, null, 2) + "\n",
	);
	console.log(result.refresh.note);
}
if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
