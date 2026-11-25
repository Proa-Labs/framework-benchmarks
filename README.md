# SSR benchmarks for web frameworks

Reproducible **server-side rendering (SSR) benchmarks** and **web framework benchmarks**
for comparing rendering time, HTTP throughput, streaming latency, cold starts and
memory usage. We render shared pages across frameworks and template engines, check
their output, and publish the code, pinned versions and raw measurements.

**[Explore the benchmark results and feature comparison → frameworks.run](https://frameworks.run)**

## Frameworks and renderers

The SSR Rendering suite includes 21 implementations: Askama, Astro, Dioxus, Exact,
Go html/template, Handlebars, Jinja2, jte, Leptos, Marko, Next.js, PHP, Proa, Rails,
React, Rocker, Sailfish, Svelte, SvelteKit, Topcoat and Vue. Coverage varies by
experiment; adapted fixtures and unsupported workloads are explicitly marked.
See the [renderer roster](benchmarks/rendering/canonical/roster.json) and
[framework classifications](https://frameworks.run/about#classification).

## What the benchmarks measure

| Experiment | Measurement |
| --- | --- |
| [SSR Rendering](benchmarks/rendering/README.md) | Prepared data to fresh owned HTML output; render latency and peak process RSS |
| [Framework SSR](benchmarks/framework-ssr/README.md) | Production framework routing through the complete HTTP response |
| [HTTP](benchmarks/http/README.md) | Sustained throughput, equal-load latency, CPU and memory |
| [Streaming](benchmarks/streaming/README.md) | Streamed shell and resolved response completion under load |
| [Cold Start](benchmarks/cold-start/README.md) | Fresh server process to its first complete response |

Workloads include a component page, product grid, 1,000-row table, Airbnb landing
page, Nike catalog, GitHub pull-request review, Sentry logs and ESPN game page.
These are shared benchmark re-creations, not measurements of those companies’ sites.

Compare results within the same experiment: render-only time excludes HTTP, and
server measurements exclude browser JavaScript execution. Competitors share a
machine and workload within each suite; published results must pass output parity,
sampling and source-integrity checks. Read the [measurement protocols](docs/protocol.md)
and inspect the [rendering results](docs/reports/scoreboard.md) or
[HTTP, streaming and startup results](docs/reports/http-capacity.md).

## Run an SSR benchmark

Use **Bun 1.4.2**. This short contributor run checks selected adapters without
installing every language toolchain or replacing published results.

```sh
bun install --frozen-lockfile
bun node_modules/playwright/cli.js install chromium
bun run bench list
bun run bench doctor rendering
bun run bench run rendering --renderers react,vue --workloads cards
```

Smoke results validate implementations. The publication protocol governs rankings.

[Add a framework or template engine](CONTRIBUTING.md#add-a-renderer) starting
with one renderer and one workload. See [CONTRIBUTING.md](CONTRIBUTING.md) for
other changes, and the [GCP campaign guide](tooling/cloud/README.md) for isolated
parallel benchmark runs.

## Repository guide

[Benchmarks](benchmarks/README.md) · [Experiments](experiments/README.md) ·
[Tooling](tooling/README.md) · [Website](site/README.md) ·
[Website data](site/data/README.md) · [Fixtures](fixtures/README.md) ·
[Reports and protocols](docs/README.md)

Keep the latest validated capture and its raw samples per experiment; older
captures remain in Git history. See the [retention rules](CONTRIBUTING.md#data-is-generated-json)
for publication and cleanup. Run `bun run check` for repository checks,
`bun run --cwd site test:browser` for browser checks, and
`bun run check:publication` for the strict publication gate.

Related work: [eknkc’s SSR Framework Benchmark](https://github.com/eknkc/ssr-benchmark),
an earlier comparison focused on JavaScript SSR stacks.

Maintained by [Proa Labs](https://github.com/Proa-Labs), which develops Proa, one of
the measured frameworks. Performance is one input to choosing a framework;
[features and integration choices](https://frameworks.run/features) matter too.

[Apache-2.0](LICENSE) · [Third-party attribution](benchmarks/rendering/UPSTREAM_LICENSES.md)
