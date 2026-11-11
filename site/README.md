# frameworks.run

The website for Frameworks, built in this repository from the existing benchmark captures. This is a static presentation layer: no second benchmark suite, copied fixtures, or manually transcribed measurement dataset.

## Develop

From the repository root:

```sh
bun install --cwd rendering/external/react --frozen-lockfile
bun install --cwd site --frozen-lockfile
bun run --cwd site dev
```

The preview serves at `http://127.0.0.1:4317`, watches the site and capture files, and reloads after successful builds. Set `PORT` to use another local port.

```sh
bun run --cwd site test
bun run --cwd site build
bun run --cwd site test:browser
```

Browser tests use the pinned Playwright version. If its Chromium is not installed, run `cd site && bun node_modules/playwright/cli.js install chromium`. The static output is `site/dist/`; any static host can serve it. These commands do not publish the site or run benchmarks.

## One source of truth

| Existing source                                                        | Website view  |
| ---------------------------------------------------------------------- | ------------- |
| `rendering/results/latest.json` and its recorded per-process summaries | Rendering     |
| `page-load/results/latest.json`                                        | HTTP          |
| `suspense-load/results/latest.json`                                    | Streaming     |
| `cold-start/results/latest.json`                                       | Startup       |
| `framework-ssr/results/latest.json`                                    | Framework SSR |

`data.mjs` adapts those captures, reuses the shared statistics module and canonical rendering validator, and rejects unsupported or incomplete captures. `catalog.json` contains display metadata only: categories, project URLs and colors. It contains no measurements.

The build emits the original capture bytes under `dist/data/captures/`, normalized website data at `dist/data/results.json`, and SHA-256 provenance at `dist/data/manifest.json`. Original dates, versions and dirty-source disclosures remain visible. Historic captures are not relabeled as new measurements when this website changes. Site presentation changes do not alter measurement data. Runtime and lockfile changes require new captures.

Run the existing suites to collect new evidence. Rebuild this site to present the resulting captures. The site's own build, tests and UI do not need Rust, Ruby, Java, Go or a benchmark rerun.

## Feature evidence

`/features` compares documented capabilities separately from benchmark results. `feature-schema.mjs` owns definitions and support states; `features-data.mjs` and `feature-evidence.mjs` own review scopes, dates, notes, and primary-source links. The same registry generates the static matrix, detail dialogs, and downloadable `data/features.json`; there is no second hand-maintained table. Add an explicit review entry when extending the roster. Supported and planned claims need a source; unverified entries remain “Not reviewed,” never an inferred “No.”

The category sidebar starts with All features. The searchable Tools multi-select filters projects and provides removable selection chips. Tool IDs and project-type filters persist in the URL; older comma-separated q links remain supported. Select a tool for its complete profile, a cell for its source note, or a column heading for the definition. The header links to Features from every page.

## Presentation and contributions

The app retains the earlier Frameworks prototype's bars, line charts, percentile popovers and Flow illustration, with compact workload controls and previews rendered from canonical fixtures. It adds a standalone shell, table view, shareable URL state, source downloads, methodology and ownership pages, local assets and GitHub links for proposals and corrections. No viewer-specific APIs or CDN dependencies are required.

The sun/moon button toggles light and dark mode. The site follows the OS until a visitor uses the toggle, remembers that choice locally, and applies it before first paint across the explorer, About and Methodology pages.

Framework marks use theme-aware monochrome contrast in rows, line legends, tables, hover cards and the directory, including hover and selection states.

Every renderer gets the same styling rules. Initial selection includes the complete roster; nothing receives a permanent Proa highlight. Flow is explicitly an illustration from aggregate paired run measurements, and errors remain available rather than being animated as successes.

Andrew Hariri maintains the site and is the founder of Proa Labs. This affiliation is disclosed; the project does not claim independent certification. Proposed implementations and corrections go to the existing GitHub repository.

The local Exact investigation is not imported: it uses a different workload and has not passed this repository's canonical publication protocol.

## Cloudflare deployment

This site uses **Cloudflare Workers Static Assets**, with no application server or database. `wrangler.json` names the `frameworks-run` Worker in the existing Cloudflare account and serves only `dist/`. HTML routes use Cloudflare's default clean URLs; unknown paths return the authored 404 page. `_headers` supplies basic static response headers.

