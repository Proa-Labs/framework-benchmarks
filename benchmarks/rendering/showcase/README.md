# Showcase page comparisons

These five workloads use the pinned Proa showcase's initial server-rendered
page: Airbnb home, Nike catalog, GitHub PR review, Sentry logs, and ESPN game.
They are shared by the SSR Rendering and Framework SSR experiments.

## Change one fixture, then regenerate native code

- `fixtures/`: one shared layout and prepared record set per page. The layouts
  retain real collection loops and branches. No checked-in response HTML is
  needed. Source revision, exporter digest, source HTML digest, and expected
  DOM digest are recorded with each fixture.
- `import.mjs`: imports freshly exported upstream HTML into those layouts.
  `tooling/fixtures/showcase-import/` is the pinned, linked Proa exporter.
- `generate-*.mjs` and `emit-template.mjs`: generate ordinary native templates
  and components before compilation. Generated code stays in ignored build
  directories. Timed renderers never interpret a layout tree or return a cached
  page. `fixture.mjs`'s reference serializer is only a correctness oracle.
- `native-*.mjs`, `drivers/`, and `../src/showcase/`: renderer integrations.
  Astro, SvelteKit, and Next use real production framework builds; standalone
  React/Svelte are distinct entries.
- `*-probe.mjs`: untimed admission through both native render APIs and actual
  production HTTP routes. They change text and request values and test escaping,
  rather than only accepting a matching default screenshot.

All native adapters receive the same prepared display strings, collection
records, and branch selectors. Preparation is outside render-only timing.
Each call constructs a fresh owned result. Proa allocates a fresh RenderBuffer
and renders into it; flattening, parity checks, encoding and destruction remain
outside its render timer. Full-request measurements additionally include HTTP
routing and response serialization.

The pages contain 49 Airbnb cards, 117 Nike products, 16 GitHub files with 603
code rows, 400 Sentry log rows, and the ESPN game with 27 plays. Assets, browser
activation, image loading, font loading, layout and paint are separate from
these HTML-rendering measurements.

## HTML admission

Business elements, classes, attributes, text, collection lengths, branches and
original inline CSS must match. The shared projection removes scripts, preload
links, RSJS activation attributes and empty activation wrappers. It adds a
request-control attribute to the first existing body element.

The DOM comparison ignores comments and document-shell edge whitespace,
coalesces adjacent text nodes, and permits equivalent boolean attributes and
percent-encoding in image filenames. It preserves whitespace inside page
elements. React may hoist the title; Next may add equivalent charset/viewport
metadata and an empty metadata Suspense boundary. Only these known transport
differences are normalized. CSS rule order and inline declaration order remain
significant; differing classes or styles fail admission.

Dioxus SSR 0.6.2 writes dynamic attribute strings verbatim. Its adapter escapes
them during component construction, inside the timer. Text uses Dioxus's native
escaping. Leptos's stylesheet value uses its native `inner_html` API as an
expression to avoid treating that stylesheet as inert HTML attributes.

## Exact's explicit adaptation

Exact cannot consume the original CSS class strings or all original HTML tags.
Its native Contract components therefore use finite typed records, named styles
and native equivalents. This is an adapted comparison, never strict DOM parity.
[The pinned styling guide](https://github.com/expo/exact/blob/94b8671f70fe2e25b307a40e7fce66dc27c9f802/docs/contract-for-humans.md#styling-and-layout)
explains its CSS and element restrictions.

`prepare-exact-styles.mjs` records a fixed 1280×800 desktop styling projection
using the same utility stylesheet for every page. CSS outside the native
property/value grammar is recorded by `generate-exact.mjs`, with the pinned
compiler's diagnostic. A rejection on SVG is scoped to SVG, so it cannot remove
a valid declaration from HTML elements. Responsive behavior, selector matching,
pseudo-elements, hover interactions and exact browser layout are not claimed.
The generated adaptation report retains every rejected value and attribute.
For a dynamic style property, all candidate values must compile; otherwise the
property stays at the component’s admitted base style. The checked-in
`*.exact-admission.json` recipes preserve the compiler diagnostics and source
digests; clean builds still validate the entire retained palette and native app.
Regenerate those source recipes explicitly with `generate-exact.mjs --write-admission`;
ordinary builds write only ignored build outputs.
Full-request captures use Exact’s official production host, not the render-only
VM adapter.

Exact's fresh VM, native DOM, application construction and serialization are
included in rendering. Compilation, typed input preparation and stylesheet
preparation happen first. This follows the existing Exact adapter's measurement
boundary.
