# Contributing benchmarks

A contributor should be able to test one implementation without installing every
language in the public roster. A published number must still pass the whole
experiment's correctness and measurement contract.

## First run: Bun only

Use **Bun 1.4.2**. After installing dependencies, `node_modules/.bin/bun` is the
repository's pinned executable if your global Bun differs.

```sh
bun install --frozen-lockfile
bun node_modules/playwright/cli.js install chromium
bun run bench list
bun run bench doctor rendering
bun run bench run rendering --renderers react,vue --workloads cards
```

This installs only the selected JavaScript adapter dependencies, compares their
HTML in Chromium, checks a deliberate incorrect-output control, and records a
short timing run. No Rust, Ruby, Java, Go, Python, PHP or cloud credentials are
needed. Smoke numbers check the implementation; do not quote them as rankings.

```sh
bun run bench run rendering --renderers react --workloads cards,products
bun run bench run rendering --renderers vue --workloads table --out /tmp/vue.json
bun run bench run rendering --renderers react --workloads cards --parity-only
```

React is the reference for selected runs that omit Proa. The complete publication
matrix retains its Proa reference. Both use the same semantic DOM checks. Fixture
construction and compilation happen before timing; each call returns a fresh,
complete owned output using its declared native API. HTTP and streaming are separate experiments.

## Where things live

| Change | Owning file or directory |
| --- | --- |
| Discoverable suites, entrypoints, smoke presets, output locations | `benchmarks/suites.json` |
| Rendering adapter commands and build families | `benchmarks/rendering/canonical/adapters.json` |
| Public rendering roster | `benchmarks/rendering/canonical/roster.json` |
| Workload sizes, iteration budgets, labels, display order and negative controls | `benchmarks/rendering/canonical/workloads.json` |
| JavaScript fixture inputs / reference rendering | `benchmarks/rendering/external/shared/suite_data.mjs` / `benchmarks/rendering/external/react/suite_components.mjs` |
| Native implementations | `benchmarks/rendering/src/` and `benchmarks/rendering/external/<tool>/` |
| Full-framework request contract | `benchmarks/framework-ssr/contract.json` and `benchmarks/framework-ssr/adapters/` |
| HTTP / streaming contracts | `benchmarks/http/scenario.mjs` and `benchmarks/streaming/scenario.mjs` |
| Files included in HTTP/streaming/startup source fingerprints | `<suite>/sources.json` |
| Measurement storage, source snapshots, atomic writes | `tooling/capture/captures.mjs` |
| Display metadata, logos and classifications | `site/data/performance/catalog.json`, `site/data/branding/`, `site/public/logos/` |
| Feature definitions / primary-source findings | `site/data/features/definitions.json`, `site/data/features/reviews/<framework>.json`, `site/data/features/projects.json` |

The suite registry also supplies the website's capture paths. It does not put
render-only timings, HTTP capacity and startup into a common scoring formula.
See [`site/data/README.md`](site/data/README.md) for adding or updating site inputs.

## Add a renderer

```sh
bun run bench new-adapter my-renderer
```

This creates `benchmarks/rendering/external/my-renderer/suite_bench.mjs` and registers a local
adapter. Its placeholder throws until you implement the real renderer. It does
**not** add an unmeasured project to the public scoreboard.

1. Install/pin the renderer in its adapter workspace and update the root
   `bun.lock` when proposing the change. Compile templates and build fixture data
   outside the timed callback. Use the renderer's documented production API.
2. Implement the generated `render(workload)` callback. The shared synchronous
   string harness handles arguments, warmup, sampling and result JSON. Async or
   non-JavaScript engines can use a native harness following
   [`adapters/README.md`](benchmarks/rendering/canonical/adapters/README.md).
3. Run `bun run bench run rendering --renderers my-renderer --workloads cards`.
   Add the other workloads and rerun. A bad DOM, missing card, changed escaping,
   wrong output size, nonfinite duration or reused-output declaration stops the
   run before publication.
