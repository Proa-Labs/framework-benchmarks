import { readdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL("./", import.meta.url));
for (const args of [
  ["npm", "ci", "--include=dev"],
  [process.execPath, "--bun", "node_modules/vite/bin/vite.js", "build"],
]) {
  const child = Bun.spawn(args, {
    cwd: here,
    stdout: "inherit",
    stderr: "inherit",
  });
  if ((await child.exited) !== 0)
    throw new Error("SvelteKit production build failed");
}
// Use the render export from this production bundle so compiled pages and the
// native Svelte SSR entry point share the same runtime instance. Export aliases
// are discovered at build time; no generated renderer code is patched.
const chunks = new URL("./.svelte-kit/output/server/chunks/", import.meta.url);
const matches = [];
for (const file of await readdir(chunks)) {
  if (!file.endsWith(".js")) continue;
  const code = await readFile(new URL(file, chunks), "utf8");
  const alias = /export \{[^}]*\brender as (\w+)[^}]*\}/.exec(code)?.[1];
  if (alias) matches.push({ file, alias });
}
if (matches.length !== 1)
  throw new Error("Cannot identify the production Svelte SSR entry point");
await writeFile(
  new URL("./.svelte-kit/render-entry.json", import.meta.url),
  JSON.stringify(matches[0]),
);
