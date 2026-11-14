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
smoke=()
if [[ "$mode" == smoke ]]; then smoke=(--smoke); fi
case "$suite" in
  rendering)
    # Exact's official builder supplies the versioned exclusion proof. Setup
    # and compilation finish before any of the timed processes are started.
    bun benchmarks/framework-ssr/build.ts
    bun benchmarks/rendering/canonical/run.mjs --setup-only
    bun benchmarks/rendering/external/exact/check-admission.mjs
    taskset -c 0 bun benchmarks/rendering/canonical/run.mjs --no-setup "${smoke[@]}"
    taskset -c 0 bun benchmarks/rendering/canonical/run.mjs --product-scaling --no-setup "${smoke[@]}"
    ;;
  framework)
    bun benchmarks/framework-ssr/build.ts
    taskset -c 1-7,9-15 bun benchmarks/framework-ssr/run.ts --no-build --workers 24 "${smoke[@]}"
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
      http) entry=benchmarks/http/run.mjs ;;
      streaming) entry=benchmarks/streaming/run.mjs ;;
      startup) entry=benchmarks/cold-start/run.mjs ;;
    esac
    # The faster Proa stream needs more request-generation capacity. Use the
    # same 32-worker generator for every competitor in this comparison.
    if [[ "$suite" == streaming ]]; then args+=(--workers 32)
    elif [[ "$suite" == http ]]; then args+=(--workers 24); fi
    taskset -c 1-7,9-15 bun "$entry" "${args[@]}"
    ;;
  *) echo "Unknown suite: $suite" >&2; exit 2 ;;
esac
# Retain every new or changed result and report, including raw samples and
# immutable source archives. Do not transfer node_modules or build products.
python3 - <<'PY'
import subprocess, tarfile
paths = subprocess.check_output(['git', 'ls-files', '-z', '--modified', '--others', '--exclude-standard']).decode().split('\0')
paths += subprocess.check_output(['git', 'ls-files', '-z', '--others', '--ignored', '--exclude-standard', '--', 'benchmarks/rendering/results', 'benchmarks/framework-ssr/results', 'benchmarks/http/results', 'benchmarks/streaming/results', 'benchmarks/cold-start/results']).decode().split('\0')
allowed = ('benchmarks/rendering/results/', 'benchmarks/framework-ssr/results/', 'benchmarks/http/results/', 'benchmarks/streaming/results/', 'benchmarks/cold-start/results/')
paths = sorted(set(p for p in paths if p and (p.startswith(allowed) or p in ('benchmarks/rendering/README.md','benchmarks/framework-ssr/README.md','benchmarks/http/README.md','benchmarks/streaming/README.md','benchmarks/cold-start/README.md', 'docs/reports/scoreboard.md', 'docs/reports/engineering.md'))))
with tarfile.open('/work/results.tar.gz', 'w:gz') as archive:
    for path in paths:
        archive.add(path, arcname=path, recursive=False)
PY
printf 'Complete: %s\n' "$suite"
