#!/usr/bin/env node

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.error('audit-a11y necesita playwright:  pnpm add -D playwright  &&  pnpm exec playwright install chromium');
  process.exit(2);
}

const argv = process.argv.slice(2);
const DIST = path.resolve(argv.find((a) => !a.startsWith('--')) ?? 'dist');
const flag = (n, d) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : d; };
const MAX_PAGES = Number(flag('pages', 0)) || Infinity;
const JSON_OUT = flag('json', null);
const STRICT = argv.includes('--strict');   // convierte los AVISOS en bloqueantes

if (!fs.existsSync(DIST)) {
  console.error(`No existe: ${DIST}\nUso: node audit-a11y.mjs <dist> [--pages N] [--json out.json] [--strict]`);
  process.exit(2);
}

const MIME = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.woff2':'font/woff2',
  '.woff':'font/woff', '.webp':'image/webp', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg',
  '.svg':'image/svg+xml', '.ico':'image/x-icon', '.mp4':'video/mp4', '.webm':'video/webm', '.json':'application/json' };

const server = http.createServer((req, res) => {
  let f = path.join(DIST, decodeURIComponent(req.url.split('?')[0]));
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f) || !fs.statSync(f).isFile()) { res.writeHead(404); return res.end('404'); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] ?? 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
const PORT = await new Promise((r) => server.listen(0, () => r(server.address().port)));
const BASE = `http://127.0.0.1:${PORT}`;

function findPages(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== '_astro') findPages(p, out); }
    else if (e.name.endsWith('.html')) out.push('/' + path.relative(DIST, p).replace(/index\.html$/, '').replace(/\\/g, '/'));
  }
  return out;
}
const ALL = findPages(DIST).sort((a, b) => a.length - b.length);
const PAGES = Number.isFinite(MAX_PAGES) ? ALL.slice(0, MAX_PAGES) : ALL;

