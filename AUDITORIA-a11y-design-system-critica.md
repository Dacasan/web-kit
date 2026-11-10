# Auditoría — sitio-allon4dentalcenter

**Tres lentes:** accesibilidad WCAG 2.1 AA · design system · crítica de diseño
**Fecha:** 9 de septiembre de 2026 · **Build auditado:** `dist/` del 9-sep 12:07 · **Kit:** `@agenciaweb/kit@1.2.2`

---

## Veredicto en una página

El sistema está bien pensado. Los tokens tienen dos niveles con una frontera real, los componentes rompen el build cuando les falta un dato que no se puede inventar, el reflow a 320 px y a zoom 200 % es impecable, y el honeypot está resuelto mejor que en la mayoría de los sitios que cobran por hacerlo. Nada de esto es casualidad y conviene decirlo antes de la lista.

Y aun así hay **siete fallos críticos vivos en producción**, y todos comparten la misma raíz: *el sistema decide colores para el estado en reposo y se olvida del estado*. El anillo de foco existe pero es del mismo color que la mitad de los fondos. Las capas del lightbox se ocultan con `opacity` en vez de `visibility` y siguen en el orden de tabulación. Los controles construidos con casillas ocultas se anuncian como casillas. El botón que se ilumina al pasar el cursor se ilumina hacia el color exacto del fondo que tiene detrás.

Traducido a lo que cuesta: **1 de cada 6 paradas de tabulación de cada página lleva a un elemento que no se ve**, un usuario de teclado no sabe nunca dónde está en la barra ni en el pie, y los 24 enlaces internos del pie —el activo SEO más repetido del sitio, 576 enlaces en total— dicen `Fullmouthdentalimplantsmexicocost`.

| | Críticos 🔴 | Mayores 🟡 | Menores 🟢 | Total |
|---|---|---|---|---|
| Accesibilidad (vivo en las 25 páginas) | 7 | 17 | 9 | **33** |
| Accesibilidad (latente en el kit, hoy sin montar) | 0 | 5 | 1 | 6 |
| Design system | 2 | 11 | 6 | 19 |
| Crítica de diseño | 1 | 6 | 4 | 11 |

**Puntuación del design system: 71/100.** La arquitectura vale 90; la disciplina de aplicarla, 55.

---

## Cómo se comprobó cada cosa

No hay ni un hallazgo inferido de leer el código sin verificarlo. El método, para que puedas repetirlo:

| Comprobación | Herramienta | Sobre qué |
|---|---|---|
| Contraste (47 pares) | cálculo WCAG 2.1 en Python, fórmula de luminancia relativa | valores resueltos de `brand.css` + `tokens.css` |
| Orden de tabulación, foco, reflow, objetivos táctiles | Chromium real vía Playwright | `dist/` servido en local, 4 páginas |
| Nombres accesibles | `page.accessibility.snapshot()` del árbol de Chromium | homepage completa |
| Texto de enlaces, encabezados, capas | `grep -o` sobre el HTML emitido | las 25 páginas de `dist/` |
| Uso real de componentes | `grep -l` sobre `src/pages/` | 25 páginas |

**`[vivo]`** = afecta a páginas publicadas. **`[latente]`** = el defecto está en el kit pero hoy ninguna página monta ese componente. **`[kit]`** / **`[repo]`** = dónde va el arreglo, según la regla 0 de `AGENTS.md`.

---
---

# LENTE 1 — Accesibilidad WCAG 2.1 AA

## 1.1 Perceptible

| # | Hallazgo | Criterio | Sev. | Dónde | Arreglo |
|---|---|---|---|---|---|
| P1 | Enlaces legales del pie (`Privacy Policy`, `Terms and Conditions`) heredan `a{color:--ink-primary}` = `#0F7571` sobre `--bg-dark` `#0E3D3C`. **2.17:1** medido. Están en las 25 páginas. | 1.4.3 | 🔴 | `[kit]` `Footer.astro:78` | Añadir `class="text-white"` como los otros enlaces del pie, o `.footer-legal a { color: var(--ink-body-on-dark) }` |
| P2 | Cabecera del widget de contacto: `.lx-head` pinta blanco sobre `--color-whatsapp` `#25D366`. **1.98:1**. Es el título "How can we help you?", 20 px en negrita, en todas las páginas. | 1.4.3 | 🔴 | `[kit]` `05-components.css:411` | Fondo `--bg-dark` o `--cta-bg` y verde solo en el icono. El verde de WhatsApp no aguanta texto blanco, nunca |
| P3 | El mismo verde bajo el icono blanco de la píldora flotante: **1.98:1**, por debajo del 3:1 de gráfico significativo | 1.4.11 | 🟡 | `[kit]` `05-components.css:349-351` | Icono en `#0E3D3C` sobre el verde (11.5:1), o círculo oscuro con glifo verde |
| P4 | Enlaces dentro del texto: `--ink-primary` `#0F7571` vs `--ink-body` `#0E3D3C` = **2.17:1** entre sí, y `a{text-decoration:none}` quita el subrayado. Con solo 2.17:1 de diferencia, un enlace en un párrafo es indistinguible | 1.4.1 | 🟡 | `[kit]` `03-base.css` | Subrayado permanente en enlaces dentro de prosa (`p a, li a { text-decoration: underline }`), o un tono de enlace con ≥3:1 contra la tinta |
| P5 | Migas de pan: `.crumbs a` y `.crumbs ol` usan **el mismo `--ink-muted`**. Contraste enlace/texto **1.00:1**, sin subrayado. 21 páginas | 1.4.1 | 🟡 | `[kit]` `Breadcrumb.astro:23-25` | Subrayar los crumbs enlazados, o darles `--ink-primary` + subrayado |
| P6 | `.rating` usa `--color-star` `#FBBC04` sobre blanco: **1.71:1**. Sería tolerable con alternativa textual, pero la alternativa **no llega** (ver O/R más abajo) | 1.4.11 | 🟡 | `[kit]` `05-components.css:141` | Contorno oscuro en la estrella, o —mejor— arreglar el nombre accesible y dejar el amarillo como decorativo declarado |
| P7 | `.circle`: `--ink-body` sobre `--primary` `#13918C` = **3.12:1** con texto de 11 px en negrita. Texto normal exige 4.5:1 | 1.4.3 | 🟡 | `[kit]` `05-components.css:740` | `background: var(--cta-bg)` + `color: var(--ink-on-primary)` (5.52:1), el par que el propio kit define como "el primario que aguanta texto" |
| P8 | `.form__error`: `#D43939` sobre su propio fondo al 8 % = **4.22:1**. El mensaje de error es lo único que el usuario tiene cuando falla el envío | 1.4.3 | 🟡 | `[kit]` `05-components.css:290` | Bajar el error a `#B32424` (5.9:1) o subir el fondo a blanco puro |
| P9 | Bordes de componentes **interactivos** (`.lx-option`, `.chip`, `.badge`) usan `--border-hairline` = `#D5EBEA` sobre blanco: **1.24:1**. En un elemento decorativo está exento; en un control que hay que identificar, no | 1.4.11 | 🟡 | `[kit]` `tokens.css` | Segunda ficha `--border-control` a ≥3:1 (`#8FBFBD` da 3.05:1). El token `--border-field` ya existe para esto y no se usa aquí |
| P10 | **11 px** en texto que importa: `.form-consent` (el consentimiento A2P 10DLC), `.form-label`, `.badge`, `.lx-option__text span`, `.hero-avail-badge`. El propio kit escribió la regla "12 px fijo, nunca 11 px" y la aplicó a una lista blanca de 8 clases que no incluye a ninguna de estas | 1.4.4 | 🟡 | `[kit]` `05-components.css:800` | Subir `--text-xs` a `1.2rem` y borrar la lista blanca. Cambia 9 sitios de golpe y elimina la excepción |
| P11 | `<img alt={playlabel}>` y `<button aria-label={playlabel}>` en `YouTubeLite`: la miniatura y el botón tienen **el mismo nombre**. El lector dice "Watch video, imagen" y luego "Watch video, botón" | 1.1.1 | 🟢 | `[kit]` `YouTubeLite.astro:67` | `alt=""` en la miniatura: la nombra el botón |
| P12 | Miniaturas de galería: el `<a>` lleva `aria-label={alt}` y contiene un `<img alt={alt}>`. El nombre queda bien pero no dice qué hace el enlace | 2.4.4 | 🟢 | `[kit]` `Gallery.astro:32` | `aria-label={\`View larger: ${it.alt}\`}` |
| P13 | `h1 em, h2 em` se usa como recurso puramente visual (la itálica turquesa del reclamo). `<em>` transporta énfasis semántico | 1.3.1 | 🟢 | `[kit]` `03-base.css` | `<i>` o un `<span class="accent">`. Coste cero, y el estilo no cambia |

