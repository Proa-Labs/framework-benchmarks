# Benchmark protocols

The public server-rendering scoreboard follows [`benchmarks/rendering/protocol.md`](../benchmarks/rendering/protocol.md). That document defines its workload, ownership, parity, sampling, artifact, and publication contracts.

Two HTTP suites wrap the same pages in each framework's production server and follow the shared load-driver rules in [`tooling/load/README.md`](../tooling/load/README.md):

- [`benchmarks/http/`](../benchmarks/http/) serves the three canonical pages on one core per engine and reports sustained throughput, CPU per response, and memory; and
- [`benchmarks/streaming/`](../benchmarks/streaming/) streams a Suspense-heavy page through Proa, Marko, and React.

[`fleet-size/`](../fleet-size/) translates a publication HTTP capture's CPU per response into cores needed at a chosen request rate. It does not join that translation back into the renderer scoreboard.

The repository's other suites answer different questions and retain their methods beside their evidence:

- [`experiments/showcase/`](../experiments/showcase/) covers application-shaped SSR and verified browser JavaScript;
- [`experiments/agent-chain/`](../experiments/agent-chain/) covers a deterministic browser-agent chain;
- [`experiments/travel-agent/`](../experiments/travel-agent/) covers a multi-site browser-agent workflow; and
- [`docs/engineering/`](engineering/) contains mechanism and implementation experiments.

Never join values from those suites into the renderer scoreboard. Superseded reports are available in Git history.
