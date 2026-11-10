
import { site } from '@agenciaweb/kit-site';

const fromEnv =
  import.meta.env.LANDING_API_URL ||
  import.meta.env.CRM_API_URL ||
  process.env.LANDING_API_URL ||
  process.env.CRM_API_URL ||
  "";

const fallback = import.meta.env.DEV ? "http://localhost:3000" : site.baseUrl;

export const CRM_URL = (fromEnv || fallback).replace(/\/+$/, "");


// Sin CRM en producción el formulario no envía: el build se rompe a propósito.
if (!fromEnv && !import.meta.env.DEV) {
  throw new Error(
    "[crm-url] LANDING_API_URL sin definir en un build de producción.\n" +
      "  El formulario y la atribución apuntarían a " +
      `${site.baseUrl}, que no sirve la API del CRM: cero leads, sin error.\n` +
      "  Define el dominio real antes de compilar:\n" +
      "    LANDING_API_URL=https://crm.example.com pnpm build",
  );
}

if (!import.meta.env.DEV && /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:|\/|$)/i.test(CRM_URL)) {
  throw new Error(
    `[crm-url] LANDING_API_URL=${CRM_URL} en un build de producción.\n` +
      "  El CRM quedaría apuntando a la máquina local del visitante.\n" +
      "  Define el dominio real antes de compilar, por ejemplo:\n" +
      "    LANDING_API_URL=https://crm.example.com pnpm build",
  );
}
