# Documentation and reports

| Location | Read it for |
| --- | --- |
| [`protocol.md`](protocol.md) | Measurement boundaries and the owning suite protocols |
| [`reports/scoreboard.md`](reports/scoreboard.md) | Current render-only results and provenance |
| [`reports/http-capacity.md`](reports/http-capacity.md) | HTTP capacity, streaming and startup results |
| [`reports/engineering.md`](reports/engineering.md) | Scaling, allocation, memcpy and application controls |
| [`reports/sveltekit.md`](reports/sveltekit.md) | Separately dated SvelteKit browser-completion comparison |
| [`figures/`](figures/README.md) | Generated chart gallery and its data sources |
| [`engineering/`](engineering/README.md) | Mechanism-specific notes and laboratory comparisons |
| [`archive/`](archive/) | Superseded reports and the earlier result-classification audit |

Reports and figures are generated from retained captures. Use `bun run refresh`
after selecting validated results, and `bun run check:charts` to verify the
figures against their tables. Chart-generation code is in
[`tooling/charts/`](../tooling/charts/).

For implementation changes start with [CONTRIBUTING.md](../CONTRIBUTING.md), the
[benchmark map](../benchmarks/README.md), or the
[website data guide](../site/data/README.md). Documentation here does not change
a benchmark's admission or publication rules.
