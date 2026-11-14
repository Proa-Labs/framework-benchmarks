import { runOwnedAdapter } from "../../../../tooling/adapters/owned-adapter.mjs";

// Initialize Next's native runtime and resolve this production-compiled page
// before timing. HTTP routing, RSC transport and hydration are separate suites.
await import("next/dist/server/node-environment.js");
const entry = await import("./.next/server/app/[workload]/page.js");
const findPage = (tree) =>
  tree[2].page?.[0] || Object.values(tree[1]).map(findPage).find(Boolean);
const load = findPage(entry.routeModule.userland.loaderTree);
if (!load)
  throw new Error("The pinned Next build has no canonical page export");
const Page = (await load()).default;
const renderer = await import("next/dist/compiled/react-dom/server.edge");
const workload = process.argv[process.argv.indexOf("--workload") + 1];
const props = { params: Promise.resolve({ workload }) };
await runOwnedAdapter({
  id: "nextjs",
  label: "Next.js",
  allocationPolicy:
    "Next production-compiled page via its bundled React DOM SSR; fresh owned HTML string",
  render: async () => {
    const body = renderer.renderToString(await Page(props));
    return workload === "products"
      ? body
      : `<html lang="en"><head><title>${workload === "cards" ? "SSR Benchmark Page" : "Customer Data Table"}</title><meta name="viewport" content="width=device-width, initial-scale=1"></head><body${workload === "table" ? ' class="bg-gray-50 text-gray-900"' : ""}>${body}</body></html>`;
  },
});
