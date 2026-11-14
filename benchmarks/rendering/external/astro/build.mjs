import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL("./", import.meta.url));
await mkdir(new URL("./src/pages/", import.meta.url), { recursive: true });
for (const workload of ["cards", "products", "table"]) {
  const source = await readFile(
    new URL(`../svelte/suite_${workload}.svelte`, import.meta.url),
    "utf8",
  );
  const props = /let (\{[\s\S]*?\}) = \$props\(\);/.exec(source)[1];
  let markup = source
    .replace(/<script>[\s\S]*?<\/script>/, "")
    .trim()
    .replace(
      /\{#each ([^}]+?) as (\w+)(?:, (\w+))?\}/g,
      (_, expr, item, index) =>
        `{${expr}.map((${item}${index ? `, ${index}` : ""}) => (`,
    )
    .replaceAll("{/each}", "))}");
  if (workload !== "products")
    markup = `<html lang="en"><head><title>${workload === "cards" ? "SSR Benchmark Page" : "Customer Data Table"}</title><meta name="viewport" content="width=device-width, initial-scale=1"></head><body${workload === "table" ? ' class="bg-gray-50 text-gray-900"' : ""}>${markup}</body></html>`;
  await writeFile(
    new URL(`./src/pages/${workload}.astro`, import.meta.url),
    `---\nimport {inputs} from '../../../shared/render_inputs.mjs';\nconst ${props}=inputs.${workload};\n---\n${markup}`,
  );
}
const build = Bun.spawn(
  [process.execPath, "--bun", "node_modules/astro/bin/astro.mjs", "build"],
  {
    cwd: here,
    stdout: "inherit",
    stderr: "inherit",
    env: {
      ...process.env,
      NODE_ENV: "production",
      ASTRO_TELEMETRY_DISABLED: "1",
    },
  },
);
if ((await build.exited) !== 0)
  throw new Error("Astro production build failed");
