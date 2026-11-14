# Benchmark evidence layout

The canonical scoreboard is generated from `results/latest.json`; `results/latest.md` records the detailed statistics, versions and measurement boundaries. `canonical/roster.json` and `canonical/workloads.json` define the current comparison.

Only the latest capture per suite or independent experiment is retained. Its immutable JSON under `results/archive/`, raw samples and measured source snapshot are part of the current evidence set. Superseded captures and reports remain available in Git history.

Standalone controls and product scaling are documented in [the engineering report](../../docs/reports/engineering.md). Showcase, streaming/browser, agent-chain and travel-agent experiments live under `experiments/` and must not be silently combined with the canonical scoreboard.

`./benchmarks/rendering/run-all` runs canonical build, parity, timing, JSON and report generation. `bun benchmarks/rendering/generate-report.mjs --check` checks generated reports. `run_all.sh` also exposes specialized engineering experiments.
