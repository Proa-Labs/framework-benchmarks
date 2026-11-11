// Documentation evidence is independent of timed benchmark captures.
export const reviewedOn = "2026-11-10";
export { expandedReviewedOn as updatedOn } from "./feature-expansion.mjs";
export { featureGroups, features, supportStates } from "./feature-schema.mjs";

import catalog from "./catalog.json" with { type: "json" };
import { additionalEvidence, featureProjects } from "./feature-additions.mjs";
import { auditedEvidence } from "./feature-audit.mjs";
import {
  addBackendEvidence,
  refineReviewedFindings,
} from "./feature-backend.mjs";
import { expandedEvidence } from "./feature-evidence.mjs";
import { addExpandedReview } from "./feature-expansion.mjs";
import { addNavigationSecurityEvidence } from "./feature-navigation-security.mjs";
import { features } from "./feature-schema.mjs";

const cell = (status, note, url, label) => ({ status, note, url, label });
const built = (note, url, label) => cell("native", note, url, label);
const official = (note, url, label) => cell("official", note, url, label);
const external = (note, url, label) => cell("community", note, url, label);
const qualified = (note, url, label) => cell("partial", note, url, label);
const exact =
  "https://github.com/expo/exact/blob/94b8671f70fe2e25b307a40e7fce66dc27c9f802/";
const topcoat = "https://docs.rs/crate/topcoat/0.3.1/source/README.md";

