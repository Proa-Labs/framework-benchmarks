# HTTP capacity, cold start and streaming

The [Proa versus SvelteKit report](sveltekit.md) includes the production SvelteKit server below and a separate async comparison with browser completion. Its native promise-data stream has a different HTTP completion boundary from the resolved-HTML streams in this page.

One core of each framework's production server serves the same parity-gated pages over loopback HTTP. This page records [sustained capacity and latency at equal load](#canonical-pages-over-http-one-core-each), [cold start to first response](#cold-start-to-first-response), and [Suspense streaming](#suspense-streaming-over-http-one-core-each).

<!-- page-load:start -->
## Canonical pages over HTTP, one core each


**November 15, 2026 · Intel(R) Xeon(R) 6985P-C CPU @ 2.30GHz · 5 production servers · every response byte-identical to its parity-gated dump**

This is the capacity question behind the scoreboard: the same three parity-gated pages, served over real loopback HTTP/1.1 by each framework's ordinary production server, with every engine limited to one core of work. Proa runs one Tokio worker thread on Axum, React and Marko run one Bun process, and Go runs `GOMAXPROCS=1` on `net/http`. On the product grid, one Proa core sustained 16,428 complete responses per second against 1,261 for React, and spent 0.061 ms of CPU per response against React's 0.816 ms.

Each value is the median of 3 fresh server processes. **Capacity** rows use 64 closed-loop connections issuing requests back to back; throughput counts complete responses inside a fixed 5-second window after a 1-second pre-roll. **CPU per response** is the server process's exact CPU-time delta across all of its threads, including garbage-collector helpers, divided by successful responses. The load generator is 24 separate worker processes that hash every response; a phase is rejected if any worker's event loop exceeds 80% busy.

| Workload | Engine | Sustained responses/s | Proa ÷ engine | CPU per response | Cores used | Peak RSS |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Component page | Proa | 87,579 | 1.00× | 0.011 ms | 1.00 | 8.7 MiB |
| Component page | React | 6,061 | 14.5× | 0.173 ms | 1.00 | 96.1 MiB |
| Component page | Marko | 30,148 | 2.90× | 0.035 ms | 1.00 | 88.1 MiB |
| Component page | Go html/template | 5,093 | 17.2× | 0.196 ms | 1.00 | 16.2 MiB |
| Component page | SvelteKit | 5,394 | 16.2× | 0.201 ms | 1.00 | 112.5 MiB |
| Product grid | Proa | 16,428 | 1.00× | 0.061 ms | 1.00 | 9.2 MiB |
| Product grid | React | 1,261 | 13.0× | 0.816 ms | 1.00 | 112.0 MiB |
| Product grid | Marko | 4,111 | 4.00× | 0.249 ms | 1.00 | 116.1 MiB |
| Product grid | Go html/template | 736 | 22.3× | 1.357 ms | 1.00 | 15.7 MiB |
| Product grid | SvelteKit | 1,042 | 15.8× | 1.010 ms | 1.00 | 300.2 MiB |
| 1,000-row table | Proa | 2,552 | 1.00× | 0.392 ms | 1.00 | 10.5 MiB |
| 1,000-row table | React | 116 | 22.0× | 8.674 ms | 1.00 | 160.1 MiB |
| 1,000-row table | Marko | 422 | 6.05× | 2.409 ms | 1.00 | 118.5 MiB |
| 1,000-row table | Go html/template | 62 | 41.0× | 16.590 ms | 1.00 | 16.5 MiB |
| 1,000-row table | SvelteKit | 162 | 15.8× | 6.332 ms | 1.00 | 588.9 MiB |

Translating CPU per response into fleet size: the cores needed to serve 10,000 responses per second of each page, from the measured CPU per response. Real deployments add headroom, but the ratios carry over.

| Workload | Proa | React | Marko | Go html/template | SvelteKit |
| --- | ---: | ---: | ---: | ---: | ---: |
| Component page | 0.1 | 1.7 | 0.4 | 2.0 | 2.0 |
| Product grid | 0.6 | 8.2 | 2.5 | 13.6 | 10.1 |
| 1,000-row table | 3.9 | 86.7 | 24.1 | 165.9 | 63.3 |

**Latency at equal load** uses fixed-rate open-loop arrivals below every engine's knee, so the percentiles compare the same request-rate target rather than each server's own saturation point. Latency is measured from scheduled arrival and includes generator lag.

