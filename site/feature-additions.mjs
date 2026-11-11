// Documentation review scopes are independent of benchmark admission.
import { features } from "./feature-schema.mjs";

export const featureProjects = [
  {
    id: "remix",
    colorSource: "https://remix.run",
    label: "Remix",
    language: "TypeScript",
    kind: "Application framework",
    homepage: "https://remix.run",
    color: "var(--fw-fg)",
  },
  {
    id: "tanstack-start",
    colorSource: "https://tanstack.com/brand-guide",
    label: "TanStack Start",
    language: "TypeScript",
    kind: "Application framework",
    homepage: "https://tanstack.com/start",
    color: "var(--fw-fg)",
  },
  {
    id: "solid",
    colorSource: "https://www.solidjs.com/media",
    label: "SolidJS",
    language: "JavaScript",
    kind: "UI library",
    homepage: "https://www.solidjs.com",
    color: "#2c4f7c",
  },
  {
    id: "solidstart",
    colorSource: "https://www.solidjs.com/media",
    label: "SolidStart",
    language: "TypeScript",
    kind: "Application framework",
    homepage: "https://start.solidjs.com",
    color: "#2c4f7c",
  },
  {
    id: "nuxt",
    colorSource: "https://nuxt.com/design-kit",
    label: "Nuxt",
    language: "TypeScript",
    kind: "Application framework",
    homepage: "https://nuxt.com",
    color: "#00dc82",
  },
  {
    id: "sveltekit",
    colorSource: "https://svelte.dev",
    label: "SvelteKit",
    language: "TypeScript",
    kind: "Application framework",
    homepage: "https://svelte.dev/docs/kit",
    color: "#ff3e00",
  },
  {
    id: "laravel",
    colorSource: "https://laravel.com/art",
    label: "Laravel",
    language: "PHP",
    kind: "Application framework",
    homepage: "https://laravel.com",
    color: "#ff2d20",
  },
].map((project) => ({
  ...project,
  status: "feature-only",
  logo: `logos/${project.id}.svg`,
}));

const bases = {
  remix: "https://docs.remix.run/",
  "tanstack-start": "https://tanstack.com/start/latest/docs/framework/react/",
  solid: "https://docs.solidjs.com/",
  solidstart: "https://docs.solidjs.com/solid-start/v2/",
  nuxt: "https://nuxt.com/docs/4.x/",
  sveltekit: "https://svelte.dev/docs/kit/",
  laravel: "https://laravel.com/framework/docs/13.x/",
};
const scopes = {
  remix:
    "Remix 3.1 documentation and package APIs. This is the new Remix component/Fetch architecture, not React-based Remix v2 or React Router framework mode.",
  "tanstack-start":
    "TanStack Start v1 React documentation, with TanStack Router. Experimental Server Components are qualified separately; this is not the Solid adapter review.",
  solid:
    "Solid v1 UI library with explicitly named Solid Router and Solid Meta companions. SolidStart application features are reviewed in their own row.",
  solidstart:
    "SolidStart v2 with Solid v1, Solid Router v1 and Vite v8. Nitro and other deployment plugins are named separately.",
  nuxt: "Nuxt 4.x with Vue 3, Nitro and explicitly named companion modules. Experimental APIs and provider-specific cache behavior are qualified.",
  sveltekit:
    "Current SvelteKit documentation with Svelte 5. Remote functions and asynchronous Svelte rendering retain their documented experimental qualifications.",
  laravel:
    "Laravel 13.x with Blade. Livewire, Inertia, Laravel Head and other companion packages are identified separately; native PHP has a separate row.",
};
// An unestablished capability is a bounded documentation finding, never an
// assertion that application code or an unreviewed ecosystem package cannot do it.
const reviewPages = {
  remix: {
    rendering: "rendering-ui/",
    routing: "routing-and-controllers/",
    data: "data-and-validation/",
    server: "request-handling/",
    styling: "rendering-ui/",
    assets: "files-and-assets/",
    metadata: "rendering-ui/",
    content: "files-and-assets/",
    i18n: "rendering-ui/",
    security: "auth-sessions-security/",
    tooling: "cli-and-tooling/",
    testing: "testing/",
    deployment: "production/",
    database: "api/data-table/",
    backend: "files-and-assets/",
  },
  "tanstack-start": {
    rendering: "guide/selective-ssr",
    routing: "guide/routing",
    data: "guide/server-functions",
    server: "guide/server-routes",
    styling: "overview",
    assets: "guide/seo",
    metadata: "guide/seo",
    content: "guide/seo",
    i18n: "guide/routing",
    security: "guide/authentication",
    tooling: "overview",
    testing: "guide/observability",
    deployment: "overview",
    database: "guide/databases",
    backend: "guide/server-functions",
  },
  solid: {
    rendering: "reference/rendering/render-to-stream",
    routing: "solid-router",
    data: "reference/basic-reactivity/create-resource",
    server: "solid-router",
    styling: "guides/styling-components/css-modules",
    assets: "guides/styling-components/css-modules",
    metadata: "solid-meta",
    content: "solid-start/v2",
    i18n: "solid-start/v2",
    security: "solid-start/v2",
    tooling: "configuration/typescript",
    testing: "guides/testing",
    deployment: "solid-start/v2",
    database: "solid-start/v2",
    backend: "solid-start/v2",
  },
  solidstart: {
    rendering: "building-your-application/data-fetching",
    routing: "building-your-application/routing",
    data: "building-your-application/data-fetching",
    server: "building-your-application/api-routes",
    styling: "building-your-application/css-and-styling",
    assets: "building-your-application/static-assets",
    metadata: "building-your-application/head-and-metadata",
    content: "building-your-application/routing",
    i18n: "building-your-application/routing",
    security: "guides/security",
    tooling: "guides/deployment-plugins",
    testing: "guides/deployment-plugins",
    deployment: "guides/deployment-plugins",
    database: "building-your-application/data-fetching",
    backend: "guides/background-tasks",
  },
  nuxt: {
    rendering: "guide/concepts/rendering",
    routing: "getting-started/routing",
    data: "getting-started/data-fetching",
    server: "guide/directory-structure/server",
    styling: "getting-started/styling",
    assets: "getting-started/styling",
    metadata: "getting-started/seo-meta",
    content: "getting-started/introduction",
    i18n: "getting-started/routing",
    security: "guide/directory-structure/server",
    tooling: "getting-started/introduction",
    testing: "getting-started/testing",
    deployment: "getting-started/deployment",
    database: "guide/directory-structure/server",
    backend: "guide/directory-structure/server",
  },
  sveltekit: {
    rendering: "page-options",
    routing: "routing",
    data: "load",
    server: "form-actions",
    styling: "integrations",
    assets: "images",
    metadata: "seo",
    content: "integrations",
    i18n: "hooks",
    security: "auth",
    tooling: "introduction",
    testing: "observability",
    deployment: "adapter-node",
    database: "hooks",
    backend: "routing",
  },
  laravel: {
    rendering: "blade",
    routing: "routing",
    data: "cache",
    server: "responses",
    styling: "vite",
    assets: "vite",
    metadata: "head",
    content: "blade",
    i18n: "localization",
    security: "authentication",
    tooling: "vite",
    testing: "testing",
    deployment: "deployment",
    database: "database",
    backend: "queues",
  },
};
export const additionalEvidence = Object.fromEntries(
  featureProjects.map(({ id }) => [
    id,
    {
      scope: scopes[id],
      ...Object.fromEntries(
        features.map((feature) => [
          feature.id,
          {
            status: "undocumented",
            note: `Not established in the reviewed ${featureProjects.find((project) => project.id === id).label} ${feature.group} guide. External integrations or application code may provide this behavior.`,
            url: bases[id] + reviewPages[id][feature.group],
          },
        ]),
      ),
    },
  ]),
);
function set(id, ids, status, path, note, label) {
  const url = path.startsWith("https:") ? path : bases[id] + path;
  for (const key of ids.split(" ")) {
    if (!features.some((feature) => feature.id === key))
      throw new Error(`Unknown capability ${key}`);
    additionalEvidence[id][key] = {
      status,
      note,
      url,
      ...(label ? { label } : {}),
    };
  }
}

