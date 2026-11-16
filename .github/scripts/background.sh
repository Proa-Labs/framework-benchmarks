#!/usr/bin/env bash
# Overlap slow, independent setup (browser downloads, release compiles) with
# the job's remaining steps.
#
#   background.sh start <name> <command...>   detach the command, keep its log
#   background.sh wait <name>                 print the log, fail if it failed
#
# The process survives step boundaries; the runner reaps it at job end.
set -euo pipefail

action="${1:?usage: background.sh start|wait <name> [command...]}"
name="${2:?missing task name}"
shift 2
directory="${RUNNER_TEMP:?RUNNER_TEMP must be set}/background"
mkdir -p "$directory"
log="$directory/$name.log"
status="$directory/$name.status"

case "$action" in
  start)
    (( $# > 0 )) || { echo "background.sh: no command for $name" >&2; exit 2; }
    rm -f "$status"
    # setsid detaches the task from the step; closing the step's descriptors
    # lets the step finish while the task continues. The script expands in the
    # detached shell, so it is single-quoted here.
    # shellcheck disable=SC2016
    setsid bash -c '
      log=$1 status=$2; shift 2
      started=$SECONDS
      set +e
      "$@" >"$log" 2>&1
      code=$?
      echo "[background] finished with status $code in $((SECONDS - started))s" >>"$log"
      echo "$code" >"$status.tmp" && mv "$status.tmp" "$status"
    ' background "$log" "$status" "$@" </dev/null >/dev/null 2>&1 &
    echo "Started $name in the background: $*"
    ;;
  wait)
    waited=$SECONDS
    limit="${BACKGROUND_TIMEOUT_SECONDS:-1800}"
    until [[ -f "$status" ]]; do
      if (( SECONDS - waited > limit )); then
        cat "$log" 2>/dev/null || true
        echo "::error::$name did not finish within ${limit}s" >&2
        exit 1
      fi
      sleep 1
    done
    echo "::group::$name output (waited $((SECONDS - waited))s)"
    cat "$log"
    echo "::endgroup::"
    code="$(cat "$status")"
    if [[ "$code" != 0 ]]; then
      echo "::error::$name failed with status $code" >&2
      exit "$code"
    fi
    ;;
  *)
    echo "background.sh: unknown action $action" >&2
    exit 2
    ;;
esac
