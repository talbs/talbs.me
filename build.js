import { build, transform } from 'esbuild';
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { SECTIONS, links } from './links.js';
import { renderTray, validateLinks } from './tray.js';
import { pruneSelectors, pruneTokens } from './prune.js';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const DIST = `${ROOT}dist/`;
const HTML_BUDGET_KB = 24;
const isCheck = process.argv.includes('--check');

const problems = validateLinks(links, SECTIONS);
if (problems.length) throw new Error(`links.js:\n  ${problems.join('\n  ')}`);

const gzipKb = text => gzipSync(text).length / 1024;

function fill(template, values) {
  const unused = new Set(Object.keys(values));
  const html = template.replace(/<!-- build:(\w+) -->/g, (match, name) => {
    if (!(name in values)) throw new Error(`index.html: nothing to fill ${match}`);
    unused.delete(name);
    return values[name];
  });
  if (unused.size) throw new Error(`index.html: no placeholder for ${[...unused].join(', ')}`);
  return html;
}

await rm(DIST, { recursive: true, force: true });
await mkdir(`${DIST}fonts`, { recursive: true });

const styles = await build({
  entryPoints: [`${ROOT}styles.css`],
  bundle: true,
  minify: true,
  write: false,
  outdir: DIST,
  assetNames: 'fonts/[name]-[hash]',
  loader: { '.woff2': 'file' },
  logLevel: 'warning',
});
let css = '';
let font = '';
for (const file of styles.outputFiles) {
  if (file.path.endsWith('.css')) css = file.text;
  else await writeFile(file.path, file.contents);
  if (basename(file.path).startsWith('chivo-latin-400-normal')) font = `fonts/${basename(file.path)}`;
}
if (!font) throw new Error('build: no Chivo 400 font in the CSS bundle');

const page = await build({
  entryPoints: [`${ROOT}page.js`],
  bundle: true,
  minify: true,
  write: false,
  format: 'iife',
  logLevel: 'warning',
});
await build({
  entryPoints: [`${ROOT}enhance.js`],
  bundle: true,
  minify: true,
  format: 'esm',
  outfile: `${DIST}enhance.js`,
  logLevel: 'warning',
});
const js = page.outputFiles[0].text;
const scripts = js + (await readFile(`${DIST}enhance.js`, 'utf8'));
const template = await readFile(`${ROOT}index.html`, 'utf8');
const tray = renderTray(links, SECTIONS);
const used = new Set((template + tray + scripts).match(/\bwa-[\w-]+/g));
css = pruneTokens(pruneSelectors(css, used), scripts);
css = (await transform(css, { loader: 'css', minify: true })).code.trim();

const html = fill(template, {
  font: `<link rel="preload" href="${font}" as="font" type="font/woff2" crossorigin>`,
  css: `<style>${css}</style>`,
  js: `<script>${js}</script>`,
  links: tray,
});
await writeFile(`${DIST}index.html`, html);
for (const file of ['favicon.svg', 'og.png', ...links.map(link => link.icon).filter(icon => icon.endsWith('.svg'))]) {
  await copyFile(`${ROOT}${file}`, `${DIST}${file}`);
}

if (isCheck) {
  const kb = gzipKb(html);
  if (kb > HTML_BUDGET_KB) throw new Error(`index.html is ${kb.toFixed(1)} KB gzip, over ${HTML_BUDGET_KB} KB`);
  console.log(`index.html ${kb.toFixed(1)} KB gzip`);
  const loads = [
    ...html.matchAll(/<(?:script|link|img|iframe)\b[^>]*\b(?:src|href)="(https?:[^"]+)"/g),
    ...css.matchAll(/url\(["']?(https?:[^)"']+)/g),
  ].map(match => new URL(match[1]).host);
  const strays = [...new Set(loads)].filter(host => host !== 'www.talbs.me');
  if (strays.length) throw new Error(`index.html loads from ${strays.join(', ')}`);
  const pageIds = (await readFile(`${ROOT}page.js`, 'utf8')).matchAll(/getElementById\('([\w-]+)'\)/g);
  for (const [, id] of pageIds) {
    if (!html.includes(`id="${id}"`)) throw new Error(`index.html: no #${id}`);
  }
}
