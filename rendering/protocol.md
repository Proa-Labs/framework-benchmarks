# Canonical rendering protocol

This is the publication contract for the one public server-rendering scoreboard. A useful laboratory measurement is not a public framework comparison unless it satisfies every rule below.

## Benchmark question

The suite measures pure synchronous server-rendering latency from prepared input to one complete, independently owned HTML response. It excludes routing, middleware, databases, HTTP transfer, hydration, network latency, and production-server buffer pooling.

The three fixed workloads are:

| ID | Public label | Required content |
| --- | --- | --- |
| `cards` | Component page | 4 sections, 32 cards, and 160 feature-list items |
| `table` | 1,000-row table | 1,000 rows and 12 columns with escaping, formatting, branches, and variable-length lists |
| `products` | Product grid | 96 product cards and 480 SVG stars |

Fixture data and template/application compilation happen before timing. Helpers that implement render-time semantics—escaping, branches, numeric and date formatting, and iteration—remain inside the render boundary for every adapter.

## Admission and roster rules

[`canonical/roster.json`](canonical/roster.json) is the fixed expected roster. A renderer is `included`, `in_progress`, or `excluded`, with a concrete reason for either non-included state.

An included renderer must:

1. implement every canonical workload;
2. use a production or release build and its pinned canonical runtime;
3. return a complete independently owned response on every measured invocation;
4. pass every parity cell before timing begins; and
5. appear exactly once in the result artifact and generated table.

There are no partial public rows. An unexpected disappearance, missing workload, absent parity decision, or measurement from another capture invalidates report generation. The public Proa row is named exactly `Proa` and returns a freshly allocated, independently owned `RenderBuffer`. This is the native paged HTML output before optional conversion to a contiguous `String`. Other adapters retain their independently owned String outputs. Proa's context construction, page allocation, component rendering and the previous output's destruction are inside timing. Flattening is performed only for untimed parity dumps. The entire returned owner is passed to an optimizer barrier; no byte-count traversal or page concatenation runs in the measured Proa loop. The former `render_to_string` path remains an explicitly labeled engineering control. This is an output-boundary change, not an upstream framework speedup. Reuse, chaining, manual writes, capacity experiments, and controls remain in engineering reports.

## Parity gate

Each adapter first emits an untimed HTML dump. Chromium parses it, and the harness compares a canonical DOM requiring the same:

- elements and body order;
- non-class attributes and values;
- class-token membership;
- visible text after adjacent hydration-split text nodes are coalesced; and
- escaping, branch, loop, formatting, date, and attribute semantics encoded by the fixture.

The comparison may ignore renderer-internal comments, resource-preload hints, non-semantic `<head>` order, and class-token order. These allowances do not change the timed bytes. The report records response size, the payload delta from Proa, the canonical DOM digest, and whether exact bytes also match.

Each workload also has a negative control. The runner mutates a semantically relevant output and asserts that the gate rejects it. If any positive or negative parity check fails, timing never starts.

### Disclosed Exact native adaptation

The `exact-native-v1` row is explicitly marked **Exact†**. The pinned compiler
cannot accept the literal classes or all HTML element spellings in the strict
fixture. User-requested native named styles and equivalent content receive a
separate content/attribute and representative computed-CSS gate, including
negative controls. This exception applies only to Exact; strict DOM/class parity
remains required for every other row. Exact records a distinct DOM digest and
matching projected-content digests, style-check counts, output bytes and native
stylesheets. The common render-only boundary, fresh output, host, warmup/sample
counts and process rotations remain shared. Source/script compilation and input-data construction precede timing. Fresh per-render
VM/runtime initialization, prepared-input binding, native DOM allocation, app
construction, formatting and serialization are timed. See [the adaptation notes](external/exact/README.md) for every
structural/styling difference and the exact timer boundary.

## Sampling

The default policy is fixed in [`canonical/workloads.json`](canonical/workloads.json):

| Workload | Warmups/process | Samples/process |
| --- | ---: | ---: |
| Component page | 200 | 2,000 |
| 1,000-row table | 20 | 200 |
| Product grid | 50 | 500 |

The full run uses five independent renderer processes. Each process constructs the fixture before warmup, compiles templates before warmup, renders one response per sample, and reports the same declared output-ownership policy. Renderer invocation order is rotated between process blocks. Samples are not discarded after framework labels are known.

The headline value is the median of the five within-process P50 values. The detailed report retains the median within-process P95, the full range of process P50s, process count, sample and warmup counts, and payload bytes. The table expresses every value relative to the Proa value from the same workload and capture. It does not calculate a composite score.

## Result artifact

`results/latest.json` is the sole source for the public Markdown. Its schema contains, at minimum:

```json
{
  "schema_version": 2,
  "benchmark_version": "canonical-ssr-v1",
  "capture_id": "...",
  "captured_at": "...",
  "host": {},
  "workloads": [],
  "renderers": [],
  "parity": {},
  "measurements": {},
  "versions": {}
}
```

Every measurement repeats the capture ID. Report validation rejects incomplete rosters, partial included renderers, unapproved renderers, missing parity, mixed captures, measurements attached to non-included renderers, and multiple Proa entries. A synchronization check regenerates the marked README sections in memory and fails if a public value differs from JSON.

The capture also records the host CPU, memory, OS, architecture, harness commit and dirty state, adapter/runtime versions, build and run commands, source fingerprint, timestamps, limitations, and raw-artifact locations.

## Interpretation and limitations

Lower render time is better for this specific boundary. Results answer only the three named workloads on the captured machine. They do not measure request throughput, application latency, browser performance, developer experience, feature breadth, compile time, memory under sustained load, or every possible application shape.

Serializer payload differences remain visible in the detailed report. Tail anomalies and contradictory results remain reported. A production HTTP throughput claim requires a separate suite in which every framework uses its normal server, allocator, pooling, response-management, concurrency, and backpressure behavior.

### Explicit PROA-only refreshes

`--refresh-proa` is a separate comparison mode, not a new simultaneous canonical capture. It requires the same CPU model, architecture and memory as the retained original machine, five new Proa processes per cell, and unchanged semantic DOM digests and payload sizes. The original capture is retained with a SHA-256; every peer measurement, parity record and version must remain identical. Peer measurement capture IDs remain attached to the original capture. New Proa rows use the refresh ID. Reports and charts disclose both dates. `latest.json` records `capture_kind: "proa_refresh"`; ordinary canonical captures continue rejecting mixed capture IDs.

The current checked-in comparison is a PROA-only refresh at Proa `bbbc968` after PR #84 against the October 21, 2026 Apple M4 Max baseline.
