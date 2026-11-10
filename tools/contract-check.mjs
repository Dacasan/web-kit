#!/usr/bin/env node
// Contrato de campos: los `name` que lead-form.ts lee deben existir en algún
// componente del formulario. Es la frontera que pierde datos SIN error:
// añadir un campo en un lado y no en el otro no rompe nada, solo deja de llegar.
import { readFileSync } from "node:fs";

const DECLARAN = [
  "components/ContactFields.astro",
  "components/sections/InstantEstimate.astro",
];
const form = readFileSync("scripts/lead-form.ts", "utf8");

const declared = new Set(
  DECLARAN.flatMap((f) => [...readFileSync(f, "utf8").matchAll(/name="([^"]+)"/g)].map((m) => m[1])),
);
const read = new Set([...form.matchAll(/readField\(form,\s*"([^"]+)"\)/g)].map((m) => m[1]));

// Pares [input, clave] de GADS_FIELDS: el input es el contrato, la clave no.
for (const m of form.matchAll(/\[\s*"([^"]+)"\s*,\s*"([^"]+)"\s*\]/g)) read.add(m[1]);
// CLICK_IDS es una lista de strings.
for (const block of form.matchAll(/const CLICK_IDS[^=]*=\s*\[([\s\S]*?)\]/g)) {
  for (const m of block[1].matchAll(/"([^"]+)"/g)) read.add(m[1]);
}

const missing = [...read].filter((n) => !declared.has(n)).sort();
if (missing.length) {
  console.error(`[contract] lead-form lee campos que ningún componente declara: ${missing.join(", ")}`);
  process.exit(1);
}
console.log(`[contract] ${read.size} campos leídos · todos declarados`);
