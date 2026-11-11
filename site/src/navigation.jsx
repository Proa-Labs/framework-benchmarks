import {
  Link as RouterLink,
  useLocation as useRouterLocation,
} from "@tanstack/react-router";
// Shared page components consume URL search text; TanStack owns navigation and
// request-time routing. Preserve query-bearing links from the existing explorer.
export function Link({ to, ...props }) {
  const url = new URL(to, "https://frameworks.run");
  return (
    <RouterLink
      to={url.pathname}
      search={Object.fromEntries(url.searchParams)}
      hash={url.hash.slice(1)}
      {...props}
    />
  );
}
export function useLocation() {
  const location = useRouterLocation();
  return { ...location, search: location.searchStr };
}
