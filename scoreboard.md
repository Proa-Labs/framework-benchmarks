# Canonical scoreboard evidence

Seventeen renderers turn the same prepared data into the same three pages, and the scoreboard times only that render. This page holds the [current result](#current-result), the [renderer coverage](#renderer-coverage), and the [complete canonical evidence](#complete-canonical-evidence) behind the [front page](README.md)'s figures.

## Current result

<!-- canonical-scoreboard:start -->

**November 12, 2026 · Intel(R) Xeon(R) 6985P-C CPU @ 2.30GHz · linux**

On these workloads, the November 12, 2026 capture on Intel(R) Xeon(R) 6985P-C CPU @ 2.30GHz measured Proa rendering the component page 62.0× faster than React, the 1,000-row table 27.9× faster than React, and the product grid 31.4× faster than React. These ratios describe this capture, not every application.

> Lower is better. Every listed renderer produced an equivalent page and passed the parity gate.

Each cell is `P50 render time · relative to Proa`.

| Renderer | Component page | 1,000-row table | Product grid |
| --- | ---: | ---: | ---: |
| Proa | 1.36 µs · 1.00× | 0.33 ms · 1.00× | 0.014 ms · 1.00× |
| Marko | 9.37 µs · 6.90× | 1.40 ms · 4.26× | 0.11 ms · 8.26× |
| React | 84.2 µs · 62.0× | 9.17 ms · 27.9× | 0.43 ms · 31.4× |
| Vue | 9.73 µs · 7.17× | 1.54 ms · 4.68× | 0.095 ms · 6.93× |
| Svelte | 8.68 µs · 6.39× | 1.52 ms · 4.63× | 0.092 ms · 6.76× |
| Rails | 76.5 µs · 56.3× | 8.75 ms · 26.6× | 0.46 ms · 33.8× |
| jte | 21.3 µs · 15.7× | 6.79 ms · 20.6× | 0.64 ms · 46.6× |
| Rocker | 35.4 µs · 26.1× | 9.48 ms · 28.8× | 0.73 ms · 53.6× |
| Handlebars | 30.0 µs · 22.1× | 4.03 ms · 12.2× | 0.24 ms · 17.8× |
| Go html/template | 141 µs · 103× | 14.1 ms · 43.0× | 1.15 ms · 84.2× |
| Jinja2 | 106 µs · 78.4× | 19.6 ms · 59.4× | 1.43 ms · 105× |
| PHP | 32.9 µs · 24.2× | 1.78 ms · 5.40× | 0.097 ms · 7.10× |
| Askama | 1.22 µs · 0.90× | 0.73 ms · 2.21× | 0.024 ms · 1.75× |
| Sailfish | 1.86 µs · 1.37× | 0.63 ms · 1.90× | 0.023 ms · 1.71× |
| Leptos | 16.9 µs · 12.5× | 1.68 ms · 5.11× | 0.25 ms · 18.6× |
| Dioxus | 164 µs · 121× | 3.40 ms · 10.3× | 0.41 ms · 30.2× |
| Topcoat | 16.5 µs · 12.2× | 1.45 ms · 4.42× | 0.19 ms · 14.1× |

Rows use the fixed order in [the canonical roster](rendering/canonical/roster.json); columns are never ranked independently.
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
| Proa | [`rendering/src/topcoat_product_grid.rs`](rendering/src/topcoat_product_grid.rs) | [`rendering/src/bin/proa_page_server.rs`](rendering/src/bin/proa_page_server.rs) |
| React | [`rendering/external/react/suite_components.mjs`](rendering/external/react/suite_components.mjs) | [`page-load/react_server.mjs`](page-load/react_server.mjs) |
| Marko | [`rendering/external/marko/suite_products.marko`](rendering/external/marko/suite_products.marko) | [`rendering/external/marko/page_server.mjs`](rendering/external/marko/page_server.mjs) |
| Go html/template | [`rendering/external/go/suite_bench.go`](rendering/external/go/suite_bench.go) | same file, `--serve` |
| Rails, jte, Rocker, Handlebars, Jinja2, PHP | [`rendering/external/`](rendering/external/) | scoreboard only |
| Askama, Sailfish, Leptos, Dioxus, Topcoat | [`rendering/src/`](rendering/src/) | scoreboard only |

The Proa product card is an ordinary typed component, and the React card is the same markup as `createElement` calls. Both are what a team would write, and both produce the same DOM:

```rust filename="rendering/src/topcoat_product_grid.rs"
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
| Proa | Included | All 3 workloads passed parity in this capture. |
| Marko | Included | All 3 workloads passed parity in this capture. |
| React | Included | All 3 workloads passed parity in this capture. |
| Vue | Included | All 3 workloads passed parity in this capture. |
| Svelte | Included | All 3 workloads passed parity in this capture. |
| Rails | Included | All 3 workloads passed parity in this capture. |
| jte | Included | All 3 workloads passed parity in this capture. |
| Rocker | Included | All 3 workloads passed parity in this capture. |
| Handlebars | Included | All 3 workloads passed parity in this capture. |
| Go html/template | Included | All 3 workloads passed parity in this capture. |
| Jinja2 | Included | All 3 workloads passed parity in this capture. |
| PHP | Included | All 3 workloads passed parity in this capture. |
| Askama | Included | All 3 workloads passed parity in this capture. |
| Sailfish | Included | All 3 workloads passed parity in this capture. |
| Leptos | Included | All 3 workloads passed parity in this capture. |
| Dioxus | Included | All 3 workloads passed parity in this capture. |
| Topcoat | Included | All 3 workloads passed parity in this capture. |
<!-- canonical-coverage:end -->

Every retained percentile, payload, digest, version, and limitation follows in [Complete canonical evidence](#complete-canonical-evidence).

## Complete canonical evidence

The scoreboard's own result JSON generates this section.

[![P50 to P95 range for every renderer and workload in the canonical capture](charts/svg/02-canonical-tail-dispersion.svg)](charts/svg/02-canonical-tail-dispersion.svg)

*Median against tail. A long bar is an unstable renderer, not a slow one; Marko's 1,000-row table is the capture's single flagged cell at 14.5× its own median. Drawn from [Detailed measurements](#detailed-measurements) · [Full size](charts/svg/02-canonical-tail-dispersion.svg) · [how the figures are built](charts/)*

<!-- canonical-details:start -->
### Capture metadata

- Capture: `canonical-ssr-v1-2026-11-12T18-15-51-626Z-a60d525e`
- Captured: 2026-11-12T18:15:51.626Z
- Completed: 2026-11-12T18:19:09.390Z
- Host: Intel(R) Xeon(R) 6985P-C CPU @ 2.30GHz, 16 logical CPUs, 63200763904 bytes RAM
- OS: linux (6.12.105+), x64
- Proa output: Fresh owned RenderBuffer per iteration. Allocation and rendering are timed; flattening/copying, encoding, parity, hashing and output destruction are outside the render timer.
- Harness commit: `cd1d0f94546c51fd2028fb1fb4e70ba0aee45d4a` (dirty; source digest retained)
- Canonical source SHA-256: `0d27bbe7be11d2a2496d833c3b66ff6f8e142907672267a1271f493b2c93de99`

### Detailed measurements

| Renderer | Workload | P50 | P95 | P99 | Mean | Process P50 range | Processes | Samples/process | Warmups/process | Payload bytes | Payload Δ vs Proa | Parity |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Proa | Component page | 1.358 µs | 1.393 µs | 1.477 µs | 1.375 µs | 1.342 µs–1.368 µs | 5 | 2000 | 200 | 25,108 | +0 | semantic DOM pass |
| Proa | 1,000-row table | 329.238 µs | 362.321 µs | 372.177 µs | 336.154 µs | 325.875 µs–335.704 µs | 5 | 200 | 20 | 988,509 | +0 | semantic DOM pass |
| Proa | Product grid | 13.661 µs | 13.930 µs | 20.172 µs | 13.769 µs | 13.579 µs–13.722 µs | 5 | 500 | 50 | 284,908 | +0 | semantic DOM pass |
| Marko | Component page | 9.373 µs | 23.540 µs | 35.541 µs | 24.888 µs | 9.218 µs–10.006 µs | 5 | 2000 | 200 | 24,038 | -1,070 | semantic DOM pass |
| Marko | 1,000-row table | 1.402 ms | 4.588 ms | 6.603 ms | 2.005 ms | 1.330 ms–1.419 ms | 5 | 200 | 20 | 983,187 | -5,322 | semantic DOM pass |
| Marko | Product grid | 112.802 µs | 190.649 µs | 3.174 ms | 200.859 µs | 111.073 µs–113.812 µs | 5 | 500 | 50 | 282,604 | -2,304 | semantic DOM pass |
| React | Component page | 84.156 µs | 589.850 µs | 3.130 ms | 211.508 µs | 81.173 µs–87.138 µs | 5 | 2000 | 200 | 25,202 | +94 | semantic DOM pass |
| React | 1,000-row table | 9.174 ms | 20.102 ms | 32.755 ms | 10.136 ms | 8.209 ms–10.234 ms | 5 | 200 | 20 | 990,695 | +2,186 | semantic DOM pass |
| React | Product grid | 428.876 µs | 3.005 ms | 11.047 ms | 1.140 ms | 425.697 µs–451.355 µs | 5 | 500 | 50 | 285,868 | +960 | semantic DOM pass |
| Vue | Component page | 9.731 µs | 22.055 µs | 41.836 µs | 31.391 µs | 9.149 µs–10.401 µs | 5 | 2000 | 200 | 25,700 | +592 | semantic DOM pass |
| Vue | 1,000-row table | 1.542 ms | 4.807 ms | 8.889 ms | 2.315 ms | 1.524 ms–1.555 ms | 5 | 200 | 20 | 1,006,523 | +18,014 | semantic DOM pass |
| Vue | Product grid | 94.683 µs | 335.183 µs | 5.070 ms | 276.998 µs | 91.877 µs–95.329 µs | 5 | 500 | 50 | 287,420 | +2,512 | semantic DOM pass |
| Svelte | Component page | 8.681 µs | 26.202 µs | 42.540 µs | 23.734 µs | 8.657 µs–8.858 µs | 5 | 2000 | 200 | 25,748 | +640 | semantic DOM pass |
| Svelte | 1,000-row table | 1.525 ms | 4.620 ms | 6.764 ms | 2.303 ms | 1.397 ms–1.671 ms | 5 | 200 | 20 | 1,003,227 | +14,718 | semantic DOM pass |
| Svelte | Product grid | 92.341 µs | 203.734 µs | 3.129 ms | 224.298 µs | 91.532 µs–95.612 µs | 5 | 500 | 50 | 286,476 | +1,568 | semantic DOM pass |
| Rails | Component page | 76.452 µs | 101.129 µs | 427.640 µs | 87.002 µs | 75.540 µs–77.326 µs | 5 | 2000 | 200 | 35,839 | +10,731 | semantic DOM pass |
| Rails | 1,000-row table | 8.750 ms | 9.506 ms | 9.617 ms | 8.885 ms | 8.720 ms–9.130 ms | 5 | 200 | 20 | 1,228,793 | +240,284 | semantic DOM pass |
| Rails | Product grid | 461.368 µs | 783.712 µs | 1.886 ms | 531.074 µs | 454.398 µs–470.156 µs | 5 | 500 | 50 | 296,823 | +11,915 | semantic DOM pass |
| jte | Component page | 21.291 µs | 27.860 µs | 165.478 µs | 49.822 µs | 21.044 µs–22.410 µs | 5 | 2000 | 200 | 25,109 | +1 | semantic DOM pass |
| jte | 1,000-row table | 6.794 ms | 20.653 ms | 25.658 ms | 8.269 ms | 6.737 ms–7.466 ms | 5 | 200 | 20 | 988,510 | +1 | semantic DOM pass |
| jte | Product grid | 636.362 µs | 3.813 ms | 4.507 ms | 1.241 ms | 622.591 µs–680.343 µs | 5 | 500 | 50 | 284,909 | +1 | semantic DOM pass |
| Rocker | Component page | 35.403 µs | 48.203 µs | 3.057 ms | 75.169 µs | 35.299 µs–35.688 µs | 5 | 2000 | 200 | 25,109 | +1 | semantic DOM pass |
| Rocker | 1,000-row table | 9.480 ms | 20.681 ms | 35.834 ms | 9.857 ms | 8.359 ms–10.541 ms | 5 | 200 | 20 | 990,508 | +1,999 | semantic DOM pass |
| Rocker | Product grid | 732.675 µs | 4.147 ms | 5.120 ms | 1.549 ms | 686.324 µs–897.557 µs | 5 | 500 | 50 | 285,869 | +961 | semantic DOM pass |
| Handlebars | Component page | 29.961 µs | 50.206 µs | 188.119 µs | 50.344 µs | 25.797 µs–35.549 µs | 5 | 2000 | 200 | 25,108 | +0 | semantic DOM pass |
| Handlebars | 1,000-row table | 4.029 ms | 6.405 ms | 11.894 ms | 4.706 ms | 4.004 ms–4.099 ms | 5 | 200 | 20 | 990,694 | +2,185 | semantic DOM pass |
| Handlebars | Product grid | 243.700 µs | 588.630 µs | 3.380 ms | 432.371 µs | 209.981 µs–248.046 µs | 5 | 500 | 50 | 285,868 | +960 | semantic DOM pass |
| Go html/template | Component page | 140.513 µs | 220.544 µs | 231.184 µs | 159.633 µs | 140.272 µs–140.933 µs | 5 | 2000 | 200 | 25,108 | +0 | semantic DOM pass |
| Go html/template | 1,000-row table | 14.144 ms | 14.551 ms | 15.238 ms | 14.174 ms | 14.137 ms–14.225 ms | 5 | 200 | 20 | 990,509 | +2,000 | semantic DOM pass |
| Go html/template | Product grid | 1.150 ms | 1.202 ms | 1.307 ms | 1.151 ms | 1.147 ms–1.152 ms | 5 | 500 | 50 | 285,676 | +768 | semantic DOM pass |
| Jinja2 | Component page | 106.400 µs | 113.698 µs | 117.328 µs | 106.832 µs | 104.487 µs–107.005 µs | 5 | 2000 | 200 | 25,108 | +0 | semantic DOM pass |
| Jinja2 | 1,000-row table | 19.554 ms | 20.283 ms | 22.561 ms | 19.668 ms | 18.803 ms–19.692 ms | 5 | 200 | 20 | 990,257 | +1,748 | semantic DOM pass |
| Jinja2 | Product grid | 1.435 ms | 1.458 ms | 1.482 ms | 1.434 ms | 1.419 ms–1.437 ms | 5 | 500 | 50 | 285,676 | +768 | semantic DOM pass |
| PHP | Component page | 32.880 µs | 36.819 µs | 39.988 µs | 33.304 µs | 32.784 µs–33.141 µs | 5 | 2000 | 200 | 25,108 | +0 | semantic DOM pass |
| PHP | 1,000-row table | 1.777 ms | 1.816 ms | 1.831 ms | 1.779 ms | 1.764 ms–1.828 ms | 5 | 200 | 20 | 990,694 | +2,185 | semantic DOM pass |
| PHP | Product grid | 97.060 µs | 106.456 µs | 110.305 µs | 98.082 µs | 94.180 µs–99.100 µs | 5 | 500 | 50 | 285,868 | +960 | semantic DOM pass |
| Askama | Component page | 1.217 µs | 1.241 µs | 1.277 µs | 1.236 µs | 1.194 µs–1.226 µs | 5 | 2000 | 200 | 44,849 | +19,741 | semantic DOM pass |
| Askama | 1,000-row table | 726.769 µs | 749.156 µs | 760.268 µs | 728.031 µs | 720.740 µs–747.341 µs | 5 | 200 | 20 | 991,007 | +2,498 | semantic DOM pass |
| Askama | Product grid | 23.940 µs | 24.632 µs | 31.315 µs | 24.306 µs | 23.655 µs–24.089 µs | 5 | 500 | 50 | 285,676 | +768 | semantic DOM pass |
| Sailfish | Component page | 1.861 µs | 1.937 µs | 1.999 µs | 1.899 µs | 1.850 µs–1.874 µs | 5 | 2000 | 200 | 44,849 | +19,741 | semantic DOM pass |
| Sailfish | 1,000-row table | 625.528 µs | 643.216 µs | 668.079 µs | 625.936 µs | 620.776 µs–628.489 µs | 5 | 200 | 20 | 990,694 | +2,185 | semantic DOM pass |
| Sailfish | Product grid | 23.293 µs | 23.976 µs | 30.491 µs | 23.566 µs | 23.255 µs–23.466 µs | 5 | 500 | 50 | 285,868 | +960 | semantic DOM pass |
| Leptos | Component page | 16.935 µs | 17.298 µs | 23.404 µs | 17.107 µs | 16.867 µs–16.974 µs | 5 | 2000 | 200 | 25,219 | +111 | semantic DOM pass |
| Leptos | 1,000-row table | 1.683 ms | 1.718 ms | 1.750 ms | 1.685 ms | 1.679 ms–1.795 ms | 5 | 200 | 20 | 991,512 | +3,003 | semantic DOM pass |
| Leptos | Product grid | 253.971 µs | 261.462 µs | 266.164 µs | 255.653 µs | 252.912 µs–254.255 µs | 5 | 500 | 50 | 286,063 | +1,155 | semantic DOM pass |
| Dioxus | Component page | 163.779 µs | 173.026 µs | 176.479 µs | 164.155 µs | 163.413 µs–165.139 µs | 5 | 2000 | 200 | 25,141 | +33 | semantic DOM pass |
| Dioxus | 1,000-row table | 3.405 ms | 3.558 ms | 3.637 ms | 3.412 ms | 3.307 ms–3.568 ms | 5 | 200 | 20 | 990,695 | +2,186 | semantic DOM pass |
| Dioxus | Product grid | 412.352 µs | 463.637 µs | 476.399 µs | 420.586 µs | 404.286 µs–441.181 µs | 5 | 500 | 50 | 285,868 | +960 | semantic DOM pass |
| Topcoat | Component page | 16.516 µs | 16.955 µs | 22.210 µs | 16.422 µs | 16.453 µs–16.604 µs | 5 | 2000 | 200 | 25,108 | +0 | semantic DOM pass |
| Topcoat | 1,000-row table | 1.454 ms | 1.744 ms | 1.766 ms | 1.535 ms | 1.442 ms–1.481 ms | 5 | 200 | 20 | 988,509 | +0 | semantic DOM pass |
| Topcoat | Product grid | 192.659 µs | 199.557 µs | 204.006 µs | 193.651 µs | 192.173 µs–194.113 µs | 5 | 500 | 50 | 284,908 | +0 | semantic DOM pass |

### Tail observations

The report flags every cell whose process-median P95 is at least 3× its P50:

- Marko's 1,000-row table P95 was 3.27× its P50 (4.588 ms versus 1.402 ms).
- React's component page P95 was 7.01× its P50 (589.850 µs versus 84.156 µs).
- React's product grid P95 was 7.01× its P50 (3.005 ms versus 428.876 µs).
- Vue's 1,000-row table P95 was 3.12× its P50 (4.807 ms versus 1.542 ms).
- Vue's product grid P95 was 3.54× its P50 (335.183 µs versus 94.683 µs).
- Svelte's component page P95 was 3.02× its P50 (26.202 µs versus 8.681 µs).
- Svelte's 1,000-row table P95 was 3.03× its P50 (4.620 ms versus 1.525 ms).
- jte's 1,000-row table P95 was 3.04× its P50 (20.653 ms versus 6.794 ms).
- jte's product grid P95 was 5.99× its P50 (3.813 ms versus 636.362 µs).
- Rocker's product grid P95 was 5.66× its P50 (4.147 ms versus 732.675 µs).

### Parity

Chromium parses every untimed dump. The gate requires identical elements, non-class attributes, class membership, visible text, and body order. It ignores renderer-internal comments, resource-preload hints, non-semantic `<head>` order, class-token order, and adjacent hydration-split text nodes. The timed response is never normalized.

| Workload | Canonical DOM SHA-256 | Exact-byte matches |
| --- | --- | ---: |
| Component page | `43c50a97024231d49639400a5bfb18df7dbe5e94068cd42a732cea26ed0188b4` | 6/17 |
| 1,000-row table | `ba9bb6481cefab9898ff8c7d6c31405f3379c3ddaede2690e5c70ef46473356b` | 2/17 |
| Product grid | `5c89ccf8708043183838767b4bf61a68d9afc8bbf78830dc8886a851be162cfe` | 2/17 |

### Renderer and runtime versions

| Renderer/runtime | Version |
| --- | --- |
| Proa | 0.4.0 @ bbbc9684335109949257eea8b4c98bb7bc8572ae / rustc 1.95.0 (59807616e 2026-04-14) |
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

### Reproduction

```sh
./rendering/run-all
```

The runner builds every fixed-roster adapter, runs the complete parity matrix, stops before timing if any cell fails, rotates renderer process order, records per-process summaries, writes `latest.json`, and generates this report and the README tables.

Full commands recorded by the capture:

- `bun install --frozen-lockfile (JavaScript adapter directories)`
- `bundle check || bundle install (Rails adapter directory)`
- `cargo build --locked --release -p proa_bench --features topcoat --bin representative_suite_bench`
- `go build -trimpath -o rendering/external/go/build/canonical_suite rendering/external/go/suite_bench.go`
- `python3 -m venv rendering/external/jinja/.venv && pip install -r rendering/external/jinja/requirements.txt`
- `gradle --no-daemon --quiet installDist copyJteBinaryStaticContent (jte adapter directory)`
- `gradle --no-daemon --quiet installDist (Rocker adapter directory)`
- `"bun" "rendering/canonical/run.mjs" "--no-setup"`

### Known limitations

- Renderer-only latency excludes routing, middleware, databases, HTTP transfer, hydration, and network latency.
- Semantic DOM parity permits documented serializer metadata and whitespace differences; payload deltas remain visible.
- This capture describes one machine and these three workloads; it is not a universal application ranking.

### Raw and related evidence

- [Per-process summaries](rendering/results/raw/canonical-ssr-v1-2026-11-12T18-15-51-626Z-a60d525e/process-summaries.json)
- [Result-table migration map](rendering/MIGRATION.md)

Allocation measurements and construction-path controls remain separate from this renderer scoreboard. They are embedded below the scoreboard in the root README and retained in the [engineering reports](rendering/engineering/README.md).

<!-- canonical-details:end -->

## Next steps

- [Front page](README.md)
  - The four figures and the reasons to trust them.
- [HTTP capacity, cold start and streaming](http-capacity.md)
  - What one core of each production server sustains, and what a fresh process costs.
- [Engineering, application and agent captures](engineering.md)
  - Product-grid scaling, the memcpy floor, Proa's buffer allocation, and the archived August report.
- [Canonical benchmark protocol](rendering/protocol.md)
  - The parity gate, the fairness rules, and the workload shapes in full.
- [Rendering suite](rendering/)
  - The adapters, the runner, and the engineering laboratory behind the scoreboard.
