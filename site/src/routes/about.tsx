import { createFileRoute } from "@tanstack/react-router";
import { DocumentPage } from "../pages/DocumentPage.jsx";
export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "Why frameworks.run exists · Frameworks" }] }),
  component: () => <DocumentPage page="about" />,
});
