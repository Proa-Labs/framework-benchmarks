import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import vm from "node:vm";
import { runOwnedAdapter } from "../../../tooling/owned-adapter.mjs";
import {
  buildCardSections,
  buildProducts,
  buildTableRows,
} from "../shared/suite_data.mjs";

const here = fileURLToPath(new URL("./", import.meta.url));
const source =
  process.env.EXACT_SOURCE ||
  resolve(here, "../../../framework-ssr/.cache/exact");
const { createDocument } = await import(
  pathToFileURL(resolve(source, "host/web-js/dom.js"))
);
const workload = process.argv[process.argv.indexOf("--workload") + 1];
assert.ok(["cards", "products", "table"].includes(workload));
// Exact stores typed records as arrays. Convert prepared data before timing;
// escaping, branches, loops, currency/date formatting and serialization stay in.
const input =
  workload === "cards"
    ? buildCardSections().map((s) => [
        s.dataSection,
        s.title,
        s.cards.map((c) => [c.dataCardId, c.title, c.features]),
      ])
    : workload === "products"
      ? buildProducts().map((p) => Object.values(p))
      : buildTableRows().map((r) => Object.values(r));
const app = resolve(here, "build", workload);
const script = new vm.Script(readFileSync(resolve(app, "bench.js"), "utf8"), {
  filename: "exact-native-fixture.js",
});
const sheet = readFileSync(resolve(app, "dist/style.css"), "utf8");
if (process.argv.includes("--dump-css")) {
  const { writeFileSync } = await import("node:fs");
  writeFileSync(process.argv[process.argv.indexOf("--dump-css") + 1], sheet);
}
const freshDocument = () =>
  Object.assign(createDocument(sheet), {
    baseURI: "http://render.invalid/",
    visibilityState: "visible",
    hasFocus: () => true,
  });
await runOwnedAdapter({
  id: "exact",
  label: "Exact",
  allocationPolicy:
    "Exact production-compiled Contract with native named styles and DOM serializer; fresh owned HTML string. Runtime VM/module initialization and prepared input seeding precede timing; fresh DOM allocation, app construction, formatting and serialization are timed. Adapted markup, not strict DOM parity.",
  prepare() {
    // As for peers, compile/load the renderer before its invocation. Each ready
    // runtime is isolated; no prior DOM, cached HTML or live reactive tree exists.
    const ctx = vm.createContext({
      document: freshDocument(),
      location: { pathname: "/", search: "", href: "http://render.invalid/" },
      navigator: { language: "en-US" },
      performance,
      console,
      URL,
      URLSearchParams,
      TextEncoder,
      TextDecoder,
      AbortController,
      AbortSignal,
      setTimeout,
      clearTimeout,
      queueMicrotask,
      requestAnimationFrame: () => 0,
      addEventListener() {},
      removeEventListener() {},
      getComputedStyle: () => ({ fontSize: "16px" }),
      innerWidth: 1280,
      innerHeight: 800,
      devicePixelRatio: 1,
      __exactRender: true,
    });
    ctx.globalThis = ctx;
    ctx.self = ctx;
    script.runInContext(ctx);
    ctx.prepareInput(input);
    assert.equal(ctx.document.root.childNodes.length, 0);
    return ctx;
  },
  render(ctx) {
    ctx.document = freshDocument();
    const body = ctx.renderFixture();
    return workload === "products"
      ? body
      : `<html lang="en"><head><title>${workload === "cards" ? "SSR Benchmark Page" : "Customer Data Table"}</title><meta name="viewport" content="width=device-width, initial-scale=1"></head><body${workload === "table" ? ' class="bg-gray-50 text-gray-900"' : ""}>${body}</body></html>`;
  },
});
