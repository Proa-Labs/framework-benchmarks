#!/usr/bin/env bash
set -euo pipefail
source /work/env.sh
cd /work/repo
export BENCH_SERVER_CPU=0
export BENCH_CAMPAIGN_ID="publication-$(cat /proc/sys/kernel/random/uuid)"
export BENCH_HOST_LABEL="${BENCH_HOST_LABEL:-GCP C4 c4-standard-16-lssd · isolated spot node}"
# Verify this topology on the allocated node before starting. CPU 8 is
# CPU 0's SMT sibling; keep both out of the generator affinity.
client_cpus=1-7,9-15
test "$(cat /sys/devices/system/cpu/cpu0/topology/thread_siblings_list)" = "0,8"
bun install --cwd framework-ssr --frozen-lockfile
lscpu -e=CPU,CORE,SOCKET,ONLINE > /work/cpu-topology.txt
cat /sys/fs/cgroup/cpu.max > /work/cpu-quota.txt
bun framework-ssr/build.ts > /work/framework-build.log 2>&1
bun rendering/canonical/run.mjs --setup-only > /work/rendering-build.log 2>&1
bun rendering/external/exact/check-admission.mjs > /work/exact-admission.log 2>&1
taskset -c "$client_cpus" bun framework-ssr/run.ts --no-build --workers 24 > /work/framework-capture.log 2>&1
taskset -c "$BENCH_SERVER_CPU" bun rendering/canonical/run.mjs --no-setup > /work/rendering-capture.log 2>&1
taskset -c "$BENCH_SERVER_CPU" bun rendering/canonical/run.mjs --product-scaling --no-setup > /work/scaling-capture.log 2>&1
taskset -c "$client_cpus" bun page-load/run.mjs --workers 24 > /work/http-capture.log 2>&1
taskset -c "$client_cpus" bun cold-start/run.mjs --no-build > /work/startup-capture.log 2>&1
taskset -c "$client_cpus" bun suspense-load/run.mjs --workers 24 > /work/streaming-capture.log 2>&1
bun run check:publication > /work/publication-check.log 2>&1
printf 'All five publication captures completed\n' > /work/capture-complete.txt
