import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { verifyRefresh } from "../scripts/proa-refresh-evidence.mjs";
import { retainedId } from "./captures.mjs";
import { verifySourceSnapshot } from "./verify-source.mjs";

// A historical report may outlive its measured implementation. Accept it only
// when the exact capture and its hash-verified source were retained together.
export function verifyRetainedSource(
  results,
  result,
  { verify = verifyRefresh } = {},
) {
  verify(result, results);
  const id = retainedId(result);
  assert.match(id, /^[a-zA-Z0-9-]+$/);
  const archived = JSON.parse(
    readFileSync(join(results, "archive", `${id}.json`), "utf8"),
  );
  assert.deepEqual(
    archived,
    result,
    "Retained capture differs from selected result",
  );
  verifySourceSnapshot(
    join(results, "raw", id, "source.tar.gz"),
    result.source?.sourceSha256 ?? result.provenance?.source_sha256,
    { sorted: false, prefix: result.provenance?.source_sha256 ? "/" : "" },
  );
}
