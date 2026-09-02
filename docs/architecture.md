# Architecture

Stack, folder layout, how a client site consumes the kit, and the CRM boundary.

## Stack

| Layer | Tool | Why |
|---|---|---|
| Rendering | **Astro 7** (`output: "static"`) | Zero JavaScript by default. Every client site ships HTML and CSS; the four scripts below are the only JS that reaches the browser. |
| Styling | **Native CSS with `@layer`** | No Tailwind, no CSS-in-JS. Explicit cascade order instead of specificity wars, and no framework defaults to inherit. |
| Distribution | **Git dependency, semver range** | Sites depend on `github:Dacasan/web-kit#semver:^1.0.0`. No registry, no auth token for public consumers, versions resolved from git tags. |
| Client data | **Import alias** | Kit components import `@agenciaweb/kit-site`; each consumer resolves that alias to its own data file. |
| Backend | **None** | The kit has no server. Forms POST to a separate CRM deployment. |

The package declares `astro` as a peer dependency and has **zero runtime
dependencies of its own**.

## Package exports

```json
"exports": {
  "./styles/*":     "./styles/*",
  "./components/*": "./components/*",
  "./layouts/*":    "./layouts/*",
  "./lib/*":        "./lib/*",
  "./scripts/*":    "./scripts/*"
}
```

Source files ship as-is — no build step. Astro compiles `.astro` and `.ts` from
`node_modules` the same way it compiles local files.

## Folder layout

```
web-kit/
├─ styles/                          1,138 lines, six files, one @layer each
│  ├─ 01-reset.css                    8    minimal reset
│  ├─ tokens.css                    118    brand primitives + semantic tokens + scale
│  ├─ 03-base.css                    64    bare elements
│  ├─ 04-layout.css                 137    .container, .row, .col-*, .bg-dark
│  ├─ 05-components.css             800    the component catalogue
│  └─ 07-motion.css                  11    motion, gated on prefers-reduced-motion
│
├─ components/
│  ├─ Section.astro                   the <section> wrapper: background, rhythm, container, row
│  ├─ SeoHead.astro                   title, meta, canonical, JSON-LD graph, CRM globals
│  ├─ ContactForm.astro               the lead form
│  ├─ ContactFields.astro             hidden attribution inputs — contract with the CRM
│  ├─ ContactLauncher.astro           floating contact actions
│  ├─ YouTubeLite.astro               facade video embed
│  ├─ HalftoneFade.astro              decorative overlay
│  ├─ blocks/                       content atoms, no section or background of their own
│  │  └─ BookCover · Card · Gallery · HeroLede · Image · Marquee · Stars · Text
│  └─ sections/                     composites that carry their own layout
│     └─ Breadcrumb · EstimateResult · Footer · Header · HeroVideo
│        InstantEstimate · UploadCase
│
├─ layouts/
│  └─ BaseLayout.astro              HTML shell; mounts SeoHead, Footer, ContactLauncher
│                                     and loads god.js from the CRM domain
├─ lib/
│  ├─ crm-url.ts                    resolves the CRM domain at build time; fails the build
│  │                                  on a localhost URL in production
│  ├─ api-base.ts                   resolves the API host at runtime from window
│  └─ schema.ts                     JSON-LD graph builder
│
├─ scripts/                         the only JavaScript shipped to the browser
│  ├─ lead-form.ts                    collects attribution, POSTs the lead
│  ├─ upload-case.ts                  multipart file upload
│  ├─ estimate-result.ts              renders a stored estimate
│  └─ wa-ref.ts                       appends a reference code to WhatsApp links
│
├─ scaffold/                        template copied by create-sitio.mjs
├─ demo/                            catalogue site: /atomos and /showcase
├─ create-sitio.mjs                 generates a new client site
└─ docs/                            you are here
```

## What lives here, and what does not

The split is **structure versus composition**.

| In the kit | In each client site |
|---|---|
| `styles/` — reset, base, layout, components, motion, the token scale | `src/styles/brand.css` — nine brand values |
| `components/`, `layouts/`, `lib/`, `scripts/` | `src/pages/` — the pages and their copy |
| `tokens.css` — semantic tokens and neutral primitive defaults | `src/data/site.ts` — every business fact |
| — | `public/` — logo, fonts, images |
| — | `.env` — the two build variables |

A client site contains **no components of its own**. If a client needs a
variant, it overrides the import for that one file rather than forking the kit.

## How a site consumes the kit

**1. Declare the dependency.**

```json
"dependencies": {
  "astro": "^7.1.6",
  "@agenciaweb/kit": "github:Dacasan/web-kit#semver:^1.0.0"
}
```

The range resolves against git tags, so `v1.1.0` reaches every site on its next
install and `v2.0.0` does not.

**2. Resolve the data alias** in `astro.config.mjs`:

```js
vite: {
  resolve: {
    alias: {
      "@agenciaweb/kit-site": new URL("./src/data/site.ts", import.meta.url).pathname,
    },
  },
}
```

Kit components import business data from `@agenciaweb/kit-site`. The kit never
ships that file — each consumer points the alias at its own. The demo site
points it at a stub so the catalogue builds without a client.

**3. Import the stylesheets in order** in `src/styles/index.css`:

