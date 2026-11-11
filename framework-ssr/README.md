# Full-framework SSR

This suite compares Proa, Exact, Next.js and Astro through production HTTP routes. It reuses `load/driver.mjs`, its worker processes and the repository's statistics module. It has its own contract because a framework's request pipeline cannot be substituted for the synchronous renderer-only boundary.

`contract.json` defines the admission rules and publication settings. `fixture.mjs` supplies identical data to all four adapters. The catalog has 32 ordered articles with dynamic titles, escaped text, prices, conditional availability, tags and a request-specific query value. There is no external I/O or full-document cache. Exact's supported vocabulary requires explicit ARIA list roles; the other adapters use the same semantic contract. Generated classes, text wrappers and framework scripts outside the business root may differ. The complete admitted response is hashed on every measured request, including its framework shell.

## Toolchain and execution

Use Bun **1.4.2** for every JavaScript adapter, builder and load worker. Type checking uses **TypeScript 7.0.2**, the native Go compiler published as `tsc`; linting uses **Biome 2.6.6**. These versions are pinned in the root lockfile. Native Rust, Go, JVM, PHP, Python and Ruby adapters keep their own runtimes.

```sh
bun install --frozen-lockfile
bun install --cwd framework-ssr --frozen-lockfile
bun framework-ssr/build.ts  # Generates fixtures/types, checks with native TS 7, builds production servers
bun run typecheck
bun run lint
bun test framework-ssr/test
bun framework-ssr/run.ts --no-build
```

The builder checks out Exact's revision from the contract, uses its unmodified production JavaScript web builder and normal renderer/page server, and retains normal render-ahead preparation. Next.js uses its dynamic App Router and production request handler. Astro uses its server build and official middleware adapter. Both run through Bun's Node API compatibility. Proa uses its Axum SSR adapter and one Tokio thread. All build and runtime versions are retained in the capture.

Before timing, all adapters must pass semantic admission, four negative controls, request freshness, no-store and same-URL byte stability. Three rotated fresh server processes per phase kind measure capacity with 64 connections, then latency at 50 scheduled requests/s. The publication validator rejects request errors, incomplete rosters/repeats, wrong runtimes, failed parity and generator-limited phases. `--smoke` is a functional check only and cannot be published. `--workers` changes generator width without changing the server contract.

`results/latest.json` and the matching Markdown report are written only after validation. Raw admission HTML lives under `results/raw/<capture-id>/`. These are full response measurements; do not merge them with pure renderer times. Payload sizes differ, and hydration, startup and databases are outside this experiment.

## C4 capture host

`cloud/c4-job.yaml` reserves an isolated spot `c4-standard-16-lssd` node in the existing GKE benchmark pool. It does not start a CI runner or mount a service-account token. `cloud/bootstrap.sh` installs checksum-verified toolchains. Use one logical CPU for the server, leave its SMT sibling idle, and place generators on the remaining CPUs. Retain node/CPU topology and the exact source archive with each run. A spot interruption requires restarting the complete capture.

The retained Proa revision is pinned by Cargo.lock. If upstream history no longer serves it, seed Cargo's git cache from a verified local copy of that exact commit; do not upgrade it silently. Delete the temporary Job after downloading the captures. Cloud build time is outside all timed phases.

Biome's CSS specificity exception is limited to the existing layered site styles. The JSX semantic-element exception is limited to the shared catalog's ARIA list vocabulary. Raw benchmark HTML is evidence, not lint input.

Astro frontmatter unused-symbol rules are disabled for the catalog file because its imports and values are referenced by template expressions; Biome currently treats that usage separately. End-to-end admission checks those bindings.