export const featureEvidence = {
  vue: {
    scope:
      "Vue 3 documentation. Vue Router and external application/i18n packages are identified separately.",
    ssr: built(
      "vue/server-renderer renders a Vue application to HTML.",
      "https://vuejs.org/api/ssr.html",
    ),
    streaming: built(
      "Server renderer APIs produce Node or Web streams and can pipe to writable streams. This does not establish out-of-order fallback replacement.",
      "https://vuejs.org/api/ssr.html",
    ),
    suspense: qualified(
      "Vue's built-in Suspense coordinates async setup and async components, but remains explicitly experimental. The component documentation does not establish React-equivalent SSR fallback streaming.",
      "https://vuejs.org/guide/built-ins/suspense.html",
      "Experimental",
    ),
    client: built(
      "createSSRApp hydrates the server-rendered application on the client.",
      "https://vuejs.org/guide/scaling-up/ssr.html",
      "Hydration",
    ),
    routing: official(
      "Vue Router is the official routing library; a production SSR application must also integrate server handling.",
      "https://vuejs.org/guide/scaling-up/routing.html",
      "Vue Router",
    ),
    ssg: external(
      "The Vue SSR guide points to application tools such as Nuxt and VitePress for static-site generation.",
      "https://vuejs.org/guide/scaling-up/ssr.html",
      "Nuxt / VitePress",
    ),
    translations: external(
      "Vue I18n adds message catalogs, pluralization, fallback locales, and lazy-loading support.",
      "https://vue-i18n.intlify.dev/guide/introduction",
      "Vue I18n",
    ),
    localeFormatting: external(
      "Vue I18n documents date/time and number formatting helpers.",
      "https://vue-i18n.intlify.dev/guide/introduction",
      "Vue I18n",
    ),
  },
  astro: {
    scope:
      "Astro documentation; official UI integrations named where required.",
    ssr: official(
      "On-demand rendering uses an official deployment adapter, such as @astrojs/node.",
      "https://docs.astro.build/en/guides/on-demand-rendering/",
      "SSR adapter",
    ),
    streaming: built(
      "On-demand Astro pages stream HTML; deployed adapters and proxies must preserve streaming.",
      "https://docs.astro.build/en/guides/routing/",
    ),
    suspense: qualified(
      "server:defer renders fallback UI, then fetches each server island from a separate endpoint. This is not a React-style boundary inside the original HTML stream.",
      "https://docs.astro.build/en/guides/server-islands/",
      "Server islands",
    ),
    client: official(
      "client:* directives activate islands using UI integrations such as @astrojs/react and @astrojs/vue.",
      "https://docs.astro.build/en/guides/framework-components/",
      "UI islands",
    ),
    routing: built(
      "Files under src/pages define page and endpoint routes.",
      "https://docs.astro.build/en/guides/routing/",
    ),
    ssg: built(
      "Pages are prerendered at build time by default; server mode can opt individual routes into prerendering.",
      "https://docs.astro.build/en/reference/routing-reference/",
    ),
    actions: built(
      "Astro Actions expose typed server handlers to browser code and HTML forms.",
      "https://docs.astro.build/en/guides/actions/",
      "Astro Actions",
    ),
    translations: qualified(
      "The documented recipe uses application-owned translation dictionaries. Astro's i18n routing is separate from message translation.",
      "https://docs.astro.build/en/recipes/i18n/",
      "Dictionary recipe",
    ),
    localeRouting: built(
      "Locale configuration, URL helpers, preferred-language detection, and fallback routing; domain routing has prerendering restrictions.",
      "https://docs.astro.build/en/guides/internationalization/",
    ),
  },
  dioxus: {
    scope:
      "Dioxus 0.7 documentation, including the optional Fullstack and Router packages.",
    ssr: official(
      "Dioxus Fullstack renders initial HTML and hydrates the application in the browser.",
      "https://dioxuslabs.com/learn/0.7/essentials/fullstack/streaming/",
      "Fullstack",
    ),
    streaming: official(
      "Fullstack can opt into out-of-order HTML streaming. The default waits for suspense boundaries before sending the page.",
      "https://dioxuslabs.com/learn/0.7/essentials/fullstack/streaming/",
      "Fullstack",
    ),
    suspense: built(
      "Suspense boundaries coordinate asynchronous UI; Fullstack can stream their resolved HTML.",
      "https://dioxuslabs.com/learn/0.7/essentials/fullstack/streaming/",
    ),
    client: official(
      "Fullstack supports hydration of the server-rendered application.",
      "https://dioxuslabs.com/learn/0.7/essentials/fullstack/streaming/",
      "Hydration",
    ),
    routing: official(
      "The fullstack server integrates an Axum router and registers server functions.",
      "https://dioxuslabs.com/learn/0.7/essentials/fullstack/axum/",
      "Fullstack / Axum",
    ),
    ssg: official(
      "Fullstack SSG runs the app, enumerates its sitemap, and retains HTML for static hosting.",
      "https://dioxuslabs.com/learn/0.7/essentials/fullstack/static_site_generation/",
      "Fullstack SSG",
    ),
    actions: official(
      "Fullstack registers server functions that browser code can call.",
      "https://dioxuslabs.com/learn/0.7/essentials/fullstack/axum/",
      "Fullstack",
    ),
    translations: external(
      "dioxus-i18n provides Fluent messages and locale configuration; its documentation declares Dioxus 0.7 support.",
      "https://docs.rs/dioxus-i18n/latest/dioxus_i18n/",
      "dioxus-i18n",
    ),
  },
  exact: {
    scope:
      "Exact source revision 94b8671 (the revision used by the Framework SSR adapter); pre-1.0 APIs change frequently.",
    ssr: built(
      "The Rust renderer can prerender web pages per request.",
      `${exact}README.md#what-works-today-and-what-doesnt-yet`,
    ),
    client: built(
      "The web runtime adopts server-rendered HTML in place; the project distinguishes this from hydration.",
      `${exact}README.md#what-works-today-and-what-doesnt-yet`,
      "DOM adoption",
    ),
    routing: qualified(
      "Contract provides retained navigation stacks. HTTP URL-to-page routing was not established by this review.",
      `${exact}README.md#contract`,
      "Navigation stacks",
    ),
    ssg: built(
      "The documented web path supports build-time prerendered pages.",
      `${exact}README.md#what-works-today-and-what-doesnt-yet`,
    ),
    translations: built(
      "strings/<locale>.json and t() provide compile-checked keys and placeholders, with locale fallback to the base table.",
      `${exact}docs/contract-for-humans.md#platform-facts-and-localization`,
    ),
    localeFormatting: qualified(
      "The reviewed formatDate, formatTime, and formatNumber helpers use en-US regardless of the viewer's locale.",
      `${exact}docs/contract-for-humans.md#platform-facts-and-localization`,
      "Fixed en-US",
    ),
  },
  leptos: {
    scope:
      "Leptos book and API documentation; official router/server crates named separately.",
    ssr: built(
      "The ssr build mode generates server HTML; hydrate builds activate it in the browser.",
      "https://docs.rs/leptos/latest/leptos/",
    ),
    streaming: built(
      "In-order, out-of-order, and partially blocked SSR modes are documented.",
      "https://book.leptos.dev/ssr/23_ssr_modes.html",
    ),
    suspense: built(
      "Suspense boundaries coordinate resources and stream resolved content with fallback UI in out-of-order mode.",
      "https://book.leptos.dev/ssr/23_ssr_modes.html",
    ),
    client: built(
      "The hydrate feature adds interactivity to server-rendered HTML; islands is a separate opt-in mode.",
      "https://docs.rs/leptos/latest/leptos/",
      "Hydration / islands",
    ),
    routing: official(
      "leptos_router provides nested Routes and route parameters.",
      "https://book.leptos.dev/router/16_routes.html",
      "leptos_router",
    ),
    actions: official(
      "The #[server] macro generates server endpoints and browser call stubs.",
      "https://book.leptos.dev/server/25_server_functions.html",
      "server_fn",
    ),
    translations: external(
      "leptos_i18n supplies locale-aware translated messages for Leptos applications.",
      "https://docs.rs/leptos_i18n/latest/leptos_i18n/",
      "leptos_i18n",
    ),
  },
  marko: {
    scope:
      "Marko 6 documentation; @marko/run application features are identified explicitly.",
    ssr: built(
      "Marko compiles templates for server-rendered HTML.",
      "https://markojs.com/docs/explanation/streaming",
    ),
    streaming: built(
      "HTML flushes progressively around await tags; try boundaries support replacement content.",
      "https://markojs.com/docs/explanation/streaming",
    ),
    suspense: built(
      "await plus try / @placeholder coordinates async content and loading states.",
      "https://markojs.com/docs/explanation/streaming",
      "await / try",
    ),
    client: built(
      "Marko resumes interactive expressions without re-rendering templates to recreate initial state.",
      "https://markojs.com/docs/explanation/why-is-marko-fast",
      "Resumability",
    ),
    routing: official(
      "@marko/run adds file-based routing, layouts, middleware, and deployment adapters.",
      "https://markojs.com/docs/marko-run/getting-started",
      "@marko/run",
    ),
    actions: qualified(
      "@marko/run documents POST handlers and parsed form bodies; these are explicit HTTP handlers rather than generated function RPC.",
      "https://markojs.com/docs/marko-run/data-loading",
      "POST handlers",
    ),
  },
  nextjs: {
    scope: "Next.js App Router documentation, including its React integration.",
    ssr: built(
      "App Router renders Server Components and initial page HTML on the server.",
      "https://nextjs.org/docs/app/getting-started/server-and-client-components",
    ),
    streaming: built(
      "loading.js and Suspense stream HTML as route segments or components resolve.",
      "https://nextjs.org/docs/app/api-reference/file-conventions/loading",
    ),
    suspense: built(
      "React Suspense boundaries display fallback UI while App Router streams resolved content.",
      "https://nextjs.org/docs/app/api-reference/file-conventions/loading",
    ),
    client: built(
      "React hydration activates Client Components; Suspense enables selective hydration.",
      "https://nextjs.org/docs/app/api-reference/file-conventions/loading",
      "React hydration",
    ),
    routing: built(
      "App Router uses files, nested layouts, page segments, and route handlers.",
      "https://nextjs.org/docs/app/getting-started/layouts-and-pages",
    ),
    ssg: built(
      "Static export generates an HTML file per route. Server-dependent features are unavailable in a static-only deployment.",
      "https://nextjs.org/docs/app/guides/static-exports",
    ),
    actions: built(
      "Server Functions marked with use server can be called from Client Components and used as form actions.",
      "https://nextjs.org/docs/app/getting-started/mutating-data",
      "Server Functions",
    ),
    translations: qualified(
      "The official guide demonstrates app-owned dictionaries and lists external translation libraries; it does not supply a message-catalog engine.",
      "https://nextjs.org/docs/app/guides/internationalization",
      "Dictionary recipe",
    ),
    localeRouting: qualified(
      "The App Router guide uses a [lang] segment plus application proxy logic for language detection and redirects.",
      "https://nextjs.org/docs/app/guides/internationalization",
      "Routing recipe",
    ),
  },
  proa: {
    scope:
      "Published Proa documentation reviewed on the same date as other projects. Capabilities are not inferred from benchmark rank.",
    ssr: built(
      "Typed Rust templates render HTML on the server.",
      "https://proa.so/docs/core/html-rendering",
    ),
    streaming: built(
      "The streaming substrate supports in-order and out-of-order delivery through framework response adapters.",
      "https://proa.so/docs/core/streaming-ssr",
    ),
    suspense: built(
      "Suspense holds async children and fallback UI, with priority and timeout options.",
      "https://proa.so/docs/core/streaming-ssr",
    ),
    client: built(
      "RSJS islands activate immediately or through visible, idle, interaction, and media strategies.",
      "https://proa.so/docs/rsjs/hydration",
      "RSJS islands",
    ),
    routing: official(
      "The framework's route/page layer integrates request handling with Axum.",
      "https://proa.so/docs/framework/routing",
      "Framework / Axum",
    ),
    actions: qualified(
      "RSJS query/mutation helpers call explicit server URLs. The reviewed form guide uses an authored Axum POST handler, rather than a generated server-function RPC.",
      "https://proa.so/docs/rsjs/queries-mutations",
      "Explicit endpoints",
    ),
  },
  rails: {
    scope:
      "Rails documentation. Optional browser frameworks are not attributed to the server template engine.",
    ssr: built(
      "Action View renders server templates and layouts.",
      "https://guides.rubyonrails.org/layouts_and_rendering.html",
    ),
    streaming: built(
      "render stream: true streams the layout and template progressively. Middleware buffering and template constraints apply.",
      "https://api.rubyonrails.org/classes/ActionController/Streaming.html",
    ),
    routing: built(
      "The Rails router maps verbs and URLs to controller actions and resource routes.",
      "https://guides.rubyonrails.org/routing.html",
    ),
    translations: built(
      "Rails ships with the Ruby i18n gem, message lookup, interpolation, and pluralization.",
      "https://guides.rubyonrails.org/i18n.html",
    ),
    localeRouting: built(
      "The i18n guide documents locale URL parameters, route scopes, and request-scoped locale selection.",
      "https://guides.rubyonrails.org/i18n.html",
    ),
    localeFormatting: built(
      "I18n.l and locale translation data provide localized date/time formats and related helpers.",
      "https://guides.rubyonrails.org/i18n.html",
    ),
  },
  react: {
    scope:
      "React / React DOM documentation. Framework-provided features are not counted as React core.",
    ssr: built(
      "react-dom/server renders initial HTML with string or stream APIs.",
      "https://react.dev/reference/react-dom/server",
    ),
    streaming: built(
      "renderToPipeableStream and renderToReadableStream progressively produce HTML.",
      "https://react.dev/reference/react-dom/server",
    ),
    suspense: built(
      "Suspense displays a fallback until its supported async dependencies resolve; framework integration governs data loading.",
      "https://react.dev/reference/react/Suspense",
    ),
    client: built(
      "hydrateRoot attaches React behavior to existing server-rendered HTML.",
      "https://react.dev/reference/react-dom/client/hydrateRoot",
      "hydrateRoot",
    ),
    routing: external(
      "React recommends an application framework, such as React Router or Next.js, for integrated routing.",
      "https://react.dev/learn/creating-a-react-app",
      "App framework",
    ),
    ssg: external(
      "The recommended full-stack frameworks supply static-site generation; it is not a site-export workflow in React core.",
      "https://react.dev/learn/creating-a-react-app",
      "App framework",
    ),
    actions: external(
      "Next.js App Router is one implementation of React Server Functions; a hosting framework is needed for the end-to-end server transport.",
      "https://nextjs.org/docs/app/getting-started/mutating-data",
      "App framework",
    ),
    translations: external(
      "react-i18next provides message translation, pluralization, and interpolation.",
      "https://react.i18next.com/",
      "react-i18next",
    ),
  },
  svelte: {
    scope:
      "Svelte 5 documentation, with SvelteKit functionality shown as an official companion.",
    ssr: built(
      "svelte/server render produces HTML; async rendering requires the documented async configuration.",
      "https://svelte.dev/docs/svelte/svelte-server",
    ),
    streaming: qualified(
      "SvelteKit streams promises as data for client resolution. This source does not establish resolved-HTML streaming equivalent to React or Marko.",
      "https://svelte.dev/docs/kit/load#Streaming-with-promises",
      "Kit data stream",
    ),
    suspense: qualified(
      "await expressions with svelte:boundary pending UI require experimental.async in Svelte 5.",
      "https://svelte.dev/docs/svelte/await-expressions",
      "Experimental async",
    ),
    client: built(
      "Svelte supplies hydration for server-rendered components.",
      "https://svelte.dev/docs/svelte/imperative-component-api#hydrate",
      "Hydration",
    ),
    routing: official(
      "SvelteKit supplies filesystem-based page and endpoint routes.",
      "https://svelte.dev/docs/kit/routing",
      "SvelteKit",
    ),
    ssg: official(
      "SvelteKit's adapter-static prerenders the application for static hosting.",
      "https://svelte.dev/docs/kit/adapter-static",
      "SvelteKit",
    ),
    actions: official(
      "SvelteKit remote functions expose server queries, forms, and commands. Availability depends on the documented Kit configuration.",
      "https://svelte.dev/docs/kit/remote-functions",
      "SvelteKit",
    ),
    translations: external(
      "The Svelte package directory lists i18n integrations, including Paraglide JS and Wuchale.",
      "https://svelte.dev/packages",
      "i18n packages",
    ),
  },
  topcoat: {
    scope:
      "Topcoat 0.3.1 crate README and roadmap; early-stage and experimental.",
    ssr: built(
      "Async Rust view components render markup on the server.",
      topcoat,
    ),
    streaming: cell(
      "planned",
      "Streaming SSR / Suspense is an unchecked roadmap item in the reviewed version.",
      topcoat,
    ),
    suspense: cell(
      "planned",
      "Streaming SSR / Suspense is an unchecked roadmap item in the reviewed version.",
      topcoat,
    ),
    client: built(
      "Reactive Rust expressions compile to JavaScript that activates server-rendered UI; shards can replace server-rendered fragments.",
      topcoat,
      "Compiled JS",
    ),
    routing: built(
      "Pages, layouts, and API routes support manual or auto-discovered routers.",
      topcoat,
    ),
    ssg: cell(
      "planned",
      "Static export and prerendering are unchecked roadmap items in the reviewed version.",
      topcoat,
    ),
    actions: built(
      "Procedures are documented as async server functions callable from the browser.",
      topcoat,
      "Procedures",
    ),
  },
};

