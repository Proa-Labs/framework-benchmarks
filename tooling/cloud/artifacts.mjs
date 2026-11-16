import assert from "node:assert/strict";
import { createHash } from "node:crypto";

// Read bounded chunks: a successful kubectl exit does not guarantee that a
// large stdout stream arrived in full. Keep the worker until the digest agrees.
export async function downloadArtifact(read, path) {
  const expected = (await read(["sha256sum", path])).split(/\s+/)[0];
  assert.match(expected, /^[a-f0-9]{64}$/);
  const size = Number(await read(["stat", "-c", "%s", path]));
  assert.ok(Number.isSafeInteger(size) && size > 0);
  const chunkSize = 256 * 1024;
  const chunks = [];
  for (let offset = 0; offset < size; offset += chunkSize) {
    let chunk;
    const bytes = Math.min(chunkSize, size - offset);
    for (let attempt = 0; attempt < 3; attempt++) {
      chunk = await read(
        [
          "dd",
          `if=${path}`,
          `bs=${chunkSize}`,
          `skip=${offset / chunkSize}`,
          "count=1",
          "status=none",
        ],
        { binary: true },
      );
      if (chunk.length === bytes) break;
    }
    assert.equal(chunk.length, bytes, `Incomplete artifact chunk: ${path}`);
    chunks.push(chunk);
  }
  const artifact = Buffer.concat(chunks);
  assert.equal(
    createHash("sha256").update(artifact).digest("hex"),
    expected,
    `Downloaded artifact checksum mismatch: ${path}`,
  );
  return artifact;
}
