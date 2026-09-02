# Sitio web — base de verdad

> **Verificado el 2026-08-31** leyendo el código, y **re-anclado el 2026-09-01**
> a la arquitectura de `web-kit` + `sitio-<cliente>`. No está derivado de ningún
> documento previo. El recíproco del CRM es **`CRM.md`, dentro del repo
> `adwebcrm`** (`adwebcrm/docs/CRM.md`) — repositorio distinto, no una carpeta
> hermana.
>
> **Este documento describe dos cosas a la vez, porque son el mismo código:**
> el paquete compartido `web-kit` (estilos, componentes, layout, scripts,
> librería) y cualquier `sitio-<cliente>` que lo consume (páginas, `site.ts`,
> `public/`, marca). Donde importe la diferencia, se dice.
>
> Destino de este fichero: `web-kit/docs/SITIO.md`, cuando el kit exista
> (`agenciaweb/docs/sitio/PLAN-WEB-KIT.md` §5). Hoy vive en el workspace de
> agencia.

## Cómo se usa este documento

**Regla 1 — el código manda.** Si esto y el código discrepan, esto está mal:
arréglalo en el mismo cambio. Cada sección trae el comando para re-derivarla.

**Regla 2 — los comentarios son hipótesis.** En este repo están razonablemente
al día, pero se verifican igual. Un comentario que cita un fichero o un
comportamiento no es prueba de que exista.

**Regla 3 — aquí solo hay dos documentos más y los dos siguen vivos**
(comprobado contra el código, §11). Esto no es como el CRM, donde había doce
documentos fantasma.

**Regla 4 — cero dependencias de estilo o UI.** `package.json` tiene **una**
dependencia de producción: `astro`. Añadir Tailwind, React, una librería de
iconos o de carruseles no es una decisión de estilo, es romper el sistema. (Un
`sitio-<cliente>` tiene una segunda: `@agenciaweb/kit`. Ninguna más.)

**Regla 5 — todo dato del negocio sale de `src/data/site.ts`.** Ningún
teléfono, precio, horario ni dirección escrito dentro de un componente o de una
página.

**Regla 6 — estructura al kit, composición al cliente.** La línea es esta:

| Al `web-kit` | Al `sitio-<cliente>` |
|---|---|
| `styles/` (reset, base, layout, components, motion, `tokens.css`) | `styles/brand.css` — los `@font-face` y ~14 variables de marca |
| `components/**`, `layouts/`, `lib/`, `scripts/`, `content.config.ts` | `pages/**`, `data/site.ts`, `public/**`, `.env` |
| `demo/` con `/atomos` y `/showcase` | — |

**`atomos.astro` y `showcase.astro` viven en `web-kit/demo/` y en ningún otro
sitio.** No en un repo de cliente, no en la salida del scaffolder, no en ningún
`dist/`. Encontrarlos en un repo de cliente significa que alguien copió en vez
de consumir.

**Para diferenciarse, un cliente sobrescribe el import, no forkea el kit.**
Crea `src/components/Header.astro` y cambia esa línea de import. Explícito y
`grep`-eable a propósito: `grep -rn "from '\.\./components/" src/pages/` lista
todas las excepciones del repo. Nada de resolución mágica que prefiera el
fichero local en silencio — este proyecto ya pagó una vez por una sustitución
silenciosa.

---

## 1. Qué es y de qué está hecho

Sitio estático de captación para la clínica: una página por intención de
búsqueda, todas componiendo el mismo catálogo de bloques. Sin servidor propio.

| Pieza | Versión real |
|---|---|
| Astro | ^7.1.6 — `output: "static"`, `base: "/"` |
| Dependencias de producción | **una**: `astro` |
| Dev | `@astrojs/check`, `typescript` ^6 |
| Gestor | **pnpm** siempre (nunca npm ni bun) |

`astro.config.mjs` decide tres cosas que se notan en el navegador:
`inlineStylesheets: "always"` (el CSS viaja en el `<head>`, cero requests
bloqueantes), `compressHTML: true` (el HTML sale en una línea — importante al
verificar con grep) y `prefetch` en hover.

