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
        "@agenciaweb/kit-site": new URL("./src/site-stub.ts", import.meta.url).pathname,
      },
    },
  },
});
