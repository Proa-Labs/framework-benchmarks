import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import manifest from "../rendering/canonical/workloads.json" with {
  type: "json",
};

// Framework initialization, compilation and input construction precede this call.
// Await native async SSR to completion; inspect, hash and write output afterward.
export async function runOwnedAdapter(
  { id, label, allocationPolicy, render, prepare = () => undefined },
  args = process.argv.slice(2),
) {
  assert.equal(process.env.NODE_ENV, "production");
  const option = (key, fallback) =>
    args.includes(key) ? args[args.indexOf(key) + 1] : fallback;
  const workload = manifest.workloads.find(
    (w) => w.id === option("--workload"),
  );
  assert.ok(workload, "Choose a canonical workload");
  const iterations = Number(option("--iterations", workload.iterations));
  const warmup = Number(option("--warmup", workload.warmup));
  assert.ok(
    Number.isSafeInteger(iterations) &&
      iterations > 0 &&
      Number.isSafeInteger(warmup) &&
      warmup >= 0,
  );
  const write = (path, value) => {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, value);
  };
  const cardinality =
    workload.id === "products"
      ? Number(process.env.PROA_BENCH_PRODUCT_COUNT || workload.cardinality)
      : workload.cardinality;
  assert.ok(Number.isSafeInteger(cardinality) && cardinality > 0);
  let html = await render(await prepare());
  assert.equal(
    typeof html,
    "string",
    "SSR must complete into a fresh owned HTML string",
  );
  if (option("--dump")) write(option("--dump"), html);
  if (args.includes("--dump-only")) return;
  for (let i = 0; i < warmup; i++) html = await render(await prepare());
  const samples = [];
  for (let i = 0; i < iterations; i++) {
    const prepared = await prepare();
    const started = process.hrtime.bigint();
    const output = await render(prepared);
    const elapsed = Number(process.hrtime.bigint() - started) / 1000;
    assert.equal(typeof output, "string");
    samples.push(elapsed);
    html = output;
  }
  assert.equal(typeof html, "string");
  const sorted = [...samples].sort((a, b) => a - b);
  const q = (p) => {
    const x = p * (sorted.length - 1),
      low = Math.floor(x);
    return sorted[low] + (sorted[Math.ceil(x)] - sorted[low]) * (x - low);
  };
  const result = {
    schema_version: 1,
    framework: label,
    framework_id: id,
    language: "JavaScript",
    workload: workload.id,
    workload_cardinality: cardinality,
    allocation_policy: allocationPolicy,
    iterations,
    warmup,
    output_bytes: Buffer.byteLength(html),
    min_us: sorted[0],
    mean_us: sorted.reduce((a, b) => a + b, 0) / sorted.length,
    p50_us: q(0.5),
    p95_us: q(0.95),
    p99_us: q(0.99),
    max_us: sorted.at(-1),
    samples_us: samples,
    timestamp: new Date().toISOString(),
  };
  if (option("--out"))
    write(option("--out"), `${JSON.stringify(result, null, 2)}\n`);
  console.log(`${label} ${workload.id}: ${result.p50_us.toFixed(2)} µs`);
  return result;
}
