#!/usr/bin/env node
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
