#!/usr/bin/env bash
# Decide which CI suites a change can affect and write them as step outputs.
#
#   affected-suites.sh            read the pull request's files from the GitHub API
#   affected-suites.sh < paths    classify newline-separated paths (local testing)
#
# Pushes, manual runs and oversized pull requests select every suite, so main
# always receives the complete post-merge verification and saves the caches
# that pull requests restore. The quality job runs on every event regardless.
set -euo pipefail

suites="rust rendering streaming http framework"

# Inputs shared by every benchmark: toolchains, lockfiles, the workflow itself
# and the capture/load tooling that each suite imports.
global='^(\.github/(workflows/ci\.yml|actions/|scripts/)|\.cargo/|package\.json$|bun\.lock$|bunfig\.toml$|turbo\.json$|\.nvmrc$|Cargo\.(toml|lock)$|rust-toolchain\.toml$|\.rustfmt\.toml$|\.gitattributes$|\.gitignore$|tooling/(adapters|capture|load|maintenance)/|tooling/[^/]+$)'
# Everything compiled into the root Rust workspace.
crate='^(benchmarks/rendering/(Cargo\.toml|build\.rs|src/|templates/|benches/)|fixtures/(legacy-ebay-chrome|airbnb-parity-dump)/)'

rule() {
  case "$1" in
    rust) echo "$global|$crate" ;;
    rendering) echo "$global|$crate|^benchmarks/rendering/" ;;
    streaming) echo "$global|$crate|^(benchmarks/streaming/|experiments/sveltekit-streaming/|benchmarks/rendering/(canonical/dom\.mjs|external/(marko|react|svelte|sveltekit|shared)/))" ;;
    http) echo "$global|$crate|^(benchmarks/(http|cold-start|streaming)/|benchmarks/rendering/(canonical/dom\.mjs|external/(go|marko|react|svelte|sveltekit|shared)/))" ;;
    framework) echo "$global|^(benchmarks/framework-ssr/|benchmarks/rendering/external/shared/)" ;;
  esac
}
# Documentation and retained results are validated by the quality and website
# workflows; no smoke suite reads them.
ignored='(\.md$|(^|/)results/|^docs/|^LICENSE$)'

output="${GITHUB_OUTPUT:-/dev/stdout}"
select_all() {
  for suite in $suites; do echo "$suite=true"; done >> "$output"
  echo "Selected every suite: $1" >&2
}

if [[ -n "${GITHUB_ACTIONS:-}" ]]; then
  if [[ "${EVENT_NAME:-}" != pull_request ]]; then
    select_all "${EVENT_NAME:-unknown} event"
    exit 0
  fi
  # The files endpoint stops at 3000 entries; treat a truncated list as "all".
  paths="$(gh api --paginate "repos/${REPOSITORY:?}/pulls/${PR_NUMBER:?}/files" \
    --jq '.[] | .filename, (.previous_filename // empty)')"
  if (( $(grep -c . <<< "$paths" || true) >= 3000 )); then
    select_all "the pull request lists 3000 or more files"
    exit 0
  fi
else
  paths="$(cat)"
fi

relevant="$(grep -Ev "$ignored" <<< "$paths" || true)"
for suite in $suites; do
  selected=false
  if grep -Eq "$(rule "$suite")" <<< "$relevant"; then selected=true; fi
  echo "$suite=$selected" >> "$output"
  echo "$suite: $selected" >&2
done
