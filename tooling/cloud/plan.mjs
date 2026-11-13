import assert from "node:assert/strict";

export const suiteIds = [
  "rendering",
  "framework",
  "http",
  "streaming",
  "startup",
];
export const image =
  "us-west1-docker.pkg.dev/airy-cycle-504821-k9/ci-images/proa-runner@sha256:c1a3c3f6d822b777e29caa694b4a2c36571bfe1c0661f3a978970e828b5849ab";
export function validateOptions({ revision, parallel, namespace, campaignId }) {
  assert.match(
    revision,
    /^[a-f0-9]{40}$/,
    "Use an immutable full Git commit SHA",
  );
  assert.ok(
    Number.isInteger(parallel) && parallel >= 1 && parallel <= 5,
    "Parallel workers must be 1–5",
  );
  assert.match(namespace, /^[a-z][a-z0-9-]{0,61}[a-z0-9]$/);
  assert.match(campaignId, /^publication-[a-f0-9-]{36}$/);
}
export function jobManifest(options, suite, attempt = 1) {
  validateOptions(options);
  assert.ok(suiteIds.includes(suite));
  const name = `bench-${options.campaignId.slice(-12)}-${suite}-${attempt}`;
  const labels = {
    app: "framework-benchmarks",
    campaign: options.campaignId,
    suite,
  };
  return {
    apiVersion: "batch/v1",
    kind: "Job",
    metadata: { name, namespace: options.namespace, labels },
    spec: {
      backoffLimit: 0,
      activeDeadlineSeconds: 14400,
      ttlSecondsAfterFinished: 3600,
      template: {
        metadata: { labels },
        spec: {
          restartPolicy: "Never",
          automountServiceAccountToken: false,
          nodeSelector: {
            "cloud.google.com/gke-nodepool": "runners-c4",
            "node.kubernetes.io/instance-type": "c4-standard-16-lssd",
            "kubernetes.io/arch": "amd64",
          },
          tolerations: [
            {
              key: "ci-runner-pool",
              operator: "Equal",
              value: "true",
              effect: "NoSchedule",
            },
          ],
          affinity: {
            podAntiAffinity: {
              requiredDuringSchedulingIgnoredDuringExecution: [
                {
                  labelSelector: {},
                  namespaces: [...new Set(["arc-runners", options.namespace])],
                  topologyKey: "kubernetes.io/hostname",
                },
              ],
            },
          },
          containers: [
            {
              name: "benchmark",
              image,
              command: [
                "/bin/bash",
                "-lc",
                "while [ ! -f /work/launch.sh ]; do sleep 2; done; bash /work/launch.sh > /work/worker.log 2>&1; code=$?; echo $code > /work/exit-code; while [ ! -f /work/collected ]; do sleep 5; done; exit $code",
              ],
              env: [
                {
                  name: "BENCH_NODE_NAME",
                  valueFrom: { fieldRef: { fieldPath: "spec.nodeName" } },
                },
              ],
              resources: {
                requests: {
                  cpu: "15",
                  memory: "48Gi",
                  "ephemeral-storage": "80Gi",
                },
                limits: {
                  cpu: "15",
                  memory: "48Gi",
                  "ephemeral-storage": "160Gi",
                },
              },
              volumeMounts: [{ name: "work", mountPath: "/work" }],
            },
          ],
          volumes: [{ name: "work", emptyDir: {} }],
        },
      },
    },
  };
}