| Workload | Engine | Request rate (rps) | Complete P50 | Complete P99 | CPU per response | Peak RSS |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Component page | Proa | 2,000 | 0.12 ms | 0.64 ms | 0.022 ms | 7.3 MiB |
| Component page | React | 2,000 | 0.25 ms | 16.8 ms | 0.221 ms | 94.7 MiB |
| Component page | Marko | 2,000 | 0.14 ms | 1.77 ms | 0.085 ms | 63.2 MiB |
| Component page | Go html/template | 2,000 | 0.25 ms | 0.87 ms | 0.203 ms | 15.1 MiB |
| Component page | SvelteKit | 2,000 | 0.28 ms | 27.9 ms | 0.282 ms | 119.2 MiB |
| Product grid | Proa | 500 | 0.36 ms | 1.01 ms | 0.068 ms | 7.9 MiB |
| Product grid | React | 500 | 0.98 ms | 3.10 ms | 0.900 ms | 106.7 MiB |
| Product grid | Marko | 500 | 0.48 ms | 1.21 ms | 0.316 ms | 73.9 MiB |
| Product grid | Go html/template | 500 | 1.38 ms | 2.18 ms | 1.357 ms | 15.2 MiB |
| Product grid | SvelteKit | 500 | 1.00 ms | 18.1 ms | 0.984 ms | 118.1 MiB |
| 1,000-row table | Proa | 50 | 1.58 ms | 2.16 ms | 0.423 ms | 9.2 MiB |
| 1,000-row table | React | 50 | 8.67 ms | 15.9 ms | 8.890 ms | 137.8 MiB |
| 1,000-row table | Marko | 50 | 3.23 ms | 5.74 ms | 2.853 ms | 89.5 MiB |
| 1,000-row table | Go html/template | 50 | 17.1 ms | 22.4 ms | 16.899 ms | 15.5 MiB |
| 1,000-row table | SvelteKit | 50 | 5.59 ms | 17.4 ms | 6.188 ms | 171.6 MiB |

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


**November 15, 2026 · Intel(R) Xeon(R) 6985P-C CPU @ 2.30GHz · 15 fresh processes per engine**

Every autoscaling event, cold serverless instance, per-tenant process, and developer restart pays this cost. Each row spawns the same production server used in the HTTP capacity section, polls its port every millisecond, and stops the clock when the first complete product-grid response ends; that response must be byte-identical to the engine's canonical dump. Proa's first response arrived in 5.74 ms at the median against 49.3 ms for React, whose figure includes Bun 1.4.2 start-up and loading React and the page module. Engines rotate every start, 2 untimed starts warm the disk cache, and the RSS column is sampled immediately after the first response.

| Engine | First response P50 | P95 | Max | First byte P50 | RSS after first response |
| --- | ---: | ---: | ---: | ---: | ---: |
| Proa 0.3.0 @ 367cc10a | 5.74 ms | 7.71 ms | 7.89 ms | 5.54 ms | 6.2 MiB |
| React | 49.3 ms | 55.6 ms | 56.2 ms | 49.0 ms | 57.4 MiB |
| Marko | 35.0 ms | 38.7 ms | 38.8 ms | 34.8 ms | 40.0 MiB |
| Go html/template | 10.3 ms | 11.7 ms | 12.5 ms | 9.10 ms | 9.9 MiB |
| SvelteKit | 55.7 ms | 60.6 ms | 62.6 ms | 55.5 ms | 50.9 MiB |

