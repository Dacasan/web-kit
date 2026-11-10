#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const kit = resolve(dirname(fileURLToPath(import.meta.url)));
const root = resolve(kit, ".."); // agenciaweb/

const name = process.argv[2];
if (!name || /[^a-z0-9-]/.test(name)) {
  console.error("Uso: pnpm create-sitio <cliente>   (minúsculas y guiones, ej: clinica-x)");
  process.exit(1);
}

const target = join(root, "clientes", name, `sitio-${name}`);
if (existsSync(target)) {
  console.error(`Ya existe: ${target}`);
  process.exit(1);
}

mkdirSync(join(root, "clientes", name), { recursive: true });
cpSync(join(kit, "scaffold"), target, { recursive: true });
mkdirSync(join(target, "public", "fonts"), { recursive: true });

for (const rel of ["package.json", "astro.config.mjs"]) {
  const p = join(target, rel);
  writeFileSync(p, readFileSync(p, "utf8").replaceAll("<cliente>", name));
}

console.log(`Creado: ${target}`);
console.log("");
console.log("Siguientes pasos:");
console.log(`  1. cd clientes/${name}/sitio-${name}`);
console.log("  2. Rellena TODO lo marcado [BRAND] en src/data/site.ts");
console.log("  3. public/fonts/: coloca los .woff2 y descomenta @font-face en src/styles/brand.css");
console.log("  4. pnpm install && PUBLIC_SITE_URL=https://dominio-real.com LANDING_API_URL=https://crm.tu-dominio.com pnpm build");
console.log("");
console.log("Sin PUBLIC_SITE_URL el build falla: canonical y JSON-LD no pueden apuntar a un dominio ajeno.");
console.log("La dependencia del kit sale como file:../../../web-kit para desarrollo local.");
console.log("Al publicar el sitio, cámbiala por el tag del kit:");
console.log('  "github:Dacasan/web-kit#semver:^1.3.0"');
