import { Link } from "@tanstack/react-router";
import { useLayoutEffect, useState } from "react";
import metadata from "../../.generated/metadata.json";
import { Footer } from "../components/Footer.tsx";
import { Header } from "../components/Header.tsx";

function About() {
  return (
    <>
      <p>
        We built frameworks.run to see how web frameworks perform when they’re
        serving interfaces under load. Many web framework benchmarks focus on
        simple HTTP endpoints, which are useful for measuring request handling
        and throughput. We wanted to know how much work it takes to render and
        stream a page. We also plan to measure the JavaScript the browser has to
        download and run. Shared pages and test conditions make those costs
        easier to compare across frameworks.
      </p>
      <p>
        That means equivalent workloads, output checks, documented test
        conditions,{" "}
        <Link to="/methodology">pinned versions and raw results</Link> you can
        inspect. Differences and exceptions are disclosed so you can judge what
        each comparison actually tells you.
      </p>
      <p>
        Performance is only one part of choosing a framework. Features,
        developer tooling and ecosystem support matter too. Capabilities such as
        content rendering, routing and data handling are not captured by a
        render-time ranking alone. Our{" "}
        <Link to="/features">feature comparison</Link> distinguishes built-in
        features from official packages and community integrations, so you can
        weigh speed alongside what your application needs.
      </p>
      <h2>The costs we want to measure</h2>
      <p>
        Our focus is on two major costs frameworks can influence: generating a
        response on the server, and the JavaScript sent to the browser.{" "}
        <a href="https://web.dev/articles/rendering-on-the-web#server-side-rendering">
          Server-side rendering (SSR)
        </a>{" "}
        makes page content available in the initial HTML response, which matters
        for loading and{" "}
        <a href="https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics">
          search indexing
        </a>
        . Our current experiments measure rendering, complete{" "}
        <a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview">
          HTTP requests
        </a>
        ,{" "}
        <a href="https://web.dev/articles/rendering-on-the-web#stream-server-side-rendering-and-rehydrate-progressively">
          streaming
        </a>
        , and{" "}
        <Link to="/methodology">server startup, CPU and memory usage</Link>.
      </p>
      <p>
        The planned Client-side JS experiment will measure download size and the
        browser work needed to{" "}
        <a href="https://web.dev/articles/optimizing-content-efficiency-javascript-startup-optimization">
          parse, compile and execute
        </a>{" "}
        that code, including{" "}
        <a href="https://web.dev/articles/rendering-on-the-web#terminology">
          hydration
        </a>{" "}
        where applicable. A small download can still take significant time on
        the{" "}
        <a href="https://developer.mozilla.org/en-US/docs/Glossary/Main_thread">
          main thread
        </a>
        , delaying rendering and interactions. This focus is inspired by{" "}
        <a href="https://addyosmani.com/">Addy Osmani</a>’s talk{" "}
        <a href="https://www.youtube.com/watch?v=63I-mEuSvGA">
          The Cost of JavaScript
        </a>
        .
      </p>
      <h2>How this relates to user experience</h2>
      <p>
        These rankings use technical measurements rather than{" "}
        <a href="https://developer.chrome.com/docs/lighthouse/overview">
          Lighthouse
        </a>{" "}
        scores or user-experience metrics such as{" "}
        <a href="https://web.dev/articles/lcp">
          Largest Contentful Paint (LCP)
        </a>{" "}
        and{" "}
        <a href="https://web.dev/articles/inp">
          Interaction to Next Paint (INP)
        </a>
        . Faster server responses can help content arrive sooner; less
        main-thread JavaScript work can help the browser paint and respond
        sooner. These are inputs to a good experience, not a guarantee of a
        particular score. See{" "}
        <a href="https://web.dev/articles/vitals">web.dev’s Web Vitals guide</a>{" "}
        for how those user-experience metrics are measured.
      </p>
      <p>
        In our controlled rendering tests, implementations produce equivalent
        HTML and styling. Holding the page constant helps isolate the
        framework’s work. A browser-level score also depends on images, fonts,
        network conditions, caching, devices and application behavior, so it
        cannot be inferred from a render-time ranking alone.
      </p>
      <p>
        As the suite grows to cover complete applications and user journeys, we
        want to add end-to-end browser measurements alongside these focused
        tests.
      </p>
      <h2>Prior work</h2>
      <p>
        <a href="https://http-arena.com/">HttpArena</a>,{" "}
        <a href="https://www.techempower.com/benchmarks/">
          TechEmpower Framework Benchmarks
        </a>
        ,{" "}
        <a href="https://github.com/the-benchmarker/web-frameworks">
          the-benchmarker’s Web Frameworks
        </a>{" "}
        and <a href="https://github.com/sharkbench/sharkbench">SharkBench</a>{" "}
        are useful references for server performance. Across their suites, they
        exercise focused workloads such as routing, JSON serialization and
        database access. Some workloads also exercise server-side templates,
        including TechEmpower’s{" "}
        <a href="https://github.com/TechEmpower/FrameworkBenchmarks/wiki/Project-Information-Framework-Tests-Overview#fortunes">
          Fortunes test
        </a>{" "}
        and HttpArena’s template profile.
      </p>
      <p>
        Earlier projects such as{" "}
        <a href="https://github.com/eknkc/ssr-benchmark">
          eknkc’s SSR Framework Benchmark
        </a>{" "}
        helped make SSR comparisons more accessible. Its published suite focuses
        on JavaScript-based stacks. It appears to be no longer maintained and
        hasn’t been updated since{" "}
        <a href="https://github.com/eknkc/ssr-benchmark/commit/c6af3e610029aa36d2c3d6957658d1de1f0905db">
          April 2024
        </a>
        . We wanted broader coverage across languages and ecosystems, with an
        ongoing, reproducible set of shared experiments.
      </p>
      <h2 id="classification">What counts as a web framework?</h2>
      <ul>
        <li>
          <strong>Web framework:</strong> connects routing and request handling
          to response generation. Built-in features and official adapters count.
        </li>
        <li>
          <strong>UI framework or library:</strong> builds components and
          interfaces; routing and server hosting can come from separate tools.
          Examples: <a href="https://react.dev/">React</a>,{" "}
          <a href="https://vuejs.org/">Vue</a> and{" "}
          <a href="https://svelte.dev/">Svelte</a>.
        </li>
        <li>
          <strong>Templating tool:</strong> turns templates and data into HTML.
          Includes template engines such as{" "}
          <a href="https://docs.rs/askama/latest/askama/">Askama</a> and Go’s{" "}
          <a href="https://pkg.go.dev/html/template">
            <code>html/template</code>
          </a>
          , plus native <a href="https://www.php.net/">PHP</a> templates.
        </li>
      </ul>
      <p>
        We classify the tested version by its documented capabilities. Adding a
        benchmark server wrapper does not turn a template engine into a web
        framework.
      </p>
      <h2>How to use the results</h2>
      <p>
        Compare tools within the same experiment. Render-only timing excludes
        HTTP; HTTP E2E includes routing, rendering and response transfer. Every
        measured adapter must pass that workload’s output checks.
      </p>
      <p>
        <Link to="/methodology">Methodology &amp; raw data ↗</Link> ·{" "}
        <a href="https://github.com/Proa-Labs/framework-benchmarks/issues/new">
          Challenge a result ↗
        </a>
      </p>
      <p className="disclosure">
        <strong>Who runs this:</strong>{" "}
        <a href="https://github.com/Proa-Labs">Proa Labs</a> maintains this site
        and develops <a href="https://github.com/Proa-Labs/proa">Proa</a>, which
        is included in the benchmarks.
      </p>
      <p>
        Project names and logos identify their respective owners. Inclusion does
        not imply affiliation or endorsement.{" "}
        <a href="/logos/sources.json">Logo sources</a> ·{" "}
        <a href="/licenses/devicon.txt">Devicon license</a> ·{" "}
        <a href="/licenses/simple-icons.txt">Simple Icons license</a>.
      </p>
    </>
  );
}
function Methodology() {
  return (
    <>
      <p>
        The current site presents captures from{" "}
        <strong>{metadata.dateRange}</strong>. These results describe the
        recorded versions on the recorded host. They are historical evidence,
        not a claim about every framework's latest release.
      </p>
      <h2>SSR</h2>
      <p>
        Each adapter renders prepared input into one complete, independently
        owned HTML page using its native output type. The data records each
        adapter’s output boundary and capture date. Compilation and fixture
        construction happen before timing. The timer excludes routing, HTTP,
        database access and hydration. The canonical suite validates semantic
        DOM parity before measuring. Headline values are medians of five
        independently measured process P50s.
      </p>
      {metadata.renderingOutput && <p>{metadata.renderingOutput}</p>}
      <p>
        Peak RSS is the most physical memory used by a native renderer process
        over its lifetime, including startup, prepared data, template
        initialization, warmup, rendering and output verification. The chart
        shows the median of the independent process peaks in MiB, with each peak
        retained in the raw data. The operating system records this separately
        from the render timer. It is whole-process memory, not bytes allocated
        per render. Older captures without RSS remain unmeasured. Build tools
        and benchmark launchers are excluded.
      </p>
      <h2>HTTP E2E</h2>
      <p>
        Both suites measure complete HTML responses over HTTP, including SSR.
        Neither measures browser rendering or hydration. Framework routes use
        native production page handlers; Renderer servers expose shared renderer
        fixtures over HTTP. Their contracts and load settings differ, so compare
        tools within the same suite.
      </p>
      <h3>Framework routes</h3>
      <p>
        {metadata.framework.scenario.boundary} This is a separate shared
        workload contract for application frameworks. Generated classes and
        framework shells may differ; the same ordered business content,
        escaping, list roles and request-specific value must pass admission.
        Full-document caching is disabled. Capacity uses{" "}
        {metadata.framework.methodology.concurrency} connections; equal-load
        latency uses{" "}
        {metadata.framework.workloads
          .map((w) => `${w.label}: ${w.fixedRateRps} requests/s`)
          .join("; ")}
        , with {metadata.framework.methodology.repeats} fresh server processes
        per phase kind. JavaScript frameworks run on{" "}
        {metadata.framework.scenario.runtime}. Every response is validated, and
        incomplete or generator-limited runs are rejected. These numbers are not
        combined with pure render times. Capacity windows are{" "}
        {metadata.framework.workloads
          .map((w) => `${w.label}: ${w.capacityDurationSeconds} seconds`)
          .join("; ")}
        . Equal-load windows last{" "}
        {metadata.framework.methodology.durationSeconds} seconds; low-rate tail
        percentiles have few samples, whose counts are retained in the raw data.
      </p>
      {/\bBun\b/.test(metadata.framework.versions.exact || "") && (
        <p>
          Exact uses its production JavaScript SSR backend on Bun. Its native
          Rust render host is a separate backend and is not measured in this
          capture. The tested backend and version are retained in the raw data.
        </p>
      )}
      <h3>Renderer servers</h3>
      <p>
        The normal production servers handle the same parity-gated pages over
        loopback HTTP/1.1. Capacity uses 64 keep-alive connections; fixed-rate
        phases measure latency at equal offered load. CPU and memory are
        server-process measurements. The load generator validates responses and
        checks that it is not the bottleneck.
      </p>
      <h2>Streaming SSR</h2>
      <p>
        A 96-card grid arrives through eight async boundaries with 5–90 ms
        in-memory delays. Scheduled-arrival timings include queueing. Each load
        point has three measured phases. Wire sizes differ by replacement
        protocol. Failed requests remain recorded and do not become successful
        Flow particles.
      </p>
      <h2>Cold Start</h2>
      <p>
        Process spawn to the first complete, validated product-grid response.
        Fifteen fresh starts follow two untimed disk-cache warmups. Host
        activity influences these results. The boxes here describe individual
        start times.
      </p>
      <h2>Read the chart correctly</h2>
      <ul>
        <li>
          Rendering boxes describe variation among process medians, not a
          distribution of every rendered response.
        </li>
        <li>
          HTTP and streaming boxes summarize repeated phases. Hover cards
          identify whether latency is a phase percentile or a median of
          percentiles.
        </li>
        <li>
          Line segments connect measured points; interpolation is not a new
          measurement.
        </li>
        <li>
          Flow is an aggregate illustration. Travel time and particle arrival
          rate use paired measurements from one representative run. Pipe width
          does not encode bandwidth.
        </li>
        <li>
          Some sources include uncommitted changes. The original provenance and
          source hashes are preserved in the downloadable captures.
        </li>
      </ul>
      <h2>Read and reproduce the evidence</h2>
      <ul>
        {metadata.captures.map((capture) => (
          <li key={capture.id}>
            <a href={`/${capture.download}`}>{capture.id}: original capture</a>{" "}
            · {capture.date} · <code>{capture.capture}</code>
          </li>
        ))}
      </ul>
      <p>
        <a href="https://github.com/Proa-Labs/framework-benchmarks/blob/main/rendering/protocol.md">
          Canonical protocol ↗
        </a>{" "}
        ·{" "}
        <a href="https://github.com/Proa-Labs/framework-benchmarks/blob/main/README.md">
          Reproduction commands ↗
        </a>{" "}
        · <a href="/data/manifest.json">Artifact hashes</a>
      </p>
      <h2>No single overall winner</h2>
      <p>
        These experiments measure different work. They do not jointly measure
        feature completeness, database workloads, developer experience,
        application complexity, native UI performance or every deployment
        environment.
      </p>
      <h2 id="inclusion">Inclusion criteria</h2>
      <p>
        Frameworks, UI libraries and templating tools are classified by their
        scope. Inclusion requires public source, documented setup and a
        reproducible example; popularity is not an entry requirement.
      </p>
      <p>
        Every measured adapter must use the same workload, pass output parity
        checks, declare production settings and versions, and retain its runs.
        Missing capabilities remain unmeasured. Exceptions and author
        affiliations are disclosed.
      </p>
    </>
  );
}
export function DocumentPage({ page }: { page: "about" | "methodology" }) {
  const [ready, setReady] = useState(false);
  const title =
    page === "about"
      ? "Why frameworks.run exists"
      : page === "methodology"
        ? "Methodology"
        : "That page isn't in this capture.";
  useLayoutEffect(() => {
    document.title = `${title} · Frameworks`;
    setReady(true);
  }, [title]);
  return (
    <>
      <div
        id="frameworks-explorer"
        className="fw-document-shell"
        data-app-ready={ready}
      >
        <Header active={page} />
        <section className="fw-intro" aria-labelledby="site-title">
          <h1 id="site-title">{title}</h1>
        </section>
      </div>
      <main className="document pb-0">
        {page === "about" ? (
          <About />
        ) : page === "methodology" ? (
          <Methodology />
        ) : (
          <p>
            <Link to="/">Return to the explorer</Link> or inspect the{" "}
            <a href="/data/results.json">complete dataset</a>.
          </p>
        )}
      </main>
      <div className="mx-auto max-w-[1220px] px-4 min-[561px]:px-[22px] min-[801px]:px-11">
        <Footer />
      </div>
    </>
  );
}
