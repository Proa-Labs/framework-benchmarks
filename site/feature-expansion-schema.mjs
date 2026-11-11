// Independently observable behavior, rather than product-specific API names.
export const expandedFeatures = [
  {
    id: "xssEscaping",
    group: "security",
    label: "Output escaping",
    definition:
      "An owned HTML output-encoding policy for dynamic values. State default/opt-in behavior, protected contexts, URL handling and raw-output bypasses. Escaping text does not establish safe JavaScript/CSS interpolation or HTML sanitization.",
  },
  {
    id: "htmlSanitization",
    group: "security",
    label: "HTML sanitization",
    definition:
      "A maintained allowlist-based API/integration for accepting untrusted rich HTML while removing dangerous markup. Escaping to text, trusting a raw-HTML wrapper or validating a string is not sanitization.",
  },
  {
    id: "authorization",
    group: "security",
    label: "Authorization policies",
    definition:
      "A documented permission/policy API for deciding whether a principal may perform an operation on a resource. Authentication, hiding a button or a generic middleware hook alone does not qualify.",
  },
  {
    id: "rateLimiting",
    group: "security",
    label: "Rate limiting",
    definition:
      "A documented limiter for requests/actions with keys, time windows and rejection behavior. State storage, single-process versus distributed enforcement, and any separately installed package. Arbitrary middleware capability alone does not qualify.",
  },
  {
    id: "progressiveEnhancement",
    group: "server",
    label: "Progressive forms",
    definition:
      "Documented form submission that reaches the server and produces useful results before JavaScript loads or when it is disabled, with optional client enhancement. SSR HTML alone and browser-only submit handlers do not qualify.",
  },
  {
    id: "optimisticUi",
    group: "data",
    label: "Optimistic updates",
    definition:
      "A documented mutation workflow that displays an unconfirmed result immediately and reconciles it with success/failure. Pending flags alone do not qualify. State automatic versus application-owned rollback and concurrency limitations.",
  },
  {
    id: "requestCancellation",
    group: "data",
    label: "Stale request handling",
    definition:
      "A documented data/router mechanism that suppresses stale results or cancels superseded requests. Identify which behavior is guaranteed; aborting browser work does not undo a server mutation or guarantee backend cancellation.",
  },
  {
    id: "typedLinks",
    group: "routing",
    label: "Typed links & parameters",
    definition:
      "A route-aware API that checks destination names/paths and required route parameters before navigation. Generic language types, a string URL or runtime route matching alone do not qualify.",
  },
  {
    id: "searchParams",
    group: "routing",
    label: "Validated URL state",
    definition:
      "A router-owned or documented schema integration that parses and validates query/search parameters into typed application state, including malformed-input behavior. Raw URLSearchParams access alone does not qualify.",
  },
  {
    id: "stateRestoration",
    group: "routing",
    label: "Navigation state retention",
    definition:
      "A documented mechanism for retaining/restoring local UI or form state across navigation/back-forward. Identify persistent layouts, retained pages, DOM snapshots or serialization, and what resets. Browser caching alone is not a framework API.",
  },
  {
    id: "scrollRestoration",
    group: "routing",
    label: "Scroll restoration",
    definition:
      "A router/navigation integration that restores scroll positions during history traversal. Identify window versus nested scrollports, opt-in configuration and reset controls. An imperative scrollTo helper alone does not qualify.",
  },
  {
    id: "navigationBlocking",
    group: "routing",
    label: "Unsaved-change guards",
    definition:
      "An integrated navigation interception API that can pause/cancel an attempted route change and let the app resolve an unsaved-change prompt. Distinguish SPA navigation from browser beforeunload and its limitations.",
  },
  {
    id: "navigationAccessibility",
    group: "accessibility",
    label: "Accessible navigation",
    definition:
      "A documented soft-navigation integration for focus management or announcing route changes to assistive technology. Name which behavior is automatic and which remains application-owned. ARIA attributes alone do not qualify; native full-document navigation is distinguished.",
  },
  {
    id: "a11yChecks",
    group: "accessibility",
    label: "Accessibility checks",
    definition:
      "A documented compiler/linter/test integration that detects inaccessible authored UI. State static-analysis limits; no check establishes WCAG conformance, and emitting ARIA attributes alone does not qualify.",
  },
  {
    id: "lazyActivation",
    group: "rendering",
    label: "Deferred activation",
    definition:
      "Activate an interactive SSR component/island through a documented visibility, idle, interaction or media trigger. Distinguish delaying activation from delaying the JavaScript download and describe any event replay. Lazy imports alone are not a hydration scheduler.",
  },
  {
    id: "codeSplitting",
    group: "rendering",
    label: "Route / island splitting",
    definition:
      "An integrated build divides browser code by routes or independently activated islands so unused UI is not required in the initial bundle. Identify the splitting boundary and shared runtime; generic dynamic import syntax alone does not qualify.",
  },
  {
    id: "offline",
    group: "deployment",
    label: "Offline integration",
    definition:
      "A documented service-worker/offline integration with build assets or cache lifecycle support. Applications must still define offline data/failure behavior; serving static files or a manifest alone is insufficient.",
  },
  {
    id: "scheduling",
    group: "backend",
    label: "Scheduled tasks",
    definition:
      "A documented recurring-task scheduler, distinct from merely dispatching or delaying one job. Describe the external runner, overlapping tasks and multi-server coordination rather than implying exactly-once execution.",
  },
  {
    id: "notifications",
    group: "backend",
    label: "Multi-channel notifications",
    definition:
      "An application notification API that selects and formats multiple delivery channels. Email alone or low-level WebSocket messages do not qualify; provider credentials, queues and external channels are named separately.",
  },
  {
    id: "searchIndex",
    group: "backend",
    label: "Search indexing",
    definition:
      "A documented application/model search integration with indexing and synchronization lifecycle, distinct from issuing a SQL LIKE query. Name engines/services and any application-owned synchronization.",
  },
  {
    id: "fieldEncryption",
    group: "database",
    label: "Encrypted model fields",
    definition:
      "A model/storage integration that transparently encrypts/decrypts configured attributes, with documented key management. A generic encryption function, password hashing or database disk encryption alone does not qualify.",
  },
  {
    id: "httpTests",
    group: "testing",
    label: "HTTP integration tests",
    definition:
      "A documented test harness for application handlers/routes with request construction and response assertions, including session/auth context where available. Unit renderer tests and browser automation are separate; state whether a network server is required.",
  },
];
