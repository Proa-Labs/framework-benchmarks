#!/usr/bin/env bash
# Source from the trusted Actions controller; no token is sent to workers.
set -euo pipefail
config_directory="$(mktemp -d)"
export KUBECONFIG="$config_directory/config"
trap 'rm -rf "$config_directory"' EXIT
python3 - <<'PY'
import json, os, pathlib
base = pathlib.Path('/var/run/secrets/kubernetes.io/serviceaccount')
server = 'https://' + os.environ['KUBERNETES_SERVICE_HOST'] + ':' + os.environ.get('KUBERNETES_SERVICE_PORT', '443')
config = {'apiVersion':'v1','kind':'Config','current-context':'benchmark',
          'clusters':[{'name':'cluster','cluster':{'server':server,'certificate-authority':str(base/'ca.crt')}}],
          'users':[{'name':'controller','user':{'tokenFile':str(base/'token')}}],
          'contexts':[{'name':'benchmark','context':{'cluster':'cluster','user':'controller'}}]}
path = pathlib.Path(os.environ['KUBECONFIG'])
path.write_text(json.dumps(config))
path.chmod(0o600)
PY