set(
  "remix",
  "ssr client csr",
  "native",
  "api/component/",
  "The closure-based component runtime renders server HTML, selectively hydrates clientEntry components, and can create browser roots. It does not use React.",
);
set(
  "remix",
  "streaming suspense",
  "native",
  "streaming-ui-with-frames/",
  "Frame can stream fallback HTML first and reconcile a route-owned HTML region when it resolves. Frames can also reload through separate browser requests; components themselves are synchronous.",
  "Streaming Frames",
);
set(
  "remix",
  "serverOnly",
  "native",
  "rendering-ui/",
  "Only explicitly declared client entries hydrate; ordinary server component code need not become a browser entry.",
);
set(
  "remix",
  "routing dynamicRoutes redirects apiRoutes middleware",
  "native",
  "request-handling/",
  "Typed routes and Fetch controllers match URLs, handle HTTP methods, compose middleware and return standard Responses including redirects.",
);
set(
  "remix",
  "layouts",
  "partial",
  "rendering-ui/",
  "Components share a Document shell and children. This is explicit composition, not an established filesystem layout hierarchy.",
  "Explicit composition",
);
set(
  "remix",
  "prefetch",
  "native",
  "api/component/",
  "The link mixin supports navigation prefetching; frame navigation reconciles route HTML.",
);
set(
  "remix",
  "serverData",
  "native",
  "data-and-validation/",
  "Route actions load and validate data before passing props into synchronous components.",
);
set(
  "remix",
  "clientData",
  "partial",
  "streaming-ui-with-frames/",
  "Named Frames reload and reconcile server HTML, preserving matching client state. This is not an application query cache.",
  "Frame reloads",
);
set(
  "remix",
  "actions",
  "partial",
  "forms-and-mutations/",
  "Controller actions handle named HTTP routes and enhanced forms. A generated arbitrary function-call RPC boundary is not established.",
  "Controller actions",
);
set(
  "remix",
  "forms",
  "native",
  "forms-and-mutations/",
  "Route form helpers, form-data middleware and data-schema validation support ordinary and enhanced submissions.",
);
set(
  "remix",
  "cookies auth csrf",
  "native",
  "auth-sessions-security/",
  "Cookie/session, authentication and CSRF middleware are provided as Remix modules; applications must configure stores, strategies and protection on their routes. The narrative chapter is unfinished; linked package APIs are the authority.",
);
set(
  "remix",
  "scopedCss cssInJs",
  "native",
  "api/component/",
  "The css mixin supplies component-scoped styles, nested selectors, dynamic values and cascade layers.",
);
set(
  "remix",
  "staticAssets hmr",
  "native",
  "api/assets/",
  "The asset server compiles browser source on demand, exposes controlled files/packages, supports fingerprinting and live code updates.",
);
set(
  "remix",
  "images",
  "community",
  "api/assets/",
  "The documented transform pipeline uses optional Sharp for image resizing/encoding; Sharp is installed separately.",
  "Sharp transforms",
);
set(
  "remix",
  "fonts",
  "partial",
  "files-and-assets/",
  "Font files can be served and preloaded through asset URLs. Automatic subsetting and fallback metrics are not established.",
  "Asset files / preloads",
);
set(
  "remix",
  "metadata dynamicMetadata",
  "partial",
  "rendering-ui/",
  "An application-owned Document component receives title/data and authors head tags. No structured metadata field-merging registry is established.",
  "Document props",
);
set(
  "remix",
  "robots",
  "partial",
  "files-and-assets/",
  "staticFiles serves an authored robots.txt; directive generation is application-owned.",
  "Static file",
);
set(
  "remix",
  "types cli",
  "native",
  "cli-and-tooling/",
  "Typed APIs and remix commands support project development, asset inspection and database lifecycle operations. Compilation does not replace TypeScript type checking.",
);
set(
  "remix",
  "unitTests",
  "native",
  "testing/",
  "Remix's test tooling exercises Fetch controllers, components and application behavior; the reviewed guide links runnable package examples.",
);
set(
  "remix",
  "serverHosting",
  "native",
  "production/",
  "The documented Node Fetch adapter serves router.fetch. The production chapter is unfinished, so deployment configuration and operations remain application-owned.",
);
set(
  "remix",
  "orm migrations transactions",
  "native",
  "api/data-table/",
  "data-table supplies typed relational queries, transactional operations, and journaled up/down SQL migrations. Database drivers are separate dependencies.",
  "data-table",
);
set(
  "remix",
  "uploads",
  "native",
  "files-and-assets/",
  "Multipart parsing, streaming uploads, size limits and file-storage APIs include local and S3-compatible storage.",
);
set(
  "remix",
  "e2eTests",
  "native",
  "testing/",
  "remix/test has an e2e runner and server lifecycle helpers driven through Playwright; browser component tests run in isolated browser frames.",
);
set(
  "remix",
  "csrf",
  "native",
  "api/middleware/csrf/",
  "csrf middleware supports token sources and origin validation. Register it on the relevant routes and follow the cookie/session caveats.",
);
set(
  "remix",
  "auth",
  "native",
  "api/auth/",
  "Authentication primitives include credentials, external providers and extensible strategies. Account persistence and authorization remain application policy.",
);
set(
  "remix",
  "layouts",
  "native",
  "rendering-ui/",
  "Shared Document/layout components receive nested children explicitly. This satisfies layout composition without a filesystem-selected layout convention.",
  "Explicit layouts",
);

