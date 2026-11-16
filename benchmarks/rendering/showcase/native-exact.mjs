// Exact's documented native adaptation. Its VM, DOM, application construction
// and serialization are fresh per invocation and remain inside render timing.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import vm from "node:vm";
import { exactContract, exactPlan } from "./exact-plan.mjs";
import { fixtureDirectory, loadFixture } from "./fixture.mjs";
import { exactRevision, exactSource } from "./generate-exact.mjs";

const directory = fileURLToPath(
  new URL("./.generated/exact/", import.meta.url),
);
const escaped = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
export async function prepareNativeExact(
  id,
  { definition, data, prepared } = loadFixture(id),
) {
  const path = join(directory, id),
    adaptation = JSON.parse(
      readFileSync(join(path, "adaptation.json"), "utf8"),
    );
  assert.equal(adaptation.engineRevision, exactRevision);
  assert.equal(adaptation.fixtureDomSha256, definition.expectedDomSha256);
  const styles = JSON.parse(
    readFileSync(new URL(`${id}.exact-styles.json`, fixtureDirectory), "utf8"),
  );
  const plan = exactPlan(definition, prepared, styles),
    script = new vm.Script(readFileSync(join(path, "bench.js"), "utf8"), {
      filename: `exact-${id}-production.js`,
    });
  const sheet = readFileSync(join(path, "dist/style.css"), "utf8");
  assert.equal(
    createHash("sha256").update(sheet).digest("hex"),
    adaptation.nativeCssSha256,
    "Rebuild Exact after changing its stylesheet",
  );
  const { createDocument } = await import(
    pathToFileURL(join(exactSource, "host/web-js/dom.js")).href
  );
  const native = exactContract(plan, styles, {
    omitStyles: new Set(adaptation.omittedStyles.map(JSON.stringify)),
    omitAttributes: new Set(adaptation.omittedAttributes),
  });
  assert.equal(
    createHash("sha256").update(native.source).digest("hex"),
    adaptation.nativeSourceSha256,
    "Rebuild Exact after changing native source or its input schema",
  );
  let input = plan.typedInput(data);
  const refreshPreparedInput = () => {
    input = plan.typedInput(data);
  };
  const render = (request = data.texts[definition.controls.requestIndex]) => {
    const document = Object.assign(createDocument(sheet), {
      baseURI: "http://render.invalid/",
      visibilityState: "visible",
      hasFocus: () => true,
    });
    const context = vm.createContext({
      document,
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
    context.globalThis = context;
    context.self = context;
    script.runInContext(context);
    context.prepareInput(input, request);
    const body = context.renderFixture();
    return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escaped(data.texts[definition.controls.titleIndex])}</title><style>${sheet}</style></head><body>${body}</body></html>`;
  };
  return { data, prepared, render, refreshPreparedInput, adaptation, sheet };
}
