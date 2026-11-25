# HTTP capacity, cold start and streaming

The [Proa versus SvelteKit report](sveltekit.md) includes the production SvelteKit server below and a separate async comparison with browser completion. Its native promise-data stream has a different HTTP completion boundary from the resolved-HTML streams in this page.

One core of each framework's production server serves the same parity-gated pages over loopback HTTP. This page records [sustained capacity and latency at equal load](#canonical-pages-over-http-one-core-each), [cold start to first response](#cold-start-to-first-response), and [Suspense streaming](#suspense-streaming-over-http-one-core-each).

<!-- page-load:start -->
## Canonical pages over HTTP, one core each


**November 25, 2026 · Intel(R) Xeon(R) 6985P-C CPU @ 2.30GHz · 5 production servers · every response byte-identical to its parity-gated dump**

This is the capacity question behind the scoreboard: the same three parity-gated pages, served over real loopback HTTP/1.1 by each framework's ordinary production server, with every engine limited to one core of work. Proa runs one Tokio worker thread on Axum, React and Marko run one Bun process, and Go runs `GOMAXPROCS=1` on `net/http`. On the product grid, one Proa core sustained 16,877 complete responses per second against 1,307 for React, and spent 0.059 ms of CPU per response against React's 0.790 ms.

Each value is the median of 3 fresh server processes. **Capacity** rows use 64 closed-loop connections issuing requests back to back; throughput counts complete responses inside a fixed 5-second window after a 1-second pre-roll. **CPU per response** is the server process's exact CPU-time delta across all of its threads, including garbage-collector helpers, divided by successful responses. The load generator is 24 separate worker processes that hash every response; a phase is rejected if any worker's event loop exceeds 80% busy.

| Workload | Engine | Sustained responses/s | Proa ÷ engine | CPU per response | Cores used | Peak RSS |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Component page | Proa | 92,508 | 1.00× | 0.011 ms | 1.00 | 8.7 MiB |
| Component page | React | 6,432 | 14.4× | 0.162 ms | 1.00 | 99.9 MiB |
| Component page | Marko | 31,964 | 2.89× | 0.033 ms | 1.00 | 89.3 MiB |
| Component page | Go html/template | 5,377 | 17.2× | 0.186 ms | 1.00 | 16.2 MiB |
| Component page | SvelteKit | 5,950 | 15.5× | 0.182 ms | 1.00 | 116.6 MiB |
| Product grid | Proa | 16,877 | 1.00× | 0.059 ms | 1.00 | 9.2 MiB |
| Product grid | React | 1,307 | 12.9× | 0.790 ms | 1.00 | 116.7 MiB |
| Product grid | Marko | 4,267 | 3.96× | 0.239 ms | 1.00 | 111.3 MiB |
| Product grid | Go html/template | 747 | 22.6× | 1.339 ms | 1.00 | 15.7 MiB |
| Product grid | SvelteKit | 1,078 | 15.7× | 0.974 ms | 1.00 | 310.1 MiB |
| 1,000-row table | Proa | 2,649 | 1.00× | 0.377 ms | 1.00 | 10.5 MiB |
| 1,000-row table | React | 120 | 22.0× | 8.328 ms | 1.00 | 161.4 MiB |
| 1,000-row table | Marko | 437 | 6.06× | 2.344 ms | 1.00 | 118.8 MiB |
| 1,000-row table | Go html/template | 62 | 42.5× | 16.443 ms | 1.00 | 16.4 MiB |
| 1,000-row table | SvelteKit | 173 | 15.3× | 5.949 ms | 1.00 | 601.5 MiB |

Translating CPU per response into fleet size: the cores needed to serve 10,000 responses per second of each page, from the measured CPU per response. Real deployments add headroom, but the ratios carry over.

| Workload | Proa | React | Marko | Go html/template | SvelteKit |
| --- | ---: | ---: | ---: | ---: | ---: |
| Component page | 0.1 | 1.6 | 0.3 | 1.9 | 1.8 |
| Product grid | 0.6 | 7.9 | 2.4 | 13.4 | 9.7 |
| 1,000-row table | 3.8 | 83.3 | 23.4 | 164.4 | 59.5 |

**Latency at equal load** uses fixed-rate open-loop arrivals below every engine's knee, so the percentiles compare the same request-rate target rather than each server's own saturation point. Latency is measured from scheduled arrival and includes generator lag.

