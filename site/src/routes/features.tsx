import { createFileRoute } from "@tanstack/react-router";
import { FeaturesPage } from "../pages/FeaturesPage.jsx";
export const Route = createFileRoute("/features")({
  validateSearch: (search: Record<string, unknown>) => search,
  head: () => ({ meta: [{ title: "Features · Frameworks" }] }),
  component: FeaturesPage,
});