4. For a native implementation, change its registry `command`, `args`, `cwd`
   and `setup`. A `custom` setup can provide a `build` argument array. Commands
   run directly, without a shell. Supported substitutions are `{root}`, `{bun}`,
   `{bundle}` and `{id}`. Existing languages use the shared build families.
5. Once all workloads pass, propose the public roster entry, catalog metadata,
   logo/attribution together. Set `versionPackage` (a package name in that adapter
   directory) or `versionCommand` (an argument array) to record its real version;
   a new adapter cannot publish without it. Run the full capture before
   updating the website. A new feature review must distinguish unknown support
   from unsupported features; a benchmark result is not feature evidence.

The scaffold is for synchronous render-to-string APIs. Do not wrap a streaming
or full-framework API in it merely to get a number. Add an adapter to the matching
suite and preserve that suite's response validation and request-specific checks.

## Add a workload

For the rendering suite:

1. Add a deterministic workload to `workloads.json`: stable ID, label,
   description, cardinality, warmup/iteration budgets and a `negative_control`
   `{ "from": "known fixture text", "to": "deliberately wrong text" }`.
   Add the ID to `display_order`.
2. Add input builders and a React `ROOTS[id]` reference. Include escaping,
   dynamic values and branches relevant to the proposed workload. Preview HTML
   comes from this same reference; do not maintain a second screenshot fixture.
3. Port the contract into the adapters you are testing. Use `--workloads <id>`
   and `--renderers <ids>` while iterating. Selected smoke runs can be incomplete;
   the public capture must cover every roster/workload cell.
4. Add a correctness test that changes an input and checks output behavior.
   Update HTTP/streaming contracts only if those experiments should measure the
   workload too. Their timing boundaries are intentionally independent.
5. Rerun the full matrix and regenerate reports. If semantics of an existing
   workload change, introduce a new contract version and update its validator;
   preserve the prior capture rather than relabeling its measurements.

The runner, comparison columns and fixture previews enumerate the manifest.
Language-specific ports remain explicit: a JSON workload declaration cannot
make seventeen engines render an equivalent page by itself.

## Validate locally

All JavaScript projects use one Bun workspace and the root `bun.lock`. Dependency
versions shared across projects live in the root `catalog`; the site's newer
React version has its own named catalog. Bun's isolated linker shares a single
package store while keeping differing framework/peer versions separate. Biome,
TypeScript and Turbo are installed once at the root. The framework benchmark
harness also belongs to the root package, with each adapter a workspace.

`bun run lint` and `bun run typecheck` use Turbo. `bun run build` builds the
JavaScript workspaces in parallel; `bun run build:framework-adapters` builds only
the three framework adapters after generating their common fixtures once.
`bun run dev` starts the website. Existing `bun run bench …` commands continue
to run the measurement protocols directly. Build, browser, capture and benchmark
tasks are uncached, so Turbo cannot replay timings from another run or machine.
Native builds and measurements remain controlled by their suite runners.

Add JavaScript dependencies to the owning workspace's `package.json`, reuse a
`catalog:` pin where appropriate, then run `bun install` from the root. Commit
only the root lockfile; do not create npm, pnpm or per-workspace lockfiles.

The root install covers every JavaScript workspace. Validate with:

```sh
bun run check
bun run --cwd site test:browser
```

`check` runs Biome, TypeScript 7's native Go compiler, contract tests, website
unit tests, validation of every selected publication capture/source snapshot,
and a TanStack Start/Cloudflare production build. Browser checks use Playwright's Chromium. The normal
repository CI additionally builds native adapters and checks generated reports
and charts. The website workflow exercises the Bun-only contributor smoke run
without private Proa build credentials. Exact's generated adapter types are
checked during its production build, after generation; portable typechecking
does not require building Exact.

## Rerun a publication capture

Install all JavaScript dependencies once from the repository root with
`bun install --frozen-lockfile`. Use the Node version in `.nvmrc` for framework
build tooling; measured JavaScript servers run on the pinned Bun runtime.

