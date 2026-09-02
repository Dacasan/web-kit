// ============================================================
// crm-url.ts — resuelve en BUILD el dominio del CRM (proyecto separado).
//
// El sitio es estático y vive en su propio dominio; los endpoints /api/*
// (events, track) y god.js pertenecen al CRM. Esta constante alimenta las
// dos únicas salidas hacia allá:
//   - <script src="{CRM_URL}/god.js">        (BaseLayout)
//   - window.__WACRM_API_URL__ = "{CRM_URL}" (SeoHead → lo lee getApiBase)
//
// Orden de resolución:
//   1. import.meta.env — recoge los ficheros .env (dev local sin exportar nada).
//   2. process.env     — CI/despliegue, donde la variable llega del entorno.
//   3. Fallback: en dev, el CRM local (:3000); en build de producción,
//      site.baseUrl, que NO sirve /api/* — por eso avisa por consola.
//
// El fallback de producción es el que rompía el formulario: apuntaba al
// propio dominio del sitio estático, y ahí no existe /api/events.
// ============================================================

import { site } from '@agenciaweb/kit-site';

const fromEnv =
  import.meta.env.LANDING_API_URL ||
  import.meta.env.CRM_API_URL ||
  process.env.LANDING_API_URL ||
  process.env.CRM_API_URL ||
  "";

const fallback = import.meta.env.DEV ? "http://localhost:3000" : site.baseUrl;

/** Dominio del CRM, sin barra final. */
export const CRM_URL = (fromEnv || fallback).replace(/\/+$/, "");

// ── Guardias de build ────────────────────────────────────────────
// Estos dos fallos son invisibles: el sitio compila, se despliega y solo
// se nota semanas después, cuando alguien pregunta por qué no llegan
// leads. Por eso el segundo ROMPE el build en vez de avisar.

if (!fromEnv && !import.meta.env.DEV) {
  console.warn(
    "[crm-url] LANDING_API_URL sin definir: el build apunta /api/events y god.js a " +
      `${site.baseUrl}, que no sirve la API del CRM. El formulario no enviará leads.`,
  );
}

// El .env local lleva localhost:3000 — correcto para `astro dev`, veneno
// en un build. Si se cuela, el HTML desplegado queda con
// <script src="http://localhost:3000/god.js"> y window.__WACRM_API_URL__
// apuntando a la máquina del visitante: cero atribución, cero leads.
// Ya pasó una vez; que no compile es más barato que descubrirlo en producción.
if (!import.meta.env.DEV && /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:|\/|$)/i.test(CRM_URL)) {
  throw new Error(
    `[crm-url] LANDING_API_URL=${CRM_URL} en un build de producción.\n` +
      "  El CRM quedaría apuntando a la máquina local del visitante.\n" +
      "  Define el dominio real antes de compilar, por ejemplo:\n" +
      "    LANDING_API_URL=https://crm.example.com pnpm build",
  );
}
