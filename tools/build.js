import { build, transform } from 'esbuild';
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { SECTIONS, links } from '../src/links.js';
import { lost } from '../src/statuses.js';
import { lostPage } from './lost.js';
import { skyVars } from '../src/sky.js';
import { dateAtMinute } from '../src/day.js';
import { renderTray, validateLinks } from './tray.js';
import { pruneSelectors, pruneTokens, usedNames } from './prune.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SRC = `${ROOT}src/`;
const ASSETS = `${ROOT}assets/`;
const DIST = `${ROOT}dist/`;
const HTML_BUDGET_KB = 24;
const ALLOWED_HOSTS = ['www.talbs.me', 'cloud.umami.is'];
const isCheck = process.argv.includes('--check');

const problems = validateLinks(links, SECTIONS);
if (problems.length) throw new Error(`src/links.js:\n  ${problems.join('\n  ')}`);

const gzipKb = text => gzipSync(text).length / 1024;

function fill(template, values) {
  const unused = new Set(Object.keys(values));
  const html = template.replace(/<!-- build:(\w+) -->/g, (match, name) => {
    if (!(name in values)) throw new Error(`src/index.html: nothing to fill ${match}`);
    unused.delete(name);
    return values[name];
  });
  if (unused.size) throw new Error(`src/index.html: no placeholder for ${[...unused].join(', ')}`);
  return html;
}

await rm(DIST, { recursive: true, force: true });
await mkdir(`${DIST}fonts`, { recursive: true });

const styles = await build({
  entryPoints: [`${SRC}styles.css`],
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

// One bundle per page: IS_LOST is a build-time constant, so each page drops the other's dead branches.
const bundlePage = async isLost =>
  (
    await build({
      entryPoints: [`${SRC}page.js`],
      bundle: true,
      minify: true,
      write: false,
      format: 'iife',
      define: { IS_LOST: String(isLost) },
      logLevel: 'warning',
    })
  ).outputFiles[0].text;
const js = await bundlePage(false);
const lostJs = await bundlePage(true);
await build({
  entryPoints: [`${SRC}enhance.js`],
  bundle: true,
  minify: true,
  format: 'esm',
  outfile: `${DIST}enhance.js`,
  logLevel: 'warning',
});
const enhance = await readFile(`${DIST}enhance.js`, 'utf8');
const scripts = js + lostJs + enhance;
const template = await readFile(`${SRC}index.html`, 'utf8');
const slider = await readFile(`${SRC}slider.html`, 'utf8');
const wayBack = await readFile(`${SRC}way-back.html`, 'utf8');
const tray = renderTray(links, SECTIONS);
// Each page gets only the rules its own markup and scripts can match, so the 404's rail stays off the home page.
const cssFor = async (...parts) => {
  const pruned = pruneTokens(pruneSelectors(css, usedNames(parts.join('') + enhance)), scripts);
  return `<style>${(await transform(pruned, { loader: 'css', minify: true })).code.trim()}</style>`;
};

const shared = {
  font: `<link rel="preload" href="${font}" as="font" type="font/woff2" crossorigin>`,
  links: tray,
};
const html = fill(template, {
  ...shared,
  css: await cssFor(template, slider, tray, js),
  js: `<script>${js}</script>`,
  day: slider,
});
const lostSky = skyVars(dateAtMinute(new Date(), 244)).vars;
const lostTemplate = lostPage(template, lost[0], lostSky);
const lostHtml = fill(lostTemplate, {
  ...shared,
  css: await cssFor(lostTemplate, wayBack, tray, lostJs),
  js: `<script>${lostJs}</script>`,
  day: wayBack,
});
await writeFile(`${DIST}index.html`, html);
await writeFile(`${DIST}404.html`, lostHtml);
for (const file of ['favicon.svg', 'og.png', ...links.map(link => link.icon).filter(icon => icon.endsWith('.svg'))]) {
  await copyFile(`${ASSETS}${file}`, `${DIST}${file}`);
}

if (isCheck) {
  for (const [name, page] of [
    ['index.html', html],
    ['404.html', lostHtml],
  ]) {
    const kb = gzipKb(page);
    if (kb > HTML_BUDGET_KB) throw new Error(`${name} is ${kb.toFixed(1)} KB gzip, over ${HTML_BUDGET_KB} KB`);
    console.log(`${name} ${kb.toFixed(1)} KB gzip`);
  }
  const loads = [
    ...html.matchAll(/<(?:script|link|img|iframe)\b[^>]*\b(?:src|href)="(https?:[^"]+)"/g),
    ...css.matchAll(/url\(["']?(https?:[^)"']+)/g),
  ].map(match => new URL(match[1]).host);
  const strays = [...new Set(loads)].filter(host => !ALLOWED_HOSTS.includes(host));
  if (strays.length) throw new Error(`index.html loads from ${strays.join(', ')}`);
  const pageIds = (await readFile(`${SRC}page.js`, 'utf8')).matchAll(/getElementById\('([\w-]+)'\)/g);
  for (const [, id] of pageIds) {
    if (!html.includes(`id="${id}"`)) throw new Error(`index.html: no #${id}`);
  }
}
