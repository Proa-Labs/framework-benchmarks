import { fileURLToPath } from "node:url";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  publicDir: ".generated/public",
  build: { manifest: true },
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tailwindcss(),
    tanstackStart(),
    react(),
  ],
  server: {
    host: "127.0.0.1",
    port: 4317,
    strictPort: true,
    // Downloadable evidence never drives application modules. In particular,
    // copying an archived HTML response must not reload the live dashboard.
    watch: { ignored: ["**/.generated/public/data/**"] },
  },
});
