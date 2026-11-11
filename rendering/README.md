# Rendering benchmarks

This directory separates one public comparison from the renderer engineering laboratory.

## Canonical scoreboard

The canonical suite asks one question: how long does each renderer take to turn the same prepared data into the same three server-rendered pages while returning an independently owned response?

The fixed roster is in [`canonical/roster.json`](canonical/roster.json), the workloads are in [`canonical/workloads.json`](canonical/workloads.json), and the contract is in [`protocol.md`](protocol.md). Run the entire gate and measurement pipeline with:

```sh
./rendering/run-all
```

That command builds every adapter, dumps all 51 renderer/workload outputs, refuses to measure if any parity cell fails, benchmarks a complete roster with one sampling policy, writes [`results/latest.json`](results/latest.json), and generates [`results/latest.md`](results/latest.md) plus the root scoreboard.

The render-only Proa lane returns a fresh independently owned `RenderBuffer`; it does not flatten the pages into a `String`. Parity dumps flatten only outside timing. String conversion remains a separate engineering control.

The current result refreshes only Proa at `bbbc968` after PR #84 on the same Apple M4 Max used for the October 21 baseline. All other renderer measurements and versions retain that baseline date. The retained baseline, its hash, and the new process summaries are linked from the capture; peer measurements are checked for exact preservation.

## Engineering laboratory

[`engineering/`](engineering/) contains construction-path experiments, allocation audits, integer-formatting studies, memcpy controls, runtime comparisons, and application-shaped fixtures. These experiments remain useful, but they do not add rows to the public scoreboard.

Compatibility scripts and specialized benches remain available through [`run_all.sh`](run_all.sh). Their results are engineering evidence unless they were produced by `run-all` and appear in the same canonical JSON capture.

## Evidence map

- [`results/latest.md`](results/latest.md): detailed canonical report
- [`results/latest.json`](results/latest.json): sole source for public numbers
- [`RESULT_TABLE_AUDIT.md`](RESULT_TABLE_AUDIT.md): classification of every pre-refactor result table
- [`MIGRATION.md`](MIGRATION.md): where each old result moved
- [`../archive/legacy-cross-language.md`](../archive/legacy-cross-language.md): non-parity-gated adapter loop
- [`../archive/public-report-2026-08-31.md`](../archive/public-report-2026-08-31.md): complete pre-refactor mixed report, with local links rebased

## Refresh only PROA

From an original full capture on the same machine, update the three lockfiles with `scripts/refresh-proa.sh`, then run:

```sh
./rendering/run-all --refresh-proa
./rendering/run-all --refresh-proa --product-scaling
node page-load/run.mjs --engines proa --out page-load/results/proa-pr83.json
node cold-start/run.mjs --engines proa --out cold-start/results/proa-pr83.json
node suspense-load/run.mjs --engines proa --out suspense-load/results/proa-pr83.json
node scripts/merge-proa-refresh.mjs
node sveltekit/refresh-proa.mjs
node sveltekit/report.mjs
pnpm run refresh
```

Use pinned Node 24.20.0. These commands keep the full default sampling protocols. The refresh refuses a different host or a changed DOM/response size. It retains the original capture and peer versions, with explicit dates rather than relabeling peer measurements as new. A refresh cannot use another refresh as its baseline; restore the retained original capture before repeating it.

For the six Rust Criterion suites, linked showcase rendering, memcpy, output buffers, browser JavaScript, and three standalone Rust fixtures, run `scripts/bench-proa-engineering.sh /path/to/proa` with the CLI built from the locked Proa revision. This times only PROA rows, retains peer engineering context separately, and generates the current engineering tables and compressed raw evidence.
