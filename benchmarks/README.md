# Active benchmark suites

Use `bun run bench list`, `bun run bench doctor <suite>` and
`bun run bench run <suite>` from the repository root. The
[`suites.json`](suites.json) registry supplies entrypoints, contracts, smoke
defaults and capture paths to the CLI, website and campaign controller.

| Suite ID | Directory | Measurement boundary |
| --- | --- | --- |
| `rendering` | [`rendering/`](rendering/README.md) | Prepared data → fresh owned native HTML output |
| `framework` | [`framework-ssr/`](framework-ssr/README.md) | Production framework route → complete HTTP response |
| `http` | [`http/`](http/README.md) | Capacity and equal offered-load latency for canonical pages |
| `streaming` | [`streaming/`](streaming/README.md) | Scheduled requests → streamed shell and resolved completion |
| `startup` | [`cold-start/`](cold-start/README.md) | Fresh process spawn → first complete response |

Each directory owns its runner, validation, fixtures/adapters and `results/`.
`results/latest.json` selects an immutable capture in `results/archive/`; raw
evidence and the exact measured sources live under `results/raw/<capture-id>/`.
Smoke and local outputs cannot replace publication captures.

The renderer implementations are in `rendering/src/` (Rust) and
`rendering/external/<tool>/` (other runtimes). Full-framework applications are
in `framework-ssr/adapters/<framework>/`. The same SvelteKit application can be
used by more than one suite; a framework is not itself a benchmark suite.

Keep exploratory work in [`../experiments/`](../experiments/README.md), shared
infrastructure in [`../tooling/`](../tooling/README.md), and generated prose and
figures in [`../docs/`](../docs/README.md). See
[CONTRIBUTING.md](../CONTRIBUTING.md) for adding frameworks and workloads.
