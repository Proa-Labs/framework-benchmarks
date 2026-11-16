import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { readRawJson, writeRawJson } from "./raw.mjs";

test("raw evidence round trips every sample and rejects overwriting a retained path", () => {
  const dir = mkdtempSync(join(tmpdir(), "raw-evidence-"));
  try {
    const data = [
      { samples_us: [0, 0.000001, 1.23456789, 99999999], note: '<✓>&"' },
    ];
    const plain = join(dir, "samples.json"),
      compressed = `${plain}.gz`;
    writeFileSync(plain, JSON.stringify(data));
    writeRawJson(compressed, data);
    assert.deepEqual(readRawJson(plain), data);
    assert.deepEqual(readRawJson(compressed), data);
    assert.throws(() => writeRawJson(compressed, []));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
