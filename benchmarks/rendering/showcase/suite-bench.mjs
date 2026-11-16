#!/usr/bin/env bun
// All initialization, native compilation and input preparation precede timing.
import { writeFileSync } from "node:fs";
import { runOwnedAdapter } from "../../../tooling/adapters/owned-adapter.mjs";
import { prepareNativeJS } from "./native-js.mjs";

const args = process.argv.slice(2),
  option = (key) => args[args.indexOf(key) + 1];
const id = option("--framework"),
  workload = option("--workload");
const native = await prepareNativeJS(workload, id);
if (args.includes("--dump-css"))
  writeFileSync(option("--dump-css"), native.sheet ?? "");
const labels = {
  react: "React",
  svelte: "Svelte",
  vue: "Vue",
  marko: "Marko",
  handlebars: "Handlebars",
  astro: "Astro",
  sveltekit: "SvelteKit",
  nextjs: "Next.js",
  exact: "Exact",
};
await runOwnedAdapter({
  id,
  label: labels[id],
  allocationPolicy:
    id === "exact"
      ? "Exact production Contract; fresh isolated VM, native DOM, application and owned HTML string; adapted named styles and markup"
      : `${labels[id]} native production SSR; fresh owned HTML string`,
  render: native.render,
});
