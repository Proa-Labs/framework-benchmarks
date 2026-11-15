# Exact’s adapted rendering test

Exact can define styles, but it cannot use our HTML and CSS class names directly.
It requires named styles in its own language and generates different HTML.
[Exact’s own styling guide](https://github.com/expo/exact/blob/94b8671f70fe2e25b307a40e7fce66dc27c9f802/docs/contract-for-humans.md#styling-and-layout)
explains these restrictions, including supported properties and values.

For this experiment we translated the shared fixture into Exact’s closest native
forms. The table labels this row **Exact†** with an explanation on hover, focus
or tap. These are render-only measurements, just like the other rows; they are
**not a claim of identical HTML or CSS support**.

## What stays the same

- The input data, text, escaping cases, loop sizes, branches, prices, UTC dates,
  24-hour times, product links and SVG star paths.
- 32 cards with 160 features, 96 products with 480 stars, and 1,000 table rows
  with all 12 columns and their variable-length tags.
- Fresh owned HTML per iteration, the same warmup/sample policy and five
  independent process rotations, on the same host and logical CPU as peers.
- Formatting and escaping occur during rendering. Input data is prepared first.

## What differs

- Literal class strings become native named styles and compiler-generated CSS
  classes. Product/table styles translate the fixture’s utility declarations;
  card styles translate the shared preview’s CSS because that fixture’s named
  classes carry no stylesheet in its timed output.
- Exact emits native text wrappers, heading metadata, list roles and its own
  root wrapper. The timed output includes the `exact-root` wrapper required by
  its generated stylesheet. Paragraph/list element names and class strings differ.
- The desktop grid is four columns. Responsive utility breakpoints and the
  product title’s parent-hover color are not reproduced. Native control/reset
  behavior and font metrics can differ. This is a close styling adaptation,
  not pixel parity. No browser layout or paint time is measured.
- Exact supports separated table borders, so `border-spacing=0` replaces
  `border-collapse:collapse`. Badges use native text boxes instead of literal
  inline-flex/inline-block CSS. The colors, spacing and status branches remain.

## Validation and timing

The strict DOM/class gate remains unchanged for every other renderer. Exact
has a separate, explicitly named `exact-native-v1` gate. It compares all the
content and attributes listed above against the canonical renderer and checks
representative computed CSS across every applicable card, product, star and
cell, including status colors and alternating row backgrounds. Both content
and CSS negative controls must fail. The capture records separate semantic
hashes, native DOM hash, CSS-check counts and output sizes. It retains the
native generated stylesheets with the raw results.

The production Exact compiler and web runtime are pinned to
`94b8671f70fe2e25b307a40e7fce66dc27c9f802` and are not patched. `build.mjs` compiles
the Contract fixture and bundles a small entry using the compiler’s native app,
resource/checkpoint and DOM serialization APIs. Resources receive already
prepared typed data; there is no fetch, HTTP routing, checkpoint serialization
or artificial settling delay in the measured call.

Each iteration initializes a fresh isolated VM, runs the already compiled script,
binds the prepared input, allocates a fresh native DOM, constructs the whole app,
formats/escapes its content, serializes the tree and assembles a fresh HTML string.
**All of that per-render work is inside the timer.** Source loading, script
compilation, input conversion, CSS compilation, parity checking, hashing and
output inspection are outside timing. No tree, cached output or rendering context
is reused. The CSS is a compiled external stylesheet, as with peers; it is not
appended to every timed response. Exact’s full production request pipeline remains
a separate Framework SSR experiment.
