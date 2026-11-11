// A PROA-only refresh keeps peer measurements attached to their original capture.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpus, totalmem, release } from "node:os";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

export async function refreshProa({
	root,
	workloads,
	benchmark,
	parityGate,
	fingerprint,
	temporaryDirectory,
	scaling,
}) {
	const directory = join(root, "rendering/results");
	const path = join(
		directory,
		scaling ? "product-scaling.json" : "latest.json",
	);
	const baselineText = readFileSync(path, "utf8");
	const baseline = JSON.parse(baselineText);
	if (baseline.refresh)
		throw new Error(
			"Refresh requires an original capture, not a previous refresh",
		);
	if (
		baseline.host.cpu_model !== cpus()[0].model ||
		baseline.host.architecture !== process.arch ||
		baseline.host.memory_bytes !== totalmem()
	) {
		throw new Error(
			"PROA-only refresh must run on the original capture machine",
		);
	}
	const started = new Date().toISOString();
	const id = `${baseline.benchmark_version}-proa-${started.replace(/[:.]/g, "-")}`;
	const rawDirectory = join(directory, "raw", id);
	mkdirSync(rawDirectory, { recursive: true });
	writeFileSync(join(rawDirectory, "baseline.json"), baselineText);
	const result = structuredClone(baseline);
	result.capture_id = id;
	result.capture_kind = scaling ? "engineering" : "proa_refresh";
	result.captured_at = started;
	result.measurements.proa = {};
	result.parity.proa = {};
	const records = [];
	const originalCount = process.env.PROA_BENCH_PRODUCT_COUNT;
	try {
		for (const count of scaling ? baseline.counts : [null]) {
			const active =
				count === null
					? workloads
					: [
							{
								id: "products",
								label: `${count}-product grid`,
								cardinality: count,
								description: `${count} product cards and ${count * 5} SVG stars`,
								iterations: count === 12 ? 2000 : count === 96 ? 500 : 100,
								warmup: count === 12 ? 200 : count === 96 ? 50 : 10,
							},
						];
			if (count !== null) process.env.PROA_BENCH_PRODUCT_COUNT = String(count);
			const parity = await parityGate(temporaryDirectory, active);
			for (const workload of active) {
				const key = count ?? workload.id;
				const previous = baseline.parity.proa[key];
				const current = parity.parity.proa[workload.id];
				if (
					current.canonical_sha256 !== previous.canonical_sha256 ||
					current.output_bytes !== previous.output_bytes
				)
					throw new Error(
						`PROA/${key} changed the baseline DOM or response size`,
					);
				result.parity.proa[key] = current;
			}
			const measured = benchmark(temporaryDirectory, active);
			records.push(...measured.processResults);
			for (const workload of active)
				result.measurements.proa[count ?? workload.id] = {
					...measured.measurements.proa[workload.id],
					capture_id: id,
				};
		}
	} finally {
		if (originalCount === undefined)
			delete process.env.PROA_BENCH_PRODUCT_COUNT;
		else process.env.PROA_BENCH_PRODUCT_COUNT = originalCount;
	}
	result.completed_at = new Date().toISOString();
	result.refresh = {
		renderer: "proa",
		baseline_capture_id: baseline.capture_id,
		baseline_captured_at: baseline.captured_at,
		baseline_path: `raw/${id}/baseline.json`,
		baseline_sha256: createHash("sha256").update(baselineText).digest("hex"),
		note: `Only Proa was rerun on ${started.slice(0, 10)}; every peer retains its ${baseline.captured_at.slice(0, 10)} measurement and version. These are different capture dates on the same machine.`,
	};
	result.provenance = {
		harness_commit: execFileSync("git", ["rev-parse", "HEAD"], {
			cwd: root,
			encoding: "utf8",
		}).trim(),
		dirty: true,
		source_sha256: fingerprint,
		os_release: release(),
	};
	const lock = readFileSync(join(root, "Cargo.lock"), "utf8");
	const block = lock
		.split("[[package]]")
		.find((b) => b.includes('name = "proa_core"'));
	result.versions.Proa = `${block.match(/version = "([^"]+)"/)[1]} @ ${block.match(/#([a-f0-9]{40})/)[1]} / ${execFileSync("rustc", ["--version"], { encoding: "utf8" }).trim()}`;
	const raw = `raw/${id}/process-summaries.json`;
	const oldRaw = scaling
		? baseline.raw_artifact
		: baseline.raw_artifacts.find((x) => /process summaries/i.test(x.label))
				.path;
	const retainedRecords = JSON.parse(
		readFileSync(join(directory, oldRaw), "utf8"),
	)
		.filter((x) => x.framework_id !== "proa")
		.map((x) => ({ ...x, source_capture_id: baseline.capture_id }));
	const allRecords = [
		...retainedRecords,
		...records.map((x) => ({ ...x, source_capture_id: id })),
	];
	writeFileSync(
		join(directory, raw),
		JSON.stringify(allRecords, null, 2) + "\n",
	);
	result.commands = [
		`./rendering/run-all --refresh-proa${scaling ? " --product-scaling" : ""}`,
	];
	result.command = result.commands[0];
	result.limitations = [...baseline.limitations, result.refresh.note];
	if (scaling) result.raw_artifact = raw;
	else
		result.raw_artifacts = [
			{ label: "Proa refresh process summaries", path: raw },
			{ label: "Original peer capture", path: result.refresh.baseline_path },
		];
	mkdirSync(join(directory, "archive"), { recursive: true });
	const json = JSON.stringify(result, null, 2) + "\n";
	writeFileSync(join(directory, "archive", `${id}.json`), json);
	writeFileSync(path, json);
	console.log(result.refresh.note);
}
