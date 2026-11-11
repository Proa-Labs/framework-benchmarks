import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseTables, pick } from "../charts/lib/tables.mjs";
import { PAGES } from "../showcase/capture_memcpy.mjs";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const path = join(root, "rendering/results/proa-pr83-criterion.json");
const baselineName =
	"proa-" +
	readFileSync(join(root, "Cargo.lock"), "utf8")
		.match(/name = "proa_core"[\s\S]*?#([a-f0-9]{40})/)[1]
		.slice(0, 12);
const read = (p) => JSON.parse(readFileSync(p, "utf8"));
const hash = (s) => createHash("sha256").update(s).digest("hex");
if (process.argv.includes("--collect")) {
	const rows = [];
	const walk = (dir) => {
		for (const entry of readdirSync(dir, { withFileTypes: true })) {
			if (!entry.isDirectory()) continue;
			const sub = join(dir, entry.name);
			if (entry.name === baselineName) {
				const benchmark = read(
					existsSync(join(sub, "benchmark.json"))
						? join(sub, "benchmark.json")
						: join(dir, "new/benchmark.json"),
				);
				if (!benchmark.full_id.includes("proa"))
					throw new Error(`Unexpected peer timing: ${benchmark.full_id}`);
				rows.push({
					id: benchmark.full_id,
					benchmark,
					estimates: read(join(sub, "estimates.json")),
					sample: read(join(sub, "sample.json")),
				});
			} else if (!["base", "new", "change"].includes(entry.name)) walk(sub);
		}
	};
	walk(join(root, "target/criterion"));
	if (rows.length < 30)
		throw new Error(`Only ${rows.length} PROA Criterion rows found`);
	const groups = [
		"ssr_frameworks",
		"escape_heavy",
		"large_page",
		"request_burst",
		"airbnb_search",
		"showcase",
		"integer_serialization_fresh_owned",
		"integer_serialization_reused_contiguous",
		"topcoat_upstream_product_grid",
	];
	for (const group of groups)
		if (!rows.some(({ id }) => id.startsWith(group + "/")))
			throw new Error(`Missing Criterion group ${group}`);
	const logsDirectory = process.argv.includes("--logs-dir")
		? process.argv[process.argv.indexOf("--logs-dir") + 1]
		: join(root, "rendering/results/raw/proa-pr83-criterion");
	const logs = Object.fromEntries(
		[
			"ssr_comparison",
			"targeted_comparison",
			"airbnb_search_comparison",
			"showcase_pages",
			"integer_serialization",
			"topcoat_comparison",
		].map((name) => [
			name,
			readFileSync(join(logsDirectory, `proa-pr83-${name}.log`), "utf8"),
		]),
	);
	const lock = readFileSync(join(root, "Cargo.lock"), "utf8");
	writeFileSync(
		path,
		JSON.stringify(
			{
				captured_at: new Date().toISOString(),
				criterion_baseline: baselineName,
				proa_revision: lock.match(
					/name = "proa_core"[\s\S]*?#([a-f0-9]{40})/,
				)[1],
				harness_commit: execFileSync("git", ["rev-parse", "HEAD"], {
					cwd: root,
					encoding: "utf8",
				}).trim(),
				lock_sha256: hash(lock),
				command: `scripts/bench-proa-engineering.sh <locked Proa CLI>`,
				logs,
				rows,
			},
			null,
			2,
		) + "\n",
	);
}
const capture = read(path);
const byId = new Map(capture.rows.map((row) => [row.id, row]));
const triple = (id) => {
	const row = byId.get(id);
	if (!row) throw new Error(`Missing refreshed Criterion measurement: ${id}`);
	const estimate = row.estimates.slope ?? row.estimates.mean;
	return [
		estimate.confidence_interval.lower_bound,
		estimate.point_estimate,
		estimate.confidence_interval.upper_bound,
	]
		.map((n) => (n / 1000).toFixed(4))
		.join(" / ");
};
const archive = readFileSync(
	join(root, "archive/public-report-2026-08-31.md"),
	"utf8",
);
const tables = parseTables(archive);
const std = pick(tables, [
	"Standard-page row",
	"Output bytes/render",
	"Raw time, µs/10 renders",
]);
const criteria = pick(tables, [
	"Criterion row",
	"Output bytes",
	"Raw time, µs",
]);
const standardIds = {
	"Proa fresh owned": "ssr_frameworks/proa/fresh_owned_full",
	"Proa reused chained": "ssr_frameworks/proa/reused_chained_full",
};
const standard = std.rows.map((cells) => {
	const r = [...cells];
	if (standardIds[r[0]]) r[2] = triple(standardIds[r[0]]);
	return "| " + r.join(" | ") + " |";
});
const criterion = criteria.rows.map((cells) => {
	const r = [...cells];
	const id = r[0].replace(/`/g, "");
	if (id.includes("proa")) {
		r[2] = triple(id);
		if (id.startsWith("showcase/") && capture.logs) {
			const names = [
				["home_", "Home"],
				["search_", "Search"],
				["listing_", "Listing"],
				["nike_catalog_", "Nike catalog"],
				["nike_product_", "Nike product"],
				["ebay_cards_", "eBay cards (60)"],
				["ebay_chrome_", "eBay chrome (60)"],
				["ebay_real_chrome_", "eBay real chrome (60)"],
				["sentry_otel_", "Sentry OpenTelemetry (400 rows)"],
			];
			const label = names.find(([prefix]) =>
				id.startsWith("showcase/" + prefix),
			)?.[1];
			const line = capture.logs.showcase_pages
				.split("\n")
				.find((line) => line.startsWith(label + ":"));
			const bytes = line?.match(/Proa (\d+) bytes/)?.[1];
			if (!bytes) throw new Error(`Missing output size for ${id}`);
			r[1] = Number(bytes).toLocaleString("en-US");
		}
	}
	return "| " + r.join(" | ") + " |";
});
const ssr = read(
	join(
		root,
		existsSync(join(root, "showcase/results/ssr_raw.json"))
			? "showcase/results/ssr_raw.json"
			: "showcase/results/ssr-pr83.json",
	),
);
const corpus = ssr.summaries.map((s) => {
	const c = s.processMedianUs.medianCi95;
	return `| ${PAGES[s.page]} | ${s.outputBytes.toLocaleString("en-US")} | ${s.totalRecordedRenders.toLocaleString("en-US")} | ${s.processMedianUs.p50.toFixed(3)} [${c.low.toFixed(3)}, ${c.high.toFixed(3)}] | ${s.pooledDescriptiveUs.p95.toFixed(3)} | ${s.byteDeterministicAcrossProcesses ? "yes" : `no; ${s.rawOutputSha256s.length} raw hashes, 1 canonical hash`} |`;
});
const extra = capture.rows
	.filter(({ id }) => id.startsWith("integer_") || id.startsWith("topcoat_"))
	.map(({ id }) => `| \`${id}\` | ${triple(id)} |`);
const block = `<!-- proa-engineering:start -->
## PROA engineering refresh

**${capture.captured_at.slice(0, 10)} UTC** · Proa \`${capture.proa_revision}\` · Apple M4 Max.
Only PROA was rerun. Peer Criterion rows below retain their August 30–31 measurements; they are dated engineering context, not simultaneous comparisons. Output ownership, batch sizes, and benchmark sample policies remain as declared in each fixture. Intervals are Criterion's 95% slope intervals (mean intervals for flat sampling). The [retained estimates and samples](rendering/results/proa-pr83-criterion.json) contain all ${capture.rows.length} measured PROA rows and the reproduction command.

| Refreshed standard-page row | Output bytes/render | Raw time, µs/10 renders |
| --- | ---: | ---: |
${standard.join("\n")}

| Refreshed Criterion row | Output bytes | Raw time, µs |
| --- | ---: | ---: |
${criterion.join("\n")}

The [data table](rendering/results/proa-pr83-data_table_bench.json), [marketplace SRP](rendering/results/proa-pr83-ebay_srp_bench.json), and [synthetic listings](rendering/results/proa-pr83-ebay_srp_real_bench.json) standalone PROA fixtures were rerun at their default sample counts. Their original cross-language comparisons remain archived.

The integer and product-grid controls below were also rerun for PROA only. Values are µs per render; fresh and reused ownership remain separate.

| PROA benchmark ID | Raw time, µs |
| --- | ---: |
${extra.join("\n")}

### Refreshed linked showcase corpus

The locked deployable fixture covers all twelve pages, five independent processes per page, with the original warmup and iteration counts. Raw byte variation is retained separately from canonical JSON-key-order equivalence. The process summaries, binary/source digests and compressed raw-sample link are in [the SSR artifact](showcase/results/ssr-pr83.json). The [browser JavaScript capture](showcase/results/client-js-pr83.json) also reruns all four interactive pages under both desktop and 4× CPU-throttled mobile profiles, with 30 recorded navigations per page/profile. Figure 06 uses these new samples; the original application capture remains in the archive below.

| Refreshed showcase page | Output bytes | Recorded renders | Process-median P50 µs [95% CI] | Pooled P95 µs | Raw bytes stable? |
| --- | ---: | ---: | ---: | ---: | --- |
${corpus.join("\n")}
<!-- proa-engineering:end -->`;
const docPath = join(root, "engineering.md");
let doc = readFileSync(docPath, "utf8");
const start = doc.indexOf("<!-- proa-engineering:start -->");
if (start >= 0) {
	const end =
		doc.indexOf("<!-- proa-engineering:end -->", start) +
		"<!-- proa-engineering:end -->".length;
	doc = doc.slice(0, start) + block + doc.slice(end);
} else {
	const at = doc.indexOf("<!-- historical-results:start -->");
	doc = doc.slice(0, at) + block + "\n\n" + doc.slice(at);
}
if (process.argv.includes("--check")) {
	if (readFileSync(docPath, "utf8") !== doc)
		throw new Error("PROA engineering tables are stale");
} else writeFileSync(docPath, doc);
console.log(
	`Updated engineering evidence for ${capture.rows.length} PROA Criterion rows and ${ssr.summaries.length} linked pages`,
);
