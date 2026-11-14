import { Link } from "@tanstack/react-router";

export function Wordmark({
  className = "",
  label = "Frameworks home",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <Link className={`fw-wordmark ${className}`} to="/" aria-label={label}>
      <svg
        className="fw-mark"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 32 32"
        width="32"
        height="32"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M4 4h4v24H4z" opacity=".5" />
        <path d="M4 4h24v6H4zm0 10h18v6H4zm0 10h6v4H4z" />
      </svg>
      <span>
        frameworks
        <span className="fw-wordmark-domain text-muted font-normal">.run</span>
      </span>
    </Link>
  );
}
