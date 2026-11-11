import { features } from "./feature-schema.mjs";

const backend = features.filter((feature) =>
  ["database", "backend"].includes(feature.group),
);
export function addBackendEvidence(evidence, projects) {
  for (const [id, entry] of Object.entries(evidence)) {
    const project = projects.find((item) => item.id === id);
    const standalone =
      ["Template engine", "UI library", "Native templates"].includes(
        project?.kind,
      ) || ["vue", "svelte"].includes(id);
    for (const feature of backend) {
      entry[feature.id] ??= {
        status: standalone ? "scope" : "undocumented",
        note: standalone
          ? `${feature.label} belongs to a server framework or external service, outside this standalone rendering API. This is not a missing template-rendering capability.`
          : `The reviewed framework documentation does not establish an owned ${feature.label.toLowerCase()} API. Host libraries and application integrations may provide it.`,
        url: project?.homepage || "https://proa.so/docs",
      };
    }
  }
  const set = (id, key, status, note, url, label) => {
    evidence[id][key] = { status, note, url, ...(label ? { label } : {}) };
  };
  const rails = "https://guides.rubyonrails.org/";
  for (const [key, path, note, label] of [
    [
      "orm",
      "active_record_basics.html",
      "Active Record supplies relational models, associations, validations and a query API.",
      "Active Record",
    ],
    [
      "migrations",
      "active_record_migrations.html",
      "Versioned migrations apply/roll back schema changes and track schema history through Rails tasks.",
      "Active Record migrations",
    ],
    [
      "transactions",
      "active_record_querying.html",
      "Active Record transactions group writes atomically and roll back on failure; adapter/database semantics still apply.",
      "Active Record",
    ],
    [
      "jobs",
      "active_job_basics.html",
      "Active Job supplies queue adapters, dispatch, retries and failure handling. Solid Queue is the default durable backend in new Rails applications.",
      "Active Job / Solid Queue",
    ],
    [
      "mail",
      "action_mailer_basics.html",
      "Action Mailer integrates mail templates, delivery configuration and queued delivery through Active Job.",
      "Action Mailer",
    ],
    [
      "uploads",
      "active_storage_overview.html",
      "Active Storage attaches uploads to models, manages local/cloud services and supports direct uploads and variants.",
      "Active Storage",
    ],
    [
      "realtime",
      "action_cable_overview.html",
      "Action Cable integrates WebSocket connections, channels and pub/sub adapters with the Rails application.",
      "Action Cable",
    ],
  ])
    set("rails", key, "native", note, rails + path, label);
  set(
    "php",
    "transactions",
    "official",
    "PDO supports beginTransaction, commit and rollBack through installed database drivers. Driver/database limitations apply.",
    "https://www.php.net/manual/en/pdo.transactions.php",
    "PDO",
  );
  set(
    "php",
    "uploads",
    "partial",
    "PHP parses multipart uploads into temporary files and exposes move_uploaded_file. Validation, persistent storage policy and cloud adapters remain application-owned.",
    "https://www.php.net/manual/en/features.file-upload.php",
    "Native multipart files",
  );
  set(
    "php",
    "mail",
    "partial",
    "mail() submits messages to a configured transport. It does not supply templated mailables, durable queues or delivery guarantees.",
    "https://www.php.net/manual/en/function.mail.php",
    "mail() transport",
  );
  set(
    "dioxus",
    "uploads",
    "partial",
    "Fullstack server functions accept FileStream upload arguments. A durable file/storage lifecycle is not supplied by this transport alone.",
    "https://dioxuslabs.com/learn/0.7/essentials/fullstack/server_functions",
    "FileStream transport",
  );
  set(
    "nextjs",
    "uploads",
    "partial",
    "Server Actions and route handlers can receive FormData; durable storage, upload policy and size limits remain application/provider responsibilities.",
    "https://nextjs.org/docs/app/guides/forms",
    "FormData transport",
  );
  set(
    "astro",
    "uploads",
    "partial",
    "Actions can receive form data; durable storage and upload lifecycle are separate application/provider responsibilities.",
    "https://docs.astro.build/en/guides/actions/",
    "FormData actions",
  );
}

