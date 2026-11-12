import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import workloads from "../rendering/canonical/workloads.json" with {
  type: "json",
};

// Sync renderer contract. Fixture construction and template compilation must
// happen in the caller before this function. Async engines keep a native harness.
export function runStringAdapter(
  { id, label, language, allocationPolicy, render },
  args = process.argv.slice(2),
) {
  const option = (key, fallback) =>
    args.includes(key) ? args[args.indexOf(key) + 1] : fallback;
  const workload = workloads.workloads.find(
    (x) => x.id === option("--workload"),
  );
  assert.ok(
    workload,
    "Choose a workload from rendering/canonical/workloads.json",
  );
  const iterations = Number(option("--iterations", workload.iterations));
  const warmup = Number(option("--warmup", workload.warmup));
  assert.ok(
    Number.isSafeInteger(iterations) &&
      iterations > 0 &&
      Number.isSafeInteger(warmup) &&
      warmup >= 0,
  );
  const write = (file, value) => {
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, value);
  };
  let html = render(workload.id);
  assert.equal(
    typeof html,
    "string",
    "Return a complete owned string; Promise/bytes require their own measurement boundary",
  );
  if (option("--dump")) write(option("--dump"), html);
  if (args.includes("--dump-only")) return;
  for (let i = 0; i < warmup; i++) html = render(workload.id);
  const samples = new Float64Array(iterations);
  for (let i = 0; i < iterations; i++) {
    const started = process.hrtime.bigint();
    html = render(workload.id);
    samples[i] = Number(process.hrtime.bigint() - started) / 1000;
  }
  assert.equal(typeof html, "string");
  const sorted = [...samples].sort((a, b) => a - b);
  const percentile = (p) => {
    const rank = (sorted.length - 1) * p;
    const low = Math.floor(rank);
    return sorted[low] + (sorted[Math.ceil(rank)] - sorted[low]) * (rank - low);
  };
  const result = {
    schema_version: 1,
    framework: label,
    framework_id: id,
    language,
    workload: workload.id,
    workload_cardinality: workload.cardinality,
    allocation_policy: allocationPolicy,
    iterations,
    warmup,
    output_bytes: Buffer.byteLength(html),
    min_us: sorted[0],
    mean_us: sorted.reduce((sum, v) => sum + v, 0) / sorted.length,
    p50_us: percentile(0.5),
    p95_us: percentile(0.95),
    p99_us: percentile(0.99),
    max_us: sorted.at(-1),
    timestamp: new Date().toISOString(),
  };
  if (option("--out"))
    write(option("--out"), `${JSON.stringify(result, null, 2)}\n`);
  console.log(`${label} ${workload.id}: ${result.p50_us.toFixed(2)} µs`);
  return result;
}
