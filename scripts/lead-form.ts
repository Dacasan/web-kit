
import { getApiBase } from "../lib/api-base";
import type { LeadExtraField } from "../lib/types";
import { site } from "@agenciaweb/kit-site";
const FL = (site as {
  formLabels?: {
    errName?: string; errEmail?: string; errPhone?: string; errConsent?: string;
    errFail?: string; sending?: string;
  };
}).formLabels ?? {};

const EXTRA_FIELDS = ((site as {
  leadExtraFields?: readonly LeadExtraField[];
}).leadExtraFields ?? []) as readonly LeadExtraField[];

export const ESTIMATE_KEY = "a4_estimate";

export interface EstimateHandoff {
  name: string;
  email: string;
  quiz: boolean;
  arch: "both" | "upper" | "lower";
  situation: string;
  bone: string[];
  timeframe: string;
  quote: number;
  package: string;
}

const CLICK_IDS = [
  "gclid", "gbraid", "wbraid", "fbclid", "msclkid", "ttclid", "li_fat_id", "gad_source",
] as const;
const UTMS = ["source", "medium", "campaign", "term", "content"] as const;

const GADS_FIELDS: ReadonlyArray<[input: string, key: string]> = [
  ["gads_matchtype", "matchtype"],
  ["gads_campaign_id", "campaign_id"],
  ["gads_ad_group_id", "ad_group_id"],
  ["gads_ad_id", "ad_id"],
  ["gads_location", "location"],
];

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

function collectAdParams(form: HTMLFormElement): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  for (const [input, key] of GADS_FIELDS) out[key] = readField(form, input) || undefined;
  return out;
}

function wire(form: HTMLFormElement): void {
  const errorEl = form.querySelector<HTMLElement>(".form__error");
  const thankYou = form.dataset.thankYou ?? "/thank-you";

  const showError = (msg: string, field?: HTMLElement | null) => {
    if (errorEl) {
      errorEl.textContent = msg;
      errorEl.hidden = false;
    }
    if (field) {
      field.setAttribute("aria-invalid", "true");
      field.focus();
    } else {
      errorEl?.focus();
    }
  };

  const clearInvalid = () => {
    for (const el of form.querySelectorAll<HTMLElement>("[aria-invalid]")) {
      el.removeAttribute("aria-invalid");
    }
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (errorEl) errorEl.hidden = true;
    clearInvalid();

    const agentInvoked = (e as SubmitEvent).agentInvoked === true;

    if (readField(form, "company_website").trim()) {
      const w = window as Window & { dataLayer?: unknown[] };
      w.dataLayer?.push({ event: "lead_discarded_honeypot" });
      window.dispatchEvent(new CustomEvent("wacrm:lead-discarded", { detail: { reason: "honeypot" } }));
      return;
    }

    const name = readField(form, "name").trim();
    const email = readField(form, "email").trim();
    const phone = readField(form, "phone").trim();
    const pkg = readField(form, "package");

    const arch = readRadio(form, "arches");
    const situation = readRadio(form, "situation");
    const bone = readChecks(form, "bone");
    const timeframe = readField(form, "timeframe");
    const quote = parseMoney(readField(form, "us_quote"));
    const hasQuiz = Boolean(arch || situation || bone.length || quote);

    const field = (n: string) => {
      const el = form.elements.namedItem(n);
      return el instanceof HTMLElement ? el : null;
    };

    if (!name) return showError(FL.errName ?? "Please enter your name.", field("name"));
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return showError(FL.errEmail ?? "Please enter a valid email.", field("email"));
    }
    if (!phone) return showError(FL.errPhone ?? "Please enter your phone number.", field("phone"));
    for (const f of EXTRA_FIELDS) {
      if (f.required && !readField(form, f.name).trim()) {
        return showError(`Please fill in: ${f.label}.`, field(f.name));
      }
    }
    if (!isChecked(form, "consent")) {
      return showError(FL.errConsent ?? "Please accept being contacted so we can send your plan.", field("consent"));
    }

    const button = form.querySelector<HTMLButtonElement>("button[type=submit]");
    const buttonLabel = button?.textContent ?? "";
    if (button) {
      button.disabled = true;
      button.textContent = FL.sending ?? "Sending...";
    }

    const quizLines = hasQuiz
      ? [
          `Arches: ${arch || "—"}`,
          situation && `Situation: ${situation}`,
          bone.length ? `Bone: ${bone.join(", ")}` : "",
          quote > 0 ? `US quote: ${money(quote)}` : "",
          timeframe && `Travel: ${timeframe}`,
        ].filter(Boolean)
      : [];

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
      ...(Object.values(ad).some(Boolean) ? { ad } : {}),
      landing_slug: readField(form, "landing_slug") || undefined,
      ref_code: readField(form, "ref_code") || undefined,
      channel: readField(form, "channel") || undefined,
      medium: readField(form, "medium") || undefined,
      visitor_id: readField(form, "visitor_id") || undefined,
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
            // Contrato two-PR con /api/events del CRM: no cambiar de un lado.
            ...(agentInvoked ? { webmcp_agent: true } : {}),
          },
        }),
      });
      if (!res.ok) throw new Error("request failed");

      try {
        const handoff: EstimateHandoff = {
          name, email,
          quiz: hasQuiz,
          arch: (arch || "both") as EstimateHandoff["arch"],
          situation, bone, timeframe, quote,
          package: pkg,
        };
        sessionStorage.setItem(ESTIMATE_KEY, JSON.stringify(handoff));
      } catch { /* sessionStorage no disponible */ }

      const qs = new URLSearchParams({ lead: "1", event_id: eventId });
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

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