set(
  "solid",
  "ssr",
  "native",
  "reference/rendering/render-to-string",
  "renderToString produces synchronous HTML and hydration metadata.",
);
set(
  "solid",
  "streaming suspense",
  "native",
  "reference/rendering/render-to-stream",
  "renderToStream integrates Suspense fallback boundaries and streams their resolved content; the host must preserve flushing.",
);
set(
  "solid",
  "client csr",
  "native",
  "reference/rendering/hydrate",
  "hydrate attaches reactive behavior to SSR HTML; render creates a client application root.",
);
set(
  "solid",
  "serverData clientData",
  "native",
  "reference/basic-reactivity/create-resource",
  "createResource tracks asynchronous reads with loading/error state and refetch/mutate controls; transport and persistent caching are separate.",
);
set(
  "solid",
  "routing layouts dynamicRoutes prefetch redirects requestDedupe invalidation",
  "official",
  "solid-router",
  "Solid Router provides nested routes, parameters, navigation/preload helpers, cached queries and query revalidation.",
  "Solid Router",
);
set(
  "solid",
  "metadata dynamicMetadata",
  "official",
  "https://docs.solidjs.com/solid-start/v2/building-your-application/head-and-metadata",
  "Solid Meta provides reactive Title, Meta and Link components under MetaProvider, including server collection and client navigation updates.",
  "Solid Meta",
);
set(
  "solid",
  "metadataInheritance metadataOverrides",
  "partial",
  "https://docs.solidjs.com/solid-start/v2/building-your-application/head-and-metadata",
  "MetaProvider composes descendant head components. The reviewed guide does not establish a general nested object merge/reset contract for inherited SEO fields.",
  "Component composition",
);
set(
  "solid",
  "cssModules scopedCss",
  "community",
  "guides/styling-components/css-modules",
  "The documented Vite/CSS Modules setup supplies local class names; Solid's runtime does not compile CSS itself.",
  "CSS Modules / Vite",
);
set(
  "solid",
  "tailwind",
  "community",
  "guides/styling-components/tailwind",
  "The guide configures the separately installed Tailwind compiler.",
  "Tailwind",
);
set(
  "solid",
  "cssInJs",
  "community",
  "guides/styling-components/macaron",
  "Macaron is a separately installed compile-time CSS-in-JS integration.",
  "Macaron",
);
set(
  "solid",
  "translations",
  "community",
  "https://primitives.solidjs.community/package/i18n",
  "Solid Primitives supplies reactive dictionaries and translation helpers; application code supplies locale policy.",
  "Solid Primitives",
);
set(
  "solid",
  "types",
  "native",
  "configuration/typescript",
  "Solid supplies TypeScript declarations and JSX typing; run the TypeScript compiler separately from bundling.",
);
set(
  "solid",
  "environment",
  "partial",
  "configuration/environment-variables",
  "Build-tool environment conventions determine browser exposure. They do not create a server application boundary on their own.",
  "Build-tool boundary",
);
set(
  "solid",
  "unitTests e2eTests",
  "community",
  "guides/testing",
  "The guide documents Vitest with Solid Testing Library and Playwright for browser workflows; these are external test tools.",
  "Vitest / Playwright",
);
set(
  "solid",
  "serverOnly partialRendering ssg apiRoutes actions middleware cookies serverHosting containers edgeHosting orm migrations transactions jobs mail uploads realtime",
  "scope",
  "solid-start/v2",
  "These application/server responsibilities are outside the standalone Solid UI library. SolidStart and host libraries are reviewed separately.",
);
set(
  "solid",
  "staticHosting",
  "partial",
  "solid-start/v2",
  "A browser build can be served as static files through its build tool. This does not provide request-time SSR or a static page-generation API.",
  "Client build",
);

const start = "solidstart";
for (const key of [
  "ssr",
  "streaming",
  "suspense",
  "client",
  "csr",
  "unitTests",
  "e2eTests",
  "translations",
])
  additionalEvidence[start][key] = { ...additionalEvidence.solid[key] };
