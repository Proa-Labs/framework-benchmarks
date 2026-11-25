# Capture comparison

This command diffs two retained JSON captures of the **same** suite. It does
not join renderer-only numbers with HTTP numbers, and it does not rewrite
evidence pages.

Supported artifacts:

| Suite | Typical path | Headline cells |
| --- | --- | --- |
| Canonical scoreboard | `benchmarks/rendering/results/latest.json` or `benchmarks/rendering/results/archive/*.json` | P50 render time, payload bytes |
| Product-grid scaling | `benchmarks/rendering/results/product-scaling.json` | P50 at each card count |
| Canonical pages over HTTP | `benchmarks/http/results/latest.json` | Sustained responses/s, CPU per response, equal-load P50 |
| Cold start | `benchmarks/cold-start/results/latest.json` | First-response P50, RSS after first response |

Reductions match the published tables: HTTP capacity cells are medians of the
closed-loop (and equal-load) phases; canonical cells are the stored process
P50s.

## Run

```sh
node compare/run.mjs \
  benchmarks/rendering/results/archive/canonical-ssr-v1-2026-11-15T22-15-04-069Z-ea202576.json \
  benchmarks/rendering/results/latest.json

node compare/run.mjs --json --out /tmp/page-load-delta.json \
  benchmarks/http/results/latest.json \
  benchmarks/http/results/latest.json
```

`--suite canonical` (or `product-scaling`, `page-load`, `cold-start`) fails if
the files are a different suite. `--json` writes the structured comparison.
`--out` writes a file instead of stdout.

A missing cell on one side is listed as added or removed rather than filled
from another capture.

## Tests

```sh
bun test compare/compare.test.mjs
```