const PROBE = () => {
  const lin = (c) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  const px = (s) => (String(s).match(/[\d.]+/g) ?? []).map(Number);
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)]; const [hi, lo] = x > y ? [x, y] : [y, x]; return (hi + 0.05) / (lo + 0.05); };
  const over = (fg, bg) => { const a = fg[3] ?? 1; return a >= 1 ? fg.slice(0, 3) : [0,1,2].map(i => Math.round(a * fg[i] + (1 - a) * bg[i])); };

  function bgOf(el) {
    let n = el, stack = [];
    while (n && n !== document.documentElement) {
      const c = px(getComputedStyle(n).backgroundColor);
      if (c.length >= 3) { const a = c[3] ?? 1; if (a > 0) { stack.push(c); if (a >= 1) break; } }
      n = n.parentElement;
    }
    let acc = [255, 255, 255];
    for (let i = stack.length - 1; i >= 0; i--) acc = over(stack[i], acc);
    return acc;
  }
  const visible = (el) => {
    let n = el;
    while (n && n !== document.body) {
      const cs = getComputedStyle(n);
      if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return false;
      n = n.parentElement;
    }
    const b = el.getBoundingClientRect();
    return b.right > -500 && b.bottom > -500;   // fuera de pantalla ≠ visible (honeypot, sr-only)
  };
  const targetBox = (el) => {
    let b = el.getBoundingClientRect();
    const lbl = el.closest('label') ??
      (el.id ? document.querySelector(`label[for="${CSS.escape(el.id)}"]`) : null);
    if (lbl) { const l = lbl.getBoundingClientRect(); if (l.width * l.height > b.width * b.height) b = l; }
    return b;
  };
  const where = (el) => {
    const id = el.id || el.closest('[id]')?.id;
    const cls = (el.className?.toString?.() ?? '').trim().split(/\s+/)[0];
    return (id ? '#' + id + ' ' : '') + el.tagName.toLowerCase() + (cls ? '.' + cls : '');
  };
  const name = (el) => (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 46);
  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';

  const R = { ghost: [], ring: [], contrast: [], lostName: [], headings: [], target: [] };

  for (const el of document.querySelectorAll(FOCUSABLE)) {
    let n = el, faded = null, gone = false;
    while (n && n !== document.body) {
      const cs = getComputedStyle(n);
      if (cs.visibility === 'hidden' || cs.display === 'none') { gone = true; break; }
      if (parseFloat(cs.opacity) === 0) faded ??= n;
      n = n.parentElement;
    }
    const b = el.getBoundingClientRect();
    const srOnly = b.width <= 1 && b.height <= 1;      // patrón .sr-only legítimo
    if (!gone && faded && !srOnly) R.ghost.push({ el: where(el), name: name(el), inside: where(faded) });
  }

  const seenRing = new Set();
  for (const el of document.querySelectorAll(FOCUSABLE)) {
    if (!visible(el)) continue;
    if (el.closest('[aria-hidden="true"]')) continue;
    const key = where(el); if (seenRing.has(key)) continue; seenRing.add(key);

    const antes = getComputedStyle(el);
    const reposo = { borde: antes.borderTopColor, ancho: antes.borderTopWidth, sombra: antes.boxShadow };

    try { el.focus({ preventScroll: true }); } catch { continue; }
    if (document.activeElement !== el) continue;
    const cs = getComputedStyle(el);
    const behind = bgOf(el.parentElement ?? el);       // outline-offset lo saca del elemento
    const cand = [];   // cada candidato a indicador, con su contraste

    if (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0)
      cand.push({ via: 'outline ' + cs.outlineColor, r: ratio(over(px(cs.outlineColor), behind), behind) });

    if (cs.borderTopColor !== reposo.borde || cs.borderTopWidth !== reposo.ancho) {
      const fondoCampo = bgOf(el);
      cand.push({ via: 'borde ' + cs.borderTopColor, r: ratio(over(px(cs.borderTopColor), fondoCampo), fondoCampo) });
    }
    if (cs.boxShadow !== reposo.sombra && cs.boxShadow !== 'none') {
      const m = cs.boxShadow.match(/rgba?\(([^)]+)\)/);
      const col = m ? m[1].split(',').map(Number) : [];
      if (col.length >= 3) cand.push({ via: 'sombra', r: ratio(over(col, behind), behind) });
    }

    if (!cand.length) { R.ring.push({ el: key, ring: 'SIN indicador de foco', ratio: null, behind: `rgb(${behind})` }); continue; }
    const mejor = cand.reduce((a, b) => (b.r > a.r ? b : a));   // basta con que UNO se vea
    if (mejor.r < 3) R.ring.push({ el: key, ring: mejor.via, ratio: +mejor.r.toFixed(2), behind: `rgb(${behind})` });
  }
  document.activeElement?.blur?.();

  const seenC = new Set();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let t; (t = walker.nextNode());) {
    const s = t.nodeValue.trim();
    if (s.length < 2) continue;
    const el = t.parentElement;
    if (!el || !visible(el)) continue;
    if (el.closest('[aria-hidden="true"]')) continue;
    const caja = el.getBoundingClientRect();
    if (caja.width <= 1 || caja.height <= 1) continue;   // .sr-only: no se pinta, no se mide
    const cs = getComputedStyle(el);
    const size = parseFloat(cs.fontSize);
    const weight = Number(cs.fontWeight) || 400;
    const big = size >= 24 || (size >= 18.66 && weight >= 700);   // "texto grande" WCAG
    const need = big ? 3 : 4.5;
    const bg = bgOf(el);
    const r = ratio(over(px(cs.color), bg), bg);
    if (r >= need) continue;
    const key = where(el) + '|' + Math.round(r * 100);
    if (seenC.has(key)) continue; seenC.add(key);
    R.contrast.push({ el: where(el), text: s.slice(0, 40), fg: cs.color, bg: `rgb(${bg})`,
                      size: Math.round(size), weight, ratio: +r.toFixed(2), need });
  }

  const MUDOS = { DIV:'generic', SPAN:'generic', P:'paragraph', B:'generic', I:'generic',
                  EM:'emphasis', STRONG:'strong', BDO:'generic', BDI:'generic', PRE:'generic' };
  for (const el of document.querySelectorAll('[aria-label], [aria-labelledby]')) {
    const rol = el.getAttribute('role');
    if (rol) continue;                                  // con rol explícito, sí admite nombre
    const mudo = MUDOS[el.tagName];
    if (mudo) R.lostName.push({ el: where(el), tag: el.tagName.toLowerCase(), rol: mudo,
                                label: (el.getAttribute('aria-label') ?? '').slice(0, 50) });
  }

  const hs = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h) => ({
    lvl: +h.tagName[1], text: h.textContent.trim().replace(/\s+/g, ' ').slice(0, 46),
    px: Math.round(parseFloat(getComputedStyle(h).fontSize)), vis: visible(h), el: where(h),
  }));
  const h1s = hs.filter((h) => h.lvl === 1);
  if (h1s.length === 0) R.headings.push({ tipo: 'sin-h1', detalle: 'la página no emite ningún <h1>' });
  if (h1s.length > 1) R.headings.push({ tipo: 'h1-multiple', detalle: `${h1s.length} elementos <h1>` });
  const primero = hs[0];
  if (primero && !primero.vis)
    R.headings.push({ tipo: 'primer-encabezado-invisible', detalle: `h${primero.lvl} "${primero.text}" (${primero.el}) abre el esquema y no se ve` });
  if (primero && primero.vis && primero.lvl !== 1)
    R.headings.push({ tipo: 'no-empieza-en-h1', detalle: `el esquema abre con h${primero.lvl}: "${primero.text}"` });
  for (let i = 1; i < hs.length; i++)
    if (hs[i].lvl - hs[i - 1].lvl > 1)
      R.headings.push({ tipo: 'salto-de-nivel', detalle: `h${hs[i-1].lvl} → h${hs[i].lvl}: "${hs[i].text}"` });
  if (h1s.length === 1 && hs.some((h) => h.lvl > 1 && h.vis && h.px > h1s[0].px * 1.6))
    R.headings.push({ tipo: 'h1-empequeñecido',
      detalle: `el h1 se pinta a ${h1s[0].px}px y hay encabezados menores mucho mayores (hasta ${Math.max(...hs.filter(h=>h.vis).map(h=>h.px))}px)` });

  if (innerWidth <= 480) {
    const grupos = {};
    for (const el of document.querySelectorAll('a[href], button, input:not([type=hidden]), select, summary')) {
      if (!visible(el)) continue;
      if (el.closest('[aria-hidden="true"]')) continue;      // trampa de bots y demás
      const b = targetBox(el);                                // el <label> cuenta como objetivo
      if (!b.width || !b.height) continue;
      if (Math.min(b.width, b.height) >= 24) continue;
      const k = where(el);
      (grupos[k] ??= { el: k, n: 0, w: Math.round(b.width), h: Math.round(b.height), ej: name(el) }).n++;
    }
    R.target = Object.values(grupos).sort((a, b) => b.n - a.n);
  }

  return { ...R, scrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth };
};

