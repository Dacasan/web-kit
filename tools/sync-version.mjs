#!/usr/bin/env node
// Sincroniza `package.json.version` con el último tag de git (vX.Y.Z).
// La versión del kit se resuelve por TAG, no por package.json; esto evita
// que el campo mienta (estaba en 1.2.4 con el tag en 1.3.0). Se corre antes
// de taggear, nunca después.
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const tag = execSync("git describe --tags --abbrev=0", { encoding: "utf8" }).trim();
const version = tag.replace(/^v/, "");

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
if (pkg.version === version) {
  console.log(`package.json ya está en ${version}`);
  process.exit(0);
}
pkg.version = version;
writeFileSync("package.json", `${JSON.stringify(pkg, null, 2)}\n`);
console.log(`package.json: ${version}`);
