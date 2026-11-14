# Site data

Authored site inputs live here, grouped by purpose. Feature evidence is split by
framework because most reviews update one project's APIs, sources and versions.
Shared definitions stay in one file so adding a feature has one schema to edit.

```text
data/
├── features/
│   ├── definitions.json       # Categories, feature definitions and support states
│   ├── projects.json          # Additional projects outside the rendering catalog
│   └── reviews/
│       ├── askama.json        # One complete, sourced feature review per project
│       ├── topcoat.json
│       └── …
├── performance/
│   ├── catalog.json           # Display metadata and rendering coverage disclosures
│   └── proa-refresh.json      # Temporary review-only capture selection
└── branding/
    └── logo-sources.json      # Logo attribution; SVG assets remain in public/logos
```

## Updating the comparison

- **Review a framework:** edit `features/reviews/<id>.json`. Keep the filename
  equal to its `id`, retain primary sources and update its review dates. Overall
  dates are derived automatically from these files.
- **Add a framework:** add its display metadata to `performance/catalog.json`
  if it participates in rendering, or `features/projects.json` otherwise; add
  its logo/attribution and `features/reviews/<id>.json`. Review files are
  discovered in filename order, with no import list to update. Registering site
  metadata never admits a measured result.
- **Add or change a feature:** edit `features/definitions.json`, then update
  every framework's review. Preparation rejects missing/unknown feature IDs,
  invalid support states and missing evidence. The same definitions drive the
  UI, downloadable evidence and validation.
- **Change measurements:** update the owning benchmark contract, adapter and
  capture under its suite, following [CONTRIBUTING.md](../../CONTRIBUTING.md).
  Suite discovery lives in `benchmarks/suites.json` at the repository root. The
  site reads validated captures directly; do not copy timings or workload
  definitions into this directory. Review selections are separate from captures
  and still block publication until a complete comparison campaign replaces them.

`prepare-data.ts` joins these inputs and emits disposable `.generated/` and
public downloads. Published `/data/*` and `/logos/sources.json` URLs stay stable;
they are output formats, not authored input locations. The development server
watches this directory recursively, including added and removed review files.

Run `bun run test:site` and `bun run typecheck` from the repository root after
editing data; run `bun run --cwd site test:browser` to check the built UI.
