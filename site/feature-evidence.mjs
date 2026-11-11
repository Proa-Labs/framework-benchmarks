// Additional source-backed capability reviews. Missing facts remain unknown.
export const expandedEvidence = {
  nextjs: {
    csr: {
      status: "native",
      note: "Client Components render subsequent navigations in the browser. Initial visits still receive prerendered HTML.",
      url: "https://nextjs.org/docs/app/getting-started/server-and-client-components",
    },
    serverOnly: {
      status: "native",
      note: "React Server Components keep server implementation and dependencies out of the client bundle. Serialized props still reach the browser.",
      url: "https://nextjs.org/docs/app/getting-started/server-and-client-components",
      label: "React Server Components",
    },
    partialRendering: {
      status: "native",
      note: "Cache Components combines a prerendered shell with request-time streaming. Existing apps must enable the documented configuration.",
      url: "https://nextjs.org/docs/app/getting-started/caching",
      label: "Cache Components",
    },
    layouts: {
      status: "native",
      note: "Filesystem layout segments compose automatically and persist across navigation.",
      url: "https://nextjs.org/docs/app/getting-started/layouts-and-pages",
    },
    dynamicRoutes: {
      status: "native",
      note: "Bracketed segments support parameters, catch-all routes, and optional catch-all routes.",
      url: "https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes",
    },
    parallelRoutes: {
      status: "native",
      note: "Named @slots have independent navigation state, loading UI, and defaults for unmatched routes.",
      url: "https://nextjs.org/docs/app/api-reference/file-conventions/parallel-routes",
    },
    interceptedRoutes: {
      status: "native",
      note: "Interception conventions support routed modals with different soft-navigation and direct-link behavior.",
      url: "https://nextjs.org/docs/app/api-reference/file-conventions/intercepting-routes",
    },
    prefetch: {
      status: "native",
      note: "Link prefetching and router.prefetch can prepare route data and UI. Static and dynamic routes have different prefetch behavior.",
      url: "https://nextjs.org/docs/app/guides/prefetching",
    },
    redirects: {
      status: "native",
      note: "Proxy can redirect or internally rewrite requests; configuration and render-time redirect APIs provide other boundaries.",
      url: "https://nextjs.org/docs/app/getting-started/proxy",
    },
    serverData: {
      status: "native",
      note: "Async Server Components load from fetch, databases, or other asynchronous I/O.",
      url: "https://nextjs.org/docs/app/getting-started/fetching-data",
    },
    clientData: {
      status: "community",
      note: "The guide recommends query libraries such as SWR or React Query. A client query cache is not supplied by Next.js itself.",
      url: "https://nextjs.org/docs/app/guides/client-side-data-fetching",
      label: "SWR / React Query",
    },
    requestDedupe: {
      status: "native",
      note: "The guide documents fetch memoization and React.cache for sharing equivalent reads during rendering.",
      url: "https://nextjs.org/docs/app/getting-started/fetching-data",
    },
    persistentCache: {
      status: "native",
      note: "use cache retains function or component results with explicit lifetimes. Storage and coordination depend on deployment.",
      url: "https://nextjs.org/docs/app/getting-started/caching",
      label: "use cache",
    },
    invalidation: {
      status: "native",
      note: "Path/tag invalidation and cache lifetime controls support different freshness semantics.",
      url: "https://nextjs.org/docs/app/getting-started/revalidating",
    },
    isr: {
      status: "native",
      note: "Regenerates cached pages by time or on demand; static-only export does not provide ISR.",
      url: "https://nextjs.org/docs/app/guides/incremental-static-regeneration",
    },
    apiRoutes: {
      status: "native",
      note: "route.ts handlers use Web Request/Response and support multiple HTTP methods.",
      url: "https://nextjs.org/docs/app/getting-started/route-handlers",
    },
    forms: {
      status: "native",
      note: "Server Actions receive FormData and support pending/error feedback. Application validation or an external schema library is still required.",
      url: "https://nextjs.org/docs/app/guides/forms",
    },
    middleware: {
      status: "native",
      note: "Proxy runs before request completion for redirects, rewrites, and header logic. It is not a replacement for authorization in handlers.",
      url: "https://nextjs.org/docs/app/getting-started/proxy",
      label: "Proxy",
    },
    cookies: {
      status: "native",
      note: "cookies() reads request cookies and writes them from Server Functions or Route Handlers. Session management remains application/library work.",
      url: "https://nextjs.org/docs/app/api-reference/functions/cookies",
      label: "Cookie API",
    },
    cssModules: {
      status: "native",
      note: "Imports .module.css files with generated local class names.",
      url: "https://nextjs.org/docs/app/getting-started/css",
    },
    scopedCss: {
      status: "official",
      note: "styled-jsx provides locally scoped styles; the App Router guide documents the required style registry.",
      url: "https://nextjs.org/docs/app/guides/css-in-js",
      label: "styled-jsx",
    },
    tailwind: {
      status: "community",
      note: "Official setup instructions integrate the external Tailwind compiler and PostCSS package.",
      url: "https://nextjs.org/docs/app/getting-started/css",
      label: "Tailwind CSS",
    },
    cssInJs: {
      status: "partial",
      note: "Supported libraries need Client Components and server style insertion setup; not every CSS-in-JS library supports Server Components.",
      url: "https://nextjs.org/docs/app/guides/css-in-js",
      label: "Library-dependent",
    },
    images: {
      status: "native",
      note: "Image generates responsive, size-optimized output. Remote sources and deployment image services require configuration.",
      url: "https://nextjs.org/docs/app/getting-started/images",
      label: "next/image",
    },
    fonts: {
      status: "native",
      note: "next/font self-hosts local or downloaded fonts and configures optimized loading and fallback behavior.",
      url: "https://nextjs.org/docs/app/getting-started/fonts",
      label: "next/font",
    },
    scripts: {
      status: "native",
      note: "Script supports beforeInteractive, afterInteractive, and lazyOnload. Worker offloading is experimental.",
      url: "https://nextjs.org/docs/app/guides/scripts",
      label: "next/script",
    },
    staticAssets: {
      status: "native",
      note: "Files in public are served from the URL root; cache policy differs from fingerprinted build assets.",
      url: "https://nextjs.org/docs/app/api-reference/file-conventions/public-folder",
    },
    metadata: {
      status: "native",
      note: "Typed Metadata covers canonical/alternate links, social cards, robots, icons, and title fields.",
      url: "https://nextjs.org/docs/app/api-reference/functions/generate-metadata",
      label: "Extensive, integrated API",
      assessment: {
        label: "Extensive, integrated API",
        summary:
          "Strong coverage of route-aware metadata and generated SEO assets, with explicit composition needed for nested objects.",
        strengths: [
          "Typed static metadata and async generateMetadata.",
          "Automatic route-segment inheritance, title templates, and access to resolved parent metadata.",
          "File conventions integrate generated social images and crawler documents.",
        ],
        tradeoffs: [
          "Nested objects merge shallowly. Replacing openGraph can discard an inherited description or image list.",
          "Title templates have segment-specific rules; asynchronous metadata interacts with caching and rendering.",
        ],
      },
    },
    dynamicMetadata: {
      status: "native",
      note: "generateMetadata can await data and resolved parent metadata; eligible fetches are memoized.",
      url: "https://nextjs.org/docs/app/api-reference/functions/generate-metadata",
    },
    metadataInheritance: {
      status: "native",
      note: "Layouts and pages merge root-to-leaf. Merge is shallow: a child openGraph object replaces the parent object.",
      url: "https://nextjs.org/docs/app/api-reference/functions/generate-metadata#merging",
    },
    metadataOverrides: {
      status: "native",
      note: "Child keys replace ancestor keys. To retain parent OG images, read parent metadata and explicitly compose the array.",
      url: "https://nextjs.org/docs/app/api-reference/functions/generate-metadata#overwriting-fields",
      label: "Shallow replacement",
    },
    titleTemplates: {
      status: "native",
      note: "Ancestor templates format child titles; title.absolute bypasses a template. A template does not format the same segment’s own page title.",
      url: "https://nextjs.org/docs/app/api-reference/functions/generate-metadata#title",
    },
    socialImages: {
      status: "native",
      note: "ImageResponse generates OG/Twitter images using a supported subset of CSS; file conventions publish them.",
      url: "https://nextjs.org/docs/app/getting-started/metadata-and-og-images",
    },
    sitemaps: {
      status: "native",
      note: "Structured sitemap generators support image/video entries, locales, and multiple sitemap files.",
      url: "https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap",
    },
    robots: {
      status: "native",
      note: "Static robots.txt or a typed robots generator defines user-agent rules and sitemap URLs.",
      url: "https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots",
    },
    markdown: {
      status: "official",
      note: "@next/mdx integrates Markdown/MDX with the App Router; remark/rehype plugins and component mapping are configurable.",
      url: "https://nextjs.org/docs/app/guides/mdx",
      label: "@next/mdx",
    },
    draftMode: {
      status: "native",
      note: "Draft Mode bypasses cached/published content for preview requests. The application must secure the enabling endpoint.",
      url: "https://nextjs.org/docs/app/guides/draft-mode",
    },
    auth: {
      status: "community",
      note: "The guide recommends an authentication library and shows application-owned session and authorization patterns. No complete identity service is bundled.",
      url: "https://nextjs.org/docs/app/guides/authentication",
      label: "Auth library / recipe",
    },
    csp: {
      status: "native",
      note: "Nonce-aware script handling works with application-configured CSP. Per-request nonces require dynamic rendering.",
      url: "https://nextjs.org/docs/app/guides/content-security-policy",
    },
    csrf: {
      status: "partial",
      note: "Server Actions enforce POST and compare Origin with Host; allowed origins are configurable. This is not universal CSRF protection for custom endpoints.",
      url: "https://nextjs.org/docs/app/guides/data-security#allowed-origins-advanced",
      label: "Server Actions only",
    },
    environment: {
      status: "native",
      note: "Loads .env files; NEXT_PUBLIC_ values are inlined into browser bundles. Runtime server secrets remain separate.",
      url: "https://nextjs.org/docs/app/guides/environment-variables",
    },
    types: {
      status: "native",
      note: "TypeScript integration includes generated route-aware helpers and typed configuration. Type coverage is not a guarantee of runtime input validation.",
      url: "https://nextjs.org/docs/app/api-reference/config/typescript",
    },
    hmr: {
      status: "native",
      note: "Fast Refresh usually preserves component state; some edits trigger full reloads.",
      url: "https://nextjs.org/docs/architecture/fast-refresh",
    },
    cli: {
      status: "native",
      note: "create-next-app scaffolds projects; next provides development and production lifecycle commands.",
      url: "https://nextjs.org/docs/app/api-reference/cli",
    },
    bundleAnalysis: {
      status: "native",
      note: "The Turbopack analyzer inspects modules and import chains; Webpack uses the optional @next/bundle-analyzer package.",
      url: "https://nextjs.org/docs/app/guides/package-bundling",
    },
    unitTests: {
      status: "community",
      note: "The documented Vitest/React Testing Library setup covers synchronous components. Async Server Components need a different strategy.",
      url: "https://nextjs.org/docs/app/guides/testing/vitest",
      label: "Vitest / Jest",
    },
    e2eTests: {
      status: "community",
      note: "The official recipe runs Playwright against a production build, including browser navigation tests.",
      url: "https://nextjs.org/docs/app/guides/testing/playwright",
      label: "Playwright",
    },
    observability: {
      status: "native",
      note: "Next.js emits OpenTelemetry spans; an SDK/exporter or monitoring backend must be configured separately.",
      url: "https://nextjs.org/docs/app/guides/open-telemetry",
      label: "OpenTelemetry hooks",
    },
    errorHandling: {
      status: "native",
      note: "Nested error and global-error boundaries provide fallback/retry UI; expected mutation failures are returned explicitly.",
      url: "https://nextjs.org/docs/app/getting-started/error-handling",
    },
    serverHosting: {
      status: "native",
      note: "Production Node server hosting supports the full feature set, subject to the documented infrastructure configuration.",
      url: "https://nextjs.org/docs/app/getting-started/deploying",
    },
    staticHosting: {
      status: "native",
      note: "Static export serves generated files without a server; request-time features and ISR are unavailable.",
      url: "https://nextjs.org/docs/app/guides/static-exports",
    },
    containers: {
      status: "native",
      note: "The deployment guide supports Docker and provides production container examples.",
      url: "https://nextjs.org/docs/app/getting-started/deploying",
    },
    edgeHosting: {
      status: "partial",
      note: "An optional Edge Runtime has restricted Node APIs and no ISR. Actual edge placement depends on the hosting platform.",
      url: "https://nextjs.org/docs/app/api-reference/edge",
      label: "Restricted runtime",
    },
  },
  proa: {
    serverOnly: {
      status: "native",
      note: "Ordinary Rust components stay on the server; only analyzed RSJS graphs become browser JavaScript. This is not the React RSC protocol.",
      url: "https://proa.so/docs/rsjs/server-only",
      label: "Rust / RSJS boundary",
    },
    layouts: {
      status: "native",
      note: "Role-marked layouts nest around a selected Page. The handler composes them explicitly rather than using filesystem layout discovery.",
      url: "https://proa.so/docs/framework/layouts-and-pages",
    },
    dynamicRoutes: {
      status: "official",
      note: "The Axum integration reads route parameters through the request context.",
      url: "https://proa.so/docs/framework/routing",
      label: "Axum integration",
    },
    prefetch: {
      status: "partial",
      note: "The guide shows optional prefetch hints and a Turbo Drive integration; baseline navigation uses document anchors.",
      url: "https://proa.so/docs/framework/linking",
      label: "Hints / Turbo recipe",
    },
    redirects: {
      status: "official",
      note: "Framework handlers use Axum redirects and explicit response status; this source does not establish a rewrite configuration API.",
      url: "https://proa.so/docs/framework/errors",
      label: "Redirects via Axum",
    },
    serverData: {
      status: "native",
      note: "Keyed loaders share typed asynchronous results and feed streamed components.",
      url: "https://proa.so/docs/framework/data-loading",
    },
    clientData: {
      status: "native",
      note: "RSJS queries seed from server data, expose fetch state, and support invalidating mutations against explicit URLs.",
      url: "https://proa.so/docs/rsjs/queries-mutations",
    },
    requestDedupe: {
      status: "native",
      note: "Request-scoped keyed resolution deduplicates equivalent loads; cross-request policy is separate.",
      url: "https://proa.so/docs/framework/caching",
    },
    persistentCache: {
      status: "native",
      note: "The documented data cache retains keyed results across requests with explicit policy.",
      url: "https://proa.so/docs/framework/caching",
    },
    invalidation: {
      status: "native",
      note: "Invalidation targets data keys and render dependencies; cache traces expose dependency behavior.",
      url: "https://proa.so/docs/framework/caching",
    },
    isr: {
      status: "partial",
      note: "PageCache configures stale-while-revalidate/CDN behavior. There is no in-process page cache; without a CDN the page still renders.",
      url: "https://proa.so/docs/framework/page-caching",
      label: "CDN-dependent",
    },
    apiRoutes: {
      status: "official",
      note: "Route::endpoint registers Axum handlers for JSON, forms, raw bodies, and webhooks.",
      url: "https://proa.so/docs/framework/route-handlers",
      label: "Axum integration",
    },
    forms: {
      status: "partial",
      note: "Native forms submit to explicit Axum handlers; Wellformed validates inputs. Typed client actions are not generated server RPC.",
      url: "https://proa.so/docs/guides/forms-actions",
      label: "Forms + Wellformed",
    },
    middleware: {
      status: "official",
      note: "Axum handlers/layers compose around endpoints; framework security layers apply to registered endpoints.",
      url: "https://proa.so/docs/framework/route-handlers",
      label: "Axum layers",
    },
    images: {
      status: "partial",
      note: "No image transformation pipeline is provided. The app prepares variants and authors srcset/sizes itself.",
      url: "https://proa.so/docs/framework/images",
      label: "Manual variants",
    },
    fonts: {
      status: "official",
      note: "proa_fonts vendors self-hosted fonts, hashes assets, emits preload CSS, and provides metric-matched fallbacks.",
      url: "https://proa.so/docs/framework/fonts",
      label: "proa_fonts",
    },
    scripts: {
      status: "official",
      note: "proa_third_party supports consent-aware analytics and deferred scripts; browser execution still requires CSP authorization.",
      url: "https://proa.so/docs/framework/third-party",
      label: "proa_third_party",
    },
    staticAssets: {
      status: "official",
      note: "FrameworkBuilder mounts an application-supplied static router; disk/embedded service and cache headers are explicit.",
      url: "https://proa.so/docs/framework/static-assets",
      label: "Static router",
    },
    metadata: {
      status: "native",
      note: "Managed head builders produce structured title, canonical, social, and named metadata at one head outlet.",
      url: "https://proa.so/docs/framework/metadata",
      label: "Explicit, composable API",
      assessment: {
        label: "Explicit, composable API",
        summary:
          "Structured metadata with field-level inheritance and clear operations; setup and document ordering are explicit.",
        strengths: [
          "Shared request loaders can feed both render_head and the page body.",
          "Layout defaults, field patches, explicit clears, and absolute titles are documented.",
        ],
        tradeoffs: [
          "Requires managed-head setup, role-marked components, and a head outlet; direct body rendering skips the metadata hook.",
          "Metadata seals before the selected page body; it cannot be treated as unrestricted late head mutation.",
        ],
      },
    },
    dynamicMetadata: {
      status: "native",
      note: "Async render_head can use the same keyed loader as the body; metadata seals before the selected Page body starts.",
      url: "https://proa.so/docs/framework/metadata",
    },
    metadataInheritance: {
      status: "native",
      note: "Layout hooks supply defaults; child hooks change only the fields they write. Handlers must compose role-marked components.",
      url: "https://proa.so/docs/framework/metadata#inherit-layout-defaults",
    },
    metadataOverrides: {
      status: "native",
      note: "Children can patch or clear inherited fields. Image arrays replace the inherited list; images([]) removes it.",
      url: "https://proa.so/docs/framework/metadata-reference#replace-inherited-images",
      label: "Field patches / clears",
    },
    titleTemplates: {
      status: "native",
      note: "title_template composes inherited titles; absolute_title bypasses it and clear_title_template resets it.",
      url: "https://proa.so/docs/framework/metadata-reference",
    },
    socialImages: {
      status: "official",
      note: "Optional proa_og generates images using WPE WebKit on Linux and requires native libraries; metadata itself only emits image URLs.",
      url: "https://proa.so/docs/framework/images#open-graph-images",
      label: "proa_og / Linux",
    },
    sitemaps: {
      status: "native",
      note: "Typed and asynchronous generators support individual sitemap documents and a multi-sitemap index.",
      url: "https://proa.so/docs/framework/sitemaps",
    },
    robots: {
      status: "native",
      note: "Structured generators support user-agent groups, sitemap links, and asynchronous generation.",
      url: "https://proa.so/docs/framework/robots",
    },
    markdown: {
      status: "native",
      note: "md! / md_sync! render typed Markdown output. This is not itself a filesystem Markdown-to-HTML content pipeline.",
      url: "https://proa.so/docs/core/markdown",
      label: "Typed Markdown output",
    },
    csp: {
      status: "native",
      note: "Configured CSP can assign a fresh per-response nonce to generated scripts; CSP and HSTS are opt-in.",
      url: "https://proa.so/docs/framework/security-headers",
    },
    csrf: {
      status: "partial",
      note: "Unsafe cross-origin browser writes are rejected by default. Proa does not issue CSRF tokens; add token middleware if needed.",
      url: "https://proa.so/docs/framework/cross-origin",
      label: "Origin checks; no tokens",
    },
    environment: {
      status: "partial",
      note: "The application defines and validates runtime environment configuration. Only explicitly selected values should enter browser props.",
      url: "https://proa.so/docs/framework/environment",
      label: "Application-owned config",
    },
    types: {
      status: "native",
      note: "Rust type checking and template macros validate typed server templates at compile time.",
      url: "https://proa.so/docs/core/html-rendering",
    },
    hmr: {
      status: "native",
      note: "proa dev watches files and rebuilds assets/server. This source does not promise React-style state-preserving hot updates.",
      url: "https://proa.so/docs/framework/project-config",
      label: "Watch / rebuild",
    },
    cli: {
      status: "native",
      note: "proa dev and proa build coordinate project assets and compilation through proa.config.json.",
      url: "https://proa.so/docs/framework/project-config",
    },
    unitTests: {
      status: "native",
      note: "Rust library tests use cargo test; linked RSJS integration targets use proa test.",
      url: "https://proa.so/docs/guides/testing",
      label: "Rust / proa test",
    },
    serverHosting: {
      status: "native",
      note: "Deploy a release binary plus public assets on your own server.",
      url: "https://proa.so/docs/framework/deployment",
    },
    containers: {
      status: "native",
      note: "The documented Docker build packages the Rust binary and required assets for a production runtime.",
      url: "https://proa.so/docs/framework/railway",
    },
  },
  astro: {
    serverOnly: {
      status: "native",
      note: "Astro components execute on the server/build and send no component runtime by default. UI islands use separate integrations.",
      url: "https://docs.astro.build/en/basics/astro-components/",
      label: "Astro components",
    },
    partialRendering: {
      status: "partial",
      note: "server:defer combines a prerendered page with separately fetched server islands, not one request-time HTML stream.",
      url: "https://docs.astro.build/en/guides/server-islands/",
      label: "Separate island requests",
    },
    layouts: {
      status: "native",
      note: "Layouts are ordinary Astro components explicitly composed through slots and props; no automatic route-layout inheritance is implied.",
      url: "https://docs.astro.build/en/basics/layouts/",
    },
    dynamicRoutes: {
      status: "native",
      note: "Bracketed page filenames accept parameters; static routes enumerate paths and on-demand routes resolve at request time.",
      url: "https://docs.astro.build/en/guides/routing/",
    },
    prefetch: {
      status: "native",
      note: "Optional prefetch supports hover, tap, viewport, or load strategies; the client router also coordinates navigation.",
      url: "https://docs.astro.build/en/guides/prefetch/",
    },
    redirects: {
      status: "native",
      note: "Astro.redirect and configured redirects are supported, with output dependent on static hosting or adapter capabilities.",
      url: "https://docs.astro.build/en/guides/routing/",
    },
    serverData: {
      status: "native",
      note: "Component scripts await fetch at build time or on demand; browser fetching uses client scripts or UI libraries.",
      url: "https://docs.astro.build/en/guides/data-fetching/",
    },
    apiRoutes: {
      status: "native",
      note: "Endpoints produce arbitrary responses; on-demand server endpoints support HTTP methods.",
      url: "https://docs.astro.build/en/guides/endpoints/",
    },
    forms: {
      status: "native",
      note: "Actions parse and validate form/JSON input with schemas and expose typed browser callers.",
      url: "https://docs.astro.build/en/guides/actions/",
    },
    middleware: {
      status: "native",
      note: "Middleware wraps page/endpoint rendering and shares request data through locals.",
      url: "https://docs.astro.build/en/guides/middleware/",
    },
    cookies: {
      status: "native",
      note: "Server-side sessions store data between on-demand requests; storage and adapter configuration affect deployment.",
      url: "https://docs.astro.build/en/guides/sessions/",
      label: "Sessions",
    },
    cssModules: {
      status: "native",
      note: "Vite-backed CSS Module imports provide generated local class names.",
      url: "https://docs.astro.build/en/guides/styling/",
    },
    scopedCss: {
      status: "native",
      note: "Component style tags are scoped by default; global selectors/styles can opt out.",
      url: "https://docs.astro.build/en/guides/styling/",
    },
    tailwind: {
      status: "community",
      note: "The documented Tailwind setup uses its external Vite plugin.",
      url: "https://docs.astro.build/en/guides/styling/",
      label: "Tailwind / Vite",
    },
    images: {
      status: "native",
      note: "Image, Picture, and image generation APIs transform sources; responsive resizing and services are configurable.",
      url: "https://docs.astro.build/en/guides/images/",
    },
    fonts: {
      status: "native",
      note: "A typed font API supports local/provider sources, preload links, optimized fallbacks, and generated font assets.",
      url: "https://docs.astro.build/en/guides/fonts/",
    },
    scripts: {
      status: "partial",
      note: "Component scripts are bundled/deduplicated or inlined. A next/script-style strategy scheduler is not established here.",
      url: "https://docs.astro.build/en/guides/client-side-scripts/",
      label: "Bundled scripts",
    },
    staticAssets: {
      status: "native",
      note: "Public files are copied without transformation; imported source images can go through the image pipeline.",
      url: "https://docs.astro.build/en/guides/images/",
    },
    metadata: {
      status: "partial",
      note: "The guide composes an application-owned BaseHead component and passes props. This is not a structured, automatically merged metadata registry.",
      url: "https://docs.astro.build/en/basics/layouts/",
      label: "Application-owned pattern",
      assessment: {
        label: "Application-owned pattern",
        summary:
          "Flexible head composition through normal components and props; the application defines its metadata contract.",
        strengths: [
          "A shared head component can be reused across layouts and receive typed application props.",
        ],
        tradeoffs: [
          "The reviewed layout guide does not establish automatic metadata-object inheritance, deduplication, or child-override rules.",
          "Additional SEO behavior must be implemented or supplied by an integration.",
        ],
      },
    },
    dynamicMetadata: {
      status: "partial",
      note: "Pages can pass data into a shared head/layout component. The application owns the metadata composition contract.",
      url: "https://docs.astro.build/en/basics/layouts/",
      label: "App-owned composition",
    },
    markdown: {
      status: "native",
      note: "Markdown includes frontmatter and component rendering; MDX requires the separate official integration.",
      url: "https://docs.astro.build/en/guides/markdown-content/",
      label: "Markdown; MDX package",
    },
    collections: {
      status: "native",
      note: "Typed collections validate and query local/remote content through loaders and schemas.",
      url: "https://docs.astro.build/en/guides/content-collections/",
    },
    environment: {
      status: "native",
      note: "astro:env validates a schema and separates public/client values from server secrets.",
      url: "https://docs.astro.build/en/reference/modules/astro-env/",
    },
    unitTests: {
      status: "community",
      note: "The guide integrates external runners and component-testing tools.",
      url: "https://docs.astro.build/en/guides/testing/",
      label: "Vitest / test libraries",
    },
    e2eTests: {
      status: "community",
      note: "Browser testing uses external Playwright or Cypress integrations.",
      url: "https://docs.astro.build/en/guides/testing/",
      label: "Playwright / Cypress",
    },
    serverHosting: {
      status: "official",
      note: "On-demand hosting requires a deployment adapter such as the official Node adapter.",
      url: "https://docs.astro.build/en/guides/on-demand-rendering/",
      label: "SSR adapter",
    },
    staticHosting: {
      status: "native",
      note: "The default build produces static files for static hosting; on-demand features require an adapter.",
      url: "https://docs.astro.build/en/guides/deploy/",
    },
    edgeHosting: {
      status: "official",
      note: "Official adapter paths include Cloudflare; runtime feature support depends on the adapter.",
      url: "https://docs.astro.build/en/guides/deploy/",
      label: "Cloudflare adapter",
    },
    sitemaps: {
      status: "official",
      note: "@astrojs/sitemap generates sitemaps from static routes, with configuration for extra pages; server-only dynamic URLs need explicit inclusion.",
      url: "https://docs.astro.build/en/guides/integrations-guide/sitemap/",
      label: "@astrojs/sitemap",
    },
  },
  svelte: {
    csr: {
      status: "native",
      note: "mount creates a component in the browser; hydrate activates server-rendered output.",
      url: "https://svelte.dev/docs/svelte/imperative-component-api",
    },
    layouts: {
      status: "official",
      note: "SvelteKit +layout components nest by route hierarchy and survive child navigation.",
      url: "https://svelte.dev/docs/kit/routing",
      label: "SvelteKit",
    },
    dynamicRoutes: {
      status: "official",
      note: "SvelteKit maps parameterized filenames and catch-all segments into route params.",
      url: "https://svelte.dev/docs/kit/routing",
      label: "SvelteKit",
    },
    serverData: {
      status: "official",
      note: "Server and universal load functions fetch page data and share layout data with pages.",
      url: "https://svelte.dev/docs/kit/load",
      label: "SvelteKit",
    },
    apiRoutes: {
      status: "official",
      note: "SvelteKit +server modules define HTTP method handlers.",
      url: "https://svelte.dev/docs/kit/routing",
      label: "SvelteKit",
    },
    middleware: {
      status: "official",
      note: "SvelteKit handle hooks wrap requests and share server context.",
      url: "https://svelte.dev/docs/kit/hooks",
      label: "SvelteKit",
    },
    metadata: {
      status: "partial",
      note: "svelte:head emits page head elements. The application composes tags; this is not a typed metadata-object merge API.",
      url: "https://svelte.dev/docs/svelte/svelte-head",
      label: "Element-level support",
      assessment: {
        label: "Element-level support",
        summary:
          "Reactive head markup offers direct control; application code owns the metadata composition policy.",
        strengths: [
          "svelte:head allows title and metadata values to follow component state.",
        ],
        tradeoffs: [
          "A typed metadata-object API and general child-override policy are not established by this source.",
          "Head markup support alone does not establish generated social images or automatic layout merging.",
        ],
      },
    },
    dynamicMetadata: {
      status: "native",
      note: "Reactive values in svelte:head update title and metadata elements.",
      url: "https://svelte.dev/docs/svelte/svelte-head",
    },
    observability: {
      status: "official",
      note: "SvelteKit documents optional server-side OpenTelemetry tracing; instrumentation setup/exporters are separate.",
      url: "https://svelte.dev/docs/kit/observability",
      label: "SvelteKit tracing",
    },
    staticHosting: {
      status: "official",
      note: "adapter-static prerenders pages; dynamic routes and fallback mode require deliberate configuration.",
      url: "https://svelte.dev/docs/kit/adapter-static",
      label: "adapter-static",
    },
  },
  rails: {
    layouts: {
      status: "native",
      note: "Layouts wrap views; nested layouts use render/yield composition rather than a filesystem segment hierarchy.",
      url: "https://guides.rubyonrails.org/layouts_and_rendering.html",
    },
    dynamicRoutes: {
      status: "native",
      note: "Routes expose dynamic segments through params and support constraints.",
      url: "https://guides.rubyonrails.org/routing.html",
    },
    persistentCache: {
      status: "native",
      note: "Rails.cache and fragment caching support configured stores, including Solid Cache.",
      url: "https://guides.rubyonrails.org/caching_with_rails.html",
    },
    invalidation: {
      status: "native",
      note: "Versioned cache keys and dependency-aware fragment caching handle expiration; manual deletion is also available.",
      url: "https://guides.rubyonrails.org/caching_with_rails.html",
    },
    apiRoutes: {
      status: "native",
      note: "Controllers handle routed HTTP requests and can render JSON responses.",
      url: "https://guides.rubyonrails.org/getting_started.html",
    },
    forms: {
      status: "native",
      note: "Form builders connect model validation, controller submission, and CSRF tokens.",
      url: "https://guides.rubyonrails.org/getting_started.html",
    },
    cookies: {
      status: "native",
      note: "Rails supplies signed/encrypted cookie and session mechanisms; security depends on correct application configuration.",
      url: "https://guides.rubyonrails.org/security.html",
    },
    auth: {
      status: "native",
      note: "The authentication generator creates application models/controllers/views for session-based login; it is not a hosted identity provider.",
      url: "https://guides.rubyonrails.org/getting_started.html",
      label: "Authentication generator",
    },
    csp: {
      status: "native",
      note: "A CSP DSL supports global policies, per-resource overrides, and nonces.",
      url: "https://guides.rubyonrails.org/security.html",
    },
    csrf: {
      status: "native",
      note: "Action Controller forgery protection and form tokens defend configured browser mutation endpoints. API-only apps differ.",
      url: "https://guides.rubyonrails.org/security.html",
    },
    staticAssets: {
      status: "official",
      note: "Propshaft fingerprints assets and maps them through a manifest; it is enabled in generated applications.",
      url: "https://guides.rubyonrails.org/asset_pipeline.html",
      label: "Propshaft",
    },
    unitTests: {
      status: "native",
      note: "Rails test cases integrate Minitest with model, controller, and integration helpers.",
      url: "https://guides.rubyonrails.org/testing.html",
    },
    e2eTests: {
      status: "official",
      note: "System tests integrate browser drivers through Capybara; driver/browser configuration remains separate.",
      url: "https://guides.rubyonrails.org/testing.html",
      label: "System tests / Capybara",
    },
    containers: {
      status: "native",
      note: "Generated applications include Docker packaging; the deployment walkthrough uses Kamal.",
      url: "https://guides.rubyonrails.org/getting_started.html",
      label: "Docker / Kamal",
    },
  },
  react: {
    csr: {
      status: "native",
      note: "createRoot renders and updates browser application UI.",
      url: "https://react.dev/reference/react-dom/client/createRoot",
    },
    serverOnly: {
      status: "partial",
      note: "Server Components require a supporting framework/bundler. React alone does not supply production routing or deployment.",
      url: "https://react.dev/reference/rsc/server-components",
      label: "Framework required",
    },
    metadata: {
      status: "partial",
      note: "React hoists title elements into the document head. Multiple simultaneous titles are not automatically merged; the application must ensure one.",
      url: "https://react.dev/reference/react-dom/components/title",
      label: "Element-level support",
      assessment: {
        label: "Element-level support",
        summary:
          "Head element hoisting is useful, but it does not by itself establish a route-aware metadata system.",
        strengths: [
          "A rendered title element can use component values and move into the document head.",
        ],
        tradeoffs: [
          "The application must ensure only one title is rendered; multiple titles are not automatically resolved.",
          "Routing, inherited metadata policy, and generated SEO assets depend on the surrounding application/framework.",
        ],
      },
    },
    dynamicMetadata: {
      status: "native",
      note: "Title text can come from component values; this does not establish layout metadata inheritance.",
      url: "https://react.dev/reference/react-dom/components/title",
    },
  },
  vue: {
    csr: {
      status: "native",
      note: "createApp mounts a reactive Vue application in the browser.",
      url: "https://vuejs.org/guide/essentials/application.html",
    },
    scopedCss: {
      status: "native",
      note: "Scoped SFC style tags rewrite selectors; deep and global escapes are documented.",
      url: "https://vuejs.org/api/sfc-css-features.html",
    },
    cssModules: {
      status: "native",
      note: "SFC module styles expose generated class mappings to the component.",
      url: "https://vuejs.org/api/sfc-css-features.html",
    },
    types: {
      status: "native",
      note: "Vue supports TypeScript and SFC type checking through Vue tooling; editor/build setup matters.",
      url: "https://vuejs.org/guide/typescript/overview.html",
    },
  },
  exact: {
    types: {
      status: "native",
      note: "Contract compiles through syntax, types, analysis, and lowering; diagnostics identify source ranges. This is its own typed language, not TSX.",
      url: "https://github.com/expo/exact/blob/94b8671f70fe2e25b307a40e7fce66dc27c9f802/README.md",
      label: "Contract compiler",
    },
    cli: {
      status: "native",
      note: "contract build and scripts/agent.mjs provide build, diagnostics, and cross-host driver commands.",
      url: "https://github.com/expo/exact/blob/94b8671f70fe2e25b307a40e7fce66dc27c9f802/README.md",
    },
    e2eTests: {
      status: "native",
      note: "The host driver exposes tree, screenshot, tap, type, and state operations. This is an application-driving protocol, not a bundled Playwright test suite.",
      url: "https://github.com/expo/exact/blob/94b8671f70fe2e25b307a40e7fce66dc27c9f802/README.md",
      label: "Agent driver",
    },
    dynamicRoutes: {
      status: "native",
      note: "The routes table matches parameterized paths; path() checks named routes and encodes parameter values. HTTP serving policy is a separate part of the build pipeline.",
      url: "https://github.com/expo/exact/blob/94b8671f70fe2e25b307a40e7fce66dc27c9f802/docs/contract-for-humans.md#navigation-and-documents",
    },
    metadata: {
      status: "native",
      note: "Contract head declares title, description, canonical, image, robots, and selected error status values. This is a smaller surface than the full Next.js Metadata object.",
      url: "https://github.com/expo/exact/blob/94b8671f70fe2e25b307a40e7fce66dc27c9f802/docs/contract-for-humans.md#navigation-and-documents",
      label: "Focused document-head API",
      assessment: {
        label: "Focused document-head API",
        summary:
          "A compact declarative head surface with active-tree inheritance, rather than the breadth of a general metadata object.",
        strengths: [
          "Inner active declarations override scalar fields without losing unspecified site defaults.",
          "The reviewed corpus binds metadata to loaded records and route parameters.",
        ],
        tradeoffs: [
          "The documented head surface names title, description, canonical, image, robots, and selected status values.",
          "General clearing, title templates, and generated SEO assets have not been established in this review.",
        ],
      },
    },
    dynamicMetadata: {
      status: "native",
      note: "The document corpus binds head title and description to a loaded Post resource and canonical to route parameters.",
      url: "https://github.com/expo/exact/blob/94b8671f70fe2e25b307a40e7fce66dc27c9f802/contract/corpus/document.contract",
    },
    metadataInheritance: {
      status: "native",
      note: "The innermost active head wins field by field. A route inherits the site image when it does not set an image; inactive navigation entries do not contribute.",
      url: "https://github.com/expo/exact/blob/94b8671f70fe2e25b307a40e7fce66dc27c9f802/contract/corpus/document.contract",
      label: "Active head hierarchy",
    },
    metadataOverrides: {
      status: "native",
      note: "An inner head replaces declared scalar fields while retaining omitted outer fields. The reviewed source does not establish nested social-object merging or a general clear API.",
      url: "https://github.com/expo/exact/blob/94b8671f70fe2e25b307a40e7fce66dc27c9f802/contract/cli/tests/it/document.rs",
      label: "Scalar field overrides",
    },
  },
  leptos: {
    csr: {
      status: "native",
      note: "The csr feature renders the application in the browser; hydrate and ssr are separate build modes.",
      url: "https://docs.rs/leptos/latest/leptos/",
    },
    types: {
      status: "native",
      note: "Rust types and view macros check typed component composition during compilation.",
      url: "https://docs.rs/leptos/latest/leptos/",
    },
    metadata: {
      status: "official",
      note: "leptos_meta supplies Title, Meta, Link, and other head components. It is component-based rather than a merged metadata object.",
      url: "https://book.leptos.dev/metadata.html",
      label: "Reactive head components",
      assessment: {
        label: "Reactive head components",
        summary:
          "Head elements participate in the reactive component model, with a documented title formatter.",
        strengths: [
          "Title, Meta, Link, and other head components can be authored within application components.",
          "Reactive values update metadata; a shared formatter composes route titles.",
        ],
        tradeoffs: [
          "This review has not established a general nested metadata-object merge/clear contract.",
          "Do not infer Next.js-equivalent inheritance behavior from the presence of a Meta component.",
        ],
      },
    },
    dynamicMetadata: {
      status: "official",
      note: "Metadata components accept reactive values, so document metadata can follow application state.",
      url: "https://book.leptos.dev/metadata.html",
      label: "leptos_meta",
    },
    titleTemplates: {
      status: "official",
      note: "Title accepts a formatter on the app and route-specific text. The book demonstrates a common suffix applied to route titles.",
      url: "https://book.leptos.dev/metadata.html",
      label: "Title formatter",
    },
  },
};