set(
  start,
  "routing layouts dynamicRoutes prefetch redirects",
  "native",
  "building-your-application/routing",
  "FileRoutes maps page files and dynamic segments; Solid Router supplies nested layout/navigation behavior. SolidStart v2 also supports a TanStack Router integration.",
);
set(
  start,
  "serverData clientData requestDedupe",
  "official",
  "building-your-application/data-fetching",
  "Solid Router query/createAsync loads cached data and preloads route reads; use server keeps the body on the server.",
  "Solid Router queries",
);
set(
  start,
  "invalidation",
  "official",
  "building-your-application/data-mutation",
  "Solid Router actions revalidate queries and expose submission state.",
  "Solid Router actions",
);
set(
  start,
  "serverOnly actions",
  "native",
  "building-your-application/data-fetching",
  "The use server directive extracts server functions and provides a browser-callable transport; authorization is still checked inside protected functions.",
);
set(
  start,
  "forms",
  "official",
  "building-your-application/data-mutation",
  "Router actions accept form data and expose pending/error state. Validation is authored in the action or supplied by a validation library.",
  "Solid Router actions",
);
set(
  start,
  "apiRoutes",
  "native",
  "building-your-application/api-routes",
  "Route files export HTTP method handlers returning Responses, with typed request/route context.",
);
set(
  start,
  "middleware",
  "native",
  "advanced/middleware",
  "Configured H3 middleware wraps request handling and exposes request-scoped locals.",
);
set(
  start,
  "cookies",
  "native",
  "advanced/session",
  "SolidStart exposes H3 cookie helpers and encrypted cookie-session operations; secrets and cookie flags require configuration.",
);
set(
  start,
  "ssg staticHosting",
  "community",
  "building-your-application/route-prerendering",
  "The documented Nitro plugin prerenders listed or crawled routes into static output. Server functions still require a server.",
  "Nitro prerendering",
);
set(
  start,
  "cssModules scopedCss",
  "native",
  "building-your-application/css-and-styling",
  "Vite integration supports module.css files and scoped imported class names, including SSR CSS deduplication.",
);
set(
  start,
  "tailwind cssInJs",
  "community",
  "building-your-application/css-and-styling",
  "The styling guide integrates separate Tailwind and CSS-in-JS packages; they are not SolidStart-owned compilers.",
);
set(
  start,
  "staticAssets",
  "native",
  "building-your-application/static-assets",
  "Public files retain stable URLs; imported assets receive Vite-generated hashed filenames.",
);
for (const key of [
  "metadata",
  "dynamicMetadata",
  "metadataInheritance",
  "metadataOverrides",
])
  additionalEvidence[start][key] = { ...additionalEvidence.solid[key] };
set(
  start,
  "auth",
  "partial",
  "advanced/auth",
  "The guide implements application-owned session/user checks in queries and server functions. A bundled account/provider service is not established.",
  "Session recipe",
);
set(
  start,
  "csp csrf",
  "partial",
  "guides/security",
  "The guide shows app-authored nonce/CSP middleware and CSRF checks. These must be installed and configured; the recipe is not automatic global enforcement.",
  "Security middleware recipe",
);
set(
  start,
  "types hmr",
  "native",
  "building-your-application/css-and-styling",
  "SolidStart's TypeScript/Vite setup supplies typed application APIs and development hot updates.",
);
set(
  start,
  "serverHosting containers edgeHosting",
  "community",
  "guides/deployment-plugins",
  "Vite deployment plugins such as Nitro, Cloudflare and Netlify determine runtime output. Target compatibility depends on the plugin and server dependencies.",
  "Deployment plugins",
);
set(
  start,
  "jobs",
  "partial",
  "guides/background-tasks",
  "Nitro tasks can run or be scheduled outside request handling. The documented task runner is not a durable queue with retries/acknowledgement.",
  "Nitro tasks",
);
set(
  start,
  "realtime",
  "community",
  "advanced/websocket",
  "The documented Nitro v3 plugin enables cross-platform WebSocket handlers. Applications own authorization and pub/sub topology.",
  "Nitro WebSockets",
);
set(
  start,
  "cli",
  "official",
  "getting-started",
  "The Solid scaffolding tool creates SolidStart templates; project scripts run Vite development and production builds.",
  "Create Solid",
);
set(
  start,
  "environment",
  "native",
  "advanced/session",
  "Server functions can read private runtime session secrets. Keep those values in server-only code and out of returned props/results.",
);

const ts = "tanstack-start";
set(
  ts,
  "ssr streaming suspense client",
  "native",
  "overview",
  "Start integrates React SSR, streaming, hydration and Suspense with its router. This does not imply experimental React Server Components are enabled.",
);
set(
  ts,
  "csr",
  "native",
  "guide/selective-ssr",
  "Route-level ssr:false disables server rendering; normal client navigation still loads and renders through the router.",
);
set(
  ts,
  "serverOnly",
  "partial",
  "guide/server-components",
  "Server Components require an explicit experimental RSC plugin setup. Ordinary server functions are supported without enabling RSC.",
  "Experimental RSC",
);
set(
  ts,
  "routing layouts dynamicRoutes prefetch redirects",
  "native",
  "guide/routing",
  "Start integrates TanStack Router's nested routes/layouts, parameters, navigation and loader prefetching.",
);
set(
  ts,
  "ssg staticHosting",
  "native",
  "guide/static-prerendering",
  "The build plugin can crawl/enumerate routes and generate static HTML. Dynamic server functions are unavailable on static-only hosting.",
);
set(
  ts,
  "serverData actions",
  "native",
  "guide/server-functions",
  "createServerFn provides typed server handlers callable from route loaders and clients, with middleware and input validation.",
);
set(
  ts,
  "apiRoutes uploads",
  "native",
  "guide/server-routes",
  "Server routes handle HTTP methods and standard Request/Response bodies, including multipart data. Durable file storage is application/provider-owned.",
);
set(
  ts,
  "uploads",
  "partial",
  "guide/server-routes",
  "Routes can read Request.formData and receive uploads. A framework storage lifecycle or upload service is not established.",
  "Multipart endpoints",
);
set(
  ts,
  "middleware",
  "native",
  "guide/middleware",
  "Composable request and server-function middleware supports shared checks and typed context.",
);
set(
  ts,
  "forms",
  "native",
  "guide/server-functions",
  "Server functions accept form data and input validation, with ordinary form submission as a documented transport.",
);
set(
  ts,
  "csrf",
  "native",
  "guide/server-functions",
  "createCsrfMiddleware enforces browser-origin checks for server functions. It is automatic without a custom src/start.ts; custom start configuration must register it explicitly.",
);
set(
  ts,
  "auth",
  "community",
  "guide/authentication",
  "The guide integrates named providers/libraries such as Better Auth, Clerk and WorkOS; applications choose and configure one.",
  "Auth integration",
);
set(
  ts,
  "environment",
  "native",
  "guide/environment-variables",
  "Server/client environment boundaries and runtime-aware per-request secret reads are documented; returned values can still expose secrets.",
);
set(
  ts,
  "metadata dynamicMetadata",
  "native",
  "guide/seo",
  "A route head function returns titles, metadata and links and can read loader data; HeadContent renders matched-route head output.",
);
set(
  ts,
  "sitemaps",
  "native",
  "guide/seo",
  "Build-plugin sitemap generation integrates with prerender crawling and an explicit canonical host.",
);
set(
  ts,
  "robots",
  "partial",
  "guide/seo",
  "The SEO guide publishes an application-owned robots.txt. It does not establish a typed robots directive generator.",
  "Authored robots.txt",
);
set(
  ts,
  "types hmr cli",
  "native",
  "overview",
  "TypeScript routes/server functions and the Vite/Rsbuild workflow support typed application development and hot updates.",
);
set(
  ts,
  "observability",
  "community",
  "guide/observability",
  "The guide documents Sentry instrumentation; request middleware can also add app-owned logging.",
  "Sentry",
);
set(
  ts,
  "orm migrations transactions",
  "community",
  "guide/databases",
  "The database guide points to external libraries such as Drizzle and Prisma. Their query, migration and transaction APIs belong to those libraries.",
  "Drizzle / Prisma",
);
set(
  ts,
  "serverHosting edgeHosting",
  "native",
  "overview",
  "The overview documents deployment to server and worker runtimes; runtime-specific dependencies must match the target.",
);
set(
  ts,
  "clientData requestDedupe invalidation",
  "native",
  "https://tanstack.com/router/latest/docs/framework/react/guide/data-loading",
  "Router loaders cache and deduplicate reads, preload destinations and invalidate route data. The route cache is coarser than TanStack Query and is not a durable server cache.",
);
set(
  ts,
  "cookies",
  "native",
  "guide/authentication-server-primitives",
  "Request-scoped getCookie/setCookie/deleteCookie helpers support session-token cookies. Identity storage, lookup and revocation are application/auth-library responsibilities.",
);
set(
  ts,
  "metadataInheritance metadataOverrides",
  "native",
  "https://tanstack.com/router/latest/docs/framework/react/guide/document-head-management",
  "Nested-route head entries deduplicate titles and meta tags by semantic name/property; the last/deepest matching tag wins. This is tag-level composition, not recursive SEO-object merging.",
);
set(
  ts,
  "titleTemplates",
  "partial",
  "https://tanstack.com/router/latest/docs/framework/react/guide/document-head-management",
  "Titles can be composed from matched route data. An inherited template/absolute-reset field API is not established; composition is application code.",
  "Route-data composition",
);
set(
  ts,
  "tailwind",
  "community",
  "guide/tailwind-integration",
  "The guide integrates Tailwind's external build plugin and generated stylesheet.",
  "Tailwind",
);
set(
  ts,
  "errorHandling",
  "native",
  "guide/error-boundaries",
  "Router error components and default/per-route boundaries render fallback UI for failed routes.",
);
additionalEvidence[ts].metadata.assessment = {
  summary:
    "Typed route head output with explicit nested-route deduplication and loader-data access.",
  strengths: [
    "A child title or same-name/property meta tag replaces the inherited entry.",
    "Head output is loaded and unloaded with route visibility.",
  ],
  tradeoffs: [
    "Composition happens at tag level, rather than merging structured SEO objects.",
    "Title templates and more complex inherited arrays require application composition.",
  ],
};

