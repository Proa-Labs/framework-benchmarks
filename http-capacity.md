# HTTP capacity, cold start and streaming

The [Proa versus SvelteKit report](sveltekit.md) includes the production SvelteKit server below and a separate async comparison with browser completion. Its native promise-data stream has a different HTTP completion boundary from the resolved-HTML streams in this page.

One core of each framework's production server serves the same parity-gated pages over loopback HTTP. This page records [sustained capacity and latency at equal load](#canonical-pages-over-http-one-core-each), [cold start to first response](#cold-start-to-first-response), and [Suspense streaming](#suspense-streaming-over-http-one-core-each).

<!-- page-load:start -->
## Canonical pages over HTTP, one core each


**November 13, 2026 · Intel(R) Xeon(R) 6985P-C CPU @ 2.30GHz · 5 production servers · every response byte-identical to its parity-gated dump**

This is the capacity question behind the scoreboard: the same three parity-gated pages, served over real loopback HTTP/1.1 by each framework's ordinary production server, with every engine limited to one core of work. Proa runs one Tokio worker thread on Axum, React and Marko run one Bun process, and Go runs `GOMAXPROCS=1` on `net/http`. On the product grid, one Proa core sustained 15,517 complete responses per second against 1,313 for React, and spent 0.069 ms of CPU per response against React's 0.783 ms.

Each value is the median of 3 fresh server processes. **Capacity** rows use 64 closed-loop connections issuing requests back to back; throughput counts complete responses inside a fixed 5-second window after a 1-second pre-roll. **CPU per response** is the server process's exact CPU-time delta across all of its threads, including garbage-collector helpers, divided by successful responses. The load generator is 24 separate worker processes that hash every response; a phase is rejected if any worker's event loop exceeds 80% busy.

| Workload | Engine | Sustained responses/s | Proa ÷ engine | CPU per response | Cores used | Peak RSS |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Component page | Proa | 86,885 | 1.00× | 0.012 ms | 1.00 | 8.6 MiB |
| Component page | React | 6,427 | 13.5× | 0.162 ms | 1.00 | 96.0 MiB |
| Component page | Marko | 31,467 | 2.76× | 0.034 ms | 1.00 | 89.2 MiB |
| Component page | Go html/template | 5,386 | 16.1× | 0.186 ms | 1.00 | 16.2 MiB |
| Component page | SvelteKit | 5,945 | 14.6× | 0.182 ms | 1.00 | 111.2 MiB |
| Product grid | Proa | 15,517 | 1.00× | 0.069 ms | 1.00 | 9.3 MiB |
| Product grid | React | 1,313 | 11.8× | 0.783 ms | 1.00 | 122.1 MiB |
| Product grid | Marko | 4,326 | 3.59× | 0.236 ms | 1.00 | 105.9 MiB |
| Product grid | Go html/template | 755 | 20.5× | 1.324 ms | 1.00 | 15.7 MiB |
| Product grid | SvelteKit | 1,070 | 14.5× | 0.980 ms | 1.00 | 296.4 MiB |
| 1,000-row table | Proa | 1,429 | 1.00× | 0.728 ms | 1.00 | 10.6 MiB |
| 1,000-row table | React | 121 | 11.8× | 8.405 ms | 1.00 | 162.8 MiB |
| 1,000-row table | Marko | 442 | 3.23× | 2.303 ms | 1.00 | 120.4 MiB |
| 1,000-row table | Go html/template | 62 | 22.9× | 16.272 ms | 1.00 | 17.1 MiB |
| 1,000-row table | SvelteKit | 174 | 8.20× | 5.854 ms | 1.00 | 592.2 MiB |

Translating CPU per response into fleet size: the cores needed to serve 10,000 responses per second of each page, from the measured CPU per response. Real deployments add headroom, but the ratios carry over.

| Workload | Proa | React | Marko | Go html/template | SvelteKit |
| --- | ---: | ---: | ---: | ---: | ---: |
| Component page | 0.1 | 1.6 | 0.3 | 1.9 | 1.8 |
| Product grid | 0.7 | 7.8 | 2.4 | 13.2 | 9.8 |
| 1,000-row table | 7.3 | 84.1 | 23.0 | 162.7 | 58.5 |

**Latency at equal load** uses fixed-rate open-loop arrivals below every engine's knee, so the percentiles compare the same request-rate target rather than each server's own saturation point. Latency is measured from scheduled arrival and includes generator lag.