### Tabla de contraste — los 47 pares del sistema

Calculados sobre los valores reales de esta marca. Los que pasan también están, porque saber qué aguanta es tan útil como saber qué no.

**Fallan (19):**

| Elemento | Frente | Fondo | Ratio | Exige | |
|---|---|---|---|---|---|
| Pie · Privacy / Terms | `#0F7571` | `#0E3D3C` | **2.17:1** | 4.5:1 | ❌ |
| Widget · título de cabecera | `#FFFFFF` | `#25D366` | **1.98:1** | 4.5:1 | ❌ |
| Widget · icono de la píldora | `#FFFFFF` | `#25D366` | **1.98:1** | 3:1 | ❌ |
| Enlace en prosa vs texto (1.4.1) | `#0F7571` | `#0E3D3C` | **2.17:1** | 3:1 | ❌ |
| Miga enlazada vs miga actual (1.4.1) | `#6B6B6B` | `#6B6B6B` | **1.00:1** | 3:1 | ❌ |
| `.button:hover` dentro de `.bg-dark` | `#0E3D3C` | `#0E3D3C` | **1.00:1** | 3:1 | ❌ |
| `.button.outline` dentro de `.bg-dark` | `#0E3D3C` | `#0E3D3C` | **1.00:1** | 4.5:1 | ❌ |
| Anillo de foco sobre fondo oscuro | `#0E3D3C` | `#0E3D3C` | **1.00:1** | 3:1 | ❌ |
| Anillo de foco del widget | `#FFFFFF` | `#FFFFFF` | **1.00:1** | 3:1 | ❌ |
| `.circle` | `#0E3D3C` | `#13918C` | **3.12:1** | 4.5:1 | ❌ |
| `.form__error` | `#D43939` | `#FCEFEF` | **4.22:1** | 4.5:1 | ❌ |
| Estrellas `.rating` | `#FBBC04` | `#FFFFFF` | **1.71:1** | 3:1 | ❌ |
| `.rating__off` | `#D5EBEA` | `#FFFFFF` | **1.24:1** | 3:1 | ❌ |
| `--border-hairline` en controles | `#D5EBEA` | `#FFFFFF` | **1.24:1** | 3:1 | ❌ |
| `.lx-option__icon` | `#1FA34A` | `#EAF4EE` | **2.92:1** | 3:1 | ❌ |
| Bordes `.topbar` / `.nav` | blanco 13 % | `#0E3D3C` | **1.47:1** | 3:1 | ❌ (decorativo, exento) |
| `.hero-video__stat-label` | blanco 45 % | `#0E3D3C` | **3.71:1** | 4.5:1 | ❌ `[latente]` |
| `.hero-video .button.outline` borde | blanco 35 % | `#0E3D3C` | **2.84:1** | 3:1 | ❌ `[latente]` |
| `.hero-video__stats` borde | blanco 25 % | `#0E3D3C` | **2.14:1** | 3:1 | ❌ `[latente]` |

**Pasan (28) — lo que el sistema hace bien:**

| Elemento | Ratio | |
|---|---|---|
| Cuerpo sobre los tres fondos claros | 11.99 / 10.25 / 10.23:1 | ✅ |
| `--ink-muted` sobre página / alt / soft | 5.33 / 4.56 / 4.55:1 | ✅ (justo) |
| `--ink-primary` sobre blanco | 5.52:1 | ✅ |
| `.button.primary` blanco sobre `--cta-bg` | 5.52:1 | ✅ |
| `.button.accent` — el par calculado en `brand.css` | 5.16:1 | ✅ |
| Blanco sobre `--bg-dark` | 11.99:1 | ✅ |
| `--ink-title-on-dark` (h2/h3 sobre oscuro) | 10.23:1 | ✅ |
| `--ink-primary-on-dark` | 5.16:1 | ✅ |
| `.nav-rating span` blanco 72 % | 7.04:1 | ✅ |
| Pie · herramientas blanco 70 % | 6.74:1 | ✅ |
| `.chip[aria-current]` | 11.99:1 | ✅ |
| `.pricing-table caption` | 5.52:1 | ✅ |
| `.step-num` borde | 5.52:1 | ✅ |
| `.icon-badge` icono blanco | 3.85:1 | ✅ |
| `.hero-title.tinted` | 7.68:1 | ✅ |
| `.lx-pill__status` | 5.21:1 | ✅ |
| Anillo de foco sobre fondo claro | 11.99:1 | ✅ |

