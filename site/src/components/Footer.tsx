import { Link } from "@tanstack/react-router";
import { Wordmark } from "./Wordmark.tsx";

const repository = "https://github.com/Proa-Labs/framework-benchmarks";
export function Footer({
  comparisonActions = false,
}: {
  comparisonActions?: boolean;
}) {
  return (
    <footer className="fw-site-footer mt-12 border-t border-line pt-10 pb-5 font-sans text-sm text-muted">
      <div className="grid grid-cols-2 gap-x-8 gap-y-9 pb-10 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:gap-x-14">
        <div className="col-span-2 sm:col-span-1">
          <Wordmark
            label="frameworks.run home in footer"
            className="inline-flex items-center gap-2.5 text-base font-semibold tracking-tight text-ink no-underline [&_svg]:size-6"
          />
          <p className="mt-4 max-w-72 leading-relaxed">
            Benchmarks and feature comparisons for web frameworks.
          </p>
        </div>
        <nav
          aria-label="Explore"
          className="flex flex-col items-start gap-3 [&_a]:no-underline [&_a:hover]:text-ink"
        >
          <h2 className="mb-1 text-sm font-medium text-ink">Explore</h2>
          <Link
            to="/"
            search={{ section: "performance" }}
            aria-label="Performance benchmarks"
          >
            Performance
          </Link>
          <Link
            to="/features"
            search={{}}
            aria-label="Compare framework features"
          >
            Features
          </Link>
          <Link
            to="/"
            search={{ section: "ecosystem" }}
            aria-label="Framework ecosystem"
          >
            Ecosystem
          </Link>
        </nav>
        <nav
          aria-label="Project resources"
          className="flex flex-col items-start gap-3 [&_a]:no-underline [&_a:hover]:text-ink [&_button:hover]:text-ink"
        >
          <h2 className="mb-1 text-sm font-medium text-ink">Resources</h2>
          <Link to="/methodology" search={{}}>
            Methodology
          </Link>
          <Link to="/about" search={{}}>
            Ownership &amp; disclosure
          </Link>
          <a href={repository} target="_blank" rel="noreferrer">
            GitHub ↗
          </a>
          <a href={`${repository}/issues/new`} target="_blank" rel="noreferrer">
            Suggest a correction ↗
          </a>
          {comparisonActions && (
            <button
              type="button"
              data-share=""
              className="cursor-pointer text-left"
            >
              Copy comparison link ↗
            </button>
          )}
        </nav>
      </div>
      <div className="flex flex-col gap-3 border-t border-line pt-5 text-sm leading-relaxed sm:flex-row sm:items-center sm:justify-between">
        <span>© 2026 frameworks.run</span>
        <span>
          Maintained by{" "}
          <a
            className="underline underline-offset-2 hover:text-ink"
            href="https://github.com/Proa-Labs"
          >
            Proa Labs
          </a>
          .
        </span>
      </div>
      {comparisonActions && (
        <span
          data-share-status=""
          role="status"
          aria-live="polite"
          className="block text-sm empty:hidden"
        />
      )}
    </footer>
  );
}
