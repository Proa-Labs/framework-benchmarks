import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { nativeTemplate } from "./emit-template.mjs";
import { loadFixture } from "./fixture.mjs";
import { generateJS } from "./generate-js.mjs";
import { prepareNativeExact } from "./native-exact.mjs";
import { prepareNativeFramework } from "./native-framework.mjs";

export const generatedDirectory = fileURLToPath(
  new URL("./.generated/", import.meta.url),
);
const fromAdapter = (id) =>
  createRequire(new URL(`../external/${id}/package.json`, import.meta.url));
export async function prepareNativeJS(id, engine) {
  assert.equal(process.env.NODE_ENV, "production");
  mkdirSync(generatedDirectory, { recursive: true });
  generateJS(generatedDirectory);
  const { definition } = loadFixture(id);
  const input = await import(
    pathToFileURL(join(generatedDirectory, `${id}.data.mjs`)).href
  );
  const preparedInput = input.createInput();
  const { data, prepared } = preparedInput;
  const request = () => data.texts[definition.controls.requestIndex];
  if (engine === "exact")
    return {
      ...(await prepareNativeExact(id, { definition, data, prepared })),
      input,
    };
  if (["astro", "sveltekit", "nextjs"].includes(engine))
    return {
      data,
      prepared,
      input,
      ...(await prepareNativeFramework(id, engine, data, definition)),
    };
  if (engine === "react") {
    const { createElement } = await import("react");
    const { renderToString } = await import("react-dom/server");
    const { Page } = await import(
      pathToFileURL(join(generatedDirectory, `${id}.react.mjs`)).href
    );
    return {
      data,
      prepared,
      input,
      render: (freshness = request()) =>
        "<!DOCTYPE html>" +
        renderToString(createElement(Page, { data, request: freshness })),
    };
  }
  if (engine === "svelte") {
    const require = fromAdapter("svelte"),
      { compile } = require("svelte/compiler");
    const { markup, styles } = nativeTemplate(definition, "svelte");
    const source = `<script>let {data,styles,request}=$props();</script>${markup}`;
    const compiled = compile(source, {
      filename: `${id}.svelte`,
      generate: "server",
      dev: false,
      preserveWhitespace: true,
    }).js.code;
    const result = compiled.replaceAll(
      "'svelte/internal/server'",
      JSON.stringify(
        pathToFileURL(require.resolve("svelte/internal/server")).href,
      ),
    );
    const file = join(generatedDirectory, `${id}.svelte.mjs`);
    writeFileSync(file, result);
    const { default: Page } = await import(pathToFileURL(file).href);
    const { render } = require("svelte/server");
    return {
      data,
      prepared,
      input,
      render: (freshness = request()) =>
        "<!DOCTYPE html>" +
        render(Page, { props: { data, styles, request: freshness } }).body,
    };
  }
  if (engine === "vue") {
    const require = fromAdapter("vue"),
      Vue = require("vue"),
      ssr = require("vue/server-renderer");
    const { compile } = require("@vue/compiler-ssr");
    const { markup, styles, styleContents } = nativeTemplate(definition, "vue");
    const code = compile(markup, {
      mode: "function",
      // Vue's pinned HTML catalog does not include the semantic <search> tag.
      isCustomElement: (tag) => tag === "search" || tag.includes("-"),
    }).code;
    const ssrRender = new Function("require", code)((name) =>
      name === "vue"
        ? Vue
        : name === "vue/server-renderer"
          ? ssr
          : require(name),
    );
    const Page = {
      props: ["data", "styles", "styleContents", "request"],
      ssrRender,
    };
    return {
      data,
      prepared,
      input,
      render: async (freshness = request()) =>
        "<!DOCTYPE html>" +
        (await ssr.renderToString(
          Vue.createSSRApp(Page, {
            data,
            styles,
            styleContents,
            request: freshness,
          }),
        )),
    };
  }
  if (engine === "marko") {
    const require = fromAdapter("marko");
    const { compileFile } = require("@marko/compiler");
    const directory = fileURLToPath(
      new URL("../external/marko/build/showcase/", import.meta.url),
    );
    mkdirSync(directory, { recursive: true });
    const { markup, styles } = nativeTemplate(definition, "marko", {
      rootContext: "input.data",
    });
    const source = join(directory, `${id}.marko`),
      compiledFile = join(directory, `${id}.compiled.mjs`);
    writeFileSync(source, markup);
    const compiled = await compileFile(source, {
      output: "html",
      optimize: true,
      modules: "esm",
      writeVersionComment: false,
      htmlParseOptions: { preserveWhitespace: true },
      translator: require.resolve("marko/translator"),
      resolveVirtualDependency: (_filename, dependency) =>
        dependency.virtualPath,
    });
    writeFileSync(compiledFile, compiled.code);
    const { default: Page } = await import(pathToFileURL(compiledFile).href);
    return {
      data,
      prepared,
      input,
      render: async (freshness = request()) =>
        "<!DOCTYPE html>" +
        (await (typeof Page.render === "function"
          ? Page.render({ data, styles, request: freshness })
          : Page.renderToString({ data, styles, request: freshness }))),
    };
  }
  if (engine === "handlebars") {
    const Handlebars = fromAdapter("handlebars")("handlebars");
    const { markup, styles } = nativeTemplate(definition, "handlebars");
    Handlebars.registerHelper("eq", (a, b) => a === b);
    const template = Handlebars.compile(markup, { strict: true });
    // Compile lazy template bytecode before the first measured invocation.
    template({ ...data, styles, request: request() });
    return {
      data,
      prepared,
      input,
      render: (freshness = request()) =>
        `<!DOCTYPE html>${template({ ...data, styles, request: freshness })}`,
    };
  }
  throw new Error(`Native ${engine} setup is not implemented`);
}
