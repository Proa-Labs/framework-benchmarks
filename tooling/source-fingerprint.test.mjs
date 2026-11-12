import { expect, test } from "bun:test";
import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  renderingSourceFiles,
  renderingSourceFingerprint,
} from "../rendering/canonical/source_fingerprint.mjs";

test("installed Rails gems do not alter measured source; adapter and lockfile changes do", () => {
  const directory = mkdtempSync(join(tmpdir(), "rendering-source-"));
  try {
    execFileSync("git", ["init", "--quiet", directory]);
    const external = join(directory, "rendering/external");
    const rails = join(external, "rails");
    mkdirSync(rails, { recursive: true });
    writeFileSync(
      join(external, ".gitignore"),
      readFileSync(
        new URL("../rendering/external/.gitignore", import.meta.url),
      ),
    );
    writeFileSync(join(rails, "suite.rb"), "render fixture");
    writeFileSync(join(rails, "Gemfile.lock"), "pinned gems");
    const before = renderingSourceFingerprint(directory);
    const vendor = join(rails, "vendor/bundle/gems/rails/templates");
    mkdirSync(vendor, { recursive: true });
    writeFileSync(join(vendor, "%file_name%.rb"), "downloaded dependency");
    expect(renderingSourceFingerprint(directory)).toBe(before);
    expect(renderingSourceFiles(directory)).toContain(
      "rendering/external/rails/Gemfile.lock",
    );
    writeFileSync(join(rails, "suite.rb"), "different fixture");
    expect(renderingSourceFingerprint(directory)).not.toBe(before);
    writeFileSync(join(rails, "suite.rb"), "render fixture");
    writeFileSync(join(rails, "Gemfile.lock"), "different pinned gems");
    expect(renderingSourceFingerprint(directory)).not.toBe(before);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
