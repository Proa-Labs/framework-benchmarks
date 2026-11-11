#!/usr/bin/env bash
set -euo pipefail
source /work/env.sh
cd /work/repo
export BENCH_SERVER_CPU=2
export BENCH_HOST_LABEL="GCP C4 c4-standard-16-lssd · us-west1-b · isolated spot node"
# CPU 10 is CPU 2's SMT sibling. Both are excluded from generators.
client_cpus=0-1,3-9,11-15
bun install --cwd framework-ssr --frozen-lockfile
lscpu -e=CPU,CORE,SOCKET,ONLINE > /work/cpu-topology.txt
cat /sys/fs/cgroup/cpu.max > /work/cpu-quota.txt
cargo build --release --locked --manifest-path framework-ssr/adapters/proa/Cargo.toml --target-dir target > /work/proa-final-build.log 2>&1
taskset -c "$client_cpus" bun framework-ssr/run.ts --no-build --workers 12 > /work/framework-capture.log 2>&1
taskset -c 2 bun rendering/canonical/run.mjs --no-setup > /work/rendering-capture.log 2>&1
taskset -c "$client_cpus" bun page-load/run.mjs --workers 24 > /work/http-capture.log 2>&1
taskset -c "$client_cpus" bun cold-start/run.mjs --no-build > /work/startup-capture.log 2>&1
taskset -c "$client_cpus" bun suspense-load/run.mjs --workers 24 > /work/streaming-capture.log 2>&1
printf 'All five publication captures completed\n' > /work/capture-complete.txt
