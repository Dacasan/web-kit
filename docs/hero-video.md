# Vídeo del hero — cómo preparar los archivos

El hero usa **vídeo propio**, no YouTube. Se abandonó el embed después de que
`god.js` (el script del CRM) secuestrara el componente: su `wireHeroVideo`
busca `[data-hero-video]` y le pasa el nodo a `new YT.Player(el)`, que
**sustituye el elemento** — se llevaba por delante el frame y el póster.
A eso se sumaban el autoplay condicionado por YouTube, ~540 KB por embed y
los bloqueadores. Con un `<video>` local no existe ninguno de los cuatro.

## Qué archivos hacen falta

Van en `public/video/`. Las rutas se configuran en `src/data/site.ts`
(`site.heroVideo`) y se declaran **sin extensión**.

| Archivo | Proporción | Cuándo se usa | Peso objetivo |
|---|---|---|---|
| `hero.webm` / `hero.mp4` | **9:16 vertical** | móvil — es el BASE | < 1,5 MB |
| `hero-wide.webm` / `hero-wide.mp4` | **16:9 horizontal** | ≥ 900 px | < 2,5 MB |

Mobile first: el vertical es obligatorio, el horizontal es la excepción.
Si no pones `hero-wide`, escritorio reutiliza el vertical y lo recorta con
9:16 — cubre sin bandas, pero solo se ve la franja central (~32 % del alto
en 1920×1080).

**Mientras los archivos no existan no se rompe nada**: el `<video>` emite
`error`, el póster se queda y el hero se ve correcto, solo que quieto.

## Recorta el vertical desde un horizontal

Si solo tienes la pieza horizontal, saca de ahí el vertical recortando el
centro. `crop=ih*9/16:ih` toma una ventana 9:16 centrada:

```bash
ffmpeg -i original.mp4 -vf "crop=ih*9/16:ih,scale=720:1280" -an vertical.mp4
```

## Comprimir

Tres cosas importan y las tres son fáciles de olvidar:

- **`-an` (sin audio).** El vídeo va `muted`; el audio son megas que nadie
  va a oír nunca.
- **`-movflags +faststart`** en el mp4. Mueve el índice al principio del
  archivo para que empiece a reproducirse mientras descarga. Sin esto el
  navegador espera al último byte.
- **Corto y en bucle.** 8–12 s bien elegidos se notan menos repetitivos que
  30 s pesados, y pesan un tercio.

```bash
# Vertical (móvil) — 720×1280
ffmpeg -i vertical.mp4 -an -t 10 -vf "scale=720:1280" \
  -c:v libvpx-vp9 -crf 36 -b:v 0 public/video/hero.webm
ffmpeg -i vertical.mp4 -an -t 10 -vf "scale=720:1280" \
  -c:v libx264 -crf 26 -preset slow -pix_fmt yuv420p \
  -movflags +faststart public/video/hero.mp4

# Horizontal (escritorio) — 1280×720
ffmpeg -i horizontal.mp4 -an -t 10 -vf "scale=1280:720" \
  -c:v libvpx-vp9 -crf 34 -b:v 0 public/video/hero-wide.webm
ffmpeg -i horizontal.mp4 -an -t 10 -vf "scale=1280:720" \
  -c:v libx264 -crf 25 -preset slow -pix_fmt yuv420p \
  -movflags +faststart public/video/hero-wide.mp4
```

Sube el `-crf` si pesa de más (más número = más compresión). Para un fondo
detrás de un velo oscuro y un tramado de puntos, un CRF alto no se nota.

## Los pósters (esto es el LCP)

El póster es la imagen más grande de la página y **manda en la métrica de
Largest Contentful Paint**. Que sea WebP local: una miniatura de
`i.ytimg.com` añade un dominio, un DNS y un TLS a la ruta crítica.

Saca un fotograma del propio vídeo para que el cambio no se note:

```bash
ffmpeg -i public/video/hero.mp4      -vframes 1 -q:v 80 public/video/hero-poster.webp
ffmpeg -i public/video/hero-wide.mp4 -vframes 1 -q:v 80 public/video/hero-poster-wide.webp
```

Y apúntalos en `site.heroVideo.poster` / `.posterDesktop`. Ahora mismo
apuntan a `/gallery/gallery-1.webp` y `-2` como marcador de posición.

## Comportamiento

- El vídeo lleva `preload="none"`: no descarga nada hasta que el script
  llama a `play()`, ya pasado el LCP (`load` + `requestIdleCallback`).
- El póster se oculta **solo con frame real** (`requestVideoFrameCallback`,
  o el evento `playing` donde no exista). Nunca hay hueco negro.
- Con `saveData`, red 2g o `prefers-reduced-motion` no arranca: se queda
  el póster.
- En pestaña oculta se pausa.

## ⚠️ No renombrar los ganchos

Los atributos del componente se llaman **`data-bg-*`** a propósito.
`god.js` busca `data-hero-video` / `data-video-id`. Si alguien los renombra
a `data-hero-*`, `wireHeroVideo` vuelve a engancharse y a destruir el
componente.