const CANDIDATOS = [
  process.env.CHROME_PATH,
  '/usr/bin/chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
].filter(Boolean);
const exe = CANDIDATOS.find((p) => fs.existsSync(p));
const browser = await chromium.launch(exe ? { executablePath: exe } : {});
const results = [];

const ABRIR = () => {
  for (const cb of document.querySelectorAll('input[type=checkbox], input[type=radio]')) {
    const b = cb.getBoundingClientRect();
    if (b.width <= 2 || b.height <= 2 || getComputedStyle(cb).opacity === '0') {
      cb.checked = true; cb.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }
  const objetivo = document.querySelector('.lightbox[id], [id][class*="modal"], [id][class*="popup"]');
  if (objetivo) location.hash = '#' + objetivo.id;
};

async function run(url, viewport, mobile = false, abrir = false) {
  const ctx = await browser.newContext({ viewport, isMobile: mobile, hasTouch: mobile });
  const page = await ctx.newPage();
  await page.route('**', (r) => (new URL(r.request().url()).host === `127.0.0.1:${PORT}` ? r.continue() : r.abort()));
  await page.goto(BASE + url, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(250);
  if (abrir) { await page.evaluate(ABRIR); await page.waitForTimeout(350); }
  await page.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important}' });
  const r = await page.evaluate(PROBE);
  await ctx.close();
  return r;
}

process.stdout.write(`\naudit-a11y · ${ALL.length} páginas en ${path.relative(process.cwd(), DIST) || DIST}, auditando ${PAGES.length}\n`);

for (const url of PAGES) {
  process.stdout.write(`  · ${url}`);
  const d = await run(url, { width: 1280, height: 900 });                 // escritorio, estado de reposo
  const a = await run(url, { width: 1280, height: 900 }, false, true);    // con todo desplegado
  const m = await run(url, { width: 390, height: 844 }, true);            // móvil
  const s = await run(url, { width: 320, height: 640 }, true);            // reflow mínimo
  results.push({
    url, ...d,
    contrast: [...d.contrast, ...a.contrast.filter((x) => !d.contrast.some((y) => y.el === x.el))],
    ring:     [...d.ring,     ...a.ring    .filter((x) => !d.ring    .some((y) => y.el === x.el))],
    target: m.target,
    reflow: { w: s.clientW, scroll: s.scrollW },
  });
  process.stdout.write('\n');
}

await browser.close();
server.close();

const C = { rst:'\x1b[0m', dim:'\x1b[2m', red:'\x1b[31m', yel:'\x1b[33m', grn:'\x1b[32m', b:'\x1b[1m' };
const isTTY = process.stdout.isTTY;
const c = (k, s) => (isTTY ? C[k] + s + C.rst : s);
const H = (s) => console.log('\n' + c('b', s) + '\n' + '─'.repeat(Math.min(s.length + 20, 78)));

const agg = (key, sig) => {
  const m = new Map();
  for (const r of results) for (const x of r[key] ?? []) {
    const k = sig(x);
    const e = m.get(k) ?? { ...x, paginas: new Set() };
    e.paginas.add(r.url); m.set(k, e);
  }
  return [...m.values()].sort((a, b) => b.paginas.size - a.paginas.size);
};

const ghost    = agg('ghost',    (x) => x.inside + '|' + x.el);
const ring     = agg('ring',     (x) => x.el);
const contrast = agg('contrast', (x) => x.el + '|' + x.ratio);
const lostName = agg('lostName', (x) => x.el);
const headings = agg('headings', (x) => x.tipo + '|' + x.detalle);
const target   = agg('target',   (x) => x.el);
const reflow   = results.filter((r) => r.reflow.scroll > r.reflow.w + 2);

let bloqueantes = 0, avisos = 0;
const N = (n) => String(n).padStart(3);

H('1 · FOCO-FANTASMA — enfocables dentro de capas invisibles (WCAG 2.4.3)');
if (!ghost.length) console.log(c('grn', '  ✓ ninguno'));
else {
  const porCapa = new Map();
  for (const g of ghost) porCapa.set(g.inside, (porCapa.get(g.inside) ?? 0) + 1);
  for (const [capa, n] of [...porCapa].sort((a, b) => b[1] - a[1]).slice(0, 10))
    console.log(`  ${c('red','✗')} ${N(n)} elementos dentro de ${c('b', capa)}`);
  const tot = Math.round(ghost.reduce((a, g) => a + g.paginas.size, 0) / results.length);
  console.log(c('dim', `\n  ≈${tot} paradas de tabulación invisibles por página.`));
  console.log(c('dim', '  Casi siempre: opacity:0 en vez de visibility:hidden.'));
  bloqueantes += ghost.length;
}

H('2 · FOCO-INVISIBLE — anillo por debajo de 3:1 contra su fondo (WCAG 2.4.7)');
if (!ring.length) console.log(c('grn', '  ✓ todos los indicadores de foco se ven'));
else for (const r of ring.slice(0, 12)) {
  console.log(`  ${c('red','✗')} ${r.el.padEnd(34)} anillo ${String(r.ring).padEnd(20)} sobre ${r.behind.padEnd(18)} ${r.ratio ? c('red', r.ratio + ':1') : ''}  ${c('dim', `[${r.paginas.size} pág.]`)}`);
  bloqueantes++;
}

H('3 · CONTRASTE de texto renderizado (WCAG 1.4.3)');
if (!contrast.length) console.log(c('grn', '  ✓ todo el texto pasa AA'));
else for (const x of contrast.slice(0, 20)) {
  console.log(`  ${c('red','✗')} ${c('red', (x.ratio + ':1').padStart(7))} (exige ${x.need}:1)  ${x.el.padEnd(30)} ${x.size}px  ${c('dim', '"' + x.text + '"')}  ${c('dim', `[${x.paginas.size} pág.]`)}`);
  bloqueantes++;
}

H('4 · NOMBRE-PERDIDO — aria-label sobre un rol que no admite nombre (WCAG 4.1.2)');
if (!lostName.length) console.log(c('grn', '  ✓ ningún nombre accesible se pierde'));
else for (const x of lostName) {
  console.log(`  ${c('yel','!')} ${x.el.padEnd(30)} <${x.tag}> = role=${x.rol}  "${x.label}"  ${c('dim', `[${x.paginas.size} pág.]`)}`);
  console.log(c('dim', `      → añade role="group"/"img", o mete el texto en un <span class="sr-only">`));
  avisos++;
}

H('5 · ESQUEMA DE ENCABEZADOS (WCAG 1.3.1 / 2.4.6)');
if (!headings.length) console.log(c('grn', '  ✓ esquema correcto en todas las páginas'));
else for (const h of headings) {
  const grave = h.tipo === 'sin-h1' || h.tipo === 'h1-multiple' || h.tipo === 'primer-encabezado-invisible';
  console.log(`  ${grave ? c('red','✗') : c('yel','!')} ${h.tipo.padEnd(30)} ${h.detalle}  ${c('dim', `[${h.paginas.size} pág.]`)}`);
  grave ? bloqueantes++ : avisos++;
}

H('6 · OBJETIVOS TÁCTILES < 24px a 390px (WCAG 2.5.8 AA)');
if (!target.length) console.log(c('grn', '  ✓ ningún objetivo por debajo de 24px'));
else for (const t of target.slice(0, 10)) {
  console.log(`  ${c('yel','!')} ${N(t.n)}× ${t.el.padEnd(30)} ${t.w}×${t.h}px  ${c('dim', '"' + t.ej + '"')}  ${c('dim', `[${t.paginas.size} pág.]`)}`);
  avisos++;
}

H('7 · REFLOW a 320px (WCAG 1.4.10)');
if (!reflow.length) console.log(c('grn', `  ✓ sin scroll horizontal en ${PAGES.length} páginas`));
else for (const r of reflow) { console.log(`  ${c('red','✗')} ${r.url}  scrollWidth ${r.reflow.scroll} > viewport ${r.reflow.w}`); bloqueantes++; }

console.log('\n' + '═'.repeat(78));
const total = bloqueantes + avisos;
if (!total) console.log(c('grn', c('b', '  ✓ sin hallazgos.')));
else console.log(`  ${bloqueantes ? c('red', c('b', bloqueantes + ' bloqueantes')) : c('grn','0 bloqueantes')}  ·  ${avisos} avisos  ·  ${PAGES.length} páginas auditadas`);
console.log('═'.repeat(78) + '\n');

if (JSON_OUT) {
  const ser = (a) => a.map((x) => ({ ...x, paginas: [...x.paginas] }));
  fs.writeFileSync(JSON_OUT, JSON.stringify(
    { dist: DIST, paginas: PAGES, bloqueantes, avisos,
      ghost: ser(ghost), ring: ser(ring), contrast: ser(contrast),
      lostName: ser(lostName), headings: ser(headings), target: ser(target),
      reflow: reflow.map((r) => ({ url: r.url, ...r.reflow })) }, null, 2));
  console.log(c('dim', `  JSON → ${JSON_OUT}\n`));
}

process.exit(bloqueantes > 0 || (STRICT && avisos > 0) ? 1 : 0);
