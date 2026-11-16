// Build the same utility stylesheet for all showcase previews. HTML render
// measurements include its link, never CSS compilation, image loads or layout.

import { fileURLToPath } from "node:url";
import { compile } from "@tailwindcss/node";
import { readDocument } from "./blueprint.mjs";
import { fixtures, loadFixture, renderReference } from "./fixture.mjs";
export async function utilityStylesheet() {
  const candidates = new Set();
  function collect(n) {
    for (const [name, value] of n.attrs ?? [])
      if (name === "class")
        for (const word of value.split(/\s+/)) if (word) candidates.add(word);
    for (const child of n.children ?? []) collect(child);
  }
  for (const { id } of fixtures) {
    const { definition, data } = loadFixture(id);
    collect(readDocument(renderReference(definition, data)));
  }
  const compiler = await compile('@import "tailwindcss";', {
    base: fileURLToPath(new URL("../../../site/", import.meta.url)),
    onDependency() {},
  });
  return compiler.build([...candidates]);
}
