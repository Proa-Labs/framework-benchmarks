# frameworks.run

React + Vite website for this repository's benchmark captures and sourced feature reviews. Performance, Features, About and Methodology share React components and client-side navigation. Vite builds hashed assets and prerenders those components for a populated first paint; Cloudflare serves the static output without an application server.

## Develop

Run from the repository root using the pinned Bun 1.4.2 runtime:

```sh
bun install --frozen-lockfile
bun install --cwd rendering/external/react --frozen-lockfile
bun install --cwd site --frozen-lockfile
bun run --cwd site dev
```

Open `http://127.0.0.1:4317`. Vite supplies React Fast Refresh and CSS hot reload. Validated capture and feature-evidence changes regenerate the imported data automatically. Set `PORT` to choose another port.

```sh
bun run check
bun run --cwd site test:browser
bun run --cwd site build
```

Install Playwright's pinned Chromium first if needed: `cd site && bun node_modules/playwright/cli.js install chromium`. Root linting uses Biome; type checking uses TypeScript 7's native Go compiler. Builds and UI checks require no benchmark rerun or native toolchains.

## Structure

- `src/pages/`: performance explorer, feature comparison and document pages.
- `src/components/`: shared header, theme toggle, logos and footer.
- `src/App.jsx`: React Router routes, including legacy URL aliases.
- `src/charts/dashboard-controller.mjs`: existing D3 performance charts, mounted and disposed by the performance React page. Features use React state and events.
- `prepare-data.mjs`: validates retained measurements and prepares generated data, provenance and canonical fixture previews.
- `build.mjs`: Vite client/server builds and React prerendering. `index.html` is the Vite entry shell; page content is authored in JSX.

`.generated/`, `.ssr/` and `dist/` are disposable build outputs. Fixture preview HTML is generated from the benchmark contract, including deliberate escaping examples; it is evidence, separate from the website's React pages.

## Measurements and evidence

| Source                              | Website view  |
| ----------------------------------- | ------------- |
| `rendering/results/latest.json`     | SSR Rendering |
| `framework-ssr/results/latest.json` | Framework SSR |
| `page-load/results/latest.json`     | HTTP          |
| `suspense-load/results/latest.json` | Streaming     |
| `cold-start/results/latest.json`    | Startup       |

`data.mjs` adapts these sources using shared statistics and validators. `catalog.json` contains project metadata, never timings. Builds reject incomplete or invalid captures, retain original JSON bytes under `dist/data/captures/`, emit normalized data at `dist/data/results.json`, and publish SHA-256 provenance in `dist/data/manifest.json`.

New captures flow into the next build automatically. Dates, machine details, versions and output boundaries remain attached to their actual measurements. Selected contributor smoke runs do not replace publication pointers. See [CONTRIBUTING.md](../CONTRIBUTING.md) for capture and source-retention commands.

Feature definitions live in `feature-schema.mjs`; the `feature-*.mjs` evidence modules supply scopes, findings and primary sources. One registry generates React profiles, matrix, overview counts and `data/features.json`. Supported totals count built-in, official-package and third-party support, without turning qualified or undocumented findings into full support. They measure documented coverage, not API quality.

Themes apply before first paint and persist across routes. Every project uses the same contrast and hover rules. Ownership and Proa Labs affiliation remain disclosed on About.

## Cloudflare and PR previews

`.github/workflows/site.yml` builds and validates each PR, runs browser interactions and the contributor benchmark smoke path, then publishes **same-repository PRs** as Cloudflare Worker versions. It updates a bot comment with a stable preview link and creates a GitHub deployment with an **Open preview** link. Subsequent pushes replace that PR's alias. Fork PRs run checks without deployment credentials.

Preview upload uses `wrangler versions upload --preview-alias pr-N` for the existing `frameworks-run` Worker. It enables Worker preview URLs without changing production traffic or the `frameworks.run` domain. A preview appears after the website job succeeds, not immediately on opening a PR.

Pushes to `main` deploy the just-validated `dist/` to production. A manual workflow run on `main` can also deploy when its `deploy` option is selected. No benchmark runner or presentation change synthesizes new measurements.

The workflow requires the repository Actions secret `CLOUDFLARE_API_TOKEN`, scoped to editing the existing Worker, and its supplied `GITHUB_TOKEN` permissions to write PR comments and deployments. Credentials never belong in source. Token rotation is required before its configured expiration.

For local verification or an explicitly requested deployment:

```sh
bun run --cwd site deploy:check  # Build and Wrangler dry-run
bun run --cwd site deploy        # Publish production
```

Worker configuration is in `wrangler.json`; production is [frameworks.run](https://frameworks.run/). Clean paths such as `/features` are public routes; generated `.html` files are static-host output.
