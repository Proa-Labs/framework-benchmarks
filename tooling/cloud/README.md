# Parallel GCP benchmark campaigns

Run the five independent comparison suites concurrently, each on its own
`c4-standard-16-lssd` node in the existing GKE `runners-c4` pool. Rendering and
its product-scaling diagnostic run sequentially on the same worker. Competitors
inside a suite are never sharded or measured concurrently. Compilation and
setup finish before that worker starts measuring.

Install the pinned Bun dependencies (`bun install --frozen-lockfile` and
`bun install --cwd framework-ssr --frozen-lockfile`) first. The controller needs
Python 3.12+, `git`, `tar` and an authenticated `kubectl` context.

```sh
bun tooling/cloud/campaign.mjs --revision <full-40-character-commit-sha> \
  --context gke_airy-cycle-504821-k9_us-west1-a_proa-ci --parallel 5 \
  --out /tmp/framework-campaign
```

Use `--plan` to inspect job manifests without allocating machines. Use `--smoke`
to exercise the same orchestration with short, non-publishable captures. Default
parallelism is five; `--parallel 1` runs whole suites sequentially. Each worker
requests 15 logical CPUs and 48 GiB, pins servers to CPU 0, leaves SMT sibling 8
idle, and keeps generators on CPUs 1–7 and 9–15. Required node anti-affinity
excludes other benchmark and ARC runner pods. This needs five free benchmark
nodes plus the Actions controller's node at full parallelism. Pending jobs wait
for the existing pool autoscaler; this runner does not change its node limits.

Workers check out exactly the requested revision, install checksum-pinned
cloud toolchains, retain raw samples and source archives, and expose no
Kubernetes or GitHub token to benchmark code. All captures share a campaign ID
and record their physical boot identity, node, source revision and hardware/OS
profile. Publication requires every full suite, current measured-source hashes,
matching profiles and unchanged fixture parity. Separate suite hosts are
explicitly recorded; their measurements are never mixed within one ranking.

Results download before jobs are deleted. On failure, other workers finish and
the controller retains successful archives and diagnostic logs. Run the **same
command with the same output directory** to resume: completed archives are
SHA-256 checked and reused, active workers are reconnected after verifying their
job definition and immutable launch revision, and failed suites restart in full. Spot eviction
never reuses partial timings. Jobs have a four-hour deadline and cleanup TTL;
the controller also deletes its jobs on success, failure or cancellation.
A forced process kill can leave a job until that deadline; the campaign manifest
retains its name for inspection. Resume does not splice partial suite results.

A complete campaign is extracted into `<out>/validated`, then checked with
`tooling/publication.mjs`. Archive extraction rejects traversal, links, duplicate
entries and non-result paths. Existing working-tree results are not replaced.
Review the staged result diff before copying it into a task branch. Regenerate
all derived reports and figures with `bun run refresh`, then run `bun run check`
and `bun run check:publication` before committing the selected captures. Smoke runs
never receive a publication-ready status. No workflow commits, deploys or merges
results automatically.

## GitHub Actions

Install the scoped controller role once with cluster-admin credentials:

```sh
kubectl --context gke_airy-cycle-504821-k9_us-west1-a_proa-ci \
  apply -f tooling/cloud/access.yaml
```

The **Parallel GCP benchmark campaign** manual workflow runs trusted controller
code from `main` on `vars.CI_RUNNER`. It authenticates with that runner's existing
Kubernetes service account, scoped to jobs and pods in `framework-benchmarks`.
PR runners are not granted this role. Benchmark pods disable token automount.
The workflow accepts an immutable revision, worker limit and optional smoke
mode, and uploads raw archives, logs and campaign state even on failure. It
becomes dispatchable after the workflow is merged; the CLI works before then.
To resume a failed Actions campaign locally, download its artifact and use its
`campaign.json` directory with the command above.
