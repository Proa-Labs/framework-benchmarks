#!/usr/bin/env bash
set -euo pipefail
# This script runs one whole comparison, never a subset of its competitors.
source /work/env.sh
cd /work/repo
export BENCH_SERVER_CPU=0
export BENCH_CAMPAIGN_PROTOCOL=per-suite-host-v1
export BENCH_MACHINE_CLASS=c4-standard-16-lssd
export BENCH_SOURCE_REVISION="$1"
export BENCH_CAMPAIGN_ID="$2"
suite="$3"
mode="$4"
export BENCH_HOST_LABEL="GCP C4 c4-standard-16-lssd · ${BENCH_NODE_NAME} · isolated node"
test "$(git rev-parse HEAD)" = "$BENCH_SOURCE_REVISION"
test "$(cat /sys/devices/system/cpu/cpu0/topology/thread_siblings_list)" = "0,8"
test "$(nproc --all)" = 16
lscpu -e=CPU,CORE,SOCKET,ONLINE > /work/cpu-topology.txt
cat /sys/fs/cgroup/cpu.max > /work/cpu-quota.txt
bun install --frozen-lockfile
bun node_modules/playwright/cli.js install --with-deps chromium
for adapter in react marko svelte; do
  bun install --cwd "rendering/external/$adapter" --frozen-lockfile
done
npm --prefix rendering/external/sveltekit ci --include=dev
smoke=()
if [[ "$mode" == smoke ]]; then smoke=(--smoke); fi
case "$suite" in
  rendering)
    # Exact's official builder supplies the versioned exclusion proof. Setup
    # and compilation finish before any of the timed processes are started.
    bun install --cwd framework-ssr --frozen-lockfile
    bun framework-ssr/build.ts
    bun rendering/canonical/run.mjs --setup-only
    bun rendering/external/exact/check-admission.mjs
    taskset -c 0 bun rendering/canonical/run.mjs --no-setup "${smoke[@]}"
    taskset -c 0 bun rendering/canonical/run.mjs --product-scaling --no-setup "${smoke[@]}"
    ;;
  framework)
    bun install --cwd framework-ssr --frozen-lockfile
    bun framework-ssr/build.ts
    taskset -c 1-7,9-15 bun framework-ssr/run.ts --no-build --workers 24 "${smoke[@]}"
    ;;
  http|streaming|startup)
    args=()
    if [[ "$mode" == smoke ]]; then
      case "$suite" in
        http) args=(--duration 1 --repeats 1 --warmup-requests 4 --concurrency 8 --tolerate-generator-limits) ;;
        streaming) args=(--rates 20,50 --duration 1 --repeats 1 --warmup-requests 4) ;;
        startup) args=(--starts 2 --warmup-starts 1) ;;
      esac
    fi
    case "$suite" in
      http) entry=page-load/run.mjs ;;
      streaming) entry=suspense-load/run.mjs ;;
      startup) entry=cold-start/run.mjs ;;
    esac
    if [[ "$suite" != startup ]]; then args+=(--workers 24); fi
    taskset -c 1-7,9-15 bun "$entry" "${args[@]}"
    ;;
  *) echo "Unknown suite: $suite" >&2; exit 2 ;;
esac
# Retain every new or changed result and report, including raw samples and
# immutable source archives. Do not transfer node_modules or build products.
python3 - <<'PY'
import subprocess, tarfile
paths = subprocess.check_output(['git', 'ls-files', '-z', '--modified', '--others', '--exclude-standard']).decode().split('\0')
paths += subprocess.check_output(['git', 'ls-files', '-z', '--others', '--ignored', '--exclude-standard', '--', 'rendering/results', 'framework-ssr/results', 'page-load/results', 'suspense-load/results', 'cold-start/results']).decode().split('\0')
allowed = ('rendering/results/', 'framework-ssr/results/', 'page-load/results/', 'suspense-load/results/', 'cold-start/results/')
paths = sorted(set(p for p in paths if p and (p.startswith(allowed) or p in ('rendering/README.md','framework-ssr/README.md','page-load/README.md','suspense-load/README.md','cold-start/README.md', 'scoreboard.md', 'engineering.md'))))
with tarfile.open('/work/results.tar.gz', 'w:gz') as archive:
    for path in paths:
        archive.add(path, arcname=path, recursive=False)
PY
printf 'Complete: %s\n' "$suite"
