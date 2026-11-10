# Complemento — bien vs mal, y de dónde sale todo

**Continuación de** `AUDITORIA-a11y-design-system-critica.md`
**Repos:** `web-kit` (v1.2.3 en `main`) + `clientes/allon4dentalcenter/sitio-allon4dentalcenter` (consume v1.2.2)
**Entregable ejecutable:** `web-kit/tools/audit-a11y.mjs` — 421 líneas, ya escrito en tu repo

---

## 0. Lo primero: un hallazgo nuevo, y es de los graves

Escribí el script de auditoría para que reprodujera solo lo que yo había encontrado a mano. Reprodujo 31 de 33 hallazgos… y encontró **dos que se me habían pasado**. Uno de ellos es crítico:

> ### 🔴 Los campos del formulario no tienen indicador de foco. Ninguno.
>
> No es "débil". Es **cero cambio visual al enfocar**, verificado dos veces en Chromium:
>
> ```
> #home-guide-name  ·  antes de enfocar → después de enfocar
>   border-color :  rgb(107,107,107)  →  rgb(107,107,107)     ← idéntico
>   outline      :  none              →  none                 ← explícito en el CSS
>   box-shadow   :  none              →  color totalmente transparente
> ```
>
> **La causa es especificidad, y es de manual:**
>
> ```css
> /* 03-base.css — regla A */
> input:not([type="checkbox"]):not([type="radio"]):not([type="submit"]),
> select, textarea { border: 1px solid var(--ink-muted); }        /* (0,3,1) */
>
> /* 03-base.css — regla B, 8 líneas más abajo */
> input:focus, select:focus, textarea:focus {
>   outline: none;                                                /* (0,1,1) */
>   border-color: var(--border-field);        ← nunca gana
>   box-shadow: 0 0 0 3px color-mix(...18%...); ← invisible de todos modos
> }
> ```
>
> Cada `:not()` aporta la especificidad de su argumento. Tres `:not([attr])` = **(0,3,0)**, más el tipo = **(0,3,1)**. La regla de `:focus` es **(0,1,1)** y pierde. Y como la regla A usa el atajo `border` (que incluye `border-color`), se lleva por delante el `border-color` del foco.
>
> **Consecuencia:** un usuario de teclado rellenando el formulario de captación **no puede ver en qué campo está**. Y `outline: none` está puesto a mano, así que tampoco queda el anillo del navegador. Es la ruta de conversión entera del sitio.
>
> **Arreglo (2 líneas):** quitar `outline: none` de la regla B y darle a `:focus-visible` la misma cadena de `:not()`, o simplemente subirla a `input:focus-visible:not([type="checkbox"])…`.

El segundo hallazgo nuevo: **el anillo de foco de la × que cierra el lightbox da 1.54:1** contra el fondo `rgba(0,0,0,.92)` de la capa. Mismo `--border-field` oscuro, otro fondo oscuro.

**Esto es exactamente lo que quiere decir "de aquí sale mucho":** un chequeo automático de 400 líneas encuentra en 90 segundos cosas que dos horas de lectura de código no encuentran, y las encontrará otra vez en cada sitio que hagas.

---

## 1. El patrón que lo explica todo

Al ordenar los 33 hallazgos apareció algo que no esperaba: **casi ninguno es desconocimiento.** En prácticamente todos los casos, **el kit hace la cosa correcta en un archivo y la incorrecta en el de al lado**.

No tienes un problema de accesibilidad. Tienes un problema de **propagación**: el conocimiento existe, está escrito, funciona — y no es reutilizable, así que cada componente vuelve a decidir desde cero y a veces decide mal.

### Bien vs mal, cara a cara