> El par `--brand-accent` / `--brand-ink-on-accent` da exactamente **5.16:1**, el número que el comentario de `brand.css` afirma. Alguien hizo la cuenta. La cuestión no es que los números estén mal donde se calcularon: es que **solo se calcularon para el estado en reposo sobre fondo claro**.

---

## 1.2 Operable

| # | Hallazgo | Criterio | Sev. | Dónde | Arreglo |
|---|---|---|---|---|---|
| O1 | **Foco atrapado en capas invisibles.** Cada página lleva 10 `.lightbox` permanentes en el DOM (1 popup de formulario + 9 de galería), ocultos solo con `opacity:0; pointer-events:none` — que **no** sacan del orden de tabulación. Medido en Chromium: **20 elementos enfocables invisibles por página** (11 en `#form-popup` + 9 cierres de galería) sobre ~130 totales, **el 16 %**. Un usuario de teclado tabula desde el pie y cae en un formulario completo que no ve: nombre, email, teléfono, tratamiento, consentimiento y "Get My Quote" | 2.4.3 · 2.4.7 | 🔴 | `[kit]` `05-components.css:633` | **Una línea:** `.lightbox { visibility: hidden }` + `.lightbox:target { visibility: visible }`. El propio kit ya usa ese patrón, y correctamente, en `.lx-panel` (línea 400). Es el mismo arreglo, copiado del archivo de al lado |
| O2 | **El anillo de foco es invisible sobre fondo oscuro.** `03-base.css` pinta `outline: 2px solid var(--border-field)` = `#0E3D3C`, que es exactamente `--bg-dark`. Medido en navegador sobre 9 controles reales: **5 dan 1.00:1** — CTA de la barra, enlaces del menú, botón de play del vídeo, enlaces del pie y enlaces legales. El comentario del código dice "oscuro: visible sobre cualquier fondo"; sobre el fondo de la propia marca es literalmente invisible | 2.4.7 | 🔴 | `[kit]` `03-base.css` | Anillo de dos capas, que es lo que resuelve el caso general: `outline: 2px solid var(--ink-body-on-dark); box-shadow: 0 0 0 4px var(--ink-strong)`. Se ve sobre claro y sobre oscuro sin saber dónde está |
| O3 | **Anillo de foco blanco sobre superficie blanca en el widget.** `#lx-open:focus-visible ~ .lx-pill { outline: 3px solid var(--ink-on-primary) }` y `--ink-on-primary` es `#FFFFFF`; `.lx-pill` tiene `background: var(--surface-card)`, también blanco. **1.00:1.** Peor: con el panel abierto, `.lx-pill` está en `opacity:0`, así que el foco del control de cierre se dibuja sobre un elemento que no existe visualmente | 2.4.7 | 🔴 | `[kit]` `05-components.css:498` | `outline-color: var(--ink-strong)` y mover el anillo al panel cuando está abierto. El mismo archivo lo hace bien en `Header.astro:242` para la hamburguesa: ahí el anillo es blanco **porque el fondo es oscuro** |
| O4 | **`.button:hover` se funde con la sección oscura.** `.button:hover{background:var(--bg-dark);border-color:var(--bg-dark)}` gana por orden de fuente a `:where(.section--cta,.bg-dark) .button.primary` (misma especificidad 0,2,0). Verificado en navegador: sección `#0E3D3C`, botón en hover `#0E3D3C`. El botón desaparece y queda el texto flotando | 1.4.11 | 🟡 | `[kit]` `05-components.css:57` | `:where(.section--cta,.bg-dark) .button.primary:hover { background: var(--bg-soft); color: var(--ink-body) }` |
| O5 | **`.button.outline` es invisible dentro de `.bg-dark`.** Ni el borde (`--border-field` = fondo) ni la tinta (`--ink-body` = fondo) se sobrescriben en secciones oscuras: **1.00:1 en ambos**. `HeroVideo` sí lo parchea localmente; cualquier otra sección oscura, no | 1.4.3 · 1.4.11 | 🟡 | `[kit]` `05-components.css:49` | `:where(.section--cta,.bg-dark) .button.outline { border-color: var(--ink-body-on-dark); color: var(--ink-body-on-dark) }` |
| O6 | **Objetivos táctiles.** Medido a 390 px: de 114 controles visibles, **48 por debajo de 24 px** (mínimo AA de WCAG 2.2) y 49 por debajo de 44 px. El grueso: **26 enlaces del mapa del sitio del pie a 41×20 px** y 8 enlaces-CTA en línea a 21 px de alto | 2.5.5 · 2.5.8 | 🟡 | `[kit]` `Footer.astro` | `.footer-map__list a { display:inline-block; padding-block:.8rem }`. Sube a 36 px sin tocar el diseño |
| O7 | **El anillo de foco de los campos es un halo del 18 %.** `input:focus` pone `box-shadow: 0 0 0 3px color-mix(--primary 18%, transparent)` ≈ `#D5EBEA` sobre blanco = **1.25:1**. Lo salva a medias el cambio de borde (`#6B6B6B` → `#0E3D3C`), que sí se ve. Además usa `:focus` y no `:focus-visible`, así que también aparece con ratón | 2.4.7 | 🟡 | `[kit]` `03-base.css` | Subir el halo al 45 % y pasar a `:focus-visible` |
| O8 | **Carriles con la barra de scroll oculta.** `.rail`, `.chips` y `.row--scroll` ponen `scrollbar-width:none` en los tres motores. `Section.astro` lo resuelve bien para `row--scroll` (`role=group` + `aria-label` + `tabindex=0`, y **rompe el build** si falta el nombre); `.rail` y `.chips` no tienen ese tratamiento | 2.1.1 | 🟢 | `[kit]` | Aplicar el mismo trío a `.rail` y `.chips`. Ya está inventado en el archivo de al lado |
| O9 | **Marquesina sin pausa para teclado.** `.scroller:hover{animation-play-state:paused}` — solo con cursor. Dentro no hay nada enfocable, así que con teclado o táctil no hay forma de pararla | 2.2.2 | 🟡 `[latente]` | `[kit]` `05-components.css:684` | Añadir `:focus-within` y un botón real de pausa. **Hoy ninguna de las 25 páginas monta `Marquee`** |
| O10 | **Vídeo de fondo en autoplay sin control de pausa.** `HeroVideo` reproduce en bucle infinito. Respeta `prefers-reduced-motion` (`shouldSkip()`), lo cual mitiga bastante, pero 2.2.2 pide un **mecanismo en la página**, no un ajuste del sistema operativo | 2.2.2 | 🟡 `[latente]` | `[kit]` `HeroVideo.astro` | Botón de pausa flotante. **Hoy ninguna página monta `HeroVideo`** |
| O11 | Popup y lightbox por `:target`: sin `role="dialog"`, sin `aria-modal`, sin trampa de foco, sin cierre con `Escape`, y cada apertura mete una entrada en el historial (`href="#!"`) | 2.1.2 · 4.1.2 | 🟡 | `[kit]` | Al arreglar O1 el problema se reduce a la mitad. El cierre con `Escape` necesita ~6 líneas de JS; es la única cosa de este informe que no se puede hacer sin JavaScript |

