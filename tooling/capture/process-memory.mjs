import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { summarize } from "../stats.mjs";

export const memoryMetric = "native-process-peak-rss-v2";
export const memoryScope =
  "Peak RSS over the native benchmark process lifetime, including runtime startup, prepared data, template initialization, warmup, rendering and output verification. Not bytes allocated per render.";

// The OS records this high-water mark; reading it after child exit introduces
// no sampling or extra operations into any renderer's timed region. Call this
// at the native process boundary, never around a launcher or compiler process.
export function runWithMemory(
  command,
  args,
  { cwd, env, maxBuffer = 128 * 1024 * 1024 } = {},
) {
  // Linux carries the spawning process's pre-exec RSS high-water mark into
  // direct child rusage. GNU time execs into a small supervisor, then forks
  // the actual renderer: wait4 reports that renderer's own peak, in KiB.
  const linux = process.platform === "linux";
  const directory = linux ? mkdtempSync(join(tmpdir(), "native-rss-")) : null;
  try {
    const rssPath = directory && join(directory, "rss-kib.txt");
    const child = Bun.spawnSync(
      linux
        ? ["/usr/bin/time", "-f", "%M", "-o", rssPath, "--", command, ...args]
        : [command, ...args],
      {
        cwd,
        env,
        stdin: "ignore",
        stdout: "pipe",
        stderr: "pipe",
        maxBuffer,
      },
    );
    if (child.exitCode !== 0 || child.signalCode || child.exitedDueToMaxBuffer)
      throw new Error(
        `Native benchmark failed (${child.signalCode ?? child.exitCode}): ${command}\n${child.stderr.toString().slice(-12000)}`,
      );
    const memory = {
      metric: memoryMetric,
      peak_rss_bytes: linux
        ? Number(readFileSync(rssPath, "utf8").trim()) * 1024
        : child.resourceUsage.maxRSS,
      method: "os-process-resource-usage",
      scope: memoryScope,
    };
    validateProcessMemory(memory);
    return { stdout: child.stdout.toString(), memory };
  } finally {
    if (directory) rmSync(directory, { recursive: true, force: true });
  }
}
export function validateProcessMemory(memory) {
  assert.ok(
    memory && typeof memory === "object",
    "Missing native process RSS observation",
  );
  assert.equal(memory.metric, memoryMetric);
  assert.equal(memory.method, "os-process-resource-usage");
  assert.equal(memory.scope, memoryScope);
  assert.ok(
    Number.isSafeInteger(memory.peak_rss_bytes) && memory.peak_rss_bytes > 0,
    "Peak RSS must be a positive byte count",
  );
}
export function summarizeMemory(cells) {
  if (cells.every((cell) => cell.memory === undefined)) return undefined;
  for (const cell of cells) validateProcessMemory(cell.memory);
  const peaks = cells.map((cell) => cell.memory.peak_rss_bytes);
  return {
    metric: memoryMetric,
    method: "os-process-resource-usage",
    scope: memoryScope,
    peak_rss_bytes: summarize(peaks).p50,
    process_peak_rss_bytes: peaks,
  };
}
