# HTTP capacity, cold start and streaming

The [Proa versus SvelteKit report](sveltekit.md) includes the production SvelteKit server below and a separate async comparison with browser completion. Its native promise-data stream has a different HTTP completion boundary from the resolved-HTML streams in this page.

One core of each framework's production server serves the same parity-gated pages over loopback HTTP. This page records [sustained capacity and latency at equal load](#canonical-pages-over-http-one-core-each), [cold start to first response](#cold-start-to-first-response), and [Suspense streaming](#suspense-streaming-over-http-one-core-each).

<!-- page-load:start -->
## Canonical pages over HTTP, one core each

> **PROA-only refresh.** Only Proa was rerun on 2026-11-11; peer rows retain their 2026-10-21 capture. Both runs used the same machine and suite protocol; they were not measured together.

**November 11, 2026 · Apple M4 Max · 5 production servers · every response byte-identical to its parity-gated dump**

This is the capacity question behind the scoreboard: the same three parity-gated pages, served over real loopback HTTP/1.1 by each framework's ordinary production server, with every engine limited to one core of work. Proa runs one Tokio worker thread on Axum, React and Marko run one Bun process, and Go runs `GOMAXPROCS=1` on `net/http`. On the product grid, one Proa core sustained 20,863 complete responses per second against 1,614 for React, and spent 0.048 ms of CPU per response against React's 0.635 ms.

Each value is the median of 3 fresh server processes. **Capacity** rows use 64 closed-loop connections issuing requests back to back; throughput counts complete responses inside a fixed 5-second window after a 1-second pre-roll. **CPU per response** is the server process's exact CPU-time delta across all of its threads, including garbage-collector helpers, divided by successful responses. The load generator is 8 separate worker processes that hash every response; a phase is rejected if any worker's event loop exceeds 80% busy.

| Workload | Engine | Sustained responses/s | Proa ÷ engine | CPU per response | Cores used | Peak RSS |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Component page | Proa | 95,454 | 1.00× | 0.010 ms | 0.99 | 8.5 MiB |
| Component page | React | 9,426 | 10.1× | 0.112 ms | 1.04 | 240.8 MiB |
| Component page | Marko | 39,348 | 2.43× | 0.027 ms | 1.04 | 227.4 MiB |
| Component page | Go html/template | 7,407 | 12.9× | 0.135 ms | 1.00 | 19.1 MiB |
| Component page | SvelteKit | 9,693 | 9.85× | 0.122 ms | 1.14 | 392.1 MiB |
| Product grid | Proa | 20,863 | 1.00× | 0.048 ms | 0.99 | 9.6 MiB |
| Product grid | React | 1,614 | 12.9× | 0.635 ms | 1.02 | 312.0 MiB |
| Product grid | Marko | 4,507 | 4.63× | 0.244 ms | 1.09 | 375.5 MiB |
| Product grid | Go html/template | 1,055 | 19.8× | 0.949 ms | 1.00 | 18.3 MiB |
| Product grid | SvelteKit | 1,458 | 14.3× | 0.851 ms | 1.21 | 547.0 MiB |
| 1,000-row table | Proa | 3,351 | 1.00× | 0.298 ms | 1.00 | 70.5 MiB |
| 1,000-row table | React | 189 | 17.7× | 5.413 ms | 1.03 | 442.0 MiB |
| 1,000-row table | Marko | 564 | 5.94× | 1.689 ms | 0.94 | 303.0 MiB |
| 1,000-row table | Go html/template | 69 | 48.4× | 12.425 ms | 0.89 | 20.0 MiB |
| 1,000-row table | SvelteKit | 121 | 27.7× | 8.440 ms | 1.03 | 466.4 MiB |

Translating CPU per response into fleet size: the cores needed to serve 10,000 responses per second of each page, from the measured CPU per response. Real deployments add headroom, but the ratios carry over.