El dominio sale de `PUBLIC_SITE_URL` y alimenta canónicas, Open Graph y
JSON-LD. Con un dominio equivocado ahí, todo el SEO apunta a otro sitio.

```bash
node -e "console.log(require('./package.json').dependencies)"; grep -E "output|base:|site:" astro.config.mjs
```

---

## 2. La arquitectura, que son dos proyectos y un contrato

```
  Navegador
     │
     ├── sitio-<cliente> (Astro estático, dominio del cliente)
     │      HTML, CSS y 4 scripts. Sin backend.
     │      Composición propia; estructura desde @agenciaweb/kit.
     │
     └── adwebcrm (Next.js, subdominio crm.*)
            El ÚNICO backend. Recibe los leads, sirve god.js, guarda tracking.
```

Un despliegue de CRM por marca, con su propio proyecto de Supabase y su propio
`.env` — las `NEXT_PUBLIC_*` se incrustan en tiempo de build, así que una imagen
no puede servir a dos marcas.

**El sitio no consulta ninguna API en build.** Todo lo que sabe está en el
repositorio. Lo único que ocurre en el navegador contra el CRM es:

| Qué | Dónde vive | Para qué |
|---|---|---|
| `god.js` servido por el CRM | `src/layouts/BaseLayout.astro` lo carga con `is:inline` | Atribución cross-session, beacons de comportamiento, rellenar los ocultos del formulario |
| `window.__WACRM_API_URL__` y `__WACRM_SITE_URL__` | Los planta `src/components/SeoHead.astro` | Que `god.js` y `lead-form.ts` sepan a qué CRM hablar |
| Envío del lead | `src/scripts/lead-form.ts` → `POST /api/events` del CRM | Crear el contacto con su atribución |

**El lead se cuenta en la página de gracias, no en el submit.** `lead-form.ts`
deja un traspaso en `sessionStorage` y `thank-you` es quien confirma. La
deduplicación es por `event_id`, generado en el navegador y respetado por el
CRM (allí es columna única). Contar en el submit infla la conversión con
envíos que el servidor rechazó.

Si algo falla del lado del CRM, aquí no se arregla: se nombra con evidencia.
El contrato es de ellos.

```bash
grep -rn "__WACRM_API_URL__\|god.js" src/layouts src/components/SeoHead.astro
grep -n "api/events" -B3 -A12 src/scripts/lead-form.ts
```

---

## 3. El sistema de composición

**No hay treinta componentes. Hay uno que compone y ocho que rellenan.**

| Capa | Qué es | Ficheros reales |
|---|---|---|
| Contenedor | `Section.astro` — el `<section>`, el fondo, el ritmo, el `.container` y la `.row` | 1 |
| Columnas | `.col-12` `.col-6` `.col-4` `.col-3` — clases CSS, no componentes | — |
| Átomos | `src/components/blocks/`: `Card` `Text` `Image` `Gallery` `Stars` `HeroLede` `Marquee` `BookCover` | 8 |
| Cromo y bloques con lógica | `src/components/sections/`: `Header` `Footer` `Breadcrumb` + `HeroVideo` `InstantEstimate` `EstimateResult` `UploadCase` | 7 |
| Sueltos en la raíz de componentes | `ContactForm` `ContactFields` `ContactLauncher` `SeoHead` `YouTubeLite` `HalftoneFade` | 6 |

Y tres módulos en `src/lib/`, que no pintan nada pero deciden cosas:
`crm-url.ts` (resuelve el dominio del CRM y **rompe el build** si es el de
desarrollo, §9), `api-base.ts` y `schema.ts` (el grafo JSON-LD).

`Card` es el contenedor universal: no sabe qué lleva dentro. Una `Card` en
`col-12` **es** la sección tarjeta. Los átomos nunca traen `<section>`,
`.container` ni fondo — eso es trabajo de `Section`.

La pregunta ante cualquier necesidad es «¿qué sección del catálogo es esta?»,
nunca «¿cómo maqueto esto?». Un CSS elegante con tres secciones escritas a mano
es el fracaso del sistema, no su éxito.

Banco de pruebas vivo: **`/atomos`** (las piezas) y **`/showcase`** (las
recetas). Las dos con `noindex`.

