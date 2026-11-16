# Rendering benchmarks

This directory separates one public comparison from the renderer engineering laboratory.

## Canonical scoreboard

The canonical suite measures how long each renderer takes to turn the same prepared data into the same eight server-rendered pages while returning an independently owned response. It also records the native process's peak resident memory separately from the render timer.

The fixed roster is in [`canonical/roster.json`](canonical/roster.json), the workloads are in [`canonical/workloads.json`](canonical/workloads.json), and the contract is in [`protocol.md`](protocol.md). Run the entire gate and measurement pipeline with:

```sh
./benchmarks/rendering/run-all
```

That command builds every adapter, checks all 168 renderer/workload outputs, refuses to measure if any parity cell fails, benchmarks a complete roster with one sampling policy, writes [`results/latest.json`](results/latest.json), and generates [`results/latest.md`](results/latest.md) plus the root scoreboard. Exact uses its explicitly disclosed native adaptation.

The render-only Proa lane returns a fresh independently owned `RenderBuffer`; it does not flatten the pages into a `String`. Parity dumps flatten only outside timing. String conversion remains a separate engineering control.

The selected capture records the tested revisions, per-workload host identities, dates and source fingerprint. Parallel workload captures keep all 21 competitors together on the same isolated host for each workload, then retain every original shard and raw process observation in the combined result. See the [GCP campaign instructions](../../tooling/cloud/README.md).

Peak RSS is the native process's lifetime high-water mark, including runtime startup, prepared data, warmup, rendering and verification. The site shows the median of five process peaks in MiB. This is whole-process memory, not bytes allocated per render; older captures without RSS remain unmeasured. See the [memory protocol](protocol.md#process-memory).

## Engineering laboratory

[`engineering/`](../../docs/engineering/) contains construction-path experiments, allocation audits, integer-formatting studies, memcpy controls, runtime comparisons, and application-shaped fixtures. These experiments remain useful, but they do not add rows to the public scoreboard.

Compatibility scripts and specialized benches remain available through [`run_all.sh`](run_all.sh). Their results are engineering evidence unless they were produced by `run-all` and appear in the same canonical JSON capture.

## Evidence map

- [`results/latest.md`](results/latest.md): detailed canonical report
- [`results/latest.json`](results/latest.json): sole source for public numbers
- [`MIGRATION.md`](MIGRATION.md): where each old result moved

## Refresh only PROA

From an original full capture on the same machine, update the three lockfiles with `tooling/maintenance/refresh-proa.sh`, then run:

```sh
./rendering/run-all --refresh-proa
./rendering/run-all --refresh-proa --product-scaling
node benchmarks/http/run.mjs --engines proa --out benchmarks/http/results/proa-pr83.json
node benchmarks/cold-start/run.mjs --engines proa --out benchmarks/cold-start/results/proa-pr83.json
node benchmarks/streaming/run.mjs --engines proa --out benchmarks/streaming/results/proa-pr83.json
node tooling/maintenance/merge-proa-refresh.mjs
node experiments/sveltekit-streaming/refresh-proa.mjs
node experiments/sveltekit-streaming/report.mjs
bun run refresh
```

Use pinned Node 24.20.0. These commands keep the full default sampling protocols. The refresh refuses a different host or a changed DOM/response size. It retains the original capture and peer versions, with explicit dates rather than relabeling peer measurements as new. A refresh cannot use another refresh as its baseline; restore the retained original capture before repeating it.

For the six Rust Criterion suites, linked showcase rendering, memcpy, output buffers, browser JavaScript, and three standalone Rust fixtures, run `tooling/maintenance/bench-proa-engineering.sh /path/to/proa` with the CLI built from the locked Proa revision. This times only PROA rows, retains peer engineering context separately, and generates the current engineering tables and compressed raw evidence.
