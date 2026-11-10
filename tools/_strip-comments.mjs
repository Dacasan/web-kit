#!/usr/bin/env node
// Temporal: quita comentarios de prosa del código. No se commitea.
import { readFileSync, writeFileSync } from "node:fs";
import { globSync } from "node:fs";

function stripJs(src) {
  let out = "";
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    const d = src[i + 1];
    if (c === "/" && d === "/") {
      while (i < n && src[i] !== "\n") i++;
      continue;
    }
    if (c === "/" && d === "*") {
      i += 2;
      while (i < n && !(src[i] === "*" && src[i + 1] === "/")) {
        if (src[i] === "\n") out += "\n";
        i++;
      }
      i += 2;
      continue;
    }
    if (c === "'" || c === '"' || c === "`") {
      const q = c;
      out += c;
      i++;
      while (i < n) {
        if (src[i] === "\\") { out += src[i] + (src[i + 1] ?? ""); i += 2; continue; }
        out += src[i];
        if (src[i] === q) { i++; break; }
        i++;
      }
      continue;
    }
    out += c;
    i++;
  }
  return out;
}

function stripCss(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, (m) => "\n".repeat((m.match(/\n/g) || []).length));
}

function stripAstro(src) {
  // HTML comments y expresiones comentadas {/* ... */}
  let out = src.replace(/<!--[\s\S]*?-->/g, (m) => "\n".repeat((m.match(/\n/g) || []).length));
  out = out.replace(/\{\/\*[\s\S]*?\*\/\}/g, (m) => "\n".repeat((m.match(/\n/g) || []).length));
  // Frontmatter
  const fm = out.match(/^---\n([\s\S]*?)\n---/);
  if (fm) {
    out = out.replace(fm[0], `---\n${stripJs(fm[1])}\n---`);
  }
  // <style> y <script>
  out = out.replace(/<style>([\s\S]*?)<\/style>/g, (_, css) => `<style>${stripCss(css)}</style>`);
  out = out.replace(/<script>([\s\S]*?)<\/script>/g, (_, js) => `<script>${stripJs(js)}</script>`);
  return out;
}

const files = [
  ...globSync("components/**/*.astro"),
  ...globSync("layouts/**/*.astro"),
  ...globSync("demo/src/**/*.astro"),
  ...globSync("scaffold/src/**/*.astro"),
  ...globSync("styles/*.css"),
  ...globSync("scripts/*.ts"),
  ...globSync("lib/*.ts"),
  ...globSync("tools/*.mjs"),
  "create-sitio.mjs",
];

for (const f of files) {
  const src = readFileSync(f, "utf8");
  let out;
  if (f.endsWith(".astro")) out = stripAstro(src);
  else if (f.endsWith(".css")) out = stripCss(src);
  else out = stripJs(src);
  if (out !== src) writeFileSync(f, out);
  console.log(f, src.length - out.length, "bytes");
}
