import { useLayoutEffect, useState } from "react";
import metadata from "../../.generated/metadata.json";
import { Header } from "../components/Header.jsx";
import { Link } from "../navigation.jsx";

function About() {
  return (
    <>
      <p>
        Choose a web stack using measurements you can check. We compare the time
        and resources needed to render the same pages, serve requests, stream
        responses and start a server.
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
          Examples: React, Vue and Svelte.
        </li>
        <li>
          <strong>Templating tool:</strong> turns templates and data into HTML.
          Includes template engines such as Askama and Go’s{" "}
          <code>html/template</code>, plus native PHP templates.
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
        HTTP; Framework SSR includes routing and rendering. Every measured
        adapter must pass that workload’s output checks.
      </p>
      <p>
        <Link to="/methodology">Methodology &amp; raw data ↗</Link> ·{" "}
        <a href="https://github.com/Proa-Labs/framework-benchmarks/issues/new">
          Challenge a result ↗
        </a>
      </p>
      <p className="disclosure">
        <strong>Who runs this:</strong> Andrew Hariri maintains this site and
        founded <a href="https://github.com/Proa-Labs">Proa Labs</a>.{" "}
        <a href="https://github.com/Proa-Labs/proa">Proa</a> is included in the
        benchmarks.
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
      <h2>SSR Rendering</h2>
      <p>
        Prepared input to one complete, independently owned HTML response. Each
        adapter uses its declared native output type; Proa’s fresh RenderBuffer
        excludes flattening to a String. Output boundaries and per-row capture
        dates are retained in the data. Compilation and fixture construction
        happen before timing; routing, HTTP, databases and hydration are
        excluded. The canonical suite validates semantic DOM parity before
        measuring. Headline values are medians of five independently measured
        process P50s.
      </p>
      <h2>Framework SSR</h2>
      <p>
        {metadata.framework.scenario.boundary} This is a separate shared catalog
        contract for application frameworks. Generated classes and framework
        shells may differ; the same ordered business content, escaping, list
        roles and request-specific value must pass admission. Full-document
        caching is disabled. Capacity uses{" "}
        {metadata.framework.methodology.concurrency} connections; equal-load
        latency uses {metadata.framework.methodology.fixedRateRps} scheduled
        requests/s, with {metadata.framework.methodology.repeats} fresh server
        processes per phase kind. JavaScript frameworks run on{" "}
        {metadata.framework.scenario.runtime}. Every response is validated, and
        incomplete or generator-limited runs are rejected. These numbers are not
        combined with pure render times.
      </p>
      <h2>HTTP</h2>
      <p>
        The normal production servers handle the same parity-gated pages over
        loopback HTTP/1.1. Capacity uses 64 keep-alive connections; fixed-rate
        phases measure latency at equal offered load. CPU and memory are
        server-process measurements. The load generator validates responses and
        checks that it is not the bottleneck.
      </p>
      <h2>Streaming</h2>
      <p>
        A 96-card grid arrives through eight async boundaries with 5–90 ms
        in-memory delays. Scheduled-arrival timings include queueing. Each load
        point has three measured phases. Wire sizes differ by replacement
        protocol. Failed requests remain recorded and do not become successful
        Flow particles.
      </p>
      <h2>Startup</h2>
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
            <a href={capture.download}>{capture.id}: original capture</a> ·{" "}
            {capture.date} · <code>{capture.capture}</code>
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
        · <a href="data/manifest.json">Artifact hashes</a>
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
export function DocumentPage({ page }) {
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
      <main className="document">
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
        <footer>
          Maintained by Andrew Hariri, founder of{" "}
          <a href="https://github.com/Proa-Labs">Proa Labs</a>.{" "}
          <a href="https://github.com/Proa-Labs/framework-benchmarks">
            Source on GitHub ↗
          </a>
        </footer>
      </main>
    </>
  );
}
