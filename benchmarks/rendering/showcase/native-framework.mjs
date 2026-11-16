// Load real production framework builds once, then render prepared props through
// their native SSR APIs. HTTP routing and transport remain in Framework SSR.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const adapters = fileURLToPath(
  new URL("../../framework-ssr/adapters/", import.meta.url),
);
export async function prepareNativeFramework(id, engine, data, definition) {
  const request = () => data.texts[definition.controls.requestIndex];
  const directory = join(
    adapters,
    engine === "sveltekit"
      ? "sveltekit"
      : engine === "nextjs"
        ? "next"
        : engine,
  );
  const require = createRequire(join(directory, "package.json"));
  if (engine === "astro") {
    const chunks = join(directory, "dist/server/chunks");
    const file = readdirSync(chunks).find(
      (f) => f.startsWith(`${id}_`) && f.endsWith(".mjs"),
    );
    assert.ok(file, `Build the production Astro showcase route ${id}`);
    const { page } = await import(pathToFileURL(join(chunks, file)).href);
    const Component = page().default;
    const { experimental_AstroContainer } = await import(
      pathToFileURL(require.resolve("astro/container")).href
    );
    const container = await experimental_AstroContainer.create();
    return {
      render: (freshness = request()) =>
        container.renderToString(Component, {
          props: { benchmarkData: data, benchmarkRequest: freshness },
        }),
    };
  }
  if (engine === "sveltekit") {
    const output = join(directory, ".svelte-kit/output/server");
    const chunks = join(output, "chunks"),
      matches = [];
    for (const file of readdirSync(chunks))
      if (file.endsWith(".js")) {
        const code = readFileSync(join(chunks, file), "utf8"),
          alias = /export \{[^}]*\brender as (\w+)[^}]*\}/.exec(code)?.[1];
        if (alias) matches.push({ file, alias });
      }
    assert.equal(
      matches.length,
      1,
      "Cannot identify the production Svelte SSR runtime",
    );
    const native = await import(
        pathToFileURL(join(chunks, matches[0].file)).href
      ),
      render = native[matches[0].alias];
    const { default: Page } = await import(
      pathToFileURL(
        join(output, `entries/pages/showcase/${id}/_page.svelte.js`),
      ).href
    );
    const { shell, styles } = await import(
      pathToFileURL(join(directory, `.showcase-generated/${id}.shell.mjs`)).href
    );
    return {
      render: (freshness = request()) => {
        const result = render(Page, {
          props: { data: { fixtureData: data, styles, request: freshness } },
        });
        return `<!DOCTYPE html>${shell.html}<head>${result.head}</head>${shell.body}${result.body}</body></html>`;
      },
    };
  }
  assert.equal(engine, "nextjs");
  await import(
    pathToFileURL(require.resolve("next/dist/server/node-environment.js")).href
  );
  const entry = await import(
    pathToFileURL(
      join(directory, `.next/server/app/(showcase)/showcase/${id}/page.js`),
    ).href
  );
  const findPage = (tree) =>
    tree[2].page?.[0] || Object.values(tree[1]).map(findPage).find(Boolean);
  const load = findPage(entry.routeModule.userland.loaderTree);
  assert.ok(load, "The production Next build has no showcase page export");
  const Page = (await load()).default;
  const renderer = await import(
    pathToFileURL(require.resolve("next/dist/compiled/react-dom/server.edge"))
      .href
  );
  return {
    render: async (freshness = request()) =>
      "<!DOCTYPE html>" +
      renderer.renderToString(
        await Page({
          benchmarkData: data,
          benchmarkRequest: freshness,
          benchmarkFullDocument: true,
          searchParams: Promise.resolve({ request: freshness }),
        }),
      ),
  };
}
