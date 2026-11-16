import shells from "../.showcase-generated/shells.mjs";

// The root app shell supplies body/html attributes in SvelteKit. Components own
// the actual page tree, head and per-request freshness attribute.
export function handle({ event, resolve }) {
  const id = /^\/showcase\/([^/]+)\/?$/.exec(event.url.pathname)?.[1];
  const shell = shells[id];
  return resolve(
    event,
    shell
      ? {
          transformPageChunk: ({ html }) =>
            html
              .replace('<html lang="en">', shell.html)
              .replace("<body>", shell.body),
        }
      : undefined,
  );
}
