import { createMiddleware, createStart } from "@tanstack/react-start";

const responsePolicy = createMiddleware().server(async ({ request, next }) => {
  const result = await next();
  const headers = new Headers(result.response.headers);
  const hostname = new URL(request.url).hostname;
  if (hostname !== "frameworks.run" && hostname !== "www.frameworks.run")
    headers.set("X-Robots-Tag", "noindex, nofollow");
  // Page-only policy: the static workload documents must remain embeddable
  // in the same-origin preview frames. Start's inline hydration stays allowed.
  if (headers.get("Content-Type")?.includes("text/html")) {
    headers.set(
      "Content-Security-Policy",
      "object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
    );
  }
  return {
    ...result,
    response: new Response(result.response.body, {
      status: result.response.status,
      statusText: result.response.statusText,
      headers,
    }),
  };
});

export const startInstance = createStart(() => ({
  requestMiddleware: [responsePolicy],
}));
