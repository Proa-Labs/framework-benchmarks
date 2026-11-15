# Shared benchmark infrastructure

| Directory / file | Responsibility |
| --- | --- |
| [`cli/`](cli/) | Contributor commands, suite discovery, smoke plans and adapter scaffolding |
| [`adapters/`](adapters/) | Adapter registry validation and shared owned-output harnesses |
| [`capture/`](capture/) | Atomic capture storage, source snapshots, fingerprints and historical evidence readers |
| [`checks/`](checks/) | Contract, workspace and publication validation |
| [`load/`](load/README.md) | Shared HTTP load generator, server lifecycle, latency and CPU/RSS sampling |
| [`stats.mjs`](stats.mjs) | Shared statistics used by runners, reports and the site |
| [`cloud/`](cloud/README.md) | Resumable isolated GCP campaigns and trusted worker orchestration |
| [`charts/`](charts/) | Generate and verify [`docs/figures/`](../docs/figures/README.md) from report tables |
| [`maintenance/`](maintenance/) | Explicit dependency refreshes, retained Proa diagnostics and engineering reports |
| [`repository.mjs`](repository.mjs) | Workspace discovery and locating evidence retained with previous directory names |

The active suite registry is [`benchmarks/suites.json`](../benchmarks/suites.json).
Add implementation-specific code beside its suite or adapter. Promote a helper
here when multiple suites use the same contract; keep their timing boundaries
and validation explicit. Tests live beside the module they exercise.

Historical source archives are never rewritten to match a new layout. Readers
can locate previous capture paths, while publication still requires hashes for
the current executable sources and a complete fresh campaign.

The two older showcase allocation/copy studies declared a hash for each input
instead of retaining a combined source archive. Their `*.sources.tar.gz` sidecars
retain the original Git blobs from commit `252b0ce7566493cc1436f9b4ca8fc6d81152321c`,
verified against those recorded hashes before relocation. Readers also verify the
retained compressed samples and their exact correspondence to published records.