---

## 1.3 Comprensible

| # | Hallazgo | Criterio | Sev. | Dónde | Arreglo |
|---|---|---|---|---|---|
| U1 | **`aria-label="Migas de pan"` — en español, en un sitio con `<html lang="en">` para pacientes estadounidenses.** Está en **21 páginas**. Un lector de pantalla en inglés lo pronuncia con fonética inglesa | 3.1.2 · 2.4.6 | 🟡 | `[kit]` `Breadcrumb.astro:11` | `aria-label="Breadcrumb"`. Es la corrección más barata del informe y la más vergonzosa de dejar |
| U2 | **Texto de los 24 enlaces del pie, en las 25 páginas.** `titulo()` hace `slug.replace(/-/g,"")` — sustituye el guion por **cadena vacía** en vez de por espacio. Resultado real, verificado en `dist/`: `3on6dentalimplantsmexico`, `Allon4beforeandaftermexico`, `Fullmouthdentalimplantsmexicocost`, `Zygomaticdentalimplantsmexico`. Son ~576 enlaces internos con texto ancla ilegible en la parte del sitio que más pesa para SEO | 2.4.4 | 🔴 | `[kit]` `Footer.astro:12` | `slug.replace(/-/g, " ")`. **Un carácter.** Y aun así conviene pasar a títulos escritos a mano: "All-on-4" capitalizado por palabras da "All On 4" |
| U3 | **El campo `<select>` de tratamiento no es obligatorio y no tiene opción vacía**, así que siempre se envía la primera de la lista aunque el usuario no la haya mirado. Nada en la interfaz advierte de que hay un valor preseleccionado | 3.3.2 | 🟡 | `[kit]` `ContactFields.astro:96` | `<option value="">Select treatment</option>` como primera opción, y `required` |
| U4 | **El prefijo `+1` está `aria-hidden`.** Un usuario de lector de pantalla rellena "Phone" sin saber que se asume número de EE. UU. y que el `+1` no viaja en el valor | 3.3.2 | 🟡 | `[kit]` `ContactFields.astro:80` | Quitar `aria-hidden` y enlazar con `aria-describedby` al input |
| U5 | **El honeypot falla en silencio.** Si el campo trampa llega relleno, `lead-form.ts:123` hace `return` sin mensaje ni indicación. `autocomplete="off"` no lo respetan todos los gestores de contraseñas: un lead real puede perderse sin que el usuario vea nada y sin que tú lo sepas | 3.3.1 | 🟡 | `[kit]` `lead-form.ts:123` | Registrar el evento en el CRM aunque se descarte, para poder medir cuántos son bots de verdad |
| U6 | **La validación no marca el campo.** El error va a un `role="alert"` que recibe el foco (bien hecho), pero no se pone `aria-invalid`, no hay `aria-describedby`, no hay estado visual en el input y el foco no va al campo. Con 4 campos se sobrevive; es deuda igualmente | 3.3.1 | 🟡 | `[kit]` `lead-form.ts:109` | `field.setAttribute('aria-invalid','true'); field.focus()` |
| U7 | Los errores se descubren de uno en uno: la validación hace `return` en el primer fallo | 3.3.1 | 🟢 | `[kit]` `lead-form.ts:139` | Acumular y mostrar los que falten |
| U8 | Al enviar, el botón pasa a `disabled` y cambia a "Sending…". Un botón deshabilitado **sale del árbol de accesibilidad y pierde el foco**: el usuario de teclado se queda sin saber dónde está | 4.1.3 | 🟢 | `[kit]` `lead-form.ts:149` | `aria-disabled="true"` + `aria-busy` en vez de `disabled`, y guarda el foco |
| U9 | Validación de email = `email.includes("@")`. `"a@"` pasa | — | 🟢 | `[kit]` | Calidad de dato, no accesibilidad. Se menciona porque afecta al CRM |

---

## 1.4 Robusto