```sh
bun run bench run rendering --publish
bun run bench run framework --publish
bun run bench run http --publish
bun run bench run streaming --publish
bun run bench run startup --publish
bun run refresh
bun run bench validate rendering
bun run --cwd site build
```

Run suites sequentially on an idle machine. Use the suite README/protocol for
CPU affinity, worker placement and dependency versions; a fast smoke run is not
a substitute. The complete rendering roster needs the pinned Rust toolchain,
Go, Ruby 3.2+/Bundler, JDK 17+/Gradle, PHP and Python. Framework SSR additionally
builds Exact at the commit in its contract. Frozen lockfiles are used; do not
refresh Proa or other upstream revisions as part of a reproducibility run.

`--publish` cannot bypass the suite validator. Changed roster/protocol, missing
parity, request errors and generator saturation remain admission failures under
each suite's rules. Streaming retains overload errors as part of its documented
load curve; it does not pretend those requests succeeded.

## Data is generated JSON

For each suite:

- `results/latest.json` selects the published capture. The site reads it; nobody
  retypes measurements into UI code.
- `results/archive/<capture-id>.json` retains each completed capture once.
- `results/raw/<capture-id>/source.tar.gz` preserves measured source and locks.
  Rendering also retains per-process summaries; Framework SSR keeps admission
  HTML. Load captures contain their phase records directly in the JSON.
- `results/local/` contains smoke/custom outputs, their archives and source
  snapshots, and is ignored by Git. They never enter the publication archive.

IDs include time and a random suffix, so repeated runs on identical source do
not collide. A duplicate archive ID fails instead of overwriting. Source files
are hashed before measurement and checked again before retention. The archive
and snapshot are written before an atomic `latest.json` replacement. Failed or
interrupted runs keep their partial diagnostics and preserve the old publication.
JSON and rendered Markdown are separate files; a report failure can be fixed by
regenerating from the retained JSON, without rerunning measurement.

Existing captures were retained with verified source before the tooling migration.
Their old dates and fingerprints remain unchanged. Reports may use that exact
archived source after the working implementation changes; they must not claim
it is a new run. `bench validate <suite> [capture.json]` checks both the suite's
publication contract and its retained source. Do not edit an archive or fingerprint
to make a check pass. Do not prune raw artifacts referenced by a retained public
capture. Short-lived smoke archives may be removed together with their raw folder.

`site/dist/client/`, `site/dist/server/`, reports and SVGs are derived outputs. Rebuild them; add measurements
by running a suite, not by editing those files.

## Automatic website updates

The website reads each suite’s selected `results/latest.json` through `benchmarks/suites.json`. A merged capture change triggers the website workflow, which validates contracts, immutable raw records and source snapshots, rebuilds the site, tests browser interactions and deploys the same validated artifact to Cloudflare. No timings are copied into UI code. Set the repository secret `CLOUDFLARE_API_TOKEN` for the existing `frameworks-run` Worker.

Keep capture JSON, its archive, referenced raw runs and verified source snapshot together in the PR. A Proa-only rendering refresh preserves the original peer measurements and dates; the site discloses the mixed capture and native output boundaries. A new Proa revision does not automatically become a new benchmark result: run the publication protocol and submit its validated evidence.

On the original capture machine, rerun only Proa with `bun run bench run rendering --publish --refresh-proa` (add `--product-scaling` for the engineering grid). This also works after an earlier Proa refresh: the original peer capture remains the baseline. Use `bun run refresh` to regenerate reports and figures, then `bun run check` before submitting the evidence.

Same-repository PRs publish a non-production Cloudflare version after website validation. The workflow updates one preview comment and a GitHub deployment link on each successful push; forks run checks without the deploy secret. TanStack Start routes, React pages and shared components live in `site/src/`; `bun run --cwd site dev` uses Vite Fast Refresh and Tailwind. The Cloudflare adapter builds a request-time SSR Worker in `site/dist/server/` with matching assets in `site/dist/client/`. Bun runs scripts and builds; Cloudflare local emulation uses the supported Node host (26.13.0 in CI).

