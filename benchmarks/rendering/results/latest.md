# Canonical rendering result

> Current canonical capture.

- Capture: `canonical-ssr-v1-2026-11-25T08-06-25-695Z-cd348917`
- Captured: 2026-11-25T08:06:25.695Z
- Completed: 2026-11-25T08:46:08.675Z
- Host: Intel(R) Xeon(R) 6985P-C CPU @ 2.30GHz, 16 logical CPUs, 63200768000 bytes RAM
- OS: linux (6.12.105+), x64
- Proa output: Fresh owned RenderBuffer per iteration. Allocation and rendering are timed; flattening/copying, encoding, parity, hashing and output destruction are outside the render timer.
- Harness commit: `7cc21f85d34bd52785a6607d576fe196023ba159`
- Canonical source SHA-256: `7530016dc02e56572bcb69aedc76badd35a5050b076c8a3d4179859e3e1229dc`

## Public scoreboard

On these workloads, the November 25, 2026 capture on Intel(R) Xeon(R) 6985P-C CPU @ 2.30GHz measured Proa rendering the component page 89.6× faster than React, the 1,000-row table 53.4× faster than React, and the product grid 44.0× faster than React. These ratios describe this capture, not every application.

> Lower is better. Strict rows pass unchanged DOM/class parity. Exact† uses an explicitly adapted fixture with equivalent content and native styles; its HTML differs. See [adaptation details](https://github.com/Proa-Labs/framework-benchmarks/blob/7cc21f85d34bd52785a6607d576fe196023ba159/benchmarks/rendering/external/exact/README.md).

| Renderer | Component page | 1,000-row table | Product grid | Airbnb landing page | Nike catalog | GitHub PR review | Sentry logs | ESPN game page |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Proa | 0.001 ms · 1.00× | 0.19 ms · 1.00× | 0.010 ms · 1.00× | 0.009 ms · 1.00× | 0.011 ms · 1.00× | 0.097 ms · 1.00× | 0.22 ms · 1.00× | 0.005 ms · 1.00× |
| Marko | 0.010 ms · 10.5× | 1.50 ms · 7.89× | 0.12 ms · 11.5× | 0.18 ms · 20.2× | 0.23 ms · 19.9× | 5.23 ms · 53.7× | 11.5 ms · 52.0× | 0.098 ms · 21.3× |
| React | 0.088 ms · 89.6× | 10.1 ms · 53.4× | 0.45 ms · 44.0× | 0.61 ms · 67.8× | 0.67 ms · 58.1× | 3.60 ms · 36.9× | 10.8 ms · 48.9× | 0.27 ms · 58.6× |
| Vue | 0.010 ms · 9.86× | 1.64 ms · 8.63× | 0.094 ms · 9.29× | 0.10 ms · 11.2× | 0.13 ms · 11.3× | 1.14 ms · 11.7× | 3.74 ms · 16.9× | 0.066 ms · 14.4× |
| Svelte | 0.009 ms · 9.28× | 1.52 ms · 8.01× | 0.099 ms · 9.78× | 0.12 ms · 13.0× | 0.14 ms · 12.2× | 0.82 ms · 8.45× | 3.09 ms · 14.0× | 0.085 ms · 18.4× |
| Rails | 0.081 ms · 82.5× | 9.23 ms · 48.6× | 0.49 ms · 48.6× | 0.64 ms · 70.6× | 0.90 ms · 78.9× | 5.44 ms · 55.8× | 12.4 ms · 55.9× | 0.33 ms · 71.0× |
| jte | 0.016 ms · 16.4× | 6.81 ms · 35.9× | 0.64 ms · 62.8× | 0.15 ms · 16.2× | 0.28 ms · 24.1× | 2.17 ms · 22.3× | 5.41 ms · 24.5× | 0.082 ms · 17.9× |
| Rocker | 0.037 ms · 37.6× | 10.8 ms · 56.9× | 0.78 ms · 76.7× | 0.51 ms · 56.7× | 0.72 ms · 63.2× | 5.35 ms · 54.9× | 5.74 ms · 26.0× | 0.26 ms · 56.7× |
| Handlebars | 0.032 ms · 32.4× | 4.24 ms · 22.3× | 0.22 ms · 21.7× | 0.51 ms · 56.7× | 1.04 ms · 90.7× | 18.1 ms · 186× | 14.6 ms · 65.8× | 0.37 ms · 80.6× |
| Go html/template | 0.14 ms · 144× | 14.3 ms · 75.4× | 1.17 ms · 116× | 2.66 ms · 295× | 5.28 ms · 461× | 32.9 ms · 338× | 71.4 ms · 323× | 1.35 ms · 294× |
| Jinja2 | 0.11 ms · 111× | 19.6 ms · 103× | 1.44 ms · 142× | 1.01 ms · 112× | 1.84 ms · 161× | 11.4 ms · 117× | 25.2 ms · 114× | 0.58 ms · 125× |
| PHP | 0.034 ms · 34.3× | 1.82 ms · 9.57× | 0.099 ms · 9.74× | 0.46 ms · 51.2× | 0.41 ms · 36.1× | 2.92 ms · 30.0× | 6.12 ms · 27.7× | 0.29 ms · 62.1× |
| Askama | 0.001 ms · 1.29× | 0.74 ms · 3.90× | 0.025 ms · 2.42× | 0.024 ms · 2.64× | 0.039 ms · 3.42× | 0.24 ms · 2.43× | 0.44 ms · 2.01× | 0.008 ms · 1.75× |
| Sailfish | 0.002 ms · 1.89× | 0.65 ms · 3.40× | 0.024 ms · 2.38× | 0.011 ms · 1.20× | 0.016 ms · 1.37× | 0.11 ms · 1.17× | 0.27 ms · 1.22× | 0.005 ms · 0.99× |
| Leptos | 0.019 ms · 19.4× | 1.69 ms · 8.93× | 0.22 ms · 21.9× | 0.11 ms · 11.8× | 0.20 ms · 17.0× | 0.92 ms · 9.44× | 1.48 ms · 6.68× | 0.037 ms · 8.00× |
| Dioxus | 0.17 ms · 168× | 3.56 ms · 18.8× | 0.44 ms · 43.0× | 0.93 ms · 103× | 2.35 ms · 205× | 17.3 ms · 178× | 23.8 ms · 108× | 0.61 ms · 132× |
| Topcoat | 0.016 ms · 16.3× | 1.48 ms · 7.78× | 0.20 ms · 19.3× | 0.35 ms · 38.6× | 0.51 ms · 44.8× | 2.74 ms · 28.1× | 4.64 ms · 21.0× | 0.13 ms · 29.3× |
| Astro | 0.051 ms · 51.7× | 3.03 ms · 16.0× | 0.30 ms · 29.7× | 0.63 ms · 70.0× | 0.80 ms · 70.1× | 5.70 ms · 58.5× | 18.9 ms · 85.5× | 0.34 ms · 73.3× |
| SvelteKit | 0.012 ms · 11.8× | 1.61 ms · 8.49× | 0.094 ms · 9.30× | 0.089 ms · 9.84× | 0.16 ms · 13.7× | 0.82 ms · 8.39× | 3.35 ms · 15.1× | 0.057 ms · 12.3× |
| Next.js | 0.077 ms · 78.0× | 5.41 ms · 28.5× | 0.45 ms · 44.7× | 0.60 ms · 67.0× | 0.69 ms · 60.3× | 3.77 ms · 38.6× | 10.9 ms · 49.3× | 0.30 ms · 66.1× |
| Exact† | 5.63 ms · 5726× | 153 ms · 808× | 17.6 ms · 1736× | 61.4 ms · 6806× | 101 ms · 8845× | 462 ms · 4743× | 1470 ms · 6647× | 44.9 ms · 9764× |

## Detailed measurements

| Renderer | Workload | P50 | P95 | P99 | Mean | Process P50 range | Processes | Samples/process | Warmups/process | Payload bytes | Payload Δ vs Proa | Parity |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Proa | Component page | 0.984 µs | 1.016 µs | 1.142 µs | 1.019 µs | 0.960 µs–1.143 µs | 5 | 2000 | 200 | 25,108 | +0 | semantic DOM pass |
| Proa | 1,000-row table | 189.765 µs | 205.478 µs | 212.616 µs | 192.422 µs | 187.987 µs–189.895 µs | 5 | 200 | 20 | 988,509 | +0 | semantic DOM pass |
| Proa | Product grid | 10.134 µs | 10.418 µs | 14.335 µs | 10.316 µs | 9.991 µs–10.277 µs | 5 | 500 | 50 | 284,908 | +0 | semantic DOM pass |
| Proa | Airbnb landing page | 9.023 µs | 9.528 µs | 10.889 µs | 9.150 µs | 8.777 µs–9.067 µs | 5 | 200 | 20 | 117,176 | +0 | shared showcase DOM/CSS pass |
| Proa | Nike catalog | 11.468 µs | 11.989 µs | 13.142 µs | 11.565 µs | 11.439 µs–11.880 µs | 5 | 200 | 20 | 127,711 | +0 | shared showcase DOM/CSS pass |
| Proa | GitHub PR review | 97.441 µs | 115.851 µs | 124.861 µs | 99.644 µs | 96.638 µs–104.072 µs | 5 | 100 | 10 | 597,831 | +0 | shared showcase DOM/CSS pass |
| Proa | Sentry logs | 221.172 µs | 245.244 µs | 255.287 µs | 225.547 µs | 219.498 µs–235.004 µs | 5 | 50 | 5 | 875,860 | +0 | shared showcase DOM/CSS pass |
| Proa | ESPN game page | 4.596 µs | 4.930 µs | 5.227 µs | 4.679 µs | 4.185 µs–4.617 µs | 5 | 200 | 20 | 32,846 | +0 | shared showcase DOM/CSS pass |
| Marko | Component page | 10.354 µs | 24.252 µs | 36.872 µs | 26.573 µs | 10.213 µs–11.100 µs | 5 | 2000 | 200 | 24,038 | -1,070 | semantic DOM pass |
| Marko | 1,000-row table | 1.497 ms | 4.539 ms | 8.869 ms | 2.117 ms | 1.377 ms–1.669 ms | 5 | 200 | 20 | 983,187 | -5,322 | semantic DOM pass |
| Marko | Product grid | 116.679 µs | 198.310 µs | 3.185 ms | 210.713 µs | 113.969 µs–119.579 µs | 5 | 500 | 50 | 282,604 | -2,304 | semantic DOM pass |
| Marko | Airbnb landing page | 182.414 µs | 3.415 ms | 6.369 ms | 515.063 µs | 158.407 µs–182.921 µs | 5 | 200 | 20 | 114,155 | -3,021 | shared showcase DOM/CSS pass |
| Marko | Nike catalog | 228.677 µs | 3.519 ms | 6.367 ms | 691.146 µs | 218.649 µs–243.690 µs | 5 | 200 | 20 | 121,831 | -5,880 | shared showcase DOM/CSS pass |
| Marko | GitHub PR review | 5.230 ms | 12.029 ms | 42.674 ms | 6.839 ms | 5.173 ms–5.373 ms | 5 | 100 | 10 | 577,769 | -20,062 | shared showcase DOM/CSS pass |
| Marko | Sentry logs | 11.496 ms | 19.280 ms | 89.339 ms | 14.413 ms | 11.097 ms–11.764 ms | 5 | 50 | 5 | 866,496 | -9,364 | shared showcase DOM/CSS pass |
| Marko | ESPN game page | 98.025 µs | 219.017 µs | 6.250 ms | 318.984 µs | 96.179 µs–107.956 µs | 5 | 200 | 20 | 32,321 | -525 | shared showcase DOM/CSS pass |
| React | Component page | 88.166 µs | 589.357 µs | 3.295 ms | 217.644 µs | 84.291 µs–90.786 µs | 5 | 2000 | 200 | 25,202 | +94 | semantic DOM pass |
| React | 1,000-row table | 10.141 ms | 20.615 ms | 27.789 ms | 10.644 ms | 9.913 ms–11.539 ms | 5 | 200 | 20 | 990,695 | +2,186 | semantic DOM pass |
| React | Product grid | 445.986 µs | 3.253 ms | 10.916 ms | 1.191 ms | 428.588 µs–477.067 µs | 5 | 500 | 50 | 285,868 | +960 | semantic DOM pass |
| React | Airbnb landing page | 611.748 µs | 6.698 ms | 37.117 ms | 2.219 ms | 574.223 µs–646.172 µs | 5 | 200 | 20 | 117,862 | +686 | shared showcase DOM/CSS pass |
| React | Nike catalog | 665.946 µs | 6.975 ms | 25.094 ms | 2.264 ms | 606.260 µs–717.459 µs | 5 | 200 | 20 | 128,853 | +1,142 | shared showcase DOM/CSS pass |
| React | GitHub PR review | 3.596 ms | 17.741 ms | 40.673 ms | 6.941 ms | 3.398 ms–3.873 ms | 5 | 100 | 10 | 601,633 | +3,802 | shared showcase DOM/CSS pass |
| React | Sentry logs | 10.811 ms | 51.929 ms | 98.675 ms | 21.206 ms | 9.749 ms–15.016 ms | 5 | 50 | 5 | 875,888 | +28 | shared showcase DOM/CSS pass |
| React | ESPN game page | 269.380 µs | 4.661 ms | 7.550 ms | 1.069 ms | 256.440 µs–335.410 µs | 5 | 200 | 20 | 33,334 | +488 | shared showcase DOM/CSS pass |
| Vue | Component page | 9.707 µs | 22.177 µs | 40.543 µs | 33.160 µs | 9.383 µs–10.268 µs | 5 | 2000 | 200 | 25,700 | +592 | semantic DOM pass |
| Vue | 1,000-row table | 1.638 ms | 5.114 ms | 9.496 ms | 2.527 ms | 1.583 ms–1.675 ms | 5 | 200 | 20 | 1,006,523 | +18,014 | semantic DOM pass |
| Vue | Product grid | 94.150 µs | 367.617 µs | 5.177 ms | 297.677 µs | 93.573 µs–109.821 µs | 5 | 500 | 50 | 287,420 | +2,512 | semantic DOM pass |
| Vue | Airbnb landing page | 101.238 µs | 205.169 µs | 6.296 ms | 320.233 µs | 95.533 µs–102.127 µs | 5 | 200 | 20 | 120,269 | +3,093 | shared showcase DOM/CSS pass |
| Vue | Nike catalog | 129.591 µs | 2.114 ms | 5.382 ms | 478.581 µs | 120.925 µs–132.432 µs | 5 | 200 | 20 | 154,091 | +26,380 | shared showcase DOM/CSS pass |
| Vue | GitHub PR review | 1.137 ms | 10.924 ms | 52.850 ms | 6.434 ms | 1.045 ms–1.286 ms | 5 | 100 | 10 | 855,405 | +257,574 | shared showcase DOM/CSS pass |
| Vue | Sentry logs | 3.739 ms | 9.469 ms | 13.017 ms | 4.437 ms | 2.971 ms–4.690 ms | 5 | 50 | 5 | 1,053,797 | +177,937 | shared showcase DOM/CSS pass |
| Vue | ESPN game page | 66.236 µs | 158.641 µs | 6.284 ms | 225.562 µs | 61.528 µs–80.031 µs | 5 | 200 | 20 | 36,340 | +3,494 | shared showcase DOM/CSS pass |
| Svelte | Component page | 9.133 µs | 28.039 µs | 45.588 µs | 24.865 µs | 9.028 µs–9.550 µs | 5 | 2000 | 200 | 25,748 | +640 | semantic DOM pass |
| Svelte | 1,000-row table | 1.520 ms | 5.095 ms | 9.419 ms | 2.505 ms | 1.487 ms–1.599 ms | 5 | 200 | 20 | 1,003,227 | +14,718 | semantic DOM pass |
| Svelte | Product grid | 99.126 µs | 223.345 µs | 3.165 ms | 233.447 µs | 92.823 µs–111.344 µs | 5 | 500 | 50 | 286,476 | +1,568 | semantic DOM pass |
| Svelte | Airbnb landing page | 117.082 µs | 275.970 µs | 5.224 ms | 304.733 µs | 82.439 µs–131.058 µs | 5 | 200 | 20 | 119,765 | +2,589 | shared showcase DOM/CSS pass |
| Svelte | Nike catalog | 139.864 µs | 1.023 ms | 3.865 ms | 311.609 µs | 128.810 µs–144.445 µs | 5 | 200 | 20 | 147,241 | +19,530 | shared showcase DOM/CSS pass |
| Svelte | GitHub PR review | 823.061 µs | 3.729 ms | 6.254 ms | 1.347 ms | 780.956 µs–902.412 µs | 5 | 100 | 10 | 675,234 | +77,403 | shared showcase DOM/CSS pass |
| Svelte | Sentry logs | 3.093 ms | 7.893 ms | 9.898 ms | 3.738 ms | 2.705 ms–3.454 ms | 5 | 50 | 5 | 1,118,535 | +242,675 | shared showcase DOM/CSS pass |
| Svelte | ESPN game page | 84.613 µs | 146.526 µs | 5.453 ms | 216.225 µs | 80.739 µs–86.114 µs | 5 | 200 | 20 | 36,180 | +3,334 | shared showcase DOM/CSS pass |
| Rails | Component page | 81.153 µs | 111.034 µs | 531.935 µs | 96.786 µs | 79.037 µs–83.183 µs | 5 | 2000 | 200 | 35,839 | +10,731 | semantic DOM pass |
| Rails | 1,000-row table | 9.229 ms | 9.808 ms | 10.105 ms | 9.053 ms | 9.134 ms–9.359 ms | 5 | 200 | 20 | 1,228,793 | +240,284 | semantic DOM pass |
| Rails | Product grid | 492.661 µs | 816.981 µs | 2.201 ms | 574.142 µs | 472.193 µs–532.247 µs | 5 | 500 | 50 | 296,823 | +11,915 | semantic DOM pass |
| Rails | Airbnb landing page | 636.734 µs | 936.301 µs | 1.593 ms | 693.311 µs | 634.083 µs–647.131 µs | 5 | 200 | 20 | 117,812 | +636 | shared showcase DOM/CSS pass |
| Rails | Nike catalog | 904.428 µs | 1.130 ms | 1.620 ms | 960.678 µs | 888.285 µs–915.521 µs | 5 | 200 | 20 | 128,143 | +432 | shared showcase DOM/CSS pass |
| Rails | GitHub PR review | 5.436 ms | 6.384 ms | 6.912 ms | 5.593 ms | 5.408 ms–5.576 ms | 5 | 100 | 10 | 601,500 | +3,669 | shared showcase DOM/CSS pass |
| Rails | Sentry logs | 12.362 ms | 13.027 ms | 14.815 ms | 12.537 ms | 12.205 ms–12.722 ms | 5 | 50 | 5 | 875,884 | +24 | shared showcase DOM/CSS pass |
| Rails | ESPN game page | 326.212 µs | 394.705 µs | 1.268 ms | 375.874 µs | 321.639 µs–335.441 µs | 5 | 200 | 20 | 32,857 | +11 | shared showcase DOM/CSS pass |
| jte | Component page | 16.122 µs | 22.027 µs | 54.173 µs | 40.268 µs | 14.994 µs–24.423 µs | 5 | 2000 | 200 | 25,109 | +1 | semantic DOM pass |
| jte | 1,000-row table | 6.805 ms | 21.638 ms | 29.749 ms | 8.846 ms | 6.069 ms–8.302 ms | 5 | 200 | 20 | 988,510 | +1 | semantic DOM pass |
| jte | Product grid | 636.917 µs | 3.774 ms | 4.400 ms | 1.257 ms | 630.208 µs–656.591 µs | 5 | 500 | 50 | 284,909 | +1 | semantic DOM pass |
| jte | Airbnb landing page | 146.475 µs | 2.168 ms | 5.281 ms | 440.484 µs | 137.800 µs–161.565 µs | 5 | 200 | 20 | 117,812 | +636 | shared showcase DOM/CSS pass |
| jte | Nike catalog | 276.816 µs | 3.375 ms | 4.440 ms | 623.839 µs | 259.050 µs–291.966 µs | 5 | 200 | 20 | 127,753 | +42 | shared showcase DOM/CSS pass |
| jte | GitHub PR review | 2.170 ms | 7.710 ms | 8.748 ms | 3.673 ms | 2.052 ms–3.191 ms | 5 | 100 | 10 | 598,870 | +1,039 | shared showcase DOM/CSS pass |
| jte | Sentry logs | 5.414 ms | 8.581 ms | 9.187 ms | 5.522 ms | 5.285 ms–5.604 ms | 5 | 50 | 5 | 875,884 | +24 | shared showcase DOM/CSS pass |
| jte | ESPN game page | 82.465 µs | 177.244 µs | 5.277 ms | 261.398 µs | 76.351 µs–82.593 µs | 5 | 200 | 20 | 32,853 | +7 | shared showcase DOM/CSS pass |
| Rocker | Component page | 37.018 µs | 47.804 µs | 3.052 ms | 78.888 µs | 36.022 µs–37.328 µs | 5 | 2000 | 200 | 25,109 | +1 | semantic DOM pass |
| Rocker | 1,000-row table | 10.796 ms | 24.102 ms | 36.455 ms | 11.151 ms | 7.947 ms–10.968 ms | 5 | 200 | 20 | 990,508 | +1,999 | semantic DOM pass |
| Rocker | Product grid | 776.931 µs | 4.150 ms | 5.033 ms | 1.631 ms | 647.187 µs–820.818 µs | 5 | 500 | 50 | 285,869 | +961 | semantic DOM pass |
| Rocker | Airbnb landing page | 512.025 µs | 4.344 ms | 6.892 ms | 1.103 ms | 495.433 µs–522.792 µs | 5 | 200 | 20 | 117,812 | +636 | shared showcase DOM/CSS pass |
| Rocker | Nike catalog | 724.950 µs | 4.456 ms | 5.840 ms | 1.403 ms | 677.021 µs–775.471 µs | 5 | 200 | 20 | 128,143 | +432 | shared showcase DOM/CSS pass |
| Rocker | GitHub PR review | 5.353 ms | 11.546 ms | 15.359 ms | 6.197 ms | 5.331 ms–5.599 ms | 5 | 100 | 10 | 601,500 | +3,669 | shared showcase DOM/CSS pass |
| Rocker | Sentry logs | 5.743 ms | 15.333 ms | 18.712 ms | 7.551 ms | 5.392 ms–6.193 ms | 5 | 50 | 5 | 875,884 | +24 | shared showcase DOM/CSS pass |
| Rocker | ESPN game page | 260.401 µs | 4.385 ms | 6.309 ms | 953.335 µs | 238.992 µs–262.957 µs | 5 | 200 | 20 | 32,857 | +11 | shared showcase DOM/CSS pass |
| Handlebars | Component page | 31.848 µs | 51.109 µs | 176.867 µs | 54.518 µs | 29.175 µs–36.034 µs | 5 | 2000 | 200 | 25,108 | +0 | semantic DOM pass |
| Handlebars | 1,000-row table | 4.240 ms | 6.382 ms | 13.112 ms | 4.977 ms | 4.164 ms–4.307 ms | 5 | 200 | 20 | 990,694 | +2,185 | semantic DOM pass |
| Handlebars | Product grid | 220.064 µs | 665.733 µs | 3.392 ms | 434.105 µs | 211.983 µs–277.740 µs | 5 | 500 | 50 | 285,868 | +960 | semantic DOM pass |
| Handlebars | Airbnb landing page | 511.512 µs | 3.088 ms | 4.050 ms | 798.926 µs | 485.409 µs–520.116 µs | 5 | 200 | 20 | 117,822 | +646 | shared showcase DOM/CSS pass |
| Handlebars | Nike catalog | 1.040 ms | 4.353 ms | 9.699 ms | 1.677 ms | 1.013 ms–1.122 ms | 5 | 200 | 20 | 128,247 | +536 | shared showcase DOM/CSS pass |
| Handlebars | GitHub PR review | 18.125 ms | 38.451 ms | 54.755 ms | 20.789 ms | 17.958 ms–19.237 ms | 5 | 100 | 10 | 602,885 | +5,054 | shared showcase DOM/CSS pass |
| Handlebars | Sentry logs | 14.553 ms | 49.254 ms | 60.240 ms | 20.618 ms | 14.442 ms–15.545 ms | 5 | 50 | 5 | 875,899 | +39 | shared showcase DOM/CSS pass |
| Handlebars | ESPN game page | 370.586 µs | 2.273 ms | 5.467 ms | 633.658 µs | 366.374 µs–433.001 µs | 5 | 200 | 20 | 32,868 | +22 | shared showcase DOM/CSS pass |
| Go html/template | Component page | 142.001 µs | 224.716 µs | 235.765 µs | 161.573 µs | 140.788 µs–145.447 µs | 5 | 2000 | 200 | 25,108 | +0 | semantic DOM pass |
| Go html/template | 1,000-row table | 14.309 ms | 14.925 ms | 15.248 ms | 14.332 ms | 14.185 ms–14.608 ms | 5 | 200 | 20 | 990,509 | +2,000 | semantic DOM pass |
| Go html/template | Product grid | 1.174 ms | 1.238 ms | 1.358 ms | 1.178 ms | 1.164 ms–1.179 ms | 5 | 500 | 50 | 285,676 | +768 | semantic DOM pass |
| Go html/template | Airbnb landing page | 2.663 ms | 3.168 ms | 3.290 ms | 2.677 ms | 2.620 ms–2.687 ms | 5 | 200 | 20 | 117,812 | +636 | shared showcase DOM/CSS pass |
| Go html/template | Nike catalog | 5.282 ms | 5.601 ms | 5.651 ms | 5.219 ms | 5.268 ms–5.303 ms | 5 | 200 | 20 | 129,559 | +1,848 | shared showcase DOM/CSS pass |
| Go html/template | GitHub PR review | 32.940 ms | 34.345 ms | 34.787 ms | 32.971 ms | 32.408 ms–33.087 ms | 5 | 100 | 10 | 605,634 | +7,803 | shared showcase DOM/CSS pass |
| Go html/template | Sentry logs | 71.378 ms | 73.559 ms | 74.513 ms | 71.247 ms | 70.026 ms–72.298 ms | 5 | 50 | 5 | 875,884 | +24 | shared showcase DOM/CSS pass |
| Go html/template | ESPN game page | 1.350 ms | 1.965 ms | 2.012 ms | 1.443 ms | 1.287 ms–1.357 ms | 5 | 200 | 20 | 32,857 | +11 | shared showcase DOM/CSS pass |
| Jinja2 | Component page | 108.930 µs | 115.939 µs | 119.306 µs | 109.321 µs | 105.883 µs–111.975 µs | 5 | 2000 | 200 | 25,108 | +0 | semantic DOM pass |
| Jinja2 | 1,000-row table | 19.640 ms | 21.154 ms | 24.637 ms | 19.855 ms | 19.162 ms–20.007 ms | 5 | 200 | 20 | 990,257 | +1,748 | semantic DOM pass |
| Jinja2 | Product grid | 1.435 ms | 1.510 ms | 1.535 ms | 1.440 ms | 1.425 ms–1.490 ms | 5 | 500 | 50 | 285,676 | +768 | semantic DOM pass |
| Jinja2 | Airbnb landing page | 1.008 ms | 1.053 ms | 1.074 ms | 1.012 ms | 989.813 µs–1.053 ms | 5 | 200 | 20 | 117,812 | +636 | shared showcase DOM/CSS pass |
| Jinja2 | Nike catalog | 1.845 ms | 1.906 ms | 1.928 ms | 1.847 ms | 1.803 ms–1.896 ms | 5 | 200 | 20 | 128,133 | +422 | shared showcase DOM/CSS pass |
| Jinja2 | GitHub PR review | 11.353 ms | 12.078 ms | 16.361 ms | 11.587 ms | 11.008 ms–11.493 ms | 5 | 100 | 10 | 600,990 | +3,159 | shared showcase DOM/CSS pass |
| Jinja2 | Sentry logs | 25.155 ms | 35.121 ms | 36.066 ms | 26.395 ms | 25.061 ms–25.339 ms | 5 | 50 | 5 | 875,884 | +24 | shared showcase DOM/CSS pass |
| Jinja2 | ESPN game page | 575.956 µs | 603.349 µs | 616.708 µs | 577.574 µs | 558.135 µs–579.010 µs | 5 | 200 | 20 | 32,857 | +11 | shared showcase DOM/CSS pass |
| PHP | Component page | 33.751 µs | 37.331 µs | 40.401 µs | 34.062 µs | 33.361 µs–34.344 µs | 5 | 2000 | 200 | 25,108 | +0 | semantic DOM pass |
| PHP | 1,000-row table | 1.816 ms | 1.872 ms | 1.887 ms | 1.817 ms | 1.800 ms–1.887 ms | 5 | 200 | 20 | 990,694 | +2,185 | semantic DOM pass |
| PHP | Product grid | 98.684 µs | 106.610 µs | 114.227 µs | 100.426 µs | 95.180 µs–102.221 µs | 5 | 500 | 50 | 285,868 | +960 | semantic DOM pass |
| PHP | Airbnb landing page | 461.963 µs | 474.624 µs | 484.721 µs | 464.309 µs | 453.934 µs–485.839 µs | 5 | 200 | 20 | 117,812 | +636 | shared showcase DOM/CSS pass |
| PHP | Nike catalog | 413.621 µs | 430.564 µs | 447.527 µs | 415.901 µs | 409.404 µs–433.101 µs | 5 | 200 | 20 | 128,247 | +536 | shared showcase DOM/CSS pass |
| PHP | GitHub PR review | 2.921 ms | 2.994 ms | 3.125 ms | 2.919 ms | 2.857 ms–2.969 ms | 5 | 100 | 10 | 601,520 | +3,689 | shared showcase DOM/CSS pass |
| PHP | Sentry logs | 6.119 ms | 6.685 ms | 6.752 ms | 6.132 ms | 6.067 ms–6.188 ms | 5 | 50 | 5 | 875,884 | +24 | shared showcase DOM/CSS pass |
| PHP | ESPN game page | 285.281 µs | 296.376 µs | 309.958 µs | 287.090 µs | 284.907 µs–289.974 µs | 5 | 200 | 20 | 32,858 | +12 | shared showcase DOM/CSS pass |
| Askama | Component page | 1.266 µs | 1.299 µs | 1.320 µs | 1.282 µs | 1.225 µs–1.269 µs | 5 | 2000 | 200 | 44,849 | +19,741 | semantic DOM pass |
| Askama | 1,000-row table | 739.226 µs | 764.417 µs | 782.848 µs | 743.010 µs | 728.552 µs–741.216 µs | 5 | 200 | 20 | 991,007 | +2,498 | semantic DOM pass |
| Askama | Product grid | 24.541 µs | 25.224 µs | 32.850 µs | 24.888 µs | 24.166 µs–25.952 µs | 5 | 500 | 50 | 285,676 | +768 | semantic DOM pass |
| Askama | Airbnb landing page | 23.819 µs | 24.541 µs | 30.772 µs | 24.077 µs | 23.151 µs–24.822 µs | 5 | 200 | 20 | 117,812 | +636 | shared showcase DOM/CSS pass |
| Askama | Nike catalog | 39.188 µs | 42.006 µs | 47.443 µs | 39.664 µs | 38.868 µs–41.520 µs | 5 | 200 | 20 | 128,133 | +422 | shared showcase DOM/CSS pass |
| Askama | GitHub PR review | 237.154 µs | 260.907 µs | 273.883 µs | 240.425 µs | 232.671 µs–243.495 µs | 5 | 100 | 10 | 601,061 | +3,230 | shared showcase DOM/CSS pass |
| Askama | Sentry logs | 444.844 µs | 469.469 µs | 481.721 µs | 449.019 µs | 439.275 µs–465.506 µs | 5 | 50 | 5 | 875,885 | +25 | shared showcase DOM/CSS pass |
| Askama | ESPN game page | 8.032 µs | 8.505 µs | 9.907 µs | 8.127 µs | 7.947 µs–8.211 µs | 5 | 200 | 20 | 32,857 | +11 | shared showcase DOM/CSS pass |
| Sailfish | Component page | 1.857 µs | 1.953 µs | 2.036 µs | 1.899 µs | 1.834 µs–1.996 µs | 5 | 2000 | 200 | 44,849 | +19,741 | semantic DOM pass |
| Sailfish | 1,000-row table | 645.811 µs | 672.372 µs | 694.246 µs | 647.135 µs | 632.098 µs–649.642 µs | 5 | 200 | 20 | 990,694 | +2,185 | semantic DOM pass |
| Sailfish | Product grid | 24.098 µs | 25.043 µs | 31.550 µs | 24.402 µs | 23.950 µs–25.393 µs | 5 | 500 | 50 | 285,868 | +960 | semantic DOM pass |
| Sailfish | Airbnb landing page | 10.860 µs | 11.497 µs | 12.860 µs | 11.019 µs | 10.669 µs–11.064 µs | 5 | 200 | 20 | 117,812 | +636 | shared showcase DOM/CSS pass |
| Sailfish | Nike catalog | 15.753 µs | 17.270 µs | 22.347 µs | 15.964 µs | 15.534 µs–17.271 µs | 5 | 200 | 20 | 128,247 | +536 | shared showcase DOM/CSS pass |
| Sailfish | GitHub PR review | 114.302 µs | 134.178 µs | 141.721 µs | 119.431 µs | 111.698 µs–118.483 µs | 5 | 100 | 10 | 601,520 | +3,689 | shared showcase DOM/CSS pass |
| Sailfish | Sentry logs | 269.875 µs | 295.313 µs | 467.097 µs | 279.747 µs | 267.576 µs–276.254 µs | 5 | 50 | 5 | 875,884 | +24 | shared showcase DOM/CSS pass |
| Sailfish | ESPN game page | 4.572 µs | 4.734 µs | 4.918 µs | 4.632 µs | 4.499 µs–6.526 µs | 5 | 200 | 20 | 32,858 | +12 | shared showcase DOM/CSS pass |
| Leptos | Component page | 19.056 µs | 19.704 µs | 25.328 µs | 19.263 µs | 18.567 µs–19.188 µs | 5 | 2000 | 200 | 25,219 | +111 | semantic DOM pass |
| Leptos | 1,000-row table | 1.695 ms | 1.748 ms | 1.799 ms | 1.702 ms | 1.683 ms–1.712 ms | 5 | 200 | 20 | 991,512 | +3,003 | semantic DOM pass |
| Leptos | Product grid | 221.690 µs | 231.627 µs | 241.146 µs | 224.525 µs | 220.197 µs–232.864 µs | 5 | 500 | 50 | 286,063 | +1,155 | semantic DOM pass |
| Leptos | Airbnb landing page | 106.550 µs | 128.966 µs | 139.318 µs | 109.536 µs | 103.778 µs–108.907 µs | 5 | 200 | 20 | 118,086 | +910 | shared showcase DOM/CSS pass |
| Leptos | Nike catalog | 195.024 µs | 228.468 µs | 238.655 µs | 203.720 µs | 193.500 µs–204.844 µs | 5 | 200 | 20 | 129,155 | +1,444 | shared showcase DOM/CSS pass |
| Leptos | GitHub PR review | 919.793 µs | 1.083 ms | 1.130 ms | 939.813 µs | 902.534 µs–925.919 µs | 5 | 100 | 10 | 603,135 | +5,304 | shared showcase DOM/CSS pass |
| Leptos | Sentry logs | 1.478 ms | 1.559 ms | 1.670 ms | 1.477 ms | 1.457 ms–1.492 ms | 5 | 50 | 5 | 884,362 | +8,502 | shared showcase DOM/CSS pass |
| Leptos | ESPN game page | 36.755 µs | 41.065 µs | 46.680 µs | 36.556 µs | 36.288 µs–36.767 µs | 5 | 200 | 20 | 33,105 | +259 | shared showcase DOM/CSS pass |
| Dioxus | Component page | 165.304 µs | 175.969 µs | 179.805 µs | 165.339 µs | 162.325 µs–166.679 µs | 5 | 2000 | 200 | 25,141 | +33 | semantic DOM pass |
| Dioxus | 1,000-row table | 3.560 ms | 3.753 ms | 3.823 ms | 3.559 ms | 3.551 ms–3.605 ms | 5 | 200 | 20 | 990,695 | +2,186 | semantic DOM pass |
| Dioxus | Product grid | 435.365 µs | 491.669 µs | 501.054 µs | 444.502 µs | 422.915 µs–447.849 µs | 5 | 500 | 50 | 285,868 | +960 | semantic DOM pass |
| Dioxus | Airbnb landing page | 930.117 µs | 966.347 µs | 1.009 ms | 935.656 µs | 912.804 µs–956.084 µs | 5 | 200 | 20 | 118,037 | +861 | shared showcase DOM/CSS pass |
| Dioxus | Nike catalog | 2.355 ms | 2.425 ms | 2.470 ms | 2.354 ms | 2.349 ms–2.375 ms | 5 | 200 | 20 | 128,297 | +586 | shared showcase DOM/CSS pass |
| Dioxus | GitHub PR review | 17.298 ms | 18.066 ms | 18.738 ms | 17.360 ms | 17.198 ms–17.376 ms | 5 | 100 | 10 | 601,612 | +3,781 | shared showcase DOM/CSS pass |
| Dioxus | Sentry logs | 23.808 ms | 24.637 ms | 25.163 ms | 23.890 ms | 23.721 ms–25.148 ms | 5 | 50 | 5 | 875,922 | +62 | shared showcase DOM/CSS pass |
| Dioxus | ESPN game page | 607.856 µs | 625.683 µs | 699.031 µs | 610.401 µs | 598.135 µs–614.140 µs | 5 | 200 | 20 | 32,877 | +31 | shared showcase DOM/CSS pass |
| Topcoat | Component page | 16.009 µs | 16.639 µs | 20.913 µs | 16.066 µs | 15.938 µs–16.344 µs | 5 | 2000 | 200 | 25,108 | +0 | semantic DOM pass |
| Topcoat | 1,000-row table | 1.477 ms | 1.788 ms | 1.814 ms | 1.565 ms | 1.466 ms–1.496 ms | 5 | 200 | 20 | 988,509 | +0 | semantic DOM pass |
| Topcoat | Product grid | 195.144 µs | 202.699 µs | 210.255 µs | 197.042 µs | 194.519 µs–195.843 µs | 5 | 500 | 50 | 284,908 | +0 | semantic DOM pass |
| Topcoat | Airbnb landing page | 348.284 µs | 363.110 µs | 399.896 µs | 351.056 µs | 343.053 µs–362.291 µs | 5 | 200 | 20 | 117,883 | +707 | shared showcase DOM/CSS pass |
| Topcoat | Nike catalog | 513.995 µs | 552.429 µs | 599.011 µs | 521.362 µs | 504.507 µs–520.277 µs | 5 | 200 | 20 | 127,822 | +111 | shared showcase DOM/CSS pass |
| Topcoat | GitHub PR review | 2.740 ms | 3.123 ms | 3.194 ms | 2.807 ms | 2.702 ms–2.750 ms | 5 | 100 | 10 | 598,922 | +1,091 | shared showcase DOM/CSS pass |
| Topcoat | Sentry logs | 4.641 ms | 5.017 ms | 5.346 ms | 4.703 ms | 4.608 ms–4.747 ms | 5 | 50 | 5 | 875,888 | +28 | shared showcase DOM/CSS pass |
| Topcoat | ESPN game page | 134.619 µs | 145.570 µs | 151.106 µs | 136.118 µs | 133.792 µs–136.737 µs | 5 | 200 | 20 | 32,868 | +22 | shared showcase DOM/CSS pass |
| Astro | Component page | 50.826 µs | 84.765 µs | 720.169 µs | 106.901 µs | 49.697 µs–51.349 µs | 5 | 2000 | 200 | 25,108 | +0 | semantic DOM pass |
| Astro | 1,000-row table | 3.033 ms | 6.620 ms | 13.302 ms | 3.825 ms | 2.897 ms–3.092 ms | 5 | 200 | 20 | 990,507 | +1,998 | semantic DOM pass |
| Astro | Product grid | 301.166 µs | 1.174 ms | 4.418 ms | 557.874 µs | 292.754 µs–332.789 µs | 5 | 500 | 50 | 285,868 | +960 | semantic DOM pass |
| Astro | Airbnb landing page | 631.740 µs | 5.651 ms | 12.090 ms | 1.523 ms | 608.586 µs–655.181 µs | 5 | 200 | 20 | 117,707 | +531 | shared showcase DOM/CSS pass |
| Astro | Nike catalog | 803.633 µs | 3.965 ms | 6.074 ms | 1.321 ms | 742.808 µs–810.361 µs | 5 | 200 | 20 | 128,069 | +358 | shared showcase DOM/CSS pass |
| Astro | GitHub PR review | 5.704 ms | 16.595 ms | 40.352 ms | 7.361 ms | 5.106 ms–6.148 ms | 5 | 100 | 10 | 601,482 | +3,651 | shared showcase DOM/CSS pass |
| Astro | Sentry logs | 18.901 ms | 40.559 ms | 63.342 ms | 22.047 ms | 18.004 ms–20.900 ms | 5 | 50 | 5 | 875,869 | +9 | shared showcase DOM/CSS pass |
| Astro | ESPN game page | 336.909 µs | 4.673 ms | 6.963 ms | 875.038 µs | 314.001 µs–383.233 µs | 5 | 200 | 20 | 32,821 | -25 | shared showcase DOM/CSS pass |
| SvelteKit | Component page | 11.590 µs | 19.163 µs | 31.387 µs | 30.963 µs | 11.297 µs–12.230 µs | 5 | 2000 | 200 | 25,770 | +662 | semantic DOM pass |
| SvelteKit | 1,000-row table | 1.612 ms | 5.114 ms | 11.412 ms | 2.606 ms | 1.570 ms–1.707 ms | 5 | 200 | 20 | 1,003,248 | +14,739 | semantic DOM pass |
| SvelteKit | Product grid | 94.216 µs | 183.430 µs | 3.499 ms | 240.439 µs | 92.851 µs–104.924 µs | 5 | 500 | 50 | 286,476 | +1,568 | semantic DOM pass |
| SvelteKit | Airbnb landing page | 88.772 µs | 213.809 µs | 4.646 ms | 282.354 µs | 79.658 µs–91.459 µs | 5 | 200 | 20 | 119,786 | +2,610 | shared showcase DOM/CSS pass |
| SvelteKit | Nike catalog | 156.986 µs | 596.396 µs | 3.641 ms | 304.796 µs | 145.864 µs–160.060 µs | 5 | 200 | 20 | 147,261 | +19,550 | shared showcase DOM/CSS pass |
| SvelteKit | GitHub PR review | 817.787 µs | 4.284 ms | 8.064 ms | 1.679 ms | 777.120 µs–828.185 µs | 5 | 100 | 10 | 675,254 | +77,423 | shared showcase DOM/CSS pass |
| SvelteKit | Sentry logs | 3.349 ms | 9.674 ms | 12.499 ms | 4.043 ms | 3.161 ms–3.519 ms | 5 | 50 | 5 | 1,118,556 | +242,696 | shared showcase DOM/CSS pass |
| SvelteKit | ESPN game page | 56.645 µs | 143.379 µs | 5.275 ms | 210.252 µs | 53.662 µs–58.941 µs | 5 | 200 | 20 | 36,201 | +3,355 | shared showcase DOM/CSS pass |
| Next.js | Component page | 76.794 µs | 127.661 µs | 1.439 ms | 151.740 µs | 74.728 µs–78.072 µs | 5 | 2000 | 200 | 25,201 | +93 | semantic DOM pass |
| Next.js | 1,000-row table | 5.409 ms | 20.693 ms | 28.273 ms | 8.403 ms | 5.320 ms–5.671 ms | 5 | 200 | 20 | 990,694 | +2,185 | semantic DOM pass |
| Next.js | Product grid | 453.313 µs | 2.552 ms | 4.592 ms | 847.039 µs | 433.281 µs–474.794 µs | 5 | 500 | 50 | 285,868 | +960 | semantic DOM pass |
| Next.js | Airbnb landing page | 604.551 µs | 5.890 ms | 36.530 ms | 2.272 ms | 571.429 µs–714.813 µs | 5 | 200 | 20 | 117,862 | +686 | shared showcase DOM/CSS pass |
| Next.js | Nike catalog | 691.370 µs | 6.832 ms | 21.614 ms | 2.195 ms | 664.219 µs–716.942 µs | 5 | 200 | 20 | 128,853 | +1,142 | shared showcase DOM/CSS pass |
| Next.js | GitHub PR review | 3.766 ms | 17.269 ms | 44.068 ms | 6.514 ms | 3.369 ms–4.312 ms | 5 | 100 | 10 | 601,633 | +3,802 | shared showcase DOM/CSS pass |
| Next.js | Sentry logs | 10.903 ms | 54.700 ms | 93.013 ms | 21.507 ms | 9.286 ms–12.864 ms | 5 | 50 | 5 | 875,888 | +28 | shared showcase DOM/CSS pass |
| Next.js | ESPN game page | 303.911 µs | 5.447 ms | 9.511 ms | 1.195 ms | 287.464 µs–362.613 µs | 5 | 200 | 20 | 33,334 | +488 | shared showcase DOM/CSS pass |
| Exact | Component page | 5.634 ms | 18.515 ms | 30.010 ms | 7.477 ms | 5.573 ms–5.687 ms | 5 | 2000 | 200 | 34,637 | +9,529 | adapted content and styles pass |
| Exact | 1,000-row table | 153.239 ms | 664.938 ms | 920.330 ms | 239.188 ms | 150.664 ms–158.552 ms | 5 | 200 | 20 | 1,025,844 | +37,335 | adapted content and styles pass |
| Exact | Product grid | 17.589 ms | 64.225 ms | 92.007 ms | 23.404 ms | 17.532 ms–17.745 ms | 5 | 500 | 50 | 261,879 | -23,029 | adapted content and styles pass |
| Exact | Airbnb landing page | 61.410 ms | 162.389 ms | 229.053 ms | 75.800 ms | 61.335 ms–61.840 ms | 5 | 200 | 20 | 634,312 | +517,136 | adapted business content and compiled native styles pass |
| Exact | Nike catalog | 101.440 ms | 278.092 ms | 364.542 ms | 127.915 ms | 100.856 ms–103.449 ms | 5 | 200 | 20 | 666,162 | +538,451 | adapted business content and compiled native styles pass |
| Exact | GitHub PR review | 462.156 ms | 1336.425 ms | 1548.102 ms | 592.319 ms | 455.349 ms–475.437 ms | 5 | 100 | 10 | 2,187,104 | +1,589,273 | adapted business content and compiled native styles pass |
| Exact | Sentry logs | 1470.205 ms | 5401.418 ms | 6825.508 ms | 2139.621 ms | 1449.126 ms–1521.401 ms | 5 | 50 | 5 | 8,959,674 | +8,083,814 | adapted business content and compiled native styles pass |
| Exact | ESPN game page | 44.876 ms | 130.019 ms | 191.866 ms | 56.645 ms | 44.142 ms–45.191 ms | 5 | 200 | 20 | 477,355 | +444,509 | adapted business content and compiled native styles pass |

## Tail observations

The report flags every cell whose process-median P95 is at least 3× its P50:

- Marko's 1,000-row table P95 was 3.03× its P50 (4.539 ms versus 1.497 ms).
- Marko's airbnb landing page P95 was 18.7× its P50 (3.415 ms versus 182.414 µs).
- Marko's nike catalog P95 was 15.4× its P50 (3.519 ms versus 228.677 µs).
- React's component page P95 was 6.68× its P50 (589.357 µs versus 88.166 µs).
- React's product grid P95 was 7.29× its P50 (3.253 ms versus 445.986 µs).
- React's airbnb landing page P95 was 10.9× its P50 (6.698 ms versus 611.748 µs).
- React's nike catalog P95 was 10.5× its P50 (6.975 ms versus 665.946 µs).
- React's github pr review P95 was 4.93× its P50 (17.741 ms versus 3.596 ms).
- React's sentry logs P95 was 4.80× its P50 (51.929 ms versus 10.811 ms).
- React's espn game page P95 was 17.3× its P50 (4.661 ms versus 269.380 µs).
- Vue's 1,000-row table P95 was 3.12× its P50 (5.114 ms versus 1.638 ms).
- Vue's product grid P95 was 3.90× its P50 (367.617 µs versus 94.150 µs).
- Vue's nike catalog P95 was 16.3× its P50 (2.114 ms versus 129.591 µs).
- Vue's github pr review P95 was 9.61× its P50 (10.924 ms versus 1.137 ms).
- Svelte's component page P95 was 3.07× its P50 (28.039 µs versus 9.133 µs).
- Svelte's 1,000-row table P95 was 3.35× its P50 (5.095 ms versus 1.520 ms).
- Svelte's nike catalog P95 was 7.32× its P50 (1.023 ms versus 139.864 µs).
- Svelte's github pr review P95 was 4.53× its P50 (3.729 ms versus 823.061 µs).
- jte's 1,000-row table P95 was 3.18× its P50 (21.638 ms versus 6.805 ms).
- jte's product grid P95 was 5.93× its P50 (3.774 ms versus 636.917 µs).
- jte's airbnb landing page P95 was 14.8× its P50 (2.168 ms versus 146.475 µs).
- jte's nike catalog P95 was 12.2× its P50 (3.375 ms versus 276.816 µs).
- jte's github pr review P95 was 3.55× its P50 (7.710 ms versus 2.170 ms).
- Rocker's product grid P95 was 5.34× its P50 (4.150 ms versus 776.931 µs).
- Rocker's airbnb landing page P95 was 8.48× its P50 (4.344 ms versus 512.025 µs).
- Rocker's nike catalog P95 was 6.15× its P50 (4.456 ms versus 724.950 µs).
- Rocker's espn game page P95 was 16.8× its P50 (4.385 ms versus 260.401 µs).
- Handlebars's product grid P95 was 3.03× its P50 (665.733 µs versus 220.064 µs).
- Handlebars's airbnb landing page P95 was 6.04× its P50 (3.088 ms versus 511.512 µs).
- Handlebars's nike catalog P95 was 4.19× its P50 (4.353 ms versus 1.040 ms).
- Handlebars's sentry logs P95 was 3.38× its P50 (49.254 ms versus 14.553 ms).
- Handlebars's espn game page P95 was 6.13× its P50 (2.273 ms versus 370.586 µs).
- Astro's product grid P95 was 3.90× its P50 (1.174 ms versus 301.166 µs).
- Astro's airbnb landing page P95 was 8.94× its P50 (5.651 ms versus 631.740 µs).
- Astro's nike catalog P95 was 4.93× its P50 (3.965 ms versus 803.633 µs).
- Astro's espn game page P95 was 13.9× its P50 (4.673 ms versus 336.909 µs).
- SvelteKit's 1,000-row table P95 was 3.17× its P50 (5.114 ms versus 1.612 ms).
- SvelteKit's nike catalog P95 was 3.80× its P50 (596.396 µs versus 156.986 µs).
- SvelteKit's github pr review P95 was 5.24× its P50 (4.284 ms versus 817.787 µs).
- Next.js's 1,000-row table P95 was 3.83× its P50 (20.693 ms versus 5.409 ms).
- Next.js's product grid P95 was 5.63× its P50 (2.552 ms versus 453.313 µs).
- Next.js's airbnb landing page P95 was 9.74× its P50 (5.890 ms versus 604.551 µs).
- Next.js's nike catalog P95 was 9.88× its P50 (6.832 ms versus 691.370 µs).
- Next.js's github pr review P95 was 4.59× its P50 (17.269 ms versus 3.766 ms).
- Next.js's sentry logs P95 was 5.02× its P50 (54.700 ms versus 10.903 ms).
- Next.js's espn game page P95 was 17.9× its P50 (5.447 ms versus 303.911 µs).
- Exact's component page P95 was 3.29× its P50 (18.515 ms versus 5.634 ms).
- Exact's 1,000-row table P95 was 4.34× its P50 (664.938 ms versus 153.239 ms).
- Exact's product grid P95 was 3.65× its P50 (64.225 ms versus 17.589 ms).
- Exact's sentry logs P95 was 3.67× its P50 (5401.418 ms versus 1470.205 ms).

## Parity

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

## Renderer and runtime versions

| Renderer/runtime | Version |
| --- | --- |
| Proa | 0.4.0 @ 367cc10ae520cdf00c16cb38b4ca46d4ab23ebd5 / rustc 1.95.0 (59807616e 2026-04-14) |
| Marko | 6.0.150 / Bun 1.4.2 |
| React | 19.2.4 / Bun 1.4.2 |
| Vue | 3.5.42 / Bun 1.4.2 |
| Svelte | 5.57.2 / Bun 1.4.2 |
| Rails | Rails 8.1.3.1 / ruby 4.0.6 (2026-07-14 revision 03b6d3f889) +PRISM [x86_64-linux] |
| jte | 3.2.4 / openjdk 17.0.21.1 2026-11-17 |
| Rocker | 2.4.0 / openjdk 17.0.21.1 2026-11-17 |
| Handlebars | 4.7.8 / Bun 1.4.2 |
| Go html/template | go version go1.25.5 linux/amd64 |
| Jinja2 | 3.1.6 / Python 3.13.18 |
| PHP | PHP 8.3.6 (cli) (built: Nov 18 2026 23:42:07) (NTS) |
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
- This capture describes one machine and these eight workloads; it is not a universal application ranking.
- Exact uses the disclosed exact-native-v1 adaptation: named native styles, generated classes, text/list wrappers and separated table borders. Content, attributes, formatting and representative computed CSS are checked separately; strict DOM parity is not claimed. Fresh per-render VM/runtime initialization, prepared-input binding, DOM construction and HTML serialization are inside timing; source compilation and input-data construction are outside.

## Raw and related evidence

- [Per-process summaries](raw/canonical-ssr-v1-2026-11-25T08-06-25-695Z-cd348917/process-summaries.json.gz)
- [Result-table migration map](../MIGRATION.md)
- [Exact adapted cards stylesheet](raw/canonical-ssr-v1-2026-11-25T08-06-25-695Z-cd348917/cards-exact.css)
- [Exact adapted table stylesheet](raw/canonical-ssr-v1-2026-11-25T08-06-25-695Z-cd348917/table-exact.css)
- [Exact adapted products stylesheet](raw/canonical-ssr-v1-2026-11-25T08-06-25-695Z-cd348917/products-exact.css)
- [Exact adapted airbnb-home stylesheet](raw/canonical-ssr-v1-2026-11-25T08-06-25-695Z-cd348917/airbnb-home-exact.css)
- [Exact adapted nike-catalog stylesheet](raw/canonical-ssr-v1-2026-11-25T08-06-25-695Z-cd348917/nike-catalog-exact.css)
- [Exact adapted github-pr stylesheet](raw/canonical-ssr-v1-2026-11-25T08-06-25-695Z-cd348917/github-pr-exact.css)
- [Exact adapted sentry-otel stylesheet](raw/canonical-ssr-v1-2026-11-25T08-06-25-695Z-cd348917/sentry-otel-exact.css)
- [Exact adapted espn stylesheet](raw/canonical-ssr-v1-2026-11-25T08-06-25-695Z-cd348917/espn-exact.css)
- [Unchanged fixture admission checks](raw/canonical-ssr-v1-2026-11-25T08-06-25-695Z-cd348917/admissions.json)

Allocation measurements and construction-path controls remain separate from this renderer scoreboard. See the [engineering report](../../../docs/reports/engineering.md) and [mechanism-specific notes](../../../docs/engineering/README.md).
