import { expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { downloadArtifact } from "./artifacts.mjs";

test("downloads large binary artifacts in bounded, checksum-verified chunks", async () => {
  const data = Buffer.alloc(4 * 1024 * 1024 + 17);
  for (let i = 0; i < data.length; i++) data[i] = i % 251;
  const expected = createHash("sha256").update(data).digest("hex");
  const reader = (mutate) => async (args) => {
    if (args[0] === "sha256sum") return `${expected}  /work/results.tar.gz`;
    if (args[0] === "stat") return String(data.length);
    expect(args[0]).toBe("dd");
    const size = Number(args.find((a) => a.startsWith("bs=")).slice(3));
    expect(size).toBeLessThanOrEqual(256 * 1024);
    const offset =
      Number(args.find((a) => a.startsWith("skip=")).slice(5)) * size;
    return mutate(data.subarray(offset, offset + size));
  };
  expect(
    await downloadArtifact(
      reader((b) => b),
      "/work/results.tar.gz",
    ),
  ).toEqual(data);
  let dropped = false;
  const retry = reader((b) => {
    if (dropped) return b;
    dropped = true;
    return b.subarray(0, -1);
  });
  expect(await downloadArtifact(retry, "/work/results.tar.gz")).toEqual(data);
  await expect(
    downloadArtifact(
      reader((b) => b.subarray(0, -1)),
      "/work/results.tar.gz",
    ),
  ).rejects.toThrow(/Incomplete artifact chunk/);
  await expect(
    downloadArtifact(
      reader((b) => Buffer.alloc(b.length)),
      "/work/results.tar.gz",
    ),
  ).rejects.toThrow(/checksum mismatch/);
});
