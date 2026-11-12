# HTTP capacity, cold start and streaming

The [Proa versus SvelteKit report](sveltekit.md) includes the production SvelteKit server below and a separate async comparison with browser completion. Its native promise-data stream has a different HTTP completion boundary from the resolved-HTML streams in this page.

One core of each framework's production server serves the same parity-gated pages over loopback HTTP. This page records [sustained capacity and latency at equal load](#canonical-pages-over-http-one-core-each), [cold start to first response](#cold-start-to-first-response), and [Suspense streaming](#suspense-streaming-over-http-one-core-each).

<!-- page-load:start -->
## Canonical pages over HTTP, one core each


**November 12, 2026 · Intel(R) Xeon(R) 6985P-C CPU @ 2.30GHz · 5 production servers · every response byte-identical to its parity-gated dump**

This is the capacity question behind the scoreboard: the same three parity-gated pages, served over real loopback HTTP/1.1 by each framework's ordinary production server, with every engine limited to one core of work. Proa runs one Tokio worker thread on Axum, React and Marko run one Bun process, and Go runs `GOMAXPROCS=1` on `net/http`. On the product grid, one Proa core sustained 16,046 complete responses per second against 1,361 for React, and spent 0.066 ms of CPU per response against React's 0.757 ms.

Each value is the median of 3 fresh server processes. **Capacity** rows use 64 closed-loop connections issuing requests back to back; throughput counts complete responses inside a fixed 5-second window after a 1-second pre-roll. **CPU per response** is the server process's exact CPU-time delta across all of its threads, including garbage-collector helpers, divided by successful responses. The load generator is 24 separate worker processes that hash every response; a phase is rejected if any worker's event loop exceeds 80% busy.

| Workload | Engine | Sustained responses/s | Proa ÷ engine | CPU per response | Cores used | Peak RSS |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Component page | Proa | 90,480 | 1.00× | 0.011 ms | 1.00 | 8.6 MiB |
| Component page | React | 6,647 | 13.6× | 0.157 ms | 1.00 | 98.7 MiB |
| Component page | Marko | 33,197 | 2.73× | 0.032 ms | 1.00 | 87.9 MiB |
| Component page | Go html/template | 5,488 | 16.5× | 0.182 ms | 1.00 | 16.2 MiB |
| Component page | SvelteKit | 6,514 | 13.9× | 0.166 ms | 1.00 | 112.9 MiB |
| Product grid | Proa | 16,046 | 1.00× | 0.066 ms | 1.00 | 9.2 MiB |
| Product grid | React | 1,361 | 11.8× | 0.757 ms | 1.00 | 112.8 MiB |
| Product grid | Marko | 4,472 | 3.59× | 0.227 ms | 1.00 | 107.5 MiB |
| Product grid | Go html/template | 771 | 20.8× | 1.297 ms | 1.00 | 15.7 MiB |
| Product grid | SvelteKit | 1,174 | 13.7× | 0.896 ms | 1.00 | 286.8 MiB |
| 1,000-row table | Proa | 1,484 | 1.00× | 0.703 ms | 1.00 | 10.6 MiB |
| 1,000-row table | React | 127 | 11.7× | 7.955 ms | 1.00 | 155.4 MiB |
| 1,000-row table | Marko | 456 | 3.25× | 2.238 ms | 1.00 | 119.6 MiB |
| 1,000-row table | Go html/template | 62 | 23.9× | 15.971 ms | 1.00 | 17.0 MiB |
| 1,000-row table | SvelteKit | 186 | 7.99× | 5.551 ms | 1.00 | 678.2 MiB |

Translating CPU per response into fleet size: the cores needed to serve 10,000 responses per second of each page, from the measured CPU per response. Real deployments add headroom, but the ratios carry over.

| Workload | Proa | React | Marko | Go html/template | SvelteKit |
| --- | ---: | ---: | ---: | ---: | ---: |
| Component page | 0.1 | 1.6 | 0.3 | 1.8 | 1.7 |
| Product grid | 0.7 | 7.6 | 2.3 | 13.0 | 9.0 |
| 1,000-row table | 7.0 | 79.5 | 22.4 | 159.7 | 55.5 |

**Latency at equal load** uses fixed-rate open-loop arrivals below every engine's knee, so the percentiles compare the same request-rate target rather than each server's own saturation point. Latency is measured from scheduled arrival and includes generator lag.