const nuxt = "nuxt";
set(
  nuxt,
  "ssr client csr ssg partialRendering",
  "native",
  "guide/concepts/rendering",
  "Nuxt supports universal rendering/hydration, client-only routes and prerendered routes. Hybrid route rules choose behavior per path; this is not an assertion of Next-style partial prerendering.",
);
set(
  nuxt,
  "partialRendering",
  "partial",
  "guide/concepts/rendering",
  "Hybrid rules mix prerendered, server-rendered and client-rendered routes. That does not establish a cached static shell plus dynamic holes within the same route.",
  "Hybrid routes",
);
set(
  nuxt,
  "streaming",
  "partial",
  "guide/going-further/experimental-features",
  "ssrStreaming is an experimental option in Nuxt 4.x. Default universal rendering must not be represented as production HTML streaming.",
  "Experimental SSR streaming",
);
set(
  nuxt,
  "suspense",
  "partial",
  "getting-started/data-fetching",
  "Nuxt uses Vue Suspense to coordinate async page data. Vue still marks Suspense experimental; data waiting alone is not out-of-order HTML delivery.",
  "Vue Suspense",
);
set(
  nuxt,
  "routing layouts dynamicRoutes prefetch redirects",
  "native",
  "getting-started/routing",
  "File-system pages, nested route composition, middleware and NuxtLink navigation/prefetching form the routing workflow.",
);
set(
  nuxt,
  "serverData clientData requestDedupe invalidation",
  "native",
  "getting-started/data-fetching",
  "useAsyncData/useFetch share keyed state, transfer SSR payloads, deduplicate pending reads and support refresh/clear operations. This is distinct from a durable server cache.",
);
set(
  nuxt,
  "persistentCache isr",
  "native",
  "guide/concepts/rendering",
  "Route rules support SWR and ISR caching. ISR behavior and durable storage depend on the Nitro hosting preset/provider.",
);
set(
  nuxt,
  "apiRoutes middleware cookies",
  "native",
  "guide/directory-structure/server",
  "Nitro registers server endpoints/middleware and exposes H3 request, cookie and response utilities.",
);
set(
  nuxt,
  "forms",
  "partial",
  "guide/directory-structure/server",
  "Endpoints can read/validate request bodies, but a unified typed form-action and field-error workflow is not established by this guide.",
  "Endpoint validation",
);
set(
  nuxt,
  "cssModules scopedCss",
  "native",
  "getting-started/styling",
  "Vue single-file component scoped styles and CSS Modules are supported by the build pipeline.",
);
set(
  nuxt,
  "tailwind",
  "community",
  "getting-started/styling",
  "The styling guide integrates Tailwind as an external CSS compiler.",
  "Tailwind",
);
for (const [key, url, label, note] of [
  [
    "images",
    "https://image.nuxt.com/",
    "Nuxt Image",
    "NuxtImg/NuxtPicture generate provider-backed responsive sizes and formats; install the companion module.",
  ],
  [
    "fonts",
    "https://fonts.nuxt.com/",
    "Nuxt Fonts",
    "The companion module self-hosts fonts and generates fallback metrics; provider/configuration determines the output.",
  ],
  [
    "scripts",
    "https://scripts.nuxt.com/",
    "Nuxt Scripts",
    "The companion module provides deferred third-party script loading and trigger strategies.",
  ],
  [
    "markdown",
    "https://content.nuxt.com/",
    "Nuxt Content",
    "The companion module loads Markdown and other content files with typed queries.",
  ],
  [
    "collections",
    "https://content.nuxt.com/",
    "Nuxt Content",
    "Content collections provide schemas, querying and structured content integration.",
  ],
  [
    "translations",
    "https://i18n.nuxtjs.org/",
    "Nuxt i18n",
    "The companion module integrates Vue I18n catalogs, lazy messages and locale routing.",
  ],
  [
    "localeRouting",
    "https://i18n.nuxtjs.org/",
    "Nuxt i18n",
    "Locale-aware route generation, URL prefixes and SEO helpers are supplied by the i18n module.",
  ],
  [
    "localeFormatting",
    "https://i18n.nuxtjs.org/",
    "Nuxt i18n",
    "The module's Vue I18n integration supplies locale-sensitive number and date formatting.",
  ],
])
  set(nuxt, key, "official", url, note, label);
