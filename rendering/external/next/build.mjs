import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL("./", import.meta.url));
const child = Bun.spawn(
  [process.execPath, "--bun", "node_modules/next/dist/bin/next", "build"],
  {
    cwd: here,
    stdout: "inherit",
    stderr: "inherit",
    env: {
      ...process.env,
      NODE_ENV: "production",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },
);
if ((await child.exited) !== 0) throw new Error("Next production build failed");
