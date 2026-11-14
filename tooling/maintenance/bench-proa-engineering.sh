#!/usr/bin/env bash
# Run after the HTTP suites; benchmark timing and builds must not overlap.
set -euo pipefail
cd "$(dirname "$0")/../.."
node_bin="${CANONICAL_SUITE_NODE:-${NVM_DIR:-$HOME/.nvm}/versions/node/v24.20.0/bin/node}"
if [[ ! -x "$node_bin" ]] || [[ "$("$node_bin" -p process.version)" != "v24.20.0" ]]; then
  echo "Use Node v24.20.0; set CANONICAL_SUITE_NODE to its executable." >&2
  exit 1
fi
export PATH="$(dirname "$node_bin"):$PATH"
proa_cli="${1:-proa}"
logs_directory="benchmarks/rendering/results/raw/proa-pr83-criterion"
criterion_baseline="$("$node_bin" --input-type=module -e 'import {readFileSync} from "node:fs"; const lock=readFileSync("Cargo.lock","utf8"); console.log("proa-native-pages-"+lock.match(/name = "proa_core"[\s\S]*?#([a-f0-9]{40})/)[1].slice(0,12));')"
mkdir -p "$logs_directory"
cargo bench --locked -p proa_bench --features topcoat --no-run
for bench in ssr_comparison targeted_comparison airbnb_search_comparison showcase_pages integer_serialization topcoat_comparison; do
  cargo bench --locked -p proa_bench --features topcoat --bench "$bench" -- proa --save-baseline "$criterion_baseline" > "$logs_directory/proa-pr83-$bench.log" 2>&1
done
"$proa_cli" build --root fixtures/airbnb-parity-dump --locked --no-check --no-assets -p proa_bench_airbnb_parity_dump --artifact-out target/showcase-dump
node experiments/showcase/build_buffer_bench.mjs "$proa_cli"
node experiments/showcase/capture_ssr.mjs
node experiments/showcase/capture_memcpy.mjs --dump fixtures/airbnb-parity-dump/target/showcase-dump
node experiments/showcase/capture_buffers.mjs
node experiments/showcase/capture_client_js.mjs
for bench in data_table_bench ebay_srp_bench ebay_srp_real_bench; do
  cargo run --release --locked -p proa_bench --bin "$bench" -- --out "benchmarks/rendering/results/proa-pr83-$bench.json"
done
node tooling/maintenance/report-proa-engineering.mjs --collect --logs-dir "$logs_directory"
node tooling/maintenance/retain-proa-engineering.mjs