| # | Hallazgo | Criterio | Sev. | Dónde | Arreglo |
|---|---|---|---|---|---|
| R1 | **Tres controles construidos con casillas ocultas se anuncian como casillas.** Verificado en el árbol de accesibilidad de Chromium: `#lx-open` → *"Contact channels, casilla, no marcada"*; `#lx-support` → *"Book a consultation, casilla, no marcada"*; `#nav-toggle` → *"Open menu, casilla, no marcada"*. Ninguno tiene `aria-expanded` ni `aria-controls`. Visualmente son un botón flotante, una fila de menú y una hamburguesa; para el lector son tres casillas sueltas sin estado | 4.1.2 | 🔴 | `[kit]` `ContactLauncher.astro:21-22`, `Header.astro:72` | `role="button"` + `aria-expanded` sincronizado. Sin JS `aria-expanded` no se puede actualizar; con 4 líneas de JS los tres quedan correctos. Es el precio real del "cero JavaScript" y conviene decidirlo con el número delante |
| R2 | **La valoración en estrellas no se anuncia.** `Stars.astro` pone `aria-label="5 out of 5"` sobre un `<p>`. Un `<p>` es `role=paragraph`, y ARIA in HTML **prohíbe nombrar ese rol**; NVDA, JAWS y VoiceOver no lo anuncian de forma fiable (Chromium sí lo expone internamente, lo cual no ayuda). Las estrellas visibles van `aria-hidden`. Resultado: si no se pasan `score` ni `count`, la valoración **es silenciosa**. Está en **21 páginas** | 4.1.2 · 1.1.1 | 🟡 | `[kit]` `Stars.astro:27` | `<span class="sr-only">{on} out of {of} stars</span>` dentro del `<p>`. La clase `.sr-only` ya existe en `04-layout.css` |
| R3 | Mismo patrón en `.nav-rating`: `aria-label` sobre un `<div>` (`role=generic`, nombrado también prohibido). Aquí el daño es menor porque el texto visible se lee igual | 4.1.2 | 🟢 | `[kit]` `Header.astro:84` | Quitar el `aria-label` o usar `role="img"` |
| R4 | Mismo patrón en `Marquee`: `aria-label` sobre un `<div>` sin rol. El comentario dice "sin él, un lector anuncia un grupo sin nombre" — pero **no hay grupo**: sin `role`, la etiqueta no nombra nada | 4.1.2 | 🟢 `[latente]` | `[kit]` `Marquee.astro:64` | `role="group"`. `Section.astro` ya lo hace bien; ver el patrón de abajo |
| R5 | Un `<h2>` invisible es el **primer encabezado de las 25 páginas**: el `.popup-title` del formulario del header vive en el DOM antes del `<h1>`. El esquema de encabezados de todo el sitio arranca con un h2 que nadie ve | 1.3.1 | 🟡 | `[kit]` `Header.astro:101` | Se resuelve solo con el arreglo O1 (`visibility:hidden` saca el h2 del esquema) |

> **El patrón, en una frase:** el kit tiene cuatro sitios donde pone un nombre accesible sobre un contenedor. En **uno** (`Section.astro`) añade `role="group"` y funciona —verificado: el navegador expone `group: "The Patient Journey — From First Contact to Final Smile"`—. En los otros tres pone la etiqueta sobre un `div` o un `p` y se pierde. No falta conocimiento: falta que ese conocimiento sea una función compartida en vez de una decisión que se vuelve a tomar en cada componente.

---

## 1.5 Lo que está bien hecho

No es cortesía; es información para no romperlo en el próximo refactor.

| Acierto | Dónde |
|---|---|
| **Reflow impecable.** A 320 px y a zoom 200 % (viewport 640): `scrollWidth === clientWidth`, cero desbordamiento horizontal. El mobile-first literal con un solo breakpoint funciona | verificado en navegador |
| **Alt en el 100 % de las imágenes.** 36 `<img>` en la home, 0 sin `alt`, 0 con `alt=""`. En un sitio de 25 páginas y ~500 imágenes eso no pasa por accidente | verificado en `dist/` |
| **Honeypot correcto.** `tabindex="-1"` + `aria-hidden` + fuera de pantalla. La mayoría de los sitios solo hace lo tercero y mete a los usuarios de teclado en la trampa | `ContactFields.astro:110` |
| **`role="alert"` + `tabindex="-1"` + `.focus()`** en el error del formulario. Es el patrón correcto, y es raro verlo | `ContactFields.astro:48` + `lead-form.ts:114` |
| **El build rompe cuando falta un dato de accesibilidad.** `Section` lanza si hay `scroll` sin nombre accesible; `Image` lanza sin dimensiones ni ratio; `Faq` lanza con `items` vacío. Convertir un fallo de a11y en un fallo de compilación es la mejor decisión de todo el kit | `Section.astro:115` |
| **`prefers-reduced-motion` funciona de verdad.** Comprobado con el navegador en modo reducido: `.button`, `.gallery-3x3 img`, `.accordion__summary::after`, `.lx-option`, `.lx-pill` y los inputs bajan a `1e-05s`. **Y funciona por una razón que no está escrita en ningún comentario:** `07-motion.css` se importa **sin `layer()`**, y en la cascada de capas lo no-encapado gana a todo lo encapado. Si alguien "ordena" ese import y le pone `layer(motion)`, la regla `*` pasa a perder por especificidad frente a cada `.clase` y **todas** las reducciones de movimiento dejan de aplicarse en silencio | `index.css:22` |
| **`aria-current` para el estado del chip** en vez de una clase. Correcto y poco común | `05-components.css:584` |
| **La segunda copia de la marquesina va `aria-hidden`.** El duplicado visual no se lee dos veces | `Marquee.astro:69` |

> ⚠️ **Corrección de mi propio análisis:** leyendo el CSS di por hecho que la regla global de `prefers-reduced-motion` era inerte por especificidad. Es lo que pasa normalmente. Aquí **no pasa**, por lo de la capa. Lo comprobé en navegador antes de escribirlo. Añade un comentario en `index.css:22` explicando por qué ese import va sin capa, o el próximo que ordene el archivo lo rompe sin enterarse.

---
---

# LENTE 2 — Auditoría del design system

**Componentes revisados:** 28 (`.astro`) + 6 hojas de estilo · **Problemas:** 19 · **Puntuación: 71/100**

## 2.1 Cobertura de tokens

| Categoría | Definidos | Valores crudos encontrados fuera de `tokens.css` |
|---|---|---|
| Color | 11 primitivas + 48 semánticos | **20 hex literales** + **32 `rgb()`/`rgba()`** |
| Tipografía | 6 (`--text-xs` … `--text-2xl` + `--font-size`) | **19 `font-size` codificados** (`1.4rem`×3, `1.1rem`×3, `3rem`×2, `5rem`, `3.5rem`, `3.2rem`, `2.6rem`, `2.4rem`, `16px`…) |
| **Espaciado** | **0** | **26 valores distintos.** Los cuatro más usados —`1.2rem` (×26), `1.6rem` (×24), `1rem` (×17), `2.4rem` (×15)— son ya una escala de facto que nadie ha nombrado |
| Radios | 3 | `border-radius: 50%` codificado (aceptable) |
| Sombras | 1 (`--shadow-sm`) | — pero ver naming |
| Elevación / z-index | **0** | `100` (nav), `120` (launcher), `9999` (lightbox): tres números mágicos |
| Bordes sobre oscuro | **0** | 4 usos de `rgb(255 255 255 / .12)` y `/ .14` — **dos valores distintos para el mismo trabajo** |

