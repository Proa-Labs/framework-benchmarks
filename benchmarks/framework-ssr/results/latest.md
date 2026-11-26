# Full-framework SSR

Production HTTP request, routing, SSR and framework response serialization to complete uncompressed HTML over loopback. Static fixture input is available locally; no database or external I/O. Full-document caching is disabled.

Captured: 2026-11-25T09:05:51.996Z. publication.

| Workload | Framework | Runtime | Capacity (responses/s) | Equal-load P50 (ms) | Equal-load P99 (ms) |
| --- | --- | --- | ---: | ---: | ---: |
| Component page | Proa 367cc10ae520 | Rust / Tokio | 80053.3 | 0.397 | 0.890 |
| Component page | Exact 94b8671f70fe | Bun 1.4.2 | 65.7 | 10.952 | 19.761 |
| Component page | Next.js 16.4.6 | Bun 1.4.2 | 396.8 | 4.230 | 11.212 |
| Component page | Astro 7.4.8 | Bun 1.4.2 | 7169.5 | 0.922 | 1.716 |
| Component page | SvelteKit 3.1.0 | Bun 1.4.2 | 5867.2 | 0.841 | 1.415 |
| Component page | Leptos 0.7.8 | Rust / Tokio | 28837.5 | 0.395 | 0.729 |
| Product grid | Proa 367cc10ae520 | Rust / Tokio | 16065.6 | 0.625 | 1.208 |
| Product grid | Exact 94b8671f70fe | Bun 1.4.2 | 25.6 | 29.873 | 46.890 |
| Product grid | Next.js 16.4.6 | Bun 1.4.2 | 115.0 | 9.249 | 27.289 |
| Product grid | Astro 7.4.8 | Bun 1.4.2 | 1983.8 | 1.375 | 3.248 |
| Product grid | SvelteKit 3.1.0 | Bun 1.4.2 | 1218.3 | 1.648 | 4.322 |
| Product grid | Leptos 0.7.8 | Rust / Tokio | 3383.8 | 0.881 | 1.172 |
| 1,000-row table | Proa 367cc10ae520 | Rust / Tokio | 5076.9 | 1.316 | 1.846 |
| 1,000-row table | Exact 94b8671f70fe | Bun 1.4.2 | 3.2 | 249.252 | 297.474 |
| 1,000-row table | Next.js 16.4.6 | Bun 1.4.2 | 20.1 | 53.387 | 78.882 |
| 1,000-row table | Astro 7.4.8 | Bun 1.4.2 | 282.8 | 6.065 | 9.218 |
| 1,000-row table | SvelteKit 3.1.0 | Bun 1.4.2 | 267.1 | 6.254 | 7.122 |
| 1,000-row table | Leptos 0.7.8 | Rust / Tokio | 710.4 | 2.482 | 2.572 |
| Airbnb landing page | Proa 367cc10ae520 | Rust / Tokio | 30244.2 | 1.062 | 1.486 |
| Airbnb landing page | Exact 94b8671f70fe | Bun 1.4.2 | 9.6 | 101.768 | 110.117 |
| Airbnb landing page | Next.js 16.4.6 | Bun 1.4.2 | 120.0 | 18.562 | 25.506 |
| Airbnb landing page | Astro 7.4.8 | Bun 1.4.2 | 1396.0 | 3.250 | 3.853 |
| Airbnb landing page | SvelteKit 3.1.0 | Bun 1.4.2 | 303.5 | 6.095 | 9.295 |
| Airbnb landing page | Leptos 0.7.8 | Rust / Tokio | 4721.6 | 1.376 | 1.763 |
| Nike catalog | Proa 367cc10ae520 | Rust / Tokio | 26408.3 | 1.097 | 1.375 |
| Nike catalog | Exact 94b8671f70fe | Bun 1.4.2 | 4.7 | 181.488 | 219.508 |
| Nike catalog | Next.js 16.4.6 | Bun 1.4.2 | 115.4 | 19.563 | 32.155 |
| Nike catalog | Astro 7.4.8 | Bun 1.4.2 | 971.9 | 3.535 | 4.435 |
| Nike catalog | SvelteKit 3.1.0 | Bun 1.4.2 | 157.1 | 10.022 | 13.469 |
| Nike catalog | Leptos 0.7.8 | Rust / Tokio | 2688.1 | 1.470 | 1.876 |
| GitHub PR review | Proa 367cc10ae520 | Rust / Tokio | 4265.2 | 2.252 | 2.409 |
| GitHub PR review | Exact 94b8671f70fe | Bun 1.4.2 | 1.1 | 791.494 | 871.841 |
| GitHub PR review | Next.js 16.4.6 | Bun 1.4.2 | 28.3 | 55.203 | 93.061 |
| GitHub PR review | Astro 7.4.8 | Bun 1.4.2 | 203.9 | 12.228 | 19.678 |
| GitHub PR review | SvelteKit 3.1.0 | Bun 1.4.2 | 44.3 | 35.630 | 39.688 |
| GitHub PR review | Leptos 0.7.8 | Rust / Tokio | 597.9 | 3.945 | 4.240 |
| Sentry logs | Proa 367cc10ae520 | Rust / Tokio | 2506.9 | 2.841 | 3.696 |
| Sentry logs | Exact 94b8671f70fe | Bun 1.4.2 | 0.3 | 2327.250 | 2423.927 |
| Sentry logs | Next.js 16.4.6 | Bun 1.4.2 | 9.1 | 143.887 | 205.296 |
| Sentry logs | Astro 7.4.8 | Bun 1.4.2 | 83.2 | 33.846 | 52.497 |
| Sentry logs | SvelteKit 3.1.0 | Bun 1.4.2 | 20.2 | 66.445 | 69.597 |
| Sentry logs | Leptos 0.7.8 | Rust / Tokio | 331.4 | 5.758 | 5.896 |
| ESPN game page | Proa 367cc10ae520 | Rust / Tokio | 54575.4 | 0.976 | 1.263 |
| ESPN game page | Exact 94b8671f70fe | Bun 1.4.2 | 14.0 | 71.964 | 84.316 |
| ESPN game page | Next.js 16.4.6 | Bun 1.4.2 | 225.6 | 14.127 | 20.670 |
| ESPN game page | Astro 7.4.8 | Bun 1.4.2 | 2523.1 | 2.559 | 3.108 |
| ESPN game page | SvelteKit 3.1.0 | Bun 1.4.2 | 478.9 | 4.444 | 5.990 |
| ESPN game page | Leptos 0.7.8 | Rust / Tokio | 11136.1 | 1.276 | 1.480 |

