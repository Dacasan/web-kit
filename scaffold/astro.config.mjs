import { defineConfig } from "astro/config";

// Dominio canónico del cliente: PUBLIC_SITE_URL en producción. El placeholder
// <cliente>.example.com solo sirve para que el primer build compile.
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
        // Contrato de datos del kit: sus componentes consumen site vía
        // '@agenciaweb/kit-site' y ESTE repo lo resuelve a su site.ts.
        "@agenciaweb/kit-site": new URL("./src/data/site.ts", import.meta.url).pathname,
      },
    },
  },
});
