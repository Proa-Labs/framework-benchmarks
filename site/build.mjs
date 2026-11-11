import { rm } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createBuilder } from "vite";
import { prepareData, siteRoot } from "./prepare-data.mjs";

export { siteRoot };
export const outputDirectory = join(siteRoot, "dist/client");
export async function buildSite() {
  const { data } = await prepareData();
  await rm(join(siteRoot, "dist"), { recursive: true, force: true });
  const builder = await createBuilder({
    configFile: join(siteRoot, "vite.config.ts"),
  });
  await builder.buildApp();
  console.log(
    `Built TanStack Start: ${data.renderers.length} renderers, Cloudflare SSR + client assets`,
  );
  return { data, outputDirectory };
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1])
  await buildSite();
