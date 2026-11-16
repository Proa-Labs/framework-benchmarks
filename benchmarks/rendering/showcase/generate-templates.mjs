// Generate native source and typed prepared inputs before compilation or timing.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { nativeTemplate } from "./emit-template.mjs";
import { fixtures, loadFixture } from "./fixture.mjs";
export function generateTemplates(directory) {
  mkdirSync(directory, { recursive: true });
  for (const { id } of fixtures) {
    const { definition, records, prepared, data } = loadFixture(id);
    const types = records.map(() => ({})),
      indices = new Map(prepared.map((r, i) => [r, i]));
    function annotate(n, r) {
      if (n.kind === "repeat") {
        for (const child of r.groups[n.group])
          annotate(definition.templates[n.template], child);
        return;
      }
      if (n.kind === "variant") {
        annotate(n.cases[r.variants[n.selector]], r);
        return;
      }
      for (const [name, value] of n.attrs ?? [])
        if ("slot" in value && name === "style")
          types[indices.get(r)][value.slot] = "css";
      for (const child of n.children ?? []) annotate(child, r);
    }
    annotate(definition.templates[definition.entry], data);
    for (const kind of ["jinja", "erb", "php", "go", "jte", "rocker"]) {
      const { markup, styles } = nativeTemplate(definition, kind, {
        rootContext:
          kind === "php" ? "$data" : kind === "go" ? "$data" : "data",
      });
      const prefix =
        kind === "go"
          ? "{{$data := .Data}}{{$request := .Request}}{{$styles := .Styles}}"
          : "";
      writeFileSync(
        join(directory, `${id}.${kind}`),
        `${prefix}<!DOCTYPE html>${markup}`,
      );
      writeFileSync(
        join(directory, `${id}.${kind}.json`),
        JSON.stringify({ definition, records, styles, types }),
      );
    }
  }
}
if (import.meta.main)
  generateTemplates(process.argv[process.argv.indexOf("--out") + 1]);
