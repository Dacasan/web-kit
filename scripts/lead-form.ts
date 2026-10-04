// ============================================================
// lead-form.ts — envío de TODOS los formularios del sitio (skill §12.3).
//
// Vive en un módulo aparte, NO en un `<script define:vars>` dentro del
// .astro: `define:vars` implica `is:inline`, y Astro no procesa los scripts
// inline — no los compila, no les quita los tipos y no los empaqueta.
//
// Gobierna todos los `[data-lead-form]` del documento: el de la página, el
// del popup de la cabecera, el del widget flotante, el del imán de leads y
// el del estimado instantáneo. Antes el estimado tenía su PROPIO módulo con
// las mismas 120 líneas de atribución y POST copiadas; cualquier cambio en
// el payload había que hacerlo dos veces o los dos caminos se separaban.
//
// El destino es el CRM (dominio separado): /api/events, el flujo de datos
// que ya existía — el server crea el lead (find-or-create por teléfono) e
// inserta el tracking_event con la atribución que god.js dejó en los campos
// ocultos. La base URL la resuelve getApiBase().
//
// Antes de navegar guarda las respuestas en sessionStorage para que
// /thank-you pueda pintar el estimado. NO van por la URL: la regla del
// proyecto es que la PII solo viaja en el POST original (thank-you.astro).
// sessionStorage es del mismo origen, muere al cerrar la pestaña y no entra
// en el Referer, ni en la analítica, ni en un enlace compartido.
// ============================================================

import { getApiBase } from "../lib/api-base";
import { site } from "@agenciaweb/kit-site";

/** Campos extra por cliente (opt-in vía site.ts). El cast es defensivo:
 *  un sitio viejo que actualice el kit no declara la clave y el array
 *  queda vacío — cero campos, cero cambios en sus formularios. */
interface LeadExtraField {
  type: 'date' | 'select' | 'number' | 'text';
  name: string;
  label: string;
  required?: boolean;
}
const FL = (site as {
  formLabels?: {
    errName?: string; errEmail?: string; errPhone?: string; errConsent?: string;
    errFail?: string; sending?: string;
  };
}).formLabels ?? {};

const EXTRA_FIELDS = ((site as {
  leadExtraFields?: readonly LeadExtraField[];
}).leadExtraFields ?? []) as readonly LeadExtraField[];

/** Clave del traspaso a /thank-you. */
export const ESTIMATE_KEY = "a4_estimate";

export interface EstimateHandoff {
  name: string;
  email: string;
  /** true si el formulario traía cuestionario de cualificación. */
  quiz: boolean;
  arch: "both" | "upper" | "lower";
  situation: string;
  bone: string[];
  timeframe: string;
  /** Presupuesto de EE. UU. en dólares. 0 = no lo dijo. */
  quote: number;
  package: string;
}

const CLICK_IDS = [
  "gclid", "gbraid", "wbraid", "fbclid", "msclkid", "ttclid", "li_fat_id", "gad_source",
] as const;
const UTMS = ["source", "medium", "campaign", "term", "content"] as const;

// Google Ads ad-level, viaja a attribution.ad (dimensión de la puja). Los
// hidden inputs llevan prefijo gads_; aquí se mapean a las claves que el
// schema del CRM espera (matchtype, campaign_id, ad_group_id, ad_id, location).
const GADS_FIELDS: ReadonlyArray<[input: string, key: string]> = [
  ["gads_matchtype", "matchtype"],
  ["gads_campaign_id", "campaign_id"],
  ["gads_ad_group_id", "ad_group_id"],
  ["gads_ad_id", "ad_id"],
  ["gads_location", "location"],
];

/**
 * Lee un campo por nombre dentro de un formulario concreto.
 *
 * Excluye casillas y radios a propósito: para esos, "el valor del primero
 * que encuentre" no significa nada — hay funciones aparte.
 */
function readField(form: HTMLFormElement, name: string): string {
  const el = form.querySelector<HTMLInputElement | HTMLSelectElement>(
    `[name="${CSS.escape(name)}"]:not([type="checkbox"]):not([type="radio"])`,
  );
  return el?.value ?? "";
}

function readRadio(form: HTMLFormElement, name: string): string {
  return form.querySelector<HTMLInputElement>(
    `input[name="${CSS.escape(name)}"]:checked`,
  )?.value ?? "";
}