**El hueco número uno es la escala de espaciado.** Es la única categoría con cero tokens, y es donde más ruido hay. Con `--space-1: .4rem` … `--space-8: 6.4rem` los 26 valores caen a 8 y `AGENTS.md` gana una regla comprobable.

Hex literales que merecen mirada individual:

| Valor | Dónde | Problema |
|---|---|---|
| `#6B6B6B` | literal en el kit | **Duplica exactamente `--ink-muted`.** Cambiar el token no cambiaría este uso |
| `#1A1A1A` | literal en el kit | Es el `--brand-dark` **por defecto del kit**, no el de esta marca (`#0E3D3C`). Un residuo que se ve oscuro y por eso nadie lo detecta |
| `#101010` | `HeroVideo.astro:131` | El propio comentario dice "Debe seguir a `--bg-dark`" — y no lo sigue: `--bg-dark` es `#0E3D3C`. El tramado que debería disolver el vídeo en el fondo se disuelve hacia un negro que no es el fondo. Se ve la costura `[latente]` |
| `#55534E` | `.hero-title.tinted` | Comentado como "hex dedicado — JAMÁS opacity"… y tres líneas después `.bg-dark .hero-title.tinted` usa `rgba(245,239,230,0.6)` |

## 2.2 Consistencia de nombres

| Problema | Componentes | Qué adoptar |
|---|---|---|
| **`.radius-20` aplica 2 px.** La clase declara un valor en su nombre y ese valor es falso desde que `--radius-media` pasó a `2px`. La aplica `Image.astro` a cada imagen del sitio | `04-layout.css`, `Image.astro` | `.radius-media`. Nunca meter el valor en el nombre de la clase |
| **`.button.pill` ya no es la píldora.** El redondeo lo pone `.button`; `.pill` solo añade padding lateral | `05-components.css:68` | `.button--wide` |
| **`--radius: 4px` bajo el comentario "todo el sistema redondea igual: 20px"** | `tokens.css` | Actualizar el comentario o el valor. Ahora mismo uno de los dos miente |
| **`--shadow-sm` existe y se usa 5 veces bajo el comentario "Elevación — sin sombras: la separación la hace el borde"** | `tokens.css` | Decidir. Si hay sombras, el comentario sobra; si no las hay, quitar el token y las 5 llamadas |
| **`--bg-cta` y `--bg-dark` tienen el mismo valor** y ninguna regla los distingue | `tokens.css` | Fusionar, o darle a `--bg-cta` un valor propio que justifique existir |
| **`.col-6` y `.col-6-md` son idénticos.** Ambos solo actúan a partir de 900 px, así que el sufijo `-md` no significa nada. Conviven las dos convenciones en el mismo archivo | `04-layout.css` | Una sola familia. `.col-6` |
| **Cinco convenciones de nombres a la vez:** BEM (`.proof-strip__num`), BEM abreviado (`.lx-pill__icon`), utilidades (`.text-white`, `.bg-dark`), utilidades-con-valor (`.radius-20`), componentes planos (`.card`, `.chip`) | todo el kit | No es necesario unificarlo, pero sí escribir cuál manda en qué capa |
| **`.text-body` / `.text-white` dependen del orden de fuente.** El comentario lo documenta con honestidad; el problema es que un reordenado del archivo lo rompe en silencio y sin error | `05-components.css:148` | `.text-*` en la capa `utilities`, que ya está declarada en `index.css` y no se usa |
| **`index.css` se contradice consigo mismo.** El comentario de cabecera dice *"brand.css va ANTES de los tokens del kit porque esta marca no tiene overrides activos"*; el comentario en línea, 12 líneas después, dice *"brand.css va DESPUÉS de los tokens del kit, siempre. No lo inviertas"*. El código hace lo segundo. Y el primero además es falso por partida doble: `brand.css` **sí** sobrescribe las 11 primitivas | `index.css:4-8` | Borrar el comentario de cabecera |

## 2.3 Completitud de componentes

| Componente | Estados | Variantes | Docs | Nota | Puntos |
|---|---|---|---|---|---|
| `Section` | ✅ | ✅ | ✅ | Rompe el build si falta el nombre accesible. El mejor del kit | **10/10** |
| `Image` | ✅ | ✅ | ✅ | Rompe el build sin dimensiones… pero `alt=""` por defecto en silencio, que es justo la prop de accesibilidad | 8/10 |
| `Faq` | ✅ | ⚠️ | ✅ | `<details>` nativo, teclado correcto. Los `<summary>` no son encabezados: se pierden en la navegación por títulos | 8/10 |
| `ContactFields` | ✅ | ✅ | ✅ | Labels, honeypot y `role=alert` correctos. Faltan `aria-invalid` y `aria-describedby` | 8/10 |
| `Card`, `Table`, `PriceTable`, `StepList` | ✅ | ✅ | ⚠️ | Sin problemas encontrados | 8/10 |
| `Breadcrumb` | ✅ | — | ⚠️ | `aria-current` bien; `aria-label` en español; enlaces a 1:1 del texto | 5/10 |
| `Stars` | ⚠️ | ✅ | ✅ | El nombre accesible se pierde: la valoración es muda | **4/10** |
| `Gallery` | ❌ | — | ✅ | 9 capas siempre en el orden de tabulación | **3/10** |
| `ContactLauncher` | ❌ | ✅ | ✅ | Casillas anunciadas como casillas, foco invisible, contraste 1.98:1 | **3/10** |
| `Header` | ⚠️ | ✅ | ✅ | Hamburguesa como casilla; popup siempre en el DOM; anillo de foco correcto (el único) | 5/10 |
| `Footer` | ⚠️ | — | ⚠️ | Texto de enlaces roto; enlaces legales a 2.17:1; objetivos de 20 px | **4/10** |
| `HeroVideo` `[latente]` | ✅ | ✅ | ✅ | Ingeniería de LCP excelente; tres contrastes fallan y el tramado usa el negro equivocado | 6/10 |
| `Marquee` `[latente]` | ⚠️ | ✅ | ✅ | Sin pausa por teclado; `aria-label` perdido | 5/10 |

