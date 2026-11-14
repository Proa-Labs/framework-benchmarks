# Cold-start benchmark

Measures a fresh production server process from spawn to its first complete
product-grid response. This includes process initialization, routing and rendering;
it is separate from the warmed render-only and HTTP capacity experiments.

From the repository root:

```sh
bun run bench doctor startup
bun run bench run startup             # Short local check; preserves publication
bun run bench run startup --publish   # Full 15 starts and 2 warmup starts per engine
bun run bench validate startup
```

The runner [`run.mjs`](run.mjs) owns engine commands and the production protocol.
[`report.mjs`](report.mjs) validates captures and generates the cold-start section
of the [HTTP report](../../docs/reports/http-capacity.md#cold-start-to-first-response).
[`sources.json`](sources.json) declares measured inputs. Results, raw evidence
and exact source snapshots live in [`results/`](results/).

Use the [parallel campaign runner](../../tooling/cloud/README.md) for publication.
All engines in this comparison run on one isolated worker. See
[CONTRIBUTING.md](../../CONTRIBUTING.md) for setup and evidence rules.
