import { expect, test } from "bun:test";
import { validateProcessRepeats, validatePublication } from "./publication.mjs";
import suites from "./suites.json" with { type: "json" };

const complete = () =>
  Object.fromEntries(
    Object.keys(suites).map((id) => [
      id,
      {
        status: "pass",
        capture_kind: id === "rendering" ? "canonical" : undefined,
        captureKind: id === "rendering" ? undefined : "publication",
        host: {
          machineId: "a".repeat(64),
          campaignId: "publication-test",
          ...(id === "rendering"
            ? { server_cpu_affinity: "0" }
            : { serverCpuAffinity: "0" }),
        },
      },
    ]),
  );

test("publication requires all five zero-indexed process repeats", () => {
  const runs = (repeats) => repeats.map((repeat) => ({ repeat }));
  validateProcessRepeats(runs([4, 2, 0, 3, 1]));
  for (const repeats of [
    [0, 1, 2, 3],
    [0, 1, 2, 3, 3],
    [1, 2, 3, 4, 5],
  ]) {
    expect(() => validateProcessRepeats(runs(repeats))).toThrow();
  }
});

test("publication accepts one complete campaign and rejects mixed machines, partial refreshes and smoke results", () => {
  expect(validatePublication(complete()).campaignId).toBe("publication-test");
  for (const mutate of [
    (r) => {
      delete r.streaming;
    },
    (r) => {
      delete r.rendering.host.machineId;
    },
    (r) => {
      r.framework.host.machineId = "b".repeat(64);
    },
    (r) => {
      r.http.host.campaignId = "publication-other";
    },
    (r) => {
      delete r.rendering.host.campaignId;
    },
    (r) => {
      r.rendering.capture_kind = "proa_refresh";
    },
    (r) => {
      r.rendering.refresh = { renderer: "proa" };
    },
    (r) => {
      r.startup.captureKind = "smoke";
    },
    (r) => {
      r.framework.host.serverCpuAffinity = "2";
    },
    (r) => {
      r.streaming.status = "fail";
    },
  ]) {
    const result = complete();
    mutate(result);
    expect(() => validatePublication(result)).toThrow();
  }
});

test("parallel publication accepts distinct isolated suite machines only with the same campaign revision and hardware profile", () => {
  const results = complete();
  for (const [index, result] of Object.values(results).entries()) {
    Object.assign(result.host, {
      machineId: String(index + 1).repeat(64),
      campaignProtocol: "per-suite-host-v1",
      sourceRevision: "b".repeat(40),
      machineClass: "c4-standard-16-lssd",
      cpuModel: "Intel(R) Xeon(R) Platinum 8581C CPU @ 2.30GHz",
      logicalCpuCount: 16,
      arch: "x64",
      release: "6.6.0-gke",
      nodeName: `worker-${index}`,
    });
  }
  expect(validatePublication(results).protocol).toBe("per-suite-host-v1");
  for (const mutate of [
    (r) => {
      r.http.host.sourceRevision = "c".repeat(40);
    },
    (r) => {
      r.framework.host.machineClass = "n2-standard-16";
    },
    (r) => {
      r.startup.host.cpuModel = "Another CPU";
    },
    (r) => {
      r.streaming.host.logicalCpuCount = 8;
    },
    (r) => {
      delete r.http.host.nodeName;
    },
    (r) => {
      delete r.framework.host.campaignProtocol;
    },
  ]) {
    const changed = structuredClone(results);
    mutate(changed);
    expect(() => validatePublication(changed)).toThrow();
  }
});