set(
  nuxt,
  "metadata dynamicMetadata titleTemplates",
  "native",
  "getting-started/seo-meta",
  "useHead/useSeoMeta provide typed reactive tags and titleTemplate composition; app.head is static configuration.",
);
set(
  nuxt,
  "metadataInheritance metadataOverrides",
  "native",
  "https://unhead.unjs.io/docs/head/guides/core-concepts/handling-duplicates",
  "Unhead resolves duplicate semantic identities and keys across registrations; later/page entries replace matching defaults. Explicit keys and removal behavior differ from nested metadata-object merging.",
);
set(
  nuxt,
  "socialImages sitemaps robots",
  "community",
  "https://nuxtseo.com/",
  "Nuxt SEO's separately maintained OG Image, Sitemap and Robots modules add generation APIs. These are not bundled Nuxt core features.",
  "Nuxt SEO modules",
);
set(
  nuxt,
  "unitTests e2eTests",
  "official",
  "getting-started/testing",
  "@nuxt/test-utils supplies Nuxt-aware Vitest/browser helpers, with Playwright integration.",
  "Nuxt Test Utils",
);
set(
  nuxt,
  "types hmr cli",
  "native",
  "getting-started/introduction",
  "Nuxt generates TypeScript types and provides a project CLI and Vite hot updates.",
);
set(
  nuxt,
  "bundleAnalysis",
  "partial",
  "api/commands/analyze",
  "nuxt analyze builds and serves production dependency analysis; the command is explicitly experimental.",
  "Experimental analyzer",
);
set(
  nuxt,
  "serverHosting staticHosting edgeHosting",
  "native",
  "getting-started/deployment",
  "Nitro presets target Node, serverless and worker deployments; prerendered output can be static. Target capabilities and caches vary.",
);
set(
  nuxt,
  "jobs",
  "partial",
  "https://nitro.build/guide/tasks",
  "Nitro tasks are opt-in/experimental scheduled or programmatic work. The documented runner is not a durable queue with retries.",
  "Experimental Nitro tasks",
);
set(
  nuxt,
  "auth",
  "official",
  "guide/recipes/sessions-and-authentication",
  "The documented Nuxt Auth Utils companion supplies encrypted sessions and auth helpers. Applications still choose persistence and authorization policy.",
  "Nuxt Auth Utils",
);
additionalEvidence.nuxt.metadata.assessment = {
  summary:
    "A reactive, typed head API powered by Unhead, with semantic tag deduplication and title templates.",
  strengths: [
    "Page registrations can replace matching defaults without copying every tag.",
    "useSeoMeta types common SEO fields while useHead supports general head elements.",
  ],
  tradeoffs: [
    "app.head is static; reactive values belong in composables.",
    "Unhead tag identity/key rules differ from a nested metadata-object merge contract.",
  ],
};

const kit = "sveltekit";
set(
  kit,
  "ssr client csr ssg",
  "native",
  "page-options",
  "Page/layout options control SSR, hydration, client routing and prerendering independently.",
);
set(
  kit,
  "streaming",
  "partial",
  "load",
  "Server load promises stream data for browser resolution. This does not establish resolved HTML streaming equivalent to React/Marko.",
  "Deferred data stream",
);
set(
  kit,
  "suspense",
  "partial",
  "remote-functions",
  "Async component rendering uses experimental Svelte await support; remote functions are also marked experimental.",
  "Experimental async rendering",
);
set(
  kit,
  "serverOnly environment",
  "native",
  "server-only-modules",
  "Server-only files/private environment imports are rejected when they leak into browser import graphs. Serialized responses still require care.",
);
set(
  kit,
  "routing layouts dynamicRoutes apiRoutes cookies",
  "native",
  "routing",
  "File-based page/layout and HTTP-method endpoint modules expose route params and request cookie helpers.",
);
set(
  kit,
  "prefetch",
  "native",
  "link-options",
  "data-sveltekit-preload-data/code supports hover/tap/viewport navigation preloading.",
);
set(
  kit,
  "redirects serverData clientData invalidation",
  "native",
  "load",
  "Server/universal load functions supply route data; dependency tracking and invalidation rerun reads, and redirect responses are documented.",
);
set(
  kit,
  "requestDedupe",
  "partial",
  "load",
  "Server fetch responses can be captured for hydration reuse. This is not a general cache for equivalent arbitrary server loaders.",
  "Hydration fetch reuse",
);
set(
  kit,
  "persistentCache",
  "partial",
  "load",
  "setHeaders controls HTTP cache policy at the hosting layer; a general durable data cache is not supplied.",
  "HTTP cache policy",
);
set(
  kit,
  "forms",
  "native",
  "form-actions",
  "Page server actions accept normal form POSTs, validation failures and progressively enhanced submission without requiring JS.",
);
set(
  kit,
  "actions",
  "partial",
  "remote-functions",
  "query/form/command remote functions provide typed server calls but are explicitly experimental and opt-in.",
  "Experimental remote functions",
);
set(
  kit,
  "middleware",
  "native",
  "hooks",
  "handle/handleFetch and universal/client hooks customize request behavior and shared context.",
);
set(
  kit,
  "metadata dynamicMetadata",
  "partial",
  "seo",
  "svelte:head emits data-driven title/meta markup. Applications own deduplication/composition rather than a structured metadata object registry.",
  "Head elements",
);
set(
  kit,
  "sitemaps robots",
  "partial",
  "seo",
  "The SEO workflow uses an application-owned sitemap endpoint and static crawler files; URL enumeration and directive contents are authored by the app.",
  "Endpoint / static file",
);
set(
  kit,
  "images",
  "official",
  "images",
  "@sveltejs/enhanced-img adds build-time image transformations for local assets.",
  "Enhanced images",
);
set(
  kit,
  "types hmr cli",
  "native",
  "introduction",
  "SvelteKit supplies typed route tooling and the sv/Vite development workflow.",
);
set(
  kit,
  "auth",
  "community",
  "auth",
  "The auth guide points to external libraries and explains session/token policy; authentication is not a bundled account system.",
  "Auth integration",
);
set(
  kit,
  "observability",
  "native",
  "observability",
  "Optional OpenTelemetry spans cover hooks, loads, endpoints, actions and remote functions; exporters must be configured separately.",
);
set(
  kit,
  "errorHandling",
  "native",
  "errors",
  "Page/layout error rendering and handleError hooks distinguish expected HTTP failures from unexpected application errors.",
);
set(
  kit,
  "serverHosting containers",
  "official",
  "adapter-node",
  "The official Node adapter produces a standalone server; the guide documents deployment settings and container integration.",
  "Node adapter",
);
set(
  kit,
  "staticHosting",
  "official",
  "adapter-static",
  "The static adapter exports prerendered routes; dynamic endpoints/server actions require another host.",
  "Static adapter",
);
set(
  kit,
  "edgeHosting",
  "official",
  "adapter-cloudflare",
  "The Cloudflare adapter targets Workers/Pages with platform bindings and documented restrictions.",
  "Cloudflare adapter",
);
set(
  kit,
  "scopedCss",
  "native",
  "https://svelte.dev/docs/svelte/scoped-styles",
  "Svelte compiles component style selectors with a generated scope class and scopes keyframes.",
);
set(
  kit,
  "tailwind markdown unitTests e2eTests",
  "official",
  "https://svelte.dev/docs/cli/sv-add",
  "Official sv add integrations configure Tailwind, mdsvex, Vitest and Playwright respectively. The compilers/runners are external packages.",
  "sv add integration",
);
set(
  kit,
  "cssModules",
  "community",
  "integrations",
  "The Vite build can import CSS Modules; Svelte component-local styles use its own scoped-style compiler.",
  "Vite CSS Modules",
);
additionalEvidence.sveltekit.metadata.assessment = {
  summary:
    "Reactive head elements with direct markup control, rather than a structured SEO-field registry.",
  strengths: [
    "Head values can use the same loaded data as the page.",
    "The compiler integrates server head output and browser updates.",
  ],
  tradeoffs: [
    "Applications own layout metadata composition and duplicate-tag policy.",
    "Title templates and general metadata merge/reset behavior are not supplied by svelte:head itself.",
  ],
};

