# Full-framework SSR

Production HTTP request, routing, SSR and framework response serialization to complete uncompressed HTML over loopback. Static fixture input is available locally; no database or external I/O. Full-document caching is disabled.

Captured: 2026-11-14T04:55:09.335Z. publication.

| Workload | Framework | Runtime | Capacity (responses/s) | Equal-load P50 (ms) | Equal-load P99 (ms) |
| --- | --- | --- | ---: | ---: | ---: |
| Component page | Proa bbbc96843351 | Rust / Tokio | 60387.4 | 0.403 | 0.731 |
| Component page | Exact 94b8671f70fe | Bun 1.4.2 | 64.8 | 10.562 | 19.870 |
| Component page | Next.js 16.4.6 | Bun 1.4.2 | 409.6 | 3.751 | 10.832 |
| Component page | Astro 7.4.8 | Bun 1.4.2 | 6847.2 | 0.843 | 1.980 |
| Component page | SvelteKit 3.1.0 | Bun 1.4.2 | 5834.3 | 0.874 | 1.479 |
| Product grid | Proa bbbc96843351 | Rust / Tokio | 14907.3 | 0.773 | 1.224 |
| Product grid | Exact 94b8671f70fe | Bun 1.4.2 | 25.4 | 32.743 | 49.160 |
| Product grid | Next.js 16.4.6 | Bun 1.4.2 | 108.8 | 11.742 | 27.120 |
| Product grid | Astro 7.4.8 | Bun 1.4.2 | 1891.9 | 1.537 | 3.385 |
| Product grid | SvelteKit 3.1.0 | Bun 1.4.2 | 1139.6 | 1.981 | 4.030 |
| 1,000-row table | Proa bbbc96843351 | Rust / Tokio | 4100.9 | 1.514 | 1.782 |
| 1,000-row table | Exact 94b8671f70fe | Bun 1.4.2 | 3.2 | 257.317 | 339.702 |
| 1,000-row table | Next.js 16.4.6 | Bun 1.4.2 | 19.2 | 49.241 | 80.460 |
| 1,000-row table | Astro 7.4.8 | Bun 1.4.2 | 274.3 | 6.809 | 11.977 |
| 1,000-row table | SvelteKit 3.1.0 | Bun 1.4.2 | 253.5 | 7.451 | 9.439 |

Equal load by workload: Component page: 10 requests/s; Product grid: 5 requests/s; 1,000-row table: 1 requests/s. 3 independent server starts per phase kind. No errors or generator-limited phases.

Different framework shells and hydration protocols produce different payload sizes.

This workload does not measure browser hydration, application startup, database I/O or developer experience.

A separate contract and capture from the synchronous pure-renderer suite; numbers must not be combined.

Equal-load rates are fixed per workload (10/5/1 requests per second), identical across frameworks. These rates avoid forcing the largest workload into overload; raw latency sample counts are retained.

Capacity windows are 10 seconds for cards/products and 60 seconds for the table, identical across frameworks. The longer table window captures repeated completion batches from the slowest adapter. Equal-load latency windows are 10 seconds; low-rate tail percentiles have few samples.
