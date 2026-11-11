import { expandedFeatures } from "./feature-expansion-schema.mjs";

export const expandedReviewedOn = "2026-11-11";

// A bounded documentation review, not an inference from benchmark performance.
// A missing specialized contract remains unestablished, never an invented check.
export function addExpandedReview(evidence) {
  const set = (id, key, status, note, url, label) => {
    evidence[id][key] = {
      status,
      note,
      url,
      reviewedOn: expandedReviewedOn,
      ...(label ? { label } : {}),
    };
  };
  const sourceKeys = {
    security: "csp",
    server: "forms",
    data: "clientData",
    routing: "softNavigation",
    accessibility: "client",
    rendering: "client",
    deployment: "serverHosting",
    backend: "jobs",
    database: "orm",
    testing: "unitTests",
  };
  const templates = new Set([
    "askama",
    "sailfish",
    "jte",
    "rocker",
    "handlebars",
    "go-html-template",
    "jinja2",
  ]);
  const uiLibraries = new Set(["react", "vue", "svelte", "solid"]);
  for (const [id, entry] of Object.entries(evidence)) {
    for (const feature of expandedFeatures) {
      const rendererOwned = templates.has(id) || id === "php";
      const hostOwned =
        (rendererOwned &&
          feature.id !== "xssEscaping" &&
          feature.id !== "htmlSanitization") ||
        (uiLibraries.has(id) &&
          ["backend", "database", "server"].includes(feature.group));
      const source = entry[sourceKeys[feature.group]];
      set(
        id,
        feature.id,
        hostOwned ? "scope" : "undocumented",
        hostOwned
          ? `${feature.label} requires a host application or specialized integration beyond the reviewed ${rendererOwned ? "template/runtime" : "UI"} API. Emitting markup or using arbitrary host-language libraries does not establish this application-level contract.`
          : `The linked ${feature.group === "accessibility" ? "client rendering" : feature.group} API review does not establish the specific ${feature.label.toLowerCase()} contract defined here. This is a bounded documentation finding, not proof of absence; generic hooks or application-authored code are not counted as an owned implementation.`,
        id === "sailfish"
          ? "https://docs.rs/sailfish/latest/sailfish/"
          : source.url,
      );
    }
  }
  const rows = (id, facts) => {
    for (const [key, status, note, url, label] of facts)
      set(id, key, status, note, url, label);
  };

  // Output encoding is not a sanitizer, and not all HTML contexts have the same policy.
  for (const [id, url, note] of [
    [
      "askama",
      "https://askama.rs/en/stable/configuration.html#escapers",
      "HTML templates select HTML escaping by extension/configuration. Safe filters bypass escaping; this does not establish JavaScript/CSS context encoding or an HTML sanitizer.",
    ],
    [
      "sailfish",
      "https://rust-sailfish.github.io/sailfish/syntax/tags/",
      "Escaped template interpolation encodes dynamic HTML content; raw interpolation bypasses it. The reviewed contract does not establish rich-HTML sanitization or arbitrary script-context safety.",
    ],
    [
      "jte",
      "https://jte.gg/syntax/",
      "HTML templates contextually escape dynamic content and distinguish trusted Content values. Raw/trusted content bypasses protection; accepting rich HTML still needs sanitization.",
    ],
    [
      "rocker",
      "https://www.javadoc.io/doc/com.fizzed/rocker-runtime/latest/com/fizzed/rocker/ContentType.html",
      "HTML ContentType uses an HTML stringifier; RAW selects unescaped output. The template/content type matters, and this is not a sanitizer for authored HTML.",
    ],
    [
      "handlebars",
      "https://handlebarsjs.com/guide/expressions.html#html-escaping",
      "Double-brace expressions HTML-escape values; triple braces and SafeString bypass escaping. HTML escaping alone does not validate URL schemes or safely interpolate executable script/CSS contexts.",
    ],
    [
      "go-html-template",
      "https://pkg.go.dev/html/template#hdr-Contexts",
      "html/template performs contextual autoescaping for HTML, attributes, URLs, CSS and JavaScript. Trusted template.HTML/JS/URL types bypass parts of that policy; the template author is trusted.",
    ],
    [
      "jinja2",
      "https://jinja.palletsprojects.com/en/stable/api/#autoescaping",
      "The environment supports configured autoescape/select_autoescape. It is not enabled for every environment by default; Markup/safe bypass it. This is HTML escaping, not a rich-HTML sanitizer.",
    ],
    [
      "react",
      "https://react.dev/reference/react-dom/components/common#dangerously-setting-the-inner-html",
      "Normal text values are rendered as text; dangerouslySetInnerHTML bypasses this path and requires trusted/sanitized HTML. Do not infer arbitrary URL/CSS safety from text escaping.",
    ],
    [
      "vue",
      "https://vuejs.org/guide/best-practices/security.html",
      "Vue escapes ordinary text and attribute bindings using browser APIs/server encoding. v-html and untrusted URLs/styles need separate controls; templates themselves must be trusted.",
    ],
    [
      "svelte",
      "https://svelte.dev/docs/svelte/@html",
      "Ordinary interpolated text is escaped; @html explicitly inserts raw HTML. Svelte directs authors to escape or sanitize untrusted HTML before using that bypass.",
    ],
    [
      "solid",
      "https://docs.solidjs.com/reference/jsx-attributes/innerhtml",
      "JSX text interpolation uses text output; innerHTML is a raw-HTML sink. Applications must sanitize untrusted content supplied to innerHTML.",
    ],
    [
      "astro",
      "https://docs.astro.build/en/reference/directives-reference/#sethtml",
      "Template expressions and set:text escape text. set:html inserts unescaped content and requires trusted HTML. This is separate from sanitizing an untrusted rich-text document.",
    ],
    [
      "rails",
      "https://guides.rubyonrails.org/security.html#cross-site-scripting-xss",
      "Action View escapes ordinary output; raw/html_safe marks trusted content and bypasses that encoding. Sanitization helpers are a separate API for user-authored rich HTML.",
    ],
    [
      "laravel",
      "https://laravel.com/framework/docs/13.x/blade#displaying-unescaped-data",
      "Blade {{ }} output is passed through htmlspecialchars; {!! !!} outputs unescaped data. The documentation warns against using unescaped output for user-controlled content.",
    ],
    [
      "proa",
      "https://proa.so/docs/core/escaping",
      "Dynamic template values are encoded for their HTML context, including separate URL policy. UnsafeRaw bypasses output protection; it does not sanitize user-authored rich HTML.",
    ],
    [
      "marko",
      "https://markojs.com/docs/reference/language",
      "Normal text interpolation is escaped; unescaped HTML interpolation is an explicit bypass. The reviewed output contract is not a rich-HTML sanitizer.",
    ],
    [
      "dioxus",
      "https://dioxuslabs.com/learn/0.7/essentials/ui/rsx/",
      "RSX text interpolation renders text; dangerous_inner_html is the explicit raw-HTML bypass. Treat its input as trusted or sanitize it outside the renderer.",
    ],
    [
      "leptos",
      "https://book.leptos.dev/view/01_basic_component.html",
      "view! renders dynamic strings as text; inner_html inserts raw HTML and requires trusted/sanitized input. Rendering text safely does not make untrusted HTML safe.",
    ],
  ])
    set(id, "xssEscaping", "native", note, url);
  for (const [id, base] of [
    ["nextjs", "react"],
    ["tanstack-start", "react"],
    ["nuxt", "vue"],
    ["sveltekit", "svelte"],
    ["solidstart", "solid"],
  ]) {
    const source = evidence[base].xssEscaping;
    set(
      id,
      "xssEscaping",
      "native",
      `Its integrated UI renderer supplies this policy. ${source.note}`,
      source.url,
    );
  }
  rows("php", [
    [
      "xssEscaping",
      "partial",
      "PHP output is not automatically escaped. htmlspecialchars encodes text/attribute values when the application calls it with appropriate flags/encoding; raw echo is not protected, and this is not a rich-HTML sanitizer.",
      "https://www.php.net/manual/en/function.htmlspecialchars.php",
      "Explicit htmlspecialchars",
    ],
  ]);
  rows("rails", [
    [
      "notifications",
      "community",
      "Noticed adds notifier objects with per-recipient and bulk delivery methods, including email, ActionCable, push and messaging providers. It uses ActiveJob and persistence; provider credentials, queue workers and delivery/error policy remain deployment/application responsibilities.",
      "https://github.com/excid3/noticed/blob/0d91fc5a2723d490f251a1dbf3094c16f8d71638/README.md#-delivery-methods",
      "Noticed / ActiveJob",
    ],
    [
      "htmlSanitization",
      "native",
      "Action View sanitize uses the maintained Rails HTML sanitizer with configurable tag/attribute allowlists. Bypassing it with raw/html_safe transfers responsibility to the application.",
      "https://api.rubyonrails.org/classes/ActionView/Helpers/SanitizeHelper.html",
      "Rails HTML sanitizer",
    ],
    [
      "authorization",
      "community",
      "Pundit supplies resource policy classes and authorization helpers. Rails authentication and controller callbacks alone do not enforce resource permissions; applications must call the policies consistently.",
      "https://www.rubydoc.info/gems/pundit",
      "Pundit",
    ],
    [
      "rateLimiting",
      "native",
      "Controller rate_limit defines counts, windows, identity keys and rejection behavior through a cache store. Shared deployment enforcement requires a shared store; this is not enabled for every endpoint automatically.",
      "https://api.rubyonrails.org/classes/ActionController/RateLimiting/ClassMethods.html",
      "Controller rate_limit",
    ],
    [
      "progressiveEnhancement",
      "native",
      "form_with can emit ordinary server POST forms with authenticity tokens and validation responses. Turbo may enhance delivery; a form that only uses browser handlers must retain a real server submission path.",
      "https://guides.rubyonrails.org/form_helpers.html",
      "Native HTML forms",
    ],
    [
      "stateRestoration",
      "official",
      "Turbo Drive caches page snapshots for restoration visits and supports data-turbo-permanent elements. Snapshots are DOM state, not a guarantee to serialize arbitrary JavaScript state; applications must implement lifecycle cleanup.",
      "https://turbo.hotwired.dev/handbook/building",
      "Turbo snapshots",
    ],
    [
      "scrollRestoration",
      "official",
      "Turbo restoration visits restore the recorded page scroll position. This establishes window/document restoration, not arbitrary nested scrollport state.",
      "https://turbo.hotwired.dev/handbook/drive",
      "Turbo Drive",
    ],
    [
      "navigationBlocking",
      "official",
      "turbo:before-visit can cancel an application visit. This does not intercept every browser history restoration or tab close; beforeunload remains a separate browser mechanism.",
      "https://turbo.hotwired.dev/reference/events#turbo-before-visit",
      "Turbo visit events",
    ],
    [
      "navigationAccessibility",
      "official",
      "Turbo documents aria-busy during requests, focus of autofocus elements and updating the document title. It does not promise the same route-announcement/live-region contract as SvelteKit.",
      "https://turbo.hotwired.dev/handbook/drive",
      "Turbo focus / busy state",
    ],
    [
      "scheduling",
      "official",
      "Solid Queue recurring tasks use recurring.yml and a scheduler process. Concurrency/deduplication depends on the queue database and retention; do not interpret a recurring schedule as exactly-once execution.",
      "https://guides.rubyonrails.org/active_job_basics.html#recurring-tasks",
      "Solid Queue",
    ],
    [
      "fieldEncryption",
      "native",
      "Active Record encrypts declared attributes on persistence and decrypts on reads. Deterministic versus nondeterministic encryption changes query/uniqueness behavior; keys, rotation and storage expansion need configuration.",
      "https://guides.rubyonrails.org/active_record_encryption.html",
      "Active Record encryption",
    ],
    [
      "httpTests",
      "native",
      "ActionDispatch integration tests exercise routing/controllers with session/cookies and response assertions in-process; a real network server is not required. Browser/system tests are separate.",
      "https://guides.rubyonrails.org/testing.html#integration-testing",
      "Integration tests",
    ],
  ]);
  const laravel = "https://laravel.com/framework/docs/13.x/";
  rows("laravel", [
    [
      "authorization",
      "native",
      "Gates and resource policies centralize authorization checks and convert denied actions to authorization failures. Authentication does not imply permission; callers must apply the policy.",
      `${laravel}authorization`,
      "Gates / policies",
    ],
    [
      "rateLimiting",
      "native",
      "RateLimiter and throttle middleware provide keyed attempts/time windows through a configured cache store. Distributed enforcement requires shared storage and appropriate atomic operations.",
      `${laravel}rate-limiting`,
      "RateLimiter",
    ],
    [
      "progressiveEnhancement",
      "native",
      "Blade forms submit native HTTP requests with CSRF tokens, validation redirects, old input and error bags. Inertia/other client forms have their own JS requirements and are not used to establish this native Blade behavior.",
      `${laravel}validation`,
      "Blade / validation redirects",
    ],
    [
      "scheduling",
      "native",
      "The scheduler defines recurring jobs/commands; a scheduler runner or cron triggers it. withoutOverlapping and onOneServer use cache locks; distributed execution requires supported shared cache configuration.",
      `${laravel}scheduling`,
      "Task scheduler",
    ],
    [
      "notifications",
      "native",
      "Notification classes select and format mail, database, broadcast, SMS and other channels, optionally queued. Delivery providers and many extra channels are separately configured services/packages.",
      `${laravel}notifications`,
      "Notifications",
    ],
    [
      "searchIndex",
      "official",
      "Scout synchronizes searchable Eloquent models through model observers and offers database and external search drivers. External engines require their own service/configuration; this is more than a raw LIKE query.",
      `${laravel}scout`,
      "Laravel Scout",
    ],
    [
      "fieldEncryption",
      "native",
      "Eloquent encrypted casts encrypt stored attributes and decrypt reads. Encrypted values cannot be queried normally; key rotation/re-encryption and larger storage are application/deployment concerns.",
      `${laravel}eloquent-mutators#encrypted-casting`,
      "Encrypted casts",
    ],
    [
      "httpTests",
      "native",
      "The application test case simulates requests internally and exposes response/JSON, auth, cookie and session assertions. It does not require a running network server; middleware behavior must be considered in tests.",
      `${laravel}http-tests`,
      "HTTP test harness",
    ],
    [
      "stateRestoration",
      "official",
      "Inertia remembers configured local state and preserves component state on selected visits. This requires the Inertia starter-kit/frontend path; ordinary Blade pages do not inherit it automatically.",
      "https://inertiajs.com/remembering-state",
      "Inertia",
    ],
    [
      "scrollRestoration",
      "official",
      "Inertia resets scroll on visits and restores document/marked scroll regions on history navigation; preserveScroll controls exceptions. This belongs to the Inertia frontend, not plain Blade.",
      "https://inertiajs.com/scroll-management",
      "Inertia",
    ],
    [
      "codeSplitting",
      "official",
      "Official Inertia starter kits use Vite page resolution; lazy import page modules can split frontend screens. This applies to the chosen starter kit and its import configuration, not server-rendered Blade alone.",
      "https://inertiajs.com/code-splitting",
      "Inertia / Vite",
    ],
  ]);

  // React Router is an external integration for React, not the new Remix 3 API.
  for (const [id, ownership] of [["react", "community"]]) {
    rows(id, [
      [
        "progressiveEnhancement",
        ownership,
        "React Router framework-mode Form produces a real server submission before JavaScript loads and enhances it afterward. A plain client-only React app has no server action endpoint from React core.",
        "https://reactrouter.com/explanation/progressive-enhancement",
        "React Router framework mode",
      ],
      [
        "requestCancellation",
        ownership,
        "React Router cancels interrupted navigations/fetcher requests and discards stale revalidation responses. The server may still process canceled requests; this is not backend rollback.",
        "https://reactrouter.com/explanation/race-conditions",
        "React Router",
      ],
      [
        "typedLinks",
        ownership,
        "React Router framework type generation and href utilities check registered paths and required route parameters. Framework-mode type generation must run; this is not a React core router.",
        "https://reactrouter.com/how-to/route-module-type-safety",
        "React Router type generation",
      ],
      [
        "stateRestoration",
        ownership,
        "Nested router layouts can preserve mounted parent UI while outlets change. Unmounted route component state is not automatically retained; arbitrary form drafts need URL/session/app storage.",
        "https://reactrouter.com/explanation/state-management",
        "React Router layouts",
      ],
      [
        "scrollRestoration",
        ownership,
        "ScrollRestoration emulates browser restoration after data loads, with custom keys and reset controls. It requires a data/framework router and does not establish automatic nested-scrollport restoration.",
        "https://reactrouter.com/api/components/ScrollRestoration",
        "React Router",
      ],
      [
        "navigationBlocking",
        ownership,
        "useBlocker can pause SPA navigation and let the application proceed/reset after an unsaved-change prompt. Hard reloads and cross-origin navigation require separate browser handling.",
        "https://reactrouter.com/how-to/navigation-blocking",
        "React Router",
      ],
      [
        "codeSplitting",
        ownership,
        "Framework mode splits browser route modules and removes server-only exports. Declarative router usage alone does not enable this build pipeline.",
        "https://reactrouter.com/explanation/code-splitting",
        "React Router framework mode",
      ],
      [
        "a11yChecks",
        ownership,
        "The recommended eslint-plugin-jsx-a11y integration statically checks JSX accessibility patterns. This is an external lint tool, not runtime enforcement or accessibility certification.",
        "https://legacy.reactjs.org/docs/accessibility.html#development-assistance",
        "eslint-plugin-jsx-a11y",
      ],
    ]);
  }
  for (const id of ["react", "nextjs", "tanstack-start"])
    set(
      id,
      "optimisticUi",
      "native",
      "React useOptimistic overlays pending mutation UI and reconciles against the supplied confirmed state through Actions/transitions. Application code must define the update and failure feedback; this is not a durable offline write queue.",
      "https://react.dev/reference/react/useOptimistic",
      "React useOptimistic",
    );
  const next = "https://nextjs.org/docs/app/";
  rows("nextjs", [
    [
      "progressiveEnhancement",
      "native",
      "Server Component forms with Server Actions can submit without JavaScript. Client Component action forms may queue until hydration; onSubmit-only client behavior is not a progressive submission path.",
      `${next}guides/forms`,
      "Server Action forms",
    ],
    [
      "authorization",
      "partial",
      "The data-security guide requires application authorization/ownership checks in each exposed action or DAL. Server Action identifiers, closure encryption and authentication do not constitute a resource-policy engine.",
      `${next}guides/data-security`,
      "Application checks",
    ],
    [
      "typedLinks",
      "native",
      "typedRoutes generates route types used by Link and navigation helpers to check destinations. It does not supply schema validation of arbitrary query strings, and nonliteral constructed paths may require type assertions.",
      `${next}api-reference/config/next-config-js/typedRoutes`,
      "typedRoutes",
    ],
    [
      "stateRestoration",
      "native",
      "Shared layouts preserve state across soft navigation; Cache Components can retain recent pages through React Activity. Retention/eviction and resets are version/configuration dependent and do not guarantee every visited page survives.",
      `${next}guides/preserving-ui-state`,
      "Layouts / Activity",
    ],
    [
      "scrollRestoration",
      "native",
      "Link/navigation controls scroll resets and App Router restores scroll for back/forward visits. scroll=false is an opt-out; this does not promise independent restoration of arbitrary nested scrollers.",
      `${next}api-reference/components/link#scroll`,
      "App Router",
    ],
    [
      "navigationAccessibility",
      "native",
      "Next.js includes route announcements based on title, heading or pathname, and documents accessible page naming. Authors remain responsible for focus behavior and accessible controls.",
      "https://nextjs.org/docs/architecture/accessibility",
      "Route announcer",
    ],
    [
      "a11yChecks",
      "community",
      "The accessibility guide recommends eslint-plugin-jsx-a11y for static JSX checks. It is a separately configured linter; do not infer that every current Next build runs ESLint automatically.",
      "https://nextjs.org/docs/architecture/accessibility",
      "eslint-plugin-jsx-a11y",
    ],
    [
      "codeSplitting",
      "native",
      "App Router splits route code, while next/dynamic and React.lazy defer Client Components. Server Components stay outside browser bundles; lazy importing a Server Component does not itself defer a client runtime.",
      `${next}guides/lazy-loading`,
      "Route bundles / next/dynamic",
    ],
    [
      "offline",
      "partial",
      "The PWA guide demonstrates a service worker and web manifest; production cache strategies/offline data and retry UX remain application-owned. Installing a manifest does not make mutations work offline.",
      `${next}guides/progressive-web-apps`,
      "PWA recipe",
    ],
  ]);
  const ts = "https://tanstack.com/router/latest/docs/guide/";
  rows("tanstack-start", [
    [
      "typedLinks",
      "native",
      "TanStack Router checks route paths, params and navigation destinations from the registered route tree. The registration/type pipeline is required; casting a string can bypass its checks.",
      `${ts}type-safety`,
      "TanStack Router",
    ],
    [
      "searchParams",
      "native",
      "validateSearch parses/validates URL state into typed search values, with schema adapters and explicit malformed-input fallbacks/errors. TypeScript annotations alone are not runtime validation.",
      `${ts}search-params`,
      "validateSearch",
    ],
    [
      "requestCancellation",
      "native",
      "Router loaders receive an AbortController that is canceled when a load is superseded. Loaders must pass its signal into cancelable I/O; server mutations are not rolled back by aborting the browser request.",
      `${ts}data-loading`,
      "Loader abortController",
    ],
    [
      "stateRestoration",
      "native",
      "Persistent nested route components retain parent state while child matches change. Unmounted page state is not a general snapshot service; application/URL state is needed where retention is required.",
      "https://tanstack.com/router/latest/docs/routing/route-trees",
      "Nested route retention",
    ],
    [
      "scrollRestoration",
      "native",
      "Router scroll restoration tracks document and registered scrollable regions and restores before paint. scrollRestoration must be enabled; cache keys and virtualized scrollers may require configuration.",
      `${ts}scroll-restoration`,
      "TanStack Router",
    ],
    [
      "navigationBlocking",
      "native",
      "useBlocker/Blocker can pause navigation for custom confirmation and provide proceed/reset. beforeunload covers browser exits separately and inherits browser restrictions.",
      `${ts}navigation-blocking`,
      "TanStack Router",
    ],
    [
      "codeSplitting",
      "native",
      "The Router build integration automatically splits route components and noncritical exports while leaving matching-critical work available. Correct bundler/plugin configuration and shared chunks affect the output.",
      `${ts}automatic-code-splitting`,
      "Router build plugin",
    ],
  ]);

  const kit = "https://svelte.dev/docs/kit/";
  const kitFacts = [
    [
      "progressiveEnhancement",
      "Form actions support native server POST plus use:enhance. The server submission/validation path works without JavaScript; enhancement supplies pending/reset/update behavior, not a separate endpoint.",
      `${kit}form-actions`,
      "Form actions / use:enhance",
    ],
    [
      "stateRestoration",
      "Snapshots capture/restore configured local state across history traversal, with serialization and sessionStorage limitations. Persistent layouts and snapshot state are distinct; large values and sensitive data need care.",
      `${kit}snapshots`,
      "Snapshots",
    ],
    [
      "scrollRestoration",
      "The client router restores history scroll and controls navigation resets through goto/link options. disableScrollHandling transfers that responsibility to the app; arbitrary nested-scrollport restoration is not established here.",
      `${kit}$app-navigation`,
      "Kit router",
    ],
    [
      "navigationBlocking",
      "beforeNavigate can cancel client navigation and request browser confirmation for document exits. Browser unload prompts are restricted and do not provide arbitrary custom UI.",
      `${kit}$app-navigation#beforeNavigate`,
      "beforeNavigate",
    ],
    [
      "navigationAccessibility",
      "Kit announces route titles through a live region and resets focus after navigation/enhanced forms, with documented exceptions. Authors supply meaningful titles and remain responsible for app accessibility.",
      `${kit}accessibility`,
      "Focus / route announcer",
    ],
    [
      "codeSplitting",
      "Kit builds route-specific browser bundles and loads the code needed for navigation. Shared dependencies and component imports still affect what each page downloads.",
      `${kit}performance`,
      "Route bundles",
    ],
    [
      "offline",
      "Kit bundles/registers an authored service worker and exposes versioned build/static/prerender manifests for caching. The app owns fetch strategies, updates and offline data behavior; server actions still need a server.",
      `${kit}service-workers`,
      "Service-worker integration",
    ],
  ];
  for (const [id, status] of [
    ["sveltekit", "native"],
    ["svelte", "official"],
  ]) {
    for (const [key, note, url, label] of kitFacts)
      set(
        id,
        key,
        status,
        `${id === "svelte" ? "Requires the SvelteKit application framework, not Svelte core. " : ""}${note}`,
        url,
        label,
      );
    set(
      id,
      "a11yChecks",
      "native",
      "The Svelte compiler emits accessibility warnings for detectable markup/ARIA/keyboard patterns. Warnings can be suppressed, and static checks do not establish complete keyboard or screen-reader correctness.",
      "https://svelte.dev/docs/svelte/compiler-warnings",
      "Compiler warnings",
    );
  }

  const astro = "https://docs.astro.build/en/";
  rows("astro", [
    [
      "progressiveEnhancement",
      "native",
      "Actions accept ordinary HTML form POSTs with server validation/results. Client action calls and client-only submit handlers have different JS requirements; preserve the real form action for no-JS submission.",
      `${astro}guides/actions/`,
      "HTML action forms",
    ],
    [
      "lazyActivation",
      "native",
      "client:idle, client:visible and client:media schedule hydration of selected framework islands; client:only omits SSR and is a different behavior. A matching UI integration supplies the component renderer/runtime.",
      `${astro}reference/directives-reference/#client-directives`,
      "Client directives",
    ],
    [
      "codeSplitting",
      "native",
      "Astro's island build ships JavaScript for selected interactive components and shares framework runtimes. Components without client directives emit HTML without a hydration bundle; island dependencies may still be shared.",
      `${astro}guides/framework-components/`,
      "Island bundles",
    ],
    [
      "stateRestoration",
      "native",
      "ClientRouter transition:persist retains selected DOM/components across navigation, optionally preserving props. Persistence must be configured; this is not automatic serialization of all page state.",
      `${astro}guides/view-transitions/#maintaining-state`,
      "transition:persist",
    ],
    [
      "scrollRestoration",
      "native",
      "ClientRouter handles scroll for same-page anchors and back/forward navigation as part of its history lifecycle. Custom swapping/navigation can require application adjustments.",
      `${astro}guides/view-transitions/`,
      "ClientRouter",
    ],
    [
      "navigationAccessibility",
      "native",
      "ClientRouter includes a route announcer and handles focus when swapping pages. Authors must provide meaningful page titles and honor reduced-motion preferences for animated transitions.",
      `${astro}guides/view-transitions/#accessibility`,
      "ClientRouter",
    ],
    [
      "a11yChecks",
      "native",
      "Astro's development toolbar audits rendered pages for selected accessibility issues. These are development diagnostics, not a production guarantee or complete accessibility audit.",
      `${astro}guides/dev-toolbar/#audits`,
      "Dev toolbar audits",
    ],
  ]);
  const vueRouter = "https://router.vuejs.org/guide/";
  for (const [id, ownership] of [
    ["vue", "official"],
    ["nuxt", "native"],
  ]) {
    rows(id, [
      [
        "stateRestoration",
        ownership,
        "Vue KeepAlive can retain selected component instances/state across route switches when composed with RouterView; Nuxt also exposes page keepalive configuration. It is opt-in and limited by include/exclude/cache eviction.",
        id === "nuxt"
          ? "https://nuxt.com/docs/4.x/api/components/nuxt-page"
          : `${vueRouter}advanced/router-view-slot.html`,
        "KeepAlive",
      ],
      [
        "scrollRestoration",
        ownership,
        "Vue Router scrollBehavior receives saved positions for history traversal and lets the app return scrolling behavior. Nuxt configures it through its router integration; the app can customize it.",
        `${vueRouter}advanced/scroll-behavior.html`,
        "Vue Router",
      ],
      [
        "navigationBlocking",
        ownership,
        "Navigation guards can return false or prompt before leaving a route, including in-component beforeRouteLeave. Full-document unload is a separate browser mechanism.",
        `${vueRouter}advanced/navigation-guards.html`,
        "Vue Router guards",
      ],
    ]);
  }
  rows("vue", [
    [
      "lazyActivation",
      "native",
      "Vue 3.5 async components accept hydration strategies such as visibility, idle, media query and interaction; interaction hydration can replay the triggering event. Async component loading and SSR hydration timing are separate controls.",
      "https://vuejs.org/guide/components/async.html#lazy-hydration",
      "Async hydration strategies",
    ],
    [
      "requestCancellation",
      "partial",
      "onWatcherCleanup lets an authored watcher abort its prior fetch when its source changes. The application must create/pass AbortController and register cleanup; Vue does not automatically cancel arbitrary requests.",
      "https://vuejs.org/guide/essentials/watchers.html#side-effect-cleanup",
      "Watcher cleanup recipe",
    ],
  ]);
  rows("nuxt", [
    [
      "rateLimiting",
      "community",
      "nuxt-security supplies rate-limiter middleware and a configurable unstorage driver. The default LRU store is process-local; use an appropriate shared driver for distributed limits.",
      "https://nuxt-security.vercel.app/middleware/rate-limiter",
      "nuxt-security",
    ],
    [
      "typedLinks",
      "partial",
      "Typed page route generation is an experimental/configuration-dependent option in the reviewed Nuxt 4 routing guide. It is not equivalent to validation of all arbitrary query values.",
      "https://nuxt.com/docs/4.x/guide/going-further/experimental-features#typedpages",
      "Experimental typedPages",
    ],
    [
      "lazyActivation",
      "native",
      "Nuxt documents lazy hydration triggers for delayed interactive components, built on Vue's hydration strategies. The selected trigger controls activation; this does not imply every component's code is withheld until then.",
      "https://nuxt.com/docs/4.x/api/utils/define-lazy-hydration-component",
      "Lazy hydration",
    ],
    [
      "codeSplitting",
      "native",
      "Nuxt splits pages automatically and supports lazy component imports. Shared dependencies and auto-import usage still influence the chunks sent to a page.",
      "https://nuxt.com/docs/4.x/guide/concepts/auto-imports",
      "Page / component bundles",
    ],
    [
      "requestCancellation",
      "native",
      "useAsyncData/useFetch expose dedupe/cancel behavior and an AbortSignal for a cancelable handler. The handler must propagate cancellation to its underlying work; this cannot undo completed server mutations.",
      "https://nuxt.com/docs/4.x/api/composables/use-async-data",
      "useAsyncData",
    ],
    [
      "navigationAccessibility",
      "native",
      "NuxtRouteAnnouncer provides route announcements when included in the application. It is an explicit component rather than proof that every Nuxt app manages focus correctly.",
      "https://nuxt.com/docs/4.x/api/components/nuxt-route-announcer",
      "NuxtRouteAnnouncer",
    ],
    [
      "a11yChecks",
      "official",
      "@nuxt/a11y adds axe-core accessibility audits in Nuxt DevTools. The reviewed module is alpha and optional; diagnostics are not a conformance certificate.",
      "https://nuxt.com/modules/a11y",
      "@nuxt/a11y",
    ],
    [
      "httpTests",
      "official",
      "@nuxt/test-utils provides runtime and end-to-end helpers including server fetch against a test Nuxt app. Tests that start a server have a different boundary/cost from in-process Laravel request simulation.",
      "https://nuxt.com/docs/4.x/getting-started/testing",
      "@nuxt/test-utils",
    ],
  ]);

  rows("proa", [
    [
      "a11yChecks",
      "native",
      "The HTML compiler checks statically visible accessibility requirements, including required attributes and supported ARIA contracts. Runtime focus/contrast and cross-component context still need integration checks; these diagnostics do not certify accessibility.",
      "https://proa.so/docs/guides/accessibility",
      "Compile-time checks",
    ],
    [
      "progressiveEnhancement",
      "official",
      "The documented native HTML form submits to an explicit Axum handler that validates and writes data. This path works without client handlers; RSJS actions enhance controls but are not generated server RPC or automatic form rollback.",
      "https://proa.so/docs/guides/forms-actions",
      "Native forms / Axum",
    ],
    [
      "lazyActivation",
      "native",
      "RSJS final owners activate immediately or on visible, idle, interaction or media triggers. Server HTML is present first; runtime planning decides owner assets and query wiring. A delayed strategy is not a claim of zero browser runtime.",
      "https://proa.so/docs/rsjs/hydration",
      "RSJS strategies",
    ],
    [
      "codeSplitting",
      "native",
      "RSJS emits linked per-owner island modules, and a page runtime plan selects modules for rendered owners. Shared runtime dependencies may be needed; this differs from route-level SPA chunking.",
      "https://proa.so/docs/rsjs/runtime",
      "RSJS owner modules",
    ],
    [
      "optimisticUi",
      "undocumented",
      "The reviewed query/mutation guide establishes pending/error state and invalidation, but not an optimistic overlay with reconciliation/rollback. An authored signal update alone is not evidence of that contract.",
      "https://proa.so/docs/rsjs/queries-mutations",
    ],
    [
      "requestCancellation",
      "undocumented",
      "The reviewed query/mutation guide does not establish the cancellation or stale-result suppression contract for superseded requests. Pending state and keyed queries alone do not prove it.",
      "https://proa.so/docs/rsjs/queries-mutations",
    ],
    [
      "htmlSanitization",
      "undocumented",
      "The reviewed escaping API encodes output and offers UnsafeRaw, but does not establish a maintained allowlist-based sanitizer. UnsafeRaw is a trust bypass, not a way to clean untrusted rich HTML.",
      "https://proa.so/docs/core/escaping",
    ],
  ]);
  for (const key of [
    "stateRestoration",
    "scrollRestoration",
    "navigationBlocking",
    "navigationAccessibility",
  ]) {
    const source = evidence.rails[key];
    set(
      "proa",
      key,
      "community",
      `Requires the documented optional Turbo integration, not Proa's plain document navigation. ${source.note}`,
      source.url,
      source.label,
    );
  }

  rows("solid", [
    [
      "optimisticUi",
      "partial",
      "createResource.mutate supports a local optimistic value; application code owns confirmed-state reconciliation, failure rollback and overlapping mutations. This is weaker than an automatic mutation reconciliation contract.",
      "https://docs.solidjs.com/reference/basic-reactivity/create-resource",
      "Resource mutate / app rollback",
    ],
  ]);
  rows("solidstart", [
    [
      "codeSplitting",
      "native",
      "SolidStart's file router loads route components through lazy imports, and its build emits route/client chunks plus shared dependencies. This is an integrated route boundary, not just the availability of JavaScript import().",
      "https://github.com/solidjs/solid-start/blob/903f0769db6538be9dc7985f0a176d2d415ad16f/packages/start/src/router.tsx",
      "File route chunks",
    ],
    [
      "optimisticUi",
      "partial",
      "Solid resource mutation/submission APIs let the application display optimistic data, but confirmation, rollback and overlapping mutations need application logic.",
      "https://docs.solidjs.com/solid-router/concepts/actions",
      "Application reconciliation",
    ],
  ]);
  rows("dioxus", [
    [
      "typedLinks",
      "official",
      "The Routable derive generates typed route variants and parameters used by Link/navigation. A string URL can bypass that typed route API; Router is an optional package.",
      "https://dioxuslabs.com/learn/0.7/essentials/router/routes/",
      "dioxus-router / Routable",
    ],
    [
      "requestCancellation",
      "native",
      "use_resource reruns reactive asynchronous work and exposes cancellation/restart. Fetch cancellation depends on the future/transport; canceling UI work does not roll back a remote mutation.",
      "https://docs.rs/dioxus-hooks/latest/dioxus_hooks/fn.use_resource.html",
      "use_resource",
    ],
  ]);
  rows("leptos", [
    [
      "progressiveEnhancement",
      "official",
      "ActionForm maps server functions to a native form submission and enhances it when hydrated. Input types/encoding must support form submission; browser-only events do not supply a no-JS fallback.",
      "https://book.leptos.dev/progressive_enhancement/action_form.html",
      "leptos_router ActionForm",
    ],
    [
      "searchParams",
      "official",
      "Params-derived query structs parse search values into typed Results; applications handle malformed values and defaults. Reading a raw ParamsMap is a separate, less constrained API.",
      "https://book.leptos.dev/router/18_params_and_queries.html",
      "leptos_router Params",
    ],
    [
      "optimisticUi",
      "native",
      "Actions expose input/pending/value and the book demonstrates deriving optimistic state from pending submissions. Application code still chooses merge/error behavior; a pending flag alone is not an optimistic update.",
      "https://book.leptos.dev/async/13_actions.html",
      "Actions / pending input",
    ],
    [
      "codeSplitting",
      "official",
      "The official lazy_routes example uses LazyRoute and cargo leptos watch --split to load route-specific browser WASM/code. It requires the opt-in split toolchain and is distinct from enabling islands; shared code and toolchain support constrain the resulting chunks.",
      "https://github.com/leptos-rs/leptos/tree/5a6d608297486da55901ae32f493fb28db18f3fc/examples/lazy_routes",
      "Router / cargo-leptos",
    ],
  ]);
  const exact =
    "https://github.com/expo/exact/blob/94b8671f70fe2e25b307a40e7fce66dc27c9f802/";
  rows("exact", [
    [
      "stateRestoration",
      "native",
      "Contract navigation stacks retain covered screens mounted with their state. This establishes in-session retained screens, not durable restoration after reload, process restart or eviction.",
      `${exact}docs/contract-for-humans.md#navigation-and-documents`,
      "Retained route stacks",
    ],
    [
      "optimisticUi",
      "native",
      "The data module can export an overlay for a resource to show a pending write before its mutation reply; refreshes re-reads confirmed data. The application defines the overlay and domain-error policy.",
      `${exact}docs/contract-for-agents.md#optimistic-writes-the-overlay`,
      "Resource overlay",
    ],
    [
      "typedLinks",
      "partial",
      "The guide documents named routes and path(name, params) construction, but does not establish compile-time checks of every destination name and required URL parameter. A path helper alone does not meet the typed-link contract.",
      `${exact}docs/contract-for-humans.md#navigation-and-documents`,
      "Named path helper",
    ],
    [
      "navigationAccessibility",
      "undocumented",
      "Contract exposes roles, accessible names and focus commands, but the reviewed navigation guide does not establish automatic browser route announcements/focus reset. Native platform accessibility mapping is a different claim.",
      `${exact}docs/contract-for-humans.md#navigation-and-documents`,
    ],
  ]);
  // Remix 3 is reviewed on its own APIs; do not borrow React Router claims.
  rows("rails", [
    [
      "searchIndex",
      "community",
      "Searchkick adds model search_data, reindexing and inline, queued, async or manual synchronization with Elasticsearch/OpenSearch. It requires a separate search service; association updates are not automatically synchronized and may need explicit reindex callbacks.",
      "https://github.com/ankane/searchkick/blob/3ded578f28992070317dd168f28256f876a23757/README.md#strategies",
      "Searchkick / external search service",
    ],
  ]);
  rows("remix", [
    [
      "xssEscaping",
      "native",
      "remix/html-template escapes interpolated values and composes branded SafeHtml without double escaping. html.raw is an explicit trusted-output bypass; this HTML-encoding policy does not establish arbitrary script/URL safety or rich-HTML sanitization.",
      "https://docs.remix.run/api/html-template/",
      "HTML templates / trusted raw bypass",
    ],
    [
      "typedLinks",
      "native",
      "Typed route maps expose href construction with route parameter inference for links and form destinations. This is Remix 3's Fetch/router API, not React Router type generation.",
      "https://docs.remix.run/api/router/#links-and-form-actions",
      "Typed route maps",
    ],
    [
      "progressiveEnhancement",
      "native",
      "The router guide demonstrates ordinary HTML forms posted to server handlers, followed by useful HTML responses. Enhanced component forms are separate; a browser-only handler must not replace the real submission path if no-JS behavior is required.",
      "https://docs.remix.run/api/router/#links-and-form-actions",
      "Native form handlers",
    ],
    [
      "httpTests",
      "native",
      "Fetch-style handlers can be called with Request objects and their Responses asserted without an HTTP listener. This is the documented Fetch-handler boundary, not an attributed Rails-style session test DSL.",
      "https://docs.remix.run/testing/",
      "Fetch handler tests",
    ],
  ]);

  // Narrow broad rows with explicit API-depth assessments, without changing their counts.
  const assess = (id, key, summary, strengths, tradeoffs) => {
    evidence[id][key] = {
      ...evidence[id][key],
      reviewedOn: expandedReviewedOn,
      assessment: { summary, strengths, tradeoffs },
    };
  };
  for (const id of Object.keys(evidence)) {
    if (
      ["native", "official", "community", "partial"].includes(
        evidence[id].forms.status,
      )
    )
      assess(
        id,
        "forms",
        "Form transport, validation, pending feedback and optimistic state are separate behaviors; the progressive-forms and optimistic-updates rows review the latter contracts explicitly.",
        [evidence[id].forms.note],
        [
          "Do not infer a no-JavaScript submission path, automatic validation, accessible field errors or rollback merely from the ability to receive FormData.",
        ],
      );
    if (["native", "official", "community"].includes(evidence[id].orm.status))
      assess(
        id,
        "orm",
        "An ORM/query API establishes a data-access surface, not identical relationship loading, N+1 detection, migration or encryption behavior.",
        [evidence[id].orm.note],
        [
          "Review eager loading, query counts and transaction semantics for the selected driver. Schema migrations, transactions and encrypted fields are compared separately.",
        ],
      );
  }
  assess(
    "laravel",
    "orm",
    "Eloquent integrates model relationships, explicit eager loading and opt-in detection of accidental lazy loading.",
    [
      "Relationship queries and with/load can avoid common N+1 patterns.",
      "preventLazyLoading can reject or report accidental lazy relationships during development.",
    ],
    [
      "These are configured behaviors, not a guarantee of optimal queries. Application code must choose eager loading and examine emitted SQL.",
    ],
  );
  assess(
    "rails",
    "orm",
    "Active Record integrates relationships and eager loading, with strict loading to catch unintended lazy association queries.",
    [
      "includes/preload/eager_load support different association loading strategies.",
      "Strict loading can expose accidental lazy loads.",
    ],
    [
      "Joins, batching and query behavior differ by strategy/adapter. An ORM checkmark does not promise the absence of N+1 queries.",
    ],
  );
  assess(
    "nextjs",
    "serverHosting",
    "Self-hosting is supported, with explicit requirements for streaming and consistent multi-instance deployments.",
    [
      "A production Next server can run the framework's server features without requiring Vercel.",
      "deploymentId detects version skew; custom cache handlers can use shared storage.",
    ],
    [
      "Rolling deployments need compatible assets/action encryption keys and deployment IDs.",
      "Shared cache/tag invalidation and proxy buffering need configuration; a container alone does not supply this coordination.",
    ],
  );
  assess(
    "nextjs",
    "environment",
    "Environment visibility and enforced server-only import boundaries are separate safeguards.",
    [
      "Unprefixed environment values remain server-only by default; NEXT_PUBLIC values are public.",
      "server-only imports produce a build error when consumed by client code.",
    ],
    [
      "Explicitly returned props/action results can still leak sensitive data. Authorization and minimal DTOs remain application responsibilities.",
    ],
  );
  for (const id of ["svelte", "sveltekit"])
    assess(
      id,
      "environment",
      "SvelteKit separates private environment/server modules from code imported into browser builds.",
      [
        "Private environment modules and .server files are guarded against client imports.",
      ],
      [
        "Values intentionally serialized by server load/functions can still be disclosed. Import guards do not replace authorization or output review.",
      ],
    );
  assess(
    "proa",
    "environment",
    "Only analyzed RSJS client graphs become JavaScript; runtime configuration and serialization policy remain explicit application work.",
    [
      "The documented server-only boundary keeps ordinary server implementation out of browser modules.",
    ],
    [
      "The application must validate environment configuration and select safe browser props/query seeds. A typed value can still contain a secret.",
    ],
  );
}