| Workload | Engine | Request rate (rps) | Complete P50 | Complete P99 | CPU per response | Peak RSS |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Component page | Proa | 2,000 | 0.12 ms | 0.48 ms | 0.022 ms | 7.3 MiB |
| Component page | React | 2,000 | 0.23 ms | 11.8 ms | 0.206 ms | 90.0 MiB |
| Component page | Marko | 2,000 | 0.13 ms | 1.46 ms | 0.073 ms | 63.6 MiB |
| Component page | Go html/template | 2,000 | 0.24 ms | 0.77 ms | 0.195 ms | 15.2 MiB |
| Component page | SvelteKit | 2,000 | 0.24 ms | 20.9 ms | 0.250 ms | 102.6 MiB |
| Product grid | Proa | 500 | 0.34 ms | 0.94 ms | 0.122 ms | 7.8 MiB |
| Product grid | React | 500 | 0.89 ms | 2.66 ms | 0.826 ms | 105.4 MiB |
| Product grid | Marko | 500 | 0.42 ms | 1.01 ms | 0.282 ms | 77.1 MiB |
| Product grid | Go html/template | 500 | 1.30 ms | 1.94 ms | 1.292 ms | 15.1 MiB |
| Product grid | SvelteKit | 500 | 0.90 ms | 11.6 ms | 0.908 ms | 118.9 MiB |
| 1,000-row table | Proa | 50 | 1.85 ms | 2.47 ms | 0.923 ms | 9.2 MiB |
| 1,000-row table | React | 50 | 8.34 ms | 14.1 ms | 8.263 ms | 139.0 MiB |
| 1,000-row table | Marko | 50 | 2.76 ms | 3.82 ms | 2.446 ms | 85.8 MiB |
| 1,000-row table | Go html/template | 50 | 16.3 ms | 17.1 ms | 16.127 ms | 15.4 MiB |
| 1,000-row table | SvelteKit | 50 | 5.26 ms | 16.2 ms | 5.532 ms | 180.0 MiB |

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

Every autoscaling event, cold serverless instance, per-tenant process, and developer restart pays this cost. Each row spawns the same production server used in the HTTP capacity section, polls its port every millisecond, and stops the clock when the first complete product-grid response ends; that response must be byte-identical to the engine's canonical dump. Proa's first response arrived in 5.98 ms at the median against 46.6 ms for React, whose figure includes Bun 1.4.2 start-up and loading React and the page module. Engines rotate every start, 2 untimed starts warm the disk cache, and the RSS column is sampled immediately after the first response.

| Engine | First response P50 | P95 | Max | First byte P50 | RSS after first response |
| --- | ---: | ---: | ---: | ---: | ---: |
| Proa 0.3.0 @ bbbc9684 | 5.98 ms | 8.46 ms | 8.64 ms | 5.67 ms | 6.3 MiB |
| React | 46.6 ms | 53.0 ms | 53.1 ms | 46.3 ms | 57.8 MiB |
| Marko | 33.2 ms | 35.9 ms | 36.5 ms | 33.0 ms | 39.9 MiB |
| Go html/template | 8.82 ms | 10.6 ms | 11.0 ms | 7.41 ms | 9.9 MiB |
| SvelteKit | 52.7 ms | 57.1 ms | 58.7 ms | 52.5 ms | 51.0 MiB |

