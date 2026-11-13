# Canonical rendering result

> Current canonical capture.

- Capture: `canonical-ssr-v1-2026-11-13T05-42-09-654Z-ecebc6a2`
- Captured: 2026-11-13T05:42:09.654Z
- Completed: 2026-11-13T05:46:06.772Z
- Host: Intel(R) Xeon(R) 6985P-C CPU @ 2.30GHz, 16 logical CPUs, 63200763904 bytes RAM
- OS: linux (6.12.105+), x64
- Proa output: Fresh owned RenderBuffer per iteration. Allocation and rendering are timed; flattening/copying, encoding, parity, hashing and output destruction are outside the render timer.
- Harness commit: `3a7c96ccadee2d3947aa04bce7a8772b73ad1d5c`
- Canonical source SHA-256: `f5df1a402e082b331fc6e8a63d6edc366b62170f200b424ba1e42290339ccce2`

## Public scoreboard

On these workloads, the November 13, 2026 capture on Intel(R) Xeon(R) 6985P-C CPU @ 2.30GHz measured Proa rendering the component page 61.9× faster than React, the 1,000-row table 31.3× faster than React, and the product grid 31.8× faster than React. These ratios describe this capture, not every application.

> Lower is better. Every listed renderer produced an equivalent page and passed the parity gate.

| Renderer | Component page | 1,000-row table | Product grid |
| --- | ---: | ---: | ---: |
| Proa | 1.40 µs · 1.00× | 0.34 ms · 1.00× | 0.014 ms · 1.00× |
| Marko | 9.54 µs · 6.81× | 1.49 ms · 4.43× | 0.11 ms · 7.80× |
| React | 86.6 µs · 61.9× | 10.5 ms · 31.3× | 0.44 ms · 31.8× |
| Vue | 9.51 µs · 6.80× | 1.65 ms · 4.90× | 0.094 ms · 6.73× |
| Svelte | 9.02 µs · 6.44× | 1.57 ms · 4.66× | 0.095 ms · 6.82× |
| Rails | 80.9 µs · 57.8× | 9.05 ms · 26.8× | 0.47 ms · 33.8× |
| jte | 22.3 µs · 16.0× | 7.19 ms · 21.3× | 0.66 ms · 47.4× |
| Rocker | 37.3 µs · 26.7× | 10.6 ms · 31.5× | 0.83 ms · 59.7× |
| Handlebars | 26.6 µs · 19.0× | 4.29 ms · 12.7× | 0.22 ms · 15.7× |
| Go html/template | 144 µs · 103× | 14.5 ms · 43.0× | 1.16 ms · 83.4× |
| Jinja2 | 108 µs · 77.3× | 19.5 ms · 57.9× | 1.46 ms · 105× |
| PHP | 33.9 µs · 24.2× | 1.83 ms · 5.42× | 0.096 ms · 6.92× |
| Askama | 1.23 µs · 0.88× | 0.74 ms · 2.20× | 0.024 ms · 1.75× |
| Sailfish | 1.89 µs · 1.35× | 0.64 ms · 1.88× | 0.024 ms · 1.72× |
| Leptos | 17.4 µs · 12.4× | 1.72 ms · 5.11× | 0.26 ms · 18.7× |
| Dioxus | 168 µs · 120× | 3.55 ms · 10.5× | 0.43 ms · 30.7× |
| Topcoat | 17.0 µs · 12.1× | 1.50 ms · 4.45× | 0.20 ms · 14.1× |
| Astro | 50.7 µs · 36.2× | 2.89 ms · 8.57× | 0.30 ms · 21.4× |
| SvelteKit | 11.9 µs · 8.48× | 1.60 ms · 4.74× | 0.092 ms · 6.64× |
| Next.js | 76.8 µs · 54.9× | 5.16 ms · 15.3× | 0.44 ms · 31.4× |

## Detailed measurements

