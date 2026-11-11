import { createFileRoute } from "@tanstack/react-router";
import { PerformancePage } from "../pages/PerformancePage.jsx";
export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => search,
  head: ({ match }) => ({
    meta: [
      {
        title:
          match.search.section === "ecosystem"
            ? "Ecosystem · Frameworks"
            : "Web framework benchmarks · Frameworks",
      },
    ],
  }),
  component: PerformancePage,
});