| Workload | Engine | Request rate (rps) | Complete P50 | Complete P99 | CPU per response | Peak RSS |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Component page | Proa | 2,000 | 0.12 ms | 0.60 ms | 0.021 ms | 7.3 MiB |
| Component page | React | 2,000 | 0.24 ms | 16.7 ms | 0.216 ms | 90.9 MiB |
| Component page | Marko | 2,000 | 0.14 ms | 1.70 ms | 0.081 ms | 63.9 MiB |
| Component page | Go html/template | 2,000 | 0.24 ms | 0.86 ms | 0.199 ms | 15.1 MiB |
| Component page | SvelteKit | 2,000 | 0.25 ms | 21.2 ms | 0.264 ms | 111.4 MiB |
| Product grid | Proa | 500 | 0.39 ms | 1.03 ms | 0.124 ms | 7.9 MiB |
| Product grid | React | 500 | 0.93 ms | 2.92 ms | 0.867 ms | 103.1 MiB |
| Product grid | Marko | 500 | 0.45 ms | 1.07 ms | 0.307 ms | 76.8 MiB |
| Product grid | Go html/template | 500 | 1.33 ms | 1.99 ms | 1.322 ms | 15.2 MiB |
| Product grid | SvelteKit | 500 | 0.95 ms | 13.3 ms | 0.956 ms | 114.2 MiB |
| 1,000-row table | Proa | 50 | 1.90 ms | 2.64 ms | 0.941 ms | 9.2 MiB |
| 1,000-row table | React | 50 | 8.06 ms | 16.1 ms | 8.278 ms | 152.2 MiB |
| 1,000-row table | Marko | 50 | 2.98 ms | 4.64 ms | 2.588 ms | 84.6 MiB |
| 1,000-row table | Go html/template | 50 | 16.7 ms | 18.1 ms | 16.568 ms | 15.5 MiB |
| 1,000-row table | SvelteKit | 50 | 5.37 ms | 11.6 ms | 5.699 ms | 161.4 MiB |

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


**November 13, 2026 · Intel(R) Xeon(R) 6985P-C CPU @ 2.30GHz · 15 fresh processes per engine**

Every autoscaling event, cold serverless instance, per-tenant process, and developer restart pays this cost. Each row spawns the same production server used in the HTTP capacity section, polls its port every millisecond, and stops the clock when the first complete product-grid response ends; that response must be byte-identical to the engine's canonical dump. Proa's first response arrived in 7.61 ms at the median against 52.6 ms for React, whose figure includes Bun 1.4.2 start-up and loading React and the page module. Engines rotate every start, 2 untimed starts warm the disk cache, and the RSS column is sampled immediately after the first response.

| Engine | First response P50 | P95 | Max | First byte P50 | RSS after first response |
| --- | ---: | ---: | ---: | ---: | ---: |
| Proa 0.3.0 @ bbbc9684 | 7.61 ms | 9.76 ms | 10.1 ms | 7.36 ms | 6.3 MiB |
| React | 52.6 ms | 57.8 ms | 58.9 ms | 52.4 ms | 57.3 MiB |
| Marko | 38.8 ms | 45.3 ms | 48.4 ms | 38.2 ms | 39.9 MiB |
| Go html/template | 10.7 ms | 13.1 ms | 14.1 ms | 9.39 ms | 9.9 MiB |
| SvelteKit | 60.3 ms | 65.7 ms | 66.4 ms | 60.0 ms | 51.0 MiB |

