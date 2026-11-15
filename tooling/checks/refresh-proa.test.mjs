import { expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readRefreshBaseline } from "../../benchmarks/rendering/canonical/refresh-proa.mjs";

test("another Proa refresh follows verified evidence back to the original peers", () => {
  const directory = mkdtempSync(join(tmpdir(), "refresh-baseline-"));
  const path = join(directory, "latest.json");
  const baseline = {
    host: { cpuModel: "test" },
    capturedAt: "2026-10-21",
    engines: [
      { id: "proa", value: 2 },
      { id: "react", value: 20 },
    ],
  };
  const text = JSON.stringify(baseline);
  try {
    writeFileSync(path, text);
    expect(readRefreshBaseline(path)).toEqual({ text, baseline });
    writeFileSync(join(directory, "baseline.json"), text);
    const current = {
      ...structuredClone(baseline),
      refresh: {
        renderer: "proa",
        note: "Only Proa refreshed",
        baseline_captured_at: baseline.capturedAt,
        baseline_path: "baseline.json",
        baseline_sha256: createHash("sha256").update(text).digest("hex"),
      },
    };
    current.engines[0].value = 1;
    writeFileSync(path, JSON.stringify(current));
    expect(readRefreshBaseline(path)).toEqual({ text, baseline });
    current.engines[1].value = 10;
    writeFileSync(path, JSON.stringify(current));
    expect(() => readRefreshBaseline(path)).toThrow(
      /retained evidence changed/,
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
