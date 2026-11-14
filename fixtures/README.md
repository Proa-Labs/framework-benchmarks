# Shared fixtures and controls

| Directory | Purpose |
| --- | --- |
| [`airbnb-parity-dump/`](airbnb-parity-dump/) | Linked Proa showcase dump used by application-shaped parity and payload experiments |
| [`proa-buffer-comparison/`](proa-buffer-comparison/) | Separate owned-buffer and preallocation controls |
| [`legacy-ebay-chrome/`](legacy-ebay-chrome/README.md) | Retained reference markup and style assets |

Suite-specific inputs live beside their owner: rendering workload definitions
and implementations in [`benchmarks/rendering/`](../benchmarks/rendering/README.md),
and framework route fixtures in
[`benchmarks/framework-ssr/`](../benchmarks/framework-ssr/README.md).

Changing a fixture changes what is measured. Follow the parity, negative-control,
source-retention and rerun requirements in [CONTRIBUTING.md](../CONTRIBUTING.md).
