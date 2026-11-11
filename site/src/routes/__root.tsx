import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import appCss from "../app.css?url";
import themeBootstrap from "../theme-bootstrap.ts?raw";
import themeCss from "../theme-tokens.css?raw";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "color-scheme", content: "light dark" },
      { title: "Frameworks.run" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
    ],
  }),
  headers: () => ({
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Cache-Control": "public, max-age=0, must-revalidate",
  }),
  component: Outlet,
  shellComponent: RootDocument,
  notFoundComponent: () => (
    <main className="mx-auto max-w-4xl p-8">
      <h1 className="text-3xl font-semibold">Page not found</h1>
      <a href="/" className="underline">
        Return to frameworks.run
      </a>
    </main>
  ),
});
function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Trusted application-owned bootstrap applies the saved theme before paint. */}
        <style
          data-initial-theme
          // biome-ignore lint/security/noDangerouslySetInnerHtml: trusted build-owned theme tokens.
          dangerouslySetInnerHTML={{ __html: themeCss }}
        />
        <script
          data-theme-bootstrap
          // biome-ignore lint/security/noDangerouslySetInnerHtml: trusted application-owned theme bootstrap.
          dangerouslySetInnerHTML={{ __html: themeBootstrap }}
        />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
