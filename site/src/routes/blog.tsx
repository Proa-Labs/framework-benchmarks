import { createFileRoute } from "@tanstack/react-router";
import { BlogLayout } from "../pages/BlogPage.tsx";

export const Route = createFileRoute("/blog")({
  component: BlogLayout,
});
