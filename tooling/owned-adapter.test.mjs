import { test } from "bun:test";
import assert from "node:assert/strict";
import { runOwnedAdapter } from "./owned-adapter.mjs";

test("native async SSR timing waits for completed HTML and retains the observations it summarizes", async () => {
  const before = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  try {
    let sequence = 0;
    const result = await runOwnedAdapter(
      {
        id: "async-check",
        label: "Async boundary check",
        allocationPolicy: "Fresh owned HTML string",
        render: async () => {
          await Bun.sleep(10);
          return `<main>${++sequence}</main>`;
        },
      },
      ["--workload", "cards", "--iterations", "2", "--warmup", "1"],
    );
    assert.equal(result.samples_us.length, 2);
    assert.ok(
      result.min_us >= 5000,
      "Timing must include the native asynchronous render, not just Promise creation",
    );
    assert.equal(result.min_us, Math.min(...result.samples_us));
    await assert.rejects(
      () =>
        runOwnedAdapter(
          {
            id: "invalid-check",
            label: "Invalid output check",
            allocationPolicy: "Invalid result",
            render: async () => ({ body: "unfinished ownership boundary" }),
          },
          ["--workload", "cards", "--iterations", "1", "--warmup", "0"],
        ),
      /complete into a fresh owned HTML string/,
    );
  } finally {
    if (before === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = before;
  }
});