| Workload | Proa | React | Marko | Go html/template | SvelteKit |
| --- | ---: | ---: | ---: | ---: | ---: |
| Component page | 0.1 | 1.1 | 0.3 | 1.3 | 1.2 |
| Product grid | 0.5 | 6.4 | 2.4 | 9.5 | 8.5 |
| 1,000-row table | 3.0 | 54.1 | 16.9 | 124.2 | 84.4 |

**Latency at equal load** uses fixed-rate open-loop arrivals below every engine's knee, so the percentiles compare the same request-rate target rather than each server's own saturation point. Latency is measured from scheduled arrival and includes generator lag.

| Workload | Engine | Request rate (rps) | Complete P50 | Complete P99 | CPU per response | Peak RSS |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Component page | Proa | 2,000 | 0.09 ms | 0.14 ms | 0.025 ms | 5.6 MiB |
| Component page | React | 2,000 | 0.22 ms | 0.29 ms | 0.151 ms | 84.0 MiB |
| Component page | Marko | 2,000 | 0.15 ms | 0.34 ms | 0.078 ms | 194.1 MiB |
| Component page | Go html/template | 2,000 | 0.23 ms | 3.97 ms | 0.187 ms | 18.1 MiB |
| Component page | SvelteKit | 2,000 | 0.27 ms | 0.70 ms | 0.266 ms | 205.7 MiB |
| Product grid | Proa | 500 | 0.21 ms | 0.35 ms | 0.076 ms | 6.8 MiB |
| Product grid | React | 500 | 0.74 ms | 1.04 ms | 0.664 ms | 146.0 MiB |
| Product grid | Marko | 500 | 0.39 ms | 1.02 ms | 0.310 ms | 115.0 MiB |
| Product grid | Go html/template | 500 | 1.05 ms | 1.48 ms | 1.078 ms | 17.6 MiB |
| Product grid | SvelteKit | 500 | 0.96 ms | 1.84 ms | 1.369 ms | 160.6 MiB |
| 1,000-row table | Proa | 50 | 1.07 ms | 2.05 ms | 0.704 ms | 29.5 MiB |
| 1,000-row table | React | 50 | 4.90 ms | 6.24 ms | 4.874 ms | 282.4 MiB |
| 1,000-row table | Marko | 50 | 1.80 ms | 3.89 ms | 1.782 ms | 139.5 MiB |
| 1,000-row table | Go html/template | 50 | 11.2 ms | 12.2 ms | 11.209 ms | 17.7 MiB |
| 1,000-row table | SvelteKit | 50 | 7.53 ms | 8.51 ms | 7.496 ms | 162.8 MiB |

Every measured response was compared byte for byte against the dump the same engine produced through its canonical adapter, which is the dump that passed the scoreboard's browser-DOM parity gate.

| Engine version | Component page bytes | Product grid bytes | 1,000-row table bytes | HTTP responses |
| --- | ---: | ---: | ---: | --- |
| Proa 0.3.0 @ bbbc9684 | 25,108 | 284,908 | 988,509 | byte-identical |
| React 19.2.8 | 25,202 | 285,868 | 990,695 | byte-identical |
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

> **PROA-only refresh.** Only Proa was rerun on 2026-11-11; peer rows retain their 2026-10-21 capture. Both runs used the same machine and suite protocol; they were not measured together.

**November 11, 2026 · Apple M4 Max · 15 fresh processes per engine**

Every autoscaling event, cold serverless instance, per-tenant process, and developer restart pays this cost. Each row spawns the same production server used in the HTTP capacity section, polls its port every millisecond, and stops the clock when the first complete product-grid response ends; that response must be byte-identical to the engine's canonical dump. Proa's first response arrived in 5.11 ms at the median against 50.7 ms for React, whose figure includes Node v24.20.0 start-up and loading React and the page module. Engines rotate every start, 2 untimed starts warm the disk cache, and the RSS column is sampled immediately after the first response.

