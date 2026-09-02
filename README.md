# @agenciaweb/kit

Framework de diseño de la agencia: estilos, componentes, layouts y scripts del
sitio. Los sitios de cliente lo **consumen versionado; no lo copian**. Los
tokens de `styles/tokens.css` son los **defaults** — lo que hace distinta a
una marca vive en el cliente (`brand.css` + `site.ts`).

## Qué hay aquí

```
components/   bloques (blocks/), secciones (sections/) y sueltos (ContactForm…)
layouts/      BaseLayout.astro — shell HTML/SEO/JSON-LD
lib/          crm-url.ts · api-base.ts · schema.ts (grafo JSON-LD)
scripts/      lead-form · wa-ref · upload-case · estimate-result
styles/       01-reset · tokens(defaults) · 03-base · 04-layout · 05-components · 07-motion
demo/         EL catálogo: /atomos (piezas) y /showcase (recetas). Vive aquí
              y en ningún otro sitio — ni en clientes, ni en el scaffolder,
              ni en ningún dist/.
scaffold/     plantilla que emite `pnpm create-sitio <cliente>`
```

## Cómo lo consume un sitio de cliente

1. Dependencia (mientras web-kit no esté en GitHub, ruta local; después,
   `github:Dacasan/web-kit#semver:^1.0.0`):

   ```json
   "@agenciaweb/kit": "file:../../../web-kit"
   ```

2. `src/styles/index.css` del cliente — capas, con `brand.css` en la capa
   `tokens`. Si la marca **overridea** tokens, `brand.css` va **después** del
   kit (gana por orden de fuente). Si no hay overrides (los valores son los
   defaults), va antes para conservar el orden histórico del CSS emitido:

   ```css
   @import '@agenciaweb/kit/styles/tokens.css' layer(tokens);
   @import './brand.css' layer(tokens); /* ← después del kit si overridea */
   ```

3. Contrato de datos — **explícito, nunca un resolver silencioso**. Los
   componentes del kit consumen el dato del cliente vía el specifier
   `@agenciaweb/kit-site` y CADA consumidor lo resuelve a su propio módulo en
   `astro.config.mjs` (grep-able: `grep -n kit-site astro.config.mjs`):

   ```js
   vite: { resolve: { alias: {
     "@agenciaweb/kit-site": new URL("./src/data/site.ts", import.meta.url).pathname,
   }}}
   ```

   El módulo debe exportar: `site` (con `smsConsentText`, que lleva `{name}`),
   `PRIMARY_CTA`, `whatsappHref`, `MENU_LINKS`, `TOPBAR`, `PLANS`,
   `QUOTE_FALLBACK`, `AVG_SAVINGS`, `TREATMENT_OPTIONS`, `PRICE_LOCK_UNTIL`,
   `UPLOAD`, `PAGINAS`, `HERRAMIENTAS` (mapa del pie).

## El patrón override (única vía para un componente a medida)

Un cliente que necesita un `Header` propio **no forkea el kit**: crea
`src/components/Header.astro` local y cambia ESE import:

```diff
- import Header from '@agenciaweb/kit/components/sections/Header.astro';
+ import Header from '../components/Header.astro';
```

Explícito, no mágico. No existe resolver que prefiera un fichero local en
silencio. Todos los overrides de un repo están a un comando:

```bash
grep -rn "from '\.\./components/" src/pages/
```

## Fuentes

Son **marca, no estructura**: `@font-face` vive en el `brand.css` del cliente
y los `.woff2` en el `public/fonts/` del cliente. El kit solo declara
`--font-family-sans` y `--font-display` como variables. Nunca envíes ficheros
de fuente desde el kit — las rutas `/fonts/…` son absolutas y resuelven contra
el origen del cliente.

## Antes de taggear una release

`cd demo && LANDING_API_URL=https://crm.example.com pnpm build` en verde, con
`/atomos` y `/showcase` renderizando cada pieza. Luego tag semver (`v1.x.y`) —
los sitios consumen `#semver:^1`.
