# HTTP capacity, cold start and streaming

The [Proa versus SvelteKit report](sveltekit.md) includes the production SvelteKit server below and a separate async comparison with browser completion. Its native promise-data stream has a different HTTP completion boundary from the resolved-HTML streams in this page.

One core of each framework's production server serves the same parity-gated pages over loopback HTTP. This page records [sustained capacity and latency at equal load](#canonical-pages-over-http-one-core-each), [cold start to first response](#cold-start-to-first-response), and [Suspense streaming](#suspense-streaming-over-http-one-core-each).

<!-- page-load:start -->
## Canonical pages over HTTP, one core each


**November 13, 2026 · Intel(R) Xeon(R) 6985P-C CPU @ 2.30GHz · 5 production servers · every response byte-identical to its parity-gated dump**

This is the capacity question behind the scoreboard: the same three parity-gated pages, served over real loopback HTTP/1.1 by each framework's ordinary production server, with every engine limited to one core of work. Proa runs one Tokio worker thread on Axum, React and Marko run one Bun process, and Go runs `GOMAXPROCS=1` on `net/http`. On the product grid, one Proa core sustained 16,128 complete responses per second against 1,355 for React, and spent 0.066 ms of CPU per response against React's 0.766 ms.

Each value is the median of 3 fresh server processes. **Capacity** rows use 64 closed-loop connections issuing requests back to back; throughput counts complete responses inside a fixed 5-second window after a 1-second pre-roll. **CPU per response** is the server process's exact CPU-time delta across all of its threads, including garbage-collector helpers, divided by successful responses. The load generator is 24 separate worker processes that hash every response; a phase is rejected if any worker's event loop exceeds 80% busy.

| Workload | Engine | Sustained responses/s | Proa ÷ engine | CPU per response | Cores used | Peak RSS |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Component page | Proa | 89,865 | 1.00× | 0.011 ms | 1.00 | 8.6 MiB |
| Component page | React | 6,408 | 14.0× | 0.163 ms | 1.00 | 99.3 MiB |
| Component page | Marko | 31,089 | 2.89× | 0.034 ms | 1.00 | 90.2 MiB |
| Component page | Go html/template | 5,347 | 16.8× | 0.187 ms | 1.00 | 16.2 MiB |
| Component page | SvelteKit | 5,745 | 15.6× | 0.187 ms | 1.00 | 117.2 MiB |
| Product grid | Proa | 16,128 | 1.00× | 0.066 ms | 1.00 | 9.1 MiB |
| Product grid | React | 1,355 | 11.9× | 0.766 ms | 1.00 | 113.6 MiB |
| Product grid | Marko | 4,172 | 3.87× | 0.244 ms | 1.00 | 110.9 MiB |
| Product grid | Go html/template | 758 | 21.3× | 1.320 ms | 1.00 | 15.4 MiB |
| Product grid | SvelteKit | 1,126 | 14.3× | 0.931 ms | 1.00 | 303.6 MiB |
| 1,000-row table | Proa | 1,697 | 1.00× | 0.619 ms | 1.00 | 10.6 MiB |
| 1,000-row table | React | 120 | 14.1× | 8.382 ms | 1.00 | 151.2 MiB |
| 1,000-row table | Marko | 442 | 3.84× | 2.309 ms | 1.00 | 121.8 MiB |
| 1,000-row table | Go html/template | 63 | 26.9× | 16.170 ms | 1.00 | 16.9 MiB |
| 1,000-row table | SvelteKit | 178 | 9.54× | 5.803 ms | 1.00 | 592.2 MiB |

Translating CPU per response into fleet size: the cores needed to serve 10,000 responses per second of each page, from the measured CPU per response. Real deployments add headroom, but the ratios carry over.

| Workload | Proa | React | Marko | Go html/template | SvelteKit |
| --- | ---: | ---: | ---: | ---: | ---: |
| Component page | 0.1 | 1.6 | 0.3 | 1.9 | 1.9 |
| Product grid | 0.7 | 7.7 | 2.4 | 13.2 | 9.3 |
| 1,000-row table | 6.2 | 83.8 | 23.1 | 161.7 | 58.0 |