const templateSources = {
  askama: "https://askama.rs/en/stable/",
  sailfish: "https://docs.rs/sailfish/latest/sailfish/",
  jte: "https://jte.gg/",
  rocker: "https://github.com/fizzed/rocker",
  handlebars: "https://handlebarsjs.com/guide/",
  "go-html-template": "https://pkg.go.dev/html/template",
  jinja2: "https://jinja.palletsprojects.com/en/stable/api/",
  php: "https://www.php.net/manual/en/tutorial.php",
};
for (const [id, url] of Object.entries(templateSources)) {
  featureEvidence[id] = {
    scope:
      "Standalone templating API; adding a host framework can provide separate application features.",
    ssr: built(
      "Generates HTML from a template and supplied values on the server.",
      url,
    ),
    ...Object.fromEntries(
      [
        "client",
        "csr",
        "partialRendering",
        "routing",
        "layouts",
        "dynamicRoutes",
        "parallelRoutes",
        "interceptedRoutes",
        "prefetch",
        "redirects",
        "ssg",
        "actions",
        "apiRoutes",
        "middleware",
        "cookies",
        "localeRouting",
        "serverHosting",
        "staticHosting",
        "containers",
        "edgeHosting",
      ].map((id) => [
        id,
        cell(
          "scope",
          "This review covers the standalone template API. Application routing, client activation, site generation, and server-function transports belong to the host application or an additional framework.",
          url,
        ),
      ]),
    ),
  };
}
featureEvidence.jinja2.streaming = built(
  "Template.generate / stream emits rendered fragments; generate_async is also documented. This alone is not an out-of-order Suspense protocol.",
  "https://jinja.palletsprojects.com/en/stable/api/#jinja2.Template.generate",
);
featureEvidence.jinja2.translations = official(
  "The bundled i18n extension adds trans/gettext integration; the application supplies its translation catalogs.",
  "https://jinja.palletsprojects.com/en/stable/extensions/#i18n-extension",
  "i18n extension",
);
featureEvidence.jte.translations = qualified(
  "The official localization recipe composes an application localization helper with templates; it is not a bundled translation catalog service.",
  "https://jte.gg/localization/",
  "Localization recipe",
);
featureEvidence.php.streaming = built(
  "flush() sends buffered output through PHP's backend; web-server and proxy buffering can still prevent immediate delivery.",
  "https://www.php.net/manual/en/function.flush.php",
  "Output flushing",
);
featureEvidence.php.localeFormatting = official(
  "The intl extension exposes ICU-backed locale-aware formatters; it must be installed and enabled.",
  "https://www.php.net/manual/en/book.intl.php",
  "intl extension",
);

