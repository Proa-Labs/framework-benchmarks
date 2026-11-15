import { test } from "bun:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { capturedRenderingContract } from "./rendering-contract.mjs";
import { verifyCapturedInputs } from "./retained-inputs.mjs";

const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");

test("retained rendering contracts accept either layout and reject ambiguous archives", () => {
  const root = mkdtempSync(join(tmpdir(), "benchmark-contract-"));
  const raw = join(root, "benchmarks/rendering/results/raw/capture-id");
  mkdirSync(raw, { recursive: true });
  try {
    const archive = join(raw, "source.tar.gz");
    for (const directory of [
      "rendering/canonical",
      "benchmarks/rendering/canonical",
    ]) {
      mkdirSync(join(root, directory), { recursive: true });
      for (const name of ["roster", "workloads"])
        writeFileSync(
          join(root, directory, `${name}.json`),
          JSON.stringify({ name }),
        );
      execFileSync("tar", [
        "-czf",
        archive,
        "-C",
        root,
        `${directory}/roster.json`,
        `${directory}/workloads.json`,
      ]);
      const contract = capturedRenderingContract(root, {
        capture_id: "capture-id",
      });
      assert.equal(contract.sourceDirectory, directory);
      assert.deepEqual(contract.roster, { name: "roster" });
    }
    execFileSync("tar", [
      "-czf",
      archive,
      "-C",
      root,
      ...["rendering/canonical", "benchmarks/rendering/canonical"].flatMap(
        (p) => [`${p}/roster.json`, `${p}/workloads.json`],
      ),
    ]);
    assert.throws(
      () => capturedRenderingContract(root, { capture_id: "capture-id" }),
      /one complete rendering contract/,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("relocated engineering evidence requires exact raw records and original input hashes", () => {
  const root = mkdtempSync(join(tmpdir(), "benchmark-inputs-"));
  try {
    const input = "showcase/capture.mjs";
    mkdirSync(join(root, "showcase"), { recursive: true });
    writeFileSync(join(root, input), "original measured source");
    const inputs = [
      { path: input, sha256: digest(readFileSync(join(root, input))) },
    ];
    const directory = join(root, "experiments/showcase/results/raw");
    mkdirSync(directory, { recursive: true });
    const file = join(directory, "capture.json.gz");
    const records = [{ page: "home", p50_us: 1 }];
    const raw = Buffer.from(
      JSON.stringify([{ ...records[0], raw_ns: [1000] }]),
    );
    writeFileSync(file, gzipSync(raw));
    execFileSync("tar", [
      "-czf",
      join(directory, "capture.sources.tar.gz"),
      "-C",
      root,
      input,
    ]);
    rmSync(join(root, "showcase"), { recursive: true });
    const capture = {
      provenance: { inputs },
      records,
      raw_artifact: {
        path: "showcase/results/raw/capture.json.gz",
        encoding: "gzip",
        sha256: digest(readFileSync(file)),
        uncompressed_sha256: digest(raw),
      },
    };
    const expected = ["experiments/showcase/capture.mjs"];
    verifyCapturedInputs(root, capture, expected);
    assert.throws(
      () =>
        verifyCapturedInputs(
          root,
          { ...capture, records: [{ page: "home", p50_us: 2 }] },
          expected,
        ),
      /records differ/,
    );
    const changed = structuredClone(capture);
    changed.provenance.inputs[0].sha256 = "0".repeat(64);
    assert.throws(
      () => verifyCapturedInputs(root, changed, expected),
      /Retained source changed/,
    );
    writeFileSync(file, "tampered");
    assert.throws(
      () => verifyCapturedInputs(root, capture, expected),
      /raw artifact changed/,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
