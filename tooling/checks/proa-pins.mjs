import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { repositoryRoot } from "../repository.mjs";

export function proaRevision(lock) {
  const packages = Bun.TOML.parse(lock).package;
  const source =
    /^git\+https:\/\/github\.com\/Proa-Labs\/proa(?:\?[^#]*)?#([a-f0-9]{40})$/;
  assert.match(
    packages.find((p) => p.name === "proa_core")?.source ?? "",
    source,
    "Proa core must use an immutable Git revision",
  );
  const revisions = new Set(
    packages.flatMap((p) => {
      const match = source.exec(p.source ?? "");
      return match ? [match[1]] : [];
    }),
  );
  assert.equal(revisions.size, 1, "Pin every Proa package to one Git revision");
  return [...revisions][0];
}

export function validateProaPins(root) {
  const revision = proaRevision(readFileSync(join(root, "Cargo.lock"), "utf8"));
  for (const adapter of ["proa", "leptos"]) {
    const lock = join(
      root,
      "benchmarks/framework-ssr/adapters",
      adapter,
      "Cargo.lock",
    );
    assert.equal(
      proaRevision(readFileSync(lock, "utf8")),
      revision,
      `Framework SSR (${adapter}) and the other suites must pin the same Proa revision`,
    );
  }
  return revision;
}

if (process.argv[1] === fileURLToPath(import.meta.url))
  console.log(
    `Proa pins agree: ${validateProaPins(repositoryRoot(import.meta.url))}`,
  );