| Lo que hay que resolver | 🔴 Dónde lo hace MAL | ✅ Dónde lo hace BIEN — en el mismo kit |
|---|---|---|
| **Ocultar una capa** sin dejarla en el orden de tabulación | `.lightbox { opacity: 0; pointer-events: none }` → 10 capas y ~17 paradas de foco fantasma por página, en 20 páginas | `.lx-panel { visibility: hidden }` — `05-components.css:400`. **Está 233 líneas más arriba en el mismo archivo** |
| **Anillo de foco visible** sobre cualquier fondo | `03-base.css`: `outline: 2px solid var(--border-field)` = el mismo color que `--bg-dark` → **1:1** en barra, menú, pie y botón de play | `Header.astro:242`: `.nav-toggle:focus-visible { outline: 2px solid var(--ink-body-on-dark) }` — anillo claro **porque el fondo es oscuro**. Aquí sí se pensó |
| **Nombre accesible** en un contenedor | `Stars` (`<p>`), `nav-rating` (`<div>`), `Marquee` (`<div>`): `aria-label` sobre roles que **prohíben nombre**. Se pierde | `Section.astro:148`: `role="group"` + `aria-label`. Verificado en el árbol del navegador: *"group: The Patient Journey…"*. **Funciona porque añade el rol** |
| **Región desplazable** operable con teclado | `.rail` y `.chips`: barra oculta, sin rol, sin nombre, sin `tabindex` | `Section.astro`: `role="group"` + `aria-label` + `tabindex="0"` **y rompe el build** si falta el nombre (línea 115). Es el mejor código del kit |
| **Defaults que no se pueden inventar** | `Image.astro`: `alt = ''` por defecto, en silencio. La única prop de accesibilidad del componente | El mismo `Image.astro` **lanza una excepción** si faltan `width`/`height`. Y `Faq` lanza con `items` vacío. Y `Section` lanza sin `label`. Tres veces la doctrina correcta, y la cuarta se salta |
| **Texto sobre un color de marca** | `.lx-head`: blanco sobre verde WhatsApp = **1.98:1** | `.pricing-table caption`: usa el par `--cta-bg`/`--ink-on-primary` **con el razonamiento escrito en el comentario** (líneas 707-711), y da 5.52:1. Alguien hizo la cuenta ahí |
| **Cero hex fuera de tokens** | 20 hex literales + 32 `rgba()` dentro del kit | `Section.astro:42`: *"Fondo. Solo tokens: aquí no entra ningún hex."* La regla está escrita. En un sitio |
| **Estado de un control** | `#lx-open`, `#lx-support`, `#nav-toggle`: casillas ocultas, anunciadas como *"casilla, no marcada"*, sin `aria-expanded` | `.chip[aria-current]`: el estado activo lo marca `aria-current`, **no una clase**. Correcto y poco común |
| **`prefers-reduced-motion`** | Overrides componente a componente, uno por uno, recordando cada vez | La regla global `*` de `07-motion.css`, que **sí funciona** — por importarse sin `layer()` |
| **Ocultar del lector de pantalla** | — | `.form__trap`: `tabindex="-1"` + `aria-hidden` + fuera de pantalla. Los tres. La mayoría de los sitios hace solo el tercero |
| **h1 semántico real** | `HeroLede`: h1 = chapita de 11 px, reclamo = `<p>` de 80 px. **22 de 25 páginas** | `scaffold/src/pages/index.astro`, commit `9efebb3` del 8-sep: *"h1 semántico real"* — `<Text level={1} title={…}>`. **Ya lo arreglaste. En el scaffold que nadie publica, no en el componente que publican 22 páginas** |

**Once patrones. En diez de los once, la solución correcta ya está escrita por ti, en el mismo repositorio.**

Eso cambia la naturaleza del trabajo. No es "aprender accesibilidad y aplicarla a 28 componentes". Es **coger la versión buena de cada patrón y hacerla la única versión posible**.

---

## 2. Por qué se rompió justo ahí — el diagnóstico estructural

`AGENTS.md` tiene seis reglas. **Las seis se cumplen al 100 %.** Lo comprobé una por una:

| Regla | Estado |
|---|---|
| 0 · Estructura al kit, composición aquí | ✅ |
| 0b · `atomos`/`showcase` no viven aquí | ✅ |
| 1 · Cero dependencias de estilo o UI | ✅ |
| 2 · Biblioteca de secciones, no framework | ✅ |
| 3 · Mobile-first, un solo breakpoint | ✅ **cero `@media (max-width` en `src/`** |
| 4 · Todo dato de negocio en `site.ts` | ✅ |

Seis de seis, en un repo con 25 páginas y 3.600 líneas de componentes. Eso no es suerte ni disciplina heroica. **Es que las seis son comprobables con un comando.** `grep -c '@media (max-width'` da 0 o no da 0. `grep -r 'tel:' components/` da vacío o no. No hay margen de interpretación y no hay forma de que se degraden sin que alguien lo vea.

Ahora mira las dos cosas que sí se degradaron:

- **La séptima regla, la implícita** — *"aquí no entra ningún hex"*, escrita en un comentario de props de `Section.astro`. No es comprobable, no está en `AGENTS.md`, no la mira nadie. Resultado: **20 hex y 32 `rgba()`**.
- **La accesibilidad** — buscada en `README.md` y `docs/`: **cero menciones**. Ni "a11y", ni "accesib", ni "WCAG", ni "contraste", ni "foco", ni "aria". No hay regla, no hay contrato de tokens, no hay chequeo. Resultado: **33 hallazgos**.

