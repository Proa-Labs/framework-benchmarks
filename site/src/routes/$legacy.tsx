import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/$legacy")({
  validateSearch: (search: Record<string, unknown>) => search,
  beforeLoad: ({ params, search }) => {
    const targets = {
      "features.html": "/features",
      "about.html": "/about",
      "methodology.html": "/methodology",
    } as const;
    const target = targets[params.legacy as keyof typeof targets];
    if (target) throw redirect({ to: target, search, statusCode: 307 });
    throw notFound();
  },
});
