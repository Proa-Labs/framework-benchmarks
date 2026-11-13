# HTTP capacity, cold start and streaming

The [Proa versus SvelteKit report](sveltekit.md) includes the production SvelteKit server below and a separate async comparison with browser completion. Its native promise-data stream has a different HTTP completion boundary from the resolved-HTML streams in this page.

One core of each framework's production server serves the same parity-gated pages over loopback HTTP. This page records [sustained capacity and latency at equal load](#canonical-pages-over-http-one-core-each), [cold start to first response](#cold-start-to-first-response), and [Suspense streaming](#suspense-streaming-over-http-one-core-each).

<!-- page-load:start -->
## Canonical pages over HTTP, one core each


**November 12, 2026 · Intel(R) Xeon(R) 6985P-C CPU @ 2.30GHz · 5 production servers · every response byte-identical to its parity-gated dump**

This is the capacity question behind the scoreboard: the same three parity-gated pages, served over real loopback HTTP/1.1 by each framework's ordinary production server, with every engine limited to one core of work. Proa runs one Tokio worker thread on Axum, React and Marko run one Bun process, and Go runs `GOMAXPROCS=1` on `net/http`. On the product grid, one Proa core sustained 15,763 complete responses per second against 1,324 for React, and spent 0.068 ms of CPU per response against React's 0.778 ms.

Each value is the median of 3 fresh server processes. **Capacity** rows use 64 closed-loop connections issuing requests back to back; throughput counts complete responses inside a fixed 5-second window after a 1-second pre-roll. **CPU per response** is the server process's exact CPU-time delta across all of its threads, including garbage-collector helpers, divided by successful responses. The load generator is 24 separate worker processes that hash every response; a phase is rejected if any worker's event loop exceeds 80% busy.

| Workload | Engine | Sustained responses/s | Proa ÷ engine | CPU per response | Cores used | Peak RSS |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Component page | Proa | 87,804 | 1.00× | 0.011 ms | 1.00 | 8.6 MiB |
| Component page | React | 6,578 | 13.3× | 0.159 ms | 1.00 | 100.4 MiB |
| Component page | Marko | 31,843 | 2.76× | 0.033 ms | 1.00 | 88.3 MiB |
| Component page | Go html/template | 5,403 | 16.3× | 0.185 ms | 1.00 | 16.3 MiB |
| Component page | SvelteKit | 6,082 | 14.4× | 0.178 ms | 1.00 | 116.8 MiB |
| Product grid | Proa | 15,763 | 1.00× | 0.068 ms | 1.00 | 9.3 MiB |
| Product grid | React | 1,324 | 11.9× | 0.778 ms | 1.00 | 118.9 MiB |
| Product grid | Marko | 4,349 | 3.62× | 0.234 ms | 1.00 | 112.3 MiB |
| Product grid | Go html/template | 754 | 20.9× | 1.326 ms | 1.00 | 15.3 MiB |
| Product grid | SvelteKit | 1,134 | 13.9× | 0.926 ms | 1.00 | 313.4 MiB |
| 1,000-row table | Proa | 1,437 | 1.00× | 0.723 ms | 1.00 | 10.6 MiB |
| 1,000-row table | React | 125 | 11.5× | 8.005 ms | 1.00 | 166.4 MiB |
| 1,000-row table | Marko | 440 | 3.27× | 2.317 ms | 1.00 | 127.4 MiB |
| 1,000-row table | Go html/template | 63 | 23.0× | 16.268 ms | 1.00 | 16.9 MiB |
| 1,000-row table | SvelteKit | 179 | 8.02× | 5.782 ms | 1.00 | 639.1 MiB |

Translating CPU per response into fleet size: the cores needed to serve 10,000 responses per second of each page, from the measured CPU per response. Real deployments add headroom, but the ratios carry over.

