// ============================================================
// api-base.ts — base URL de la API del CRM (proyecto separado).
//
// El sitio web (Astro standalone) y el CRM viven en dominios distintos.
// Los endpoints /api/* (events, track) pertenecen al CRM; god.js los
// escribe en window.__WACRM_API_URL__ (inyectado por BaseLayout).
//
// Fallback a location.origin: dev local sin separación (el CRM y la
// landing en el mismo host) o si BaseLayout no llegó a ejecutarse.
// ============================================================

declare global {
  interface Window {
    __WACRM_API_URL__?: string;
  }
}

export function getApiBase(): string {
  return (
    window.__WACRM_API_URL__ ||
    location.origin
  ).replace(/\/+$/, "");
}