| Engine | First response P50 | P95 | Max | First byte P50 | RSS after first response |
| --- | ---: | ---: | ---: | ---: | ---: |
| Proa 0.3.0 @ bbbc9684 | 5.11 ms | 11.4 ms | 14.6 ms | 4.92 ms | 4.6 MiB |
| React | 50.7 ms | 60.8 ms | 66.0 ms | 50.6 ms | 76.1 MiB |
| Marko | 43.1 ms | 47.9 ms | 48.6 ms | 43.0 ms | 63.3 MiB |
| Go html/template | 6.27 ms | 8.47 ms | 10.7 ms | 5.33 ms | 12.5 MiB |
| SvelteKit | 55.0 ms | 57.1 ms | 57.3 ms | 54.9 ms | 72.0 MiB |

- Capture: [cold-start/results/latest.json](cold-start/results/latest.json); reproduce with `bun run bench:cold-start`.
- Servers, ports, and per-core limits are the same as the [HTTP capacity section](#canonical-pages-over-http-one-core-each). Wall time includes process creation, runtime start-up, module or binary loading, fixture construction, and the first render.
- Host one-minute load average when the capture started: 6.60 on 16 logical CPUs. Cold start is a few milliseconds of wall time, so it is the measurement most sensitive to other work on the machine; rerun it on an idle host before quoting absolute values.
<!-- cold-start:end -->

[![Median, P95 and slowest time from process spawn to first complete product-grid response for Proa, React, Marko and Go html/template, with RSS after the first response](charts/svg/09-cold-start.svg)](charts/svg/09-cold-start.svg)

*Fifteen fresh processes per engine. The bar is the median, the tick P95, and the hollow endpoint the slowest start. [Full size](charts/svg/09-cold-start.svg) · [how the figures are built](charts/)*

The product grid also streams, which is the subject of [Suspense streaming over HTTP](#suspense-streaming-over-http-one-core-each).

<!-- suspense-load:start -->
## Suspense streaming over HTTP, one core each


**November 10, 2026 · Intel(R) Xeon(R) 6985P-C CPU @ 2.30GHz · 8 async boundaries × 12 product cards · one worker thread or process per engine**

This is the product grid from the capacity section, streamed. Equivalent production-mode Proa, Marko, and React applications run over real loopback HTTP/1.1. Every request streams a shell, starts 8 independent data operations across the 5, 8, 12, 18, 27, 40, 60, 90 ms delay tiers, may stream loading placeholders while those operations are pending, and completes only after every panel has resolved to its 12 product cards on the wire, 96 cards in all. Delayed values stay typed and in memory; there is no JSON serialization, deserialization, or external I/O in the measured request path. Rendering, boundary scheduling, replacement framing, and one flush per boundary are all inside the measurement.

Every engine is limited to one unit of concurrency: Proa runs 1 Tokio worker thread, and Marko and React each run one Bun process. Proa serves this page through `RouteResponse::ssr_stream_send`, the compiler-proved `Send` streaming path introduced by [Proa PR #82](https://github.com/Proa-Labs/proa/pull/82): Axum polls the response stream directly, with no per-response bridge thread. The cores column shows what each process actually used, and CPU/request charges every thread of every engine the same way.

Each row is the median of 3 fresh-process phases under fixed-rate open-loop arrivals from 24 separate load-generator processes, so saturation remains visible as in-flight work and scheduled-arrival latency instead of being suppressed by a client waiting for each prior response. A 1-second pre-roll fills the async pipeline, then successful full responses completed inside a fixed 5-second observation window determine completion throughput. Complete-response percentiles and shell P50 cover requests arriving during that observation window and include load-generator scheduling lag and server queueing. CPU/request is the server process's exact CPU-time delta divided by successful responses across the full phase. Errors are summed across the 3 repeats. Publication aborts if scheduler-lag P95 exceeds 25 ms or any generator worker exceeds 80% busy in any phase, and each phase waits for the previous phase's client sockets to leave TIME_WAIT before it starts.

| Engine | Request rate (rps) | Window completions/s | Shell P50 | Complete P50 | Complete P95 | Complete P99 | CPU/request | Cores | Peak RSS | Max in-flight | Generator lag P95 | Errors |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Proa | 250 | 250 | 0.25 ms | 91.6 ms | 91.8 ms | 92.4 ms | 0.246 ms | 0.06 | 7.8 MiB | 24 | 0.00 ms | 0 |
| Proa | 500 | 500 | 0.20 ms | 91.4 ms | 91.5 ms | 92.0 ms | 0.240 ms | 0.12 | 9.4 MiB | 52 | 0.01 ms | 0 |
| Proa | 1,000 | 1000 | 0.17 ms | 91.2 ms | 91.4 ms | 92.2 ms | 0.247 ms | 0.24 | 12.7 MiB | 105 | 0.01 ms | 0 |
| Proa | 2,000 | 2000 | 0.20 ms | 91.2 ms | 94.3 ms | 101.9 ms | 0.269 ms | 0.53 | 18.3 MiB | 203 | 1.18 ms | 0 |
| Proa | 3,000 | 2998 | 0.77 ms | 91.9 ms | 101.5 ms | 104.7 ms | 0.282 ms | 0.83 | 24.9 MiB | 327 | 3.06 ms | 0 |
| Proa | 4,000 | 3502 | 29.1 ms | 566.1 ms | 1211.2 ms | 1322.2 ms | 0.279 ms | 0.99 | 194.0 MiB | 3,242 | 5.89 ms | 0 |
| Proa | 5,000 | 3300 | 823.2 ms | 1889.5 ms | 3271.0 ms | 3568.2 ms | 0.288 ms | 1.00 | 379.7 MiB | 10,400 | 5.16 ms | 0 |
| Proa | 6,000 | 3340 | 1674.5 ms | 2826.7 ms | 4727.2 ms | 5123.1 ms | 0.290 ms | 1.00 | 384.6 MiB | 16,571 | 6.94 ms | 0 |
| Marko | 250 | 250 | 0.38 ms | 90.4 ms | 91.3 ms | 92.4 ms | 0.945 ms | 0.23 | 90.1 MiB | 25 | 0.01 ms | 0 |
| Marko | 500 | 500 | 0.37 ms | 90.3 ms | 91.9 ms | 94.9 ms | 0.821 ms | 0.40 | 103.9 MiB | 54 | 0.00 ms | 0 |
| Marko | 1,000 | 1000 | 0.37 ms | 91.1 ms | 97.1 ms | 108.4 ms | 0.732 ms | 0.72 | 134.1 MiB | 124 | 0.01 ms | 0 |
| Marko | 2,000 | 1034 | 3002.2 ms | 3190.7 ms | 5222.3 ms | 6769.5 ms | 0.861 ms | 1.00 | 2225.8 MiB | 6,079 | 0.21 ms | 0 |
| Marko | 3,000 | 1068 | 6254.3 ms | 6304.8 ms | 9827.1 ms | 13369.4 ms | 0.850 ms | 0.89 | 2523.6 MiB | 11,941 | 0.28 ms | 0 |
| Marko | 4,000 | 1080 | 8929.7 ms | 8929.7 ms | 13711.7 ms | 14428.2 ms | 0.825 ms | 1.00 | 2701.7 MiB | 17,939 | 0.44 ms | 0 |
| Marko | 5,000 | 1025 | 11732.1 ms | 11732.1 ms | 18362.6 ms | 18729.4 ms | 0.829 ms | 1.00 | 3410.7 MiB | 24,243 | 0.64 ms | 160 |
| Marko | 6,000 | 1107 | 14686.5 ms | 15067.2 ms | 23253.0 ms | 23864.5 ms | 0.830 ms | 1.00 | 3100.7 MiB | 29,993 | 1.51 ms | 0 |
| React | 250 | 250 | 0.85 ms | 94.1 ms | 98.6 ms | 102.6 ms | 3.397 ms | 0.84 | 96.0 MiB | 32 | 0.38 ms | 0 |
| React | 500 | 273 | 462.2 ms | 2778.0 ms | 4411.5 ms | 4619.4 ms | 3.520 ms | 1.00 | 402.5 MiB | 1,380 | 0.01 ms | 0 |
| React | 1,000 | 255 | 2854.9 ms | 9127.1 ms | 16896.9 ms | 19993.0 ms | 3.579 ms | 0.89 | 696.1 MiB | 4,489 | 0.01 ms | 0 |
| React | 2,000 | 285 | 5401.0 ms | 19528.6 ms | 39638.2 ms | 40419.2 ms | 4.437 ms | 1.00 | 2457.7 MiB | 10,539 | 0.01 ms | 7,356 |
| React | 3,000 | 272 | 18413.0 ms | 31564.0 ms | 53814.6 ms | 68651.7 ms | 4.436 ms | 0.89 | 3548.2 MiB | 16,622 | 0.01 ms | 12,477 |
| React | 4,000 | 257 | 37764.8 ms | 48648.5 ms | 71212.0 ms | 72597.3 ms | 4.583 ms | 0.85 | 2841.7 MiB | 22,713 | 0.01 ms | 19,603 |
| React | 5,000 | 265 | 49856.8 ms | 56573.5 ms | 87891.0 ms | 99800.0 ms | 4.556 ms | 0.93 | 2736.0 MiB | 28,674 | 0.01 ms | 24,462 |
| React | 6,000 | 273 | 49589.4 ms | 60942.1 ms | 106453.7 ms | 108841.2 ms | 4.460 ms | 0.84 | 3544.3 MiB | 34,636 | 0.83 ms | 27,662 |

**Every comparative row uses one logical CPU.** Proa runs one Tokio worker thread, and Marko and React each run one Bun process. Server CPU affinity is 2; the load generator runs separately. Above saturation, completed responses can plateau or decline while queueing and failures increase. This capture does not measure multicore capacity.

**Reference point, outside the comparison.** Proa alone was rerun at the top rate with 4 worker threads. CPU affinity remains 2; this changes thread count within the same CPU budget and does not measure multi-core scaling. Marko and React were not rerun with more processes, so this row is not comparable to theirs. With 4 threads Proa completed 3,444 responses per second at a request-rate target of 6,000 rps and a P99 of 5132.7 ms, using 1.00 cores.

| Proa worker threads | Request rate (rps) | Window completions/s | Complete P50 | Complete P99 | CPU/request | Cores | Peak RSS | Errors |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 4 | 6,000 | 3444 | 2608.0 ms | 5132.7 ms | 0.290 ms | 1.00 | 425.4 MiB | 0 |

The unloaded preflight checks all loading placeholders and resolved panels. Every measured response must contain the shell, all resolved panels, and every product card. Loading placeholders are optional during load: a boundary can resolve before its placeholder is flushed. Any placeholders present must have valid, unique boundary keys. The cards are the same markup the scoreboard's product-grid parity gate accepted from each engine. Wire bytes legitimately differ because each framework carries its own boundary-replacement protocol.

| Engine version | Fallback panels | Resolved panels | Product cards | Stream bytes |
| --- | ---: | ---: | ---: | ---: |
| Proa 0.3.0 @ 7ffb8a19 | 8 | 8 | 96 | 387,511 |
| Marko 6.0.150 | 8 | 8 | 96 | 289,888 |
| React 19.2.8 | 8 | 8 | 96 | 292,213 |

- Capture: [suspense-load/results/latest.json](suspense-load/results/latest.json); reproduce with `bun run bench:suspense-load`.
- The report verifier checks the measured-source SHA-256 against this checkout or the retained source snapshot before generating these tables.
- Proa source: Cargo.lock revision 7ffb8a19; Rust release build with native Proa Suspense and the direct `ssr_stream_send` Axum route. The same binary also serves the bounded local-executor path (`ssr_stream`) at `/local` for engineering comparison; it is not part of the published rows.
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
