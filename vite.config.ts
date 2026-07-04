import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";

import { cloudflare } from "@cloudflare/vite-plugin";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const siteTitle = env.VITE_SITE_TITLE?.trim() || "LinkOutpost";
  const escapedSiteTitle = escapeHtml(siteTitle);

  return {
    define: {
      "import.meta.env.VITE_SITE_TITLE": JSON.stringify(siteTitle),
    },
    plugins: [
      {
        name: "site-title-html",
        transformIndexHtml(html) {
          return html.replace(
            /<title>.*?<\/title>/,
            `<title>${escapedSiteTitle}</title>`,
          );
        },
      },
      vanillaExtractPlugin(),
      react(),
    ],
    server: {
      port: 10957,
    },
    build: {
      outDir: "dist",
      emptyOutDir: true,
    },
  };
});