| Workload | Proa | React | Marko | Go html/template | SvelteKit |
| --- | ---: | ---: | ---: | ---: | ---: |
| Component page | 0.1 | 1.6 | 0.3 | 1.9 | 1.8 |
| Product grid | 0.7 | 7.8 | 2.3 | 13.3 | 9.3 |
| 1,000-row table | 7.2 | 80.1 | 23.2 | 162.7 | 57.8 |

**Latency at equal load** uses fixed-rate open-loop arrivals below every engine's knee, so the percentiles compare the same request-rate target rather than each server's own saturation point. Latency is measured from scheduled arrival and includes generator lag.

| Workload | Engine | Request rate (rps) | Complete P50 | Complete P99 | CPU per response | Peak RSS |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Component page | Proa | 2,000 | 0.12 ms | 0.50 ms | 0.022 ms | 7.4 MiB |
| Component page | React | 2,000 | 0.24 ms | 11.2 ms | 0.211 ms | 92.3 MiB |
| Component page | Marko | 2,000 | 0.13 ms | 1.56 ms | 0.075 ms | 63.9 MiB |
| Component page | Go html/template | 2,000 | 0.24 ms | 0.80 ms | 0.197 ms | 15.1 MiB |
| Component page | SvelteKit | 2,000 | 0.25 ms | 23.9 ms | 0.260 ms | 99.0 MiB |
| Product grid | Proa | 500 | 0.35 ms | 0.96 ms | 0.122 ms | 7.9 MiB |
| Product grid | React | 500 | 0.93 ms | 2.89 ms | 0.861 ms | 103.0 MiB |
| Product grid | Marko | 500 | 0.44 ms | 1.08 ms | 0.311 ms | 81.0 MiB |
| Product grid | Go html/template | 500 | 1.33 ms | 2.00 ms | 1.322 ms | 15.2 MiB |
| Product grid | SvelteKit | 500 | 0.94 ms | 8.22 ms | 0.944 ms | 120.4 MiB |
| 1,000-row table | Proa | 50 | 1.92 ms | 2.54 ms | 0.934 ms | 9.2 MiB |
| 1,000-row table | React | 50 | 8.05 ms | 15.8 ms | 8.390 ms | 141.7 MiB |
| 1,000-row table | Marko | 50 | 2.88 ms | 3.99 ms | 2.542 ms | 83.4 MiB |
| 1,000-row table | Go html/template | 50 | 16.7 ms | 17.5 ms | 16.532 ms | 15.3 MiB |
| 1,000-row table | SvelteKit | 50 | 5.56 ms | 13.7 ms | 5.889 ms | 145.9 MiB |

Every measured response was compared byte for byte against the dump the same engine produced through its canonical adapter, which is the dump that passed the scoreboard's browser-DOM parity gate.

| Engine version | Component page bytes | Product grid bytes | 1,000-row table bytes | HTTP responses |
| --- | ---: | ---: | ---: | --- |
| Proa 0.3.0 @ bbbc9684 | 25,108 | 284,908 | 988,509 | byte-identical |
| React 19.2.4 | 25,202 | 285,868 | 990,695 | byte-identical |
| Marko 6.0.150 | 24,038 | 282,604 | 983,187 | byte-identical |
| Go html/template go1.25.5 | 25,108 | 285,676 | 990,509 | byte-identical |
| SvelteKit 3.1.0 / Svelte 5.57.2 / adapter-node 6.0.0 | 25,959 | 286,704 | 1,003,437 | byte-identical |

- Capture: [page-load/results/latest.json](page-load/results/latest.json); reproduce with `bun run bench:page-load`.
- Proa serves through `RouteResponse::ssr` on an Axum router; React through `renderToString` into `response.end`; Marko through its compiled template's `render().pipe(response)`; Go through `html/template` `Execute` into the `ResponseWriter`.
- JavaScript engines run with `NODE_ENV=production`: the driver sets it, each server's health endpoint reports it back, and React reports that it loaded the production `react-dom/server` build. The runner refuses to measure otherwise.
- Compression is disabled for every engine so CPU is not dominated by a shared compression setting. Routing, databases, and network latency are outside this measurement; HTTP parsing, response serialization, allocation, and each server's write path are inside it.
- This is a one-host, one-core capacity measurement. Multi-core deployments scale each engine by its own process or thread model; the per-response CPU cost is the portable number.
<!-- page-load:end -->