const laravel = "laravel";
set(
  laravel,
  "ssr layouts serverOnly",
  "native",
  "blade",
  "Blade compiles server templates, supports layouts/components/sections and keeps PHP view execution on the server.",
);
set(
  laravel,
  "streaming",
  "native",
  "responses",
  "Streamed responses and event streams emit incremental output. This is transport streaming, not a component Suspense replacement protocol.",
);
set(
  laravel,
  "routing dynamicRoutes redirects apiRoutes",
  "native",
  "routing",
  "Routes match methods and parameterized paths, invoke controllers and return response/redirect endpoints.",
);
set(
  laravel,
  "middleware",
  "native",
  "middleware",
  "Middleware wraps request processing, with route/group configuration and shared response policy.",
);
set(
  laravel,
  "forms",
  "native",
  "validation",
  "Request/FormRequest validation integrates redirect errors, old input and JSON validation responses.",
);
set(
  laravel,
  "cookies",
  "native",
  "session",
  "Session drivers and cookie middleware manage request state; production stores and cookie flags require configuration.",
);
set(
  laravel,
  "serverData orm",
  "native",
  "eloquent",
  "Eloquent models and query builders load relational data, with relationships, eager loading and model lifecycle hooks.",
);
set(
  laravel,
  "migrations",
  "native",
  "migrations",
  "Artisan migrations apply versioned schema changes and maintain execution history with rollback operations.",
);
set(
  laravel,
  "transactions requestDedupe",
  "native",
  "database",
  "Database APIs provide atomic transactions and request-scoped query-result caching; database behavior and drivers remain relevant.",
);
set(
  laravel,
  "requestDedupe",
  "undocumented",
  "database",
  "The reviewed database guide establishes query execution/transactions but does not establish general request-wide equivalent-read deduplication.",
);
set(
  laravel,
  "persistentCache invalidation",
  "native",
  "cache",
  "Named cache stores support retention, remember operations, deletion and supported-store tags. Tag availability varies by driver.",
);
set(
  laravel,
  "jobs",
  "native",
  "queues",
  "Queue connections/workers support job dispatch, retries, failures and lifecycle policy; a durable production driver must be configured.",
);
set(
  laravel,
  "mail",
  "native",
  "mail",
  "Mailables, transports, templates and queued delivery form the integrated mail workflow.",
);
set(
  laravel,
  "uploads",
  "native",
  "filesystem",
  "Uploaded files integrate with named filesystem disks, local/cloud storage, URLs and visibility controls.",
);
set(
  laravel,
  "realtime",
  "official",
  "broadcasting",
  "Laravel broadcasting integrates channels/auth and Echo; the first-party Reverb package supplies a WebSocket server.",
  "Broadcasting / Reverb",
);
set(
  laravel,
  "translations localeFormatting",
  "native",
  "localization",
  "Translation files, pluralization, fallback locales and locale selection are documented. Locale formatting beyond translation uses PHP intl or a library.",
);
set(
  laravel,
  "localeFormatting",
  "official",
  "https://www.php.net/manual/en/book.intl.php",
  "PHP's intl extension supplies locale-aware numeric/date formatting; it is separate from Laravel's message catalogs.",
  "PHP intl",
);
set(
  laravel,
  "localeRouting",
  "partial",
  "localization",
  "The guide sets locale from request/route input. Automatic localized URL generation/negotiation requires application policy or another package.",
  "Locale route recipe",
);
set(
  laravel,
  "auth",
  "native",
  "authentication",
  "Guards/providers and session authentication integrate with first-party starter/auth packages. Applications select account and authorization policy.",
);
set(
  laravel,
  "csrf",
  "native",
  "csrf",
  "CSRF middleware validates browser writes with tokens/origin checks according to configured middleware and exclusions.",
);
set(
  laravel,
  "metadata dynamicMetadata metadataInheritance metadataOverrides titleTemplates",
  "official",
  "head",
  "Laravel Head resolves defaults, route groups, route values, runtime values and error values field by field. Higher layers replace lower fields; inherited title prefix/suffix can be bypassed with exact titles. This is route-layer inheritance, not filesystem-layout traversal.",
  "Laravel Head",
);
additionalEvidence.laravel.metadata.assessment = {
  summary:
    "A structured first-party metadata package with explicit field precedence and Blade/Livewire/Inertia integration.",
  strengths: [
    "Defaults survive unless a higher-priority layer replaces that field.",
    "Route groups, runtime values and exact titles have documented precedence.",
  ],
  tradeoffs: [
    "Install laravel/head separately.",
    "Inheritance follows route/runtime layers, rather than a Next-style nested layout tree.",
  ],
};
set(
  laravel,
  "robots",
  "partial",
  "head",
  "Laravel Head controls per-document robots meta directives; it does not establish robots.txt file generation.",
  "Robots meta only",
);
set(
  laravel,
  "images",
  "native",
  "images",
  "The Image facade transforms and encodes images, integrating uploads/storage. Install Intervention Image v4 and a supported GD/Imagick driver as documented.",
);
set(
  laravel,
  "staticAssets hmr",
  "native",
  "vite",
  "Laravel's Vite integration handles asset URLs, hot updates and production manifests; browser tooling is installed separately.",
);
set(
  laravel,
  "fonts scripts",
  "partial",
  "vite",
  "Vite asset helpers support app-owned font/script loading and preload policy. Automatic font metrics/subsetting or a dedicated third-party script scheduler is not established.",
  "Asset pipeline",
);
set(
  laravel,
  "types",
  "community",
  "testing",
  "PHPStan/Larastan can statically analyze Laravel application code; native PHP type declarations alone are runtime checks.",
  "Static analyzer required",
);
set(
  laravel,
  "unitTests",
  "native",
  "testing",
  "Laravel's test harness supplies HTTP/application assertions and database testing support with Pest or PHPUnit.",
);
set(
  laravel,
  "e2eTests",
  "official",
  "dusk",
  "Laravel Dusk supplies browser automation and application-aware assertions.",
  "Dusk",
);
set(
  laravel,
  "observability",
  "native",
  "logging",
  "Logging channels integrate structured context and external transports; first-party Telescope/Pulse/Nightwatch add inspection and monitoring.",
);
set(
  laravel,
  "errorHandling",
  "partial",
  "errors",
  "Exception handling renders application error responses and reports failures. This is not a client component recovery boundary.",
  "Exception responses",
);
set(
  laravel,
  "serverHosting",
  "native",
  "deployment",
  "The production guide documents PHP server deployment, configuration/cache commands, workers and health checks.",
);
set(
  laravel,
  "cli",
  "native",
  "artisan",
  "Artisan supplies application commands, generators, development processes, migrations and production maintenance operations.",
);
set(
  laravel,
  "environment",
  "native",
  "configuration",
  "Environment-backed configuration, encrypted environment files and production config caching are documented. Only deliberately exposed values should enter browser assets.",
);
set(
  laravel,
  "localeFormatting",
  "native",
  "helpers",
  "Laravel Number helpers format currency, percentages, ordinals and numbers with locale selection. PHP intl may be required by the operation.",
  "Number helpers",
);
set(
  laravel,
  "csp",
  "partial",
  "vite",
  "Vite::useCspNonce generates or accepts nonces for emitted asset tags. Applications must set the matching HTTP policy and cover other script/style sources.",
  "Asset nonce integration",
);