**Latency at equal load** uses fixed-rate open-loop arrivals below every engine's knee, so the percentiles compare the same request-rate target rather than each server's own saturation point. Latency is measured from scheduled arrival and includes generator lag.

| Workload | Engine | Request rate (rps) | Complete P50 | Complete P99 | CPU per response | Peak RSS |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Component page | Proa | 2,000 | 0.12 ms | 0.55 ms | 0.022 ms | 7.3 MiB |
| Component page | React | 2,000 | 0.24 ms | 11.8 ms | 0.211 ms | 93.5 MiB |
| Component page | Marko | 2,000 | 0.13 ms | 1.74 ms | 0.077 ms | 63.6 MiB |
| Component page | Go html/template | 2,000 | 0.24 ms | 0.84 ms | 0.197 ms | 15.2 MiB |
| Component page | SvelteKit | 2,000 | 0.26 ms | 24.1 ms | 0.261 ms | 102.9 MiB |
| Product grid | Proa | 500 | 0.37 ms | 1.01 ms | 0.121 ms | 7.8 MiB |
| Product grid | React | 500 | 0.93 ms | 2.88 ms | 0.865 ms | 108.7 MiB |
| Product grid | Marko | 500 | 0.44 ms | 1.08 ms | 0.296 ms | 74.5 MiB |
| Product grid | Go html/template | 500 | 1.33 ms | 2.02 ms | 1.321 ms | 15.2 MiB |
| Product grid | SvelteKit | 500 | 0.94 ms | 13.4 ms | 0.928 ms | 113.9 MiB |
| 1,000-row table | Proa | 50 | 1.82 ms | 2.50 ms | 0.848 ms | 9.1 MiB |
| 1,000-row table | React | 50 | 7.23 ms | 13.3 ms | 7.074 ms | 153.9 MiB |
| 1,000-row table | Marko | 50 | 2.91 ms | 3.84 ms | 2.579 ms | 84.0 MiB |
| 1,000-row table | Go html/template | 50 | 16.6 ms | 17.4 ms | 16.330 ms | 15.5 MiB |
| 1,000-row table | SvelteKit | 50 | 5.61 ms | 23.0 ms | 6.047 ms | 161.4 MiB |

Every measured response was compared byte for byte against the dump the same engine produced through its canonical adapter, which is the dump that passed the scoreboard's browser-DOM parity gate.

| Engine version | Component page bytes | Product grid bytes | 1,000-row table bytes | HTTP responses |
| --- | ---: | ---: | ---: | --- |
| Proa 0.3.0 @ ceffd9f3 | 25,108 | 284,908 | 988,509 | byte-identical |
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


**November 13, 2026 · Intel(R) Xeon(R) 6985P-C CPU @ 2.30GHz · 15 fresh processes per engine**

Every autoscaling event, cold serverless instance, per-tenant process, and developer restart pays this cost. Each row spawns the same production server used in the HTTP capacity section, polls its port every millisecond, and stops the clock when the first complete product-grid response ends; that response must be byte-identical to the engine's canonical dump. Proa's first response arrived in 7.75 ms at the median against 52.5 ms for React, whose figure includes Bun 1.4.2 start-up and loading React and the page module. Engines rotate every start, 2 untimed starts warm the disk cache, and the RSS column is sampled immediately after the first response.

| Engine | First response P50 | P95 | Max | First byte P50 | RSS after first response |
| --- | ---: | ---: | ---: | ---: | ---: |
| Proa 0.3.0 @ ceffd9f3 | 7.75 ms | 9.45 ms | 9.65 ms | 7.49 ms | 6.2 MiB |
| React | 52.5 ms | 57.6 ms | 59.0 ms | 52.4 ms | 57.3 MiB |
| Marko | 37.9 ms | 41.0 ms | 41.3 ms | 37.7 ms | 40.1 MiB |
| Go html/template | 10.3 ms | 12.8 ms | 13.2 ms | 9.04 ms | 9.9 MiB |
| SvelteKit | 62.8 ms | 67.8 ms | 68.5 ms | 62.5 ms | 51.0 MiB |