[![Sustained responses per second, CPU per response, and peak RSS for Proa, React, Marko, and Go html/template serving three canonical pages over HTTP on one core](charts/svg/08-canonical-pages-http.svg)](charts/svg/08-canonical-pages-http.svg)

*Sustained responses per second, CPU per response, and peak RSS from the capacity table above. Bars are medians of three fresh server processes. [Full size](charts/svg/08-canonical-pages-http.svg) · [how the figures are built](charts/)*

The same servers pay a start-up cost on every fresh process, measured next in [Cold start to first response](#cold-start-to-first-response).

<!-- cold-start:start -->
## Cold start to first response


**November 12, 2026 · Intel(R) Xeon(R) 6985P-C CPU @ 2.30GHz · 15 fresh processes per engine**

Every autoscaling event, cold serverless instance, per-tenant process, and developer restart pays this cost. Each row spawns the same production server used in the HTTP capacity section, polls its port every millisecond, and stops the clock when the first complete product-grid response ends; that response must be byte-identical to the engine's canonical dump. Proa's first response arrived in 7.38 ms at the median against 54.7 ms for React, whose figure includes Bun 1.4.2 start-up and loading React and the page module. Engines rotate every start, 2 untimed starts warm the disk cache, and the RSS column is sampled immediately after the first response.

| Engine | First response P50 | P95 | Max | First byte P50 | RSS after first response |
| --- | ---: | ---: | ---: | ---: | ---: |
| Proa 0.3.0 @ bbbc9684 | 7.38 ms | 10.8 ms | 12.7 ms | 7.10 ms | 6.3 MiB |
| React | 54.7 ms | 60.9 ms | 61.7 ms | 54.4 ms | 57.8 MiB |
| Marko | 39.6 ms | 42.0 ms | 43.3 ms | 39.4 ms | 39.9 MiB |
| Go html/template | 10.6 ms | 12.1 ms | 13.1 ms | 9.37 ms | 9.9 MiB |
| SvelteKit | 59.7 ms | 63.3 ms | 63.4 ms | 59.5 ms | 51.2 MiB |

- Capture: [cold-start/results/latest.json](cold-start/results/latest.json); reproduce with `bun run bench:cold-start`.
- Servers, ports, and per-core limits are the same as the [HTTP capacity section](#canonical-pages-over-http-one-core-each). Wall time includes process creation, runtime start-up, module or binary loading, fixture construction, and the first render.
- Host one-minute load average when the capture started: 7.93 on 16 logical CPUs. Cold start is a few milliseconds of wall time, so it is the measurement most sensitive to other work on the machine; rerun it on an idle host before quoting absolute values.
<!-- cold-start:end -->

[![Median, P95 and slowest time from process spawn to first complete product-grid response for Proa, React, Marko and Go html/template, with RSS after the first response](charts/svg/09-cold-start.svg)](charts/svg/09-cold-start.svg)

*Fifteen fresh processes per engine. The bar is the median, the tick P95, and the hollow endpoint the slowest start. [Full size](charts/svg/09-cold-start.svg) · [how the figures are built](charts/)*

The product grid also streams, which is the subject of [Suspense streaming over HTTP](#suspense-streaming-over-http-one-core-each).

<!-- suspense-load:start -->
## Suspense streaming over HTTP, one core each


**November 12, 2026 · Intel(R) Xeon(R) 6985P-C CPU @ 2.30GHz · 8 async boundaries × 12 product cards · one worker thread or process per engine**

This is the product grid from the capacity section, streamed. Equivalent production-mode Proa, Marko, and React applications run over real loopback HTTP/1.1. Every request streams a shell, starts 8 independent data operations across the 5, 8, 12, 18, 27, 40, 60, 90 ms delay tiers, may stream loading placeholders while those operations are pending, and completes only after every panel has resolved to its 12 product cards on the wire, 96 cards in all. Delayed values stay typed and in memory; there is no JSON serialization, deserialization, or external I/O in the measured request path. Rendering, boundary scheduling, replacement framing, and one flush per boundary are all inside the measurement.

Every engine is limited to one unit of concurrency: Proa runs 1 Tokio worker thread, and Marko and React each run one Bun process. Proa serves this page through `RouteResponse::ssr_stream_send`, the compiler-proved `Send` streaming path introduced by [Proa PR #82](https://github.com/Proa-Labs/proa/pull/82): Axum polls the response stream directly, with no per-response bridge thread. The cores column shows what each process actually used, and CPU/request charges every thread of every engine the same way.

Each row is the median of 3 fresh-process phases under fixed-rate open-loop arrivals from 24 separate load-generator processes, so saturation remains visible as in-flight work and scheduled-arrival latency instead of being suppressed by a client waiting for each prior response. A 1-second pre-roll fills the async pipeline, then successful full responses completed inside a fixed 5-second observation window determine completion throughput. Complete-response percentiles and shell P50 cover requests arriving during that observation window and include load-generator scheduling lag and server queueing. CPU/request is the server process's exact CPU-time delta divided by successful responses across the full phase. Errors are summed across the 3 repeats. Publication aborts if scheduler-lag P95 exceeds 25 ms or any generator worker exceeds 80% busy in any phase, and each phase waits for the previous phase's client sockets to leave TIME_WAIT before it starts.

| Engine | Request rate (rps) | Window completions/s | Shell P50 | Complete P50 | Complete P95 | Complete P99 | CPU/request | Cores | Peak RSS | Max in-flight | Generator lag P95 | Errors |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Proa | 250 | 250 | 0.23 ms | 91.6 ms | 91.8 ms | 92.3 ms | 0.253 ms | 0.06 | 8.1 MiB | 24 | 0.00 ms | 0 |
| Proa | 500 | 500 | 0.20 ms | 91.4 ms | 91.5 ms | 92.1 ms | 0.249 ms | 0.12 | 9.4 MiB | 50 | 0.01 ms | 0 |
| Proa | 1,000 | 1000 | 0.17 ms | 91.2 ms | 91.4 ms | 92.2 ms | 0.257 ms | 0.25 | 12.3 MiB | 102 | 0.01 ms | 0 |
| Proa | 2,000 | 2000 | 0.21 ms | 91.2 ms | 94.2 ms | 101.8 ms | 0.274 ms | 0.54 | 18.1 MiB | 211 | 1.12 ms | 0 |
| Proa | 3,000 | 3000 | 0.87 ms | 92.1 ms | 102.5 ms | 107.6 ms | 0.289 ms | 0.85 | 24.6 MiB | 326 | 3.49 ms | 0 |
| Proa | 4,000 | 3488 | 241.9 ms | 596.4 ms | 1193.5 ms | 1304.9 ms | 0.285 ms | 0.99 | 196.0 MiB | 3,615 | 6.52 ms | 0 |
| Proa | 5,000 | 3368 | 805.4 ms | 1834.1 ms | 3061.9 ms | 3372.5 ms | 0.287 ms | 1.00 | 357.7 MiB | 10,156 | 6.06 ms | 0 |
| Proa | 6,000 | 3259 | 1776.6 ms | 3005.6 ms | 4809.8 ms | 5269.8 ms | 0.294 ms | 1.00 | 364.1 MiB | 16,967 | 7.37 ms | 0 |
| Marko | 250 | 250 | 0.37 ms | 90.3 ms | 91.3 ms | 92.4 ms | 0.959 ms | 0.24 | 93.9 MiB | 25 | 0.01 ms | 0 |
| Marko | 500 | 500 | 0.39 ms | 90.3 ms | 91.9 ms | 95.3 ms | 0.827 ms | 0.41 | 108.4 MiB | 54 | 0.00 ms | 0 |
| Marko | 1,000 | 1000 | 0.44 ms | 91.2 ms | 97.1 ms | 106.7 ms | 0.746 ms | 0.73 | 142.6 MiB | 121 | 0.01 ms | 0 |
| Marko | 2,000 | 1018 | 3168.1 ms | 3186.6 ms | 5773.3 ms | 6881.7 ms | 0.899 ms | 0.92 | 1677.6 MiB | 6,404 | 0.11 ms | 0 |
| Marko | 3,000 | 1035 | 5723.5 ms | 6108.7 ms | 12113.9 ms | 14132.3 ms | 0.876 ms | 0.73 | 2954.4 MiB | 12,335 | 0.25 ms | 0 |
| Marko | 4,000 | 1029 | 8982.7 ms | 9254.8 ms | 14414.8 ms | 14506.2 ms | 0.855 ms | 1.00 | 3530.3 MiB | 18,243 | 0.41 ms | 230 |
| Marko | 5,000 | 1095 | 12191.1 ms | 12191.1 ms | 18930.5 ms | 19277.2 ms | 0.851 ms | 1.00 | 2897.3 MiB | 24,000 | 0.67 ms | 193 |
| Marko | 6,000 | 1096 | 15358.4 ms | 15358.5 ms | 23952.2 ms | 24240.1 ms | 0.841 ms | 1.00 | 3699.2 MiB | 30,164 | 1.45 ms | 0 |
| React | 250 | 250 | 1.11 ms | 94.9 ms | 101.1 ms | 105.0 ms | 3.522 ms | 0.87 | 100.1 MiB | 34 | 0.45 ms | 0 |
| React | 500 | 263 | 561.8 ms | 3111.9 ms | 4911.1 ms | 4974.9 ms | 3.623 ms | 1.00 | 405.4 MiB | 1,435 | 0.01 ms | 0 |
| React | 1,000 | 250 | 2575.9 ms | 9625.5 ms | 19776.6 ms | 20046.0 ms | 3.689 ms | 0.89 | 699.9 MiB | 4,531 | 0.01 ms | 0 |
| React | 2,000 | 282 | 7930.2 ms | 20605.9 ms | 37625.2 ms | 40498.0 ms | 4.391 ms | 1.00 | 2034.7 MiB | 10,529 | 0.01 ms | 5,929 |
| React | 3,000 | 228 | 15171.3 ms | 29050.2 ms | 55470.5 ms | 68435.1 ms | 4.552 ms | 0.91 | 2917.2 MiB | 16,694 | 0.01 ms | 12,829 |
| React | 4,000 | 246 | 34613.5 ms | 44046.4 ms | 71001.9 ms | 83041.8 ms | 4.842 ms | 0.89 | 3149.3 MiB | 22,768 | 0.01 ms | 21,839 |
| React | 5,000 | 257 | 52270.3 ms | 56839.4 ms | 90564.8 ms | 101704.2 ms | 4.821 ms | 0.82 | 3067.0 MiB | 28,714 | 0.01 ms | 25,421 |
| React | 6,000 | 258 | 49174.4 ms | 60315.5 ms | 106454.1 ms | 114166.9 ms | 4.814 ms | 0.69 | 2913.4 MiB | 34,711 | 0.81 ms | 29,492 |

**Every comparative row uses one logical CPU.** Proa runs one Tokio worker thread, and Marko and React each run one Bun process. Server CPU affinity is 0; the load generator runs separately. Above saturation, completed responses can plateau or decline while queueing and failures increase. This capture does not measure multicore capacity.

**Reference point, outside the comparison.** Proa alone was rerun at the top rate with 4 worker threads. CPU affinity remains 0; this changes thread count within the same CPU budget and does not measure multi-core scaling. Marko and React were not rerun with more processes, so this row is not comparable to theirs. With 4 threads Proa completed 3,467 responses per second at a request-rate target of 6,000 rps and a P99 of 5217.9 ms, using 1.00 cores.

| Proa worker threads | Request rate (rps) | Window completions/s | Complete P50 | Complete P99 | CPU/request | Cores | Peak RSS | Errors |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 4 | 6,000 | 3467 | 2604.5 ms | 5217.9 ms | 0.289 ms | 1.00 | 404.3 MiB | 0 |

The unloaded preflight checks all loading placeholders and resolved panels. Every measured response must contain the shell, all resolved panels, and every product card. Loading placeholders are optional during load: a boundary can resolve before its placeholder is flushed. Any placeholders present must have valid, unique boundary keys. The cards are the same markup the scoreboard's product-grid parity gate accepted from each engine. Wire bytes legitimately differ because each framework carries its own boundary-replacement protocol.

| Engine version | Fallback panels | Resolved panels | Product cards | Stream bytes |
| --- | ---: | ---: | ---: | ---: |
| Proa 0.3.0 @ bbbc9684 | 8 | 8 | 96 | 387,511 |
| Marko 6.0.150 | 8 | 8 | 96 | 289,888 |
| React 19.2.4 | 8 | 8 | 96 | 292,213 |

- Capture: [suspense-load/results/latest.json](suspense-load/results/latest.json); reproduce with `bun run bench:suspense-load`.
- The report verifier checks the measured-source SHA-256 against this checkout or the retained source snapshot before generating these tables.
- Proa source: Cargo.lock revision bbbc9684; Rust release build with native Proa Suspense and the direct `ssr_stream_send` Axum route. The same binary also serves the bounded local-executor path (`ssr_stream`) at `/local` for engineering comparison; it is not part of the published rows.
- Marko source: optimized ahead-of-time Marko template using native &lt;await&gt; plus &lt;@placeholder&gt;; its compiler is not resident in the measured server.
- React source: production Bun React server build using renderToReadableStream, Suspense, and use. The shell pipes immediately; allReady is not awaited.
- JavaScript engines run with `NODE_ENV=production`: the driver sets it, each server's health endpoint reports it back, and React reports that it loaded the production `react-dom/server` build. The runner refuses to measure otherwise.
- Stream bytes differ by protocol, not content: Proa base64-encodes each resolved boundary inside an inert template, so its stream is roughly a third larger on the wire than React's for the same 96 cards. Compression is off in every engine here; enabling it would remove most of that gap, at a CPU cost this benchmark deliberately leaves out.
- This is a single-host capacity curve, not a universal ranking. Loopback transfer, each framework’s HTTP adapter, boundary protocol, allocation, scheduling, and render work are all intentionally inside the application boundary.
<!-- suspense-load:end -->

[![Overlaid HTTP streaming throughput and memory for Proa, Marko, React and SvelteKit, with four latency panels on a shared scale](charts/svg/07-suspense-load.svg)](charts/svg/07-suspense-load.svg)

*Every line is one core: response ends at each request-rate target, the P50, P95, and P99 of the full response, and peak memory. Once a line drops below the target rate the engine has saturated and its latency is queueing. Each latency panel marks its highest P99 with a leader from the axis. Marko and React come from the table above; Proa and SvelteKit come from the newer [SvelteKit comparison capture](sveltekit.md#http-streaming-capacity-and-latency), so the chart's Proa line will not match the Proa rows above exactly. SvelteKit's response end delivers data, not rendered HTML. [Full size](charts/svg/07-suspense-load.svg) · [how the figures are built](charts/)*

## Next steps

- [Front page](README.md)
  - The four figures and the reasons to trust them.
- [Canonical scoreboard evidence](scoreboard.md)
  - The render-only timings these servers wrap, for seventeen renderers.
- [Shared HTTP load driver](load/)
  - Why a benchmark never reports a client knee as a server knee.
- [Page-load suite](page-load/), [cold-start suite](cold-start/), and [Suspense suite](suspense-load/)
  - Each suite's contract, engines, and reproduction commands.