```css
@layer reset, tokens, base, layout, components, utilities;

@import '@agenciaweb/kit/styles/01-reset.css' layer(reset);
@import '@agenciaweb/kit/styles/tokens.css'   layer(tokens);
@import './brand.css'                          layer(tokens);
@import '@agenciaweb/kit/styles/03-base.css'  layer(base);
@import '@agenciaweb/kit/styles/04-layout.css' layer(layout);
@import '@agenciaweb/kit/styles/05-components.css' layer(components);
@import '@agenciaweb/kit/styles/07-motion.css';
```

`brand.css` must come **after** `tokens.css`. Both declare in the `tokens`
layer, so within the layer the later source wins. Reversed, brand overrides
lose and the site silently renders the kit's neutral defaults.

## Build-time configuration

Two environment variables, read in `lib/crm-url.ts`:

| Variable | Purpose |
|---|---|
| `PUBLIC_SITE_URL` | The site's own domain. Feeds canonical URLs, Open Graph and JSON-LD. |
| `LANDING_API_URL` | The CRM domain. Destination for forms and tracking. |

`crm-url.ts` resolves in this order: `import.meta.env` → `process.env`
(`LANDING_API_URL`, then `CRM_API_URL`) → fallback. In development the fallback
is `http://localhost:3000`; in a production build it is `site.baseUrl`.

**A production build throws if the resolved CRM URL points at localhost.** The
local `.env` carries `localhost:3000`, which is correct for `astro dev` and
poison in a build: it would emit `<script src="http://localhost:3000/god.js">`
into the deployed HTML, where it silently fails and every lead is lost. The
guard turns that into a failed build instead.

## Request lifecycle: a lead

```
 Visitor fills the form ──▶ ContactForm (kit)
                             │
                             ├─ ContactFields declares the hidden inputs
                             │    (the field names are the contract with the CRM)
                             │
                             ├─ god.js — served from the CRM domain, executes on
                             │    the site's origin, so cookies are first-party.
                             │    Fills the hidden inputs with attribution.
                             │
                             └─ lead-form.ts reads the fields and POSTs
                                     │
                                     ▼
                          {LANDING_API_URL}/api/events
                                     │
                                     └─ CRM stores lead + attribution
```

File uploads follow the same path through `upload-case.ts`, POSTing multipart
form data to `{LANDING_API_URL}/api/uploads`.

**The asymmetry that matters.** `god.js` is built and served by the CRM but runs
on the site. Deploying the CRM changes the script every site executes, without
anyone deploying a site — but the hidden inputs that script fills are declared
here, in `ContactFields.astro`. Adding a field on one side without the other
does not fail: `fillHiddenInputs` skips inputs that do not exist, so data stops
flowing with no error anywhere.

## Boundary with the CRM

Six lines cross between this kit and the CRM. Everything else is independent.

| What crosses | Direction | Anchor |
|---|---|---|
| `god.js` | CRM → site | Built in the CRM (`pnpm build:god`), loaded by `layouts/BaseLayout.astro` |
| `window.__WACRM_API_URL__` | site → browser | Injected by `components/SeoHead.astro`, read by `lib/api-base.ts` |
| `POST /api/events` | site → CRM | `scripts/lead-form.ts` |
| `GET/POST /api/track` | site → CRM | Beacons emitted by `god.js` |
| `POST /api/uploads` | site → CRM | `scripts/upload-case.ts` |
| Hidden input names | shared contract | Declared in `ContactFields.astro`, filled by `god.js`, read by `lead-form.ts` |

`__WACRM_API_URL__` is a wire-level identifier, not a brand name. Renaming it in
one repository and not the other breaks lead capture silently.

## Continuous integration

`.github/workflows` builds the demo catalogue on every push:

```yaml
- run: pnpm --dir demo install --no-frozen-lockfile
- run: pnpm --dir demo build
```

The catalogue imports every component, so a build failure means a component is
broken. This is the release gate: tag a version only on a green build.

## Where to change things

| Want to change… | Start here |
|---|---|
| A brand colour or typeface | The client's `src/styles/brand.css` — never `tokens.css` |
| A colour's meaning across all sites | `styles/tokens.css`, semantic layer |
| Spacing, type scale, radii | `styles/tokens.css`, scale section |
| How a component looks | `styles/05-components.css` |
| Grid, columns, dark sections | `styles/04-layout.css` |
| Add a content block | `components/blocks/`, then add it to `demo/src/pages/atomos.astro` |
| Add a composite section | `components/sections/` |
| Page shell, `<head>`, script loading | `layouts/BaseLayout.astro` |
| SEO output or JSON-LD | `components/SeoHead.astro` + `lib/schema.ts` |
| Form fields sent to the CRM | `components/ContactFields.astro` **and** the CRM, in two PRs |
| What a new client site starts with | `scaffold/` and `create-sitio.mjs` |

## Rules this codebase enforces

- **One breakpoint: `900px`, mobile-first.** The base case carries no media
  query. There are zero `@media (max-width` declarations; writing one means the
  logic is inverted.
- **If it is not in `/atomos`, it does not exist.** A component that is not in
  the catalogue cannot be reviewed and will not be reused.
- **No business data inside a component.** Every phone number, price and address
  comes from the client's `site.ts`.
- **pnpm only.**
