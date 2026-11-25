# Benchmark protocols

The public server-rendering scoreboard follows [`benchmarks/rendering/protocol.md`](../benchmarks/rendering/protocol.md). That document defines its workload, ownership, parity, sampling, artifact, and publication contracts.

Three suites measure HTTP responses with the shared load-driver rules in [`tooling/load/README.md`](../tooling/load/README.md):

- [`benchmarks/http/`](../benchmarks/http/) serves the canonical pages through renderer servers on one core per engine and reports throughput, CPU per response, and memory.
- [`benchmarks/framework-ssr/`](../benchmarks/framework-ssr/) measures complete HTML responses through each framework’s production routes.
- [`benchmarks/streaming/`](../benchmarks/streaming/) streams a Suspense-heavy page through Proa, Marko, React, and Leptos.

The repository's other suites answer different questions and retain their methods beside their evidence:

- [`experiments/showcase/`](../experiments/showcase/) covers application-shaped SSR and verified browser JavaScript;
- [`experiments/agent-chain/`](../experiments/agent-chain/) covers a deterministic browser-agent chain;
- [`experiments/travel-agent/`](../experiments/travel-agent/) covers a multi-site browser-agent workflow; and
- [`docs/engineering/`](engineering/) contains mechanism and implementation experiments.

[`compare/`](../compare/) diffs two retained JSON captures of one suite. It does not join values across suites, and it does not replace a capture.

Never join values from those suites into the renderer scoreboard. Superseded reports are available in Git history.
