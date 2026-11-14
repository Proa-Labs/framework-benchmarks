# Canonical rendering result

> Current canonical capture.

- Capture: `canonical-ssr-v1-2026-11-14T18-20-35-163Z-22e9b54c`
- Captured: 2026-11-14T18:20:35.163Z
- Completed: 2026-11-14T18:31:32.528Z
- Host: Intel(R) Xeon(R) 6985P-C CPU @ 2.30GHz, 16 logical CPUs, 63200768000 bytes RAM
- OS: linux (6.12.105+), x64
- Proa output: Fresh owned RenderBuffer per iteration. Allocation and rendering are timed; flattening/copying, encoding, parity, hashing and output destruction are outside the render timer.
- Harness commit: `aeecfd7b6de3404d275be68e5ed3ef7c9224ce76`
- Canonical source SHA-256: `32238acd12805bf5f979fa43902a13f2783928fab3ecafe6aff53d3f3d3ea6ea`

## Public scoreboard

On these workloads, the November 14, 2026 capture on Intel(R) Xeon(R) 6985P-C CPU @ 2.30GHz measured Proa rendering the component page 78.2× faster than React, the 1,000-row table 40.3× faster than React, and the product grid 36.1× faster than React. These ratios describe this capture, not every application.

> Lower is better. Strict rows pass unchanged DOM/class parity. Exact† uses an explicitly adapted fixture with equivalent content and native styles; its HTML differs. See [adaptation details](https://github.com/Proa-Labs/framework-benchmarks/blob/aeecfd7b6de3404d275be68e5ed3ef7c9224ce76/benchmarks/rendering/external/exact/README.md).

| Renderer | Component page | 1,000-row table | Product grid |
| --- | ---: | ---: | ---: |
| Proa | 0.001 ms · 1.00× | 0.25 ms · 1.00× | 0.013 ms · 1.00× |
| Marko | 0.010 ms · 9.24× | 1.50 ms · 5.98× | 0.11 ms · 8.93× |
| React | 0.087 ms · 78.2× | 10.1 ms · 40.3× | 0.45 ms · 36.1× |
| Vue | 0.010 ms · 9.18× | 1.63 ms · 6.51× | 0.094 ms · 7.49× |
| Svelte | 0.009 ms · 8.41× | 1.60 ms · 6.36× | 0.096 ms · 7.64× |
| Rails | 0.080 ms · 71.9× | 9.06 ms · 36.1× | 0.48 ms · 38.5× |
| jte | 0.017 ms · 15.6× | 6.95 ms · 27.7× | 0.64 ms · 50.6× |
| Rocker | 0.037 ms · 33.2× | 10.1 ms · 40.1× | 0.81 ms · 64.1× |
| Handlebars | 0.026 ms · 23.8× | 4.18 ms · 16.6× | 0.21 ms · 17.0× |
| Go html/template | 0.14 ms · 129× | 14.3 ms · 56.8× | 1.16 ms · 92.2× |
| Jinja2 | 0.11 ms · 96.7× | 19.2 ms · 76.5× | 1.47 ms · 117× |
| PHP | 0.034 ms · 30.4× | 1.78 ms · 7.11× | 0.098 ms · 7.81× |
| Askama | 0.001 ms · 1.11× | 0.75 ms · 3.01× | 0.024 ms · 1.94× |
| Sailfish | 0.002 ms · 1.72× | 0.62 ms · 2.45× | 0.024 ms · 1.89× |
| Leptos | 0.019 ms · 16.7× | 1.81 ms · 7.21× | 0.27 ms · 21.4× |
| Dioxus | 0.17 ms · 149× | 3.48 ms · 13.9× | 0.42 ms · 33.6× |
| Topcoat | 0.016 ms · 14.6× | 1.45 ms · 5.79× | 0.20 ms · 15.7× |
| Astro | 0.051 ms · 46.1× | 3.00 ms · 11.9× | 0.30 ms · 23.7× |
| SvelteKit | 0.012 ms · 10.7× | 1.58 ms · 6.29× | 0.093 ms · 7.43× |
| Next.js | 0.075 ms · 68.0× | 5.24 ms · 20.9× | 0.44 ms · 34.8× |
| Exact† | 5.59 ms · 5039× | 149 ms · 596× | 17.5 ms · 1391× |

## Detailed measurements

| Renderer | Workload | P50 | P95 | P99 | Mean | Process P50 range | Processes | Samples/process | Warmups/process | Payload bytes | Payload Δ vs Proa | Parity |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Proa | Component page | 1.110 µs | 1.157 µs | 1.202 µs | 1.120 µs | 1.078 µs–1.142 µs | 5 | 2000 | 200 | 25,108 | +0 | semantic DOM pass |
| Proa | 1,000-row table | 250.952 µs | 274.317 µs | 284.846 µs | 255.743 µs | 248.429 µs–253.380 µs | 5 | 200 | 20 | 988,509 | +0 | semantic DOM pass |
| Proa | Product grid | 12.572 µs | 12.817 µs | 18.248 µs | 12.663 µs | 12.353 µs–12.800 µs | 5 | 500 | 50 | 284,908 | +0 | semantic DOM pass |
| Marko | Component page | 10.260 µs | 23.969 µs | 34.540 µs | 26.037 µs | 9.835 µs–11.108 µs | 5 | 2000 | 200 | 24,038 | -1,070 | semantic DOM pass |
| Marko | 1,000-row table | 1.499 ms | 4.839 ms | 6.947 ms | 2.134 ms | 1.404 ms–1.617 ms | 5 | 200 | 20 | 983,187 | -5,322 | semantic DOM pass |
| Marko | Product grid | 112.243 µs | 198.653 µs | 3.183 ms | 203.677 µs | 110.738 µs–119.058 µs | 5 | 500 | 50 | 282,604 | -2,304 | semantic DOM pass |
| React | Component page | 86.808 µs | 602.818 µs | 3.184 ms | 227.796 µs | 84.278 µs–93.404 µs | 5 | 2000 | 200 | 25,202 | +94 | semantic DOM pass |
| React | 1,000-row table | 10.110 ms | 20.646 ms | 35.220 ms | 10.682 ms | 9.338 ms–12.415 ms | 5 | 200 | 20 | 990,695 | +2,186 | semantic DOM pass |
| React | Product grid | 453.976 µs | 3.095 ms | 10.168 ms | 1.223 ms | 433.633 µs–491.103 µs | 5 | 500 | 50 | 285,868 | +960 | semantic DOM pass |
| Vue | Component page | 10.192 µs | 23.067 µs | 38.223 µs | 35.567 µs | 10.015 µs–10.905 µs | 5 | 2000 | 200 | 25,700 | +592 | semantic DOM pass |
| Vue | 1,000-row table | 1.633 ms | 4.838 ms | 9.581 ms | 2.447 ms | 1.585 ms–1.685 ms | 5 | 200 | 20 | 1,006,523 | +18,014 | semantic DOM pass |
| Vue | Product grid | 94.155 µs | 329.729 µs | 4.551 ms | 283.126 µs | 90.877 µs–102.694 µs | 5 | 500 | 50 | 287,420 | +2,512 | semantic DOM pass |
| Svelte | Component page | 9.338 µs | 25.121 µs | 47.388 µs | 26.888 µs | 8.873 µs–10.265 µs | 5 | 2000 | 200 | 25,748 | +640 | semantic DOM pass |
| Svelte | 1,000-row table | 1.596 ms | 5.583 ms | 8.476 ms | 2.578 ms | 1.495 ms–1.722 ms | 5 | 200 | 20 | 1,003,227 | +14,718 | semantic DOM pass |
| Svelte | Product grid | 96.099 µs | 250.932 µs | 3.156 ms | 231.720 µs | 95.074 µs–109.220 µs | 5 | 500 | 50 | 286,476 | +1,568 | semantic DOM pass |
| Rails | Component page | 79.856 µs | 104.799 µs | 606.787 µs | 95.143 µs | 78.117 µs–80.529 µs | 5 | 2000 | 200 | 35,839 | +10,731 | semantic DOM pass |
| Rails | 1,000-row table | 9.062 ms | 9.700 ms | 9.814 ms | 8.959 ms | 8.878 ms–9.545 ms | 5 | 200 | 20 | 1,228,793 | +240,284 | semantic DOM pass |
| Rails | Product grid | 484.173 µs | 818.716 µs | 2.243 ms | 566.296 µs | 462.745 µs–540.213 µs | 5 | 500 | 50 | 296,823 | +11,915 | semantic DOM pass |
| jte | Component page | 17.323 µs | 25.450 µs | 57.960 µs | 43.842 µs | 14.664 µs–23.622 µs | 5 | 2000 | 200 | 25,109 | +1 | semantic DOM pass |
| jte | 1,000-row table | 6.949 ms | 19.052 ms | 28.204 ms | 8.716 ms | 6.783 ms–7.835 ms | 5 | 200 | 20 | 988,510 | +1 | semantic DOM pass |
| jte | Product grid | 636.346 µs | 3.734 ms | 4.442 ms | 1.249 ms | 628.676 µs–651.367 µs | 5 | 500 | 50 | 284,909 | +1 | semantic DOM pass |
| Rocker | Component page | 36.825 µs | 45.515 µs | 3.052 ms | 79.507 µs | 36.150 µs–37.318 µs | 5 | 2000 | 200 | 25,109 | +1 | semantic DOM pass |
| Rocker | 1,000-row table | 10.064 ms | 21.468 ms | 34.392 ms | 9.892 ms | 8.199 ms–10.771 ms | 5 | 200 | 20 | 990,508 | +1,999 | semantic DOM pass |
| Rocker | Product grid | 805.506 µs | 4.171 ms | 4.779 ms | 1.722 ms | 788.672 µs–979.088 µs | 5 | 500 | 50 | 285,869 | +961 | semantic DOM pass |
| Handlebars | Component page | 26.395 µs | 42.993 µs | 173.854 µs | 48.551 µs | 25.213 µs–32.510 µs | 5 | 2000 | 200 | 25,108 | +0 | semantic DOM pass |
| Handlebars | 1,000-row table | 4.175 ms | 6.586 ms | 15.804 ms | 4.880 ms | 4.084 ms–4.355 ms | 5 | 200 | 20 | 990,694 | +2,185 | semantic DOM pass |
| Handlebars | Product grid | 213.544 µs | 631.691 µs | 3.363 ms | 422.520 µs | 209.317 µs–265.361 µs | 5 | 500 | 50 | 285,868 | +960 | semantic DOM pass |
| Go html/template | Component page | 143.496 µs | 226.571 µs | 236.523 µs | 163.598 µs | 141.820 µs–144.667 µs | 5 | 2000 | 200 | 25,108 | +0 | semantic DOM pass |
| Go html/template | 1,000-row table | 14.261 ms | 14.834 ms | 15.729 ms | 14.309 ms | 14.223 ms–14.325 ms | 5 | 200 | 20 | 990,509 | +2,000 | semantic DOM pass |
| Go html/template | Product grid | 1.159 ms | 1.226 ms | 1.334 ms | 1.165 ms | 1.158 ms–1.160 ms | 5 | 500 | 50 | 285,676 | +768 | semantic DOM pass |
| Jinja2 | Component page | 107.303 µs | 115.100 µs | 118.328 µs | 107.907 µs | 105.097 µs–110.090 µs | 5 | 2000 | 200 | 25,108 | +0 | semantic DOM pass |
| Jinja2 | 1,000-row table | 19.189 ms | 20.544 ms | 23.732 ms | 19.392 ms | 18.809 ms–19.465 ms | 5 | 200 | 20 | 990,257 | +1,748 | semantic DOM pass |
| Jinja2 | Product grid | 1.475 ms | 1.512 ms | 1.546 ms | 1.476 ms | 1.444 ms–1.484 ms | 5 | 500 | 50 | 285,676 | +768 | semantic DOM pass |
| PHP | Component page | 33.755 µs | 37.650 µs | 40.470 µs | 34.215 µs | 33.529 µs–34.273 µs | 5 | 2000 | 200 | 25,108 | +0 | semantic DOM pass |
| PHP | 1,000-row table | 1.783 ms | 1.839 ms | 1.879 ms | 1.785 ms | 1.775 ms–1.824 ms | 5 | 200 | 20 | 990,694 | +2,185 | semantic DOM pass |
| PHP | Product grid | 98.187 µs | 106.787 µs | 109.868 µs | 99.585 µs | 97.184 µs–101.325 µs | 5 | 500 | 50 | 285,868 | +960 | semantic DOM pass |
| Askama | Component page | 1.230 µs | 1.256 µs | 1.275 µs | 1.241 µs | 1.224 µs–1.247 µs | 5 | 2000 | 200 | 44,849 | +19,741 | semantic DOM pass |
| Askama | 1,000-row table | 754.548 µs | 778.485 µs | 798.588 µs | 756.687 µs | 749.004 µs–758.246 µs | 5 | 200 | 20 | 991,007 | +2,498 | semantic DOM pass |
| Askama | Product grid | 24.376 µs | 25.187 µs | 31.264 µs | 24.721 µs | 24.253 µs–24.551 µs | 5 | 500 | 50 | 285,676 | +768 | semantic DOM pass |
| Sailfish | Component page | 1.904 µs | 2.061 µs | 2.166 µs | 1.964 µs | 1.882 µs–1.938 µs | 5 | 2000 | 200 | 44,849 | +19,741 | semantic DOM pass |
| Sailfish | 1,000-row table | 615.808 µs | 645.262 µs | 666.069 µs | 617.033 µs | 613.438 µs–622.859 µs | 5 | 200 | 20 | 990,694 | +2,185 | semantic DOM pass |
| Sailfish | Product grid | 23.739 µs | 24.975 µs | 30.528 µs | 24.025 µs | 23.556 µs–23.828 µs | 5 | 500 | 50 | 285,868 | +960 | semantic DOM pass |
| Leptos | Component page | 18.564 µs | 19.074 µs | 24.850 µs | 18.768 µs | 18.541 µs–18.623 µs | 5 | 2000 | 200 | 25,219 | +111 | semantic DOM pass |
| Leptos | 1,000-row table | 1.810 ms | 1.857 ms | 1.878 ms | 1.813 ms | 1.795 ms–1.818 ms | 5 | 200 | 20 | 991,512 | +3,003 | semantic DOM pass |
| Leptos | Product grid | 268.464 µs | 276.421 µs | 282.101 µs | 268.893 µs | 266.235 µs–269.338 µs | 5 | 500 | 50 | 286,063 | +1,155 | semantic DOM pass |
| Dioxus | Component page | 165.068 µs | 174.474 µs | 178.073 µs | 166.159 µs | 163.843 µs–171.034 µs | 5 | 2000 | 200 | 25,141 | +33 | semantic DOM pass |
| Dioxus | 1,000-row table | 3.479 ms | 3.667 ms | 3.770 ms | 3.484 ms | 3.470 ms–3.531 ms | 5 | 200 | 20 | 990,695 | +2,186 | semantic DOM pass |
| Dioxus | Product grid | 423.010 µs | 490.885 µs | 501.742 µs | 435.628 µs | 413.524 µs–454.335 µs | 5 | 500 | 50 | 285,868 | +960 | semantic DOM pass |
| Topcoat | Component page | 16.223 µs | 16.821 µs | 21.631 µs | 16.221 µs | 15.994 µs–16.393 µs | 5 | 2000 | 200 | 25,108 | +0 | semantic DOM pass |
| Topcoat | 1,000-row table | 1.453 ms | 1.757 ms | 1.791 ms | 1.535 ms | 1.443 ms–1.471 ms | 5 | 200 | 20 | 988,509 | +0 | semantic DOM pass |
| Topcoat | Product grid | 197.269 µs | 204.495 µs | 216.463 µs | 198.332 µs | 192.695 µs–198.742 µs | 5 | 500 | 50 | 284,908 | +0 | semantic DOM pass |
| Astro | Component page | 51.154 µs | 91.452 µs | 739.837 µs | 114.008 µs | 49.289 µs–51.899 µs | 5 | 2000 | 200 | 25,108 | +0 | semantic DOM pass |
| Astro | 1,000-row table | 2.997 ms | 6.991 ms | 10.872 ms | 3.899 ms | 2.968 ms–3.341 ms | 5 | 200 | 20 | 990,507 | +1,998 | semantic DOM pass |
| Astro | Product grid | 297.639 µs | 1.132 ms | 4.003 ms | 544.373 µs | 284.108 µs–316.961 µs | 5 | 500 | 50 | 285,868 | +960 | semantic DOM pass |
| SvelteKit | Component page | 11.864 µs | 19.692 µs | 31.127 µs | 31.665 µs | 11.267 µs–12.289 µs | 5 | 2000 | 200 | 25,770 | +662 | semantic DOM pass |
| SvelteKit | 1,000-row table | 1.578 ms | 5.074 ms | 9.342 ms | 2.530 ms | 1.549 ms–1.684 ms | 5 | 200 | 20 | 1,003,248 | +14,739 | semantic DOM pass |
| SvelteKit | Product grid | 93.446 µs | 244.731 µs | 3.697 ms | 234.380 µs | 91.347 µs–94.028 µs | 5 | 500 | 50 | 286,476 | +1,568 | semantic DOM pass |
| Next.js | Component page | 75.492 µs | 134.326 µs | 2.106 ms | 157.660 µs | 74.456 µs–79.781 µs | 5 | 2000 | 200 | 25,201 | +93 | semantic DOM pass |
| Next.js | 1,000-row table | 5.236 ms | 20.090 ms | 33.149 ms | 8.303 ms | 5.108 ms–5.918 ms | 5 | 200 | 20 | 990,694 | +2,185 | semantic DOM pass |
| Next.js | Product grid | 437.881 µs | 2.473 ms | 5.143 ms | 835.131 µs | 422.193 µs–489.192 µs | 5 | 500 | 50 | 285,868 | +960 | semantic DOM pass |
| Exact | Component page | 5.593 ms | 18.153 ms | 30.081 ms | 7.892 ms | 5.540 ms–5.619 ms | 5 | 2000 | 200 | 34,637 | +9,529 | adapted content and styles pass |
| Exact | 1,000-row table | 149.454 ms | 618.250 ms | 888.399 ms | 230.803 ms | 147.635 ms–153.880 ms | 5 | 200 | 20 | 1,025,844 | +37,335 | adapted content and styles pass |
| Exact | Product grid | 17.493 ms | 62.030 ms | 88.123 ms | 23.287 ms | 17.414 ms–17.956 ms | 5 | 500 | 50 | 261,879 | -23,029 | adapted content and styles pass |

## Tail observations

The report flags every cell whose process-median P95 is at least 3× its P50:

- Marko's 1,000-row table P95 was 3.23× its P50 (4.839 ms versus 1.499 ms).
- React's component page P95 was 6.94× its P50 (602.818 µs versus 86.808 µs).
- React's product grid P95 was 6.82× its P50 (3.095 ms versus 453.976 µs).
- Vue's product grid P95 was 3.50× its P50 (329.729 µs versus 94.155 µs).
- Svelte's 1,000-row table P95 was 3.50× its P50 (5.583 ms versus 1.596 ms).
- jte's product grid P95 was 5.87× its P50 (3.734 ms versus 636.346 µs).
- Rocker's product grid P95 was 5.18× its P50 (4.171 ms versus 805.506 µs).
- Astro's product grid P95 was 3.80× its P50 (1.132 ms versus 297.639 µs).
- SvelteKit's 1,000-row table P95 was 3.21× its P50 (5.074 ms versus 1.578 ms).
- Next.js's 1,000-row table P95 was 3.84× its P50 (20.090 ms versus 5.236 ms).
- Next.js's product grid P95 was 5.65× its P50 (2.473 ms versus 437.881 µs).
- Exact's component page P95 was 3.25× its P50 (18.153 ms versus 5.593 ms).
- Exact's 1,000-row table P95 was 4.14× its P50 (618.250 ms versus 149.454 ms).
- Exact's product grid P95 was 3.55× its P50 (62.030 ms versus 17.493 ms).

## Parity

Chromium parses every untimed dump. The gate requires identical elements, non-class attributes, class membership, visible text, and body order. It ignores renderer-internal comments, resource-preload hints, non-semantic `<head>` order, class-token order, and adjacent hydration-split text nodes. The timed response is never normalized.

| Workload | Canonical DOM SHA-256 | Exact-byte matches |
| --- | --- | ---: |
| Component page | `43c50a97024231d49639400a5bfb18df7dbe5e94068cd42a732cea26ed0188b4` | 7/21 |
| 1,000-row table | `ba9bb6481cefab9898ff8c7d6c31405f3379c3ddaede2690e5c70ef46473356b` | 2/21 |
| Product grid | `5c89ccf8708043183838767b4bf61a68d9afc8bbf78830dc8886a851be162cfe` | 2/21 |

## Renderer and runtime versions

| Renderer/runtime | Version |
| --- | --- |
| Proa | 0.4.0 @ ceffd9f305acabbb0584fa181df4f4e2d7883e94 / rustc 1.95.0 (59807616e 2026-04-14) |
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

## Reproduction

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

## Known limitations

- Renderer-only latency excludes routing, middleware, databases, HTTP transfer, hydration, and network latency.
- Semantic DOM parity permits documented serializer metadata and whitespace differences; payload deltas remain visible.
- This capture describes one machine and these three workloads; it is not a universal application ranking.
- Exact uses the disclosed exact-native-v1 adaptation: named native styles, generated classes, text/list wrappers and separated table borders. Content, attributes, formatting and representative computed CSS are checked separately; strict DOM parity is not claimed. Fresh per-render VM/runtime initialization, prepared-input binding, DOM construction and HTML serialization are inside timing; source compilation and input-data construction are outside.

## Raw and related evidence

- [Per-process summaries](raw/canonical-ssr-v1-2026-11-14T18-20-35-163Z-22e9b54c/process-summaries.json)
- [Result-table migration map](../MIGRATION.md)
- [Exact adapted cards stylesheet](raw/canonical-ssr-v1-2026-11-14T18-20-35-163Z-22e9b54c/cards-exact.css)
- [Exact adapted table stylesheet](raw/canonical-ssr-v1-2026-11-14T18-20-35-163Z-22e9b54c/table-exact.css)
- [Exact adapted products stylesheet](raw/canonical-ssr-v1-2026-11-14T18-20-35-163Z-22e9b54c/products-exact.css)
- [Unchanged fixture admission checks](raw/canonical-ssr-v1-2026-11-14T18-20-35-163Z-22e9b54c/admissions.json)

Allocation measurements and construction-path controls remain separate from this renderer scoreboard. See the [engineering report](../../../docs/reports/engineering.md) and [mechanism-specific notes](../../../docs/engineering/README.md).