- Capture: [cold-start/results/latest.json](cold-start/results/latest.json); reproduce with `bun run bench:cold-start`.
- Servers, ports, and per-core limits are the same as the [HTTP capacity section](#canonical-pages-over-http-one-core-each). Wall time includes process creation, runtime start-up, module or binary loading, fixture construction, and the first render.
- Host one-minute load average when the capture started: 9.14 on 16 logical CPUs. Cold start is a few milliseconds of wall time, so it is the measurement most sensitive to other work on the machine; rerun it on an idle host before quoting absolute values.
<!-- cold-start:end -->

[![Median, P95 and slowest time from process spawn to first complete product-grid response for Proa, React, Marko and Go html/template, with RSS after the first response](charts/svg/09-cold-start.svg)](charts/svg/09-cold-start.svg)

*Fifteen fresh processes per engine. The bar is the median, the tick P95, and the hollow endpoint the slowest start. [Full size](charts/svg/09-cold-start.svg) · [how the figures are built](charts/)*

The product grid also streams, which is the subject of [Suspense streaming over HTTP](#suspense-streaming-over-http-one-core-each).

<!-- suspense-load:start -->
## Suspense streaming over HTTP, one core each


**November 13, 2026 · Intel(R) Xeon(R) 6985P-C CPU @ 2.30GHz · 8 async boundaries × 12 product cards · one worker thread or process per engine**

This is the product grid from the capacity section, streamed. Equivalent production-mode Proa, Marko, and React applications run over real loopback HTTP/1.1. Every request streams a shell, starts 8 independent data operations across the 5, 8, 12, 18, 27, 40, 60, 90 ms delay tiers, may stream loading placeholders while those operations are pending, and completes only after every panel has resolved to its 12 product cards on the wire, 96 cards in all. Delayed values stay typed and in memory; there is no JSON serialization, deserialization, or external I/O in the measured request path. Rendering, boundary scheduling, replacement framing, and one flush per boundary are all inside the measurement.

Every engine is limited to one unit of concurrency: Proa runs 1 Tokio worker thread, and Marko and React each run one Bun process. Proa serves this page through `RouteResponse::ssr_stream_send`, the compiler-proved `Send` streaming path introduced by [Proa PR #82](https://github.com/Proa-Labs/proa/pull/82): Axum polls the response stream directly, with no per-response bridge thread. The cores column shows what each process actually used, and CPU/request charges every thread of every engine the same way.

Each row is the median of 3 fresh-process phases under fixed-rate open-loop arrivals from 24 separate load-generator processes, so saturation remains visible as in-flight work and scheduled-arrival latency instead of being suppressed by a client waiting for each prior response. A 1-second pre-roll fills the async pipeline, then successful full responses completed inside a fixed 5-second observation window determine completion throughput. Complete-response percentiles and shell P50 cover requests arriving during that observation window and include load-generator scheduling lag and server queueing. CPU/request is the server process's exact CPU-time delta divided by successful responses across the full phase. Errors are summed across the 3 repeats. Publication aborts if scheduler-lag P95 exceeds 25 ms or any generator worker exceeds 80% busy in any phase, and each phase waits for the previous phase's client sockets to leave TIME_WAIT before it starts.

| Engine | Request rate (rps) | Window completions/s | Shell P50 | Complete P50 | Complete P95 | Complete P99 | CPU/request | Cores | Peak RSS | Max in-flight | Generator lag P95 | Errors |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Proa | 250 | 250 | 0.31 ms | 91.7 ms | 91.8 ms | 92.4 ms | 0.251 ms | 0.06 | 8.0 MiB | 24 | 0.01 ms | 0 |
| Proa | 500 | 500 | 0.22 ms | 91.4 ms | 91.5 ms | 92.0 ms | 0.245 ms | 0.12 | 9.4 MiB | 51 | 0.01 ms | 0 |
| Proa | 1,000 | 1000 | 0.19 ms | 91.2 ms | 91.4 ms | 92.1 ms | 0.254 ms | 0.25 | 12.4 MiB | 103 | 0.01 ms | 0 |
| Proa | 2,000 | 2000 | 0.22 ms | 91.3 ms | 93.8 ms | 101.8 ms | 0.273 ms | 0.54 | 18.2 MiB | 209 | 1.07 ms | 0 |
| Proa | 3,000 | 3000 | 0.79 ms | 92.0 ms | 102.1 ms | 106.8 ms | 0.283 ms | 0.84 | 25.3 MiB | 321 | 3.31 ms | 0 |
| Proa | 4,000 | 3542 | 25.0 ms | 508.7 ms | 1156.5 ms | 1278.5 ms | 0.277 ms | 0.99 | 176.6 MiB | 3,078 | 5.59 ms | 0 |
| Proa | 5,000 | 3459 | 645.6 ms | 1738.0 ms | 2999.7 ms | 3376.2 ms | 0.281 ms | 1.00 | 363.5 MiB | 9,621 | 5.96 ms | 0 |
| Proa | 6,000 | 3476 | 1580.9 ms | 2610.7 ms | 4273.2 ms | 4611.9 ms | 0.281 ms | 1.00 | 360.3 MiB | 15,495 | 7.81 ms | 0 |
| Marko | 250 | 250 | 0.47 ms | 90.4 ms | 91.5 ms | 92.6 ms | 1.030 ms | 0.25 | 91.9 MiB | 25 | 0.01 ms | 0 |
| Marko | 500 | 500 | 0.41 ms | 90.3 ms | 91.9 ms | 96.2 ms | 0.856 ms | 0.42 | 105.1 MiB | 57 | 0.01 ms | 0 |
| Marko | 1,000 | 1001 | 0.44 ms | 91.3 ms | 98.8 ms | 110.5 ms | 0.756 ms | 0.74 | 138.1 MiB | 127 | 0.01 ms | 0 |
| Marko | 2,000 | 1127 | 2858.9 ms | 3182.7 ms | 5998.1 ms | 6906.1 ms | 0.881 ms | 0.97 | 1500.7 MiB | 5,739 | 0.12 ms | 0 |
| Marko | 3,000 | 1074 | 5936.5 ms | 5998.8 ms | 10646.5 ms | 12351.3 ms | 0.854 ms | 1.00 | 2318.8 MiB | 12,090 | 0.35 ms | 0 |
| Marko | 4,000 | 1045 | 9383.2 ms | 9383.3 ms | 14713.2 ms | 14976.4 ms | 0.881 ms | 1.00 | 2919.0 MiB | 18,351 | 0.56 ms | 295 |
| Marko | 5,000 | 1138 | 10719.2 ms | 11320.2 ms | 17927.9 ms | 18271.9 ms | 0.817 ms | 1.00 | 3013.3 MiB | 23,791 | 0.63 ms | 416 |
| Marko | 6,000 | 1123 | 14122.9 ms | 14122.9 ms | 22724.9 ms | 22809.6 ms | 0.803 ms | 1.00 | 3257.4 MiB | 29,896 | 1.38 ms | 0 |
| React | 250 | 250 | 0.91 ms | 94.5 ms | 99.1 ms | 102.6 ms | 3.451 ms | 0.85 | 101.8 MiB | 36 | 0.30 ms | 0 |
| React | 500 | 274 | 476.6 ms | 2885.3 ms | 4747.7 ms | 4829.6 ms | 3.587 ms | 1.00 | 434.2 MiB | 1,417 | 0.01 ms | 0 |
| React | 1,000 | 260 | 2964.0 ms | 9455.4 ms | 19963.7 ms | 20151.6 ms | 3.596 ms | 0.91 | 695.9 MiB | 4,488 | 0.01 ms | 0 |
| React | 2,000 | 243 | 6918.1 ms | 20079.2 ms | 37236.2 ms | 38170.4 ms | 4.194 ms | 1.00 | 1982.8 MiB | 10,621 | 0.01 ms | 5,453 |
| React | 3,000 | 276 | 21756.6 ms | 31207.9 ms | 54430.2 ms | 69825.1 ms | 4.035 ms | 0.84 | 2672.1 MiB | 16,529 | 0.01 ms | 9,136 |
| React | 4,000 | 261 | 35256.6 ms | 49786.1 ms | 72638.8 ms | 78112.7 ms | 4.635 ms | 1.00 | 3237.3 MiB | 22,694 | 0.01 ms | 19,222 |
| React | 5,000 | 280 | 33557.6 ms | 47567.7 ms | 79742.9 ms | 89632.1 ms | 4.283 ms | 0.71 | 2601.3 MiB | 28,601 | 0.01 ms | 23,530 |
| React | 6,000 | 281 | 49417.5 ms | 62292.5 ms | 105774.7 ms | 114431.0 ms | 4.184 ms | 0.94 | 3346.6 MiB | 34,596 | 0.76 ms | 23,084 |

**Every comparative row uses one logical CPU.** Proa runs one Tokio worker thread, and Marko and React each run one Bun process. Server CPU affinity is 0; the load generator runs separately. Above saturation, completed responses can plateau or decline while queueing and failures increase. This capture does not measure multicore capacity.

**Reference point, outside the comparison.** Proa alone was rerun at the top rate with 4 worker threads. CPU affinity remains 0; this changes thread count within the same CPU budget and does not measure multi-core scaling. Marko and React were not rerun with more processes, so this row is not comparable to theirs. With 4 threads Proa completed 3,554 responses per second at a request-rate target of 6,000 rps and a P99 of 4805.8 ms, using 1.00 cores.

| Proa worker threads | Request rate (rps) | Window completions/s | Complete P50 | Complete P99 | CPU/request | Cores | Peak RSS | Errors |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 4 | 6,000 | 3554 | 2465.0 ms | 4805.8 ms | 0.281 ms | 1.00 | 404.1 MiB | 0 |

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
