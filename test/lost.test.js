import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { lostPage } from '../tools/lost.js';

const template = readFileSync(new URL('../src/index.html', import.meta.url), 'utf8');
const VARS = { '--sky-top': '#0a0630', '--stars': 1 };

test('the 404 page resolves every asset from the root, so it works at any depth', () => {
  assert.match(lostPage(template, 'Looking…', VARS), /<head>\s*<base href="\/" \/>/);
});

test('the 404 page stays out of search results and says what it is', () => {
  const html = lostPage(template, 'Looking…', VARS);
  assert.match(html, /<meta name="robots" content="noindex" \/>/);
  assert.match(html, /<title>Not found · Brian Talbot<\/title>/);
});

test('the 404 page reads right before scripts run: 4:04 sky, error face, lost line, way back', () => {
  const html = lostPage(template, 'Up at 4:04, looking for that page…', VARS);
  assert.match(html, /<html[^>]*style="--sky-top: #0a0630; --stars: 1"/);
  assert.match(html, /<div\s+class="day"\s+id="day"\s*>/);
  assert.match(html, /<tiny-tell[^>]*state="error"/);
  assert.match(html, />Up at 4:04, looking for that page…<\/span/);
});

test('the 404 page fails the build loudly when the template drifts', () => {
  assert.throws(() => lostPage(template.replace('<title>', '<title data-x>'), 'Looking…', VARS), /title/);
});
