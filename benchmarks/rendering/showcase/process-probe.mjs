#!/usr/bin/env bun
// Untimed admission of native process adapters. Complete output is compared for
// the baseline, two changed text inputs and an escaped request attribute.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { fixtures, loadFixture, renderReference } from "./fixture.mjs";
import { generateTemplates } from "./generate-templates.mjs";
import { canonicalDigest } from "./import.mjs";

const directory = fileURLToPath(new URL("./", import.meta.url));
const root = fileURLToPath(new URL("../../../", import.meta.url));
const engine = process.argv[process.argv.indexOf("--engine") + 1];
const value = (key) => {
  const index = process.argv.indexOf(key);
  return index < 0 ? undefined : process.argv[index + 1];
};
const nativeRust = new Set([
  "proa",
  "askama",
  "sailfish",
  "leptos",
  "dioxus",
  "topcoat",
]);
const temporary = mkdtempSync(join(tmpdir(), "showcase-admission-"));
const generated = join(directory, ".generated");
if (!nativeRust.has(engine)) generateTemplates(generated);
try {
  const results = [];
  for (const { id } of fixtures.filter(
    (f) => !value("--workload") || f.id === value("--workload"),
  ))
    for (const probe of ["baseline", "title", "text", "request"]) {
      const { definition, data, prepared } = loadFixture(id);
      const changed = '</span><img id="escaped-probe" src=x> & < > " \' ✓';
      if (probe === "title")
        data.texts[definition.controls.titleIndex] = changed;
      if (probe === "text") {
        const { record, slot } = definition.controls.text;
        prepared[record].texts[slot] = changed;
      }
      if (probe === "request")
        data.texts[definition.controls.requestIndex] = changed;
      const output = join(temporary, `${id}-${probe}.html`);
      let command,
        args,
        cwd = root;
      if (nativeRust.has(engine)) {
        command =
          value("--binary") ??
          join(
            process.env.CARGO_TARGET_DIR ?? join(root, "target"),
            "release/showcase_suite_bench",
          );
        args = [
          "--framework",
          engine,
          "--workload",
          id,
          "--probe",
          probe,
          "--dump",
          output,
        ];
      } else if (["jte", "rocker"].includes(engine)) {
        command =
          value("--java") ??
          (process.env.JAVA_HOME
            ? join(process.env.JAVA_HOME, "bin/java")
            : "java");
        cwd = join(root, "benchmarks/rendering/external", engine);
        args = [
          "-cp",
          join(cwd, `build/install/proa-${engine}-bench/lib/*`),
          "proa.bench.showcase.Admission",
          "--workload",
          id,
          "--probe",
          probe,
          "--dump",
          output,
        ];
      } else {
        const kind = {
          jinja2: "jinja",
          rails: "erb",
          php: "php",
          "go-html-template": "go",
        }[engine];
        assert.ok(kind, `Unknown native process adapter ${engine}`);
        args = [
          "--input",
          join(generated, `${id}.${kind}`),
          "--probe",
          probe,
          "--dump",
          output,
        ];
        if (engine === "jinja2") {
          command =
            value("--python") ??
            join(root, "benchmarks/rendering/external/jinja/.venv/bin/python3");
          args.unshift(join(directory, "drivers/jinja.py"));
        }
        if (engine === "rails") {
          command = value("--ruby") ?? "ruby";
          args.unshift(join(directory, "drivers/rails.rb"));
        }
        if (engine === "php") {
          command = value("--php") ?? "php";
          args.unshift(join(directory, "drivers/php.php"));
        }
        if (engine === "go-html-template")
          command = value("--binary") ?? join(generated, "go-admission");
      }
      execFileSync(command, args, {
        cwd,
        stdio: "pipe",
        maxBuffer: 4 * 1024 * 1024,
      });
      const expected =
        probe === "baseline"
          ? definition.expectedDomSha256
          : canonicalDigest(renderReference(definition, data));
      const actual = canonicalDigest(readFileSync(output, "utf8"));
      assert.equal(
        actual,
        expected,
        `${engine}/${id}/${probe}: native DOM or escaping differs; output ${output}`,
      );
      results.push({ engine, id, probe, status: "pass" });
    }
  console.log(JSON.stringify(results));
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
