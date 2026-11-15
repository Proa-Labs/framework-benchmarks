# Canonical scoreboard evidence

Seventeen renderers turn the same prepared data into the same three pages, and the scoreboard times only that render. This page holds the [current result](#current-result), the [renderer coverage](#renderer-coverage), and the [complete canonical evidence](#complete-canonical-evidence) behind the [front page](../../README.md)'s figures.

## Current result

<!-- canonical-scoreboard:start -->

**November 15, 2026 · Intel(R) Xeon(R) 6985P-C CPU @ 2.30GHz · linux**

On these workloads, the November 15, 2026 capture on Intel(R) Xeon(R) 6985P-C CPU @ 2.30GHz measured Proa rendering the component page 90.2× faster than React, the 1,000-row table 57.1× faster than React, and the product grid 44.5× faster than React. These ratios describe this capture, not every application.

> Lower is better. Strict rows pass unchanged DOM/class parity. Exact† uses an explicitly adapted fixture with equivalent content and native styles; its HTML differs. See [adaptation details](../../benchmarks/rendering/external/exact/README.md).

Each cell is `P50 render time · relative to Proa`.

| Renderer | Component page | 1,000-row table | Product grid | Airbnb landing page | Nike catalog | GitHub PR review | Sentry logs | ESPN game page |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Proa | 0.001 ms · 1.00× | 0.18 ms · 1.00× | 0.010 ms · 1.00× | 0.009 ms · 1.00× | 0.011 ms · 1.00× | 0.097 ms · 1.00× | 0.30 ms · 1.00× | 0.004 ms · 1.00× |
| Marko | 0.010 ms · 10.7× | 1.44 ms · 7.91× | 0.11 ms · 11.5× | 0.18 ms · 19.9× | 0.22 ms · 20.1× | 5.17 ms · 53.5× | 10.9 ms · 36.8× | 0.099 ms · 22.4× |
| React | 0.087 ms · 90.2× | 10.4 ms · 57.1× | 0.44 ms · 44.5× | 0.55 ms · 61.4× | 0.61 ms · 54.4× | 3.21 ms · 33.2× | 10.3 ms · 34.6× | 0.26 ms · 59.0× |
| Vue | 0.010 ms · 9.95× | 1.61 ms · 8.84× | 0.094 ms · 9.48× | 0.096 ms · 10.7× | 0.13 ms · 11.3× | 1.05 ms · 10.9× | 3.11 ms · 10.5× | 0.060 ms · 13.5× |
| Svelte | 0.009 ms · 9.28× | 1.66 ms · 9.13× | 0.094 ms · 9.47× | 0.099 ms · 11.1× | 0.13 ms · 11.9× | 0.80 ms · 8.25× | 3.12 ms · 10.5× | 0.073 ms · 16.5× |
| Rails | 0.078 ms · 80.9× | 9.12 ms · 50.1× | 0.46 ms · 46.0× | 0.62 ms · 69.6× | 0.88 ms · 78.9× | 5.33 ms · 55.2× | 12.1 ms · 40.9× | 0.32 ms · 71.7× |
| jte | 0.015 ms · 15.2× | 6.80 ms · 37.3× | 0.63 ms · 63.6× | 0.14 ms · 15.8× | 0.38 ms · 34.1× | 1.63 ms · 16.8× | 5.18 ms · 17.5× | 0.081 ms · 18.2× |
| Rocker | 0.036 ms · 37.5× | 10.7 ms · 58.5× | 0.76 ms · 76.6× | 0.51 ms · 57.7× | 0.65 ms · 58.3× | 5.74 ms · 59.4× | 5.54 ms · 18.7× | 0.29 ms · 65.7× |
| Handlebars | 0.029 ms · 29.5× | 4.21 ms · 23.1× | 0.25 ms · 24.8× | 0.49 ms · 55.1× | 1.09 ms · 97.8× | 17.8 ms · 184× | 14.6 ms · 49.3× | 0.36 ms · 82.0× |
| Go html/template | 0.14 ms · 146× | 14.2 ms · 78.0× | 1.16 ms · 116× | 2.62 ms · 294× | 5.19 ms · 464× | 32.1 ms · 332× | 69.6 ms · 235× | 1.31 ms · 294× |
| Jinja2 | 0.11 ms · 109× | 19.2 ms · 106× | 1.42 ms · 143× | 0.99 ms · 111× | 1.84 ms · 164× | 11.1 ms · 115× | 24.7 ms · 83.3× | 0.56 ms · 126× |
| PHP | 0.033 ms · 34.1× | 1.77 ms · 9.73× | 0.095 ms · 9.51× | 0.45 ms · 50.6× | 0.40 ms · 35.9× | 2.85 ms · 29.5× | 6.00 ms · 20.2× | 0.28 ms · 62.4× |
| Askama | 0.001 ms · 1.27× | 0.73 ms · 4.01× | 0.024 ms · 2.37× | 0.018 ms · 2.05× | 0.034 ms · 2.99× | 0.21 ms · 2.20× | 0.42 ms · 1.42× | 0.007 ms · 1.60× |
| Sailfish | 0.002 ms · 1.93× | 0.61 ms · 3.35× | 0.023 ms · 2.31× | 0.011 ms · 1.20× | 0.016 ms · 1.39× | 0.11 ms · 1.17× | 0.27 ms · 0.90× | 0.005 ms · 1.02× |
| Leptos | 0.018 ms · 18.5× | 1.67 ms · 9.18× | 0.21 ms · 21.3× | 0.10 ms · 11.7× | 0.19 ms · 17.1× | 0.91 ms · 9.43× | 1.45 ms · 4.87× | 0.036 ms · 8.10× |
| Dioxus | 0.16 ms · 168× | 3.49 ms · 19.2× | 0.41 ms · 41.2× | 0.91 ms · 102× | 2.31 ms · 207× | 17.3 ms · 179× | 23.7 ms · 79.9× | 0.59 ms · 134× |
| Topcoat | 0.016 ms · 16.8× | 1.46 ms · 8.03× | 0.20 ms · 19.8× | 0.34 ms · 37.8× | 0.50 ms · 44.7× | 2.68 ms · 27.7× | 4.55 ms · 15.3× | 0.13 ms · 29.3× |
| Astro | 0.050 ms · 52.0× | 2.85 ms · 15.6× | 0.29 ms · 29.2× | 0.61 ms · 68.6× | 0.76 ms · 68.1× | 5.06 ms · 52.4× | 17.2 ms · 58.2× | 0.32 ms · 73.1× |
| SvelteKit | 0.011 ms · 11.7× | 1.60 ms · 8.78× | 0.093 ms · 9.29× | 0.087 ms · 9.77× | 0.14 ms · 12.9× | 0.79 ms · 8.13× | 3.31 ms · 11.2× | 0.053 ms · 11.9× |
| Next.js | 0.075 ms · 77.8× | 5.25 ms · 28.8× | 0.42 ms · 42.7× | 0.61 ms · 68.0× | 0.66 ms · 58.6× | 4.06 ms · 42.0× | 12.2 ms · 41.2× | 0.30 ms · 66.6× |
| Exact† | 5.58 ms · 5761× | 150 ms · 821× | 17.5 ms · 1758× | 60.9 ms · 6826× | 100 ms · 8950× | 452 ms · 4679× | 1437 ms · 4846× | 43.9 ms · 9881× |

Rows use the fixed order in [the canonical roster](../../benchmarks/rendering/canonical/roster.json); columns are never ranked independently.
<!-- canonical-scoreboard:end -->

### How to read the scoreboard

- **Two kinds of renderer share the table.** Proa, React, Vue, Svelte, Marko, Leptos, Dioxus, and Topcoat are component frameworks with a component model and, in most cases, streaming and client interactivity. Askama, Sailfish, jte, Rocker, Handlebars, Go `html/template`, Jinja2, PHP, and Rails Action View are template engines. In the PROA-only refresh, Proa has the lowest P50 on all three workloads, including against the retained Askama and Sailfish rows. Peer results retain their original capture date.
- **Contrary cells stay.** The refreshed Proa row leads Askama and Sailfish on all three P50s; their original measurements remain in the table. Both emit a 44,849-byte component page against Proa's 25,108 bytes because their templates keep authored whitespace. The semantic DOM is identical, and the byte counts are in the detailed table.
- **Ratios are per capture.** The multiples describe this machine and these three pages. The [HTTP captures](http-capacity.md) translate them into per-core capacity, which is the portable number.

### The three workloads

| Workload | Fixed shape |
| --- | --- |
| Component page | 4 sections, 32 cards, and 160 feature-list items |
| 1,000-row table | 12 columns with escaping, formatting, branches, and variable-length lists |
| Product grid | 96 product cards and 480 SVG stars |

The same deterministic input objects feed every adapter, and input and template construction happen before timing.

### Fairness rules

- Each listed renderer implements all three workloads and uses one pinned canonical runtime.
- Production or release builds return one complete, independently owned response per measured render.
- Routing, middleware, databases, HTTP transfer, hydration, and network latency are outside the scoreboard measurement; the HTTP sections state what they add back.
- Every adapter must pass the shared browser-DOM parity gate before any timing starts.
- Serializer metadata may differ where unavoidable; the detailed report records payload differences and exact-byte matches.

### Reading the adapters

Each renderer's page is real code in this repository, written the way its documentation recommends. Judge fairness by reading the product-grid implementations side by side:

| Renderer | Product grid source | HTTP server |
| --- | --- | --- |
| Proa | [`benchmarks/rendering/src/topcoat_product_grid.rs`](../../benchmarks/rendering/src/topcoat_product_grid.rs) | [`benchmarks/rendering/src/bin/proa_page_server.rs`](../../benchmarks/rendering/src/bin/proa_page_server.rs) |
| React | [`benchmarks/rendering/external/react/suite_components.mjs`](../../benchmarks/rendering/external/react/suite_components.mjs) | [`benchmarks/http/react_server.mjs`](../../benchmarks/http/react_server.mjs) |
| Marko | [`benchmarks/rendering/external/marko/suite_products.marko`](../../benchmarks/rendering/external/marko/suite_products.marko) | [`benchmarks/rendering/external/marko/page_server.mjs`](../../benchmarks/rendering/external/marko/page_server.mjs) |
| Go html/template | [`benchmarks/rendering/external/go/suite_bench.go`](../../benchmarks/rendering/external/go/suite_bench.go) | same file, `--serve` |
| Rails, jte, Rocker, Handlebars, Jinja2, PHP | [`benchmarks/rendering/external/`](../../benchmarks/rendering/external/) | scoreboard only |
| Askama, Sailfish, Leptos, Dioxus, Topcoat | [`benchmarks/rendering/src/`](../../benchmarks/rendering/src/) | scoreboard only |

The Proa product card is an ordinary typed component, and the React card is the same markup as `createElement` calls. Both are what a team would write, and both produce the same DOM:

```rust filename="benchmarks/rendering/src/topcoat_product_grid.rs"
impl<B: WriteBuf, L: DataLoader> WebRenderSync<L, B> for ProaProductCard<'_> {
    fn render(self, cx: &mut WebContext<L, B>) -> Result<(), WriteError> {
        let product = self.product;
        html_sync! {
            <a href={ProductUrl(product.id)} class="group flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
                <div class="mb-4 flex h-32 items-center justify-center rounded-lg bg-slate-100 text-3xl font-bold text-slate-300">{text(&product.category)}</div>
                <p class="text-xs font-medium uppercase tracking-wide text-slate-400">{text(&product.category)}</p>
                <h3 class="mt-1 text-sm font-semibold text-slate-900 group-hover:text-indigo-600">{text(&product.name)}</h3>
                <div class="mt-2 flex items-center gap-1">
                    {ProaRatingStars(product.rating_tenths)}
                    <span class="text-xs text-slate-500">{Rating(product.rating_tenths)}" ("{product.review_count}")"</span>
                </div>
                <p class="mt-3 text-lg font-bold">{Price(product.price_cents)}</p>
            </a>
        }
        .render(cx)
    }
}
```

[Renderer coverage](#renderer-coverage) records which renderers are in the roster and which cells passed.

## Renderer coverage

<!-- canonical-coverage:start -->
| Renderer | Status | Detail |
| --- | --- | --- |
| Proa | Included | All 8 workloads passed parity in this capture. |
| Marko | Included | All 8 workloads passed parity in this capture. |
| React | Included | All 8 workloads passed parity in this capture. |
| Vue | Included | All 8 workloads passed parity in this capture. |
| Svelte | Included | All 8 workloads passed parity in this capture. |
| Rails | Included | All 8 workloads passed parity in this capture. |
| jte | Included | All 8 workloads passed parity in this capture. |
| Rocker | Included | All 8 workloads passed parity in this capture. |
| Handlebars | Included | All 8 workloads passed parity in this capture. |
| Go html/template | Included | All 8 workloads passed parity in this capture. |
| Jinja2 | Included | All 8 workloads passed parity in this capture. |
| PHP | Included | All 8 workloads passed parity in this capture. |
| Askama | Included | All 8 workloads passed parity in this capture. |
| Sailfish | Included | All 8 workloads passed parity in this capture. |
| Leptos | Included | All 8 workloads passed parity in this capture. |
| Dioxus | Included | All 8 workloads passed parity in this capture. |
| Topcoat | Included | All 8 workloads passed parity in this capture. |
| Astro | Included | All 8 workloads passed parity in this capture. |
| SvelteKit | Included | All 8 workloads passed parity in this capture. |
| Next.js | Included | All 8 workloads passed parity in this capture. |
| Exact | Included | All 8 adapted workloads passed content and style checks; HTML differs. See the Exact adaptation notes. |
<!-- canonical-coverage:end -->

Every retained percentile, payload, digest, version, and limitation follows in [Complete canonical evidence](#complete-canonical-evidence).

## Complete canonical evidence

The scoreboard's own result JSON generates this section.

[![P50 to P95 range for every renderer and workload in the canonical capture](../figures/02-canonical-tail-dispersion.svg)](../figures/02-canonical-tail-dispersion.svg)

*Median against tail. A long bar is an unstable renderer, not a slow one; Marko's 1,000-row table is the capture's single flagged cell at 14.5× its own median. Drawn from [Detailed measurements](#detailed-measurements) · [Full size](../figures/02-canonical-tail-dispersion.svg) · [how the figures are built](../../tooling/charts/)*

<!-- canonical-details:start -->
### Capture metadata

- Capture: `canonical-ssr-v1-2026-11-15T22-15-04-069Z-ea202576`
- Captured: 2026-11-15T22:15:04.069Z
- Completed: 2026-11-15T22:53:45.011Z
- Host: Intel(R) Xeon(R) 6985P-C CPU @ 2.30GHz, 16 logical CPUs, 63200768000 bytes RAM
- OS: linux (6.12.105+), x64
- Proa output: Fresh owned RenderBuffer per iteration. Allocation and rendering are timed; flattening/copying, encoding, parity, hashing and output destruction are outside the render timer.
- Harness commit: `3b4453f04f36d15828f06a5cbcebbeda9c4e8374`
- Canonical source SHA-256: `84acf1e0193c742e0987575034d50e2ac46c0253a76f0aabae090c43244519ad`

### Detailed measurements

| Renderer | Workload | P50 | P95 | P99 | Mean | Process P50 range | Processes | Samples/process | Warmups/process | Payload bytes | Payload Δ vs Proa | Parity |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Proa | Component page | 0.968 µs | 0.991 µs | 1.016 µs | 0.983 µs | 0.960 µs–0.974 µs | 5 | 2000 | 200 | 25,108 | +0 | semantic DOM pass |
| Proa | 1,000-row table | 182.187 µs | 200.183 µs | 206.422 µs | 185.643 µs | 181.897 µs–182.518 µs | 5 | 200 | 20 | 988,509 | +0 | semantic DOM pass |
| Proa | Product grid | 9.957 µs | 10.139 µs | 14.133 µs | 10.096 µs | 9.891 µs–10.003 µs | 5 | 500 | 50 | 284,908 | +0 | semantic DOM pass |
| Proa | Airbnb landing page | 8.921 µs | 9.466 µs | 10.389 µs | 9.020 µs | 8.569 µs–9.710 µs | 5 | 200 | 20 | 117,176 | +0 | shared showcase DOM/CSS pass |
| Proa | Nike catalog | 11.192 µs | 11.591 µs | 12.436 µs | 11.326 µs | 11.160 µs–11.254 µs | 5 | 200 | 20 | 127,711 | +0 | shared showcase DOM/CSS pass |
| Proa | GitHub PR review | 96.657 µs | 116.504 µs | 125.599 µs | 98.676 µs | 94.915 µs–106.450 µs | 5 | 100 | 10 | 597,831 | +0 | shared showcase DOM/CSS pass |
| Proa | Sentry logs | 296.591 µs | 346.885 µs | 352.735 µs | 303.820 µs | 225.332 µs–340.149 µs | 5 | 50 | 5 | 875,860 | +0 | shared showcase DOM/CSS pass |
| Proa | ESPN game page | 4.440 µs | 4.725 µs | 5.903 µs | 4.548 µs | 4.274 µs–4.500 µs | 5 | 200 | 20 | 32,846 | +0 | shared showcase DOM/CSS pass |
| Marko | Component page | 10.405 µs | 24.245 µs | 36.173 µs | 25.513 µs | 9.904 µs–10.579 µs | 5 | 2000 | 200 | 24,038 | -1,070 | semantic DOM pass |
| Marko | 1,000-row table | 1.442 ms | 4.518 ms | 7.869 ms | 2.045 ms | 1.388 ms–1.448 ms | 5 | 200 | 20 | 983,187 | -5,322 | semantic DOM pass |
| Marko | Product grid | 114.207 µs | 193.423 µs | 3.193 ms | 203.385 µs | 108.953 µs–115.520 µs | 5 | 500 | 50 | 282,604 | -2,304 | semantic DOM pass |
| Marko | Airbnb landing page | 177.657 µs | 3.313 ms | 6.472 ms | 555.865 µs | 152.365 µs–182.159 µs | 5 | 200 | 20 | 114,155 | -3,021 | shared showcase DOM/CSS pass |
| Marko | Nike catalog | 224.631 µs | 3.720 ms | 6.494 ms | 680.357 µs | 215.668 µs–249.413 µs | 5 | 200 | 20 | 121,831 | -5,880 | shared showcase DOM/CSS pass |
| Marko | GitHub PR review | 5.166 ms | 14.468 ms | 38.798 ms | 6.872 ms | 5.032 ms–5.205 ms | 5 | 100 | 10 | 577,769 | -20,062 | shared showcase DOM/CSS pass |
| Marko | Sentry logs | 10.914 ms | 17.591 ms | 89.224 ms | 14.356 ms | 10.558 ms–11.647 ms | 5 | 50 | 5 | 866,496 | -9,364 | shared showcase DOM/CSS pass |
| Marko | ESPN game page | 99.316 µs | 247.189 µs | 6.235 ms | 317.428 µs | 97.862 µs–105.215 µs | 5 | 200 | 20 | 32,321 | -525 | shared showcase DOM/CSS pass |
| React | Component page | 87.303 µs | 639.952 µs | 3.332 ms | 218.108 µs | 82.776 µs–95.181 µs | 5 | 2000 | 200 | 25,202 | +94 | semantic DOM pass |
| React | 1,000-row table | 10.399 ms | 19.216 ms | 29.526 ms | 10.314 ms | 8.752 ms–10.927 ms | 5 | 200 | 20 | 990,695 | +2,186 | semantic DOM pass |
| React | Product grid | 442.810 µs | 3.063 ms | 11.867 ms | 1.160 ms | 438.235 µs–447.119 µs | 5 | 500 | 50 | 285,868 | +960 | semantic DOM pass |
| React | Airbnb landing page | 547.314 µs | 5.816 ms | 26.954 ms | 2.070 ms | 534.891 µs–576.564 µs | 5 | 200 | 20 | 117,862 | +686 | shared showcase DOM/CSS pass |
| React | Nike catalog | 608.485 µs | 6.863 ms | 31.428 ms | 2.240 ms | 595.015 µs–639.281 µs | 5 | 200 | 20 | 128,853 | +1,142 | shared showcase DOM/CSS pass |
| React | GitHub PR review | 3.211 ms | 17.257 ms | 44.210 ms | 6.661 ms | 3.081 ms–4.030 ms | 5 | 100 | 10 | 601,633 | +3,802 | shared showcase DOM/CSS pass |
| React | Sentry logs | 10.255 ms | 41.917 ms | 79.564 ms | 17.863 ms | 9.286 ms–11.391 ms | 5 | 50 | 5 | 875,888 | +28 | shared showcase DOM/CSS pass |
| React | ESPN game page | 262.172 µs | 4.431 ms | 7.616 ms | 978.218 µs | 238.285 µs–277.356 µs | 5 | 200 | 20 | 33,334 | +488 | shared showcase DOM/CSS pass |
| Vue | Component page | 9.629 µs | 22.690 µs | 40.967 µs | 29.065 µs | 9.427 µs–10.477 µs | 5 | 2000 | 200 | 25,700 | +592 | semantic DOM pass |
| Vue | 1,000-row table | 1.610 ms | 4.991 ms | 9.572 ms | 2.415 ms | 1.562 ms–1.653 ms | 5 | 200 | 20 | 1,006,523 | +18,014 | semantic DOM pass |
| Vue | Product grid | 94.392 µs | 364.634 µs | 5.110 ms | 281.918 µs | 89.748 µs–115.933 µs | 5 | 500 | 50 | 287,420 | +2,512 | semantic DOM pass |
| Vue | Airbnb landing page | 95.839 µs | 196.833 µs | 6.331 ms | 314.741 µs | 95.539 µs–97.555 µs | 5 | 200 | 20 | 120,269 | +3,093 | shared showcase DOM/CSS pass |
| Vue | Nike catalog | 126.166 µs | 1.772 ms | 6.194 ms | 486.831 µs | 119.210 µs–144.197 µs | 5 | 200 | 20 | 154,091 | +26,380 | shared showcase DOM/CSS pass |
| Vue | GitHub PR review | 1.051 ms | 15.826 ms | 72.693 ms | 6.918 ms | 1.035 ms–1.342 ms | 5 | 100 | 10 | 855,405 | +257,574 | shared showcase DOM/CSS pass |
| Vue | Sentry logs | 3.106 ms | 10.213 ms | 15.394 ms | 4.639 ms | 2.781 ms–4.153 ms | 5 | 50 | 5 | 1,053,797 | +177,937 | shared showcase DOM/CSS pass |
| Vue | ESPN game page | 59.822 µs | 116.083 µs | 6.155 ms | 198.834 µs | 58.305 µs–61.483 µs | 5 | 200 | 20 | 36,340 | +3,494 | shared showcase DOM/CSS pass |
| Svelte | Component page | 8.982 µs | 25.900 µs | 42.759 µs | 24.486 µs | 8.630 µs–9.311 µs | 5 | 2000 | 200 | 25,748 | +640 | semantic DOM pass |
| Svelte | 1,000-row table | 1.663 ms | 4.741 ms | 7.455 ms | 2.231 ms | 1.503 ms–1.692 ms | 5 | 200 | 20 | 1,003,227 | +14,718 | semantic DOM pass |
| Svelte | Product grid | 94.340 µs | 186.778 µs | 3.140 ms | 225.894 µs | 92.528 µs–98.744 µs | 5 | 500 | 50 | 286,476 | +1,568 | semantic DOM pass |
| Svelte | Airbnb landing page | 99.047 µs | 234.812 µs | 3.944 ms | 283.433 µs | 79.224 µs–110.769 µs | 5 | 200 | 20 | 119,765 | +2,589 | shared showcase DOM/CSS pass |
| Svelte | Nike catalog | 132.931 µs | 773.833 µs | 3.725 ms | 282.471 µs | 128.380 µs–138.919 µs | 5 | 200 | 20 | 147,241 | +19,530 | shared showcase DOM/CSS pass |
| Svelte | GitHub PR review | 797.000 µs | 5.012 ms | 7.272 ms | 1.656 ms | 762.707 µs–819.667 µs | 5 | 100 | 10 | 675,234 | +77,403 | shared showcase DOM/CSS pass |
| Svelte | Sentry logs | 3.124 ms | 7.022 ms | 9.901 ms | 3.676 ms | 2.643 ms–3.291 ms | 5 | 50 | 5 | 1,118,535 | +242,675 | shared showcase DOM/CSS pass |
| Svelte | ESPN game page | 73.281 µs | 132.842 µs | 5.407 ms | 194.161 µs | 58.867 µs–77.495 µs | 5 | 200 | 20 | 36,180 | +3,334 | shared showcase DOM/CSS pass |
| Rails | Component page | 78.353 µs | 105.947 µs | 463.139 µs | 89.695 µs | 77.112 µs–82.504 µs | 5 | 2000 | 200 | 35,839 | +10,731 | semantic DOM pass |
| Rails | 1,000-row table | 9.123 ms | 9.581 ms | 9.675 ms | 8.917 ms | 8.783 ms–9.156 ms | 5 | 200 | 20 | 1,228,793 | +240,284 | semantic DOM pass |
| Rails | Product grid | 457.890 µs | 786.180 µs | 1.966 ms | 532.300 µs | 456.885 µs–466.996 µs | 5 | 500 | 50 | 296,823 | +11,915 | semantic DOM pass |
| Rails | Airbnb landing page | 620.750 µs | 903.234 µs | 1.587 ms | 681.381 µs | 620.639 µs–627.545 µs | 5 | 200 | 20 | 117,812 | +636 | shared showcase DOM/CSS pass |
| Rails | Nike catalog | 883.588 µs | 1.110 ms | 1.634 ms | 941.489 µs | 881.041 µs–897.631 µs | 5 | 200 | 20 | 128,143 | +432 | shared showcase DOM/CSS pass |
| Rails | GitHub PR review | 5.334 ms | 6.182 ms | 6.404 ms | 5.463 ms | 5.244 ms–5.475 ms | 5 | 100 | 10 | 601,500 | +3,669 | shared showcase DOM/CSS pass |
| Rails | Sentry logs | 12.133 ms | 12.916 ms | 14.447 ms | 12.272 ms | 12.014 ms–12.576 ms | 5 | 50 | 5 | 875,884 | +24 | shared showcase DOM/CSS pass |
| Rails | ESPN game page | 318.488 µs | 376.766 µs | 1.167 ms | 363.235 µs | 314.906 µs–325.563 µs | 5 | 200 | 20 | 32,857 | +11 | shared showcase DOM/CSS pass |
| jte | Component page | 14.716 µs | 21.622 µs | 51.750 µs | 37.319 µs | 13.601 µs–22.125 µs | 5 | 2000 | 200 | 25,109 | +1 | semantic DOM pass |
| jte | 1,000-row table | 6.796 ms | 16.849 ms | 27.476 ms | 8.450 ms | 6.161 ms–7.400 ms | 5 | 200 | 20 | 988,510 | +1 | semantic DOM pass |
| jte | Product grid | 632.809 µs | 3.743 ms | 4.469 ms | 1.247 ms | 628.866 µs–657.638 µs | 5 | 500 | 50 | 284,909 | +1 | semantic DOM pass |
| jte | Airbnb landing page | 140.986 µs | 2.495 ms | 5.239 ms | 414.903 µs | 139.363 µs–144.533 µs | 5 | 200 | 20 | 117,812 | +636 | shared showcase DOM/CSS pass |
| jte | Nike catalog | 381.913 µs | 3.441 ms | 4.438 ms | 830.534 µs | 265.110 µs–732.167 µs | 5 | 200 | 20 | 127,753 | +42 | shared showcase DOM/CSS pass |
| jte | GitHub PR review | 1.626 ms | 7.827 ms | 8.785 ms | 3.705 ms | 1.508 ms–2.114 ms | 5 | 100 | 10 | 598,870 | +1,039 | shared showcase DOM/CSS pass |
| jte | Sentry logs | 5.183 ms | 8.200 ms | 9.307 ms | 5.316 ms | 5.082 ms–5.508 ms | 5 | 50 | 5 | 875,884 | +24 | shared showcase DOM/CSS pass |
| jte | ESPN game page | 80.781 µs | 193.211 µs | 6.140 ms | 249.531 µs | 76.389 µs–83.029 µs | 5 | 200 | 20 | 32,853 | +7 | shared showcase DOM/CSS pass |
| Rocker | Component page | 36.342 µs | 44.002 µs | 3.055 ms | 77.528 µs | 36.069 µs–36.813 µs | 5 | 2000 | 200 | 25,109 | +1 | semantic DOM pass |
| Rocker | 1,000-row table | 10.652 ms | 23.330 ms | 36.855 ms | 10.796 ms | 8.234 ms–10.669 ms | 5 | 200 | 20 | 990,508 | +1,999 | semantic DOM pass |
| Rocker | Product grid | 762.850 µs | 4.153 ms | 5.025 ms | 1.590 ms | 659.709 µs–844.846 µs | 5 | 500 | 50 | 285,869 | +961 | semantic DOM pass |
| Rocker | Airbnb landing page | 514.765 µs | 4.566 ms | 6.255 ms | 1.176 ms | 500.977 µs–525.179 µs | 5 | 200 | 20 | 117,812 | +636 | shared showcase DOM/CSS pass |
| Rocker | Nike catalog | 652.369 µs | 4.236 ms | 5.514 ms | 1.215 ms | 639.502 µs–776.619 µs | 5 | 200 | 20 | 128,143 | +432 | shared showcase DOM/CSS pass |
| Rocker | GitHub PR review | 5.744 ms | 11.265 ms | 13.742 ms | 6.074 ms | 5.341 ms–5.973 ms | 5 | 100 | 10 | 601,500 | +3,669 | shared showcase DOM/CSS pass |
| Rocker | Sentry logs | 5.540 ms | 17.452 ms | 20.008 ms | 7.718 ms | 5.474 ms–6.374 ms | 5 | 50 | 5 | 875,884 | +24 | shared showcase DOM/CSS pass |
| Rocker | ESPN game page | 291.856 µs | 4.331 ms | 6.297 ms | 808.577 µs | 284.872 µs–317.321 µs | 5 | 200 | 20 | 32,857 | +11 | shared showcase DOM/CSS pass |
| Handlebars | Component page | 28.561 µs | 46.342 µs | 185.149 µs | 51.813 µs | 28.427 µs–31.344 µs | 5 | 2000 | 200 | 25,108 | +0 | semantic DOM pass |
| Handlebars | 1,000-row table | 4.206 ms | 6.361 ms | 13.918 ms | 4.843 ms | 4.158 ms–4.554 ms | 5 | 200 | 20 | 990,694 | +2,185 | semantic DOM pass |
| Handlebars | Product grid | 246.859 µs | 606.300 µs | 3.338 ms | 440.547 µs | 211.608 µs–256.101 µs | 5 | 500 | 50 | 285,868 | +960 | semantic DOM pass |
| Handlebars | Airbnb landing page | 491.118 µs | 3.468 ms | 4.550 ms | 808.616 µs | 487.341 µs–505.016 µs | 5 | 200 | 20 | 117,822 | +646 | shared showcase DOM/CSS pass |
| Handlebars | Nike catalog | 1.095 ms | 4.246 ms | 9.077 ms | 1.743 ms | 1.016 ms–1.117 ms | 5 | 200 | 20 | 128,247 | +536 | shared showcase DOM/CSS pass |
| Handlebars | GitHub PR review | 17.802 ms | 38.248 ms | 55.308 ms | 20.093 ms | 17.432 ms–17.903 ms | 5 | 100 | 10 | 602,885 | +5,054 | shared showcase DOM/CSS pass |
| Handlebars | Sentry logs | 14.634 ms | 46.978 ms | 53.780 ms | 19.825 ms | 14.199 ms–15.788 ms | 5 | 50 | 5 | 875,899 | +39 | shared showcase DOM/CSS pass |
| Handlebars | ESPN game page | 364.103 µs | 2.234 ms | 4.505 ms | 609.591 µs | 355.959 µs–388.679 µs | 5 | 200 | 20 | 32,868 | +22 | shared showcase DOM/CSS pass |
| Go html/template | Component page | 140.948 µs | 222.497 µs | 233.996 µs | 160.713 µs | 140.862 µs–141.150 µs | 5 | 2000 | 200 | 25,108 | +0 | semantic DOM pass |
| Go html/template | 1,000-row table | 14.214 ms | 14.650 ms | 15.131 ms | 14.250 ms | 14.163 ms–14.236 ms | 5 | 200 | 20 | 990,509 | +2,000 | semantic DOM pass |
| Go html/template | Product grid | 1.156 ms | 1.208 ms | 1.281 ms | 1.156 ms | 1.153 ms–1.158 ms | 5 | 500 | 50 | 285,676 | +768 | semantic DOM pass |
| Go html/template | Airbnb landing page | 2.621 ms | 3.125 ms | 3.218 ms | 2.627 ms | 2.585 ms–2.639 ms | 5 | 200 | 20 | 117,812 | +636 | shared showcase DOM/CSS pass |
| Go html/template | Nike catalog | 5.189 ms | 5.520 ms | 5.604 ms | 5.155 ms | 5.179 ms–5.203 ms | 5 | 200 | 20 | 129,559 | +1,848 | shared showcase DOM/CSS pass |
| Go html/template | GitHub PR review | 32.116 ms | 33.795 ms | 33.989 ms | 32.152 ms | 32.009 ms–32.387 ms | 5 | 100 | 10 | 605,634 | +7,803 | shared showcase DOM/CSS pass |
| Go html/template | Sentry logs | 69.628 ms | 71.735 ms | 72.412 ms | 69.718 ms | 69.342 ms–69.789 ms | 5 | 50 | 5 | 875,884 | +24 | shared showcase DOM/CSS pass |
| Go html/template | ESPN game page | 1.306 ms | 1.864 ms | 1.915 ms | 1.387 ms | 1.278 ms–1.314 ms | 5 | 200 | 20 | 32,857 | +11 | shared showcase DOM/CSS pass |
| Jinja2 | Component page | 105.136 µs | 111.616 µs | 115.586 µs | 106.732 µs | 103.926 µs–106.131 µs | 5 | 2000 | 200 | 25,108 | +0 | semantic DOM pass |
| Jinja2 | 1,000-row table | 19.250 ms | 21.237 ms | 22.860 ms | 19.410 ms | 18.966 ms–19.331 ms | 5 | 200 | 20 | 990,257 | +1,748 | semantic DOM pass |
| Jinja2 | Product grid | 1.423 ms | 1.448 ms | 1.481 ms | 1.423 ms | 1.405 ms–1.456 ms | 5 | 500 | 50 | 285,676 | +768 | semantic DOM pass |
| Jinja2 | Airbnb landing page | 991.984 µs | 1.043 ms | 1.053 ms | 996.381 µs | 986.527 µs–1.019 ms | 5 | 200 | 20 | 117,812 | +636 | shared showcase DOM/CSS pass |
| Jinja2 | Nike catalog | 1.841 ms | 1.902 ms | 1.927 ms | 1.844 ms | 1.794 ms–1.852 ms | 5 | 200 | 20 | 128,133 | +422 | shared showcase DOM/CSS pass |
| Jinja2 | GitHub PR review | 11.147 ms | 11.896 ms | 15.961 ms | 11.383 ms | 11.123 ms–11.382 ms | 5 | 100 | 10 | 600,990 | +3,159 | shared showcase DOM/CSS pass |
| Jinja2 | Sentry logs | 24.712 ms | 33.720 ms | 34.221 ms | 25.696 ms | 24.523 ms–24.854 ms | 5 | 50 | 5 | 875,884 | +24 | shared showcase DOM/CSS pass |
| Jinja2 | ESPN game page | 558.633 µs | 582.822 µs | 591.430 µs | 561.035 µs | 553.461 µs–564.591 µs | 5 | 200 | 20 | 32,857 | +11 | shared showcase DOM/CSS pass |
| PHP | Component page | 33.009 µs | 36.937 µs | 40.369 µs | 33.586 µs | 32.916 µs–33.042 µs | 5 | 2000 | 200 | 25,108 | +0 | semantic DOM pass |
| PHP | 1,000-row table | 1.773 ms | 1.825 ms | 1.866 ms | 1.778 ms | 1.770 ms–1.848 ms | 5 | 200 | 20 | 990,694 | +2,185 | semantic DOM pass |
| PHP | Product grid | 94.656 µs | 103.823 µs | 109.471 µs | 96.131 µs | 94.078 µs–102.171 µs | 5 | 500 | 50 | 285,868 | +960 | semantic DOM pass |
| PHP | Airbnb landing page | 451.240 µs | 462.779 µs | 471.275 µs | 451.649 µs | 450.593 µs–453.704 µs | 5 | 200 | 20 | 117,812 | +636 | shared showcase DOM/CSS pass |
| PHP | Nike catalog | 402.044 µs | 417.671 µs | 432.665 µs | 402.802 µs | 397.976 µs–403.509 µs | 5 | 200 | 20 | 128,247 | +536 | shared showcase DOM/CSS pass |
| PHP | GitHub PR review | 2.851 ms | 2.909 ms | 2.982 ms | 2.846 ms | 2.842 ms–2.864 ms | 5 | 100 | 10 | 601,520 | +3,689 | shared showcase DOM/CSS pass |
| PHP | Sentry logs | 6.000 ms | 6.559 ms | 6.608 ms | 6.031 ms | 5.974 ms–6.139 ms | 5 | 50 | 5 | 875,884 | +24 | shared showcase DOM/CSS pass |
| PHP | ESPN game page | 277.176 µs | 288.027 µs | 307.241 µs | 280.052 µs | 275.754 µs–281.423 µs | 5 | 200 | 20 | 32,858 | +12 | shared showcase DOM/CSS pass |
| Askama | Component page | 1.227 µs | 1.265 µs | 1.288 µs | 1.243 µs | 1.200 µs–1.255 µs | 5 | 2000 | 200 | 44,849 | +19,741 | semantic DOM pass |
| Askama | 1,000-row table | 730.903 µs | 758.183 µs | 768.846 µs | 731.681 µs | 726.703 µs–828.052 µs | 5 | 200 | 20 | 991,007 | +2,498 | semantic DOM pass |
| Askama | Product grid | 23.645 µs | 24.344 µs | 30.690 µs | 24.051 µs | 23.398 µs–23.903 µs | 5 | 500 | 50 | 285,676 | +768 | semantic DOM pass |
| Askama | Airbnb landing page | 18.285 µs | 19.407 µs | 25.468 µs | 18.539 µs | 18.073 µs–18.580 µs | 5 | 200 | 20 | 117,812 | +636 | shared showcase DOM/CSS pass |
| Askama | Nike catalog | 33.511 µs | 35.584 µs | 41.812 µs | 33.871 µs | 33.317 µs–34.055 µs | 5 | 200 | 20 | 128,133 | +422 | shared showcase DOM/CSS pass |
| Askama | GitHub PR review | 212.975 µs | 235.036 µs | 242.699 µs | 215.837 µs | 211.255 µs–220.625 µs | 5 | 100 | 10 | 601,061 | +3,230 | shared showcase DOM/CSS pass |
| Askama | Sentry logs | 422.521 µs | 443.673 µs | 452.916 µs | 424.309 µs | 418.855 µs–439.343 µs | 5 | 50 | 5 | 875,885 | +25 | shared showcase DOM/CSS pass |
| Askama | ESPN game page | 7.125 µs | 7.664 µs | 10.511 µs | 7.282 µs | 7.081 µs–7.305 µs | 5 | 200 | 20 | 32,857 | +11 | shared showcase DOM/CSS pass |
| Sailfish | Component page | 1.871 µs | 1.955 µs | 2.023 µs | 1.896 µs | 1.822 µs–1.896 µs | 5 | 2000 | 200 | 44,849 | +19,741 | semantic DOM pass |
| Sailfish | 1,000-row table | 610.873 µs | 638.552 µs | 719.618 µs | 613.682 µs | 603.750 µs–614.990 µs | 5 | 200 | 20 | 990,694 | +2,185 | semantic DOM pass |
| Sailfish | Product grid | 23.034 µs | 23.654 µs | 29.563 µs | 23.262 µs | 22.848 µs–23.173 µs | 5 | 500 | 50 | 285,868 | +960 | semantic DOM pass |
| Sailfish | Airbnb landing page | 10.675 µs | 11.168 µs | 13.957 µs | 10.805 µs | 10.547 µs–10.777 µs | 5 | 200 | 20 | 117,812 | +636 | shared showcase DOM/CSS pass |
| Sailfish | Nike catalog | 15.575 µs | 16.646 µs | 21.847 µs | 15.884 µs | 15.139 µs–15.982 µs | 5 | 200 | 20 | 128,247 | +536 | shared showcase DOM/CSS pass |
| Sailfish | GitHub PR review | 113.396 µs | 133.721 µs | 143.596 µs | 116.204 µs | 112.324 µs–114.283 µs | 5 | 100 | 10 | 601,520 | +3,689 | shared showcase DOM/CSS pass |
| Sailfish | Sentry logs | 266.698 µs | 293.791 µs | 472.181 µs | 277.534 µs | 264.363 µs–271.764 µs | 5 | 50 | 5 | 875,884 | +24 | shared showcase DOM/CSS pass |
| Sailfish | ESPN game page | 4.522 µs | 4.644 µs | 5.038 µs | 4.574 µs | 4.486 µs–4.569 µs | 5 | 200 | 20 | 32,858 | +12 | shared showcase DOM/CSS pass |
| Leptos | Component page | 17.900 µs | 18.267 µs | 24.417 µs | 18.104 µs | 17.819 µs–18.474 µs | 5 | 2000 | 200 | 25,219 | +111 | semantic DOM pass |
| Leptos | 1,000-row table | 1.673 ms | 1.707 ms | 1.727 ms | 1.675 ms | 1.662 ms–1.676 ms | 5 | 200 | 20 | 991,512 | +3,003 | semantic DOM pass |
| Leptos | Product grid | 212.000 µs | 218.798 µs | 227.315 µs | 213.877 µs | 210.832 µs–212.701 µs | 5 | 500 | 50 | 286,063 | +1,155 | semantic DOM pass |
| Leptos | Airbnb landing page | 104.109 µs | 124.808 µs | 133.430 µs | 107.043 µs | 103.640 µs–104.207 µs | 5 | 200 | 20 | 118,086 | +910 | shared showcase DOM/CSS pass |
| Leptos | Nike catalog | 190.835 µs | 221.891 µs | 230.626 µs | 197.973 µs | 190.215 µs–191.839 µs | 5 | 200 | 20 | 129,155 | +1,444 | shared showcase DOM/CSS pass |
| Leptos | GitHub PR review | 911.030 µs | 1.073 ms | 1.083 ms | 929.085 µs | 907.532 µs–912.726 µs | 5 | 100 | 10 | 603,135 | +5,304 | shared showcase DOM/CSS pass |
| Leptos | Sentry logs | 1.445 ms | 1.502 ms | 1.584 ms | 1.433 ms | 1.437 ms–1.451 ms | 5 | 50 | 5 | 884,362 | +8,502 | shared showcase DOM/CSS pass |
| Leptos | ESPN game page | 35.977 µs | 39.682 µs | 45.773 µs | 35.922 µs | 35.951 µs–36.874 µs | 5 | 200 | 20 | 33,105 | +259 | shared showcase DOM/CSS pass |
| Dioxus | Component page | 162.885 µs | 171.644 µs | 176.906 µs | 164.015 µs | 161.401 µs–163.753 µs | 5 | 2000 | 200 | 25,141 | +33 | semantic DOM pass |
| Dioxus | 1,000-row table | 3.492 ms | 3.647 ms | 3.669 ms | 3.478 ms | 3.452 ms–3.522 ms | 5 | 200 | 20 | 990,695 | +2,186 | semantic DOM pass |
| Dioxus | Product grid | 410.471 µs | 464.751 µs | 480.571 µs | 415.400 µs | 405.635 µs–450.328 µs | 5 | 500 | 50 | 285,868 | +960 | semantic DOM pass |
| Dioxus | Airbnb landing page | 911.827 µs | 947.650 µs | 974.755 µs | 916.452 µs | 909.003 µs–924.567 µs | 5 | 200 | 20 | 118,037 | +861 | shared showcase DOM/CSS pass |
| Dioxus | Nike catalog | 2.313 ms | 2.367 ms | 2.447 ms | 2.315 ms | 2.306 ms–2.320 ms | 5 | 200 | 20 | 128,297 | +586 | shared showcase DOM/CSS pass |
| Dioxus | GitHub PR review | 17.255 ms | 18.144 ms | 18.480 ms | 17.314 ms | 17.142 ms–17.288 ms | 5 | 100 | 10 | 601,612 | +3,781 | shared showcase DOM/CSS pass |
| Dioxus | Sentry logs | 23.693 ms | 24.475 ms | 24.791 ms | 23.789 ms | 23.681 ms–23.759 ms | 5 | 50 | 5 | 875,922 | +62 | shared showcase DOM/CSS pass |
| Dioxus | ESPN game page | 592.797 µs | 608.254 µs | 627.172 µs | 594.400 µs | 591.231 µs–602.485 µs | 5 | 200 | 20 | 32,877 | +31 | shared showcase DOM/CSS pass |
| Topcoat | Component page | 16.252 µs | 16.741 µs | 21.529 µs | 16.212 µs | 16.186 µs–16.416 µs | 5 | 2000 | 200 | 25,108 | +0 | semantic DOM pass |
| Topcoat | 1,000-row table | 1.463 ms | 1.771 ms | 1.795 ms | 1.553 ms | 1.450 ms–1.471 ms | 5 | 200 | 20 | 988,509 | +0 | semantic DOM pass |
| Topcoat | Product grid | 196.782 µs | 203.452 µs | 207.249 µs | 198.078 µs | 196.151 µs–196.980 µs | 5 | 500 | 50 | 284,908 | +0 | semantic DOM pass |
| Topcoat | Airbnb landing page | 336.891 µs | 348.876 µs | 392.042 µs | 339.630 µs | 334.647 µs–337.476 µs | 5 | 200 | 20 | 117,883 | +707 | shared showcase DOM/CSS pass |
| Topcoat | Nike catalog | 500.216 µs | 534.809 µs | 581.539 µs | 506.720 µs | 498.395 µs–502.363 µs | 5 | 200 | 20 | 127,822 | +111 | shared showcase DOM/CSS pass |
| Topcoat | GitHub PR review | 2.677 ms | 3.051 ms | 3.059 ms | 2.723 ms | 2.660 ms–2.688 ms | 5 | 100 | 10 | 598,922 | +1,091 | shared showcase DOM/CSS pass |
| Topcoat | Sentry logs | 4.546 ms | 4.903 ms | 4.954 ms | 4.601 ms | 4.527 ms–4.551 ms | 5 | 50 | 5 | 875,888 | +28 | shared showcase DOM/CSS pass |
| Topcoat | ESPN game page | 130.120 µs | 138.875 µs | 144.905 µs | 131.477 µs | 129.996 µs–131.478 µs | 5 | 200 | 20 | 32,868 | +22 | shared showcase DOM/CSS pass |
| Astro | Component page | 50.361 µs | 83.774 µs | 672.916 µs | 112.784 µs | 49.296 µs–52.164 µs | 5 | 2000 | 200 | 25,108 | +0 | semantic DOM pass |
| Astro | 1,000-row table | 2.851 ms | 6.692 ms | 9.395 ms | 3.673 ms | 2.791 ms–3.359 ms | 5 | 200 | 20 | 990,507 | +1,998 | semantic DOM pass |
| Astro | Product grid | 290.786 µs | 1.119 ms | 3.652 ms | 545.163 µs | 284.080 µs–313.408 µs | 5 | 500 | 50 | 285,868 | +960 | semantic DOM pass |
| Astro | Airbnb landing page | 611.888 µs | 5.936 ms | 7.997 ms | 1.400 ms | 591.896 µs–620.168 µs | 5 | 200 | 20 | 117,707 | +531 | shared showcase DOM/CSS pass |
| Astro | Nike catalog | 762.214 µs | 3.993 ms | 5.827 ms | 1.252 ms | 749.259 µs–780.665 µs | 5 | 200 | 20 | 128,069 | +358 | shared showcase DOM/CSS pass |
| Astro | GitHub PR review | 5.062 ms | 15.043 ms | 41.763 ms | 7.247 ms | 4.741 ms–6.099 ms | 5 | 100 | 10 | 601,482 | +3,651 | shared showcase DOM/CSS pass |
| Astro | Sentry logs | 17.247 ms | 51.911 ms | 61.971 ms | 21.134 ms | 16.723 ms–17.939 ms | 5 | 50 | 5 | 875,869 | +9 | shared showcase DOM/CSS pass |
| Astro | ESPN game page | 324.630 µs | 3.786 ms | 7.617 ms | 820.224 µs | 303.611 µs–337.517 µs | 5 | 200 | 20 | 32,821 | -25 | shared showcase DOM/CSS pass |
| SvelteKit | Component page | 11.349 µs | 18.181 µs | 31.251 µs | 29.788 µs | 11.232 µs–11.579 µs | 5 | 2000 | 200 | 25,770 | +662 | semantic DOM pass |
| SvelteKit | 1,000-row table | 1.600 ms | 4.688 ms | 9.158 ms | 2.531 ms | 1.589 ms–1.721 ms | 5 | 200 | 20 | 1,003,248 | +14,739 | semantic DOM pass |
| SvelteKit | Product grid | 92.537 µs | 181.047 µs | 3.365 ms | 223.842 µs | 91.865 µs–96.763 µs | 5 | 500 | 50 | 286,476 | +1,568 | semantic DOM pass |
| SvelteKit | Airbnb landing page | 87.156 µs | 209.736 µs | 3.852 ms | 275.790 µs | 82.090 µs–132.701 µs | 5 | 200 | 20 | 119,786 | +2,610 | shared showcase DOM/CSS pass |
| SvelteKit | Nike catalog | 144.652 µs | 672.399 µs | 4.054 ms | 316.172 µs | 142.551 µs–151.719 µs | 5 | 200 | 20 | 147,261 | +19,550 | shared showcase DOM/CSS pass |
| SvelteKit | GitHub PR review | 785.374 µs | 4.042 ms | 7.028 ms | 1.611 ms | 777.262 µs–805.968 µs | 5 | 100 | 10 | 675,254 | +77,423 | shared showcase DOM/CSS pass |
| SvelteKit | Sentry logs | 3.314 ms | 7.437 ms | 12.952 ms | 3.967 ms | 3.049 ms–3.571 ms | 5 | 50 | 5 | 1,118,556 | +242,696 | shared showcase DOM/CSS pass |
| SvelteKit | ESPN game page | 52.644 µs | 146.598 µs | 5.289 ms | 207.323 µs | 50.539 µs–56.767 µs | 5 | 200 | 20 | 36,201 | +3,355 | shared showcase DOM/CSS pass |
| Next.js | Component page | 75.342 µs | 122.348 µs | 1.354 ms | 152.176 µs | 74.642 µs–76.965 µs | 5 | 2000 | 200 | 25,201 | +93 | semantic DOM pass |
| Next.js | 1,000-row table | 5.246 ms | 20.195 ms | 26.489 ms | 8.263 ms | 5.124 ms–5.339 ms | 5 | 200 | 20 | 990,694 | +2,185 | semantic DOM pass |
| Next.js | Product grid | 424.973 µs | 2.298 ms | 5.457 ms | 808.747 µs | 422.966 µs–429.463 µs | 5 | 500 | 50 | 285,868 | +960 | semantic DOM pass |
| Next.js | Airbnb landing page | 606.201 µs | 6.597 ms | 31.359 ms | 2.141 ms | 582.727 µs–652.860 µs | 5 | 200 | 20 | 117,862 | +686 | shared showcase DOM/CSS pass |
| Next.js | Nike catalog | 655.502 µs | 7.038 ms | 21.278 ms | 2.171 ms | 619.747 µs–680.366 µs | 5 | 200 | 20 | 128,853 | +1,142 | shared showcase DOM/CSS pass |
| Next.js | GitHub PR review | 4.060 ms | 16.315 ms | 49.215 ms | 7.014 ms | 3.445 ms–4.796 ms | 5 | 100 | 10 | 601,633 | +3,802 | shared showcase DOM/CSS pass |
| Next.js | Sentry logs | 12.212 ms | 43.078 ms | 91.311 ms | 20.177 ms | 9.331 ms–14.846 ms | 5 | 50 | 5 | 875,888 | +28 | shared showcase DOM/CSS pass |
| Next.js | ESPN game page | 295.582 µs | 5.489 ms | 8.529 ms | 1.173 ms | 287.572 µs–304.813 µs | 5 | 200 | 20 | 33,334 | +488 | shared showcase DOM/CSS pass |
| Exact | Component page | 5.577 ms | 18.122 ms | 31.658 ms | 7.378 ms | 5.566 ms–5.614 ms | 5 | 2000 | 200 | 34,637 | +9,529 | adapted content and styles pass |
| Exact | 1,000-row table | 149.610 ms | 628.251 ms | 894.222 ms | 232.420 ms | 148.747 ms–151.988 ms | 5 | 200 | 20 | 1,025,844 | +37,335 | adapted content and styles pass |
| Exact | Product grid | 17.501 ms | 62.709 ms | 91.831 ms | 23.150 ms | 17.413 ms–17.535 ms | 5 | 500 | 50 | 261,879 | -23,029 | adapted content and styles pass |
| Exact | Airbnb landing page | 60.891 ms | 163.880 ms | 233.753 ms | 74.959 ms | 60.614 ms–61.145 ms | 5 | 200 | 20 | 634,312 | +517,136 | adapted business content and compiled native styles pass |
| Exact | Nike catalog | 100.168 ms | 274.106 ms | 343.011 ms | 125.463 ms | 99.917 ms–100.384 ms | 5 | 200 | 20 | 666,162 | +538,451 | adapted business content and compiled native styles pass |
| Exact | GitHub PR review | 452.258 ms | 1276.577 ms | 1743.614 ms | 585.156 ms | 446.390 ms–452.858 ms | 5 | 100 | 10 | 2,187,104 | +1,589,273 | adapted business content and compiled native styles pass |
| Exact | Sentry logs | 1437.315 ms | 4597.313 ms | 6690.236 ms | 2042.917 ms | 1413.757 ms–1450.010 ms | 5 | 50 | 5 | 8,959,674 | +8,083,814 | adapted business content and compiled native styles pass |
| Exact | ESPN game page | 43.873 ms | 127.680 ms | 182.327 ms | 55.469 ms | 43.698 ms–44.391 ms | 5 | 200 | 20 | 477,355 | +444,509 | adapted business content and compiled native styles pass |

### Tail observations

The report flags every cell whose process-median P95 is at least 3× its P50:

- Marko's 1,000-row table P95 was 3.13× its P50 (4.518 ms versus 1.442 ms).
- Marko's airbnb landing page P95 was 18.6× its P50 (3.313 ms versus 177.657 µs).
- Marko's nike catalog P95 was 16.6× its P50 (3.720 ms versus 224.631 µs).
- React's component page P95 was 7.33× its P50 (639.952 µs versus 87.303 µs).
- React's product grid P95 was 6.92× its P50 (3.063 ms versus 442.810 µs).
- React's airbnb landing page P95 was 10.6× its P50 (5.816 ms versus 547.314 µs).
- React's nike catalog P95 was 11.3× its P50 (6.863 ms versus 608.485 µs).
- React's github pr review P95 was 5.37× its P50 (17.257 ms versus 3.211 ms).
- React's sentry logs P95 was 4.09× its P50 (41.917 ms versus 10.255 ms).
- React's espn game page P95 was 16.9× its P50 (4.431 ms versus 262.172 µs).
- Vue's 1,000-row table P95 was 3.10× its P50 (4.991 ms versus 1.610 ms).
- Vue's product grid P95 was 3.86× its P50 (364.634 µs versus 94.392 µs).
- Vue's nike catalog P95 was 14.0× its P50 (1.772 ms versus 126.166 µs).
- Vue's github pr review P95 was 15.1× its P50 (15.826 ms versus 1.051 ms).
- Vue's sentry logs P95 was 3.29× its P50 (10.213 ms versus 3.106 ms).
- Svelte's nike catalog P95 was 5.82× its P50 (773.833 µs versus 132.931 µs).
- Svelte's github pr review P95 was 6.29× its P50 (5.012 ms versus 797.000 µs).
- jte's product grid P95 was 5.92× its P50 (3.743 ms versus 632.809 µs).
- jte's airbnb landing page P95 was 17.7× its P50 (2.495 ms versus 140.986 µs).
- jte's nike catalog P95 was 9.01× its P50 (3.441 ms versus 381.913 µs).
- jte's github pr review P95 was 4.81× its P50 (7.827 ms versus 1.626 ms).
- Rocker's product grid P95 was 5.44× its P50 (4.153 ms versus 762.850 µs).
- Rocker's airbnb landing page P95 was 8.87× its P50 (4.566 ms versus 514.765 µs).
- Rocker's nike catalog P95 was 6.49× its P50 (4.236 ms versus 652.369 µs).
- Rocker's sentry logs P95 was 3.15× its P50 (17.452 ms versus 5.540 ms).
- Rocker's espn game page P95 was 14.8× its P50 (4.331 ms versus 291.856 µs).
- Handlebars's airbnb landing page P95 was 7.06× its P50 (3.468 ms versus 491.118 µs).
- Handlebars's nike catalog P95 was 3.88× its P50 (4.246 ms versus 1.095 ms).
- Handlebars's sentry logs P95 was 3.21× its P50 (46.978 ms versus 14.634 ms).
- Handlebars's espn game page P95 was 6.14× its P50 (2.234 ms versus 364.103 µs).
- Astro's product grid P95 was 3.85× its P50 (1.119 ms versus 290.786 µs).
- Astro's airbnb landing page P95 was 9.70× its P50 (5.936 ms versus 611.888 µs).
- Astro's nike catalog P95 was 5.24× its P50 (3.993 ms versus 762.214 µs).
- Astro's sentry logs P95 was 3.01× its P50 (51.911 ms versus 17.247 ms).
- Astro's espn game page P95 was 11.7× its P50 (3.786 ms versus 324.630 µs).
- SvelteKit's nike catalog P95 was 4.65× its P50 (672.399 µs versus 144.652 µs).
- SvelteKit's github pr review P95 was 5.15× its P50 (4.042 ms versus 785.374 µs).
- Next.js's 1,000-row table P95 was 3.85× its P50 (20.195 ms versus 5.246 ms).
- Next.js's product grid P95 was 5.41× its P50 (2.298 ms versus 424.973 µs).
- Next.js's airbnb landing page P95 was 10.9× its P50 (6.597 ms versus 606.201 µs).
- Next.js's nike catalog P95 was 10.7× its P50 (7.038 ms versus 655.502 µs).
- Next.js's github pr review P95 was 4.02× its P50 (16.315 ms versus 4.060 ms).
- Next.js's sentry logs P95 was 3.53× its P50 (43.078 ms versus 12.212 ms).
- Next.js's espn game page P95 was 18.6× its P50 (5.489 ms versus 295.582 µs).
- Exact's component page P95 was 3.25× its P50 (18.122 ms versus 5.577 ms).
- Exact's 1,000-row table P95 was 4.20× its P50 (628.251 ms versus 149.610 ms).
- Exact's product grid P95 was 3.58× its P50 (62.709 ms versus 17.501 ms).
- Exact's sentry logs P95 was 3.20× its P50 (4597.313 ms versus 1437.315 ms).

### Parity

Chromium parses every untimed dump. The gate requires identical elements, non-class attributes, class membership, visible text, and body order. It ignores renderer-internal comments, resource-preload hints, non-semantic `<head>` order, class-token order, and adjacent hydration-split text nodes. The timed response is never normalized.

| Workload | Canonical DOM SHA-256 | Exact-byte matches |
| --- | --- | ---: |
| Component page | `43c50a97024231d49639400a5bfb18df7dbe5e94068cd42a732cea26ed0188b4` | 7/21 |
| 1,000-row table | `ba9bb6481cefab9898ff8c7d6c31405f3379c3ddaede2690e5c70ef46473356b` | 2/21 |
| Product grid | `5c89ccf8708043183838767b4bf61a68d9afc8bbf78830dc8886a851be162cfe` | 2/21 |
| Airbnb landing page | `2dcff4a961e752772ab464d4472f2ac158e9be0a13bcdf6add9462fb60325b56` | 1/21 |
| Nike catalog | `45c5220d4bc5999001d33a0cb1970d5e6682454c6557b6ea1c6deb38e86b8ce3` | 1/21 |
| GitHub PR review | `26f3cfd6b1d9f0f0d4c3903f5d0acd999b8c2fbba03d146a12c51ddc7eb4f581` | 1/21 |
| Sentry logs | `cb883e069423fa107f03a276629a1b3bcfe9eca728f7a1ee274999d83dd7ab49` | 1/21 |
| ESPN game page | `74b37bf1d8c5744d552f3ca62b938c2398a2d37d2f6f8fb7aff57b813def92fd` | 1/21 |

### Renderer and runtime versions

| Renderer/runtime | Version |
| --- | --- |
| Proa | 0.4.0 @ 367cc10ae520cdf00c16cb38b4ca46d4ab23ebd5 / rustc 1.95.0 (59807616e 2026-04-14) |
| Marko | 6.0.150 / Bun 1.4.2 |
| React | 19.2.4 / Bun 1.4.2 |
| Vue | 3.5.42 / Bun 1.4.2 |
| Svelte | 5.57.2 / Bun 1.4.2 |
| Rails | Rails 8.1.3.1 / ruby 4.0.6 (2026-07-14 revision 03b6d3f889) +PRISM [x86_64-linux] |
| jte | 3.2.4 / openjdk 17.0.21.0.3 2026-10-24 |
| Rocker | 2.4.0 / openjdk 17.0.21.0.3 2026-10-24 |
| Handlebars | 4.7.8 / Bun 1.4.2 |
| Go html/template | go version go1.25.5 linux/amd64 |
| Jinja2 | 3.1.6 / Python 3.13.18 |
| PHP | PHP 8.3.6 (cli) (built: Oct 19 2026 15:16:58) (NTS) |
| Askama | 0.15.6 / rustc 1.95.0 (59807616e 2026-04-14) |
| Sailfish | 0.10.2 / rustc 1.95.0 (59807616e 2026-04-14) |
| Leptos | 0.7.8 / rustc 1.95.0 (59807616e 2026-04-14) |
| Dioxus | 0.6.3 + dioxus-ssr 0.6.2 / rustc 1.95.0 (59807616e 2026-04-14) |
| Topcoat | 0.3.1 / rustc 1.95.0 (59807616e 2026-04-14) |
| Playwright | 1.61.1 |
| Chromium | 149.0.7827.55 |
| Astro | 7.4.8 |
| SvelteKit | 3.1.0 |
| Next.js | Next.js 16.4.6 compiled page / bundled React DOM 19.3.0-canary-278794d7-20261002 / Bun 1.4.2 |
| Exact | 94b8671f70fe2e25b307a40e7fce66dc27c9f802 |

### Reproduction

```sh
./benchmarks/rendering/run-all
```

The runner builds every fixed-roster adapter, runs the complete parity matrix, stops before timing if any cell fails, rotates renderer process order, records per-process summaries, writes `latest.json`, and generates this report and the README tables.

Full commands recorded by the capture:

- `bun install --frozen-lockfile (repository root, all JavaScript workspaces)`
- `bundle check || bundle install (Rails adapter directory)`
- `cargo build --locked --release -p proa_bench --features topcoat --bin representative_suite_bench`
- `go build -trimpath -o benchmarks/rendering/external/go/build/canonical_suite benchmarks/rendering/external/go/suite_bench.go`
- `python3 -m venv benchmarks/rendering/external/jinja/.venv && pip install -r benchmarks/rendering/external/jinja/requirements.txt`
- `gradle --no-daemon --quiet installDist copyJteBinaryStaticContent (jte adapter directory)`
- `gradle --no-daemon --quiet installDist (Rocker adapter directory)`
- `"bun" "benchmarks/rendering/canonical/run.mjs" "--no-setup"`

### Known limitations

- Renderer-only latency excludes routing, middleware, databases, HTTP transfer, hydration, and network latency.
- Semantic DOM parity permits documented serializer metadata and whitespace differences; payload deltas remain visible.
- This capture describes one machine and these eight workloads; it is not a universal application ranking.
- Exact uses the disclosed exact-native-v1 adaptation: named native styles, generated classes, text/list wrappers and separated table borders. Content, attributes, formatting and representative computed CSS are checked separately; strict DOM parity is not claimed. Fresh per-render VM/runtime initialization, prepared-input binding, DOM construction and HTML serialization are inside timing; source compilation and input-data construction are outside.

### Raw and related evidence

- [Per-process summaries](../../benchmarks/rendering/results/raw/canonical-ssr-v1-2026-11-15T22-15-04-069Z-ea202576/process-summaries.json.gz)
- [Result-table migration map](../../benchmarks/rendering/MIGRATION.md)
- [Exact adapted cards stylesheet](../../benchmarks/rendering/results/raw/canonical-ssr-v1-2026-11-15T22-15-04-069Z-ea202576/cards-exact.css)
- [Exact adapted table stylesheet](../../benchmarks/rendering/results/raw/canonical-ssr-v1-2026-11-15T22-15-04-069Z-ea202576/table-exact.css)
- [Exact adapted products stylesheet](../../benchmarks/rendering/results/raw/canonical-ssr-v1-2026-11-15T22-15-04-069Z-ea202576/products-exact.css)
- [Exact adapted airbnb-home stylesheet](../../benchmarks/rendering/results/raw/canonical-ssr-v1-2026-11-15T22-15-04-069Z-ea202576/airbnb-home-exact.css)
- [Exact adapted nike-catalog stylesheet](../../benchmarks/rendering/results/raw/canonical-ssr-v1-2026-11-15T22-15-04-069Z-ea202576/nike-catalog-exact.css)
- [Exact adapted github-pr stylesheet](../../benchmarks/rendering/results/raw/canonical-ssr-v1-2026-11-15T22-15-04-069Z-ea202576/github-pr-exact.css)
- [Exact adapted sentry-otel stylesheet](../../benchmarks/rendering/results/raw/canonical-ssr-v1-2026-11-15T22-15-04-069Z-ea202576/sentry-otel-exact.css)
- [Exact adapted espn stylesheet](../../benchmarks/rendering/results/raw/canonical-ssr-v1-2026-11-15T22-15-04-069Z-ea202576/espn-exact.css)
- [Unchanged fixture admission checks](../../benchmarks/rendering/results/raw/canonical-ssr-v1-2026-11-15T22-15-04-069Z-ea202576/admissions.json)

Allocation measurements and construction-path controls remain separate from this renderer scoreboard. See the [engineering report](engineering.md) and [mechanism-specific notes](../engineering/README.md).

<!-- canonical-details:end -->

## Next steps

- [Front page](../../README.md)
  - The four figures and the reasons to trust them.
- [HTTP capacity, cold start and streaming](http-capacity.md)
  - What one core of each production server sustains, and what a fresh process costs.
- [Engineering, application and agent captures](engineering.md)
  - Product-grid scaling, the memcpy floor, Proa's buffer allocation, and the latest standalone engineering experiments.
- [Canonical benchmark protocol](../../benchmarks/rendering/protocol.md)
  - The parity gate, the fairness rules, and the workload shapes in full.
- [Rendering suite](../../benchmarks/rendering/)
  - The adapters, the runner, and the engineering laboratory behind the scoreboard.