```bash
ls src/components/blocks src/components/sections
```

---

## 4. Los datos del negocio

`src/data/site.ts` es la fuente única. Exporta:

`site` (identidad, contacto, dirección, horarios, autoridad — alimenta el
JSON-LD), `PRIMARY_CTA`, `whatsappHref`, `MENU_LINKS`, `TOPBAR`, `PLANS` +
`ArchKey` + `Plan`, `QUOTE_FALLBACK`, `AVG_SAVINGS`, `TREATMENT_OPTIONS`,
`PRICE_LOCK_UNTIL`, `UPLOAD`.

Dos consecuencias prácticas:

- Cambiar un precio o un teléfono es **un fichero**, y se propaga a las 29
  páginas y al JSON-LD a la vez.
- `PRICE_LOCK_UNTIL` es una fecha: cuando pasa, el sitio sigue prometiendo un
  precio caducado. No hay nada que avise.

**El CTA principal se repite 3–5 veces por página con exactamente el mismo
texto** (`PRIMARY_CTA`). Variarlo fragmenta el reconocimiento y se paga en
conversión.

```bash
grep -oE "^export (const|type|interface) [A-Za-z_]+" src/data/site.ts
```

---

## 5. Estilos: dos niveles de token y una sola forma de hacer las cosas

**Los nombres dicen DÓNDE se usa el color, no qué color es.** `--ink-body` es
la tinta del cuerpo; `--cta-bg` es el fondo del botón primario. Nadie tiene que
saber que el turquesa se llama turquesa.

### 5.1 Nivel 1 — primitivas de marca

Siete colores y dos tipografías. **Es lo único que un cliente sobrescribe**, en
su `src/styles/brand.css`, que se importa DESPUÉS de `tokens.css` del kit.

| Primitiva | Papel | Proporción |
|---|---|---|
| `--brand-dark` | El oscuro: fondos oscuros, tinta del cuerpo, bordes de campo, velo | **60%** |
| `--brand-light` | El claro: fondo de página, superficies, tinta sobre oscuro | — |
| `--brand-neutral` | Franja alterna: el segundo fondo claro | — |
| `--brand-primary` | El color de la marca: superficies y filetes | **30%** |
| `--brand-primary-strong` | El primario que aguanta texto **sobre claro** · ≥4.5:1 | — |
| `--brand-primary-on-dark` | El primario que se lee **sobre oscuro** · ≥4.5:1 | — |
| `--brand-primary-soft` | Tinte del primario: superficie suave, títulos sobre oscuro | — |
| `--brand-accent` | **El acento**: fondo del CTA supremo | **10%** |
| `--brand-ink-on-accent` | La tinta que va ENCIMA del acento · ≥4.5:1 contra él | — |

### Acento y primario no son lo mismo

Sigue el reparto **60/30/10**. El primario es el caballo de batalla —13 usos
como superficie, 19 como texto—; el acento es **escaso a propósito**: la
jerarquía suprema, el CTA del hero o del header, un botón por pantalla. Si
aparece tres veces deja de destacar y ya solo es otro primario.

**El acento es SUPERFICIE, no tinta, y por eso no tiene que pasar contraste él
mismo.** Lo que debe pasarlo es `--brand-ink-on-accent` encima de él. Por eso un
naranja vivo vale como acento y sería ilegible como texto. Los tres del primario
sí llevan texto, y por eso `-strong` y `-on-dark` dicen en su nombre dónde son
legibles.

Sin acento propio, `--brand-accent` hereda `--brand-primary-strong` y
`.button.accent` se ve igual que `.button.primary`: la marca que no tiene un
cuarto color no paga nada por el hueco.



### 5.2 Nivel 2 — semánticos, por función

Derivan de las primitivas. **No se tocan por cliente**; cambiarlos aquí afecta
a todos los sitios, que es el punto del kit.

| Familia | Tokens |
|---|---|
| Tinta | `--ink-body` `--ink-title` `--ink-primary` `--ink-muted` `--ink-strong` `--ink-on-primary` |
| Tinta sobre oscuro | `--ink-body-on-dark` `--ink-title-on-dark` `--accent` |
| Fondo | `--bg-page` `--bg-alt` `--bg-soft` `--bg-dark` `--bg-cta` |
| Superficie | `--surface-card` `--surface-primary-soft` |
| Acento y CTA | `--primary` `--cta-bg` |
| Borde | `--border-hairline` `--border-field` |

