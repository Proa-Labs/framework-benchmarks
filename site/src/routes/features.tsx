import { createFileRoute } from "@tanstack/react-router";
import { pageMeta } from "../page-meta.ts";
import { FeaturesPage } from "../pages/FeaturesPage.tsx";
export const Route = createFileRoute("/features")({
  validateSearch: (search: Record<string, unknown>) => search,
  head: () =>
    pageMeta(
      "Features · Frameworks",
      "Compare web framework capabilities, support types and API behavior. Inspect the documentation and limitations behind each finding.",
      "/features",
    ),
  component: FeaturesPage,
});
