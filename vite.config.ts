import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [
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
});