> **La correlación es exacta: todo lo que el kit convirtió en comprobable, sobrevivió. Todo lo que dejó en "hazlo bien", se erosionó.**
>
> Y tú ya lo sabes hacer — `Section` rompe el build por un `aria-label` que falta. Esa línea es la prueba de que el mecanismo funciona. Lo que falta es aplicarlo a las otras seis cosas.

Esto también explica por qué la calidad **por componente** es tan desigual (10/10 en `Section`, 3/10 en `Gallery` y `ContactLauncher`): no depende del cuidado del autor, depende de si ese componente concreto tuvo un momento en que alguien pensó en el teclado.

---

## 3. El multiplicador — por qué esto no es una auditoría de un sitio

Los 33 hallazgos están repartidos así:

| Dónde vive el arreglo | Hallazgos |
|---|---|
| **`web-kit`** | **32** |
| `sitio-allon4dentalcenter` | 1 (la foto `photo pending`) |

**El 97 % de lo que encontré no está en el sitio del cliente. Está en el kit.** Y el kit es, por diseño, la cosa que se multiplica:

```
web-kit  v1.2.3
   ├── clientes/allon4dentalcenter   ← auditado: 33 hallazgos
   ├── clientes/<cada sitio vivo>    ← hereda los mismos 32
   └── create-sitio.mjs → scaffold/  ← cada sitio FUTURO nace con los mismos 32
```

Tres consecuencias que cambian la prioridad:

1. **Cada arreglo se cobra N veces.** Las dos líneas de `.lightbox` no arreglan 20 páginas: arreglan 20 páginas **por cada cliente que corre sobre el kit**, incluidos los que aún no existen.
2. **`v1.2.3` no arregló ninguno.** Miré el diff `v1.2.2..HEAD`: arregla un `Number('1,247') = NaN` en el rating y saca el titular del sello a `site.ts` — trabajo correcto, cero solapamiento con los 33. **El informe aplica igual a `main` que a la versión que consume el sitio.** No hay nada que esperar.
3. **El scaffold ya divergió del componente.** El commit `9efebb3` arregla el h1 del scaffold; `HeroLede` sigue con el h1 de 11 px. Ahora mismo el kit tiene **dos doctrinas opuestas sobre el h1**, y la que se publica en 22 páginas es la mala. Cuanto más tiempo pase, más caro es reconciliarlas.

**El orden correcto es: arreglar el kit, publicar `v1.3.0`, y subir la dependencia en cada cliente.** Arreglar el sitio del cliente sería copiar parches al lado equivocado de la frontera, que es justo lo que la regla 0 de tu `AGENTS.md` prohíbe.

---

## 4. La séptima regla

Lo que sale de aquí, concretamente, es esto: **convertir la accesibilidad en la séptima regla comprobable**, con la misma forma que las otras seis.

### 4.1 El texto para `AGENTS.md`

```markdown
5. **Accesibilidad comprobable, no "hazlo bien".** Siete chequeos, y los siete
   fallan el build:

   a. **Ocultar es `visibility`, nunca `opacity`.** Una capa oculta con
      `opacity:0` sigue en el orden de tabulación. Cero resultados en:
      `grep -rn 'opacity: *0' styles/ components/ | grep -v ':focus\|hover'`

   b. **Ningún color de anillo de foco puede coincidir con un fondo del
      sistema.** `--border-field` sobre `--bg-dark` da 1:1 si la marca los
      iguala, y eso lo decide el cliente en su `brand.css`, no el kit. El
      anillo va SIEMPRE a dos capas: tinta clara + halo oscuro.

   c. **`aria-label` solo sobre elementos con rol.** Un `<div>` o un `<p>`
      con `aria-label` es una etiqueta que no existe. O añade `role`, o usa
      `<span class="sr-only">`. Cero resultados en:
      `grep -rn 'aria-label' components/ | grep -v 'role=\|<a \|<button\|<nav\|<aside\|<section\|input\|<img'`

   d. **Cero hex fuera de `tokens.css`.** Era la regla implícita de
      `Section.astro` y se erosionó a 20 hex y 32 rgba. Ahora se cuenta:
      `grep -rhoE '#[0-9a-fA-F]{3,8}\b' styles/0*.css components/ layouts/ | wc -l` → 0

   e. **Un solo `<h1>` por página, y no puede ser el texto más pequeño.**
      El scaffold ya lo hace bien; `HeroLede` no.

   f. **`prefers-reduced-motion`: `07-motion.css` se importa SIN `layer()`.**
      Lo no-encapado gana a todo lo encapado, y eso es lo único que hace que
      la regla `*` derrote a cada `.clase`. Si alguien "ordena" ese import y
      le pone `layer(motion)`, TODAS las reducciones de movimiento dejan de
      aplicarse en silencio. No lo toques.

   g. **`pnpm audit:a11y` en verde.** Es la comprobación real de todo lo
      anterior: corre sobre el `dist/` en Chromium y sale con código 1 si
      hay bloqueantes. Un build verde no prueba nada sobre el navegador —
      eso ya lo dice este archivo; esto lo arregla.
```

