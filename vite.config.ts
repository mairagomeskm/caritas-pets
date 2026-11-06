import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import viteReact from "@vitejs/plugin-react";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    port: 8080,
    host: true,
    allowedHosts: true,
  },
  plugins: [tailwindcss(), tanstackRouter({ autoCodeSplitting: true }), viteReact()],
  build: {
    outDir: "dist",
  },
});