| Workload | Engine | Request rate (rps) | Complete P50 | Complete P99 | CPU per response | Peak RSS |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Component page | Proa | 2,000 | 0.12 ms | 0.59 ms | 0.021 ms | 7.3 MiB |
| Component page | React | 2,000 | 0.24 ms | 11.2 ms | 0.215 ms | 91.9 MiB |
| Component page | Marko | 2,000 | 0.14 ms | 1.60 ms | 0.081 ms | 63.3 MiB |
| Component page | Go html/template | 2,000 | 0.25 ms | 0.87 ms | 0.199 ms | 15.2 MiB |
| Component page | SvelteKit | 2,000 | 0.26 ms | 26.8 ms | 0.267 ms | 116.6 MiB |
| Product grid | Proa | 500 | 0.36 ms | 1.01 ms | 0.064 ms | 7.9 MiB |
| Product grid | React | 500 | 0.97 ms | 3.21 ms | 0.891 ms | 105.9 MiB |
| Product grid | Marko | 500 | 0.48 ms | 1.26 ms | 0.325 ms | 73.7 MiB |
| Product grid | Go html/template | 500 | 1.36 ms | 2.04 ms | 1.330 ms | 15.2 MiB |
| Product grid | SvelteKit | 500 | 0.99 ms | 16.9 ms | 0.973 ms | 116.4 MiB |
| 1,000-row table | Proa | 50 | 1.49 ms | 2.13 ms | 0.399 ms | 9.2 MiB |
| 1,000-row table | React | 50 | 9.30 ms | 16.1 ms | 9.068 ms | 138.1 MiB |
| 1,000-row table | Marko | 50 | 3.03 ms | 4.79 ms | 2.659 ms | 86.6 MiB |
| 1,000-row table | Go html/template | 50 | 16.8 ms | 17.9 ms | 16.648 ms | 15.5 MiB |
| 1,000-row table | SvelteKit | 50 | 5.75 ms | 17.7 ms | 6.302 ms | 168.9 MiB |

Every measured response was compared byte for byte against the dump the same engine produced through its canonical adapter, which is the dump that passed the scoreboard's browser-DOM parity gate.

| Engine version | Component page bytes | Product grid bytes | 1,000-row table bytes | HTTP responses |
| --- | ---: | ---: | ---: | --- |
| Proa 0.3.0 @ 367cc10a | 25,108 | 284,908 | 988,509 | byte-identical |
| React 19.2.4 | 25,202 | 285,868 | 990,695 | byte-identical |
| Marko 6.0.150 | 24,038 | 282,604 | 983,187 | byte-identical |
| Go html/template go1.25.5 | 25,108 | 285,676 | 990,509 | byte-identical |
| SvelteKit 3.1.0 / Svelte 5.57.2 / adapter-node 6.0.0 | 25,959 | 286,704 | 1,003,437 | byte-identical |

- Capture: [benchmarks/http/results/latest.json](../../benchmarks/http/results/latest.json); reproduce with `bun run bench:page-load`.
- Proa serves through `RouteResponse::ssr` on an Axum router; React through `renderToString` into `response.end`; Marko through its compiled template's `render().pipe(response)`; Go through `html/template` `Execute` into the `ResponseWriter`.
- JavaScript engines run with `NODE_ENV=production`: the driver sets it, each server's health endpoint reports it back, and React reports that it loaded the production `react-dom/server` build. The runner refuses to measure otherwise.
- Compression is disabled for every engine so CPU is not dominated by a shared compression setting. Routing, databases, and network latency are outside this measurement; HTTP parsing, response serialization, allocation, and each server's write path are inside it.
- This is a one-host, one-core capacity measurement. Multi-core deployments scale each engine by its own process or thread model; the per-response CPU cost is the portable number.
<!-- page-load:end -->

[![Sustained responses per second, CPU per response, and peak RSS for Proa, React, Marko, and Go html/template serving three canonical pages over HTTP on one core](../figures/08-canonical-pages-http.svg)](../figures/08-canonical-pages-http.svg)

*Sustained responses per second, CPU per response, and peak RSS from the capacity table above. Bars are medians of three fresh server processes. [Full size](../figures/08-canonical-pages-http.svg) · [how the figures are built](../../tooling/charts/)*

