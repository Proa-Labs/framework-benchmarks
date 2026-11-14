# HTTP capacity, cold start and streaming

The [Proa versus SvelteKit report](sveltekit.md) includes the production SvelteKit server below and a separate async comparison with browser completion. Its native promise-data stream has a different HTTP completion boundary from the resolved-HTML streams in this page.

One core of each framework's production server serves the same parity-gated pages over loopback HTTP. This page records [sustained capacity and latency at equal load](#canonical-pages-over-http-one-core-each), [cold start to first response](#cold-start-to-first-response), and [Suspense streaming](#suspense-streaming-over-http-one-core-each).

<!-- page-load:start -->
## Canonical pages over HTTP, one core each


**November 14, 2026 · Intel(R) Xeon(R) 6985P-C CPU @ 2.30GHz · 5 production servers · every response byte-identical to its parity-gated dump**

This is the capacity question behind the scoreboard: the same three parity-gated pages, served over real loopback HTTP/1.1 by each framework's ordinary production server, with every engine limited to one core of work. Proa runs one Tokio worker thread on Axum, React and Marko run one Bun process, and Go runs `GOMAXPROCS=1` on `net/http`. On the product grid, one Proa core sustained 16,400 complete responses per second against 1,353 for React, and spent 0.065 ms of CPU per response against React's 0.758 ms.

Each value is the median of 3 fresh server processes. **Capacity** rows use 64 closed-loop connections issuing requests back to back; throughput counts complete responses inside a fixed 5-second window after a 1-second pre-roll. **CPU per response** is the server process's exact CPU-time delta across all of its threads, including garbage-collector helpers, divided by successful responses. The load generator is 24 separate worker processes that hash every response; a phase is rejected if any worker's event loop exceeds 80% busy.

| Workload | Engine | Sustained responses/s | Proa ÷ engine | CPU per response | Cores used | Peak RSS |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Component page | Proa | 91,742 | 1.00× | 0.011 ms | 1.00 | 8.6 MiB |
| Component page | React | 6,609 | 13.9× | 0.158 ms | 1.00 | 96.5 MiB |
| Component page | Marko | 32,092 | 2.86× | 0.033 ms | 1.00 | 87.3 MiB |
| Component page | Go html/template | 5,482 | 16.7× | 0.182 ms | 1.00 | 16.3 MiB |
| Component page | SvelteKit | 6,333 | 14.5× | 0.171 ms | 1.00 | 116.8 MiB |
| Product grid | Proa | 16,400 | 1.00× | 0.065 ms | 1.00 | 9.1 MiB |
| Product grid | React | 1,353 | 12.1× | 0.758 ms | 1.00 | 112.1 MiB |
| Product grid | Marko | 4,386 | 3.74× | 0.232 ms | 1.00 | 119.2 MiB |
| Product grid | Go html/template | 771 | 21.3× | 1.299 ms | 1.00 | 15.7 MiB |
| Product grid | SvelteKit | 1,168 | 14.0× | 0.903 ms | 1.00 | 285.9 MiB |
| 1,000-row table | Proa | 1,732 | 1.00× | 0.607 ms | 1.00 | 10.5 MiB |
| 1,000-row table | React | 125 | 13.9× | 8.045 ms | 1.00 | 162.6 MiB |
| 1,000-row table | Marko | 449 | 3.86× | 2.275 ms | 1.00 | 115.7 MiB |
| 1,000-row table | Go html/template | 64 | 27.2× | 15.933 ms | 1.00 | 16.5 MiB |
| 1,000-row table | SvelteKit | 179 | 9.68× | 5.757 ms | 1.00 | 636.0 MiB |

Translating CPU per response into fleet size: the cores needed to serve 10,000 responses per second of each page, from the measured CPU per response. Real deployments add headroom, but the ratios carry over.

| Workload | Proa | React | Marko | Go html/template | SvelteKit |
| --- | ---: | ---: | ---: | ---: | ---: |
| Component page | 0.1 | 1.6 | 0.3 | 1.8 | 1.7 |
| Product grid | 0.6 | 7.6 | 2.3 | 13.0 | 9.0 |
| 1,000-row table | 6.1 | 80.5 | 22.7 | 159.3 | 57.6 |

**Latency at equal load** uses fixed-rate open-loop arrivals below every engine's knee, so the percentiles compare the same request-rate target rather than each server's own saturation point. Latency is measured from scheduled arrival and includes generator lag.

