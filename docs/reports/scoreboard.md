# Canonical scoreboard evidence

Seventeen renderers turn the same prepared data into the same three pages, and the scoreboard times only that render. This page holds the [current result](#current-result), the [renderer coverage](#renderer-coverage), and the [complete canonical evidence](#complete-canonical-evidence) behind the [front page](../../README.md)'s figures.

## Current result

<!-- canonical-scoreboard:start -->

**November 15, 2026 · Intel(R) Xeon(R) 6985P-C CPU @ 2.30GHz · linux**

On these workloads, the November 15, 2026 capture on Intel(R) Xeon(R) 6985P-C CPU @ 2.30GHz measured Proa rendering the component page 86.4× faster than React, the 1,000-row table 53.1× faster than React, and the product grid 43.8× faster than React. These ratios describe this capture, not every application.

> Lower is better. Strict rows pass unchanged DOM/class parity. Exact† uses an explicitly adapted fixture with equivalent content and native styles; its HTML differs. See [adaptation details](../../benchmarks/rendering/external/exact/README.md).

Each cell is `P50 render time · relative to Proa`.

| Renderer | Component page | 1,000-row table | Product grid | Airbnb landing page | Nike catalog | GitHub PR review | Sentry logs | ESPN game page |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Proa | 0.001 ms · 1.00× | 0.19 ms · 1.00× | 0.010 ms · 1.00× | 0.009 ms · 1.00× | 0.011 ms · 1.00× | 0.093 ms · 1.00× | 0.21 ms · 1.00× | 0.004 ms · 1.00× |
| Marko | 0.010 ms · 10.3× | 1.44 ms · 7.72× | 0.11 ms · 11.5× | 0.18 ms · 20.2× | 0.23 ms · 20.6× | 5.16 ms · 55.5× | 10.8 ms · 50.9× | 0.098 ms · 22.3× |
| React | 0.085 ms · 86.4× | 9.89 ms · 53.1× | 0.44 ms · 43.8× | 0.59 ms · 66.2× | 0.63 ms · 56.3× | 3.26 ms · 35.0× | 9.71 ms · 45.7× | 0.27 ms · 61.1× |
| Vue | 0.010 ms · 10.4× | 1.62 ms · 8.67× | 0.094 ms · 9.42× | 0.099 ms · 11.1× | 0.12 ms · 11.1× | 1.10 ms · 11.8× | 3.51 ms · 16.5× | 0.060 ms · 13.6× |
| Svelte | 0.009 ms · 9.24× | 1.54 ms · 8.28× | 0.094 ms · 9.42× | 0.11 ms · 12.4× | 0.14 ms · 12.3× | 0.75 ms · 8.07× | 2.66 ms · 12.5× | 0.074 ms · 16.9× |
| Rails | 0.079 ms · 79.9× | 9.21 ms · 49.4× | 0.49 ms · 48.5× | 0.63 ms · 70.6× | 0.89 ms · 79.8× | 5.32 ms · 57.2× | 12.2 ms · 57.6× | 0.32 ms · 72.7× |
| jte | 0.014 ms · 14.5× | 7.25 ms · 38.9× | 0.64 ms · 63.6× | 0.14 ms · 15.9× | 0.38 ms · 34.4× | 2.09 ms · 22.5× | 5.22 ms · 24.6× | 0.079 ms · 18.1× |
| Rocker | 0.037 ms · 37.2× | 10.5 ms · 56.4× | 0.80 ms · 80.2× | 0.51 ms · 57.0× | 0.67 ms · 59.8× | 5.67 ms · 60.9× | 5.74 ms · 27.0× | 0.29 ms · 65.3× |
| Handlebars | 0.030 ms · 30.6× | 4.20 ms · 22.5× | 0.21 ms · 21.1× | 0.49 ms · 55.4× | 1.01 ms · 90.1× | 17.7 ms · 190× | 14.7 ms · 69.3× | 0.37 ms · 84.2× |
| Go html/template | 0.14 ms · 145× | 14.5 ms · 77.8× | 1.15 ms · 115× | 2.64 ms · 296× | 5.17 ms · 463× | 32.0 ms · 344× | 69.7 ms · 328× | 1.30 ms · 296× |
| Jinja2 | 0.11 ms · 109× | 19.4 ms · 104× | 1.42 ms · 142× | 1.01 ms · 113× | 1.78 ms · 159× | 11.0 ms · 118× | 24.8 ms · 116× | 0.56 ms · 127× |
| PHP | 0.034 ms · 34.2× | 1.82 ms · 9.76× | 0.096 ms · 9.57× | 0.45 ms · 50.7× | 0.40 ms · 35.9× | 2.83 ms · 30.4× | 5.87 ms · 27.6× | 0.28 ms · 62.9× |
| Askama | 0.001 ms · 1.27× | 0.74 ms · 3.99× | 0.024 ms · 2.35× | 0.019 ms · 2.09× | 0.034 ms · 3.05× | 0.21 ms · 2.30× | 0.41 ms · 1.94× | 0.007 ms · 1.63× |
| Sailfish | 0.002 ms · 1.92× | 0.62 ms · 3.35× | 0.023 ms · 2.30× | 0.011 ms · 1.21× | 0.016 ms · 1.45× | 0.11 ms · 1.18× | 0.26 ms · 1.22× | 0.005 ms · 1.04× |
| Leptos | 0.018 ms · 18.5× | 1.69 ms · 9.08× | 0.21 ms · 21.1× | 0.11 ms · 11.8× | 0.19 ms · 17.2× | 0.90 ms · 9.68× | 1.43 ms · 6.71× | 0.036 ms · 8.19× |
| Dioxus | 0.17 ms · 169× | 3.49 ms · 18.7× | 0.41 ms · 40.6× | 0.92 ms · 103× | 2.26 ms · 202× | 16.5 ms · 177× | 22.9 ms · 108× | 0.60 ms · 135× |
| Topcoat | 0.017 ms · 16.9× | 1.50 ms · 8.06× | 0.20 ms · 19.6× | 0.34 ms · 37.7× | 0.50 ms · 44.5× | 2.63 ms · 28.3× | 4.46 ms · 21.0× | 0.13 ms · 29.9× |
| Astro | 0.051 ms · 51.9× | 3.12 ms · 16.8× | 0.30 ms · 29.6× | 0.63 ms · 70.3× | 0.75 ms · 67.2× | 5.26 ms · 56.5× | 17.4 ms · 81.9× | 0.31 ms · 70.2× |
| SvelteKit | 0.012 ms · 12.1× | 1.59 ms · 8.56× | 0.092 ms · 9.18× | 0.089 ms · 10.0× | 0.15 ms · 13.4× | 0.79 ms · 8.47× | 3.20 ms · 15.0× | 0.053 ms · 12.0× |
| Next.js | 0.077 ms · 78.2× | 5.11 ms · 27.4× | 0.43 ms · 42.9× | 0.62 ms · 69.5× | 0.65 ms · 57.8× | 4.32 ms · 46.4× | 10.9 ms · 51.5× | 0.29 ms · 65.3× |
| Exact† | 5.61 ms · 5685× | 149 ms · 799× | 17.5 ms · 1750× | 61.5 ms · 6898× | 99.5 ms · 8893× | 443 ms · 4759× | 1412 ms · 6645× | 43.7 ms · 9932× |

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

- Capture: `canonical-ssr-v1-2026-11-15T19-05-04-173Z-c9ebfde3`
- Captured: 2026-11-15T19:05:04.173Z
- Completed: 2026-11-15T19:18:14.289Z
- Host: Intel(R) Xeon(R) 6985P-C CPU @ 2.30GHz, 16 logical CPUs, 63200768000 bytes RAM
- OS: linux (6.12.105+), x64
- Proa output: Fresh owned RenderBuffer per iteration. Allocation and rendering are timed; flattening/copying, encoding, parity, hashing and output destruction are outside the render timer.
- Harness commit: `ad3fa45ccd49088563474cc280b43669816433dd` (dirty; source digest retained)
- Canonical source SHA-256: `1437178820d010853a9572cbf0053d697a9c9db7fea5b9a7f1e0e5b3a473581a`

### Detailed measurements

| Renderer | Workload | P50 | P95 | P99 | Mean | Process P50 range | Processes | Samples/process | Warmups/process | Payload bytes | Payload Δ vs Proa | Parity |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Proa | Component page | 0.987 µs | 1.007 µs | 1.040 µs | 0.999 µs | 0.964 µs–0.994 µs | 5 | 2000 | 200 | 25,108 | +0 | semantic DOM pass |
| Proa | 1,000-row table | 186.376 µs | 202.323 µs | 207.797 µs | 188.992 µs | 184.863 µs–186.990 µs | 5 | 200 | 20 | 988,509 | +0 | semantic DOM pass |
| Proa | Product grid | 10.022 µs | 10.300 µs | 14.223 µs | 10.162 µs | 9.942 µs–10.245 µs | 5 | 500 | 50 | 284,908 | +0 | semantic DOM pass |
| Proa | Airbnb landing page | 8.919 µs | 9.407 µs | 10.485 µs | 9.054 µs | 8.841 µs–8.932 µs | 5 | 200 | 20 | 117,176 | +0 | shared showcase DOM/CSS pass |
| Proa | Nike catalog | 11.186 µs | 11.626 µs | 16.640 µs | 11.301 µs | 11.105 µs–11.428 µs | 5 | 200 | 20 | 127,711 | +0 | shared showcase DOM/CSS pass |
| Proa | GitHub PR review | 93.058 µs | 108.164 µs | 113.939 µs | 94.485 µs | 92.046 µs–100.416 µs | 5 | 100 | 10 | 597,831 | +0 | shared showcase DOM/CSS pass |
| Proa | Sentry logs | 212.497 µs | 233.420 µs | 246.274 µs | 217.598 µs | 211.904 µs–229.633 µs | 5 | 50 | 5 | 875,860 | +0 | shared showcase DOM/CSS pass |
| Proa | ESPN game page | 4.397 µs | 4.752 µs | 6.214 µs | 4.535 µs | 4.326 µs–4.506 µs | 5 | 200 | 20 | 32,846 | +0 | shared showcase DOM/CSS pass |
| Marko | Component page | 10.138 µs | 23.532 µs | 32.505 µs | 25.552 µs | 9.975 µs–10.568 µs | 5 | 2000 | 200 | 24,038 | -1,070 | semantic DOM pass |
| Marko | 1,000-row table | 1.439 ms | 4.608 ms | 7.193 ms | 2.036 ms | 1.396 ms–1.465 ms | 5 | 200 | 20 | 983,187 | -5,322 | semantic DOM pass |
| Marko | Product grid | 114.963 µs | 193.406 µs | 3.164 ms | 203.573 µs | 108.108 µs–115.600 µs | 5 | 500 | 50 | 282,604 | -2,304 | semantic DOM pass |
| Marko | Airbnb landing page | 180.591 µs | 3.305 ms | 6.367 ms | 521.362 µs | 175.859 µs–185.625 µs | 5 | 200 | 20 | 114,155 | -3,021 | shared showcase DOM/CSS pass |
| Marko | Nike catalog | 230.529 µs | 4.219 ms | 6.449 ms | 694.567 µs | 224.092 µs–236.536 µs | 5 | 200 | 20 | 121,831 | -5,880 | shared showcase DOM/CSS pass |
| Marko | GitHub PR review | 5.164 ms | 13.240 ms | 27.888 ms | 6.727 ms | 5.122 ms–5.233 ms | 5 | 100 | 10 | 577,769 | -20,062 | shared showcase DOM/CSS pass |
| Marko | Sentry logs | 10.823 ms | 17.618 ms | 114.728 ms | 14.187 ms | 10.324 ms–11.720 ms | 5 | 50 | 5 | 866,496 | -9,364 | shared showcase DOM/CSS pass |
| Marko | ESPN game page | 98.103 µs | 200.485 µs | 6.235 ms | 308.278 µs | 93.876 µs–100.252 µs | 5 | 200 | 20 | 32,321 | -525 | shared showcase DOM/CSS pass |
| React | Component page | 85.273 µs | 613.568 µs | 3.168 ms | 211.861 µs | 84.163 µs–92.149 µs | 5 | 2000 | 200 | 25,202 | +94 | semantic DOM pass |
| React | 1,000-row table | 9.893 ms | 19.338 ms | 28.544 ms | 10.219 ms | 9.032 ms–11.115 ms | 5 | 200 | 20 | 990,695 | +2,186 | semantic DOM pass |
| React | Product grid | 439.099 µs | 3.022 ms | 9.893 ms | 1.181 ms | 435.342 µs–480.636 µs | 5 | 500 | 50 | 285,868 | +960 | semantic DOM pass |
| React | Airbnb landing page | 590.599 µs | 6.730 ms | 34.527 ms | 2.182 ms | 545.817 µs–600.643 µs | 5 | 200 | 20 | 117,862 | +686 | shared showcase DOM/CSS pass |
| React | Nike catalog | 629.411 µs | 6.137 ms | 16.606 ms | 1.979 ms | 577.882 µs–663.737 µs | 5 | 200 | 20 | 128,853 | +1,142 | shared showcase DOM/CSS pass |
| React | GitHub PR review | 3.261 ms | 16.766 ms | 38.085 ms | 6.592 ms | 3.170 ms–3.659 ms | 5 | 100 | 10 | 601,633 | +3,802 | shared showcase DOM/CSS pass |
| React | Sentry logs | 9.713 ms | 40.553 ms | 52.799 ms | 16.048 ms | 9.044 ms–10.615 ms | 5 | 50 | 5 | 875,888 | +28 | shared showcase DOM/CSS pass |
| React | ESPN game page | 268.738 µs | 5.306 ms | 7.511 ms | 911.851 µs | 232.314 µs–272.288 µs | 5 | 200 | 20 | 33,334 | +488 | shared showcase DOM/CSS pass |
| Vue | Component page | 10.224 µs | 22.047 µs | 38.938 µs | 33.873 µs | 9.329 µs–10.688 µs | 5 | 2000 | 200 | 25,700 | +592 | semantic DOM pass |
| Vue | 1,000-row table | 1.615 ms | 4.911 ms | 8.951 ms | 2.382 ms | 1.573 ms–1.669 ms | 5 | 200 | 20 | 1,006,523 | +18,014 | semantic DOM pass |
| Vue | Product grid | 94.365 µs | 391.114 µs | 5.158 ms | 293.197 µs | 93.486 µs–97.632 µs | 5 | 500 | 50 | 287,420 | +2,512 | semantic DOM pass |
| Vue | Airbnb landing page | 98.833 µs | 190.135 µs | 6.236 ms | 310.203 µs | 96.841 µs–111.326 µs | 5 | 200 | 20 | 120,269 | +3,093 | shared showcase DOM/CSS pass |
| Vue | Nike catalog | 124.318 µs | 1.819 ms | 5.809 ms | 484.036 µs | 119.905 µs–130.474 µs | 5 | 200 | 20 | 154,091 | +26,380 | shared showcase DOM/CSS pass |
| Vue | GitHub PR review | 1.101 ms | 10.248 ms | 42.498 ms | 4.388 ms | 1.045 ms–1.350 ms | 5 | 100 | 10 | 855,405 | +257,574 | shared showcase DOM/CSS pass |
| Vue | Sentry logs | 3.506 ms | 8.848 ms | 12.652 ms | 4.328 ms | 2.757 ms–4.609 ms | 5 | 50 | 5 | 1,053,797 | +177,937 | shared showcase DOM/CSS pass |
| Vue | ESPN game page | 59.721 µs | 107.172 µs | 6.204 ms | 187.066 µs | 58.694 µs–60.757 µs | 5 | 200 | 20 | 36,340 | +3,494 | shared showcase DOM/CSS pass |
| Svelte | Component page | 9.117 µs | 23.187 µs | 41.496 µs | 24.441 µs | 8.829 µs–9.352 µs | 5 | 2000 | 200 | 25,748 | +640 | semantic DOM pass |
| Svelte | 1,000-row table | 1.543 ms | 4.861 ms | 8.751 ms | 2.369 ms | 1.437 ms–1.679 ms | 5 | 200 | 20 | 1,003,227 | +14,718 | semantic DOM pass |
| Svelte | Product grid | 94.405 µs | 255.227 µs | 3.138 ms | 232.626 µs | 93.281 µs–100.688 µs | 5 | 500 | 50 | 286,476 | +1,568 | semantic DOM pass |
| Svelte | Airbnb landing page | 110.674 µs | 234.980 µs | 3.280 ms | 291.675 µs | 89.859 µs–130.025 µs | 5 | 200 | 20 | 119,765 | +2,589 | shared showcase DOM/CSS pass |
| Svelte | Nike catalog | 137.469 µs | 722.353 µs | 4.207 ms | 304.672 µs | 133.327 µs–139.094 µs | 5 | 200 | 20 | 147,241 | +19,530 | shared showcase DOM/CSS pass |
| Svelte | GitHub PR review | 750.837 µs | 4.956 ms | 7.456 ms | 1.658 ms | 737.755 µs–774.956 µs | 5 | 100 | 10 | 675,234 | +77,403 | shared showcase DOM/CSS pass |
| Svelte | Sentry logs | 2.655 ms | 6.737 ms | 9.928 ms | 3.580 ms | 2.442 ms–3.208 ms | 5 | 50 | 5 | 1,118,535 | +242,675 | shared showcase DOM/CSS pass |
| Svelte | ESPN game page | 74.340 µs | 126.338 µs | 4.737 ms | 197.732 µs | 55.350 µs–79.423 µs | 5 | 200 | 20 | 36,180 | +3,334 | shared showcase DOM/CSS pass |
| Rails | Component page | 78.841 µs | 105.655 µs | 457.681 µs | 90.117 µs | 77.985 µs–79.808 µs | 5 | 2000 | 200 | 35,839 | +10,731 | semantic DOM pass |
| Rails | 1,000-row table | 9.214 ms | 9.737 ms | 9.938 ms | 9.009 ms | 9.100 ms–9.285 ms | 5 | 200 | 20 | 1,228,793 | +240,284 | semantic DOM pass |
| Rails | Product grid | 486.505 µs | 811.209 µs | 2.158 ms | 567.671 µs | 462.505 µs–508.425 µs | 5 | 500 | 50 | 296,823 | +11,915 | semantic DOM pass |
| Rails | Airbnb landing page | 629.846 µs | 911.764 µs | 1.566 ms | 686.345 µs | 625.364 µs–632.125 µs | 5 | 200 | 20 | 117,812 | +636 | shared showcase DOM/CSS pass |
| Rails | Nike catalog | 893.006 µs | 1.103 ms | 1.565 ms | 943.194 µs | 879.770 µs–924.020 µs | 5 | 200 | 20 | 128,143 | +432 | shared showcase DOM/CSS pass |
| Rails | GitHub PR review | 5.324 ms | 6.202 ms | 6.482 ms | 5.451 ms | 5.247 ms–5.439 ms | 5 | 100 | 10 | 601,500 | +3,669 | shared showcase DOM/CSS pass |
| Rails | Sentry logs | 12.230 ms | 12.562 ms | 15.878 ms | 12.355 ms | 12.116 ms–12.279 ms | 5 | 50 | 5 | 875,884 | +24 | shared showcase DOM/CSS pass |
| Rails | ESPN game page | 319.486 µs | 374.447 µs | 1.176 ms | 358.826 µs | 315.885 µs–322.292 µs | 5 | 200 | 20 | 32,857 | +11 | shared showcase DOM/CSS pass |
| jte | Component page | 14.358 µs | 19.864 µs | 36.216 µs | 35.255 µs | 13.644 µs–22.375 µs | 5 | 2000 | 200 | 25,109 | +1 | semantic DOM pass |
| jte | 1,000-row table | 7.250 ms | 26.366 ms | 35.930 ms | 9.624 ms | 6.825 ms–8.376 ms | 5 | 200 | 20 | 988,510 | +1 | semantic DOM pass |
| jte | Product grid | 637.504 µs | 3.758 ms | 4.425 ms | 1.245 ms | 634.573 µs–661.761 µs | 5 | 500 | 50 | 284,909 | +1 | semantic DOM pass |
| jte | Airbnb landing page | 141.710 µs | 2.316 ms | 5.286 ms | 435.230 µs | 140.861 µs–151.637 µs | 5 | 200 | 20 | 117,812 | +636 | shared showcase DOM/CSS pass |
| jte | Nike catalog | 384.662 µs | 3.788 ms | 4.562 ms | 854.488 µs | 253.800 µs–757.203 µs | 5 | 200 | 20 | 127,753 | +42 | shared showcase DOM/CSS pass |
| jte | GitHub PR review | 2.091 ms | 7.629 ms | 9.793 ms | 3.657 ms | 1.508 ms–2.454 ms | 5 | 100 | 10 | 598,870 | +1,039 | shared showcase DOM/CSS pass |
| jte | Sentry logs | 5.219 ms | 8.664 ms | 10.018 ms | 5.335 ms | 5.129 ms–5.420 ms | 5 | 50 | 5 | 875,884 | +24 | shared showcase DOM/CSS pass |
| jte | ESPN game page | 79.441 µs | 182.646 µs | 5.231 ms | 233.195 µs | 75.254 µs–80.806 µs | 5 | 200 | 20 | 32,853 | +7 | shared showcase DOM/CSS pass |
| Rocker | Component page | 36.676 µs | 45.786 µs | 3.056 ms | 77.544 µs | 36.178 µs–36.752 µs | 5 | 2000 | 200 | 25,109 | +1 | semantic DOM pass |
| Rocker | 1,000-row table | 10.510 ms | 19.840 ms | 34.473 ms | 10.216 ms | 8.204 ms–10.567 ms | 5 | 200 | 20 | 990,508 | +1,999 | semantic DOM pass |
| Rocker | Product grid | 804.108 µs | 4.164 ms | 5.619 ms | 1.653 ms | 756.649 µs–928.233 µs | 5 | 500 | 50 | 285,869 | +961 | semantic DOM pass |
| Rocker | Airbnb landing page | 507.984 µs | 4.579 ms | 6.717 ms | 1.179 ms | 497.867 µs–534.766 µs | 5 | 200 | 20 | 117,812 | +636 | shared showcase DOM/CSS pass |
| Rocker | Nike catalog | 669.320 µs | 4.203 ms | 5.677 ms | 1.231 ms | 627.729 µs–703.217 µs | 5 | 200 | 20 | 128,143 | +432 | shared showcase DOM/CSS pass |
| Rocker | GitHub PR review | 5.667 ms | 10.935 ms | 13.944 ms | 6.184 ms | 5.493 ms–6.221 ms | 5 | 100 | 10 | 601,500 | +3,669 | shared showcase DOM/CSS pass |
| Rocker | Sentry logs | 5.741 ms | 13.592 ms | 18.155 ms | 7.354 ms | 5.521 ms–6.018 ms | 5 | 50 | 5 | 875,884 | +24 | shared showcase DOM/CSS pass |
| Rocker | ESPN game page | 287.009 µs | 4.330 ms | 6.277 ms | 786.739 µs | 256.683 µs–323.884 µs | 5 | 200 | 20 | 32,857 | +11 | shared showcase DOM/CSS pass |
| Handlebars | Component page | 30.242 µs | 46.511 µs | 195.106 µs | 51.948 µs | 29.555 µs–31.439 µs | 5 | 2000 | 200 | 25,108 | +0 | semantic DOM pass |
| Handlebars | 1,000-row table | 4.201 ms | 6.450 ms | 15.032 ms | 4.833 ms | 4.137 ms–4.266 ms | 5 | 200 | 20 | 990,694 | +2,185 | semantic DOM pass |
| Handlebars | Product grid | 211.165 µs | 576.426 µs | 3.391 ms | 419.528 µs | 205.457 µs–247.207 µs | 5 | 500 | 50 | 285,868 | +960 | semantic DOM pass |
| Handlebars | Airbnb landing page | 494.403 µs | 3.432 ms | 4.412 ms | 787.237 µs | 478.764 µs–505.976 µs | 5 | 200 | 20 | 117,822 | +646 | shared showcase DOM/CSS pass |
| Handlebars | Nike catalog | 1.008 ms | 4.234 ms | 12.140 ms | 1.644 ms | 947.673 µs–1.083 ms | 5 | 200 | 20 | 128,247 | +536 | shared showcase DOM/CSS pass |
| Handlebars | GitHub PR review | 17.723 ms | 36.593 ms | 54.812 ms | 20.016 ms | 17.539 ms–18.088 ms | 5 | 100 | 10 | 602,885 | +5,054 | shared showcase DOM/CSS pass |
| Handlebars | Sentry logs | 14.732 ms | 47.637 ms | 53.741 ms | 19.672 ms | 14.119 ms–15.486 ms | 5 | 50 | 5 | 875,899 | +39 | shared showcase DOM/CSS pass |
| Handlebars | ESPN game page | 370.175 µs | 1.877 ms | 4.559 ms | 584.957 µs | 334.096 µs–386.200 µs | 5 | 200 | 20 | 32,868 | +22 | shared showcase DOM/CSS pass |
| Go html/template | Component page | 143.524 µs | 225.703 µs | 235.190 µs | 163.082 µs | 143.169 µs–144.125 µs | 5 | 2000 | 200 | 25,108 | +0 | semantic DOM pass |
| Go html/template | 1,000-row table | 14.496 ms | 15.260 ms | 15.991 ms | 14.520 ms | 14.325 ms–14.537 ms | 5 | 200 | 20 | 990,509 | +2,000 | semantic DOM pass |
| Go html/template | Product grid | 1.153 ms | 1.215 ms | 1.293 ms | 1.157 ms | 1.150 ms–1.159 ms | 5 | 500 | 50 | 285,676 | +768 | semantic DOM pass |
| Go html/template | Airbnb landing page | 2.636 ms | 3.143 ms | 3.320 ms | 2.642 ms | 2.627 ms–2.647 ms | 5 | 200 | 20 | 117,812 | +636 | shared showcase DOM/CSS pass |
| Go html/template | Nike catalog | 5.174 ms | 5.519 ms | 5.694 ms | 5.161 ms | 5.150 ms–5.224 ms | 5 | 200 | 20 | 129,559 | +1,848 | shared showcase DOM/CSS pass |
| Go html/template | GitHub PR review | 32.022 ms | 33.660 ms | 34.012 ms | 32.138 ms | 31.876 ms–32.115 ms | 5 | 100 | 10 | 605,634 | +7,803 | shared showcase DOM/CSS pass |
| Go html/template | Sentry logs | 69.704 ms | 72.208 ms | 73.650 ms | 70.059 ms | 69.237 ms–70.068 ms | 5 | 50 | 5 | 875,884 | +24 | shared showcase DOM/CSS pass |
| Go html/template | ESPN game page | 1.302 ms | 1.879 ms | 1.910 ms | 1.385 ms | 1.294 ms–1.309 ms | 5 | 200 | 20 | 32,857 | +11 | shared showcase DOM/CSS pass |
| Jinja2 | Component page | 107.732 µs | 114.790 µs | 118.874 µs | 108.007 µs | 106.165 µs–110.130 µs | 5 | 2000 | 200 | 25,108 | +0 | semantic DOM pass |
| Jinja2 | 1,000-row table | 19.449 ms | 21.004 ms | 22.637 ms | 19.591 ms | 18.995 ms–20.512 ms | 5 | 200 | 20 | 990,257 | +1,748 | semantic DOM pass |
| Jinja2 | Product grid | 1.423 ms | 1.454 ms | 1.535 ms | 1.425 ms | 1.406 ms–1.473 ms | 5 | 500 | 50 | 285,676 | +768 | semantic DOM pass |
| Jinja2 | Airbnb landing page | 1.008 ms | 1.058 ms | 1.123 ms | 1.016 ms | 995.844 µs–1.015 ms | 5 | 200 | 20 | 117,812 | +636 | shared showcase DOM/CSS pass |
| Jinja2 | Nike catalog | 1.782 ms | 1.841 ms | 1.869 ms | 1.784 ms | 1.775 ms–1.846 ms | 5 | 200 | 20 | 128,133 | +422 | shared showcase DOM/CSS pass |
| Jinja2 | GitHub PR review | 11.004 ms | 11.626 ms | 16.254 ms | 11.231 ms | 10.963 ms–11.149 ms | 5 | 100 | 10 | 600,990 | +3,159 | shared showcase DOM/CSS pass |
| Jinja2 | Sentry logs | 24.755 ms | 33.963 ms | 34.648 ms | 25.846 ms | 24.674 ms–25.284 ms | 5 | 50 | 5 | 875,884 | +24 | shared showcase DOM/CSS pass |
| Jinja2 | ESPN game page | 556.635 µs | 583.744 µs | 590.832 µs | 560.079 µs | 553.154 µs–564.645 µs | 5 | 200 | 20 | 32,857 | +11 | shared showcase DOM/CSS pass |
| PHP | Component page | 33.754 µs | 37.412 µs | 39.932 µs | 34.178 µs | 33.665 µs–33.872 µs | 5 | 2000 | 200 | 25,108 | +0 | semantic DOM pass |
| PHP | 1,000-row table | 1.819 ms | 1.861 ms | 1.883 ms | 1.822 ms | 1.801 ms–1.889 ms | 5 | 200 | 20 | 990,694 | +2,185 | semantic DOM pass |
| PHP | Product grid | 95.868 µs | 104.738 µs | 108.243 µs | 97.530 µs | 93.792 µs–97.347 µs | 5 | 500 | 50 | 285,868 | +960 | semantic DOM pass |
| PHP | Airbnb landing page | 452.445 µs | 470.798 µs | 483.040 µs | 454.527 µs | 448.777 µs–459.817 µs | 5 | 200 | 20 | 117,812 | +636 | shared showcase DOM/CSS pass |
| PHP | Nike catalog | 401.516 µs | 422.160 µs | 437.144 µs | 402.394 µs | 397.998 µs–404.321 µs | 5 | 200 | 20 | 128,247 | +536 | shared showcase DOM/CSS pass |
| PHP | GitHub PR review | 2.829 ms | 2.894 ms | 2.972 ms | 2.831 ms | 2.799 ms–2.843 ms | 5 | 100 | 10 | 601,520 | +3,689 | shared showcase DOM/CSS pass |
| PHP | Sentry logs | 5.867 ms | 6.418 ms | 6.444 ms | 5.892 ms | 5.830 ms–5.912 ms | 5 | 50 | 5 | 875,884 | +24 | shared showcase DOM/CSS pass |
| PHP | ESPN game page | 276.414 µs | 286.078 µs | 297.327 µs | 278.594 µs | 274.734 µs–282.429 µs | 5 | 200 | 20 | 32,858 | +12 | shared showcase DOM/CSS pass |
| Askama | Component page | 1.256 µs | 1.287 µs | 1.310 µs | 1.268 µs | 1.231 µs–1.307 µs | 5 | 2000 | 200 | 44,849 | +19,741 | semantic DOM pass |
| Askama | 1,000-row table | 743.644 µs | 774.231 µs | 804.292 µs | 748.156 µs | 735.110 µs–750.485 µs | 5 | 200 | 20 | 991,007 | +2,498 | semantic DOM pass |
| Askama | Product grid | 23.575 µs | 24.302 µs | 30.031 µs | 23.971 µs | 23.466 µs–23.802 µs | 5 | 500 | 50 | 285,676 | +768 | semantic DOM pass |
| Askama | Airbnb landing page | 18.634 µs | 19.686 µs | 24.700 µs | 18.892 µs | 18.222 µs–18.987 µs | 5 | 200 | 20 | 117,812 | +636 | shared showcase DOM/CSS pass |
| Askama | Nike catalog | 34.064 µs | 37.041 µs | 44.428 µs | 34.690 µs | 33.711 µs–34.794 µs | 5 | 200 | 20 | 128,133 | +422 | shared showcase DOM/CSS pass |
| Askama | GitHub PR review | 214.428 µs | 235.570 µs | 243.482 µs | 219.700 µs | 211.341 µs–218.788 µs | 5 | 100 | 10 | 601,061 | +3,230 | shared showcase DOM/CSS pass |
| Askama | Sentry logs | 411.736 µs | 428.223 µs | 442.038 µs | 412.874 µs | 408.231 µs–418.447 µs | 5 | 50 | 5 | 875,885 | +25 | shared showcase DOM/CSS pass |
| Askama | ESPN game page | 7.180 µs | 7.693 µs | 8.568 µs | 7.261 µs | 7.090 µs–7.472 µs | 5 | 200 | 20 | 32,857 | +11 | shared showcase DOM/CSS pass |
| Sailfish | Component page | 1.899 µs | 1.971 µs | 2.029 µs | 1.934 µs | 1.870 µs–1.933 µs | 5 | 2000 | 200 | 44,849 | +19,741 | semantic DOM pass |
| Sailfish | 1,000-row table | 624.080 µs | 661.195 µs | 758.610 µs | 628.363 µs | 615.592 µs–626.143 µs | 5 | 200 | 20 | 990,694 | +2,185 | semantic DOM pass |
| Sailfish | Product grid | 23.067 µs | 24.090 µs | 29.392 µs | 23.416 µs | 22.963 µs–23.744 µs | 5 | 500 | 50 | 285,868 | +960 | semantic DOM pass |
| Sailfish | Airbnb landing page | 10.834 µs | 11.295 µs | 12.655 µs | 10.977 µs | 10.370 µs–11.024 µs | 5 | 200 | 20 | 117,812 | +636 | shared showcase DOM/CSS pass |
| Sailfish | Nike catalog | 16.200 µs | 16.814 µs | 22.198 µs | 16.182 µs | 15.172 µs–16.547 µs | 5 | 200 | 20 | 128,247 | +536 | shared showcase DOM/CSS pass |
| Sailfish | GitHub PR review | 109.654 µs | 127.629 µs | 132.267 µs | 112.698 µs | 107.813 µs–127.841 µs | 5 | 100 | 10 | 601,520 | +3,689 | shared showcase DOM/CSS pass |
| Sailfish | Sentry logs | 259.390 µs | 281.618 µs | 452.969 µs | 268.816 µs | 256.759 µs–262.539 µs | 5 | 50 | 5 | 875,884 | +24 | shared showcase DOM/CSS pass |
| Sailfish | ESPN game page | 4.561 µs | 4.701 µs | 5.053 µs | 4.593 µs | 4.493 µs–4.633 µs | 5 | 200 | 20 | 32,858 | +12 | shared showcase DOM/CSS pass |
| Leptos | Component page | 18.279 µs | 18.655 µs | 24.467 µs | 18.437 µs | 18.231 µs–18.294 µs | 5 | 2000 | 200 | 25,219 | +111 | semantic DOM pass |
| Leptos | 1,000-row table | 1.692 ms | 1.737 ms | 1.797 ms | 1.691 ms | 1.672 ms–1.716 ms | 5 | 200 | 20 | 991,512 | +3,003 | semantic DOM pass |
| Leptos | Product grid | 211.382 µs | 218.548 µs | 228.245 µs | 213.101 µs | 211.000 µs–215.750 µs | 5 | 500 | 50 | 286,063 | +1,155 | semantic DOM pass |
| Leptos | Airbnb landing page | 105.129 µs | 126.050 µs | 137.456 µs | 107.707 µs | 104.269 µs–106.414 µs | 5 | 200 | 20 | 118,086 | +910 | shared showcase DOM/CSS pass |
| Leptos | Nike catalog | 192.699 µs | 223.879 µs | 229.518 µs | 200.040 µs | 192.329 µs–194.793 µs | 5 | 200 | 20 | 129,155 | +1,444 | shared showcase DOM/CSS pass |
| Leptos | GitHub PR review | 900.772 µs | 1.060 ms | 1.082 ms | 918.375 µs | 893.349 µs–907.167 µs | 5 | 100 | 10 | 603,135 | +5,304 | shared showcase DOM/CSS pass |
| Leptos | Sentry logs | 1.426 ms | 1.479 ms | 1.631 ms | 1.415 ms | 1.420 ms–1.431 ms | 5 | 50 | 5 | 884,362 | +8,502 | shared showcase DOM/CSS pass |
| Leptos | ESPN game page | 36.002 µs | 39.887 µs | 47.124 µs | 35.985 µs | 35.676 µs–36.535 µs | 5 | 200 | 20 | 33,105 | +259 | shared showcase DOM/CSS pass |
| Dioxus | Component page | 167.105 µs | 178.039 µs | 188.356 µs | 168.032 µs | 164.477 µs–169.018 µs | 5 | 2000 | 200 | 25,141 | +33 | semantic DOM pass |
| Dioxus | 1,000-row table | 3.485 ms | 3.646 ms | 3.819 ms | 3.471 ms | 3.465 ms–3.510 ms | 5 | 200 | 20 | 990,695 | +2,186 | semantic DOM pass |
| Dioxus | Product grid | 406.957 µs | 457.171 µs | 474.639 µs | 414.937 µs | 401.135 µs–435.704 µs | 5 | 500 | 50 | 285,868 | +960 | semantic DOM pass |
| Dioxus | Airbnb landing page | 919.679 µs | 961.087 µs | 982.853 µs | 923.952 µs | 909.575 µs–923.884 µs | 5 | 200 | 20 | 118,037 | +861 | shared showcase DOM/CSS pass |
| Dioxus | Nike catalog | 2.257 ms | 2.303 ms | 2.345 ms | 2.263 ms | 2.242 ms–2.266 ms | 5 | 200 | 20 | 128,297 | +586 | shared showcase DOM/CSS pass |
| Dioxus | GitHub PR review | 16.501 ms | 17.112 ms | 17.573 ms | 16.563 ms | 16.456 ms–16.797 ms | 5 | 100 | 10 | 601,612 | +3,781 | shared showcase DOM/CSS pass |
| Dioxus | Sentry logs | 22.888 ms | 23.516 ms | 23.887 ms | 22.959 ms | 22.790 ms–23.044 ms | 5 | 50 | 5 | 875,922 | +62 | shared showcase DOM/CSS pass |
| Dioxus | ESPN game page | 595.665 µs | 620.473 µs | 647.284 µs | 598.597 µs | 593.471 µs–597.638 µs | 5 | 200 | 20 | 32,877 | +31 | shared showcase DOM/CSS pass |
| Topcoat | Component page | 16.633 µs | 17.060 µs | 22.023 µs | 16.541 µs | 16.395 µs–16.764 µs | 5 | 2000 | 200 | 25,108 | +0 | semantic DOM pass |
| Topcoat | 1,000-row table | 1.503 ms | 1.797 ms | 1.825 ms | 1.577 ms | 1.499 ms–1.508 ms | 5 | 200 | 20 | 988,509 | +0 | semantic DOM pass |
| Topcoat | Product grid | 196.402 µs | 203.878 µs | 211.867 µs | 197.569 µs | 195.661 µs–199.007 µs | 5 | 500 | 50 | 284,908 | +0 | semantic DOM pass |
| Topcoat | Airbnb landing page | 336.264 µs | 352.277 µs | 385.808 µs | 338.522 µs | 333.226 µs–337.748 µs | 5 | 200 | 20 | 117,883 | +707 | shared showcase DOM/CSS pass |
| Topcoat | Nike catalog | 497.582 µs | 533.630 µs | 575.226 µs | 505.617 µs | 495.418 µs–509.977 µs | 5 | 200 | 20 | 127,822 | +111 | shared showcase DOM/CSS pass |
| Topcoat | GitHub PR review | 2.631 ms | 2.996 ms | 3.006 ms | 2.681 ms | 2.622 ms–2.636 ms | 5 | 100 | 10 | 598,922 | +1,091 | shared showcase DOM/CSS pass |
| Topcoat | Sentry logs | 4.460 ms | 4.815 ms | 4.848 ms | 4.527 ms | 4.455 ms–4.484 ms | 5 | 50 | 5 | 875,888 | +28 | shared showcase DOM/CSS pass |
| Topcoat | ESPN game page | 131.507 µs | 140.109 µs | 145.744 µs | 132.770 µs | 130.356 µs–133.119 µs | 5 | 200 | 20 | 32,868 | +22 | shared showcase DOM/CSS pass |
| Astro | Component page | 51.217 µs | 84.996 µs | 720.783 µs | 108.838 µs | 49.571 µs–51.992 µs | 5 | 2000 | 200 | 25,108 | +0 | semantic DOM pass |
| Astro | 1,000-row table | 3.123 ms | 6.392 ms | 8.204 ms | 3.745 ms | 2.912 ms–3.202 ms | 5 | 200 | 20 | 990,507 | +1,998 | semantic DOM pass |
| Astro | Product grid | 297.024 µs | 1.191 ms | 3.398 ms | 536.419 µs | 289.322 µs–297.511 µs | 5 | 500 | 50 | 285,868 | +960 | semantic DOM pass |
| Astro | Airbnb landing page | 627.057 µs | 5.622 ms | 8.923 ms | 1.428 ms | 601.229 µs–636.489 µs | 5 | 200 | 20 | 117,707 | +531 | shared showcase DOM/CSS pass |
| Astro | Nike catalog | 751.196 µs | 3.953 ms | 6.262 ms | 1.287 ms | 736.695 µs–774.499 µs | 5 | 200 | 20 | 128,069 | +358 | shared showcase DOM/CSS pass |
| Astro | GitHub PR review | 5.256 ms | 14.383 ms | 26.958 ms | 6.567 ms | 4.434 ms–5.567 ms | 5 | 100 | 10 | 601,482 | +3,651 | shared showcase DOM/CSS pass |
| Astro | Sentry logs | 17.413 ms | 50.245 ms | 57.442 ms | 20.651 ms | 16.170 ms–18.826 ms | 5 | 50 | 5 | 875,869 | +9 | shared showcase DOM/CSS pass |
| Astro | ESPN game page | 308.490 µs | 3.820 ms | 6.471 ms | 767.297 µs | 299.322 µs–317.201 µs | 5 | 200 | 20 | 32,821 | -25 | shared showcase DOM/CSS pass |
| SvelteKit | Component page | 11.960 µs | 18.901 µs | 29.369 µs | 31.402 µs | 11.553 µs–12.256 µs | 5 | 2000 | 200 | 25,770 | +662 | semantic DOM pass |
| SvelteKit | 1,000-row table | 1.595 ms | 4.912 ms | 6.649 ms | 2.522 ms | 1.527 ms–1.710 ms | 5 | 200 | 20 | 1,003,248 | +14,739 | semantic DOM pass |
| SvelteKit | Product grid | 92.035 µs | 183.437 µs | 3.372 ms | 223.915 µs | 88.644 µs–95.239 µs | 5 | 500 | 50 | 286,476 | +1,568 | semantic DOM pass |
| SvelteKit | Airbnb landing page | 89.452 µs | 205.867 µs | 5.794 ms | 273.225 µs | 87.165 µs–119.761 µs | 5 | 200 | 20 | 119,786 | +2,610 | shared showcase DOM/CSS pass |
| SvelteKit | Nike catalog | 149.988 µs | 879.715 µs | 3.792 ms | 322.413 µs | 141.075 µs–158.458 µs | 5 | 200 | 20 | 147,261 | +19,550 | shared showcase DOM/CSS pass |
| SvelteKit | GitHub PR review | 788.484 µs | 4.394 ms | 6.385 ms | 1.637 ms | 768.388 µs–796.257 µs | 5 | 100 | 10 | 675,254 | +77,423 | shared showcase DOM/CSS pass |
| SvelteKit | Sentry logs | 3.197 ms | 9.323 ms | 12.143 ms | 3.921 ms | 2.902 ms–3.406 ms | 5 | 50 | 5 | 1,118,556 | +242,696 | shared showcase DOM/CSS pass |
| SvelteKit | ESPN game page | 52.900 µs | 126.574 µs | 4.656 ms | 190.598 µs | 47.927 µs–57.921 µs | 5 | 200 | 20 | 36,201 | +3,355 | shared showcase DOM/CSS pass |
| Next.js | Component page | 77.227 µs | 119.446 µs | 1.425 ms | 150.451 µs | 74.891 µs–77.800 µs | 5 | 2000 | 200 | 25,201 | +93 | semantic DOM pass |
| Next.js | 1,000-row table | 5.112 ms | 20.304 ms | 28.680 ms | 8.115 ms | 5.042 ms–5.227 ms | 5 | 200 | 20 | 990,694 | +2,185 | semantic DOM pass |
| Next.js | Product grid | 430.251 µs | 2.555 ms | 4.614 ms | 786.218 µs | 423.500 µs–438.596 µs | 5 | 500 | 50 | 285,868 | +960 | semantic DOM pass |
| Next.js | Airbnb landing page | 620.004 µs | 6.728 ms | 33.442 ms | 2.255 ms | 611.032 µs–642.380 µs | 5 | 200 | 20 | 117,862 | +686 | shared showcase DOM/CSS pass |
| Next.js | Nike catalog | 646.542 µs | 6.682 ms | 26.028 ms | 2.078 ms | 630.402 µs–650.646 µs | 5 | 200 | 20 | 128,853 | +1,142 | shared showcase DOM/CSS pass |
| Next.js | GitHub PR review | 4.320 ms | 16.485 ms | 49.454 ms | 6.940 ms | 3.465 ms–4.659 ms | 5 | 100 | 10 | 601,633 | +3,802 | shared showcase DOM/CSS pass |
| Next.js | Sentry logs | 10.942 ms | 43.374 ms | 75.712 ms | 18.387 ms | 9.162 ms–16.761 ms | 5 | 50 | 5 | 875,888 | +28 | shared showcase DOM/CSS pass |
| Next.js | ESPN game page | 286.995 µs | 5.362 ms | 9.566 ms | 1.133 ms | 253.992 µs–296.041 µs | 5 | 200 | 20 | 33,334 | +488 | shared showcase DOM/CSS pass |
| Exact | Component page | 5.611 ms | 18.194 ms | 30.041 ms | 7.374 ms | 5.592 ms–5.620 ms | 5 | 2000 | 200 | 34,637 | +9,529 | adapted content and styles pass |
| Exact | 1,000-row table | 149.006 ms | 616.144 ms | 842.229 ms | 225.809 ms | 148.666 ms–152.274 ms | 5 | 200 | 20 | 1,025,844 | +37,335 | adapted content and styles pass |
| Exact | Product grid | 17.537 ms | 62.807 ms | 93.801 ms | 23.160 ms | 17.437 ms–17.565 ms | 5 | 500 | 50 | 261,879 | -23,029 | adapted content and styles pass |
| Exact | Airbnb landing page | 61.530 ms | 167.088 ms | 236.256 ms | 75.480 ms | 61.130 ms–61.643 ms | 5 | 200 | 20 | 634,312 | +517,136 | adapted business content and compiled native styles pass |
| Exact | Nike catalog | 99.474 ms | 272.065 ms | 350.477 ms | 125.109 ms | 98.292 ms–99.645 ms | 5 | 200 | 20 | 666,162 | +538,451 | adapted business content and compiled native styles pass |
| Exact | GitHub PR review | 442.867 ms | 1256.102 ms | 1562.339 ms | 575.706 ms | 441.988 ms–445.775 ms | 5 | 100 | 10 | 2,187,104 | +1,589,273 | adapted business content and compiled native styles pass |
| Exact | Sentry logs | 1412.060 ms | 4645.867 ms | 6520.992 ms | 2013.847 ms | 1382.896 ms–1430.092 ms | 5 | 50 | 5 | 8,959,674 | +8,083,814 | adapted business content and compiled native styles pass |
| Exact | ESPN game page | 43.675 ms | 124.321 ms | 186.016 ms | 54.870 ms | 43.605 ms–43.794 ms | 5 | 200 | 20 | 477,355 | +444,509 | adapted business content and compiled native styles pass |

### Tail observations

The report flags every cell whose process-median P95 is at least 3× its P50:

- Marko's 1,000-row table P95 was 3.20× its P50 (4.608 ms versus 1.439 ms).
- Marko's airbnb landing page P95 was 18.3× its P50 (3.305 ms versus 180.591 µs).
- Marko's nike catalog P95 was 18.3× its P50 (4.219 ms versus 230.529 µs).
- React's component page P95 was 7.20× its P50 (613.568 µs versus 85.273 µs).
- React's product grid P95 was 6.88× its P50 (3.022 ms versus 439.099 µs).
- React's airbnb landing page P95 was 11.4× its P50 (6.730 ms versus 590.599 µs).
- React's nike catalog P95 was 9.75× its P50 (6.137 ms versus 629.411 µs).
- React's github pr review P95 was 5.14× its P50 (16.766 ms versus 3.261 ms).
- React's sentry logs P95 was 4.18× its P50 (40.553 ms versus 9.713 ms).
- React's espn game page P95 was 19.7× its P50 (5.306 ms versus 268.738 µs).
- Vue's 1,000-row table P95 was 3.04× its P50 (4.911 ms versus 1.615 ms).
- Vue's product grid P95 was 4.14× its P50 (391.114 µs versus 94.365 µs).
- Vue's nike catalog P95 was 14.6× its P50 (1.819 ms versus 124.318 µs).
- Vue's github pr review P95 was 9.31× its P50 (10.248 ms versus 1.101 ms).
- Svelte's 1,000-row table P95 was 3.15× its P50 (4.861 ms versus 1.543 ms).
- Svelte's nike catalog P95 was 5.25× its P50 (722.353 µs versus 137.469 µs).
- Svelte's github pr review P95 was 6.60× its P50 (4.956 ms versus 750.837 µs).
- jte's 1,000-row table P95 was 3.64× its P50 (26.366 ms versus 7.250 ms).
- jte's product grid P95 was 5.89× its P50 (3.758 ms versus 637.504 µs).
- jte's airbnb landing page P95 was 16.3× its P50 (2.316 ms versus 141.710 µs).
- jte's nike catalog P95 was 9.85× its P50 (3.788 ms versus 384.662 µs).
- jte's github pr review P95 was 3.65× its P50 (7.629 ms versus 2.091 ms).
- Rocker's product grid P95 was 5.18× its P50 (4.164 ms versus 804.108 µs).
- Rocker's airbnb landing page P95 was 9.01× its P50 (4.579 ms versus 507.984 µs).
- Rocker's nike catalog P95 was 6.28× its P50 (4.203 ms versus 669.320 µs).
- Rocker's espn game page P95 was 15.1× its P50 (4.330 ms versus 287.009 µs).
- Handlebars's airbnb landing page P95 was 6.94× its P50 (3.432 ms versus 494.403 µs).
- Handlebars's nike catalog P95 was 4.20× its P50 (4.234 ms versus 1.008 ms).
- Handlebars's sentry logs P95 was 3.23× its P50 (47.637 ms versus 14.732 ms).
- Handlebars's espn game page P95 was 5.07× its P50 (1.877 ms versus 370.175 µs).
- Astro's product grid P95 was 4.01× its P50 (1.191 ms versus 297.024 µs).
- Astro's airbnb landing page P95 was 8.97× its P50 (5.622 ms versus 627.057 µs).
- Astro's nike catalog P95 was 5.26× its P50 (3.953 ms versus 751.196 µs).
- Astro's espn game page P95 was 12.4× its P50 (3.820 ms versus 308.490 µs).
- SvelteKit's 1,000-row table P95 was 3.08× its P50 (4.912 ms versus 1.595 ms).
- SvelteKit's nike catalog P95 was 5.87× its P50 (879.715 µs versus 149.988 µs).
- SvelteKit's github pr review P95 was 5.57× its P50 (4.394 ms versus 788.484 µs).
- Next.js's 1,000-row table P95 was 3.97× its P50 (20.304 ms versus 5.112 ms).
- Next.js's product grid P95 was 5.94× its P50 (2.555 ms versus 430.251 µs).
- Next.js's airbnb landing page P95 was 10.9× its P50 (6.728 ms versus 620.004 µs).
- Next.js's nike catalog P95 was 10.3× its P50 (6.682 ms versus 646.542 µs).
- Next.js's github pr review P95 was 3.82× its P50 (16.485 ms versus 4.320 ms).
- Next.js's sentry logs P95 was 3.96× its P50 (43.374 ms versus 10.942 ms).
- Next.js's espn game page P95 was 18.7× its P50 (5.362 ms versus 286.995 µs).
- Exact's component page P95 was 3.24× its P50 (18.194 ms versus 5.611 ms).
- Exact's 1,000-row table P95 was 4.14× its P50 (616.144 ms versus 149.006 ms).
- Exact's product grid P95 was 3.58× its P50 (62.807 ms versus 17.537 ms).
- Exact's sentry logs P95 was 3.29× its P50 (4645.867 ms versus 1412.060 ms).

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
- `"bun" "benchmarks/rendering/canonical/run.mjs" "--workloads" "cards" "--no-setup" "--out" "benchmarks/rendering/results/local/rss-cards.json"`
- `"bun" "benchmarks/rendering/canonical/run.mjs" "--workloads" "table" "--no-setup" "--out" "benchmarks/rendering/results/local/rss-table.json"`
- `"bun" "benchmarks/rendering/canonical/run.mjs" "--workloads" "products" "--no-setup" "--out" "benchmarks/rendering/results/local/rss-products.json"`
- `"bun" "benchmarks/rendering/canonical/run.mjs" "--workloads" "airbnb-home" "--no-setup" "--out" "benchmarks/rendering/results/local/rss-airbnb-home.json"`
- `"bun" "benchmarks/rendering/canonical/run.mjs" "--workloads" "nike-catalog" "--no-setup" "--out" "benchmarks/rendering/results/local/rss-nike-catalog.json"`
- `"bun" "benchmarks/rendering/canonical/run.mjs" "--workloads" "github-pr" "--no-setup" "--out" "benchmarks/rendering/results/local/rss-github-pr.json"`
- `"bun" "benchmarks/rendering/canonical/run.mjs" "--workloads" "sentry-otel" "--no-setup" "--out" "benchmarks/rendering/results/local/rss-sentry-otel.json"`
- `"bun" "benchmarks/rendering/canonical/run.mjs" "--workloads" "espn" "--no-setup" "--out" "benchmarks/rendering/results/local/rss-espn.json"`

### Known limitations

- Renderer-only latency excludes routing, middleware, databases, HTTP transfer, hydration, and network latency.
- Semantic DOM parity permits documented serializer metadata and whitespace differences; payload deltas remain visible.
- Exact uses the disclosed exact-native-v1 adaptation: named native styles, generated classes, text/list wrappers and separated table borders. Content, attributes, formatting and representative computed CSS are checked separately; strict DOM parity is not claimed. Fresh per-render VM/runtime initialization, prepared-input binding, DOM construction and HTML serialization are inside timing; source compilation and input-data construction are outside.
- Each workload compares all 21 renderers sequentially on one isolated physical GCP C4 host. Workloads use matching hardware/OS profiles on separate hosts; see workloadCaptures for their identities and dates.
- Peak RSS is the OS native-process lifetime high-water mark, including startup, prepared data, template initialization, warmup, rendering and output verification/destruction. It is not allocation per render. Each headline is the median of five independent process peaks.

### Raw and related evidence

- [Per-process summaries](../../benchmarks/rendering/results/raw/canonical-ssr-v1-2026-11-15T19-05-04-173Z-c9ebfde3/process-summaries.json.gz)
- [cards: original capture and raw processes](../../benchmarks/rendering/results/raw/canonical-ssr-v1-2026-11-15T19-05-04-173Z-c9ebfde3/shards/cards.json.gz)
- [Exact adapted cards stylesheet](../../benchmarks/rendering/results/raw/canonical-ssr-v1-2026-11-15T19-05-04-173Z-c9ebfde3/cards-exact.css)
- [table: original capture and raw processes](../../benchmarks/rendering/results/raw/canonical-ssr-v1-2026-11-15T19-05-04-173Z-c9ebfde3/shards/table.json.gz)
- [Exact adapted table stylesheet](../../benchmarks/rendering/results/raw/canonical-ssr-v1-2026-11-15T19-05-04-173Z-c9ebfde3/table-exact.css)
- [products: original capture and raw processes](../../benchmarks/rendering/results/raw/canonical-ssr-v1-2026-11-15T19-05-04-173Z-c9ebfde3/shards/products.json.gz)
- [Exact adapted products stylesheet](../../benchmarks/rendering/results/raw/canonical-ssr-v1-2026-11-15T19-05-04-173Z-c9ebfde3/products-exact.css)
- [airbnb-home: original capture and raw processes](../../benchmarks/rendering/results/raw/canonical-ssr-v1-2026-11-15T19-05-04-173Z-c9ebfde3/shards/airbnb-home.json.gz)
- [Exact adapted airbnb-home stylesheet](../../benchmarks/rendering/results/raw/canonical-ssr-v1-2026-11-15T19-05-04-173Z-c9ebfde3/airbnb-home-exact.css)
- [nike-catalog: original capture and raw processes](../../benchmarks/rendering/results/raw/canonical-ssr-v1-2026-11-15T19-05-04-173Z-c9ebfde3/shards/nike-catalog.json.gz)
- [Exact adapted nike-catalog stylesheet](../../benchmarks/rendering/results/raw/canonical-ssr-v1-2026-11-15T19-05-04-173Z-c9ebfde3/nike-catalog-exact.css)
- [github-pr: original capture and raw processes](../../benchmarks/rendering/results/raw/canonical-ssr-v1-2026-11-15T19-05-04-173Z-c9ebfde3/shards/github-pr.json.gz)
- [Exact adapted github-pr stylesheet](../../benchmarks/rendering/results/raw/canonical-ssr-v1-2026-11-15T19-05-04-173Z-c9ebfde3/github-pr-exact.css)
- [sentry-otel: original capture and raw processes](../../benchmarks/rendering/results/raw/canonical-ssr-v1-2026-11-15T19-05-04-173Z-c9ebfde3/shards/sentry-otel.json.gz)
- [Exact adapted sentry-otel stylesheet](../../benchmarks/rendering/results/raw/canonical-ssr-v1-2026-11-15T19-05-04-173Z-c9ebfde3/sentry-otel-exact.css)
- [espn: original capture and raw processes](../../benchmarks/rendering/results/raw/canonical-ssr-v1-2026-11-15T19-05-04-173Z-c9ebfde3/shards/espn.json.gz)
- [Exact adapted espn stylesheet](../../benchmarks/rendering/results/raw/canonical-ssr-v1-2026-11-15T19-05-04-173Z-c9ebfde3/espn-exact.css)

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