// Availability is judged against the category definition, not against an
// unrequested superset such as an analytics dashboard or state-preserving HMR.
export function refineReviewedFindings(evidence) {
  const reclassify = (id, keys, status) => {
    for (const key of keys.split(" "))
      evidence[id][key] = { ...evidence[id][key], status };
  };
  reclassify("vue", "observability", "native");
  reclassify("react", "observability", "native");
  reclassify("rails", "hmr dynamicMetadata", "native");
  reclassify("jte", "hmr cli", "official");
  reclassify("rocker", "hmr cli", "official");
  reclassify("jinja2", "hmr", "native");
  reclassify("handlebars", "cli", "native");
  reclassify("dioxus", "tailwind", "community");
  reclassify("leptos", "tailwind unitTests", "community");
  reclassify("proa", "tailwind", "community");
  reclassify("astro", "containers", "native");
  reclassify("leptos", "containers", "native");
  reclassify("leptos", "invalidation", "native");
  reclassify("leptos", "serverOnly", "native");
  reclassify("proa", "observability csrf", "native");
  reclassify("nextjs", "csrf", "native");
  reclassify("astro", "dynamicMetadata isr robots", "native");
  reclassify("marko", "dynamicMetadata robots", "official");
  reclassify("rails", "robots", "native");
  reclassify("leptos", "robots", "official");
  reclassify("svelte", "robots", "official");
  reclassify("topcoat", "robots", "native");
  reclassify("remix", "robots", "native");
  reclassify("sveltekit", "robots", "native");
  // A runtime-only checker or unrelated feature is not partial delivery of the
  // defined capability. Keep the source and precise limitation visible.
  reclassify("go-html-template", "types", "undocumented");
  reclassify("php", "types", "undocumented");
  reclassify("dioxus", "scripts sitemaps", "undocumented");
  reclassify("exact", "routing scripts robots", "undocumented");
  reclassify("marko", "scripts clientData", "undocumented");
  reclassify("topcoat", "scripts", "undocumented");
  reclassify("astro", "clientData", "undocumented");
  for (const id of ["svelte", "sveltekit", "solidstart"]) {
    evidence[id].serverOnly = {
      ...evidence[id].serverOnly,
      status: "undocumented",
      label: "Server modules / functions only",
      note: "The reviewed API excludes server modules or function bodies from browser builds, but does not establish server-only UI components whose implementation is omitted from hydration bundles. These are different capabilities.",
    };
  }
  evidence.proa.observability.note =
    "Cache Trace exposes render/cache dependency diagnostics, and host tracing supplies production logging. Exporters and monitoring dashboards remain application-owned; those are not required by this instrumentation category.";
  evidence.proa.csrf.note =
    "Default outer hardening rejects unsafe browser cross-origin writes unless trusted, covering pages and endpoints. This is origin-based protection, not a CSRF-token service; same-origin XSS and stolen sessions require other defenses.";
  evidence.astro.isr.note =
    "The documented route cache stores on-demand HTML with maxAge/SWR and explicit invalidation. It requires a compatible server adapter/cache provider; a static-only export cannot regenerate pages on request.";
  evidence.php.types.note =
    "Native PHP declarations check values at runtime. The reviewed language API does not supply the compile-time checking defined by this category; an external static analyzer is a separate integration.";
  evidence["go-html-template"].types.note =
    "The Go host is statically typed, but html/template resolves template paths/data at execution time. The reviewed template API does not establish compile-time template type checking.";
  // Merely having pending state is weaker than the declarative boundary tested.
  evidence.exact.suspense = {
    ...evidence.exact.suspense,
    status: "undocumented",
    label: "Resource state only",
    note: "The pinned Contract resource API exposes pending/failed state and placeholders, but does not establish a declarative Suspense boundary that coordinates descendant async rendering. Those resource controls should not count as partial boundary support. This review does not assert the feature is impossible.",
    assessment: {
      summary:
        "Pending-resource UI is documented; a coordinating asynchronous UI boundary is not established by this API.",
      strengths: [
        "Resources retain previous answers or placeholders during replacement requests.",
        "Explicit pending and failed predicates let the application author loading/error UI.",
      ],
      tradeoffs: [
        "Resource state is not a boundary that waits on descendant dependencies.",
        "It does not establish resolved-HTML replacement in the original SSR response.",
      ],
    },
  };
  // Native API support can be useful while still falling short of the category.
  for (const entry of Object.values(evidence)) {
    for (const feature of features) {
      const finding = entry[feature.id];
      if (finding?.status !== "partial") continue;
      finding.label ||= "Qualified behavior";
      finding.reviewedOn = "2026-11-10";
    }
  }
}
