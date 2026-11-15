import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import appCss from "../app.css?url";
import { Footer } from "../components/Footer.tsx";
import { Header } from "../components/Header.tsx";
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
      {
        rel: "apple-touch-icon",
        sizes: "180x180",
        href: "/apple-touch-icon.png",
      },
    ],
  }),
  headers: () => ({
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Cache-Control": "public, max-age=0, must-revalidate",
  }),
  component: Outlet,
  shellComponent: RootDocument,
  notFoundComponent: () => <StatusPage title="Page not found" />,
  errorComponent: ({ error, reset }) => {
    if (import.meta.env.DEV) console.error("Frameworks route failed", error);
    return <StatusPage title="This page couldn’t load" reset={reset} />;
  },
});

function StatusPage({ title, reset }: { title: string; reset?: () => void }) {
  return (
    <div id="frameworks-explorer">
      <Header active="" />
      <main className="py-10">
        <h1>{title}</h1>
        <p className="mt-4 text-muted">
          {reset
            ? "Try again or return to the benchmarks."
            : "Check the address or return to the benchmarks."}
        </p>
        <div className="mt-6 flex gap-6">
          {reset && (
            <button type="button" onClick={reset} className="underline">
              Try again
            </button>
          )}
          <a href="/" className="underline">
            Return to frameworks.run
          </a>
        </div>
      </main>
      <Footer />
    </div>
  );
}
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
