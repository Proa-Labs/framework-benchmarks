#!/usr/bin/env bash
set -euo pipefail
# The runner image supplies compilers; the trusted controller additionally needs
# this pinned client. Its checksum is from the official Kubernetes release.
destination="$1"
mkdir -p "$destination"
archive="$(mktemp)"
trap 'rm -f "$archive"' EXIT
curl --fail --silent --show-error --location --retry 3 \
  https://dl.k8s.io/release/v1.35.0/bin/linux/amd64/kubectl -o "$archive"
printf '%s  %s\n' a2e984a18a0c063279d692533031c1eff93a262afcc0afdc517375432d060989 "$archive" | sha256sum --check --status
install -m 755 "$archive" "$destination/kubectl"
"$destination/kubectl" version --client