// Merge documentation extensions by project; existing reviewed facts stay in this registry.
for (const [id, additions] of Object.entries(expandedEvidence)) {
  if (!featureEvidence[id])
    throw new Error(`Unknown feature evidence project ${id}`);
  for (const key of Object.keys(additions)) {
    if (!features.some((feature) => feature.id === key))
      throw new Error(`Unknown capability ${key} for ${id}`);
  }
  Object.assign(featureEvidence[id], additions);
}

// Keep design assessments while adding the completed, bounded capability review.
for (const [id, additions] of Object.entries(auditedEvidence)) {
  if (!featureEvidence[id]) throw new Error(`Unknown audit project ${id}`);
  for (const [key, finding] of Object.entries(additions)) {
    if (!features.some((feature) => feature.id === key))
      throw new Error(`Unknown audit capability ${key} for ${id}`);
    featureEvidence[id][key] = { ...featureEvidence[id][key], ...finding };
  }
}
featureEvidence.php.scope =
  "Native PHP templates and runtime extensions; no PHP application framework is implied.";

Object.assign(featureEvidence, additionalEvidence);
addBackendEvidence(featureEvidence, [...catalog, ...featureProjects]);
refineReviewedFindings(featureEvidence);
addNavigationSecurityEvidence(featureEvidence);
addExpandedReview(featureEvidence);

export function featureRows(renderers) {
  return renderers.map((renderer) => {
    const evidence = featureEvidence[renderer.id];
    if (!evidence) throw new Error(`Missing feature review for ${renderer.id}`);
    return {
      id: renderer.id,
      label: renderer.label,
      kind: renderer.kind,
      logo: renderer.logo,
      color: renderer.color,
      scope: evidence.scope,
      reviewedOn,
      updatedOn: Object.values(evidence).reduce(
        (date, finding) =>
          finding?.reviewedOn > date ? finding.reviewedOn : date,
        reviewedOn,
      ),
      capabilities: Object.fromEntries(
        features.map((feature) => [
          feature.id,
          evidence[feature.id] ||
            cell(
              "unknown",
              "This capability has not been verified in this documentation review. Do not interpret this entry as a claim that the feature is absent.",
            ),
        ]),
      ),
    };
  });
}