## 2.4 Contra las reglas del propio `AGENTS.md`

| Regla | Estado |
|---|---|
| 0 · Estructura al kit, composición aquí | ✅ El repo solo tiene páginas, `site.ts`, `public/` y `brand.css` |
| 0b · `atomos`/`showcase` no viven aquí | ✅ No están |
| 1 · Cero dependencias de estilo o UI | ✅ Solo `astro` + `@agenciaweb/kit` |
| 2 · Biblioteca de secciones, no framework de maquetación | ✅ Las páginas componen bloques |
| 3 · Mobile-first, un solo breakpoint 900 px | ✅ **Cero `@media (max-width` en `src/`.** Verificado |
| 4 · Todo dato de negocio en `site.ts` | ✅ Ni un teléfono ni un precio dentro de un componente |
| **Regla implícita: "solo tokens, aquí no entra ningún hex"** (`Section.astro:42`) | ❌ **20 hex y 32 `rgba()` dentro del kit** |

Las seis reglas escritas se cumplen. La séptima —la que el propio código declara en un comentario de props— es la que se ha erosionado, y es la que sostiene todo el argumento de que el kit exista.

---
---

# LENTE 3 — Crítica de diseño

## 3.1 Primera impresión (2 segundos)

**Qué atrae la vista primero:** el titular de 80 px en Fraunces. Correcto — es la mejor pieza de la página.

**Reacción:** clínica seria, cara, editorial. Muy por encima del promedio de turismo dental, que vive de gradientes y sellos de garantía. La decisión de una serif de display sobre una grotesca neutral y una paleta de dos verdes es la razón por la que este sitio no parece un directorio.

**Y entonces la vista llega a la derecha del hero y encuentra una tarjeta que dice *"TEXAS — FULL MOUTH · photo pending"*.**

| # | Hallazgo | Sev. |
|---|---|---|
| D1 | **El único elemento visual del hero de la home es un marcador de posición.** En un negocio cuya proposición entera es *el resultado se ve*, la primera pantalla enseña un rectángulo con la palabra "pendiente". Todo lo demás de este informe se puede arreglar despacio; esto cuesta dinero cada día que sigue publicado | 🔴 |

## 3.2 Jerarquía visual

**El orden de lectura es correcto** —chapa → titular → párrafo → botones → cifras— y el ritmo vertical fluido (`--section-y` con `clamp`) hace que respire. Ese trabajo está bien.

El problema es que **la jerarquía visual y la jerarquía semántica apuntan a sitios distintos**:

```
h2  24px  [INVISIBLE]  "Get My Written Price — 24h"   ← primer encabezado del documento
h1  11px               "Dental Implant Center in Cancun, Mexico"
p   80px               "One surgeon. 8,000 arches. An implant-only center in Cancun."
h2  50px               "A dental implant center in Cancun — not a dental clinic"
```

`HeroLede` documenta la decisión: *"ponerlo como h1 dejaba la página con la consulta SEO enterrada"*. **El objetivo es correcto y el mecanismo, no.** Y merece que te lo discuta, porque no creo que esté comprando lo que crees:

- **El h1 a 11 px en versalitas con `letter-spacing: .14em` dentro de una chapa con borde** no se lee como un titular ni por una persona ni por un evaluador de calidad. Es una frase clave vestida de elemento de interfaz.
- **Google no puntúa el `<h1>` como si fuera 2012.** Pesa mucho más el `<title>`, el texto prominente del bloque principal y la coherencia del conjunto. Ese `<p>` de 80 px es, para el motor, el texto más prominente de la página; el h1 de 11 px es una etiqueta pequeña.
- **Estás pagando un precio de accesibilidad real** —el primer encabezado del sitio es invisible, y el h1 es el texto más pequeño de la primera pantalla— por un beneficio SEO que probablemente no se cobra.

Dos salidas, las dos mejores que la actual:

1. **El reclamo grande pasa a `<h1>`** y la chapa a `<p>`. La frase con la keyword se lleva al `<title>`, al primer `<h2>` y a la primera línea del lede — que es donde de verdad se lee.
2. **La frase con la keyword se queda como `<h1>` pero se pinta grande**, y el reclamo publicitario se hace subtítulo. Se pierde algo de garra en el copy y se gana coherencia total.

Si el dueño insiste en el patrón actual, el mínimo innegociable es sacar el `<h2>` invisible del esquema (que se arregla solo con O1).

| # | Hallazgo | Sev. |
|---|---|---|
| D2 | Jerarquía visual (80 px) y semántica (11 px) invertidas en 22 de 25 páginas | 🟡 |
| D3 | El primer encabezado del documento es invisible, en las 25 páginas | 🟡 |

## 3.3 Consistencia

| # | Hallazgo | Sev. |
|---|---|---|
| D4 | **El acento no acentúa.** `--brand-accent` está puesto a `#2EBDB2` — **exactamente el mismo valor que `--brand-primary-on-dark`**. El token existe para crear "la jerarquía suprema… un color ajeno a la familia del primario", y aquí es un turquesa de la propia familia que además ya se usa como tinta. En la primera pantalla el CTA acento del hero y el CTA primario de la barra son dos verdes contiguos del mismo tono: no hay jerarquía suprema, hay dos botones. El comentario de `brand.css` lo dice él solo: *"Es el «Dot Accent» del brand guide, que nunca llegó al sitio"*. Sigue sin llegar | 🟡 |
| D5 | **El elemento más persistente del sitio está fuera del sistema.** El widget flotante es verde WhatsApp `#25D366` de arriba abajo: píldora, cabecera del panel, iconos. Es el único componente siempre visible en las 25 páginas, y va en un color de marca de un tercero que no aparece en ningún otro sitio. Además de fallar el contraste (P2, P3), regala la prominencia visual del sitio a WhatsApp | 🟡 |
| D6 | **La única herramienta de separación del sistema es casi invisible.** `--border-hairline` da **1.24:1**. `tokens.css` declara "sin sombras: la separación la hace el borde", y ese borde apenas se distingue del fondo. En el pie y entre secciones se nota: los bloques flotan sin cortes claros | 🟡 |
| D7 | **La galería 3×3 desde móvil deja cada foto a ~118 px.** El comentario defiende la decisión ("nueve fotos apiladas son nueve pantallas") y el argumento de scroll es válido, pero una foto de antes/después de arcada completa a 118 px no comunica nada — que es el único trabajo que tiene. El carril horizontal (`Section scroll`) resuelve las dos cosas a la vez y ya está construido | 🟡 |
| D8 | Cinco convenciones de nombres de clase conviviendo (§2.2). No se ve, pero se paga en cada componente nuevo | 🟢 |

