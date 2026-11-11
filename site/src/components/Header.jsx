import { Link } from "../navigation.jsx";
import { ThemeToggle } from "./ThemeToggle.jsx";
export function Header({ active = "performance", interactive = false }) {
  const navigation = (
    <nav
      className="fw-sections flex items-center"
      aria-label="Research section"
    >
      {[
        ["performance", "Performance"],
        ["features", "Features"],
        ["ecosystem", "Ecosystem"],
      ].map(([id, label]) =>
        interactive && id !== "features" ? (
          <button
            key={id}
            type="button"
            className="cursor-interaction"
            data-section={id}
            aria-current={active === id ? "page" : undefined}
          >
            {label}
          </button>
        ) : (
          <Link
            key={id}
            to={id === "features" ? "/features" : `/?section=${id}`}
            aria-current={active === id ? "page" : undefined}
          >
            {label}
          </Link>
        ),
      )}
    </nav>
  );
  return (
    <header className="flex flex-wrap items-center justify-between">
      <div className="fw-brand flex shrink-0 items-center">
        <Link className="fw-wordmark" to="/" aria-label="Frameworks home">
          <svg
            className="fw-mark"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 32 32"
            width="32"
            height="32"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M4 4h4v24H4z" opacity=".5"></path>
            <path d="M4 4h24v6H4zm0 10h18v6H4zm0 10h6v4H4z"></path>
          </svg>
          <span>
            frameworks<span className="fw-wordmark-domain">.run</span>
          </span>
        </Link>
      </div>
      {navigation}
      <nav
        className="fw-top-actions flex items-center"
        aria-label="Site navigation"
      >
        <Link
          className="fw-about"
          to="/about"
          aria-current={active === "about" ? "page" : undefined}
        >
          About
        </Link>
        <a
          className="fw-github"
          href="https://github.com/Proa-Labs/framework-benchmarks"
          target="_blank"
          rel="noreferrer"
          aria-label="Framework benchmarks on GitHub"
          title="GitHub"
        >
          <span className="sr-only">GitHub</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="19"
            height="19"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12 .5C5.37.5 0 5.78 0 12.292c0 5.211 3.438 9.63 8.205 11.188.6.111.82-.254.82-.567 0-.28-.01-1.022-.016-2.005-3.338.711-4.043-1.582-4.043-1.582-.546-1.363-1.333-1.726-1.333-1.726-1.089-.731.083-.716.083-.716 1.205.084 1.839 1.215 1.839 1.215 1.071 1.805 2.809 1.284 3.495.982.108-.764.419-1.284.762-1.579-2.665-.298-5.467-1.31-5.467-5.831 0-1.288.465-2.34 1.235-3.165-.135-.298-.535-1.498.105-3.123 0 0 1.005-.316 3.3 1.209a11.72 11.72 0 0 1 3-.399c1.02.005 2.047.135 3.006.399 2.28-1.525 3.284-1.209 3.284-1.209.64 1.625.24 2.825.12 3.123.765.825 1.23 1.877 1.23 3.165 0 4.533-2.805 5.528-5.475 5.82.42.356.81 1.083.81 2.183 0 1.579-.015 2.847-.015 3.234 0 .31.21.674.825.566C20.565 21.915 24 17.495 24 12.292 24 5.78 18.627.5 12 .5z"></path>
          </svg>
        </a>
        <ThemeToggle />
      </nav>
    </header>
  );
}
