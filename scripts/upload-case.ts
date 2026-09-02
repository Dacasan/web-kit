// ============================================================
// upload-case.ts — subida de radiografía y presupuesto (UploadCase.astro).
//
// multipart/form-data contra {API}/api/uploads, el mismo host que
// /api/events (getApiBase). El email va como clave para que el CRM adjunte
// los archivos al lead recién creado.
//
// NO se pone Content-Type a mano: con FormData lo pone el navegador, y lo
// pone con el `boundary` que ha generado. Escribirlo a mano es la forma
// clásica de que el server reciba un cuerpo que no puede parsear.
//
// Si el POST falla, el bloque enseña la salida por WhatsApp en vez de
// tragarse el error: alguien que ya se decidió a mandar su pano no se puede
// quedar sin vía.
// ============================================================

import { getApiBase } from "../lib/api-base";
import { ESTIMATE_KEY, type EstimateHandoff } from "./lead-form";

function bytesToMb(n: number): number {
  return n / (1024 * 1024);
}

/** Contexto del lead, si el visitante viene de un formulario de esta sesión. */
function context(): Record<string, string> {
  try {
    const raw = sessionStorage.getItem(ESTIMATE_KEY);
    if (!raw) return {};
    const d = JSON.parse(raw) as EstimateHandoff;
    return {
      ...(d.name ? { name: d.name } : {}),
      ...(d.package ? { package: d.package } : {}),
      ...(d.quiz ? { arches: d.arch } : {}),
      ...(d.quote > 0 ? { us_quote: String(d.quote) } : {}),
    };
  } catch {
    return {};
  }
}

function wire(root: HTMLElement): void {
  const form = root.querySelector<HTMLFormElement>("[data-upload-form]");
  const done = root.querySelector<HTMLElement>("[data-upload-done]");
  if (!form || !done) return;

  const errorEl = form.querySelector<HTMLElement>(".form__error");
  const fallback = form.querySelector<HTMLElement>("[data-upload-fallback]");
  const list = form.querySelector<HTMLElement>("[data-upload-list]");
  const emailEl = form.querySelector<HTMLInputElement>('input[type="email"]');
  const filesEl = form.querySelector<HTMLInputElement>('input[type="file"]');

  const maxSize = Number(root.dataset.maxSize || 20);
  const maxFiles = Number(root.dataset.maxFiles || 6);
  const endpoint = root.dataset.endpoint || "/api/uploads";

  const showError = (msg: string) => {
    if (!errorEl) return;
    errorEl.textContent = msg;
    errorEl.hidden = false;
    errorEl.focus();
  };

  // Nombres de los archivos elegidos: sin esto el visitante no tiene forma
  // de saber si cogió el archivo correcto antes de enviarlo.
  filesEl?.addEventListener("change", () => {
    const files = Array.from(filesEl.files ?? []);
    if (!list) return;
    if (!files.length) {
      list.hidden = true;
      return;
    }
    list.textContent = files
      .map((f) => `${f.name} (${bytesToMb(f.size).toFixed(1)} MB)`)
      .join(" · ");
    list.hidden = false;
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (errorEl) errorEl.hidden = true;
    if (fallback) fallback.hidden = true;

    const email = (emailEl?.value ?? "").trim();
    const files = Array.from(filesEl?.files ?? []);

    if (!email.includes("@")) return showError("Please enter the email we should attach these to.");
    if (!files.length) return showError("Please choose at least one file.");
    if (files.length > maxFiles) return showError(`Up to ${maxFiles} files at a time.`);

    const tooBig = files.find((f) => bytesToMb(f.size) > maxSize);
    if (tooBig) {
      return showError(`"${tooBig.name}" is over ${maxSize} MB. Try a photo of the X-ray instead.`);
    }

    const button = form.querySelector<HTMLButtonElement>("button[type=submit]");
    const buttonLabel = button?.textContent ?? "";
    if (button) {
      button.disabled = true;
      button.textContent = "Sending...";
    }

    const body = new FormData();
    body.append("email", email);
    for (const [k, v] of Object.entries(context())) body.append(k, v);
    for (const f of files) body.append("files", f, f.name);

    try {
      // Sin cabecera Content-Type a propósito: la pone el navegador con su
      // boundary. Ponerla a mano rompe el parseo en el server.
      const res = await fetch(`${getApiBase()}${endpoint}`, { method: "POST", body });
      if (!res.ok) throw new Error("upload failed");

      form.hidden = true;
      done.hidden = false;
      done.focus();
    } catch {
      showError("We couldn’t upload those files.");
      if (fallback) fallback.hidden = false;
      if (button) {
        button.disabled = false;
        button.textContent = buttonLabel;
      }
    }
  });
}

function init(): void {
  document.querySelectorAll<HTMLElement>("[data-upload]").forEach(wire);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
