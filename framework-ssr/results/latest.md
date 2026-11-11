# Full-framework SSR

Production HTTP request, routing, SSR and framework response serialization to complete uncompressed HTML over loopback. Static fixture input is available locally; no database or external I/O. Full-document caching is disabled.

Captured: 2026-11-10T02:41:33.718Z. publication.

| Framework | Runtime | Capacity (responses/s) | Equal-load P50 (ms) | Equal-load P99 (ms) |
| --- | --- | ---: | ---: | ---: |
| Proa 7ffb8a19ecfa | Rust / Tokio | 47053.0 | 0.259 | 0.505 |
| Exact 94b8671f70fe | Bun 1.4.2 | 63.8 | 10.373 | 16.985 |
| Next.js 16.4.6 | Bun 1.4.2 | 354.0 | 3.038 | 9.714 |
| Astro 7.4.8 | Bun 1.4.2 | 5778.2 | 0.632 | 1.142 |

Equal load: 50 requests/s. 3 independent server starts per phase kind. No errors or generator-limited phases.

Different framework shells and hydration protocols produce different payload sizes.

This workload does not measure browser hydration, application startup, database I/O or developer experience.

A separate contract and capture from the synchronous pure-renderer suite; numbers must not be combined.
