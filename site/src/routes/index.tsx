import { createFileRoute } from "@tanstack/react-router";
import { pageMeta } from "../page-meta.ts";
import { PerformancePage } from "../pages/PerformancePage.tsx";
export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => search,
  head: ({ match }) =>
    match.search.section === "ecosystem"
      ? pageMeta(
          "Ecosystem · Frameworks",
          "Explore web frameworks, UI libraries and template engines, their languages and benchmark coverage.",
          "/?section=ecosystem",
        )
      : pageMeta(
          "Web framework benchmarks · Frameworks",
          "Compare server rendering, HTTP, streaming and cold-start performance with reproducible workloads, recorded versions and downloadable evidence.",
          "/",
        ),
  component: PerformancePage,
});
