import { createFileRoute } from "@tanstack/react-router";
import { pageMeta } from "../../page-meta.ts";
import { BlogIndex } from "../../pages/BlogPage.tsx";

export const Route = createFileRoute("/blog/")({
  head: () =>
    pageMeta(
      "State of Web Frameworks 2026 · Blog",
      "The frameworks.run 2026 report on server performance, streaming, and framework capabilities.",
      "/blog",
    ),
  component: BlogIndex,
});
