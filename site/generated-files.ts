import { randomUUID } from "node:crypto";
import {
  mkdir,
  readdir,
  readFile,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { basename, dirname, join } from "node:path";

// Keep unchanged inputs invisible to Vite's watcher, and never expose a
// partially written JSON/HTML document to the dev server or a browser.
export async function writeGenerated(path: string, value: string | Uint8Array) {
  const bytes = Buffer.from(value);
  try {
    if ((await readFile(path)).equals(bytes)) return false;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  await mkdir(dirname(path), { recursive: true });
  const temporary = join(
    dirname(path),
    `.${basename(path)}.${randomUUID()}.tmp`,
  );
  try {
    await writeFile(temporary, bytes, { flag: "wx" });
    await rename(temporary, path);
  } finally {
    await rm(temporary, { force: true });
  }
  return true;
}

export async function copyGenerated(source: string, target: string) {
  if ((await stat(source)).isDirectory()) {
    await mkdir(target, { recursive: true });
    await Promise.all(
      (await readdir(source)).map((name) =>
        copyGenerated(join(source, name), join(target, name)),
      ),
    );
  } else await writeGenerated(target, await readFile(source));
}