| Workload | Engine | Request rate (rps) | Complete P50 | Complete P99 | CPU per response | Peak RSS |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Component page | Proa | 2,000 | 0.12 ms | 0.39 ms | 0.022 ms | 7.3 MiB |
| Component page | React | 2,000 | 0.23 ms | 6.38 ms | 0.207 ms | 89.6 MiB |
| Component page | Marko | 2,000 | 0.13 ms | 1.38 ms | 0.075 ms | 63.4 MiB |
| Component page | Go html/template | 2,000 | 0.24 ms | 0.79 ms | 0.195 ms | 15.1 MiB |
| Component page | SvelteKit | 2,000 | 0.25 ms | 21.7 ms | 0.253 ms | 101.0 MiB |
| Product grid | Proa | 500 | 0.34 ms | 0.91 ms | 0.119 ms | 7.8 MiB |
| Product grid | React | 500 | 0.91 ms | 2.50 ms | 0.853 ms | 107.0 MiB |
| Product grid | Marko | 500 | 0.42 ms | 0.99 ms | 0.288 ms | 77.6 MiB |
| Product grid | Go html/template | 500 | 1.31 ms | 2.05 ms | 1.306 ms | 15.1 MiB |
| Product grid | SvelteKit | 500 | 0.91 ms | 11.9 ms | 0.914 ms | 112.4 MiB |
| 1,000-row table | Proa | 50 | 1.72 ms | 2.34 ms | 0.848 ms | 9.2 MiB |
| 1,000-row table | React | 50 | 7.37 ms | 14.9 ms | 8.007 ms | 137.5 MiB |
| 1,000-row table | Marko | 50 | 2.81 ms | 4.50 ms | 2.553 ms | 85.3 MiB |
| 1,000-row table | Go html/template | 50 | 16.3 ms | 18.0 ms | 16.205 ms | 15.4 MiB |
| 1,000-row table | SvelteKit | 50 | 5.31 ms | 13.1 ms | 5.799 ms | 156.5 MiB |

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


**November 14, 2026 · Intel(R) Xeon(R) 6985P-C CPU @ 2.30GHz · 15 fresh processes per engine**

Every autoscaling event, cold serverless instance, per-tenant process, and developer restart pays this cost. Each row spawns the same production server used in the HTTP capacity section, polls its port every millisecond, and stops the clock when the first complete product-grid response ends; that response must be byte-identical to the engine's canonical dump. Proa's first response arrived in 6.92 ms at the median against 51.0 ms for React, whose figure includes Bun 1.4.2 start-up and loading React and the page module. Engines rotate every start, 2 untimed starts warm the disk cache, and the RSS column is sampled immediately after the first response.

| Engine | First response P50 | P95 | Max | First byte P50 | RSS after first response |
| --- | ---: | ---: | ---: | ---: | ---: |
| Proa 0.3.0 @ ceffd9f3 | 6.92 ms | 9.44 ms | 11.4 ms | 6.68 ms | 6.3 MiB |
| React | 51.0 ms | 55.5 ms | 55.6 ms | 50.9 ms | 58.0 MiB |
| Marko | 34.6 ms | 38.6 ms | 40.1 ms | 34.4 ms | 40.2 MiB |
| Go html/template | 9.17 ms | 11.1 ms | 11.4 ms | 7.91 ms | 9.8 MiB |
| SvelteKit | 57.7 ms | 62.3 ms | 62.8 ms | 57.4 ms | 51.0 MiB |

