# Full-framework SSR

Production HTTP request, routing, SSR and framework response serialization to complete uncompressed HTML over loopback. Static fixture input is available locally; no database or external I/O. Full-document caching is disabled.

Captured: 2026-11-15T06:16:43.901Z. publication.

| Workload | Framework | Runtime | Capacity (responses/s) | Equal-load P50 (ms) | Equal-load P99 (ms) |
| --- | --- | --- | ---: | ---: | ---: |
| Component page | Proa ceffd9f305ac | Rust / Tokio | 64481.4 | 0.320 | 0.651 |
| Component page | Exact 94b8671f70fe | Bun 1.4.2 | 65.1 | 9.813 | 16.564 |
| Component page | Next.js 16.4.6 | Bun 1.4.2 | 420.5 | 3.299 | 8.322 |
| Component page | Astro 7.4.8 | Bun 1.4.2 | 7330.5 | 0.747 | 1.392 |
| Component page | SvelteKit 3.1.0 | Bun 1.4.2 | 6058.3 | 0.772 | 1.400 |
| Product grid | Proa ceffd9f305ac | Rust / Tokio | 15114.4 | 0.741 | 1.145 |
| Product grid | Exact 94b8671f70fe | Bun 1.4.2 | 25.5 | 33.613 | 51.262 |
| Product grid | Next.js 16.4.6 | Bun 1.4.2 | 114.9 | 13.579 | 28.988 |
| Product grid | Astro 7.4.8 | Bun 1.4.2 | 2019.8 | 1.763 | 4.377 |
| Product grid | SvelteKit 3.1.0 | Bun 1.4.2 | 1195.8 | 2.067 | 4.400 |
| 1,000-row table | Proa ceffd9f305ac | Rust / Tokio | 4283.5 | 1.479 | 1.523 |
| 1,000-row table | Exact 94b8671f70fe | Bun 1.4.2 | 3.2 | 244.403 | 307.253 |
| 1,000-row table | Next.js 16.4.6 | Bun 1.4.2 | 20.1 | 48.885 | 71.877 |
| 1,000-row table | Astro 7.4.8 | Bun 1.4.2 | 278.8 | 6.226 | 10.462 |
| 1,000-row table | SvelteKit 3.1.0 | Bun 1.4.2 | 251.3 | 6.651 | 9.888 |
| Airbnb landing page | Proa ceffd9f305ac | Rust / Tokio | 22276.5 | 0.806 | 0.889 |
| Airbnb landing page | Exact 94b8671f70fe | Bun 1.4.2 | 12.5 | 73.341 | 89.568 |
| Airbnb landing page | Next.js 16.4.6 | Bun 1.4.2 | 161.6 | 11.241 | 17.219 |
| Airbnb landing page | Astro 7.4.8 | Bun 1.4.2 | 2296.4 | 1.773 | 2.484 |
| Airbnb landing page | SvelteKit 3.1.0 | Bun 1.4.2 | 559.5 | 3.222 | 4.091 |
| Nike catalog | Proa ceffd9f305ac | Rust / Tokio | 17283.7 | 1.088 | 1.194 |
| Nike catalog | Exact 94b8671f70fe | Bun 1.4.2 | 6.3 | 170.295 | 190.105 |
| Nike catalog | Next.js 16.4.6 | Bun 1.4.2 | 123.2 | 20.406 | 32.414 |
| Nike catalog | Astro 7.4.8 | Bun 1.4.2 | 1016.0 | 3.351 | 9.315 |
| Nike catalog | SvelteKit 3.1.0 | Bun 1.4.2 | 163.3 | 9.432 | 11.895 |
| GitHub PR review | Proa ceffd9f305ac | Rust / Tokio | 2907.8 | 1.486 | 1.829 |
| GitHub PR review | Exact 94b8671f70fe | Bun 1.4.2 | 1.1 | 733.453 | 751.951 |
| GitHub PR review | Next.js 16.4.6 | Bun 1.4.2 | 30.9 | 38.813 | 61.615 |
| GitHub PR review | Astro 7.4.8 | Bun 1.4.2 | 229.9 | 8.287 | 13.781 |
| GitHub PR review | SvelteKit 3.1.0 | Bun 1.4.2 | 48.6 | 28.432 | 31.300 |
| Sentry logs | Proa ceffd9f305ac | Rust / Tokio | 1913.2 | 2.868 | 3.097 |
| Sentry logs | Exact 94b8671f70fe | Bun 1.4.2 | 0.3 | 2268.570 | 2399.060 |
| Sentry logs | Next.js 16.4.6 | Bun 1.4.2 | 9.2 | 144.217 | 203.813 |
| Sentry logs | Astro 7.4.8 | Bun 1.4.2 | 87.3 | 31.179 | 44.611 |
| Sentry logs | SvelteKit 3.1.0 | Bun 1.4.2 | 20.9 | 63.841 | 68.092 |
| ESPN game page | Proa ceffd9f305ac | Rust / Tokio | 49780.2 | 1.253 | 1.404 |
| ESPN game page | Exact 94b8671f70fe | Bun 1.4.2 | 13.9 | 73.656 | 92.082 |
| ESPN game page | Next.js 16.4.6 | Bun 1.4.2 | 257.4 | 15.015 | 22.351 |
| ESPN game page | Astro 7.4.8 | Bun 1.4.2 | 2662.0 | 3.002 | 3.631 |
| ESPN game page | SvelteKit 3.1.0 | Bun 1.4.2 | 516.9 | 4.540 | 6.351 |

Equal load by workload: Component page: 10 requests/s; Product grid: 5 requests/s; 1,000-row table: 1 requests/s; Airbnb landing page: 1 requests/s; Nike catalog: 1 requests/s; GitHub PR review: 1 requests/s; Sentry logs: 0.25 requests/s; ESPN game page: 1 requests/s. 3 independent server starts per phase kind. No errors or generator-limited phases.

Different framework shells and hydration protocols produce different payload sizes.

This workload does not measure browser hydration, application startup, database I/O or developer experience.

A separate contract and capture from the synchronous pure-renderer suite; numbers must not be combined.

Every framework uses identical settings within each workload. Core fixtures use 64 capacity connections; showcase fixtures use 16, except Sentry logs (8). These are bounded-concurrency capacity measurements, not a search for each server’s optimal connection count.

Equal-load rates are 10 requests/s for component page, 5 for product grid, 1 for table and other showcase pages, and 0.25 for Sentry logs. Sentry latency runs for 40 seconds; other latency windows are 10 seconds. Lower rates keep the largest production response below overload. All raw sample counts are retained.

Capacity windows are 60 seconds for table, GitHub PR and Sentry logs, and 10 seconds otherwise. Settings are common to all five frameworks for each workload.

Workloads run in parallel on matching isolated C4 hosts. All five competitors within each workload share one physical host. Individual workload hosts and immutable shard captures are retained; no cross-host numbers are combined within a workload ranking.