| Renderer | Workload | P50 | P95 | P99 | Mean | Process P50 range | Processes | Samples/process | Warmups/process | Payload bytes | Payload Δ vs Proa | Parity |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Proa | Component page | 1.400 µs | 1.440 µs | 1.631 µs | 1.433 µs | 1.382 µs–1.435 µs | 5 | 2000 | 200 | 25,108 | +0 | semantic DOM pass |
| Proa | 1,000-row table | 337.039 µs | 368.170 µs | 387.453 µs | 342.526 µs | 334.351 µs–359.398 µs | 5 | 200 | 20 | 988,509 | +0 | semantic DOM pass |
| Proa | Product grid | 13.934 µs | 14.303 µs | 20.478 µs | 14.135 µs | 13.855 µs–13.998 µs | 5 | 500 | 50 | 284,908 | +0 | semantic DOM pass |
| Marko | Component page | 9.535 µs | 22.890 µs | 33.417 µs | 25.002 µs | 9.033 µs–10.622 µs | 5 | 2000 | 200 | 24,038 | -1,070 | semantic DOM pass |
| Marko | 1,000-row table | 1.492 ms | 4.659 ms | 7.342 ms | 2.125 ms | 1.450 ms–1.497 ms | 5 | 200 | 20 | 983,187 | -5,322 | semantic DOM pass |
| Marko | Product grid | 108.636 µs | 181.795 µs | 3.188 ms | 196.018 µs | 105.811 µs–111.794 µs | 5 | 500 | 50 | 282,604 | -2,304 | semantic DOM pass |
| React | Component page | 86.649 µs | 602.221 µs | 3.140 ms | 217.640 µs | 85.242 µs–88.407 µs | 5 | 2000 | 200 | 25,202 | +94 | semantic DOM pass |
| React | 1,000-row table | 10.537 ms | 19.877 ms | 32.379 ms | 10.445 ms | 8.895 ms–11.302 ms | 5 | 200 | 20 | 990,695 | +2,186 | semantic DOM pass |
| React | Product grid | 443.413 µs | 3.098 ms | 9.398 ms | 1.178 ms | 436.253 µs–476.233 µs | 5 | 500 | 50 | 285,868 | +960 | semantic DOM pass |
| Vue | Component page | 9.514 µs | 22.726 µs | 45.347 µs | 34.030 µs | 9.031 µs–10.534 µs | 5 | 2000 | 200 | 25,700 | +592 | semantic DOM pass |
| Vue | 1,000-row table | 1.652 ms | 4.885 ms | 9.395 ms | 2.403 ms | 1.564 ms–1.747 ms | 5 | 200 | 20 | 1,006,523 | +18,014 | semantic DOM pass |
| Vue | Product grid | 93.733 µs | 282.540 µs | 4.639 ms | 281.934 µs | 92.276 µs–96.309 µs | 5 | 500 | 50 | 287,420 | +2,512 | semantic DOM pass |
| Svelte | Component page | 9.017 µs | 25.100 µs | 42.891 µs | 24.304 µs | 8.720 µs–9.096 µs | 5 | 2000 | 200 | 25,748 | +640 | semantic DOM pass |
| Svelte | 1,000-row table | 1.570 ms | 4.912 ms | 7.466 ms | 2.453 ms | 1.458 ms–1.743 ms | 5 | 200 | 20 | 1,003,227 | +14,718 | semantic DOM pass |
| Svelte | Product grid | 94.987 µs | 243.954 µs | 3.133 ms | 232.171 µs | 93.100 µs–98.921 µs | 5 | 500 | 50 | 286,476 | +1,568 | semantic DOM pass |
| Rails | Component page | 80.859 µs | 110.305 µs | 460.300 µs | 92.744 µs | 80.177 µs–81.473 µs | 5 | 2000 | 200 | 35,839 | +10,731 | semantic DOM pass |
| Rails | 1,000-row table | 9.046 ms | 9.836 ms | 10.017 ms | 9.144 ms | 8.963 ms–9.128 ms | 5 | 200 | 20 | 1,228,793 | +240,284 | semantic DOM pass |
| Rails | Product grid | 471.637 µs | 806.106 µs | 2.046 ms | 544.269 µs | 466.450 µs–488.579 µs | 5 | 500 | 50 | 296,823 | +11,915 | semantic DOM pass |
| jte | Component page | 22.331 µs | 30.602 µs | 410.434 µs | 52.274 µs | 15.683 µs–23.470 µs | 5 | 2000 | 200 | 25,109 | +1 | semantic DOM pass |
| jte | 1,000-row table | 7.191 ms | 20.977 ms | 29.507 ms | 8.948 ms | 6.859 ms–7.355 ms | 5 | 200 | 20 | 988,510 | +1 | semantic DOM pass |
| jte | Product grid | 660.153 µs | 3.899 ms | 4.391 ms | 1.290 ms | 646.067 µs–666.478 µs | 5 | 500 | 50 | 284,909 | +1 | semantic DOM pass |
| Rocker | Component page | 37.326 µs | 51.883 µs | 3.057 ms | 82.025 µs | 37.117 µs–37.459 µs | 5 | 2000 | 200 | 25,109 | +1 | semantic DOM pass |
| Rocker | 1,000-row table | 10.610 ms | 22.738 ms | 37.914 ms | 10.176 ms | 9.332 ms–10.668 ms | 5 | 200 | 20 | 990,508 | +1,999 | semantic DOM pass |
| Rocker | Product grid | 832.261 µs | 4.164 ms | 5.337 ms | 1.670 ms | 763.437 µs–850.753 µs | 5 | 500 | 50 | 285,869 | +961 | semantic DOM pass |
| Handlebars | Component page | 26.626 µs | 43.182 µs | 170.117 µs | 50.517 µs | 25.831 µs–33.620 µs | 5 | 2000 | 200 | 25,108 | +0 | semantic DOM pass |
| Handlebars | 1,000-row table | 4.292 ms | 6.803 ms | 11.849 ms | 4.937 ms | 4.145 ms–4.310 ms | 5 | 200 | 20 | 990,694 | +2,185 | semantic DOM pass |
| Handlebars | Product grid | 218.742 µs | 625.399 µs | 3.370 ms | 427.378 µs | 212.156 µs–269.954 µs | 5 | 500 | 50 | 285,868 | +960 | semantic DOM pass |
| Go html/template | Component page | 144.294 µs | 228.049 µs | 240.056 µs | 164.321 µs | 143.884 µs–148.957 µs | 5 | 2000 | 200 | 25,108 | +0 | semantic DOM pass |
| Go html/template | 1,000-row table | 14.479 ms | 15.156 ms | 15.905 ms | 14.508 ms | 14.419 ms–14.552 ms | 5 | 200 | 20 | 990,509 | +2,000 | semantic DOM pass |
| Go html/template | Product grid | 1.162 ms | 1.226 ms | 1.278 ms | 1.168 ms | 1.154 ms–1.172 ms | 5 | 500 | 50 | 285,676 | +768 | semantic DOM pass |
| Jinja2 | Component page | 108.230 µs | 115.459 µs | 119.881 µs | 108.692 µs | 105.500 µs–111.240 µs | 5 | 2000 | 200 | 25,108 | +0 | semantic DOM pass |
| Jinja2 | 1,000-row table | 19.505 ms | 21.798 ms | 22.699 ms | 19.686 ms | 19.173 ms–20.000 ms | 5 | 200 | 20 | 990,257 | +1,748 | semantic DOM pass |
| Jinja2 | Product grid | 1.464 ms | 1.500 ms | 1.524 ms | 1.461 ms | 1.430 ms–1.494 ms | 5 | 500 | 50 | 285,676 | +768 | semantic DOM pass |
| PHP | Component page | 33.947 µs | 37.278 µs | 40.666 µs | 34.374 µs | 33.602 µs–34.279 µs | 5 | 2000 | 200 | 25,108 | +0 | semantic DOM pass |
| PHP | 1,000-row table | 1.827 ms | 1.868 ms | 1.908 ms | 1.827 ms | 1.809 ms–1.868 ms | 5 | 200 | 20 | 990,694 | +2,185 | semantic DOM pass |
| PHP | Product grid | 96.475 µs | 105.067 µs | 107.480 µs | 97.369 µs | 96.419 µs–97.975 µs | 5 | 500 | 50 | 285,868 | +960 | semantic DOM pass |
| Askama | Component page | 1.229 µs | 1.254 µs | 1.282 µs | 1.249 µs | 1.222 µs–1.255 µs | 5 | 2000 | 200 | 44,849 | +19,741 | semantic DOM pass |
| Askama | 1,000-row table | 742.159 µs | 766.585 µs | 785.857 µs | 744.835 µs | 739.038 µs–747.800 µs | 5 | 200 | 20 | 991,007 | +2,498 | semantic DOM pass |
| Askama | Product grid | 24.349 µs | 25.104 µs | 31.936 µs | 24.945 µs | 23.718 µs–24.555 µs | 5 | 500 | 50 | 285,676 | +768 | semantic DOM pass |
| Sailfish | Component page | 1.889 µs | 1.964 µs | 2.042 µs | 1.926 µs | 1.869 µs–1.925 µs | 5 | 2000 | 200 | 44,849 | +19,741 | semantic DOM pass |
| Sailfish | 1,000-row table | 635.069 µs | 656.751 µs | 673.634 µs | 637.241 µs | 623.504 µs–650.764 µs | 5 | 200 | 20 | 990,694 | +2,185 | semantic DOM pass |
| Sailfish | Product grid | 24.015 µs | 25.029 µs | 30.807 µs | 24.340 µs | 23.606 µs–24.072 µs | 5 | 500 | 50 | 285,868 | +960 | semantic DOM pass |
| Leptos | Component page | 17.367 µs | 17.854 µs | 23.454 µs | 17.563 µs | 17.315 µs–17.411 µs | 5 | 2000 | 200 | 25,219 | +111 | semantic DOM pass |
| Leptos | 1,000-row table | 1.724 ms | 1.766 ms | 1.788 ms | 1.725 ms | 1.717 ms–1.733 ms | 5 | 200 | 20 | 991,512 | +3,003 | semantic DOM pass |
| Leptos | Product grid | 260.039 µs | 268.291 µs | 273.130 µs | 261.699 µs | 258.082 µs–264.380 µs | 5 | 500 | 50 | 286,063 | +1,155 | semantic DOM pass |
| Dioxus | Component page | 167.794 µs | 175.853 µs | 179.568 µs | 168.619 µs | 166.796 µs–169.688 µs | 5 | 2000 | 200 | 25,141 | +33 | semantic DOM pass |
| Dioxus | 1,000-row table | 3.552 ms | 3.716 ms | 3.769 ms | 3.547 ms | 3.519 ms–3.600 ms | 5 | 200 | 20 | 990,695 | +2,186 | semantic DOM pass |
| Dioxus | Product grid | 427.966 µs | 478.337 µs | 487.768 µs | 437.969 µs | 419.776 µs–444.680 µs | 5 | 500 | 50 | 285,868 | +960 | semantic DOM pass |
| Topcoat | Component page | 16.962 µs | 17.525 µs | 22.238 µs | 16.876 µs | 16.712 µs–17.073 µs | 5 | 2000 | 200 | 25,108 | +0 | semantic DOM pass |
| Topcoat | 1,000-row table | 1.499 ms | 1.803 ms | 1.821 ms | 1.574 ms | 1.488 ms–1.502 ms | 5 | 200 | 20 | 988,509 | +0 | semantic DOM pass |
| Topcoat | Product grid | 196.596 µs | 203.637 µs | 208.698 µs | 197.062 µs | 194.483 µs–200.528 µs | 5 | 500 | 50 | 284,908 | +0 | semantic DOM pass |
| Astro | Component page | 50.704 µs | 89.134 µs | 711.020 µs | 111.553 µs | 49.871 µs–55.841 µs | 5 | 2000 | 200 | 25,108 | +0 | semantic DOM pass |
| Astro | 1,000-row table | 2.887 ms | 6.092 ms | 8.074 ms | 3.609 ms | 2.787 ms–3.020 ms | 5 | 200 | 20 | 990,507 | +1,998 | semantic DOM pass |
| Astro | Product grid | 298.709 µs | 1.180 ms | 3.581 ms | 551.782 µs | 292.943 µs–301.553 µs | 5 | 500 | 50 | 285,868 | +960 | semantic DOM pass |
| SvelteKit | Component page | 11.878 µs | 18.482 µs | 30.406 µs | 30.276 µs | 11.526 µs–12.205 µs | 5 | 2000 | 200 | 25,770 | +662 | semantic DOM pass |
| SvelteKit | 1,000-row table | 1.596 ms | 4.952 ms | 9.728 ms | 2.567 ms | 1.577 ms–1.728 ms | 5 | 200 | 20 | 1,003,248 | +14,739 | semantic DOM pass |
| SvelteKit | Product grid | 92.481 µs | 165.688 µs | 3.589 ms | 230.693 µs | 91.168 µs–93.669 µs | 5 | 500 | 50 | 286,476 | +1,568 | semantic DOM pass |
| Next.js | Component page | 76.844 µs | 123.754 µs | 1.445 ms | 151.809 µs | 76.088 µs–77.451 µs | 5 | 2000 | 200 | 25,201 | +93 | semantic DOM pass |
| Next.js | 1,000-row table | 5.160 ms | 20.582 ms | 32.501 ms | 8.142 ms | 5.026 ms–5.288 ms | 5 | 200 | 20 | 990,694 | +2,185 | semantic DOM pass |
| Next.js | Product grid | 437.189 µs | 2.811 ms | 5.580 ms | 816.040 µs | 425.095 µs–453.147 µs | 5 | 500 | 50 | 285,868 | +960 | semantic DOM pass |

