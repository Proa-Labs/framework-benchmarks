await import("next/dist/server/node-environment.js");
const { version } = await import("next/dist/compiled/react-dom/server.edge");
const next = await Bun.file(
  new URL("./node_modules/next/package.json", import.meta.url),
).json();
console.log(
  `Next.js ${next.version} compiled page / bundled React DOM ${version} / Bun ${Bun.version}`,
);
