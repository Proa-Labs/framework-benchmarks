import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "vite";
import { prepareData, siteRoot } from "./prepare-data.mjs";

export { siteRoot };
export const outputDirectory = join(siteRoot, "dist");
const configFile = join(siteRoot, "vite.config.mjs");
export async function buildSite() {
  const { data } = await prepareData();
  await build({ configFile });
  await build({
    configFile,
    build: {
      ssr: join(siteRoot, "src/entry-server.jsx"),
      outDir: join(siteRoot, ".ssr"),
      emptyOutDir: true,
      copyPublicDir: false,
      manifest: false,
      rollupOptions: { output: { entryFileNames: "entry-server.mjs" } },
    },
  });
  const { render } = await import(
    `${pathToFileURL(join(siteRoot, ".ssr/entry-server.mjs"))}?v=${Date.now()}`
  );
  const template = await readFile(join(outputDirectory, "index.html"), "utf8");
  for (const [path, file, title] of [
    ["/", "index.html", "Web framework benchmarks"],
    ["/features", "features.html", "Features"],
    ["/about", "about.html", "Why frameworks.run exists"],
    ["/methodology", "methodology.html", "Methodology"],
    ["/not-a-page", "404.html", "Page not found"],
  ]) {
    const html = template
      .replace("<!--app-html-->", await render(path))
      .replace(/<title>.*?<\/title>/, `<title>${title} · Frameworks</title>`);
    await writeFile(join(outputDirectory, file), html);
  }
  console.log(
    `Built React + Vite site: ${data.renderers.length} renderers → ${outputDirectory}`,
  );
  return { data, outputDirectory };
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1])
  await buildSite();
