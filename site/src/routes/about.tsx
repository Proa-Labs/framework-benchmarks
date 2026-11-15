import { createFileRoute } from "@tanstack/react-router";
import { pageMeta } from "../page-meta.ts";
import { DocumentPage } from "../pages/DocumentPage.tsx";
export const Route = createFileRoute("/about")({
  head: () =>
    pageMeta(
      "Why frameworks.run exists · Frameworks",
      "Why we compare web frameworks, how tools are classified, and who maintains these benchmarks.",
      "/about",
    ),
  component: () => <DocumentPage page="about" />,
});
