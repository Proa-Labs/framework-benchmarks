# Full-framework SSR

Production HTTP request, routing, SSR and framework response serialization to complete uncompressed HTML over loopback. Static fixture input is available locally; no database or external I/O. Full-document caching is disabled.

Captured: 2026-11-13T18:41:07.194Z. publication.

| Workload | Framework | Runtime | Capacity (responses/s) | Equal-load P50 (ms) | Equal-load P99 (ms) |
| --- | --- | --- | ---: | ---: | ---: |
| Component page | Proa bbbc96843351 | Rust / Tokio | 61247.8 | 0.360 | 0.712 |
| Component page | Exact 94b8671f70fe | Bun 1.4.2 | 65.3 | 9.940 | 15.886 |
| Component page | Next.js 16.4.6 | Bun 1.4.2 | 439.2 | 3.264 | 7.592 |
| Component page | Astro 7.4.8 | Bun 1.4.2 | 7091.5 | 0.792 | 1.460 |
| Component page | SvelteKit 3.1.0 | Bun 1.4.2 | 6126.0 | 0.804 | 1.327 |
| Product grid | Proa bbbc96843351 | Rust / Tokio | 13522.1 | 0.699 | 1.016 |
| Product grid | Exact 94b8671f70fe | Bun 1.4.2 | 25.6 | 29.462 | 40.226 |
| Product grid | Next.js 16.4.6 | Bun 1.4.2 | 115.2 | 8.986 | 21.364 |
| Product grid | Astro 7.4.8 | Bun 1.4.2 | 2002.0 | 1.274 | 3.337 |
| Product grid | SvelteKit 3.1.0 | Bun 1.4.2 | 1232.5 | 1.564 | 2.799 |
| 1,000-row table | Proa bbbc96843351 | Rust / Tokio | 3424.0 | 1.310 | 1.405 |
| 1,000-row table | Exact 94b8671f70fe | Bun 1.4.2 | 3.2 | 243.061 | 284.997 |
| 1,000-row table | Next.js 16.4.6 | Bun 1.4.2 | 20.3 | 44.414 | 70.098 |
| 1,000-row table | Astro 7.4.8 | Bun 1.4.2 | 286.5 | 5.387 | 9.039 |
| 1,000-row table | SvelteKit 3.1.0 | Bun 1.4.2 | 271.9 | 5.559 | 6.522 |

Equal load by workload: Component page: 10 requests/s; Product grid: 5 requests/s; 1,000-row table: 1 requests/s. 3 independent server starts per phase kind. No errors or generator-limited phases.

Different framework shells and hydration protocols produce different payload sizes.

This workload does not measure browser hydration, application startup, database I/O or developer experience.

A separate contract and capture from the synchronous pure-renderer suite; numbers must not be combined.

Equal-load rates are fixed per workload (10/5/1 requests per second), identical across frameworks. These rates avoid forcing the largest workload into overload; raw latency sample counts are retained.

Capacity windows are 10 seconds for cards/products and 60 seconds for the table, identical across frameworks. The longer table window captures repeated completion batches from the slowest adapter. Equal-load latency windows are 10 seconds; low-rate tail percentiles have few samples.
