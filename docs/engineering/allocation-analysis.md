# Allocation analysis

Measure allocation counts separately from latency. Report allocations, reallocations and requested bytes, with a fresh output per trial. A reusable output warmed to its required capacity is a separate control.

The [latest matched buffer comparison](../reports/engineering.md#proa-output-buffer-allocation) retains allocation evidence alongside timings. The older integer-allocation tables are available in Git history.

Run the integer audit with `./benchmarks/rendering/run_all.sh integers`.