## Tail observations

The report flags every cell whose process-median P95 is at least 3× its P50:

- Marko's 1,000-row table P95 was 3.12× its P50 (4.659 ms versus 1.492 ms).
- React's component page P95 was 6.95× its P50 (602.221 µs versus 86.649 µs).
- React's product grid P95 was 6.99× its P50 (3.098 ms versus 443.413 µs).
- Vue's product grid P95 was 3.01× its P50 (282.540 µs versus 93.733 µs).
- Svelte's 1,000-row table P95 was 3.13× its P50 (4.912 ms versus 1.570 ms).
- jte's product grid P95 was 5.91× its P50 (3.899 ms versus 660.153 µs).
- Rocker's product grid P95 was 5.00× its P50 (4.164 ms versus 832.261 µs).
- Astro's product grid P95 was 3.95× its P50 (1.180 ms versus 298.709 µs).
- SvelteKit's 1,000-row table P95 was 3.10× its P50 (4.952 ms versus 1.596 ms).
- Next.js's 1,000-row table P95 was 3.99× its P50 (20.582 ms versus 5.160 ms).
- Next.js's product grid P95 was 6.43× its P50 (2.811 ms versus 437.189 µs).

## Parity

Chromium parses every untimed dump. The gate requires identical elements, non-class attributes, class membership, visible text, and body order. It ignores renderer-internal comments, resource-preload hints, non-semantic `<head>` order, class-token order, and adjacent hydration-split text nodes. The timed response is never normalized.

| Workload | Canonical DOM SHA-256 | Exact-byte matches |
| --- | --- | ---: |
| Component page | `43c50a97024231d49639400a5bfb18df7dbe5e94068cd42a732cea26ed0188b4` | 7/20 |
| 1,000-row table | `ba9bb6481cefab9898ff8c7d6c31405f3379c3ddaede2690e5c70ef46473356b` | 2/20 |
| Product grid | `5c89ccf8708043183838767b4bf61a68d9afc8bbf78830dc8886a851be162cfe` | 2/20 |

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

## Raw and related evidence

- [Per-process summaries](raw/canonical-ssr-v1-2026-11-13T05-42-09-654Z-ecebc6a2/process-summaries.json)
- [Result-table migration map](../MIGRATION.md)
- [Unranked fixture admission checks](raw/canonical-ssr-v1-2026-11-13T05-42-09-654Z-ecebc6a2/admissions.json)

Allocation measurements and construction-path controls remain separate from this renderer scoreboard. They are embedded below the scoreboard in the root README and retained in the [engineering reports](../engineering/README.md).