The initial deployment was uploaded from `dist/` through the signed-in Cloudflare dashboard. Its default URL is <https://frameworks-run.app-proa-mail.workers.dev/>. The configured custom hostname is <https://frameworks.run/>; it requires the zone's Cloudflare nameservers to be active.

```sh
bun run --cwd site deploy:check  # Build and validate; does not publish
bun run --cwd site deploy        # Build and publish through Wrangler
```

Wrangler needs a current Cloudflare login or `CLOUDFLARE_API_TOKEN`. The existing local login was expired during initial setup; the dashboard upload did not refresh it. To sign in for future CLI deployments, run `cd site && bun --bun node_modules/wrangler/bin/wrangler.js login` and review the permissions before authorizing. Credentials belong in local Wrangler storage or CI secrets, never this repository.

The **Frameworks website** GitHub Actions workflow validates pull requests. It deploys only when manually run from `main` with the `deploy` option selected, after the build and browser checks pass. Before using that job, configure the repository's `CLOUDFLARE_API_TOKEN` secret with access to deploy Workers in the configured account and edit this zone's DNS for the custom hostname. It does not deploy on ordinary pushes or pull requests.

At the registrar (Namecheap), activate the zone using Custom DNS:

- `arnold.ns.cloudflare.com`
- `elsa.ns.cloudflare.com`

Cloudflare imported the existing MX and SPF records. The old apex parking A record (`162.255.119.83`) was removed from the new Cloudflare zone and replaced by the Worker-managed hostname record; the mail records were retained. On November 9, 2026, Namecheap confirmed that Custom DNS was saved with `arnold.ns.cloudflare.com` and `elsa.ns.cloudflare.com`. Cloudflare activation and HTTPS on the custom hostname remain subject to registry propagation and certificate issuance. Nameserver propagation and certificate issuance may delay availability on the custom hostname.

Cloudflare documentation: [Static Assets](https://developers.cloudflare.com/workers/static-assets/) · [Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/).

The SSR Rendering view opens with all three workloads side by side. Column headings sort the same renderer roster by that workload. Compact workload tabs open the individual charts directly; comparison exports include every visible renderer/workload pair. The About page defines each project classification, and the ecosystem directory links to those definitions.

Workload previews render the existing canonical React fixture source at build time. Install its locked dependencies with `bun install --cwd rendering/external/react --frozen-lockfile` before building the site. Preview-only CSS and placeholder images do not enter timed measurements. Tool-type filters use the role labels documented on About, combine by union, persist in the URL, and apply to all chart modes and exports.

Use the pinned Bun 1.4.2 runtime. Root `bun run lint` uses Biome 2.6.6; `bun run typecheck` uses TypeScript 7.0.2, the native Go compiler. The separate Framework SSR view uses the shared 32-card catalog contract documented in `framework-ssr/README.md`; it never mixes these HTTP numbers with pure render times.

Streaming uses load curves only, with stacked P50 and P99 latency panels or a throughput curve. All charts use linear scales. Curve exports contain every displayed rate and percentile. Workload miniatures stay mounted while switching selections.

The Features page covers 71 behaviors in 15 categories. Definitions live in `feature-schema.mjs`; source-backed findings live in `features-data.mjs`, `feature-evidence.mjs`, the completed review in `feature-audit.mjs`, new framework scopes in `feature-additions.mjs`, and database/backend findings in `feature-backend.mjs`. Each new finding includes its scope and a primary source. “Not documented” records a bounded review that did not establish the defined behavior; it is not an unsupported claim. “Outside scope” records responsibilities delegated to a host/framework. Reserve “Not reviewed” for future work, rather than filling gaps with invented support.

The `/features` landing page defaults to All features and Overview; every category also defaults to Overview with equal-width supported capability segments, a three-source legend, and a Supported count (built-in plus official and third-party packages) matching the default sort. Matrix remains available. Category and tool filters apply to both displays, persist in the URL, and each segment opens its exact findings. Bar length, displayed Supported totals and numeric sorting all count only built-in, official-package and third-party-package support. Qualified, planned, undocumented and outside-scope findings stay in profiles and the matrix. `src/feature-summary.mjs` counts states without weights: partial support, packages, planned work, and scope boundaries never become full built-in points. This is documentation coverage, not an API quality or exhaustive ecosystem ranking; metadata design notes compare concrete composition and override behavior separately.
