# Full-framework SSR

Production HTTP request, routing, SSR and framework response serialization to complete uncompressed HTML over loopback. Static fixture input is available locally; no database or external I/O. Full-document caching is disabled.

Captured: 2026-11-13T06:10:17.049Z. publication.

| Workload | Framework | Runtime | Capacity (responses/s) | Equal-load P50 (ms) | Equal-load P99 (ms) |
| --- | --- | --- | ---: | ---: | ---: |
| Component page | Proa bbbc96843351 | Rust / Tokio | 59754.7 | 0.382 | 0.764 |
| Component page | Exact 94b8671f70fe | Bun 1.4.2 | 66.0 | 10.268 | 17.577 |
| Component page | Next.js 16.4.6 | Bun 1.4.2 | 428.8 | 3.357 | 9.882 |
| Component page | Astro 7.4.8 | Bun 1.4.2 | 6975.4 | 0.798 | 1.764 |
| Component page | SvelteKit 3.1.0 | Bun 1.4.2 | 5987.4 | 0.818 | 1.363 |
| Product grid | Proa bbbc96843351 | Rust / Tokio | 13384.8 | 0.721 | 1.102 |
| Product grid | Exact 94b8671f70fe | Bun 1.4.2 | 25.6 | 30.745 | 42.599 |
| Product grid | Next.js 16.4.6 | Bun 1.4.2 | 114.4 | 9.963 | 24.870 |
| Product grid | Astro 7.4.8 | Bun 1.4.2 | 1946.8 | 1.387 | 3.103 |
| Product grid | SvelteKit 3.1.0 | Bun 1.4.2 | 1192.1 | 1.654 | 2.975 |
| 1,000-row table | Proa bbbc96843351 | Rust / Tokio | 3323.4 | 1.519 | 1.591 |
| 1,000-row table | Exact 94b8671f70fe | Bun 1.4.2 | 3.2 | 250.034 | 306.157 |
| 1,000-row table | Next.js 16.4.6 | Bun 1.4.2 | 19.2 | 50.817 | 82.029 |
| 1,000-row table | Astro 7.4.8 | Bun 1.4.2 | 281.9 | 6.189 | 11.474 |
| 1,000-row table | SvelteKit 3.1.0 | Bun 1.4.2 | 262.3 | 7.599 | 10.050 |

Equal load by workload: Component page: 10 requests/s; Product grid: 5 requests/s; 1,000-row table: 1 requests/s. 3 independent server starts per phase kind. No errors or generator-limited phases.

Different framework shells and hydration protocols produce different payload sizes.

This workload does not measure browser hydration, application startup, database I/O or developer experience.

A separate contract and capture from the synchronous pure-renderer suite; numbers must not be combined.

Equal-load rates are fixed per workload (10/5/1 requests per second), identical across frameworks. These rates avoid forcing the largest workload into overload; raw latency sample counts are retained.

Capacity windows are 10 seconds for cards/products and 60 seconds for the table, identical across frameworks. The longer table window captures repeated completion batches from the slowest adapter. Equal-load latency windows are 10 seconds; low-rate tail percentiles have few samples.