- Capture: [benchmarks/cold-start/results/latest.json](../../benchmarks/cold-start/results/latest.json); reproduce with `bun run bench:cold-start`.
- Servers, ports, and per-core limits are the same as the [HTTP capacity section](#canonical-pages-over-http-one-core-each). Wall time includes process creation, runtime start-up, module or binary loading, fixture construction, and the first render.
- Host one-minute load average when the capture started: 11.94 on 16 logical CPUs. Cold start is a few milliseconds of wall time, so it is the measurement most sensitive to other work on the machine; rerun it on an idle host before quoting absolute values.
<!-- cold-start:end -->

[![Median, P95 and slowest time from process spawn to first complete product-grid response for Proa, React, Marko and Go html/template, with RSS after the first response](../figures/09-cold-start.svg)](../figures/09-cold-start.svg)

*Fifteen fresh processes per engine. The bar is the median, the tick P95, and the hollow endpoint the slowest start. [Full size](../figures/09-cold-start.svg) · [how the figures are built](../../tooling/charts/)*

The product grid also streams, which is the subject of [Suspense streaming over HTTP](#suspense-streaming-over-http-one-core-each).

<!-- suspense-load:start -->
## Suspense streaming over HTTP, one core each


**November 13, 2026 · Intel(R) Xeon(R) 6985P-C CPU @ 2.30GHz · 8 async boundaries × 12 product cards · one worker thread or process per engine**

This is the product grid from the capacity section, streamed. Equivalent production-mode Proa, Marko, and React applications run over real loopback HTTP/1.1. Every request streams a shell, starts 8 independent data operations across the 5, 8, 12, 18, 27, 40, 60, 90 ms delay tiers, may stream loading placeholders while those operations are pending, and completes only after every panel has resolved to its 12 product cards on the wire, 96 cards in all. Delayed values stay typed and in memory; there is no JSON serialization, deserialization, or external I/O in the measured request path. Rendering, boundary scheduling, replacement framing, and one flush per boundary are all inside the measurement.

Every engine is limited to one unit of concurrency: Proa runs 1 Tokio worker thread, and Marko and React each run one Bun process. Proa serves this page through `RouteResponse::ssr_stream_send`, the compiler-proved `Send` streaming path introduced by [Proa PR #82](https://github.com/Proa-Labs/proa/pull/82): Axum polls the response stream directly, with no per-response bridge thread. The cores column shows what each process actually used, and CPU/request charges every thread of every engine the same way.

Each row is the median of 3 fresh-process phases under fixed-rate open-loop arrivals from 32 separate load-generator processes, so saturation remains visible as in-flight work and scheduled-arrival latency instead of being suppressed by a client waiting for each prior response. A 1-second pre-roll fills the async pipeline, then successful full responses completed inside a fixed 5-second observation window determine completion throughput. Complete-response percentiles and shell P50 cover requests arriving during that observation window and include load-generator scheduling lag and server queueing. CPU/request is the server process's exact CPU-time delta divided by successful responses across the full phase. Errors are summed across the 3 repeats. Publication aborts if scheduler-lag P95 exceeds 25 ms or any generator worker exceeds 80% busy in any phase, and each phase waits for the previous phase's client sockets to leave TIME_WAIT before it starts.

| Engine | Request rate (rps) | Window completions/s | Shell P50 | Complete P50 | Complete P95 | Complete P99 | CPU/request | Cores | Peak RSS | Max in-flight | Generator lag P95 | Errors |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Proa | 250 | 250 | 0.26 ms | 91.6 ms | 91.7 ms | 92.1 ms | 0.250 ms | 0.06 | 8.2 MiB | 24 | 0.01 ms | 0 |
| Proa | 500 | 500 | 0.26 ms | 91.4 ms | 91.6 ms | 92.3 ms | 0.248 ms | 0.12 | 9.9 MiB | 47 | 0.01 ms | 0 |
| Proa | 1,000 | 1000 | 0.19 ms | 91.3 ms | 91.5 ms | 92.4 ms | 0.251 ms | 0.25 | 12.2 MiB | 98 | 0.01 ms | 0 |
| Proa | 2,000 | 2000 | 0.24 ms | 91.3 ms | 93.3 ms | 96.3 ms | 0.268 ms | 0.53 | 18.7 MiB | 209 | 1.48 ms | 0 |
| Proa | 3,000 | 3000 | 0.91 ms | 92.2 ms | 103.2 ms | 110.9 ms | 0.287 ms | 0.85 | 25.6 MiB | 336 | 3.80 ms | 0 |
| Proa | 4,000 | 3368 | 33.4 ms | 722.4 ms | 1512.7 ms | 1641.8 ms | 0.287 ms | 0.99 | 227.5 MiB | 3,995 | 7.67 ms | 0 |
| Proa | 5,000 | 3109 | 674.9 ms | 1937.0 ms | 3494.1 ms | 3812.5 ms | 0.293 ms | 1.00 | 483.1 MiB | 11,392 | 5.89 ms | 0 |
| Proa | 6,000 | 3346 | 1327.8 ms | 2886.1 ms | 4764.3 ms | 5225.4 ms | 0.291 ms | 1.00 | 481.5 MiB | 16,592 | 8.29 ms | 0 |
| Marko | 250 | 250 | 0.39 ms | 90.4 ms | 91.2 ms | 92.5 ms | 0.958 ms | 0.24 | 94.0 MiB | 25 | 0.01 ms | 0 |
| Marko | 500 | 500 | 0.40 ms | 90.3 ms | 92.1 ms | 97.1 ms | 0.828 ms | 0.41 | 104.6 MiB | 53 | 0.00 ms | 0 |
| Marko | 1,000 | 1000 | 0.47 ms | 91.2 ms | 97.4 ms | 112.0 ms | 0.754 ms | 0.74 | 141.8 MiB | 130 | 0.01 ms | 0 |
| Marko | 2,000 | 1066 | 2986.5 ms | 3078.7 ms | 5346.4 ms | 6852.8 ms | 0.876 ms | 0.96 | 1899.7 MiB | 6,214 | 0.02 ms | 0 |
| Marko | 3,000 | 1024 | 5386.1 ms | 5386.3 ms | 13069.0 ms | 19720.4 ms | 0.875 ms | 0.71 | 2648.3 MiB | 12,289 | 0.10 ms | 98 |
| Marko | 4,000 | 1048 | 8948.4 ms | 9004.4 ms | 15994.4 ms | 19697.3 ms | 0.867 ms | 0.95 | 3246.8 MiB | 18,171 | 0.46 ms | 0 |
| Marko | 5,000 | 1002 | 10958.0 ms | 11852.2 ms | 18296.8 ms | 23253.3 ms | 0.845 ms | 1.00 | 3762.9 MiB | 24,588 | 0.42 ms | 640 |
| Marko | 6,000 | 1097 | 14483.2 ms | 15065.1 ms | 24041.3 ms | 36432.5 ms | 0.853 ms | 0.83 | 3594.7 MiB | 30,192 | 0.58 ms | 0 |
| React | 250 | 250 | 0.94 ms | 94.8 ms | 100.3 ms | 105.7 ms | 3.513 ms | 0.87 | 96.7 MiB | 34 | 0.01 ms | 0 |
| React | 500 | 261 | 467.7 ms | 2988.7 ms | 4909.1 ms | 4959.2 ms | 3.639 ms | 1.00 | 435.1 MiB | 1,452 | 0.01 ms | 0 |
| React | 1,000 | 256 | 3036.7 ms | 9496.8 ms | 19799.3 ms | 20084.7 ms | 3.699 ms | 0.89 | 697.2 MiB | 4,522 | 0.01 ms | 25 |
| React | 2,000 | 269 | 3134.7 ms | 13641.0 ms | 38817.6 ms | 39172.5 ms | 6.341 ms | 1.00 | 2713.0 MiB | 10,568 | 0.01 ms | 15,338 |
| React | 3,000 | 230 | 20015.1 ms | 30036.3 ms | 70593.4 ms | 71611.1 ms | 5.520 ms | 0.77 | 3628.1 MiB | 16,795 | 0.01 ms | 19,902 |
| React | 4,000 | 215 | 46848.0 ms | 52736.5 ms | 86420.7 ms | 87907.9 ms | 5.189 ms | 0.77 | 3670.8 MiB | 22,927 | 0.01 ms | 24,703 |
| React | 5,000 | 214 | 44834.8 ms | 56728.7 ms | 85074.9 ms | 90785.5 ms | 4.986 ms | 0.67 | 2915.3 MiB | 28,932 | 0.01 ms | 33,766 |
| React | 6,000 | 224 | 57785.0 ms | 65388.7 ms | 104731.2 ms | 106521.7 ms | 5.484 ms | 0.71 | 4877.0 MiB | 34,881 | 0.01 ms | 40,355 |

**Every comparative row uses one logical CPU.** Proa runs one Tokio worker thread, and Marko and React each run one Bun process. Server CPU affinity is 0; the load generator runs separately. Above saturation, completed responses can plateau or decline while queueing and failures increase. This capture does not measure multicore capacity.

**Reference point, outside the comparison.** Proa alone was rerun at the top rate with 4 worker threads. CPU affinity remains 0; this changes thread count within the same CPU budget and does not measure multi-core scaling. Marko and React were not rerun with more processes, so this row is not comparable to theirs. With 4 threads Proa completed 3,476 responses per second at a request-rate target of 6,000 rps and a P99 of 5507.2 ms, using 1.00 cores.

| Proa worker threads | Request rate (rps) | Window completions/s | Complete P50 | Complete P99 | CPU/request | Cores | Peak RSS | Errors |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 4 | 6,000 | 3476 | 2503.9 ms | 5507.2 ms | 0.289 ms | 1.00 | 502.8 MiB | 0 |

The unloaded preflight checks all loading placeholders and resolved panels. Every measured response must contain the shell, all resolved panels, and every product card. Loading placeholders are optional during load: a boundary can resolve before its placeholder is flushed. Any placeholders present must have valid, unique boundary keys. The cards are the same markup the scoreboard's product-grid parity gate accepted from each engine. Wire bytes legitimately differ because each framework carries its own boundary-replacement protocol.

| Engine version | Fallback panels | Resolved panels | Product cards | Stream bytes |
| --- | ---: | ---: | ---: | ---: |
| Proa 0.3.0 @ ceffd9f3 | 8 | 8 | 96 | 387,511 |
| Marko 6.0.150 | 8 | 8 | 96 | 289,888 |
| React 19.2.4 | 8 | 8 | 96 | 292,213 |

- Capture: [benchmarks/streaming/results/latest.json](../../benchmarks/streaming/results/latest.json); reproduce with `bun run bench:suspense-load`.
- The report verifier checks the measured-source SHA-256 against this checkout or the retained source snapshot before generating these tables.
- Proa source: Cargo.lock revision ceffd9f3; Rust release build with native Proa Suspense and the direct `ssr_stream_send` Axum route. The same binary also serves the bounded local-executor path (`ssr_stream`) at `/local` for engineering comparison; it is not part of the published rows.
- Marko source: optimized ahead-of-time Marko template using native &lt;await&gt; plus &lt;@placeholder&gt;; its compiler is not resident in the measured server.
- React source: production Bun React server build using renderToReadableStream, Suspense, and use. The shell pipes immediately; allReady is not awaited.
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
