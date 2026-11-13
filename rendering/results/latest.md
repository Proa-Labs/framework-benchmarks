# Canonical rendering result

> Current canonical capture.

- Capture: `canonical-ssr-v1-2026-11-13T18-11-27-817Z-1ab1ba3f`
- Captured: 2026-11-13T18:11:27.817Z
- Completed: 2026-11-13T18:22:28.979Z
- Host: Intel(R) Xeon(R) 6985P-C CPU @ 2.30GHz, 16 logical CPUs, 63200763904 bytes RAM
- OS: linux (6.12.105+), x64
- Proa output: Fresh owned RenderBuffer per iteration. Allocation and rendering are timed; flattening/copying, encoding, parity, hashing and output destruction are outside the render timer.
- Harness commit: `e70841310f4ad70045869cee96ad0a7f82055661`
- Canonical source SHA-256: `4a258158eada1467fbe52aa8c8e2569949b2e3fb321aa348a9682dc457d43a54`

## Public scoreboard

On these workloads, the November 13, 2026 capture on Intel(R) Xeon(R) 6985P-C CPU @ 2.30GHz measured Proa rendering the component page 61.0× faster than React, the 1,000-row table 28.9× faster than React, and the product grid 30.6× faster than React. These ratios describe this capture, not every application.

> Lower is better. Strict rows pass unchanged DOM/class parity. Exact† uses an explicitly adapted fixture with equivalent content and native styles; its HTML differs. See [adaptation details](https://github.com/Proa-Labs/framework-benchmarks/blob/e70841310f4ad70045869cee96ad0a7f82055661/rendering/external/exact/README.md).

| Renderer | Component page | 1,000-row table | Product grid |
| --- | ---: | ---: | ---: |
| Proa | 0.001 ms · 1.00× | 0.34 ms · 1.00× | 0.015 ms · 1.00× |
| Marko | 0.011 ms · 7.55× | 1.47 ms · 4.36× | 0.11 ms · 7.81× |
| React | 0.086 ms · 61.0× | 9.76 ms · 28.9× | 0.45 ms · 30.6× |
| Vue | 0.010 ms · 7.12× | 1.63 ms · 4.83× | 0.097 ms · 6.59× |
| Svelte | 0.009 ms · 6.41× | 1.50 ms · 4.43× | 0.096 ms · 6.54× |
| Rails | 0.079 ms · 55.9× | 9.26 ms · 27.5× | 0.47 ms · 32.3× |
| jte | 0.022 ms · 15.7× | 7.17 ms · 21.3× | 0.65 ms · 44.4× |
| Rocker | 0.037 ms · 26.4× | 10.4 ms · 30.7× | 0.79 ms · 54.3× |
| Handlebars | 0.030 ms · 21.4× | 4.25 ms · 12.6× | 0.22 ms · 15.1× |
| Go html/template | 0.15 ms · 103× | 14.6 ms · 43.4× | 1.19 ms · 81.0× |
| Jinja2 | 0.11 ms · 78.4× | 19.9 ms · 59.1× | 1.47 ms · 100× |
| PHP | 0.035 ms · 24.6× | 1.86 ms · 5.51× | 0.10 ms · 7.05× |
| Askama | 0.001 ms · 0.90× | 0.75 ms · 2.21× | 0.026 ms · 1.75× |
| Sailfish | 0.002 ms · 1.41× | 0.65 ms · 1.92× | 0.025 ms · 1.70× |
| Leptos | 0.018 ms · 12.6× | 1.75 ms · 5.20× | 0.27 ms · 18.2× |
| Dioxus | 0.17 ms · 121× | 3.59 ms · 10.6× | 0.44 ms · 29.8× |
| Topcoat | 0.017 ms · 12.1× | 1.52 ms · 4.50× | 0.20 ms · 13.6× |
| Astro | 0.052 ms · 36.7× | 3.00 ms · 8.88× | 0.30 ms · 20.4× |
| SvelteKit | 0.012 ms · 8.59× | 1.64 ms · 4.87× | 0.095 ms · 6.46× |
| Next.js | 0.078 ms · 55.2× | 5.30 ms · 15.7× | 0.44 ms · 30.1× |
| Exact† | 5.75 ms · 4087× | 154 ms · 456× | 18.0 ms · 1230× |

## Detailed measurements

| Renderer | Workload | P50 | P95 | P99 | Mean | Process P50 range | Processes | Samples/process | Warmups/process | Payload bytes | Payload Δ vs Proa | Parity |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Proa | Component page | 1.407 µs | 1.455 µs | 1.545 µs | 1.429 µs | 1.388 µs–1.436 µs | 5 | 2000 | 200 | 25,108 | +0 | semantic DOM pass |
| Proa | 1,000-row table | 337.412 µs | 368.884 µs | 388.530 µs | 344.641 µs | 336.822 µs–345.471 µs | 5 | 200 | 20 | 988,509 | +0 | semantic DOM pass |
| Proa | Product grid | 14.643 µs | 14.941 µs | 21.460 µs | 14.756 µs | 14.105 µs–14.777 µs | 5 | 500 | 50 | 284,908 | +0 | semantic DOM pass |
| Marko | Component page | 10.624 µs | 25.491 µs | 38.207 µs | 27.704 µs | 9.192 µs–10.953 µs | 5 | 2000 | 200 | 24,038 | -1,070 | semantic DOM pass |
| Marko | 1,000-row table | 1.470 ms | 4.716 ms | 6.530 ms | 2.076 ms | 1.384 ms–1.514 ms | 5 | 200 | 20 | 983,187 | -5,322 | semantic DOM pass |
| Marko | Product grid | 114.382 µs | 196.750 µs | 3.164 ms | 203.157 µs | 113.422 µs–117.902 µs | 5 | 500 | 50 | 282,604 | -2,304 | semantic DOM pass |
| React | Component page | 85.892 µs | 630.986 µs | 3.129 ms | 221.255 µs | 83.844 µs–93.547 µs | 5 | 2000 | 200 | 25,202 | +94 | semantic DOM pass |
| React | 1,000-row table | 9.763 ms | 20.716 ms | 29.035 ms | 10.531 ms | 9.463 ms–10.956 ms | 5 | 200 | 20 | 990,695 | +2,186 | semantic DOM pass |
| React | Product grid | 448.191 µs | 3.166 ms | 9.401 ms | 1.202 ms | 444.743 µs–463.188 µs | 5 | 500 | 50 | 285,868 | +960 | semantic DOM pass |
| Vue | Component page | 10.023 µs | 22.403 µs | 44.830 µs | 36.978 µs | 8.989 µs–10.427 µs | 5 | 2000 | 200 | 25,700 | +592 | semantic DOM pass |
| Vue | 1,000-row table | 1.630 ms | 5.090 ms | 8.643 ms | 2.463 ms | 1.606 ms–1.648 ms | 5 | 200 | 20 | 1,006,523 | +18,014 | semantic DOM pass |
| Vue | Product grid | 96.558 µs | 350.164 µs | 4.290 ms | 282.660 µs | 92.917 µs–97.744 µs | 5 | 500 | 50 | 287,420 | +2,512 | semantic DOM pass |
| Svelte | Component page | 9.012 µs | 25.018 µs | 43.657 µs | 26.288 µs | 8.791 µs–9.120 µs | 5 | 2000 | 200 | 25,748 | +640 | semantic DOM pass |
| Svelte | 1,000-row table | 1.495 ms | 4.686 ms | 6.641 ms | 2.432 ms | 1.470 ms–1.710 ms | 5 | 200 | 20 | 1,003,227 | +14,718 | semantic DOM pass |
| Svelte | Product grid | 95.790 µs | 203.237 µs | 3.193 ms | 229.359 µs | 95.552 µs–99.511 µs | 5 | 500 | 50 | 286,476 | +1,568 | semantic DOM pass |
| Rails | Component page | 78.644 µs | 102.081 µs | 445.486 µs | 89.805 µs | 78.516 µs–81.534 µs | 5 | 2000 | 200 | 35,839 | +10,731 | semantic DOM pass |
| Rails | 1,000-row table | 9.263 ms | 9.970 ms | 10.188 ms | 9.200 ms | 9.028 ms–9.314 ms | 5 | 200 | 20 | 1,228,793 | +240,284 | semantic DOM pass |
| Rails | Product grid | 472.697 µs | 816.488 µs | 2.083 ms | 539.567 µs | 468.356 µs–474.180 µs | 5 | 500 | 50 | 296,823 | +11,915 | semantic DOM pass |
| jte | Component page | 22.116 µs | 30.126 µs | 576.316 µs | 51.943 µs | 14.377 µs–24.044 µs | 5 | 2000 | 200 | 25,109 | +1 | semantic DOM pass |
| jte | 1,000-row table | 7.171 ms | 27.384 ms | 35.614 ms | 9.446 ms | 6.305 ms–7.673 ms | 5 | 200 | 20 | 988,510 | +1 | semantic DOM pass |
| jte | Product grid | 649.903 µs | 3.750 ms | 4.439 ms | 1.265 ms | 644.238 µs–669.160 µs | 5 | 500 | 50 | 284,909 | +1 | semantic DOM pass |
| Rocker | Component page | 37.213 µs | 48.099 µs | 3.061 ms | 78.325 µs | 37.042 µs–38.782 µs | 5 | 2000 | 200 | 25,109 | +1 | semantic DOM pass |
| Rocker | 1,000-row table | 10.360 ms | 20.447 ms | 28.386 ms | 9.840 ms | 7.778 ms–10.664 ms | 5 | 200 | 20 | 990,508 | +1,999 | semantic DOM pass |
| Rocker | Product grid | 794.878 µs | 4.180 ms | 4.932 ms | 1.669 ms | 738.558 µs–818.067 µs | 5 | 500 | 50 | 285,869 | +961 | semantic DOM pass |
| Handlebars | Component page | 30.088 µs | 46.996 µs | 187.031 µs | 53.372 µs | 27.620 µs–31.552 µs | 5 | 2000 | 200 | 25,108 | +0 | semantic DOM pass |
| Handlebars | 1,000-row table | 4.249 ms | 6.655 ms | 15.092 ms | 4.926 ms | 4.221 ms–4.270 ms | 5 | 200 | 20 | 990,694 | +2,185 | semantic DOM pass |
| Handlebars | Product grid | 220.405 µs | 604.890 µs | 3.409 ms | 428.026 µs | 214.007 µs–247.963 µs | 5 | 500 | 50 | 285,868 | +960 | semantic DOM pass |
| Go html/template | Component page | 145.145 µs | 228.912 µs | 240.210 µs | 165.354 µs | 144.419 µs–147.454 µs | 5 | 2000 | 200 | 25,108 | +0 | semantic DOM pass |
| Go html/template | 1,000-row table | 14.644 ms | 15.262 ms | 15.944 ms | 14.673 ms | 14.575 ms–14.683 ms | 5 | 200 | 20 | 990,509 | +2,000 | semantic DOM pass |
| Go html/template | Product grid | 1.186 ms | 1.252 ms | 1.297 ms | 1.190 ms | 1.181 ms–1.189 ms | 5 | 500 | 50 | 285,676 | +768 | semantic DOM pass |
| Jinja2 | Component page | 110.334 µs | 117.543 µs | 123.593 µs | 110.691 µs | 108.481 µs–112.624 µs | 5 | 2000 | 200 | 25,108 | +0 | semantic DOM pass |
| Jinja2 | 1,000-row table | 19.931 ms | 21.710 ms | 23.686 ms | 20.153 ms | 19.750 ms–20.380 ms | 5 | 200 | 20 | 990,257 | +1,748 | semantic DOM pass |
| Jinja2 | Product grid | 1.467 ms | 1.539 ms | 1.562 ms | 1.480 ms | 1.448 ms–1.547 ms | 5 | 500 | 50 | 285,676 | +768 | semantic DOM pass |
| PHP | Component page | 34.642 µs | 38.726 µs | 42.364 µs | 35.197 µs | 34.422 µs–35.768 µs | 5 | 2000 | 200 | 25,108 | +0 | semantic DOM pass |
| PHP | 1,000-row table | 1.859 ms | 1.938 ms | 1.975 ms | 1.864 ms | 1.837 ms–1.899 ms | 5 | 200 | 20 | 990,694 | +2,185 | semantic DOM pass |
| PHP | Product grid | 103.302 µs | 111.434 µs | 115.815 µs | 104.309 µs | 99.016 µs–105.264 µs | 5 | 500 | 50 | 285,868 | +960 | semantic DOM pass |
| Askama | Component page | 1.264 µs | 1.295 µs | 1.331 µs | 1.282 µs | 1.229 µs–1.289 µs | 5 | 2000 | 200 | 44,849 | +19,741 | semantic DOM pass |
| Askama | 1,000-row table | 745.380 µs | 772.516 µs | 782.994 µs | 746.787 µs | 738.480 µs–760.767 µs | 5 | 200 | 20 | 991,007 | +2,498 | semantic DOM pass |
| Askama | Product grid | 25.573 µs | 26.522 µs | 33.086 µs | 25.923 µs | 24.586 µs–26.110 µs | 5 | 500 | 50 | 285,676 | +768 | semantic DOM pass |
| Sailfish | Component page | 1.981 µs | 2.107 µs | 2.188 µs | 2.012 µs | 1.923 µs–2.015 µs | 5 | 2000 | 200 | 44,849 | +19,741 | semantic DOM pass |
| Sailfish | 1,000-row table | 648.231 µs | 673.565 µs | 683.655 µs | 649.608 µs | 638.914 µs–650.274 µs | 5 | 200 | 20 | 990,694 | +2,185 | semantic DOM pass |
| Sailfish | Product grid | 24.843 µs | 25.827 µs | 31.796 µs | 25.124 µs | 24.586 µs–25.392 µs | 5 | 500 | 50 | 285,868 | +960 | semantic DOM pass |
| Leptos | Component page | 17.731 µs | 18.183 µs | 23.919 µs | 17.900 µs | 17.703 µs–18.190 µs | 5 | 2000 | 200 | 25,219 | +111 | semantic DOM pass |
| Leptos | 1,000-row table | 1.754 ms | 1.835 ms | 1.848 ms | 1.763 ms | 1.743 ms–1.772 ms | 5 | 200 | 20 | 991,512 | +3,003 | semantic DOM pass |
| Leptos | Product grid | 266.321 µs | 275.883 µs | 285.117 µs | 267.695 µs | 260.505 µs–274.931 µs | 5 | 500 | 50 | 286,063 | +1,155 | semantic DOM pass |
| Dioxus | Component page | 170.485 µs | 180.711 µs | 186.017 µs | 169.482 µs | 147.460 µs–171.053 µs | 5 | 2000 | 200 | 25,141 | +33 | semantic DOM pass |
| Dioxus | 1,000-row table | 3.586 ms | 3.765 ms | 3.825 ms | 3.588 ms | 3.487 ms–3.621 ms | 5 | 200 | 20 | 990,695 | +2,186 | semantic DOM pass |
| Dioxus | Product grid | 436.596 µs | 525.681 µs | 554.549 µs | 451.051 µs | 423.400 µs–467.495 µs | 5 | 500 | 50 | 285,868 | +960 | semantic DOM pass |
| Topcoat | Component page | 17.010 µs | 17.573 µs | 22.618 µs | 16.925 µs | 16.883 µs–17.848 µs | 5 | 2000 | 200 | 25,108 | +0 | semantic DOM pass |
| Topcoat | 1,000-row table | 1.517 ms | 1.823 ms | 1.841 ms | 1.599 ms | 1.494 ms–1.546 ms | 5 | 200 | 20 | 988,509 | +0 | semantic DOM pass |
| Topcoat | Product grid | 199.121 µs | 208.971 µs | 215.157 µs | 201.006 µs | 197.489 µs–204.606 µs | 5 | 500 | 50 | 284,908 | +0 | semantic DOM pass |
| Astro | Component page | 51.633 µs | 94.740 µs | 679.408 µs | 114.838 µs | 51.085 µs–52.547 µs | 5 | 2000 | 200 | 25,108 | +0 | semantic DOM pass |
| Astro | 1,000-row table | 2.996 ms | 6.591 ms | 7.835 ms | 3.708 ms | 2.775 ms–3.130 ms | 5 | 200 | 20 | 990,507 | +1,998 | semantic DOM pass |
| Astro | Product grid | 299.118 µs | 1.157 ms | 3.502 ms | 558.556 µs | 297.652 µs–313.118 µs | 5 | 500 | 50 | 285,868 | +960 | semantic DOM pass |
| SvelteKit | Component page | 12.088 µs | 18.805 µs | 34.134 µs | 31.473 µs | 10.761 µs–12.617 µs | 5 | 2000 | 200 | 25,770 | +662 | semantic DOM pass |
| SvelteKit | 1,000-row table | 1.644 ms | 4.885 ms | 10.852 ms | 2.568 ms | 1.566 ms–1.691 ms | 5 | 200 | 20 | 1,003,248 | +14,739 | semantic DOM pass |
| SvelteKit | Product grid | 94.595 µs | 235.720 µs | 3.600 ms | 229.059 µs | 93.156 µs–97.035 µs | 5 | 500 | 50 | 286,476 | +1,568 | semantic DOM pass |
| Next.js | Component page | 77.674 µs | 129.068 µs | 1.977 ms | 159.998 µs | 77.001 µs–79.713 µs | 5 | 2000 | 200 | 25,201 | +93 | semantic DOM pass |
| Next.js | 1,000-row table | 5.296 ms | 20.602 ms | 29.365 ms | 8.366 ms | 5.147 ms–5.305 ms | 5 | 200 | 20 | 990,694 | +2,185 | semantic DOM pass |
| Next.js | Product grid | 441.368 µs | 2.374 ms | 4.652 ms | 788.942 µs | 434.480 µs–451.844 µs | 5 | 500 | 50 | 285,868 | +960 | semantic DOM pass |
| Exact | Component page | 5.750 ms | 18.336 ms | 30.229 ms | 7.533 ms | 5.736 ms–5.767 ms | 5 | 2000 | 200 | 34,637 | +9,529 | adapted content and styles pass |
| Exact | 1,000-row table | 153.695 ms | 666.266 ms | 914.673 ms | 240.683 ms | 152.533 ms–154.387 ms | 5 | 200 | 20 | 1,025,844 | +37,335 | adapted content and styles pass |
| Exact | Product grid | 18.005 ms | 63.375 ms | 92.200 ms | 23.682 ms | 17.973 ms–18.089 ms | 5 | 500 | 50 | 261,879 | -23,029 | adapted content and styles pass |

## Tail observations

The report flags every cell whose process-median P95 is at least 3× its P50:

- Marko's 1,000-row table P95 was 3.21× its P50 (4.716 ms versus 1.470 ms).
- React's component page P95 was 7.35× its P50 (630.986 µs versus 85.892 µs).
- React's product grid P95 was 7.06× its P50 (3.166 ms versus 448.191 µs).
- Vue's 1,000-row table P95 was 3.12× its P50 (5.090 ms versus 1.630 ms).
- Vue's product grid P95 was 3.63× its P50 (350.164 µs versus 96.558 µs).
- Svelte's 1,000-row table P95 was 3.13× its P50 (4.686 ms versus 1.495 ms).
- jte's 1,000-row table P95 was 3.82× its P50 (27.384 ms versus 7.171 ms).
- jte's product grid P95 was 5.77× its P50 (3.750 ms versus 649.903 µs).
- Rocker's product grid P95 was 5.26× its P50 (4.180 ms versus 794.878 µs).
- Astro's product grid P95 was 3.87× its P50 (1.157 ms versus 299.118 µs).
- Next.js's 1,000-row table P95 was 3.89× its P50 (20.602 ms versus 5.296 ms).
- Next.js's product grid P95 was 5.38× its P50 (2.374 ms versus 441.368 µs).
- Exact's component page P95 was 3.19× its P50 (18.336 ms versus 5.750 ms).
- Exact's 1,000-row table P95 was 4.33× its P50 (666.266 ms versus 153.695 ms).
- Exact's product grid P95 was 3.52× its P50 (63.375 ms versus 18.005 ms).

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
| Astro | 7.4.8 |
| SvelteKit | 3.1.0 |
| Next.js | Next.js 16.4.6 compiled page / bundled React DOM 19.3.0-canary-278794d7-20261002 / Bun 1.4.2 |
| Exact | 94b8671f70fe2e25b307a40e7fce66dc27c9f802 |

## Reproduction

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

## Known limitations

- Renderer-only latency excludes routing, middleware, databases, HTTP transfer, hydration, and network latency.
- Semantic DOM parity permits documented serializer metadata and whitespace differences; payload deltas remain visible.
- This capture describes one machine and these three workloads; it is not a universal application ranking.
- Exact uses the disclosed exact-native-v1 adaptation: named native styles, generated classes, text/list wrappers and separated table borders. Content, attributes, formatting and representative computed CSS are checked separately; strict DOM parity is not claimed. Fresh per-render VM/runtime initialization, prepared-input binding, DOM construction and HTML serialization are inside timing; source compilation and input-data construction are outside.

## Raw and related evidence

- [Per-process summaries](raw/canonical-ssr-v1-2026-11-13T18-11-27-817Z-1ab1ba3f/process-summaries.json)
- [Result-table migration map](../MIGRATION.md)
- [Exact adapted cards stylesheet](raw/canonical-ssr-v1-2026-11-13T18-11-27-817Z-1ab1ba3f/cards-exact.css)
- [Exact adapted table stylesheet](raw/canonical-ssr-v1-2026-11-13T18-11-27-817Z-1ab1ba3f/table-exact.css)
- [Exact adapted products stylesheet](raw/canonical-ssr-v1-2026-11-13T18-11-27-817Z-1ab1ba3f/products-exact.css)
- [Unchanged fixture admission checks](raw/canonical-ssr-v1-2026-11-13T18-11-27-817Z-1ab1ba3f/admissions.json)

Allocation measurements and construction-path controls remain separate from this renderer scoreboard. They are embedded below the scoreboard in the root README and retained in the [engineering reports](../engineering/README.md).
