import { createFileRoute } from "@tanstack/react-router";
import { pageMeta } from "../../page-meta.ts";
import { BlogIndex } from "../../pages/BlogPage.tsx";

export const Route = createFileRoute("/blog/")({
  head: () =>
    pageMeta(
      "Blog · Frameworks",
      "Notes on how we build, validate, and interpret web framework benchmarks.",
      "/blog",
    ),
  component: BlogIndex,
});