### 4.2 El chequeo, ya escrito

**`web-kit/tools/audit-a11y.mjs`** — está en tu repo. 421 líneas, sin dependencias más allá de Playwright (solo dev).

```bash
node tools/audit-a11y.mjs dist                    # el sitio actual
node tools/audit-a11y.mjs dist --pages 25         # todas las páginas
node tools/audit-a11y.mjs dist --json informe.json
node tools/audit-a11y.mjs dist --strict           # los avisos también bloquean
```

Siete comprobaciones, todas con umbral numérico y ninguna opinable:

| | Comprobación | Bloquea |
|---|---|---|
| 1 | **Foco-fantasma** — enfocables dentro de capas invisibles | sí |
| 2 | **Foco-invisible** — indicador por debajo de 3:1 contra el fondo que tiene detrás | sí |
| 3 | **Contraste** de texto renderizado (4.5:1, o 3:1 si es grande) | sí |
| 4 | **Nombre-perdido** — `aria-label` sobre un rol que lo prohíbe | aviso |
| 5 | **Encabezados** — sin h1, h1 múltiple, saltos, primer encabezado invisible, h1 empequeñecido | sí / aviso |
| 6 | **Táctil** — objetivos por debajo de 24 px | aviso |
| 7 | **Reflow** — scroll horizontal a 320 px | sí |

Tres decisiones de diseño que te importan:

- **Mide sobre el navegador, no sobre el CSS.** Un linter no puede saber que `outline: 2px solid var(--border-field)` es invisible: depende de qué ponga el cliente en `--brand-dark`. Por eso el chequeo va sobre `dist/`, igual que dice tu `AGENTS.md` para todo lo demás.
- **Abre lo que se abre.** Un panel bien oculto con `visibility:hidden` queda fuera del chequeo de contraste justo por hacerlo bien. El script marca las casillas ocultas y dispara el `:target` y vuelve a medir. Así es como encontró el 1.98:1 del widget.
- **Cero falsos positivos, a propósito.** Una casilla de 20 px envuelta en un `<label>` grande no se reporta; el honeypot fuera de pantalla no se reporta; `.sr-only` no se reporta; un campo cuyo borde cambia al enfocar cuenta como indicador válido. **Un chequeo de CI con falsos positivos se desactiva en una semana**, y entonces no has ganado nada.

Resultado real sobre tu `dist/` de hoy, 4 páginas, 90 segundos:

```
52 bloqueantes  ·  5 avisos  ·  4 páginas auditadas
```

### 4.3 Enganchado al CI que ya tienes

No he tocado ni `package.json` ni los workflows — dijiste "solo informe" y lo respeto. Estas son las tres piezas, para cuando quieras:

```jsonc
// web-kit/package.json  y  cada sitio de cliente
"devDependencies": { "playwright": "^1.50.0" },
"scripts": {
  "audit:a11y": "node node_modules/@agenciaweb/kit/tools/audit-a11y.mjs dist --pages 25"
}
```

```yaml
# .github/workflows/ci.yml — después del build que ya existe
      - run: pnpm build
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm audit:a11y
```

En el kit conviene correrlo contra `demo/dist`, que es el catálogo con todos los componentes montados — el único sitio donde `Marquee`, `HeroVideo`, `InstantEstimate` y `UploadCase` existen a la vez. **Eso convierte el catálogo demo en el banco de pruebas de accesibilidad del kit**, que es un uso que hoy no tiene.

---

## 5. Orden de trabajo, por versiones

### `v1.3.0` — los siete bloqueantes (medio día)

