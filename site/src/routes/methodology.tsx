import { createFileRoute } from "@tanstack/react-router";
import { DocumentPage } from "../pages/DocumentPage.jsx";
export const Route = createFileRoute("/methodology")({
  head: () => ({ meta: [{ title: "Methodology · Frameworks" }] }),
  component: () => <DocumentPage page="methodology" />,
});
