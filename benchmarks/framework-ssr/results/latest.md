# Full-framework SSR

Production HTTP request, routing, SSR and framework response serialization to complete uncompressed HTML over loopback. Static fixture input is available locally; no database or external I/O. Full-document caching is disabled.

Captured: 2026-11-15T23:05:35.061Z. publication.

| Workload | Framework | Runtime | Capacity (responses/s) | Equal-load P50 (ms) | Equal-load P99 (ms) |
| --- | --- | --- | ---: | ---: | ---: |
| Component page | Proa 367cc10ae520 | Rust / Tokio | 78598.2 | 0.394 | 0.737 |
| Component page | Exact 94b8671f70fe | Bun 1.4.2 | 62.7 | 10.632 | 18.200 |
| Component page | Next.js 16.4.6 | Bun 1.4.2 | 384.0 | 3.743 | 11.019 |
| Component page | Astro 7.4.8 | Bun 1.4.2 | 6968.0 | 0.859 | 1.655 |
| Component page | SvelteKit 3.1.0 | Bun 1.4.2 | 5809.7 | 0.872 | 1.380 |
| Product grid | Proa 367cc10ae520 | Rust / Tokio | 15926.1 | 0.658 | 0.964 |
| Product grid | Exact 94b8671f70fe | Bun 1.4.2 | 25.5 | 29.697 | 42.046 |
| Product grid | Next.js 16.4.6 | Bun 1.4.2 | 114.5 | 9.306 | 24.015 |
| Product grid | Astro 7.4.8 | Bun 1.4.2 | 1970.2 | 1.323 | 3.697 |
| Product grid | SvelteKit 3.1.0 | Bun 1.4.2 | 1208.5 | 1.697 | 3.527 |
| 1,000-row table | Proa 367cc10ae520 | Rust / Tokio | 4947.8 | 1.456 | 1.783 |
| 1,000-row table | Exact 94b8671f70fe | Bun 1.4.2 | 3.2 | 269.954 | 345.961 |
| 1,000-row table | Next.js 16.4.6 | Bun 1.4.2 | 19.2 | 51.099 | 110.556 |
| 1,000-row table | Astro 7.4.8 | Bun 1.4.2 | 271.2 | 6.713 | 11.204 |
| 1,000-row table | SvelteKit 3.1.0 | Bun 1.4.2 | 255.1 | 6.903 | 8.197 |
| Airbnb landing page | Proa 367cc10ae520 | Rust / Tokio | 30526.0 | 0.945 | 1.052 |
| Airbnb landing page | Exact 94b8671f70fe | Bun 1.4.2 | 10.7 | 98.570 | 108.380 |
| Airbnb landing page | Next.js 16.4.6 | Bun 1.4.2 | 126.4 | 17.258 | 22.906 |
| Airbnb landing page | Astro 7.4.8 | Bun 1.4.2 | 1407.2 | 2.801 | 3.552 |
| Airbnb landing page | SvelteKit 3.1.0 | Bun 1.4.2 | 300.2 | 5.489 | 8.569 |
| Nike catalog | Proa 367cc10ae520 | Rust / Tokio | 25796.8 | 0.995 | 1.143 |
| Nike catalog | Exact 94b8671f70fe | Bun 1.4.2 | 4.8 | 177.295 | 194.281 |
| Nike catalog | Next.js 16.4.6 | Bun 1.4.2 | 113.6 | 19.546 | 38.243 |
| Nike catalog | Astro 7.4.8 | Bun 1.4.2 | 976.8 | 3.561 | 6.341 |
| Nike catalog | SvelteKit 3.1.0 | Bun 1.4.2 | 159.0 | 9.220 | 11.845 |
| GitHub PR review | Proa 367cc10ae520 | Rust / Tokio | 4056.7 | 1.958 | 3.592 |
| GitHub PR review | Exact 94b8671f70fe | Bun 1.4.2 | 1.1 | 819.711 | 905.701 |
| GitHub PR review | Next.js 16.4.6 | Bun 1.4.2 | 27.2 | 60.071 | 80.636 |
| GitHub PR review | Astro 7.4.8 | Bun 1.4.2 | 201.3 | 12.078 | 22.469 |
| GitHub PR review | SvelteKit 3.1.0 | Bun 1.4.2 | 43.2 | 33.310 | 38.463 |
| Sentry logs | Proa 367cc10ae520 | Rust / Tokio | 2470.1 | 2.681 | 3.148 |
| Sentry logs | Exact 94b8671f70fe | Bun 1.4.2 | 0.3 | 2307.305 | 2394.642 |
| Sentry logs | Next.js 16.4.6 | Bun 1.4.2 | 9.4 | 149.926 | 215.961 |
| Sentry logs | Astro 7.4.8 | Bun 1.4.2 | 88.5 | 34.534 | 43.534 |
| Sentry logs | SvelteKit 3.1.0 | Bun 1.4.2 | 20.7 | 64.961 | 70.797 |
| ESPN game page | Proa 367cc10ae520 | Rust / Tokio | 53820.0 | 1.256 | 1.329 |
| ESPN game page | Exact 94b8671f70fe | Bun 1.4.2 | 14.1 | 77.066 | 89.494 |
| ESPN game page | Next.js 16.4.6 | Bun 1.4.2 | 228.8 | 16.154 | 21.301 |
| ESPN game page | Astro 7.4.8 | Bun 1.4.2 | 2453.0 | 3.009 | 3.890 |
| ESPN game page | SvelteKit 3.1.0 | Bun 1.4.2 | 488.3 | 4.764 | 6.836 |

Equal load by workload: Component page: 10 requests/s; Product grid: 5 requests/s; 1,000-row table: 1 requests/s; Airbnb landing page: 1 requests/s; Nike catalog: 1 requests/s; GitHub PR review: 1 requests/s; Sentry logs: 0.25 requests/s; ESPN game page: 1 requests/s. 3 independent server starts per phase kind. No errors or generator-limited phases.

Different framework shells and hydration protocols produce different payload sizes.

This workload does not measure browser hydration, application startup, database I/O or developer experience.

A separate contract and capture from the synchronous pure-renderer suite; numbers must not be combined.

Every framework uses identical settings within each workload. Core fixtures use 64 capacity connections; showcase fixtures use 16, except Sentry logs (8). These are bounded-concurrency capacity measurements, not a search for each server’s optimal connection count.

Equal-load rates are 10 requests/s for component page, 5 for product grid, 1 for table and other showcase pages, and 0.25 for Sentry logs. Sentry latency runs for 40 seconds; other latency windows are 10 seconds. Lower rates keep the largest production response below overload. All raw sample counts are retained.

Capacity windows are 60 seconds for table, GitHub PR and Sentry logs, and 10 seconds otherwise. Settings are common to all five frameworks for each workload.

Workloads run in parallel on matching isolated C4 hosts. All five competitors within each workload share one physical host. Individual workload hosts and immutable shard captures are retained; no cross-host numbers are combined within a workload ranking.
