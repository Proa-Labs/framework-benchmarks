import { expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { proaRevision, validateProaPins } from "./proa-pins.mjs";

const lock = (revision, name = "proa_core") => `[[package]]
name = "${name}"
version = "0.4.0"
source = "git+https://github.com/Proa-Labs/proa?branch=main#${revision}"
`;

test("rejects mixed revisions within or between Proa lockfiles", () => {
  const before = "a".repeat(40),
    after = "b".repeat(40);
  expect(proaRevision(lock(before))).toBe(before);
  expect(() => proaRevision(lock(before, "proa_macros"))).toThrow();
  expect(() => proaRevision(lock("main"))).toThrow();
  expect(() =>
    proaRevision(lock(before) + lock(after, "proa_macros")),
  ).toThrow();
  const root = mkdtempSync(join(tmpdir(), "proa-pins-"));
  try {
    const adapter = join(root, "benchmarks/framework-ssr/adapters/proa");
    mkdirSync(adapter, { recursive: true });
    writeFileSync(join(root, "Cargo.lock"), lock(before));
    writeFileSync(join(adapter, "Cargo.lock"), lock(before));
    expect(validateProaPins(root)).toBe(before);
    writeFileSync(join(adapter, "Cargo.lock"), lock(after));
    expect(() => validateProaPins(root)).toThrow(/same Proa revision/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
