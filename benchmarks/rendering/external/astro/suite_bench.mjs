import { readdir } from "node:fs/promises";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { runOwnedAdapter } from "../../../../tooling/adapters/owned-adapter.mjs";

const workload = process.argv[process.argv.indexOf("--workload") + 1];
const chunks = new URL("./dist/server/chunks/", import.meta.url);
const file = (await readdir(chunks)).find(
  (f) => f.startsWith(`${workload}_`) && f.endsWith(".mjs"),
);
if (!file) throw new Error("Build the Astro production adapter first");
const { page } = await import(new URL(file, chunks).href);
const Component = page().default;
const container = await AstroContainer.create();
await runOwnedAdapter({
  id: "astro",
  label: "Astro",
  allocationPolicy:
    "Astro native compiled component SSR; fresh owned HTML string",
  render: () => container.renderToString(Component),
});