## Merge and launch gate

Changes to measured sources require a validated fresh campaign before merging.
`bun run check:publication` and CI's **Publication readiness** check require full
renderer, framework SSR, HTTP, streaming and cold-start publication captures.
They must share `BENCH_CAMPAIGN_ID` and single-CPU server affinity. Each complete
comparison stays on one machine. The parallel protocol permits separate suite
hosts only with the same immutable revision and matching hardware/OS profiles.
Proa-only refreshes, smoke results, mixed campaigns and snapshots of measured
sources that differ from the checkout are rejected.

Use a fresh `BENCH_CAMPAIGN_ID=publication-<unique-id>` for a complete campaign.
The [parallel GCP runner](tooling/cloud/README.md) creates one for five isolated
workers. The legacy `benchmarks/framework-ssr/cloud/capture.sh` runs all five suites on one
isolated host. Both verify CPU/SMT topology before measurement. Keep
the measured source archives and raw captures together when downloading results.
Portable contributor checks and PR previews remain available while publication
is blocked. Both production deployment entry points enforce this gate.

**Publication readiness** is a required status check in the existing main-branch
ruleset. Keep this requirement when editing repository rules. Do not mark the PR
ready or deploy until the complete campaign passes.

### Proa render-only timing boundary

Every default Proa iteration allocates and renders into a fresh owned
`RenderBuffer`. The timer stops before replacing/destroying the previous
output. Flattening/copying, output encoding, parity, hashing and destruction
remain outside this timer. The separately labeled String and reused-copy
controls do not replace the published Proa measurement.

The native executable refuses unoptimized, non-release or debug-assertion
builds. It records the build profile, optimization level, timing boundary and
raw observations in capture order. The capture runner and publication gate
verify those fields and recompute the Proa summaries from the retained samples.


## Render-only admission and unsupported tests

SSR Rendering keeps the same three HTML fixtures, input sizes and strict
full-document DOM/class parity gate for every participant. A failed admission
never receives an HTTP latency or another renderer’s timings in that table.
Each unranked cell opens its own versioned explanation.

Astro renders its production-compiled Astro component directly to a fresh HTML
string. SvelteKit renders its production-compiled page with the native Svelte SSR
runtime from that same build. Both include the complete asynchronous render in
the timer; framework initialization, compilation and fixture construction happen
before it. Proa’s fresh owned `RenderBuffer` timing boundary remains unchanged.

Next.js renders the production-compiled page through its bundled React SSR
runtime. Its framework initialization and page lookup happen before the timer;
rendering the page and producing its owned HTML string happen inside it.
Astro, SvelteKit and Next.js all pass the unchanged fixtures.

The pinned Exact compiler rejects literal class attributes taken from all three
fixtures. Reproduce that result after building the normal framework adapters:

```sh
bun benchmarks/rendering/external/exact/check-admission.mjs
```

The check publishes no latency. Cloud workers run it before rendering and retain
matching machine/campaign/source evidence alongside the capture. Publication
rejects missing, stale or mismatched proof. CI reruns the compiler check so an
obsolete unsupported label cannot silently remain in the comparison.

Historical captures are validated using the roster and workload manifests in
their retained source archive. Growing today’s supported roster does not rewrite
an older capture or its report. Publication still requires a complete fresh run
of the current roster and matching measured sources across all five suites.


## Parallel GCP campaigns

See [the cloud runner](tooling/cloud/README.md). Independent suites run on
separate isolated C4 nodes. Every competitor, workload and repeat within one
suite stays on the same host; render-only product scaling stays with rendering.
The publication gate requires a common campaign and immutable source revision,
matching hardware/OS profiles, full rosters, source archives and raw samples.
Per-suite machine identities remain visible in each capture. No cross-machine
latencies are combined into a single comparison.
