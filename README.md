# Framework benchmarks

Reproducible web-framework benchmarks and the source for [frameworks.run](https://frameworks.run).
Each experiment has its own workload, correctness checks and timing boundary.
Render-only timings, complete HTTP requests, streaming and startup answer
different questions; compare results within an experiment.

## Start here

```sh
bun install --frozen-lockfile       # Bun 1.4.2; one workspace and lockfile
bun node_modules/playwright/cli.js install chromium
bun run bench list                 # Discover the active benchmark suites
bun run bench doctor rendering     # Check a suite's requirements
bun run bench run rendering --renderers react,vue --workloads cards
bun run dev                       # Website at http://127.0.0.1:4317
```

The contributor command runs a short correctness/smoke check and preserves
published results. See [CONTRIBUTING.md](CONTRIBUTING.md) before adding an adapter,
changing a workload, or selecting new publication captures.

## Repository map

| Directory | Responsibility |
| --- | --- |
| [`benchmarks/`](benchmarks/README.md) | The five active comparison suites, their adapters, contracts and retained results |
| [`experiments/`](experiments/README.md) | Separate browser-agent, showcase and historical SvelteKit investigations |
| [`tooling/`](tooling/README.md) | Shared CLI, adapters, statistics, load generation, evidence validation and GCP orchestration |
| [`site/`](site/README.md) | The TanStack Start / Cloudflare website |
| [`site/data/`](site/data/README.md) | Website metadata, feature definitions and per-framework source reviews |
| [`fixtures/`](fixtures/README.md) | Shared Rust dump/control programs and retained reference markup |
| [`docs/`](docs/README.md) | Protocols, generated evidence reports, figures and engineering notes |

## Results and methods

- [Interactive results and feature comparison](https://frameworks.run)
- [Render-only scoreboard](docs/reports/scoreboard.md)
- [HTTP, streaming and cold-start report](docs/reports/http-capacity.md)
- [Engineering controls and scaling](docs/reports/engineering.md)
- [Native streaming and browser-completion experiment](docs/reports/sveltekit.md)
- [Figure gallery](docs/figures/README.md)
- [Paired landing-page experiment](experiments/showcase/README.md#landing-page-paired-comparisons)
- [Measurement protocols](docs/protocol.md)

Keep only the latest capture per suite or independent experiment, with its raw
samples and measured source snapshot. The matching `results/archive/` JSON is
its immutable current snapshot. Superseded data is available in Git history.
After publishing a new capture, run `bun tooling/maintenance/prune-results.mjs --write`
(or `--check` to check retention). These files are evidence, not hand-edited
site inputs. Publication must pass campaign, parity and source-integrity checks.

## Checks

```sh
bun run check                     # Lint, types, contracts, website and captures
bun run --cwd site test:browser    # Built-site browser checks
bun run check:publication          # Strict merge / production evidence gate
```

Independent suites can run concurrently on isolated matching GCP workers. Within
each suite, competitors share one machine and workload. See the
[campaign guide](tooling/cloud/README.md).
