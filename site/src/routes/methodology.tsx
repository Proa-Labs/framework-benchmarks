import { createFileRoute } from "@tanstack/react-router";
import { pageMeta } from "../page-meta.ts";
import { DocumentPage } from "../pages/DocumentPage.tsx";
export const Route = createFileRoute("/methodology")({
  head: () =>
    pageMeta(
      "Methodology · Frameworks",
      "Understand each benchmark’s measurement boundary, output checks, capture dates and reproduction data.",
      "/methodology",
    ),
  component: () => <DocumentPage page="methodology" />,
});
