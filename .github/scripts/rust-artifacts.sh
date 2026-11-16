#!/usr/bin/env bash
# Reuse the workspace crates' own build artifacts across runs.
#
#   rust-artifacts.sh key        content key of every local crate input
#   rust-artifacts.sh paths      cache paths for those crates' artifacts
#   rust-artifacts.sh normalize  date unchanged inputs before their artifacts
#
# Dependencies come from rust-cache, but Cargo fingerprints local crates by
# source mtime, and a checkout makes every source newer than any cached
# artifact. proa_bench alone takes ~2 minutes to compile in release, in most
# jobs. Artifacts restored under an exact `key` were built from byte-identical
# inputs (Git blob hashes of every tracked input, the toolchain and the Cargo
# environment), so their inputs can be dated before them and Cargo reuses
# them. Without an exact hit nothing is redated and Cargo rebuilds as usual.
set -euo pipefail

manifests=(Cargo.toml benchmarks/framework-ssr/adapters/proa/Cargo.toml fixtures/airbnb-parity-dump/Cargo.toml)
target_dirs=(target fixtures/airbnb-parity-dump/target)
# A superset of every local crate's inputs, including what proa_bench's build
# script reads (its showcase generator and the Bun packages it imports).
inputs=(
  Cargo.toml Cargo.lock rust-toolchain.toml .cargo package.json bun.lock bunfig.toml
  benchmarks/rendering/Cargo.toml benchmarks/rendering/build.rs
  benchmarks/rendering/src benchmarks/rendering/benches
  benchmarks/rendering/templates benchmarks/rendering/showcase
  fixtures/legacy-ebay-chrome fixtures/airbnb-parity-dump
  benchmarks/framework-ssr/adapters/proa
)
# Before any real build, after Git's epoch-free range.
epoch=946684800

case "${1:-}" in
  key)
    {
      rustc -vV
      env | grep -E '^(CARGO|RUST)' | grep -Ev '^(CARGO_HOME|RUSTUP_HOME|RUSTUP_TOOLCHAIN)=' | sort
      git ls-files -s -- "${inputs[@]}"
    } | sha256sum | cut -c1-24
    ;;
  paths)
    # Every target of every local package, in each profile of each target
    # directory: the files rust-cache leaves out of its dependency cache.
    for manifest in "${manifests[@]}"; do
      cargo metadata --no-deps --format-version 1 --manifest-path "$manifest" |
        jq -r '.packages[] | .name, (.targets[] | select(.kind != ["custom-build"]) | .name)'
    done | sort -u | while read -r name; do
      crate="${name//-/_}"
      for dir in "${target_dirs[@]}"; do
        echo "$dir/*/.fingerprint/$name-*"
        echo "$dir/*/build/$name-*"
        echo "$dir/*/deps/$crate-*"
        echo "$dir/*/deps/lib$crate-*"
      done
    done | sort -u
    ;;
  normalize)
    git ls-files -z -- "${inputs[@]}" | xargs -0 touch -h -d "@$epoch"
    # Build scripts that watch a directory also compare its own mtime.
    for input in "${inputs[@]}"; do
      [[ -d "$input" ]] || continue
      find "$input" -name target -prune -o -name node_modules -prune -o -type d -print0 |
        xargs -0 touch -h -d "@$epoch"
    done
    ;;
  *)
    echo "usage: rust-artifacts.sh key|paths|normalize" >&2
    exit 2
    ;;
esac
