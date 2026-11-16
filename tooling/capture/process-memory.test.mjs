import { test } from "bun:test";
import assert from "node:assert/strict";
import {
  memoryMetric,
  memoryScope,
  runWithMemory,
  summarizeMemory,
  validateProcessMemory,
} from "./process-memory.mjs";

const observation = (bytes) => ({
  metric: memoryMetric,
  method: "os-process-resource-usage",
  scope: memoryScope,
  peak_rss_bytes: bytes,
});
test("native child RSS excludes a large resident launcher", () => {
  const pages = Buffer.alloc(192 * 1024 * 1024, 11);
  const child = runWithMemory(process.execPath, [
    "-e",
    'console.log("small-child")',
  ]);
  assert.equal(child.stdout.trim(), "small-child");
  assert.ok(
    child.memory.peak_rss_bytes < 96 * 1024 * 1024,
    "Native RSS must not inherit the launcher's resident pages",
  );
  assert.equal(pages.at(-1), 11);
});
test("native RSS is measured in bytes on the child, including touched resident pages", () => {
  const small = runWithMemory(process.execPath, [
    "-e",
    'console.log("native-child")',
  ]);
  assert.equal(small.stdout.trim(), "native-child");
  const large = runWithMemory(process.execPath, [
    "-e",
    "const pages=Buffer.alloc(64*1024*1024, 7); console.log(pages[pages.length-1]);",
  ]);
  assert.equal(large.stdout.trim(), "7");
  assert.ok(
    large.memory.peak_rss_bytes - small.memory.peak_rss_bytes >
      32 * 1024 * 1024,
    "RSS units must be bytes, not KiB or a launcher measurement",
  );
});
test("memory summaries retain every process peak and reject partial, missing or invalid observations", () => {
  const cells = [10, 30, 20, 50, 40].map((n) => ({
    memory: observation(n * 1048576),
  }));
  const result = summarizeMemory(cells);
  assert.equal(result.peak_rss_bytes, 30 * 1048576);
  assert.deepEqual(
    result.process_peak_rss_bytes,
    cells.map((c) => c.memory.peak_rss_bytes),
  );
  assert.equal(
    summarizeMemory([{}, {}]),
    undefined,
    "Historical runs stay unmeasured",
  );
  assert.throws(() => summarizeMemory([cells[0], {}]));
  for (const bytes of [0, -1, NaN, Infinity, 1.5])
    assert.throws(() => validateProcessMemory(observation(bytes)));
  assert.throws(
    () =>
      runWithMemory(process.execPath, [
        "-e",
        'process.stderr.write("failed deliberately");process.exit(2)',
      ]),
    /failed deliberately/,
  );
});
