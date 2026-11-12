# Full-framework SSR

Production HTTP request, routing, SSR and framework response serialization to complete uncompressed HTML over loopback. Static fixture input is available locally; no database or external I/O. Full-document caching is disabled.

Captured: 2026-11-12T18:15:48.594Z. publication.

| Workload | Framework | Runtime | Capacity (responses/s) | Equal-load P50 (ms) | Equal-load P99 (ms) |
| --- | --- | --- | ---: | ---: | ---: |
| Component page | Proa bbbc96843351 | Rust / Tokio | 62672.9 | 0.329 | 0.679 |
| Component page | Exact 94b8671f70fe | Bun 1.4.2 | 66.1 | 9.679 | 15.368 |
| Component page | Next.js 16.4.6 | Bun 1.4.2 | 448.0 | 3.080 | 6.779 |
| Component page | Astro 7.4.8 | Bun 1.4.2 | 7335.5 | 0.744 | 1.563 |
| Component page | SvelteKit 3.1.0 | Bun 1.4.2 | 6380.3 | 0.756 | 1.226 |
| Product grid | Proa bbbc96843351 | Rust / Tokio | 13836.6 | 0.688 | 0.988 |
| Product grid | Exact 94b8671f70fe | Bun 1.4.2 | 25.6 | 28.809 | 43.766 |
| Product grid | Next.js 16.4.6 | Bun 1.4.2 | 120.7 | 8.396 | 16.972 |
| Product grid | Astro 7.4.8 | Bun 1.4.2 | 2083.7 | 1.246 | 2.906 |
| Product grid | SvelteKit 3.1.0 | Bun 1.4.2 | 1282.7 | 1.554 | 3.049 |
| 1,000-row table | Proa bbbc96843351 | Rust / Tokio | 3507.7 | 1.268 | 1.348 |
| 1,000-row table | Exact 94b8671f70fe | Bun 1.4.2 | 3.2 | 233.735 | 282.444 |
| 1,000-row table | Next.js 16.4.6 | Bun 1.4.2 | 20.3 | 40.755 | 70.483 |
| 1,000-row table | Astro 7.4.8 | Bun 1.4.2 | 298.4 | 5.400 | 8.206 |
| 1,000-row table | SvelteKit 3.1.0 | Bun 1.4.2 | 280.5 | 5.451 | 6.801 |

Equal load by workload: Component page: 10 requests/s; Product grid: 5 requests/s; 1,000-row table: 1 requests/s. 3 independent server starts per phase kind. No errors or generator-limited phases.

Different framework shells and hydration protocols produce different payload sizes.

This workload does not measure browser hydration, application startup, database I/O or developer experience.

A separate contract and capture from the synchronous pure-renderer suite; numbers must not be combined.

Equal-load rates are fixed per workload (10/5/1 requests per second), identical across frameworks. These rates avoid forcing the largest workload into overload; raw latency sample counts are retained.

Capacity windows are 10 seconds for cards/products and 60 seconds for the table, identical across frameworks. The longer table window captures repeated completion batches from the slowest adapter. Equal-load latency windows are 10 seconds; low-rate tail percentiles have few samples.