Todo en el kit. Casi todo es copiar el patrón bueno desde el archivo de al lado.

| # | Archivo | Cambio | Líneas |
|---|---|---|---|
| 1 | `components/sections/Footer.astro:12` | `.replace(/-/g, " ")` | 1 carácter |
| 2 | `styles/05-components.css:633` | `.lightbox{visibility:hidden}` + `.lightbox:target{visibility:visible}` | 2 |
| 3 | `styles/03-base.css` | Anillo de foco a dos capas: `outline: 2px solid var(--ink-body-on-dark); box-shadow: 0 0 0 4px var(--ink-strong)` | 2 |
| 4 | `styles/03-base.css` | **Quitar `outline:none` del `:focus` de los campos** y subir la especificidad del `:focus-visible` por encima de la cadena de `:not()` | 2 |
| 5 | `components/sections/Footer.astro:78` | `class="text-white"` en los enlaces legales | 1 |
| 6 | `styles/05-components.css:411` | `.lx-head{background:var(--bg-dark)}` — el verde, solo en el icono | 1 |
| 7 | `components/sections/Breadcrumb.astro:11` | `aria-label="Breadcrumb"` | 1 |

**Diez líneas y un carácter.** Cierran 6 de los 7 críticos y ~40 de los 52 bloqueantes que reporta el script.

### `v1.4.0` — los patrones, no los síntomas

- **`Stars`, `nav-rating`, `Marquee`**: `role` o `.sr-only`. Y de paso, una utilidad compartida en el kit para "nombre accesible de un contenedor", para que no se vuelva a decidir componente a componente.
- **`.rail` y `.chips`**: el trío de `Section.astro` (`role="group"` + `aria-label` + `tabindex="0"`), y que rompa el build sin nombre.
- **`Image.astro`**: `alt` obligatorio; `alt=""` solo si se pasa explícitamente `decorative`. Es la cuarta vez que aplicas la doctrina de "sin defaults silenciosos"; que sea consistente.
- **`HeroLede` / `HeroVideo`**: reconciliar el h1 con lo que ya hace el scaffold desde el 8-sep.
- **Botones en secciones oscuras**: `:hover` y `.outline` dentro de `.bg-dark`.
- **Los tres controles de casilla**: `role="button"` + `aria-expanded`. Cuesta ~4 líneas de JS y es el único punto donde el "cero JavaScript" tiene un precio de accesibilidad real. **Decídelo con el número delante, no por doctrina.**

### `v1.5.0` — el sistema

- **Escala de espaciado** `--space-1..8`. Es la única categoría de token con cero definidos y 26 valores en uso; los cuatro más repetidos (`1.2` ×26, `1.6` ×24, `1` ×17, `2.4` ×15) ya son una escala sin nombre.
- **`--text-xs` a `1.2rem`** y borrar la lista blanca de 8 clases de `05-components.css:800`. Cierra los 9 sitios que hoy pintan a 11 px, incluido el consentimiento A2P.
- **`--border-control`** a ≥3:1 para bordes de componentes interactivos; `--border-hairline` (1.24:1) se queda para lo decorativo.
- **`--border-on-dark`**, y mueren los cuatro `rgb(255 255 255 / .12|.14)` con dos valores para el mismo trabajo.
- **Escala de z-index**: hoy `100`, `120`, `9999`.
- **Limpieza de nombres**: `.radius-20` → `.radius-media`, `.button.pill` → `.button--wide`, `--bg-cta` fusionado con `--bg-dark`, `.col-6-md` fuera.
- **Borrar el comentario de cabecera de `index.css`**, que se contradice con el comentario en línea 12 líneas más abajo y además es falso.

### Y en el sitio del cliente

Una sola cosa, y es la más cara de todas: **la foto del hero**.

---

## 6. Resumen en cuatro frases

1. **Casi ningún hallazgo es desconocimiento:** en 10 de 11 patrones, la versión correcta ya está escrita por ti en el mismo repositorio, en el archivo de al lado.
2. **Lo que el kit hizo comprobable sobrevivió al 100 %; lo que dejó en "hazlo bien" se erosionó** — y la accesibilidad no aparece ni una vez en `README.md` ni en `docs/`.
3. **El 97 % de los arreglos van al kit**, así que se cobran en cada cliente vivo y en cada sitio que nazca del scaffold; `v1.2.3` no adelantó nada de esto.
4. **Los siete bloqueantes son diez líneas y un carácter**, y `tools/audit-a11y.mjs` ya está en tu repo para que no vuelvan.