**`-on-dark` es un contexto, no otra paleta.** `.bg-dark` reapunta la tinta al
entrar en una sección oscura o con foto, y `.card` la devuelve al valor claro
si una tarjeta clara cae dentro de una sección oscura. El componente no elige:
hereda del contenedor.

### 5.3 Los ficheros

| Fichero | Qué contiene |
|---|---|
| `01-reset.css` | Reset mínimo |
| `tokens.css` | Primitivas + semánticos + escala (tipografía, ritmo, grilla, radios) |
| `03-base.css` | Elementos desnudos |
| `04-layout.css` | `.container`, `.row`, `.col-*`, `.bg-dark` |
| `05-components.css` | El catálogo, con **una** clase `.card` |
| `07-motion.css` | Movimiento, respetando `prefers-reduced-motion` |

**Un solo breakpoint: `900px`, y mobile-first literal.** El caso base no lleva
media query. **Cero** `@media (max-width` en el kit. Si escribes uno, la lógica
está invertida.

Lo que delata una plantilla y aquí no debe entrar: un `#3B82F6` suelto, un
`padding: 17px`, un gradiente morado, sombras apiladas, emojis como iconos.
El tema es **un** color en tres papeles (título, enlace, botón), no tres.

```bash
grep -c -- '--brand-' styles/tokens.css        # 9 primitivas
grep -rn '@media (max-width' styles/ components/   # debe ser 0
```

## 6. El JavaScript que llega al navegador

Cuatro ficheros propios en `src/scripts/`, todos importados desde un `<script>`
de un `.astro` — nunca desde el frontmatter (se ejecutaría en build y no
viajaría) ni con `define:vars` (eso implica `is:inline`: Astro no lo compila y
el TypeScript llega crudo al navegador).

| Script | Qué hace |
|---|---|
| `lead-form.ts` | Valida, arma la atribución y envía el lead al CRM |
| `wa-ref.ts` | Inyecta el `ref_code` en los enlaces de WhatsApp |
| `upload-case.ts` | Subida de radiografías del bloque `UploadCase` |
| `estimate-result.ts` | Presupuesto instantáneo en la página de gracias |

Más `god.js`, que es del CRM y no vive aquí.

**Todo lo demás se resuelve sin JavaScript**: acordeón, menú, pestañas,
lightbox, carrusel y fachada de vídeo son CSS. Si vas a añadir un script,
primero: ¿lo resuelve el navegador nativamente? ¿lo resuelve el CSS?

---

## 7. Las 29 páginas

Una página `.astro` = una landing = una intención de búsqueda. Sin JSON, sin
YAML, sin colecciones de contenido para las landings.

- **25 indexables**: la home más 24 páginas de intención (coste, ciudad, marca
  competidora, tipo de tratamiento, turismo dental, reviews, legales y las dos
  de gracias).
- **3 con `noindex`**: `/atomos`, `/showcase`, `/landing-final-copy`.
- **1 error**: `404`.

**Enlazado interno.** `src/content.config.ts` define una colección con un
loader propio que lee el `export const meta` de cada página. **Una página sin
`meta` no se enlaza desde ninguna parte** — existe, pero es huérfana en el
grafo interno. Hoy son 18 de 29 las que lo tienen (§10).

`docs/MAPA-KEYWORDS.md` dice qué término **posee** cada página y cuáles tiene
prohibidos. Es lo que evita que dos páginas del propio sitio compitan entre
ellas. Consúltalo antes de crear una página nueva o de cambiar un `<title>`.

```bash
ls src/pages/*.astro | wc -l
for f in src/pages/*.astro; do grep -q "export const meta" "$f" || basename "$f" .astro; done
```

---

## 8. SEO

`src/components/SeoHead.astro` centraliza el `<head>`: canónica, Open Graph,
`robots` (respeta `noindex` por página y `site.indexable` global), preconnects
condicionales y **el grafo JSON-LD completo**, construido desde `site.ts`.