Equal load by workload: Component page: 10 requests/s; Product grid: 5 requests/s; 1,000-row table: 1 requests/s; Airbnb landing page: 1 requests/s; Nike catalog: 1 requests/s; GitHub PR review: 1 requests/s; Sentry logs: 0.25 requests/s; ESPN game page: 1 requests/s. 3 independent server starts per phase kind. No errors or generator-limited phases.

Different framework shells and hydration protocols produce different payload sizes.

This workload does not measure browser hydration, application startup, database I/O or developer experience.

A separate contract and capture from the synchronous pure-renderer suite; numbers must not be combined.

Every framework uses identical settings within each workload. Core fixtures use 64 capacity connections; showcase fixtures use 16, except Sentry logs (8). These are bounded-concurrency capacity measurements, not a search for each server’s optimal connection count.

Equal-load rates are 10 requests/s for component page, 5 for product grid, 1 for table and other showcase pages, and 0.25 for Sentry logs. Sentry latency runs for 40 seconds; other latency windows are 10 seconds. Lower rates keep the largest production response below overload. All raw sample counts are retained.

Capacity windows are 60 seconds for table, GitHub PR and Sentry logs, and 10 seconds otherwise. Settings are common to all frameworks for each workload.

Workloads run in parallel on matching isolated C4 hosts. All competitors within each workload share one physical host. Individual workload hosts and immutable shard captures are retained; no cross-host numbers are combined within a workload ranking.
