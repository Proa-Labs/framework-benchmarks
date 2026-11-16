import { test } from "bun:test";
import assert from "node:assert/strict";
import { retryObservation } from "./transport.mjs";

test("transient observations retry without restarting their worker", async () => {
  let calls = 0;
  const delays = [];
  const value = await retryObservation(
    () => {
      if (++calls < 3) throw Error("http2: client connection lost");
      return "same active worker";
    },
    {
      delay: async (ms) => {
        delays.push(ms);
      },
    },
  );
  assert.equal(value, "same active worker");
  assert.equal(calls, 3);
  assert.deepEqual(delays, [250, 500]);
});
test("fatal observations fail immediately and transport retries are bounded", async () => {
  for (const [message, expected] of [
    ["Unauthorized", 1],
    ["unexpected EOF", 5],
  ]) {
    let calls = 0;
    await assert.rejects(
      retryObservation(
        () => {
          calls++;
          throw Error(message);
        },
        { delay: async () => {} },
      ),
    );
    assert.equal(calls, expected);
  }
});
