import { readFile } from "node:fs/promises";
import { runOwnedAdapter } from "../../../tooling/owned-adapter.mjs";

const workload = process.argv[process.argv.indexOf("--workload") + 1];
const entry = JSON.parse(
  await readFile(
    new URL("./.svelte-kit/render-entry.json", import.meta.url),
    "utf8",
  ),
);
const native = await import(
  new URL(`./.svelte-kit/output/server/chunks/${entry.file}`, import.meta.url)
    .href
);
const render = native[entry.alias];
const Component = (
  await import(
    new URL(
      `./.svelte-kit/output/server/entries/pages/(pages)/${workload}/_page.svelte.js`,
      import.meta.url,
    ).href
  )
).default;
await runOwnedAdapter({
  id: "sveltekit",
  label: "SvelteKit",
  allocationPolicy:
    "SvelteKit production-compiled page through native Svelte SSR; fresh owned HTML string",
  render: () => {
    const output = render(Component);
    return workload === "products"
      ? output.body
      : `<html lang="en"><head>${output.head}</head><body${workload === "table" ? ' class="bg-gray-50 text-gray-900"' : ""}>${output.body}</body></html>`;
  },
});
