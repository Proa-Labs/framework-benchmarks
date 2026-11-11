import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const root = fileURLToPath(new URL(".", import.meta.url));
export default defineConfig({
  root,
  publicDir: ".generated/public",
  plugins: [
    react(),
    {
      name: "initial-theme",
      transformIndexHtml(html) {
        const css = readFileSync(
          new URL("./src/theme.css", import.meta.url),
          "utf8",
        );
        const bootstrap = readFileSync(
          new URL("./src/theme-bootstrap.js", import.meta.url),
          "utf8",
        );
        return html.replace(
          "<!--initial-theme-->",
          `<style data-initial-theme>${css}</style><script data-theme-bootstrap>${bootstrap}</script>`,
        );
      },
    },
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "es2022",
    manifest: true,
  },
  server: { host: "127.0.0.1", port: 4317, strictPort: true },
});
