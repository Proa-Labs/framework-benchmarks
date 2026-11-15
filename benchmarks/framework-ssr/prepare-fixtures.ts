import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { cards } from "./fixture.mjs";
import { fixture } from "./workloads.ts";

// One prerequisite for all framework builds, before Turbo starts them in parallel.
export async function prepareFixtures() {
  const here = dirname(fileURLToPath(import.meta.url));
  for (const engine of ["next", "astro", "exact", "proa", "sveltekit"]) {
    await Bun.write(
      join(here, "adapters", engine, "fixture.json"),
      `${JSON.stringify(fixture)}\n`,
    );
    await Bun.write(
      join(here, "adapters", engine, "cards.json"),
      `${JSON.stringify(cards, null, 2)}\n`,
    );
  }
}
if (import.meta.main) await prepareFixtures();