set(
  ts,
  "cssModules scopedCss",
  "native",
  "guide/css-styling",
  "Start discovers route CSS Modules in the build graph and links their scoped stylesheets during SSR and client navigation.",
);
set(
  ts,
  "markdown",
  "official",
  "guide/rendering-markdown",
  "The documented TanStack Markdown React renderer works during SSR and browser navigation.",
  "TanStack Markdown",
);
set(
  nuxt,
  "environment",
  "native",
  "guide/going-further/runtime-config",
  "Private runtimeConfig fields stay on the server; only explicit public configuration enters page payloads. Runtime secrets can be set without rebuilding.",
);
set(
  nuxt,
  "errorHandling",
  "native",
  "getting-started/error-handling",
  "NuxtErrorBoundary renders a resettable client fallback; server/application error pages and clearError handle broader failures.",
);
set(
  laravel,
  "client csr",
  "official",
  "starter-kits",
  "Official React, Vue and Svelte starter kits integrate Inertia for browser navigation/rendering. Blade alone does not hydrate into a client component runtime.",
  "Inertia starter kits",
);
set(
  laravel,
  "tailwind",
  "official",
  "starter-kits",
  "First-party starter kits configure Tailwind alongside their selected UI stack; the CSS compiler is installed separately.",
  "Starter kit integration",
);
set(
  laravel,
  "markdown",
  "native",
  "strings",
  "Str::markdown/inlineMarkdown render Markdown through the framework string helpers. They do not compile MDX components.",
);
set(
  laravel,
  "types",
  "undocumented",
  "testing",
  "The reviewed Laravel/PHP testing workflow does not establish compile-time template/application type checking. PHP declarations are runtime checks; tools such as static analyzers are separate integrations.",
);

set(
  nuxt,
  "serverOnly",
  "partial",
  "guide/going-further/experimental-features",
  "The opt-in componentIslands experiment enables server components and selective hydration. It is not an unqualified stable core capability in this Nuxt 4.x review.",
  "Experimental component islands",
);

// Common host responsibilities stay explicit for standalone libraries.
for (const id of [
  "remix",
  "solidstart",
  "tanstack-start",
  "nuxt",
  "sveltekit",
]) {
  for (const key of [
    "jobs",
    "mail",
    "orm",
    "migrations",
    "transactions",
    "uploads",
    "realtime",
  ]) {
    const finding = additionalEvidence[id][key];
    if (finding.status === "undocumented")
      finding.note = `The reviewed ${featureProjects.find((p) => p.id === id).label} server/data guides do not establish an owned ${features.find((f) => f.id === key).label.toLowerCase()} API. An application can integrate a separate provider or library; this finding does not mean that integration is impossible.`;
  }
}
