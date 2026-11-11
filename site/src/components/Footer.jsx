import { Link } from "react-router";
export function Footer() {
  return (
    <footer className="fw-site-footer">
      <span>Frameworks / 2026</span>
      <div>
        <Link to="/about">Ownership &amp; disclosure</Link>
        <a
          href="https://github.com/Proa-Labs/framework-benchmarks/issues/new"
          target="_blank"
          rel="noreferrer"
        >
          Suggest a correction ↗
        </a>
      </div>
    </footer>
  );
}
