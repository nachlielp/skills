import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

// Human-readable build date shown in the UI footer. Pin the timezone so the
// version string is stable regardless of where the build runs.
const parts = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Jerusalem", // __ADJUST__: your timezone
  year: "2-digit",
  month: "2-digit",
  day: "2-digit",
}).formatToParts(new Date());
const part = (type: string) =>
  parts.find((p) => p.type === type)?.value ?? "00";
const appVersion = `${part("day")}-${part("month")}-${part("year")}`;
const buildHash = (
  process.env.VERCEL_GIT_COMMIT_SHA ??
  process.env.GITHUB_SHA ??
  "local"
).slice(0, 7);

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
    __BUILD_HASH__: JSON.stringify(buildHash),
  },
  plugins: [
    react(),
    VitePWA({
      // Hand-written worker in src/sw.ts; Workbox injects the precache
      // manifest at build time. Registration is manual (see main.tsx).
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      injectRegister: false,
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest}"],
      },
      includeAssets: [
        "robots.txt",
        "apple-touch-icon-180.png",
        "pwa-192x192.png",
        "pwa-512x512.png",
      ],
      manifest: {
        id: "/",
        name: "__APP_NAME__",
        short_name: "__APP_NAME__",
        description: "__APP_DESCRIPTION__",
        theme_color: "__THEME_COLOR__",
        background_color: "__THEME_COLOR__",
        display: "standalone",
        scope: "/",
        start_url: "/",
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
