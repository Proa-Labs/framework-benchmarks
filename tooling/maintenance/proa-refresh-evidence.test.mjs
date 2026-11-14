import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { verifyRefresh } from "./proa-refresh-evidence.mjs";

test("PROA-only refresh rejects changed peers, changed baselines, and escaped paths", () => {
	const directory = mkdtempSync(join(tmpdir(), "proa-evidence-"));
	try {
		const baseline = {
			host: { cpuModel: "test" },
			capturedAt: "2026-10-21",
			engines: [
				{ id: "proa", value: 2 },
				{ id: "react", value: 20 },
			],
		};
		const text = JSON.stringify(baseline);
		writeFileSync(join(directory, "baseline.json"), text);
		const result = {
			...structuredClone(baseline),
			refresh: {
				renderer: "proa",
				note: "Only PROA refreshed",
				baseline_captured_at: baseline.capturedAt,
				baseline_path: "baseline.json",
				baseline_sha256: createHash("sha256").update(text).digest("hex"),
			},
		};
		result.engines[0].value = 1;
		verifyRefresh(result, directory);
		const changedPeer = structuredClone(result);
		changedPeer.engines[1].value = 10;
		assert.throws(
			() => verifyRefresh(changedPeer, directory),
			/retained evidence changed/,
		);
		assert.throws(
			() =>
				verifyRefresh({ ...result, host: { cpuModel: "other" } }, directory),
			/host metadata/,
		);
		assert.throws(
			() =>
				verifyRefresh(
					{
						...result,
						refresh: { ...result.refresh, baseline_path: "../baseline.json" },
					},
					directory,
				),
			/escapes/,
		);
		writeFileSync(join(directory, "baseline.json"), text + " ");
		assert.throws(() => verifyRefresh(result, directory), /digest changed/);
	} finally {
		rmSync(directory, { recursive: true, force: true });
	}
});