- Capture: [cold-start/results/latest.json](cold-start/results/latest.json); reproduce with `bun run bench:cold-start`.
- Servers, ports, and per-core limits are the same as the [HTTP capacity section](#canonical-pages-over-http-one-core-each). Wall time includes process creation, runtime start-up, module or binary loading, fixture construction, and the first render.
- Host one-minute load average when the capture started: 0.78 on 16 logical CPUs. Cold start is a few milliseconds of wall time, so it is the measurement most sensitive to other work on the machine; rerun it on an idle host before quoting absolute values.
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
| Proa | 250 | 250 | 0.23 ms | 91.6 ms | 91.7 ms | 92.3 ms | 0.240 ms | 0.06 | 8.0 MiB | 24 | 0.00 ms | 0 |
| Proa | 500 | 500 | 0.17 ms | 91.3 ms | 91.4 ms | 91.7 ms | 0.235 ms | 0.12 | 9.2 MiB | 49 | 0.01 ms | 0 |
| Proa | 1,000 | 1000 | 0.15 ms | 91.2 ms | 91.4 ms | 92.2 ms | 0.235 ms | 0.23 | 12.4 MiB | 102 | 0.01 ms | 0 |
| Proa | 2,000 | 2000 | 0.19 ms | 91.2 ms | 93.3 ms | 101.9 ms | 0.255 ms | 0.50 | 18.2 MiB | 213 | 0.90 ms | 0 |
| Proa | 3,000 | 3000 | 0.67 ms | 91.8 ms | 101.3 ms | 103.9 ms | 0.271 ms | 0.80 | 23.9 MiB | 322 | 3.09 ms | 0 |
| Proa | 4,000 | 3651 | 30.4 ms | 444.1 ms | 912.3 ms | 977.7 ms | 0.270 ms | 0.99 | 149.7 MiB | 2,516 | 6.48 ms | 0 |
| Proa | 5,000 | 3570 | 586.5 ms | 1531.5 ms | 2823.6 ms | 3149.6 ms | 0.274 ms | 1.00 | 364.6 MiB | 9,092 | 5.76 ms | 0 |
| Proa | 6,000 | 3475 | 1711.9 ms | 2703.3 ms | 4199.1 ms | 4589.4 ms | 0.279 ms | 1.00 | 368.3 MiB | 15,772 | 7.10 ms | 0 |
| Marko | 250 | 250 | 0.35 ms | 90.3 ms | 91.1 ms | 92.4 ms | 0.883 ms | 0.22 | 93.1 MiB | 25 | 0.01 ms | 0 |
| Marko | 500 | 500 | 0.38 ms | 90.3 ms | 91.9 ms | 95.8 ms | 0.768 ms | 0.38 | 105.1 MiB | 52 | 0.00 ms | 0 |
| Marko | 1,000 | 1000 | 0.40 ms | 90.8 ms | 96.2 ms | 106.9 ms | 0.704 ms | 0.69 | 138.0 MiB | 128 | 0.01 ms | 0 |
| Marko | 2,000 | 1189 | 2487.7 ms | 2819.0 ms | 4265.0 ms | 5561.6 ms | 0.820 ms | 0.94 | 1839.5 MiB | 5,348 | 0.19 ms | 0 |
| Marko | 3,000 | 1093 | 5084.4 ms | 5322.6 ms | 10368.8 ms | 13118.4 ms | 0.830 ms | 0.93 | 2426.9 MiB | 11,782 | 0.34 ms | 0 |
| Marko | 4,000 | 1029 | 8708.7 ms | 8912.4 ms | 13163.1 ms | 13346.8 ms | 0.804 ms | 1.00 | 2816.2 MiB | 18,203 | 0.40 ms | 11 |
| Marko | 5,000 | 1126 | 10977.2 ms | 10977.4 ms | 17694.5 ms | 17903.6 ms | 0.798 ms | 1.00 | 3104.7 MiB | 23,999 | 0.64 ms | 130 |
| Marko | 6,000 | 1009 | 13413.1 ms | 14379.8 ms | 22435.9 ms | 22893.7 ms | 0.803 ms | 1.00 | 3593.1 MiB | 30,433 | 1.36 ms | 0 |
| React | 250 | 250 | 0.73 ms | 93.5 ms | 97.4 ms | 100.5 ms | 3.268 ms | 0.81 | 93.7 MiB | 30 | 0.18 ms | 0 |
| React | 500 | 290 | 423.4 ms | 2437.9 ms | 3972.0 ms | 4021.7 ms | 3.327 ms | 1.00 | 396.4 MiB | 1,279 | 0.01 ms | 0 |
| React | 1,000 | 265 | 2147.5 ms | 8056.2 ms | 18822.3 ms | 19875.3 ms | 3.443 ms | 0.87 | 686.6 MiB | 4,425 | 0.01 ms | 0 |
| React | 2,000 | 273 | 10385.3 ms | 21510.1 ms | 36411.6 ms | 38198.8 ms | 3.467 ms | 1.00 | 1213.4 MiB | 10,481 | 0.01 ms | 1,814 |
| React | 3,000 | 279 | 25123.2 ms | 36706.8 ms | 52108.0 ms | 54973.9 ms | 4.529 ms | 1.00 | 3891.2 MiB | 16,575 | 0.01 ms | 12,846 |
| React | 4,000 | 291 | 44864.2 ms | 50514.3 ms | 72769.0 ms | 75838.7 ms | 4.387 ms | 0.99 | 3187.6 MiB | 22,547 | 0.01 ms | 16,320 |
| React | 5,000 | 288 | 33051.2 ms | 46621.3 ms | 81653.2 ms | 83738.4 ms | 4.038 ms | 1.00 | 2220.5 MiB | 28,559 | 0.01 ms | 20,952 |
| React | 6,000 | 284 | 49456.9 ms | 63350.3 ms | 106138.3 ms | 112549.4 ms | 4.099 ms | 0.99 | 2811.2 MiB | 34,579 | 0.71 ms | 23,099 |

**Every comparative row uses one logical CPU.** Proa runs one Tokio worker thread, and Marko and React each run one Bun process. Server CPU affinity is 0; the load generator runs separately. Above saturation, completed responses can plateau or decline while queueing and failures increase. This capture does not measure multicore capacity.

**Reference point, outside the comparison.** Proa alone was rerun at the top rate with 4 worker threads. CPU affinity remains 0; this changes thread count within the same CPU budget and does not measure multi-core scaling. Marko and React were not rerun with more processes, so this row is not comparable to theirs. With 4 threads Proa completed 3,569 responses per second at a request-rate target of 6,000 rps and a P99 of 4654.4 ms, using 1.00 cores.

| Proa worker threads | Request rate (rps) | Window completions/s | Complete P50 | Complete P99 | CPU/request | Cores | Peak RSS | Errors |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 4 | 6,000 | 3569 | 2406.8 ms | 4654.4 ms | 0.277 ms | 1.00 | 401.2 MiB | 0 |

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
