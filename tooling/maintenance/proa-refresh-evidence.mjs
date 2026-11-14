import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve, sep } from "node:path";

// Verify the retained peer data, rather than trusting a new capture label.
export function verifyRefresh(result, resultsDirectory) {
	if (!result.refresh) return;
	const r = result.refresh;
	if (
		r.renderer !== "proa" ||
		!r.note ||
		!r.baseline_path ||
		!/^[a-f0-9]{64}$/.test(r.baseline_sha256)
	)
		throw new Error("Invalid PROA refresh provenance");
	const path = resolve(resultsDirectory, r.baseline_path);
	if (!path.startsWith(resolve(resultsDirectory) + sep))
		throw new Error("Baseline escapes result directory");
	const text = readFileSync(path, "utf8");
	assert.equal(
		createHash("sha256").update(text).digest("hex"),
		r.baseline_sha256,
		"Retained baseline digest changed",
	);
	const baseline = JSON.parse(text);
	assert.equal(
		baseline.refresh,
		undefined,
		"Refresh baseline must be an original capture",
	);
	for (const field of [
		"cpuModel",
		"cpu_model",
		"logicalCpuCount",
		"logical_cpus",
		"totalMemoryBytes",
		"memory_bytes",
		"platform",
		"arch",
		"architecture",
		"node",
	]) {
		assert.deepEqual(
			result.host?.[field],
			baseline.host?.[field],
			`Refresh host metadata differs: ${field}`,
		);
	}
	if (result.measurements) {
		assert.equal(r.baseline_capture_id, baseline.capture_id);
		assert.equal(r.baseline_captured_at, baseline.captured_at);
		for (const renderer of baseline.renderers)
			if (renderer.id !== "proa") {
				assert.deepEqual(
					result.measurements[renderer.id],
					baseline.measurements[renderer.id],
					`${renderer.id} measurements changed`,
				);
				assert.deepEqual(
					result.parity[renderer.id],
					baseline.parity[renderer.id],
					`${renderer.id} parity changed`,
				);
				assert.equal(
					result.versions[renderer.label],
					baseline.versions[renderer.label],
				);
			}
	} else {
		if (r.proa_path) {
			const freshPath = resolve(resultsDirectory, r.proa_path);
			if (!freshPath.startsWith(resolve(resultsDirectory) + sep))
				throw new Error("PROA evidence escapes result directory");
			const freshText = readFileSync(freshPath, "utf8");
			assert.equal(
				createHash("sha256").update(freshText).digest("hex"),
				r.proa_sha256,
				"PROA evidence digest changed",
			);
			const fresh = JSON.parse(freshText);
			assert.equal(fresh.status, "pass");
			assert.deepEqual(
				fresh.engines.map(({ id }) => id),
				["proa"],
			);
			assert.deepEqual(
				result.engines.find(({ id }) => id === "proa"),
				fresh.engines[0],
			);
			assert.deepEqual(result.source, fresh.source);
			assert.equal(result.capturedAt, fresh.capturedAt);
			assert.equal(result.completedAt, fresh.completedAt);
			assert.deepEqual(fresh.scenario, baseline.scenario);
			for (const field of [
				"preRollSeconds",
				"durationSeconds",
				"repeats",
				"warmupRequests",
				"closedLoopConcurrency",
				"generatorWorkers",
				"starts",
				"warmupStarts",
			]) {
				if (baseline.methodology?.[field] !== undefined)
					assert.deepEqual(
						fresh.methodology[field],
						baseline.methodology[field],
						`Changed suite protocol: ${field}`,
					);
			}
		}
		assert.equal(r.baseline_captured_at, baseline.capturedAt);
		assert.deepEqual(
			result.engines.map(({ id }) => id),
			baseline.engines.map(({ id }) => id),
		);
		for (const engine of baseline.engines)
			if (engine.id !== "proa")
				assert.deepEqual(
					result.engines.find(({ id }) => id === engine.id),
					engine,
					`${engine.id} retained evidence changed`,
				);
	}
}