## 3.4 Usabilidad

| # | Hallazgo | Sev. |
|---|---|---|
| D9 | **El formulario pide teléfono con `+1` implícito y el `select` de tratamiento envía la primera opción por defecto.** En un funnel donde el tratamiento cualifica el lead, un valor preseleccionado que nadie eligió ensucia el CRM de forma sistemática y silenciosa | 🟡 |
| D10 | Un fallo de red muestra *"Something went wrong. Try again or message us on WhatsApp"* sin enlace a WhatsApp en el propio mensaje, teniendo `whatsappHref` disponible | 🟢 |
| D11 | El popup del formulario se abre por `:target`, así que **cada apertura y cada cierre meten una entrada en el historial**. El botón "atrás" del móvil no vuelve a la página anterior: reabre y recierra el popup | 🟢 |
| D12 | El texto de consentimiento A2P 10DLC va a **11 px en gris**. Es el texto con más consecuencias legales de la página y el más pequeño | 🟢 |

## 3.5 Lo que funciona

- **La tipografía.** Fraunces 300 a 80 px con `letter-spacing: -.038em` y la itálica turquesa en el `<em>` es una decisión de marca de verdad, no una plantilla. Es lo que separa a este sitio de su competencia.
- **La paleta contenida.** Dos verdes, un crema, un blanco. Once primitivas y nada más. Se ve caro precisamente por lo que no tiene.
- **El ritmo vertical fluido sin breakpoints tipográficos.** `clamp()` en todos los encabezados y en `--section-y`: la página escala de 320 a 2560 px sin un solo salto.
- **La arquitectura de datos.** Que las FAQ visibles y el JSON-LD salgan del mismo array es la clase de decisión que evita una acción manual de Google dentro de dos años.
- **El rendimiento.** CSS en línea, fuentes propias con `unicode-range`, cero JS de terceros para el chat, fachada de YouTube. Un widget tipo Intercom son 200–600 KB; este son ~2 KB de CSS.

---
---

# Los seis arreglos que valen la pena esta semana

Ordenados por impacto ÷ esfuerzo. Los cuatro primeros son **once líneas en total**.

| # | Qué | Dónde | Líneas | Qué compra |
|---|---|---|---|---|
| **1** | `slug.replace(/-/g, " ")` | `[kit]` `Footer.astro:12` | **1 carácter** | Arregla el texto de ~576 enlaces internos en las 25 páginas. El mayor retorno del informe, con diferencia |
| **2** | `.lightbox{visibility:hidden}` + `.lightbox:target{visibility:visible}` | `[kit]` `05-components.css:633` | **2** | Saca **20 elementos por página** del orden de tabulación y el `<h2>` invisible del esquema de encabezados. Resuelve O1 y R5 de golpe |
| **3** | Anillo de foco de dos capas: `outline: 2px solid var(--ink-body-on-dark); box-shadow: 0 0 0 4px var(--ink-strong)` | `[kit]` `03-base.css` | **2** | El foco pasa a verse sobre claro y sobre oscuro. Resuelve O2; con `outline-color: var(--ink-strong)` en el widget, también O3 |
| **4** | `.footer-legal a{color:var(--ink-body-on-dark)}` · `.lx-head{background:var(--bg-dark)}` · `aria-label="Breadcrumb"` | `[kit]` × 3 archivos | **3** | Los tres fallos de contraste y de idioma más visibles: 2.17:1 → 11.99:1, 1.98:1 → 11.99:1, y el español fuera del sitio en inglés |
| **5** | Sustituir la foto `photo pending` del hero | `[repo]` `public/` | — | El problema de conversión número uno de la home |
| **6** | `role="button"` + `aria-expanded` en los tres controles de casilla | `[kit]` × 2 archivos | ~6 (con JS) | Cierra R1. Es la única cosa del informe que rompe la promesa de "cero JavaScript": decídelo con el número delante |

**Después**, por orden: escala de espaciado (`--space-*`), `--text-xs` a 12 px con borrado de la lista blanca, `aria-invalid` en la validación, objetivos táctiles del pie, y `Stars` con `.sr-only`.

---

## Anexo — límites de esta auditoría

Para que sepas exactamente qué está verificado y qué no:

- **No se probó con lector de pantalla real.** Las conclusiones sobre NVDA/JAWS/VoiceOver salen de la especificación *ARIA in HTML* y del árbol de accesibilidad de Chromium. En R2 y R3 lo digo con esa reserva: Chromium expone la etiqueta; los lectores no la anuncian de forma fiable. La confirmación definitiva es media hora con NVDA.
- **`god.js` (el script del CRM) se bloqueó** durante la prueba de navegador: es de otro dominio y no está en `dist/`. Si `wireYouTubeFacades` o `wireHeroVideo` inyectan marcado, ese marcado no está auditado.
- **`HeroVideo`, `Marquee`, `InstantEstimate` (1 página) y `UploadCase` (2 páginas)** están poco o nada montados. Sus hallazgos van marcados `[latente]` y su prioridad para *este* sitio es baja; para el kit, no.
- **El contraste sobre foto y sobre vídeo no se pudo calcular** (ninguna página monta `HeroVideo` hoy). Cuando se monte, hay que medirlo sobre el fotograma real: los velos van del 75 % al 25 %, y en la franja del 25 % el texto blanco sobre un fotograma claro puede caer por debajo de 4.5:1.
- **Se auditaron 4 de las 25 páginas en navegador** (home, `about`, `dental-tourism-cancun`, `all-on-4-dental-implants-cancun-cost`), elegidas por cubrir las dos variantes de cabecera (`seo` y `money`). Los conteos de HTML sí abarcan las 25.
- **Un error mío, corregido:** di por inerte la regla global de `prefers-reduced-motion` y no lo es (§1.5). Verificar en navegador antes de escribir es la única razón por la que ese párrafo no está mal en este informe.