`BaseLayout.astro` hace algo poco habitual y deliberado: **renderiza el cuerpo
antes que la cabecera**. Así un `<Image priority>` puede dejar su ficha en
`Astro.locals` y `SeoHead` emitir el `preload` correspondiente. Si alguien
"ordena" ese layout, el preload de la imagen del hero desaparece.

Reglas de copy que se pagan en dinero: título de 50–60 caracteres con la
consulta al principio y la marca al final; descripción de 140–160 como texto
publicitario, no como resumen; y **el H1 repite el lenguaje del anuncio que
trajo el clic** — la desalineación se paga en rebote y en Quality Score.

`public/robots.txt` y `public/sitemap.xml` son **estáticos y manuales**: no se
generan en el build (§10).

---

## 9. Compilar y verificar

**El build exige el dominio del CRM en la línea de comandos:**

```bash
LANDING_API_URL=https://crm.example.com pnpm build
```

Con `pnpm build` a secas **falla a propósito**, y conviene entender por qué:
el `.env` local lleva `localhost:3000`, que es lo correcto para `astro dev` y
veneno en un build. Un build de producción con ese valor despliega un HTML con
`<script src="http://localhost:3000/god.js">` y la API del CRM apuntando a la
máquina del visitante — cero atribución y cero leads, sin ningún síntoma
visible hasta que semanas después alguien pregunta por qué no entra nadie.
`src/lib/crm-url.ts` rompe el build antes que dejar que eso salga. Ya pasó una
vez.

Es el ejemplo del criterio de este repo: **un dato que falta rompe el build, no
se rellena con un placeholder.**

```bash
grep -rn '@media (max-width' src/
grep -rn 'style="' src/ | grep -v -- '--'
grep -o '<iframe' dist/index.html | wc -l
```

Dos trampas al verificar:

1. **Build verde no prueba nada sobre el navegador.** Astro tiene fallos que no
   dan error de build (un script en el frontmatter que nunca viaja, un
   `define:vars` que manda TypeScript crudo).
2. **`grep -c` miente aquí.** Con `compressHTML` el HTML es una sola línea, así
   que cuenta líneas, no ocurrencias. Usa `grep -o … | wc -l` y verifica sobre
   `dist/`, no sobre el fuente.

---

## 10. Deuda conocida y verificada

- **Seis landings reales están huérfanas en el enlazado interno** por no tener
  `export const meta`: `3-on-6-dental-implants-mexico`,
  `all-on-6-dental-implants-mexico`, `dental-tourism-mexico`,
  `full-arch-dental-implants-mexico`, `nobel-biocare-implants-mexico` y
  `zygomatic-dental-implants-mexico`. Se indexan, pero ninguna otra página del
  sitio las enlaza.
- **El sitemap está desfasado**: 21 URLs para 25 páginas indexables. Faltan
  `/privacy-policy` y `/terms` (las dos de gracias es discutible que deban
  estar). Al ser manual, cada página nueva nace fuera del sitemap.
- **`/atomos` sí tiene `meta`**, así que entra en la colección de enlazado
  interno aunque sea una página de laboratorio. `/showcase` no lo tiene.
- **`PRICE_LOCK_UNTIL` no avisa al caducar**: pasada la fecha, el sitio sigue
  prometiendo un precio que ya no aplica.

---

## 11. Los otros dos documentos de esta carpeta

A diferencia del CRM, aquí **los dos están vivos y verificados**:

| Fichero | Qué es | Comprobación |
|---|---|---|
| `MAPA-KEYWORDS.md` | Qué término posee cada página y cuáles tiene prohibidos | Ninguna de las páginas que cita ha desaparecido |
| `hero-video.md` | Cómo preparar los archivos del vídeo del hero, y por qué se abandonó el embed de YouTube (`god.js` secuestraba el nodo) | `HeroVideo.astro` usa dos `<video>` locales y ningún iframe, como dice |

`MAPA-KEYWORDS.md` no trae volúmenes de búsqueda **a propósito**: no hay una
fuente fiable conectada, y prefiere repartir por intención antes que inventar
cifras. Si algún día se conecta Search Console, ahí es donde entran.
