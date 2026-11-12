# Full-framework SSR

Production HTTP request, routing, SSR and framework response serialization to complete uncompressed HTML over loopback. Static fixture input is available locally; no database or external I/O. Full-document caching is disabled.

Captured: 2026-11-12T05:50:39.229Z. publication.

| Workload | Framework | Runtime | Capacity (responses/s) | Equal-load P50 (ms) | Equal-load P99 (ms) |
| --- | --- | --- | ---: | ---: | ---: |
| Component page | Proa bbbc96843351 | Rust / Tokio | 55685.7 | 0.570 | 1.004 |
| Component page | Exact 94b8671f70fe | Bun 1.4.2 | 60.7 | 13.628 | 24.071 |
| Component page | Next.js 16.4.6 | Bun 1.4.2 | 358.4 | 6.883 | 16.489 |
| Component page | Astro 7.4.8 | Bun 1.4.2 | 5411.5 | 1.577 | 2.538 |
| Component page | SvelteKit 3.1.0 | Bun 1.4.2 | 5011.2 | 1.654 | 2.693 |
| Product grid | Proa bbbc96843351 | Rust / Tokio | 12685.0 | 0.954 | 1.389 |
| Product grid | Exact 94b8671f70fe | Bun 1.4.2 | 22.5 | 35.288 | 70.194 |
| Product grid | Next.js 16.4.6 | Bun 1.4.2 | 102.4 | 14.913 | 28.985 |
| Product grid | Astro 7.4.8 | Bun 1.4.2 | 1493.6 | 2.309 | 4.439 |
| Product grid | SvelteKit 3.1.0 | Bun 1.4.2 | 1006.0 | 2.614 | 5.328 |
| 1,000-row table | Proa bbbc96843351 | Rust / Tokio | 3188.4 | 1.611 | 1.969 |
| 1,000-row table | Exact 94b8671f70fe | Bun 1.4.2 | 3.2 | 299.551 | 347.887 |
| 1,000-row table | Next.js 16.4.6 | Bun 1.4.2 | 18.0 | 75.571 | 84.984 |
| 1,000-row table | Astro 7.4.8 | Bun 1.4.2 | 253.8 | 7.298 | 13.286 |
| 1,000-row table | SvelteKit 3.1.0 | Bun 1.4.2 | 218.9 | 7.210 | 8.951 |

Equal load by workload: Component page: 10 requests/s; Product grid: 5 requests/s; 1,000-row table: 1 requests/s. 3 independent server starts per phase kind. No errors or generator-limited phases.

Different framework shells and hydration protocols produce different payload sizes.

This workload does not measure browser hydration, application startup, database I/O or developer experience.

A separate contract and capture from the synchronous pure-renderer suite; numbers must not be combined.

Equal-load rates are fixed per workload (10/5/1 requests per second), identical across frameworks. These rates avoid forcing the largest workload into overload; raw latency sample counts are retained.

Capacity windows are 10 seconds for cards/products and 60 seconds for the table, identical across frameworks. The longer table window captures repeated completion batches from the slowest adapter. Equal-load latency windows are 10 seconds; low-rate tail percentiles have few samples.