- Capture: [benchmarks/cold-start/results/latest.json](../../benchmarks/cold-start/results/latest.json); reproduce with `bun run bench:cold-start`.
- Servers, ports, and per-core limits are the same as the [HTTP capacity section](#canonical-pages-over-http-one-core-each). Wall time includes process creation, runtime start-up, module or binary loading, fixture construction, and the first render.
- Host one-minute load average when the capture started: 8.29 on 16 logical CPUs. Cold start is a few milliseconds of wall time, so it is the measurement most sensitive to other work on the machine; rerun it on an idle host before quoting absolute values.
<!-- cold-start:end -->

[![Median, P95 and slowest time from process spawn to first complete product-grid response for Proa, React, Marko and Go html/template, with RSS after the first response](../figures/09-cold-start.svg)](../figures/09-cold-start.svg)

*Fifteen fresh processes per engine. The bar is the median, the tick P95, and the hollow endpoint the slowest start. [Full size](../figures/09-cold-start.svg) · [how the figures are built](../../tooling/charts/)*

The product grid also streams, which is the subject of [Suspense streaming over HTTP](#suspense-streaming-over-http-one-core-each).

<!-- suspense-load:start -->
## Suspense streaming over HTTP, one core each


**November 14, 2026 · Intel(R) Xeon(R) 6985P-C CPU @ 2.30GHz · 8 async boundaries × 12 product cards · one worker thread or process per engine**

This is the product grid from the capacity section, streamed. Equivalent production-mode Proa, Marko, and React applications run over real loopback HTTP/1.1. Every request streams a shell, starts 8 independent data operations across the 5, 8, 12, 18, 27, 40, 60, 90 ms delay tiers, may stream loading placeholders while those operations are pending, and completes only after every panel has resolved to its 12 product cards on the wire, 96 cards in all. Delayed values stay typed and in memory; there is no JSON serialization, deserialization, or external I/O in the measured request path. Rendering, boundary scheduling, replacement framing, and one flush per boundary are all inside the measurement.

Every engine is limited to one unit of concurrency: Proa runs 1 Tokio worker thread, and Marko and React each run one Bun process. Proa serves this page through `RouteResponse::ssr_stream_send`, the compiler-proved `Send` streaming path introduced by [Proa PR #82](https://github.com/Proa-Labs/proa/pull/82): Axum polls the response stream directly, with no per-response bridge thread. The cores column shows what each process actually used, and CPU/request charges every thread of every engine the same way.

Each row is the median of 3 fresh-process phases under fixed-rate open-loop arrivals from 32 separate load-generator processes, so saturation remains visible as in-flight work and scheduled-arrival latency instead of being suppressed by a client waiting for each prior response. A 1-second pre-roll fills the async pipeline, then successful full responses completed inside a fixed 5-second observation window determine completion throughput. Complete-response percentiles and shell P50 cover requests arriving during that observation window and include load-generator scheduling lag and server queueing. CPU/request is the server process's exact CPU-time delta divided by successful responses across the full phase. Errors are summed across the 3 repeats. Publication aborts if scheduler-lag P95 exceeds 25 ms or any generator worker exceeds 80% busy in any phase, and each phase waits for the previous phase's client sockets to leave TIME_WAIT before it starts.

| Engine | Request rate (rps) | Window completions/s | Shell P50 | Complete P50 | Complete P95 | Complete P99 | CPU/request | Cores | Peak RSS | Max in-flight | Generator lag P95 | Errors |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Proa | 250 | 250 | 0.28 ms | 91.7 ms | 91.7 ms | 92.3 ms | 0.242 ms | 0.06 | 8.2 MiB | 24 | 0.01 ms | 0 |
| Proa | 500 | 500 | 0.24 ms | 91.4 ms | 91.5 ms | 92.2 ms | 0.231 ms | 0.11 | 9.9 MiB | 47 | 0.01 ms | 0 |
| Proa | 1,000 | 1000 | 0.20 ms | 91.3 ms | 91.4 ms | 92.3 ms | 0.235 ms | 0.23 | 12.1 MiB | 98 | 0.01 ms | 0 |
| Proa | 2,000 | 2000 | 0.20 ms | 91.2 ms | 92.8 ms | 95.7 ms | 0.253 ms | 0.50 | 18.6 MiB | 205 | 1.21 ms | 0 |
| Proa | 3,000 | 3000 | 0.66 ms | 91.7 ms | 101.5 ms | 103.6 ms | 0.264 ms | 0.78 | 25.1 MiB | 318 | 3.21 ms | 0 |
| Proa | 4,000 | 3660 | 30.4 ms | 388.4 ms | 867.4 ms | 976.5 ms | 0.270 ms | 0.99 | 137.7 MiB | 2,395 | 8.90 ms | 0 |
| Proa | 5,000 | 3481 | 505.8 ms | 1515.1 ms | 2904.2 ms | 3121.5 ms | 0.273 ms | 1.00 | 465.5 MiB | 9,322 | 8.05 ms | 0 |
| Proa | 6,000 | 3495 | 1163.6 ms | 2576.2 ms | 4280.6 ms | 4541.1 ms | 0.275 ms | 1.00 | 492.1 MiB | 15,353 | 8.33 ms | 0 |
| Marko | 250 | 250 | 0.39 ms | 90.4 ms | 91.2 ms | 92.4 ms | 0.914 ms | 0.23 | 91.5 MiB | 25 | 0.01 ms | 0 |
| Marko | 500 | 500 | 0.38 ms | 90.3 ms | 91.5 ms | 93.4 ms | 0.770 ms | 0.38 | 103.8 MiB | 49 | 0.00 ms | 0 |
| Marko | 1,000 | 1000 | 0.34 ms | 90.9 ms | 96.1 ms | 105.7 ms | 0.698 ms | 0.69 | 132.2 MiB | 123 | 0.01 ms | 0 |
| Marko | 2,000 | 1151 | 2581.0 ms | 2615.1 ms | 4146.8 ms | 4715.6 ms | 0.820 ms | 1.00 | 1839.1 MiB | 5,558 | 0.03 ms | 0 |
| Marko | 3,000 | 1169 | 5054.4 ms | 5147.8 ms | 11486.4 ms | 12096.6 ms | 0.827 ms | 0.71 | 2429.4 MiB | 11,900 | 0.14 ms | 0 |
| Marko | 4,000 | 991 | 8644.6 ms | 8731.7 ms | 12970.0 ms | 19688.3 ms | 0.816 ms | 0.88 | 3268.3 MiB | 18,347 | 0.45 ms | 0 |
| Marko | 5,000 | 1060 | 10934.5 ms | 10952.6 ms | 17003.0 ms | 21296.1 ms | 0.818 ms | 0.65 | 3517.0 MiB | 24,028 | 0.39 ms | 863 |
| Marko | 6,000 | 1077 | 13746.1 ms | 13752.3 ms | 21864.1 ms | 22092.0 ms | 0.797 ms | 1.00 | 4539.9 MiB | 30,006 | 0.51 ms | 615 |
| React | 250 | 250 | 0.77 ms | 93.5 ms | 97.2 ms | 99.8 ms | 3.285 ms | 0.81 | 91.6 MiB | 30 | 0.01 ms | 0 |
| React | 500 | 291 | 444.6 ms | 2683.8 ms | 4037.8 ms | 4093.1 ms | 3.342 ms | 1.00 | 359.7 MiB | 1,276 | 0.01 ms | 0 |
| React | 1,000 | 279 | 2527.1 ms | 8637.5 ms | 14733.3 ms | 14986.6 ms | 3.418 ms | 0.94 | 690.2 MiB | 4,376 | 0.01 ms | 0 |
| React | 2,000 | 229 | 3061.9 ms | 12559.0 ms | 29640.1 ms | 30029.2 ms | 5.802 ms | 1.00 | 2807.0 MiB | 10,666 | 0.01 ms | 13,830 |
| React | 3,000 | 321 | 21065.8 ms | 29525.6 ms | 70352.3 ms | 72654.1 ms | 4.051 ms | 0.44 | 3025.4 MiB | 16,395 | 0.01 ms | 11,417 |
| React | 4,000 | 292 | 26038.1 ms | 38588.0 ms | 73671.4 ms | 75481.6 ms | 4.102 ms | 0.55 | 3261.7 MiB | 22,542 | 0.01 ms | 19,661 |
| React | 5,000 | 251 | 45050.4 ms | 53939.2 ms | 85005.9 ms | 96757.8 ms | 4.162 ms | 0.67 | 3358.9 MiB | 28,744 | 0.01 ms | 24,889 |
| React | 6,000 | 246 | 56464.9 ms | 59793.2 ms | 90879.8 ms | 95750.8 ms | 4.539 ms | 0.65 | 4362.9 MiB | 34,769 | 0.01 ms | 36,576 |

**Every comparative row uses one logical CPU.** Proa runs one Tokio worker thread, and Marko and React each run one Bun process. Server CPU affinity is 0; the load generator runs separately. Above saturation, completed responses can plateau or decline while queueing and failures increase. This capture does not measure multicore capacity.

**Reference point, outside the comparison.** Proa alone was rerun at the top rate with 4 worker threads. CPU affinity remains 0; this changes thread count within the same CPU budget and does not measure multi-core scaling. Marko and React were not rerun with more processes, so this row is not comparable to theirs. With 4 threads Proa completed 3,625 responses per second at a request-rate target of 6,000 rps and a P99 of 4980.1 ms, using 0.99 cores.

| Proa worker threads | Request rate (rps) | Window completions/s | Complete P50 | Complete P99 | CPU/request | Cores | Peak RSS | Errors |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 4 | 6,000 | 3625 | 2185.6 ms | 4980.1 ms | 0.275 ms | 0.99 | 511.7 MiB | 0 |

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
