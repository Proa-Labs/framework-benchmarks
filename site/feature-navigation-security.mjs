// Follow-up review, separate from the original Nov 10 capability inventory.
export const navigationSecurityReviewedOn = "2026-11-11";

export function addNavigationSecurityEvidence(evidence) {
  const set = (id, key, status, note, url, label) => {
    evidence[id][key] = {
      status,
      note,
      url,
      reviewedOn: navigationSecurityReviewedOn,
      ...(label ? { label } : {}),
    };
  };
  for (const [id, entry] of Object.entries(evidence)) {
    const standalone = entry.routing.status === "scope";
    for (const key of ["softNavigation", "viewTransitions"])
      set(
        id,
        key,
        standalone ? "scope" : "undocumented",
        standalone
          ? "This standalone template/runtime renders content; navigation and page-transition lifecycle belong to a browser router or host application. Compatibility with a generic JavaScript library is not a built-in integration."
          : "The reviewed routing API does not establish this navigation capability. Application code or another package may provide it; this finding is not proof of absence.",
        entry.routing.url,
      );
    set(
      id,
      "cspNonce",
      entry.csp.status === "scope" || id === "php" ? "scope" : "undocumented",
      entry.csp.status === "scope" || id === "php"
        ? "The HTTP application must generate a fresh nonce, set its policy and pass the value to authored tags. A template accepting attributes does not coordinate nonces for an application."
        : "The reviewed security/rendering API does not establish coordinated per-response CSP nonces for generated scripts and styles. Hash-based CSP and application-authored headers are different mechanisms.",
      entry.csp.url,
    );
  }

  const exactDocs =
    "https://github.com/expo/exact/blob/94b8671f70fe2e25b307a40e7fce66dc27c9f802/docs/contract-for-humans.md#navigation-and-documents";
  set(
    "exact",
    "softNavigation",
    "native",
    "Contract routes and push/back/go manage retained screens; navigate= receives link clicks and browser-history locations from the web host. Covered entries stay mounted with their state. This is client navigation, separate from server HTTP-route support.",
    exactDocs,
    "Retained route stacks",
  );
  set(
    "exact",
    "viewTransitions",
    "undocumented",
    "The reviewed Contract guide documents authored component animation and native iOS modal presentation, but does not establish an animated browser page-navigation integration. Those are separate from retained-screen navigation.",
    exactDocs,
  );
  set(
    "react",
    "prefetch",
    "community",
    "React Router Link prefetch can load route data/modules on intent (hover/focus), render or viewport entry. It requires a configured router/framework mode; React core alone does not prefetch navigation destinations.",
    "https://reactrouter.com/api/components/Link#prefetch",
    "React Router",
  );
  set(
    "proa",
    "prefetch",
    "community",
    "The documented optional Turbo integration prefetches eligible links on hover and supports explicit preloads. Plain rel=prefetch is a browser hint, not a Proa scheduler; Turbo must be installed separately.",
    "https://proa.so/docs/framework/linking",
    "Turbo Drive",
  );
  set(
    "laravel",
    "prefetch",
    "official",
    "Inertia Link in Laravel's official Inertia starter-kit workflow can prefetch page visits on hover or click. This is frontend Inertia behavior, not automatic prefetching for plain Blade anchors.",
    "https://inertiajs.com/",
    "Inertia starter kits",
  );
  const turbo = "https://turbo.hotwired.dev/handbook/drive";
  set(
    "rails",
    "softNavigation",
    "official",
    "Turbo Drive intercepts eligible links/forms, fetches HTML and replaces page content without a full document reload. It maintains browser history and supports permanent elements; apps must follow Turbo's visit lifecycle.",
    turbo,
    "Turbo Drive",
  );
  set(
    "proa",
    "softNavigation",
    "community",
    "The documented Turbo Drive integration enhances ordinary server-rendered anchors with HTML swaps and browser history. Turbo is installed separately; normal document navigation remains the baseline.",
    "https://proa.so/docs/framework/linking",
    "Turbo Drive integration",
  );
  for (const [id, status] of [
    ["rails", "official"],
    ["proa", "community"],
  ])
    set(
      id,
      "viewTransitions",
      status,
      "Turbo Drive can start browser View Transitions when both documents opt in with the view-transition meta tag. CSS controls the animation; unsupported browsers continue ordinary Turbo navigation. Apps must honor reduced-motion preferences.",
      `${turbo}#view-transitions`,
      "Turbo Drive",
    );
  set(
    "nextjs",
    "softNavigation",
    "native",
    "App Router Link/router navigation updates the URL and replaces route segments without a full reload. Shared layouts stay mounted; loading UI and prefetching can cover server waits, but do not guarantee a latency target.",
    "https://nextjs.org/docs/app/getting-started/linking-and-navigating",
    "App Router",
  );
  set(
    "nextjs",
    "viewTransitions",
    "partial",
    "Next.js documents an experimental React View Transitions integration. This review does not treat that experimental flag as a stable, automatically animated navigation API; application boundaries, CSS and browser support still matter.",
    "https://nextjs.org/blog/next-15-2#react-view-transitions-experimental",
    "Experimental integration",
  );
  set(
    "astro",
    "softNavigation",
    "native",
    "Opt-in ClientRouter intercepts internal navigation, swaps HTML and updates history. Persistent elements and lifecycle events are supported; scripts and islands must follow the documented navigation lifecycle.",
    "https://docs.astro.build/en/guides/view-transitions/",
    "ClientRouter",
  );
  set(
    "astro",
    "viewTransitions",
    "native",
    "ClientRouter and transition directives coordinate page/shared-element animations and persistence. Browser support, fallback behavior and reduced-motion preferences affect the result; the feature is opt-in.",
    "https://docs.astro.build/en/guides/view-transitions/",
    "astro:transitions",
  );
  set(
    "nuxt",
    "softNavigation",
    "native",
    "NuxtLink and the integrated router update pages/history without a full reload. Internal links are prefetched according to the configured policy; external links and explicit reloads retain document navigation.",
    "https://nuxt.com/docs/4.x/getting-started/routing",
    "NuxtLink / Vue Router",
  );
  set(
    "nuxt",
    "viewTransitions",
    "native",
    "pageTransition/layoutTransition coordinate Vue enter/leave animations across navigation. Native browser View Transitions are a separate experimental option, not required for the stable page-transition API. Authors supply CSS and reduced-motion treatment.",
    "https://nuxt.com/docs/4.x/getting-started/transitions",
    "Page / layout transitions",
  );
  set(
    "vue",
    "softNavigation",
    "official",
    "Vue Router intercepts RouterLink navigation and updates the matched view and browser history without a document reload. Server deployment must still support direct URLs.",
    "https://router.vuejs.org/guide/",
    "Vue Router",
  );
  set(
    "vue",
    "viewTransitions",
    "official",
    "The official RouterView slot composes with Vue Transition for route enter/leave animations, route metadata and transition modes. Authors provide CSS and reduced-motion behavior.",
    "https://router.vuejs.org/guide/advanced/transitions.html",
    "Vue Router + Transition",
  );
  const kitNavigation = "https://svelte.dev/docs/kit/$app-navigation";
  for (const [id, status] of [
    ["svelte", "official"],
    ["sveltekit", "native"],
  ]) {
    set(
      id,
      "softNavigation",
      status,
      "SvelteKit enhances internal links and goto() with client-side page navigation, URL/history updates and persistent layouts. data-sveltekit-reload opts back into full document navigation.",
      "https://svelte.dev/docs/kit/link-options",
      "SvelteKit router",
    );
    set(
      id,
      "viewTransitions",
      status,
      "SvelteKit onNavigate waits for an application callback before committing navigation, explicitly supporting document.startViewTransition. This is a lifecycle integration, not a bundled animation preset; CSS, feature detection and reduced-motion behavior are application-owned.",
      `${kitNavigation}#onNavigate`,
      "onNavigate integration",
    );
  }
  set(
    "react",
    "softNavigation",
    "community",
    "React Router Link/useNavigate and router providers support browser history and navigation without document reloads. React core alone does not provide a router.",
    "https://reactrouter.com/start/declarative/navigating",
    "React Router",
  );
  set(
    "react",
    "viewTransitions",
    "community",
    "React Router integrates animated navigation with browser View Transitions. Current v8 docs deprecate the Link viewTransition option in favor of React ViewTransition; choose a compatible React/router version. Styling and reduced-motion handling remain application-owned.",
    "https://reactrouter.com/how-to/view-transitions",
    "React Router",
  );
  const tanstackNavigation =
    "https://tanstack.com/router/latest/docs/guide/navigation";
  set(
    "tanstack-start",
    "softNavigation",
    "native",
    "The integrated TanStack Router updates route UI and browser history without a reload; reloadDocument explicitly requests document navigation. Pending state, loaders and preloading have separate controls.",
    tanstackNavigation,
    "TanStack Router",
  );
  set(
    "tanstack-start",
    "viewTransitions",
    "native",
    "Router viewTransition/defaultViewTransition coordinate document.startViewTransition during navigation, including transition types. It is opt-in and depends on browser support; animation CSS and reduced-motion behavior remain app-owned.",
    "https://tanstack.com/router/latest/docs/framework/react/examples/view-transitions",
    "TanStack Router",
  );
  for (const [id, status] of [
    ["solid", "official"],
    ["solidstart", "native"],
  ])
    set(
      id,
      "softNavigation",
      status,
      "Solid Router's delegated link handling and navigation primitives update route content and browser history without a full reload. Explicit link/reload controls determine which anchors are intercepted.",
      "https://docs.solidjs.com/solid-router/reference/components/router",
      "Solid Router",
    );
  set(
    "dioxus",
    "softNavigation",
    "official",
    "dioxus-router Link/Navigator update internal routed UI and history without fetching a new document. External navigation can leave the application; the router also serves non-browser targets.",
    "https://dioxuslabs.com/learn/0.7/essentials/router/navigation",
    "dioxus-router",
  );
  set(
    "leptos",
    "softNavigation",
    "official",
    "leptos_router enhances local links, changes routes/history and updates the route outlet in the browser without a document reload.",
    "https://book.leptos.dev/router/16_routes.html",
    "leptos_router",
  );
  set(
    "leptos",
    "viewTransitions",
    "official",
    "Routes/FlatRoutes expose a transition flag to coordinate the browser View Transition API during navigation. Browser support and application CSS determine the animation; asynchronous UI Transition is a separate concept.",
    "https://docs.rs/leptos_router/latest/leptos_router/components/struct.FlatRoutesProps.html",
    "leptos_router transition",
  );
  set(
    "remix",
    "softNavigation",
    "native",
    "Remix 3.1's run() runtime handles eligible links/forms as frame navigation and reconciles server HTML, with navigation/scroll/focus handling. This is the new Remix frame runtime, not Remix v2's React Router integration.",
    "https://docs.remix.run/api/component/",
    "Remix 3 frames",
  );
  set(
    "remix",
    "viewTransitions",
    "undocumented",
    "Remix 3.1 documents component enter/exit/list animation helpers, but the reviewed guide does not establish a coordinated page-navigation animation API. Remix v2 React Router viewTransition examples do not establish support in Remix 3.",
    "https://docs.remix.run/animation/",
  );
  set(
    "laravel",
    "softNavigation",
    "official",
    "Official React/Vue/Svelte starter kits integrate Inertia for SPA-style visits to server-owned routes. This requires the Inertia frontend; native Blade links alone remain document navigation.",
    "https://laravel.com/framework/docs/13.x/starter-kits",
    "Inertia starter kits",
  );
  set(
    "topcoat",
    "softNavigation",
    "planned",
    "Client-side navigation is an unchecked roadmap item in the reviewed 0.3.1 README, rather than a shipped navigation integration.",
    "https://docs.rs/crate/topcoat/0.3.1/source/README.md",
  );

  for (const id of [
    "proa",
    "nextjs",
    "rails",
    "leptos",
    "marko",
    "react",
    "svelte",
  ])
    set(
      id,
      "cspNonce",
      evidence[id].csp.status,
      evidence[id].csp.note,
      evidence[id].csp.url,
      evidence[id].csp.label,
    );
  set(
    "proa",
    "cspNonce",
    "native",
    "Opt-in strict CSP generates a fresh 128-bit nonce per response and applies it to framework bootstraps, import maps and streaming scripts. Authored scripts must use the request nonce too; nonce-bearing HTML must not be reused as a shared cached response.",
    "https://proa.so/docs/framework/security-headers",
    "Strict CSP / streaming nonces",
  );
  set(
    "nextjs",
    "cspNonce",
    "native",
    "The application generates a nonce and matching CSP header; Next applies it to framework-generated scripts and supports nonce props. Per-request nonces require dynamic rendering and limit static generation, ISR and partial-prerendered shells.",
    "https://nextjs.org/docs/app/guides/content-security-policy",
    "Dynamic rendering required",
  );
  set(
    "rails",
    "cspNonce",
    "native",
    "Rails supplies a configurable nonce generator, nonce directives and script/style tag helpers under its CSP policy. Applications choose a cryptographically random per-response generator and pass nonce values to authored tags.",
    "https://guides.rubyonrails.org/security.html#content-security-policy",
    "CSP nonce generator / tag helpers",
  );
  set(
    "sveltekit",
    "cspNonce",
    "native",
    "Configured CSP uses nonces for dynamic pages in auto mode and hashes for prerendered pages. Generated inline scripts/styles are coordinated, with %sveltekit.nonce% for authored app.html tags. Nonces on prerendered pages are forbidden.",
    "https://svelte.dev/docs/kit/@sveltejs-kit-vite#csp",
    "CSP nonce / auto mode",
  );
  evidence.sveltekit.csp = {
    ...evidence.sveltekit.cspNonce,
    label: "CSP configuration",
  };
  set(
    "solid",
    "cspNonce",
    "partial",
    "Solid's server renderers accept a nonce for hydration scripts, but the host must generate it, set the policy and cover other inline sources. A supplied renderer nonce is less than automatic application-wide enforcement.",
    "https://docs.solidjs.com/reference/rendering/render-to-string",
    "Renderer nonce option",
  );
  set(
    "solidstart",
    "cspNonce",
    "native",
    "The official security guide supplies a middleware recipe for generating a random nonce and matching HTTP policy. createHandler's nonce option coordinates generated renderer scripts. Apps own middleware installation and policy coverage; v2's JSON serialization avoids unsafe-eval.",
    "https://docs.solidjs.com/solid-start/v2/guides/security",
    "Configured createHandler nonce",
  );
  set(
    "tanstack-start",
    "cspNonce",
    "native",
    "Router ssr.nonce lets generated SSR tags carry an application-supplied request nonce; HeadContent also applies it to inlined styles. The application must generate the nonce and matching CSP response header.",
    "https://tanstack.com/start/latest/docs/framework/react/guide/css-styling",
    "SSR nonce option",
  );
  evidence["tanstack-start"].csp = {
    ...evidence["tanstack-start"].cspNonce,
    label: "Application-configured CSP",
  };
  set(
    "nuxt",
    "cspNonce",
    "community",
    "nuxt-security coordinates random request nonces and strict CSP for SSR; static output uses hashes instead. The module is maintained outside Nuxt core and must be installed/configured.",
    "https://nuxt-security.vercel.app/advanced/strict-csp",
    "nuxt-security",
  );
  evidence.nuxt.csp = {
    ...evidence.nuxt.cspNonce,
    label: "nuxt-security headers",
  };
  set(
    "laravel",
    "cspNonce",
    "partial",
    "Vite::useCspNonce generates or accepts a nonce for Vite-emitted asset tags. Applications must set the matching response policy and nonce any other inline or streaming scripts; this is asset-tag coverage, not automatic coverage of every source.",
    "https://laravel.com/framework/docs/13.x/vite#content-security-policy-csp-nonce",
    "Vite asset-tag nonces",
  );
  set(
    "astro",
    "cspNonce",
    "undocumented",
    "Astro's reviewed CSP integration coordinates script/style hashes in a meta policy. It does not establish a per-response nonce pipeline for generated scripts; the hash-based CSP capability is recorded in its own row.",
    "https://docs.astro.build/en/reference/configuration-reference/#securitycsp",
    "Hash-based CSP instead",
  );
}