function readChecks(form: HTMLFormElement, name: string): string[] {
  return Array.from(
    form.querySelectorAll<HTMLInputElement>(`input[name="${CSS.escape(name)}"]:checked`),
  ).map((el) => el.value);
}

function isChecked(form: HTMLFormElement, name: string): boolean {
  return Boolean(
    form.querySelector<HTMLInputElement>(
      `input[name="${CSS.escape(name)}"][type="checkbox"]`,
    )?.checked,
  );
}

function money(n: number): string {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

/** "56,000", "$56000" y "56 000" son la misma cifra. */
function parseMoney(raw: string): number {
  const n = Number(raw.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function newEventId(): string {
  return `form_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function collectClickIds(form: HTMLFormElement): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  for (const k of CLICK_IDS) out[k] = readField(form, k) || undefined;
  return out;
}

/** Lee los inputs gads_* → attribution.ad. El grupo solo se adjunta al
 *  payload si algún campo trajo valor (JSONB limpio, sin objetos vacíos). */
function collectAdParams(form: HTMLFormElement): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  for (const [input, key] of GADS_FIELDS) out[key] = readField(form, input) || undefined;
  return out;
}

function wire(form: HTMLFormElement): void {
  const errorEl = form.querySelector<HTMLElement>(".form__error");
  // Destino tras el envío, por formulario: el de captación va a /thank-you y
  // el del imán de leads a /thank-you-download, que dispara la descarga.
  const thankYou = form.dataset.thankYou ?? "/thank-you";

  const showError = (msg: string) => {
    if (!errorEl) return;
    errorEl.textContent = msg;
    errorEl.hidden = false;
    // El mensaje es role="alert" y recibe el foco (skill §20).
    errorEl.focus();
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (errorEl) errorEl.hidden = true;

    // WebMCP: el submit puede venir de un agente de IA (la persona confirmó
    // el envío). Viaja al CRM como flag del payload y ahí el contacto se
    // separa con tag (SubmitEvent.agentInvoked, origin trial — ver
    // developer.chrome.com/docs/ai/webmcp). CONTRATO two-PR con
    // /api/events del CRM: la clave webmcp_agent vive en los dos lados,
    // igual que los gads_* — añadir de un solo lado es pérdida silenciosa.
    // El requestSubmit() del lazy loader no es acción de usuario, así que
    // bajo esa red de seguridad agentInvoked es siempre false sin importar.
    const agentInvoked = (e as SubmitEvent).agentInvoked === true;

    // Campo trampa: si viene relleno es un bot. Se finge éxito para no
    // enseñarle al bot cuál fue el motivo del rechazo.
    if (readField(form, "company_website").trim()) return;

    const name = readField(form, "name").trim();
    const email = readField(form, "email").trim();
    const phone = readField(form, "phone").trim();
    const pkg = readField(form, "package");

    // Cuestionario del estimado. En los formularios cortos no existe:
    // readRadio devuelve "" y el traspaso se marca como sin cuestionario.
    const arch = readRadio(form, "arches");
    const situation = readRadio(form, "situation");
    const bone = readChecks(form, "bone");
    const timeframe = readField(form, "timeframe");
    const quote = parseMoney(readField(form, "us_quote"));
    const hasQuiz = Boolean(arch || situation || bone.length || quote);

    if (!name) return showError(FL.errName ?? "Please enter your name.");
    if (!email.includes("@")) return showError(FL.errEmail ?? "Please enter a valid email.");
    if (!phone) return showError(FL.errPhone ?? "Please enter your phone number.");
    for (const f of EXTRA_FIELDS) {
      if (f.required && !readField(form, f.name).trim()) {
        return showError(`Please fill in: ${f.label}.`);
      }
    }
    if (!isChecked(form, "consent")) {
      return showError(FL.errConsent ?? "Please accept being contacted so we can send your plan.");
    }

    const button = form.querySelector<HTMLButtonElement>("button[type=submit]");
    const buttonLabel = button?.textContent ?? "";
    if (button) {
      button.disabled = true;
      button.textContent = FL.sending ?? "Sending...";
    }

    // El cuestionario viaja como mensaje legible: el coordinador ve el caso
    // completo en el CRM sin necesidad de campos nuevos en el esquema.
    const quizLines = hasQuiz
      ? [
          `Arches: ${arch || "—"}`,
          situation && `Situation: ${situation}`,
          bone.length ? `Bone: ${bone.join(", ")}` : "",
          quote > 0 ? `US quote: ${money(quote)}` : "",
          timeframe && `Travel: ${timeframe}`,
        ].filter(Boolean)
      : [];

    // Campos extra del cliente (fechas, huéspedes, …): "Etiqueta: valor".
    // Solo viaja el par con valor — JSONB limpio, sin objetos vacíos.
    const extraLines = EXTRA_FIELDS.map((f) => {
      const v = readField(form, f.name).trim();
      return v ? `${f.label}: ${v}` : "";
    }).filter(Boolean);

    const message = [...quizLines, ...extraLines].join(" · ");

    const eventId = readField(form, "event_id") || newEventId();
    const ad = collectAdParams(form);
    const attribution = {
      utm: Object.fromEntries(
        UTMS.map((k) => [k, readField(form, `utm_${k}`) || undefined]),
      ),
      click_ids: collectClickIds(form),
      // attribution.ad solo cuando la URL del anuncio la trajo: god.js llena
      // los gads_* y aquí se leen. Sin ellos, el payload no lleva la clave.
      ...(Object.values(ad).some(Boolean) ? { ad } : {}),
      landing_slug: readField(form, "landing_slug") || undefined,
      ref_code: readField(form, "ref_code") || undefined,
      channel: readField(form, "channel") || undefined,
      medium: readField(form, "medium") || undefined,
      visitor_id: readField(form, "visitor_id") || undefined,
      // Loop de conversiones: Meta _fbc/_fbp y el dominio del referrer
      // viajan en hidden inputs rellenados por god.js (ContactFields.astro
      // los declara: fbc, fbp, referrer). readField devuelve "" si el input
      // no existe — || undefined lo omite del payload. Al server llega solo
      // lo que exista; el fbc real de cookie llega el día que haya píxel.
      fbc: readField(form, "fbc") || undefined,
      fbp: readField(form, "fbp") || undefined,
      referrer: readField(form, "referrer") || undefined,
    };

    try {
      const res = await fetch(`${getApiBase()}/api/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: eventId,
          event_type: "form_submit",
          attribution,
          ref_code: attribution.ref_code,
          landing_slug: attribution.landing_slug,
          payload: {
            name, phone, email,
            ...(message ? { message } : {}),
            ...(pkg ? { package: pkg } : {}),
            consent: true,
            // Solo cuando un agente de IA activó el form (contrato con
            // /api/events: el server tag gee contacto 'AI Agent').
            ...(agentInvoked ? { webmcp_agent: true } : {}),
          },
        }),
      });
      if (!res.ok) throw new Error("request failed");

      // Traspaso a la página de gracias. Si el navegador lo tiene bloqueado
      // (modo privado estricto), la página de gracias enseña la versión
      // genérica en vez de romperse.
      try {
        const handoff: EstimateHandoff = {
          name, email,
          quiz: hasQuiz,
          arch: (arch || "both") as EstimateHandoff["arch"],
          situation, bone, timeframe, quote,
          package: pkg,
        };
        sessionStorage.setItem(ESTIMATE_KEY, JSON.stringify(handoff));
      } catch { /* sin sessionStorage: estimado genérico */ }

      const qs = new URLSearchParams({ lead: "1", event_id: eventId });
      // El thank-you vive en ESTE sitio (mismo origin) — no se redirige al CRM.
      window.location.href = `${location.origin}${thankYou}?${qs}`;
    } catch {
      showError(FL.errFail ?? "Something went wrong. Try again or message us on WhatsApp.");
      if (button) {
        button.disabled = false;
        button.textContent = buttonLabel;
      }
    }
  });
}

function init(): void {
  document.querySelectorAll<HTMLFormElement>("[data-lead-form]").forEach(wire);
}

// Los `<script>` empaquetados por Astro son `type="module"` (diferidos), así
// que el DOM ya está listo. El guard cubre el caso contrario sin depender de
// que DOMContentLoaded no haya disparado ya.
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
