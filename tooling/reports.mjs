import { dirname, isAbsolute, relative } from "node:path";
import { currentPath, repositoryRoot } from "./repository.mjs";

const reports = Object.fromEntries(
  ["scoreboard.md", "engineering.md", "http-capacity.md", "sveltekit.md"].map(
    (name) => [name, `docs/reports/${name}`],
  ),
);

// Generators describe evidence with repository paths. Resolve those links for
// the output document's directory instead of depending on reports at the root.
export function formatReportLinks(markdown, report) {
  const path = isAbsolute(report) ? relative(repositoryRoot(), report) : report;
  const link = (match, before, url, after) => {
    if (/^(?:https?:|mailto:|data:|#|\/|\.\.?\/)/.test(url)) return match;
    const [file, ...fragment] = url.split("#");
    const target = reports[file] || currentPath(file);
    if (
      !/^(?:benchmarks|experiments|tooling|docs|site|fixtures)\//.test(target)
    )
      return match;
    const destination = relative(dirname(path), target).replaceAll("\\", "/");
    return (
      before +
      destination +
      (file.endsWith("/") && !destination.endsWith("/") ? "/" : "") +
      (fragment.length ? `#${fragment.join("#")}` : "") +
      after
    );
  };
  return markdown
    .replace(/(\]\()([^\s)]+)(\))/g, link)
    .replace(/((?:href|src)=")([^"\s]+)(")/g, link);
}
