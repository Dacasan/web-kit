import { defineConfig } from "astro/config";

export default defineConfig({
  base: "/",
  output: "static",
  site: "https://kitdemo.example",
  build: { inlineStylesheets: "always" },
  compressHTML: true,
  vite: {
    resolve: {
      alias: {
        // Contrato de datos del kit: los componentes consumen site vía este
        // specifier y CADA consumidor lo resuelve a su propio site.ts.
        // Explícito y grep-able; nunca un resolver silencioso.
        // (El build del demo necesita LANDING_API_URL≠localhost: lib/crm-url.ts
        // rompe el build ante dominios locales — SITIO.md §9.)
        "@agenciaweb/kit-site": new URL("./src/site-stub.ts", import.meta.url).pathname,
      },
    },
  },
});
