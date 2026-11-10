import { defineConfig } from "astro/config";

const SITE_URL =
  process.env.PUBLIC_SITE_URL || process.env.SITE_URL || "https://sitio-<cliente>.example.com";

export default defineConfig({
  base: "/",
  output: "static",
  site: SITE_URL,
  build: { inlineStylesheets: "always" },
  compressHTML: true,
  prefetch: { prefetchAll: true, defaultStrategy: "hover" },
  vite: {
    resolve: {
      alias: {
        "@agenciaweb/kit-site": new URL("./src/data/site.ts", import.meta.url).pathname,
      },
    },
  },
});
