// ============================================================
// estimate-result.ts — ajusta el estimado de /thank-you con las respuestas.
//
// El servidor ya pintó los dos planes con los precios de lista de ambas
// arcadas y el titular genérico. Este módulo solo AJUSTA: si el visitante
// vino del cuestionario, cambia los precios a los de su arcada, calcula el
// ahorro contra el presupuesto que trajo de EE. UU. y personaliza el
// titular. Si no hay nada guardado, no toca nada y la página se queda con la
// versión genérica — que es contenido válido, no un hueco.
//
// El traspaso viene por sessionStorage (lo escribe lead-form.ts). No por la
// URL: la regla del proyecto es que la PII solo viaja en el POST original.
// ============================================================

import { ESTIMATE_KEY, type EstimateHandoff } from "./lead-form";

type ArchKey = EstimateHandoff["arch"];

interface PlanData {
  key: string;
  price: Record<ArchKey, number | null>;
}

function money(n: number): string {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

function setText(root: ParentNode, selector: string, value: string): void {
  const el = root.querySelector<HTMLElement>(selector);
  if (el) {
    el.textContent = value;
    el.hidden = false;
  }
}

function read(): EstimateHandoff | null {
  try {
    const raw = sessionStorage.getItem(ESTIMATE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as EstimateHandoff;
    return data && typeof data === "object" ? data : null;
  } catch {
    return null;
  }
}

function render(root: HTMLElement, data: EstimateHandoff): void {
  let plans: PlanData[] = [];
  try {
    plans = JSON.parse(root.dataset.plans || "[]") as PlanData[];
  } catch {
    return;
  }
  const quoteFallback = root.dataset.quoteFallback || "Written quote in 24 h";
  const arch: ArchKey = data.arch || "both";
  const featuredPrice = plans[0]?.price?.[arch] ?? null;

  // Titular. Solo hay AHORRO que enseñar si dejó su presupuesto de EE. UU.;
  // sin él se muestra el precio a secas, que sigue siendo una respuesta.
  const firstName = (data.name || "").trim().split(/\s+/)[0] ?? "";
  setText(root, "[data-est-name]", firstName ? `${firstName}, your plan` : "Your plan");

  if (data.quote > 0 && typeof featuredPrice === "number" && data.quote > featuredPrice) {
    const diff = data.quote - featuredPrice;
    const pct = Math.round((diff / data.quote) * 100);
    setText(root, "[data-est-verb]", " saves ");
    setText(root, "[data-est-save]", `${money(diff)} — ${pct}%`);
  } else if (typeof featuredPrice === "number") {
    setText(root, "[data-est-verb]", " starts at ");
    setText(root, "[data-est-save]", money(featuredPrice));
  }

  const archLabel = arch === "both" ? "both arches" : `${arch} arch`;
  setText(
    root,
    "[data-est-meta]",
    [`Based on ${archLabel}`, data.situation, data.timeframe].filter(Boolean).join(" · "),
  );

  if (data.quote > 0) {
    setText(root, "[data-est-quote]", ` Your US quote was ${money(data.quote)}.`);
  }

  // Precio y ahorro de cada plan para la arcada elegida.
  root.querySelectorAll<HTMLElement>("[data-plan-index]").forEach((card) => {
    const i = Number(card.dataset.planIndex);
    const price = plans[i]?.price?.[arch] ?? null;
    const priceEl = card.querySelector<HTMLElement>("[data-plan-price]");
    const saveLine = card.querySelector<HTMLElement>("[data-plan-save]");

    if (priceEl) {
      priceEl.textContent = typeof price === "number" ? money(price) : quoteFallback;
    }
    if (saveLine && typeof price === "number" && data.quote > price) {
      saveLine.textContent = `Save ${money(data.quote - price)}`;
      saveLine.hidden = false;
    }
  });
}

function init(): void {
  const root = document.querySelector<HTMLElement>("[data-estimate-result]");
  if (!root) return;
  const data = read();
  // Sin cuestionario no hay nada que ajustar: el caso genérico ya está
  // pintado y personalizarlo a medias sería peor que dejarlo.
  if (data?.quiz) render(root, data);

  // El email del bloque de subida se rellena solo: es la clave con la que el
  // CRM adjunta los archivos al lead, y un dedazo ahí los deja huérfanos.
  const emailField = document.querySelector<HTMLInputElement>("[data-upload-email]");
  if (emailField && data?.email && !emailField.value) emailField.value = data.email;
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