- Capture: [benchmarks/cold-start/results/latest.json](../../benchmarks/cold-start/results/latest.json); reproduce with `bun run bench:cold-start`.
- Servers, ports, and per-core limits are the same as the [HTTP capacity section](#canonical-pages-over-http-one-core-each). Wall time includes process creation, runtime start-up, module or binary loading, fixture construction, and the first render.
- Host one-minute load average when the capture started: 6.08 on 16 logical CPUs. Cold start is a few milliseconds of wall time, so it is the measurement most sensitive to other work on the machine; rerun it on an idle host before quoting absolute values.
<!-- cold-start:end -->

[![Median, P95 and slowest time from process spawn to first complete product-grid response for Proa, React, Marko and Go html/template, with RSS after the first response](../figures/09-cold-start.svg)](../figures/09-cold-start.svg)

*Fifteen fresh processes per engine. The bar is the median, the tick P95, and the hollow endpoint the slowest start. [Full size](../figures/09-cold-start.svg) · [how the figures are built](../../tooling/charts/)*

The product grid also streams, which is the subject of [Suspense streaming over HTTP](#suspense-streaming-over-http-one-core-each).

<!-- suspense-load:start -->
## Suspense streaming over HTTP, one core each


**November 15, 2026 · Intel(R) Xeon(R) 6985P-C CPU @ 2.30GHz · 8 async boundaries × 12 product cards · one worker thread or process per engine**

This is the product grid from the capacity section, streamed. Equivalent production-mode Proa, Marko, and React applications run over real loopback HTTP/1.1. Every request streams a shell, starts 8 independent data operations across the 5, 8, 12, 18, 27, 40, 60, 90 ms delay tiers, may stream loading placeholders while those operations are pending, and completes only after every panel has resolved to its 12 product cards on the wire, 96 cards in all. Delayed values stay typed and in memory; there is no JSON serialization, deserialization, or external I/O in the measured request path. Rendering, boundary scheduling, replacement framing, and one flush per boundary are all inside the measurement.

Every engine is limited to one unit of concurrency: Proa runs 1 Tokio worker thread, and Marko and React each run one Bun process. Proa serves this page through `RouteResponse::ssr_stream_send`, the compiler-proved `Send` streaming path introduced by [Proa PR #82](https://github.com/Proa-Labs/proa/pull/82): Axum polls the response stream directly, with no per-response bridge thread. The cores column shows what each process actually used, and CPU/request charges every thread of every engine the same way.

Each row is the median of 3 fresh-process phases under fixed-rate open-loop arrivals from 32 separate load-generator processes, so saturation remains visible as in-flight work and scheduled-arrival latency instead of being suppressed by a client waiting for each prior response. A 1-second pre-roll fills the async pipeline, then successful full responses completed inside a fixed 5-second observation window determine completion throughput. Complete-response percentiles and shell P50 cover requests arriving during that observation window and include load-generator scheduling lag and server queueing. CPU/request is the server process's exact CPU-time delta divided by successful responses across the full phase. Errors are summed across the 3 repeats. Publication aborts if scheduler-lag P95 exceeds 25 ms or any generator worker exceeds 80% busy in any phase, and each phase waits for the previous phase's client sockets to leave TIME_WAIT before it starts.

| Engine | Request rate (rps) | Window completions/s | Shell P50 | Complete P50 | Complete P95 | Complete P99 | CPU/request | Cores | Peak RSS | Max in-flight | Generator lag P95 | Errors |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Proa | 250 | 250 | 0.36 ms | 91.7 ms | 91.9 ms | 92.4 ms | 0.253 ms | 0.06 | 8.5 MiB | 24 | 0.01 ms | 0 |
| Proa | 500 | 500 | 0.32 ms | 91.5 ms | 91.6 ms | 92.4 ms | 0.256 ms | 0.13 | 9.8 MiB | 47 | 0.01 ms | 0 |
| Proa | 1,000 | 1000 | 0.20 ms | 91.3 ms | 91.5 ms | 92.4 ms | 0.250 ms | 0.25 | 12.1 MiB | 98 | 0.01 ms | 0 |
| Proa | 2,000 | 2000 | 0.26 ms | 91.3 ms | 93.6 ms | 96.7 ms | 0.268 ms | 0.53 | 18.5 MiB | 210 | 1.31 ms | 0 |
| Proa | 3,000 | 3001 | 0.85 ms | 92.0 ms | 102.8 ms | 108.8 ms | 0.274 ms | 0.81 | 25.1 MiB | 330 | 3.96 ms | 0 |
| Proa | 4,000 | 3690 | 31.0 ms | 398.6 ms | 754.6 ms | 835.0 ms | 0.270 ms | 0.99 | 134.5 MiB | 2,292 | 10.0 ms | 0 |
| Proa | 5,000 | 3371 | 529.5 ms | 1722.9 ms | 3258.6 ms | 3421.6 ms | 0.279 ms | 1.00 | 483.1 MiB | 10,443 | 6.68 ms | 0 |
| Proa | 6,000 | 3523 | 1288.3 ms | 2630.2 ms | 4195.8 ms | 4596.3 ms | 0.275 ms | 1.00 | 490.8 MiB | 15,470 | 9.54 ms | 0 |
| Marko | 250 | 250 | 0.52 ms | 90.5 ms | 91.7 ms | 93.1 ms | 1.061 ms | 0.26 | 95.4 MiB | 27 | 0.01 ms | 0 |
| Marko | 500 | 500 | 0.50 ms | 90.4 ms | 92.7 ms | 99.0 ms | 0.926 ms | 0.46 | 103.8 MiB | 55 | 0.01 ms | 0 |
| Marko | 1,000 | 1001 | 1.23 ms | 92.7 ms | 103.1 ms | 113.5 ms | 0.840 ms | 0.83 | 157.6 MiB | 140 | 0.18 ms | 0 |
| Marko | 2,000 | 1068 | 3260.0 ms | 3686.6 ms | 6401.3 ms | 7302.6 ms | 0.917 ms | 0.93 | 1898.5 MiB | 6,069 | 0.06 ms | 0 |
| Marko | 3,000 | 1013 | 5338.9 ms | 6039.2 ms | 11874.0 ms | 19762.8 ms | 0.881 ms | 0.74 | 3170.2 MiB | 12,548 | 0.20 ms | 38 |
| Marko | 4,000 | 1033 | 8709.3 ms | 8727.9 ms | 16062.8 ms | 19905.6 ms | 0.851 ms | 0.92 | 3637.3 MiB | 18,205 | 0.49 ms | 79 |
| Marko | 5,000 | 995 | 10554.5 ms | 11058.6 ms | 18040.5 ms | 23141.9 ms | 0.851 ms | 0.68 | 3535.0 MiB | 24,455 | 0.31 ms | 213 |
| Marko | 6,000 | 1068 | 14290.4 ms | 14290.4 ms | 23275.8 ms | 36335.0 ms | 0.836 ms | 0.81 | 4206.2 MiB | 30,253 | 0.61 ms | 136 |
| React | 250 | 250 | 1.36 ms | 96.4 ms | 104.2 ms | 109.0 ms | 3.669 ms | 0.90 | 102.0 MiB | 42 | 0.01 ms | 0 |
| React | 500 | 248 | 558.2 ms | 3476.0 ms | 5377.2 ms | 5409.3 ms | 3.780 ms | 1.00 | 426.4 MiB | 1,526 | 0.01 ms | 0 |
| React | 1,000 | 251 | 2561.5 ms | 9805.9 ms | 19717.5 ms | 20078.1 ms | 3.770 ms | 0.91 | 733.2 MiB | 4,563 | 0.01 ms | 0 |
| React | 2,000 | 194 | 1126.2 ms | 11788.9 ms | 31153.1 ms | 31499.0 ms | 6.886 ms | 1.00 | 2734.2 MiB | 10,918 | 0.01 ms | 16,359 |
| React | 3,000 | 183 | 22385.7 ms | 33741.7 ms | 60503.6 ms | 84005.1 ms | 4.887 ms | 0.64 | 4570.9 MiB | 16,901 | 0.00 ms | 16,418 |
| React | 4,000 | 235 | 38162.9 ms | 51635.4 ms | 84607.7 ms | 86305.3 ms | 4.819 ms | 0.52 | 3563.2 MiB | 22,828 | 0.01 ms | 25,849 |
| React | 5,000 | 228 | 36663.4 ms | 50282.1 ms | 77696.3 ms | 88399.0 ms | 4.991 ms | 0.59 | 3289.1 MiB | 28,861 | 0.01 ms | 30,057 |
| React | 6,000 | 232 | 51137.4 ms | 60684.1 ms | 98964.8 ms | 103827.5 ms | 4.902 ms | 0.71 | 4100.4 MiB | 34,841 | 0.01 ms | 35,535 |

**Every comparative row uses one logical CPU.** Proa runs one Tokio worker thread, and Marko and React each run one Bun process. Server CPU affinity is 0; the load generator runs separately. Above saturation, completed responses can plateau or decline while queueing and failures increase. This capture does not measure multicore capacity.

**Reference point, outside the comparison.** Proa alone was rerun at the top rate with 4 worker threads. CPU affinity remains 0; this changes thread count within the same CPU budget and does not measure multi-core scaling. Marko and React were not rerun with more processes, so this row is not comparable to theirs. With 4 threads Proa completed 3,625 responses per second at a request-rate target of 6,000 rps and a P99 of 4840.7 ms, using 0.99 cores.

| Proa worker threads | Request rate (rps) | Window completions/s | Complete P50 | Complete P99 | CPU/request | Cores | Peak RSS | Errors |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 4 | 6,000 | 3625 | 2142.6 ms | 4840.7 ms | 0.271 ms | 0.99 | 496.4 MiB | 0 |

The unloaded preflight checks all loading placeholders and resolved panels. Every measured response must contain the shell, all resolved panels, and every product card. Loading placeholders are optional during load: a boundary can resolve before its placeholder is flushed. Any placeholders present must have valid, unique boundary keys. The cards are the same markup the scoreboard's product-grid parity gate accepted from each engine. Wire bytes legitimately differ because each framework carries its own boundary-replacement protocol.

| Engine version | Fallback panels | Resolved panels | Product cards | Stream bytes |
| --- | ---: | ---: | ---: | ---: |
| Proa 0.3.0 @ 367cc10a | 8 | 8 | 96 | 387,511 |
| Marko 6.0.150 | 8 | 8 | 96 | 289,888 |
| React 19.2.4 | 8 | 8 | 96 | 292,213 |

- Capture: [benchmarks/streaming/results/latest.json](../../benchmarks/streaming/results/latest.json); reproduce with `bun run bench:suspense-load`.
- The report verifier checks the measured-source SHA-256 against this checkout or the retained source snapshot before generating these tables.
- Proa source: Cargo.lock revision 367cc10a; Rust release build with native Proa Suspense and the direct `ssr_stream_send` Axum route. The same binary also serves the bounded local-executor path (`ssr_stream`) at `/local` for engineering comparison; it is not part of the published rows.
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