The same servers pay a start-up cost on every fresh process, measured next in [Cold start to first response](#cold-start-to-first-response).

<!-- cold-start:start -->
## Cold start to first response


**November 25, 2026 · Intel(R) Xeon(R) 6985P-C CPU @ 2.30GHz · 15 fresh processes per engine**

Every autoscaling event, cold serverless instance, per-tenant process, and developer restart pays this cost. Each row spawns the same production server used in the HTTP capacity section, polls its port every millisecond, and stops the clock when the first complete product-grid response ends; that response must be byte-identical to the engine's canonical dump. Proa's first response arrived in 7.11 ms at the median against 52.0 ms for React, whose figure includes Bun 1.4.2 start-up and loading React and the page module. Engines rotate every start, 2 untimed starts warm the disk cache, and the RSS column is sampled immediately after the first response.

| Engine | First response P50 | P95 | Max | First byte P50 | RSS after first response |
| --- | ---: | ---: | ---: | ---: | ---: |
| Proa 0.3.0 @ 367cc10a | 7.11 ms | 7.90 ms | 7.93 ms | 6.81 ms | 6.3 MiB |
| React | 52.0 ms | 55.7 ms | 57.0 ms | 51.8 ms | 58.0 MiB |
| Marko | 34.3 ms | 38.9 ms | 43.5 ms | 34.1 ms | 40.0 MiB |
| Go html/template | 9.83 ms | 12.1 ms | 13.1 ms | 8.57 ms | 9.9 MiB |
| SvelteKit | 56.5 ms | 63.0 ms | 65.3 ms | 55.8 ms | 51.1 MiB |

- Capture: [benchmarks/cold-start/results/latest.json](../../benchmarks/cold-start/results/latest.json); reproduce with `bun run bench:cold-start`.
- Servers, ports, and per-core limits are the same as the [HTTP capacity section](#canonical-pages-over-http-one-core-each). Wall time includes process creation, runtime start-up, module or binary loading, fixture construction, and the first render.
- Host one-minute load average when the capture started: 4.49 on 16 logical CPUs. Cold start is a few milliseconds of wall time, so it is the measurement most sensitive to other work on the machine; rerun it on an idle host before quoting absolute values.
<!-- cold-start:end -->

[![Median, P95 and slowest time from process spawn to first complete product-grid response for Proa, React, Marko and Go html/template, with RSS after the first response](../figures/09-cold-start.svg)](../figures/09-cold-start.svg)

*Fifteen fresh processes per engine. The bar is the median, the tick P95, and the hollow endpoint the slowest start. [Full size](../figures/09-cold-start.svg) · [how the figures are built](../../tooling/charts/)*

The product grid also streams, which is the subject of [Suspense streaming over HTTP](#suspense-streaming-over-http-one-core-each).

<!-- suspense-load:start -->
## Suspense streaming over HTTP, one core each


**November 25, 2026 · Intel(R) Xeon(R) 6985P-C CPU @ 2.30GHz · 8 async boundaries × 12 product cards · one worker thread or process per engine**

This is the product grid from the capacity section, streamed. Equivalent production-mode Proa, Marko, React, and Leptos applications run over real loopback HTTP/1.1. Every request streams a shell, starts 8 independent data operations across the 5, 8, 12, 18, 27, 40, 60, 90 ms delay tiers, may stream loading placeholders while those operations are pending, and completes only after every panel has resolved to its 12 product cards on the wire, 96 cards in all. Delayed values stay typed and in memory; there is no JSON serialization, deserialization, or external I/O in the measured request path. Rendering, boundary scheduling, replacement framing, and one flush per boundary are all inside the measurement.

Every engine is limited to one unit of concurrency: Proa and Leptos each run 1 Tokio worker thread, and Marko and React each run one Bun process. Proa serves this page through `RouteResponse::ssr_stream_send`, the compiler-proved `Send` streaming path introduced by [Proa PR #82](https://github.com/Proa-Labs/proa/pull/82): Axum polls the response stream directly, with no per-response bridge thread. The cores column shows what each process actually used, and CPU/request charges every thread of every engine the same way.

Each row is the median of 3 fresh-process phases under fixed-rate open-loop arrivals from 32 separate load-generator processes, so saturation remains visible as in-flight work and scheduled-arrival latency instead of being suppressed by a client waiting for each prior response. A 1-second pre-roll fills the async pipeline, then successful full responses completed inside a fixed 5-second observation window determine completion throughput. Complete-response percentiles and shell P50 cover requests arriving during that observation window and include load-generator scheduling lag and server queueing. CPU/request is the server process's exact CPU-time delta divided by successful responses across the full phase. Errors are summed across the 3 repeats. Publication aborts if scheduler-lag P95 exceeds 25 ms or any generator worker exceeds 80% busy in any phase, and each phase waits for the previous phase's client sockets to leave TIME_WAIT before it starts.

| Engine | Request rate (rps) | Window completions/s | Shell P50 | Complete P50 | Complete P95 | Complete P99 | CPU/request | Cores | Peak RSS | Max in-flight | Generator lag P95 | Errors |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Proa | 250 | 250 | 0.32 ms | 91.7 ms | 91.8 ms | 92.0 ms | 0.254 ms | 0.06 | 8.5 MiB | 24 | 0.01 ms | 0 |
| Proa | 500 | 500 | 0.25 ms | 91.4 ms | 91.6 ms | 92.3 ms | 0.250 ms | 0.12 | 9.8 MiB | 47 | 0.01 ms | 0 |
| Proa | 1,000 | 1000 | 0.20 ms | 91.2 ms | 91.5 ms | 92.3 ms | 0.249 ms | 0.24 | 12.1 MiB | 98 | 0.01 ms | 0 |
| Proa | 2,000 | 2000 | 0.24 ms | 91.3 ms | 93.4 ms | 96.2 ms | 0.261 ms | 0.51 | 18.0 MiB | 203 | 1.40 ms | 0 |
| Proa | 3,000 | 3000 | 0.91 ms | 92.2 ms | 104.4 ms | 115.6 ms | 0.280 ms | 0.83 | 25.6 MiB | 345 | 4.11 ms | 0 |
| Proa | 4,000 | 3549 | 34.6 ms | 611.9 ms | 1376.0 ms | 1477.9 ms | 0.279 ms | 0.99 | 192.3 MiB | 3,443 | 9.00 ms | 0 |
| Proa | 5,000 | 3237 | 630.0 ms | 1856.4 ms | 3325.1 ms | 3663.2 ms | 0.285 ms | 1.00 | 485.0 MiB | 10,828 | 6.74 ms | 0 |
| Proa | 6,000 | 3379 | 1321.3 ms | 2918.8 ms | 4684.8 ms | 5033.8 ms | 0.280 ms | 1.00 | 489.6 MiB | 16,260 | 8.24 ms | 0 |
| Marko | 250 | 250 | 0.50 ms | 90.4 ms | 91.5 ms | 92.6 ms | 1.050 ms | 0.26 | 94.5 MiB | 25 | 0.01 ms | 0 |
| Marko | 500 | 500 | 0.43 ms | 90.3 ms | 92.0 ms | 96.2 ms | 0.888 ms | 0.44 | 104.3 MiB | 56 | 0.00 ms | 0 |
| Marko | 1,000 | 1000 | 0.50 ms | 91.6 ms | 99.4 ms | 110.6 ms | 0.783 ms | 0.77 | 136.4 MiB | 130 | 0.01 ms | 0 |
| Marko | 2,000 | 1019 | 3232.1 ms | 3292.9 ms | 5991.8 ms | 7284.0 ms | 0.904 ms | 0.92 | 2063.9 MiB | 6,114 | 0.03 ms | 0 |
| Marko | 3,000 | 1028 | 6413.4 ms | 6525.4 ms | 12758.8 ms | 19476.0 ms | 0.910 ms | 0.73 | 2926.2 MiB | 12,421 | 0.18 ms | 85 |
| Marko | 4,000 | 967 | 9403.8 ms | 9786.3 ms | 16935.5 ms | 19795.3 ms | 0.882 ms | 0.97 | 3602.9 MiB | 18,576 | 0.58 ms | 247 |
| Marko | 5,000 | 975 | 12073.6 ms | 12426.6 ms | 19301.9 ms | 24433.3 ms | 0.901 ms | 0.71 | 3756.1 MiB | 24,633 | 0.46 ms | 979 |
| Marko | 6,000 | 1082 | 15165.5 ms | 15165.6 ms | 24501.2 ms | 28380.1 ms | 0.886 ms | 0.85 | 3928.8 MiB | 30,323 | 0.61 ms | 376 |
| React | 250 | 250 | 1.11 ms | 95.2 ms | 101.0 ms | 104.2 ms | 3.550 ms | 0.87 | 98.6 MiB | 37 | 0.01 ms | 0 |
| React | 500 | 263 | 534.3 ms | 3164.6 ms | 4985.3 ms | 5057.2 ms | 3.664 ms | 1.00 | 418.7 MiB | 1,445 | 0.01 ms | 0 |
| React | 1,000 | 244 | 2585.9 ms | 9325.7 ms | 19632.4 ms | 20052.3 ms | 3.711 ms | 0.92 | 762.9 MiB | 4,561 | 0.01 ms | 21 |
| React | 2,000 | 251 | 5123.9 ms | 18780.0 ms | 39181.0 ms | 39543.7 ms | 5.080 ms | 1.00 | 2916.7 MiB | 10,603 | 0.01 ms | 9,725 |
| React | 3,000 | 228 | 19581.3 ms | 32389.1 ms | 53634.5 ms | 69302.1 ms | 4.865 ms | 0.73 | 4255.6 MiB | 16,807 | 0.01 ms | 19,001 |
| React | 4,000 | 214 | 37424.2 ms | 46923.8 ms | 84576.2 ms | 85405.4 ms | 4.964 ms | 0.49 | 4003.7 MiB | 22,931 | 0.01 ms | 26,695 |
| React | 5,000 | 216 | 54785.9 ms | 63674.9 ms | 91016.8 ms | 105818.4 ms | 5.035 ms | 0.64 | 3643.6 MiB | 28,918 | 0.01 ms | 29,528 |
| React | 6,000 | 226 | 55013.5 ms | 64756.1 ms | 100150.2 ms | 103775.2 ms | 5.009 ms | 0.72 | 3863.7 MiB | 34,870 | 0.01 ms | 35,215 |
| Leptos | 250 | 250 | 0.31 ms | 92.1 ms | 102.3 ms | 102.4 ms | 0.649 ms | 0.16 | 6.9 MiB | 26 | 0.01 ms | 0 |
| Leptos | 500 | 500 | 0.19 ms | 91.4 ms | 101.9 ms | 102.9 ms | 0.624 ms | 0.31 | 8.4 MiB | 52 | 0.01 ms | 0 |
| Leptos | 1,000 | 1000 | 0.19 ms | 91.3 ms | 102.6 ms | 102.6 ms | 0.619 ms | 0.61 | 11.3 MiB | 104 | 0.01 ms | 0 |
| Leptos | 2,000 | 1418 | 374.6 ms | 1295.4 ms | 2703.3 ms | 2804.5 ms | 0.680 ms | 1.00 | 159.1 MiB | 3,489 | 0.06 ms | 0 |
| Leptos | 3,000 | 1305 | 1647.2 ms | 4291.0 ms | 7287.6 ms | 7401.0 ms | 0.709 ms | 1.00 | 378.7 MiB | 10,183 | 0.07 ms | 0 |
| Leptos | 4,000 | 1270 | 2638.7 ms | 7083.1 ms | 11279.5 ms | 11694.6 ms | 0.698 ms | 1.00 | 384.6 MiB | 16,428 | 0.39 ms | 0 |
| Leptos | 5,000 | 1275 | 4990.8 ms | 8953.2 ms | 15169.8 ms | 15488.7 ms | 0.702 ms | 1.00 | 388.1 MiB | 22,519 | 0.29 ms | 0 |
| Leptos | 6,000 | 1278 | 7902.8 ms | 11616.3 ms | 19278.8 ms | 19463.0 ms | 0.702 ms | 1.00 | 381.6 MiB | 28,468 | 0.47 ms | 0 |

**Every comparative row uses one logical CPU.** Proa and Leptos each run one Tokio worker thread, and Marko and React each run one Bun process. Server CPU affinity is 0; the load generator runs separately. Above saturation, completed responses can plateau or decline while queueing and failures increase. This capture does not measure multicore capacity.

**Reference point, outside the comparison.** Proa alone was rerun at the top rate with 4 worker threads. CPU affinity remains 0; this changes thread count within the same CPU budget and does not measure multi-core scaling. Marko, React, and Leptos were not rerun with more workers, so this row is not comparable to theirs. With 4 threads Proa completed 3,537 responses per second at a request-rate target of 6,000 rps and a P99 of 5034.9 ms, using 0.99 cores.

| Proa worker threads | Request rate (rps) | Window completions/s | Complete P50 | Complete P99 | CPU/request | Cores | Peak RSS | Errors |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 4 | 6,000 | 3537 | 2339.1 ms | 5034.9 ms | 0.278 ms | 0.99 | 502.5 MiB | 0 |

The unloaded preflight checks all loading placeholders and resolved panels. Every measured response must contain the shell, all resolved panels, and every product card. Loading placeholders are optional during load: a boundary can resolve before its placeholder is flushed. Any placeholders present must have valid, unique boundary keys. The cards are the same markup the scoreboard's product-grid parity gate accepted from each engine. Wire bytes legitimately differ because each framework carries its own boundary-replacement protocol.

| Engine version | Fallback panels | Resolved panels | Product cards | Stream bytes |
| --- | ---: | ---: | ---: | ---: |
| Proa 0.3.0 @ 367cc10a | 8 | 8 | 96 | 387,511 |
| Marko 6.0.150 | 8 | 8 | 96 | 289,888 |
| React 19.2.4 | 8 | 8 | 96 | 292,213 |
| Leptos 0.7.8 | 8 | 8 | 96 | 295,801 |

- Capture: [benchmarks/streaming/results/latest.json](../../benchmarks/streaming/results/latest.json); reproduce with `bun run bench:suspense-load`.
- The report verifier checks the measured-source SHA-256 against this checkout or the retained source snapshot before generating these tables.
- Proa source: Cargo.lock revision 367cc10a; Rust release build with native Proa Suspense and the direct `ssr_stream_send` Axum route. The same binary also serves the bounded local-executor path (`ssr_stream`) at `/local` for engineering comparison; it is not part of the published rows.
- Marko source: optimized ahead-of-time Marko template using native &lt;await&gt; plus &lt;@placeholder&gt;; its compiler is not resident in the measured server.
- React source: production Bun React server build using renderToReadableStream, Suspense, and use. The shell pipes immediately; allReady is not awaited.
- Leptos source: native Suspense and Suspend render out-of-order HTML chunks on Axum with a single Tokio worker. The release binary renders the same product cards as the render-only adapter.
- JavaScript engines run with `NODE_ENV=production`: the driver sets it, each server's health endpoint reports it back, and React reports that it loaded the production `react-dom/server` build. The runner refuses to measure otherwise.
- Stream bytes differ by protocol, not content: Proa base64-encodes each resolved boundary inside an inert template, so its stream is roughly a third larger on the wire than React's for the same 96 cards. Compression is off in every engine here; enabling it would remove most of that gap, at a CPU cost this benchmark deliberately leaves out.
- This is a single-host capacity curve, not a universal ranking. Loopback transfer, each framework’s HTTP adapter, boundary protocol, allocation, scheduling, and render work are all intentionally inside the application boundary.
<!-- suspense-load:end -->

[![Overlaid HTTP streaming throughput and memory for Proa, Marko, React and SvelteKit, with four latency panels on a shared scale](../figures/07-suspense-load.svg)](../figures/07-suspense-load.svg)

*Every line is one core: response ends at each request-rate target, the P50, P95, and P99 of the full response, and peak memory. Once a line drops below the target rate the engine has saturated and its latency is queueing. Each latency panel marks its highest P99 with a leader from the axis. Marko and React come from the table above; Proa and SvelteKit come from the newer [SvelteKit comparison capture](sveltekit.md#http-streaming-capacity-and-latency), so the chart's Proa line will not match the Proa rows above exactly. SvelteKit's response end delivers data, not rendered HTML. [Full size](../figures/07-suspense-load.svg) · [how the figures are built](../../tooling/charts/)*

## Next steps

- [Front page](../../README.md)
  - The four figures and the reasons to trust them.
- [Canonical scoreboard evidence](scoreboard.md)
  - The render-only timings these servers wrap, for seventeen renderers.
- [Shared HTTP load driver](../../tooling/load/)
  - Why a benchmark never reports a client knee as a server knee.
- [Page-load suite](../../benchmarks/http/), [cold-start suite](../../benchmarks/cold-start/), and [Suspense suite](../../benchmarks/streaming/)
  - Each suite's contract, engines, and reproduction commands.
