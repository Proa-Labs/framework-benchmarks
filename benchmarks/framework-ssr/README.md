# Full-framework SSR

This suite compares Proa, Exact, Next.js, Astro, SvelteKit and Leptos through production HTTP routes. It reuses `tooling/load/driver.mjs`, its worker processes and the repository's statistics module. Its end-to-end boundary covers the framework's request pipeline through complete HTML.

`contract.json` defines the complete six-framework, eight-workload matrix. `workloads.ts` reuses canonical raw inputs and supplies every adapter with the same core data:

- **Component page:** four sections, 32 cards and 160 feature items.
- **Product grid:** 96 products, formatted prices/ratings and 480 SVG stars.
- **Table:** 1,000 rows and 12 columns, with escaped text, currency/date formatting, conditional status and variable-length tag lists.

The five showcase workloads share prepared fixtures with the renderer-only suite.

The framework contract allows generated classes and presentational wrappers to differ. Business elements, order, content, roles and a request-specific query value must match. Every timed response is checked against its complete admitted bytes, including the framework shell. There is no database, external I/O, full-document cache or pre-rendered business HTML. Formatting, loops, escaping and branches run inside each production request. JavaScript adapters reuse one date/time formatter; formatter construction is setup, while formatting each row remains timed.

## Toolchain and execution

Use Bun **1.4.2** for every JavaScript adapter, builder and load worker. Type checking uses **TypeScript 7.0.2**, the native Go compiler published as `tsc`; linting uses **Biome 2.6.6**. These versions are pinned in the root lockfile. Native Rust, Go, JVM, PHP, Python and Ruby adapters keep their own runtimes.

```sh
bun install --frozen-lockfile
bun benchmarks/framework-ssr/build.ts  # Generates fixtures/types, checks with native TS 7, builds production servers
bun run typecheck
bun run lint
bun test benchmarks/framework-ssr/test
bun benchmarks/framework-ssr/run.ts --no-build
```

The builder checks out Exact's revision from the contract, uses its unmodified production JavaScript web builder and normal renderer/page server, and retains normal render-ahead preparation. Next.js uses its dynamic App Router and production request handler. Astro uses its server build and official middleware adapter. SvelteKit uses its production Node adapter with client hydration disabled. JavaScript servers run on Bun. Proa uses its Axum SSR adapter and Leptos 0.7.8 uses the official `leptos_axum::render_app_async_with_context` complete-document handler. Leptos serves these fixtures without client hydration or a content security policy and omits the unused script nonce to keep complete HTML stable across repeated requests. Each Rust server uses one Tokio worker thread. All build and runtime versions are retained in the capture.

Before timing, all adapters must pass semantic admission, three mutation controls per workload, request freshness, no-store and same-URL byte stability. Three rotated fresh server processes per phase kind measure capacity with 64 connections, then equal-load latency at 10, 5 and 1 scheduled requests/s for cards, products and table respectively. Each framework gets the same rate for a given workload; capacity windows (10 seconds for cards/products, 60 seconds for the table), ten-second equal-load windows and raw sample counts are retained. These rates are chosen to avoid overload. The publication validator rejects request errors, incomplete rosters/repeats, wrong runtimes, failed parity, mismatched observation windows and generator-limited phases. `--parity-only` validates all 48 cells without timing. `--smoke` runs a functional check. `--workers` changes generator width without changing the server contract.

`results/latest.json` and the matching Markdown report are written only after validation. Raw admission HTML lives under `results/raw/<capture-id>/`. These are full response measurements; do not merge them with pure renderer times. Payload sizes differ, and hydration, startup and databases are outside this experiment.

## C4 capture host

`cloud/c4-job.yaml` reserves an isolated spot `c4-standard-16-lssd` node in the existing GKE benchmark pool. It does not start a CI runner or mount a service-account token. `cloud/bootstrap.sh` installs checksum-verified toolchains. Use one logical CPU for the server, leave its SMT sibling idle, and place generators on the remaining CPUs. Retain node/CPU topology and the exact source archive with each run. A spot interruption requires restarting the complete capture.

Both Rust adapter lockfiles pin the shared showcase crate's Proa revision. If upstream history no longer serves it, seed Cargo's git cache from a verified local copy of that exact commit. Delete the temporary Job after downloading the captures. Cloud build time is outside all timed phases.

Biome's CSS specificity exception is limited to the existing layered site styles. The JSX semantic-element exception is limited to the shared catalog's ARIA list vocabulary. Raw benchmark HTML is evidence, not lint input.

Astro frontmatter unused-symbol rules are disabled for Astro and Svelte template files because its imports and values are referenced by template expressions; Biome currently treats that usage separately. End-to-end admission checks those bindings.

The site derives workload selectors, measurements and previews from the validated capture. Historical captures retain their original contract and roster. Current publication captures use schema 2 and reject missing workloads or parity cells. CI builds all adapters and runs the entire matrix as a smoke test. Smoke windows last ten seconds. Publication capacity windows last 10 seconds for cards/products and 60 seconds for the table. A ten-second table probe produced no in-window completions for Exact because its 64-request batch took longer than the window. A sixty-second probe captured repeated completion batches without errors or generator limits. The longer table window applies to every framework. All adapters share the same 60-second request deadline, allowing the slowest large-page requests to finish when 64 connections queue work. In-window capacity counts completions inside the measurement window.

The C4 publication run uses `--workers 24`. With server CPU 0 and its SMT sibling 8 idle, run the harness with `taskset -c 1-7,9-15 env BENCH_SERVER_CPU=0 bun benchmarks/framework-ssr/run.ts --no-build --workers 24`. Verify that topology on the actual host before reusing CPU numbers. A 12-worker probe exceeded the per-worker CPU guard on the product grid; 24 workers preserved the throughput ceiling with headroom. The normal publication guard remains enabled.
