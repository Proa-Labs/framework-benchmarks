import { copyFile, mkdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import contract from "./contract.json";
import { cards } from "./fixture.mjs";
import { fixture } from "./workloads.ts";
export const here = dirname(fileURLToPath(import.meta.url));
export const root = dirname(here);
export const targetDirectory = resolve(
  root,
  process.env.CARGO_TARGET_DIR || "target",
);
export const exactSource =
  process.env.EXACT_SOURCE || join(here, ".cache/exact");
export const environment: NodeJS.ProcessEnv = {
  ...process.env,
  NODE_ENV: "production",
  EXACT_FEEDBACK: "0",
  ASTRO_TELEMETRY_DISABLED: "1",
  NEXT_TELEMETRY_DISABLED: "1",
};
export async function command(args: string[], cwd = root, env = environment) {
  const child = Bun.spawn(args, {
    cwd,
    env,
    stdout: "inherit",
    stderr: "inherit",
  });
  const code = await child.exited;
  if (code)
    throw new Error(`${args[0]} ${args.slice(1).join(" ")} failed (${code})`);
}
export async function buildProa() {
  await Bun.write(
    join(here, "adapters/proa/fixture.json"),
    `${JSON.stringify(fixture)}\n`,
  );
  await Bun.write(
    join(here, "adapters/proa/cards.json"),
    `${JSON.stringify(cards, null, 2)}\n`,
  );
  await command([
    "cargo",
    "build",
    "--release",
    "--locked",
    "--manifest-path",
    join(here, "adapters/proa/Cargo.toml"),
    "--target-dir",
    targetDirectory,
  ]);
}
export async function buildAll() {
  if (Bun.version !== "1.4.2") throw new Error("Use pinned Bun 1.4.2");
  await command([process.execPath, "run", "build:framework-adapters"]);
  if (!(await Bun.file(join(exactSource, "Cargo.toml")).exists())) {
    await mkdir(dirname(exactSource), { recursive: true });
    await command([
      "git",
      "clone",
      "--no-checkout",
      "--filter=blob:none",
      "https://github.com/expo/exact.git",
      exactSource,
    ]);
    await command(
      ["git", "fetch", "--depth=1", "origin", contract.exactCommit],
      exactSource,
    );
    await command(
      ["git", "checkout", "--detach", contract.exactCommit],
      exactSource,
    );
  }
  const revision = Bun.spawnSync(["git", "rev-parse", "HEAD"], {
    cwd: exactSource,
  })
    .stdout.toString()
    .trim();
  if (revision !== contract.exactCommit)
    throw new Error(`Exact source must be pinned at ${contract.exactCommit}`);
  const clean = Bun.spawnSync(["git", "diff", "--quiet"], { cwd: exactSource });
  if (clean.exitCode !== 0)
    throw new Error("Exact source has tracked modifications");
  await command(
    [process.execPath, "install", "--frozen-lockfile"],
    exactSource,
  );
  await command(
    [
      process.execPath,
      "host/web-js/build.mjs",
      join(here, "adapters/exact"),
      "--production",
      "--render",
      "js",
      "--out",
      join(here, "adapters/exact/dist"),
    ],
    exactSource,
    { ...environment, EXACT_APP_DIR: join(here, "adapters/exact") },
  );
  await copyFile(
    join(here, "adapters/exact/dist/.gen/app.contract.d.ts"),
    join(here, "adapters/exact/app.contract.d.ts"),
  );
  // Exact generates its Contract declarations during the production build.
  // Check the runner and adapter only after those declarations and fixtures exist.
  await command([
    process.execPath,
    "--bun",
    join(root, "node_modules/typescript/bin/tsc"),
    "--noEmit",
    "-p",
    join(here, "tsconfig.adapters.json"),
  ]);
  await buildProa();
  console.log("Built all five production framework adapters");
}
if (import.meta.main) await buildAll();
