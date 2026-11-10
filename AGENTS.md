# web-kit — AGENTS.md

> Estructura compartida de los sitios de cliente. Documentación completa:
> `../sitio-docs/src/content/docs/web-kit/` (architecture · components ·
> design-tokens · new-site; repo `Dacasan/sitio-docs`). Este fichero repite
> solo lo que cuesta dinero.

## Qué es este repo

`Dacasan/web-kit` (público, licencia propietaria): `styles/`, `components/`,
`layouts/BaseLayout.astro`, `lib/`, `scripts/`, el catálogo `demo/` y la
plantilla `scaffold/`. Los sitios lo consumen versionado — no copiado — vía
`github:Dacasan/web-kit#semver:^X.Y.Z`.

Un sitio de cliente es SOLO composición: páginas, `src/data/site.ts`,
`src/styles/brand.css`, `public/`. Editar un componente de cliente desde aquí,
o uno del kit desde un sitio, es frontera cruzada.

## Reglas que cuestan dinero

1. **`demo/` es el release gate.** `pnpm verify` (check de tipos +
   `LANDING_API_URL` + build + `audit:a11y`) en verde antes de tagear. CI lo
   corre en push a `main` y en PRs — crear un tag no dispara nada. Además
   compila un sitio recién salido del scaffolder: lo que no se compila, se
   entrega roto.
   **No** cubre HeroVideo (necesita vídeo y póster reales): verifícalo a mano
   al tocarlo.
2. **Versiones por tag, no por rama.** Los sitios resuelven `semver:^X.Y.Z`
   contra tags de git. Un cambio debe salir con tag (`vX.Y.Z`) o ningún sitio
   lo verá. `package.json.version` se sincroniza con el tag con
   `pnpm version:sync` — no lo edites a mano. `private: true`: no se publica
   a npm.
3. **Mobile-first literal, un breakpoint: `900px`.** Cero
   `@media (max-width` — todas las `@media` de maqueta son
   `(min-width: 900px)`. Únicos `max-width` legítimos: atributos `media=` de
   precarga/`<source>` (`SeoHead.astro`, `YouTubeLite.astro`) — aritmética de
   preload, no maqueta.
4. **Sin dependencias nuevas.** `astro` como peer dep (`^7.1.6`) y nada más;
   cero dependencias de runtime. `playwright` es devDep del raíz para el
   audit; `@astrojs/check` + `typescript@6` son devDeps del demo/scaffold
   para el typecheck (`typescript@7` rompe `astro check`).
5. **Los datos del negocio nunca entran al kit.** El kit consume
   `@agenciaweb/kit-site`; cada sitio lo resuelve a su `site.ts` en
   `astro.config.mjs` (alias explícito, grep-able).
6. **Un build de producción no se publica sin destino.** Sin
   `LANDING_API_URL` el build falla (`lib/crm-url.ts`); sin
   `PUBLIC_SITE_URL` también (`scaffold/src/data/site.ts`). Ambas fallas son
   silenciosas en producción si se dejan pasar: cero leads y canonical a un
   dominio ajeno.

## Opt-ins de `site.ts` — el kit emite solo si el sitio lo declara

| Campo | Efecto | Estado vacío/ausente |
|---|---|---|
| `googleAdsConversionId` | Google tag base (gtag.js, `AW-…`) + preconnect a GTM | No emite nada |
| `metaPixelId` (kit ≥ v1.2.8) | Meta pixel base code + fallback `<noscript>` | No emite nada |
| `ga4MeasurementId` (kit ≥ v1.2.26) | GA4 analytics (gtag.js, `G-…`) + cuenta en el preconnect a GTM | No emite nada |
| `aiDiscovery` | 3 `<link>`: `llms.txt`, `/.well-known/ard.json`, `/.well-known/ai-catalog.json` (requiere publicar esos ficheros) | No emite nada |
| `originTrialToken` | `<meta http-equiv="origin-trial">` (WebMCP; experimental, Chrome) | No emite nada |
| `leadExtraFields` | Campos extra en `ContactFields`; viajan al `message` del lead | Cero campos extra |
| `formLabels` | Textos del formulario por sitio | Defaults en inglés |

- **Cast defensivo** en los componentes: los campos son opcionales a nivel de
  tipos (`site as {…}`) — un sitio viejo que actualice el kit sigue compilando.
- **demo y scaffold nacen apagados** (`""` / ausentes): el catálogo no emite
  tags de terceros ni conexiones condicionadas; los sitios nuevos heredan el
  estado neutro.
- **Las conversiones NO viven aquí.** El píxel y el gtag son señal de
  página/cookies de primera parte; las conversiones las entrega el CRM
  server-side (Google Data Manager, Meta CAPI — ver
  `../sitio-docs/src/content/docs/crm/attribution.md`).
- **`ContactFields.astro` es contrato two-PR con el CRM.**
  `fillHiddenInputs` de `god.ts` (CRM; servido como `/god.js`) rellena y
  `lead-form.ts` (kit) lee. Los campos ad-level de Google Ads llevan prefijo
  `gads_`; también viajan `utm_*`, `gclid`/`fbclid`/…, `event_id`,
  `visitor_id`, `fbc`/`fbp`. Cambiar un `name` de un solo lado = pérdida
  silenciosa de datos.

## Otros

- Receta de compresión del vídeo del hero: `docs/hero-video.md` (única doc
  local del repo).
- Scaffolder: `pnpm create-sitio <cliente>` copia `scaffold/` a
  `../clientes/<cliente>/sitio-<cliente>/` (`create-sitio.mjs`). Sale con
  `file:../../../web-kit` para desarrollo local; al publicar se cambia a
  `github:Dacasan/web-kit#semver:^X.Y.Z`.

## Verify

```bash
pnpm verify   # tipos + build del demo + audit a11y (0 bloqueantes)
pnpm --dir demo build                                   # build solo
CHROME_PATH=/usr/bin/chromium pnpm audit:a11y           # sin navegador propio
grep -c 'aria-expanded' components/sections/Header.astro components/ContactLauncher.astro
grep -n 'googleAdsConversionId\|metaPixelId\|ga4MeasurementId' demo/src/site-stub.ts scaffold/src/data/site.ts  # todos: ""
grep -o 'googletagmanager\|connect\.facebook' demo/dist/atomos/index.html | wc -l     # 0 tras build (dist/ no versionado)
```

Un build verde no prueba accesibilidad: `pnpm audit:a11y` corre sobre
`demo/dist` en Chromium real y sale con código 1 si hay bloqueantes. Es la
séptima regla, hecha ejecutable.
