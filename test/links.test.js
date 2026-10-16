import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { SECTIONS, links } from '../src/links.js';
import { validateLinks, renderTray } from '../tools/tray.js';
import { pools } from '../src/statuses.js';

const entry = (overrides = {}) => ({
  section: 'Now',
  title: 'Thing',
  note: 'a note',
  url: 'https://example.com/',
  icon: 'pen-ruler',
  ...overrides,
});

test('the shipped links are valid and cover every section', () => {
  assert.deepEqual(validateLinks(links, SECTIONS), []);
});

test('every custom SVG icon a status chip names ships with the site, through its tray link', () => {
  const shipped = new Set(links.map(link => link.icon));
  const chips = Object.values(pools)
    .flat()
    .map(line => line.with?.icon)
    .filter(icon => icon?.endsWith('.svg'));
  assert.ok(chips.includes('tiny-tells.svg'), 'expected the Tiny Tells face');
  for (const icon of chips) assert.ok(shipped.has(icon), `${icon} has no tray link to ship it`);
});

test('every custom SVG icon a link names ships with the site', () => {
  const svgs = links.filter(link => link.icon.endsWith('.svg'));
  assert.ok(svgs.length > 0, 'expected the Create gem');
  for (const link of svgs)
    assert.ok(existsSync(new URL(`../assets/${link.icon}`, import.meta.url)), `${link.icon} is missing`);
});

test('an email link ships without its address in the HTML', () => {
  const html = renderTray(
    [entry({ title: 'Email', url: undefined, email: { user: 'hello', domain: 'talbs.me' } })],
    ['Now']
  );
  assert.deepEqual(
    validateLinks([entry({ url: undefined, email: { user: 'hello', domain: 'talbs.me' } })], ['Now']),
    []
  );
  assert.doesNotMatch(html, /@|mailto/);
  assert.match(html, /data-user="hello" data-domain="talbs\.me"/);
});

test('validateLinks names each kind of problem', () => {
  const problems = validateLinks(
    [
      entry({ title: '' }),
      entry({ note: '' }),
      entry({ url: 'http://example.com/' }),
      entry({ section: 'Later' }),
      entry({ icon: '' }),
    ],
    ['Now', 'Made']
  );
  assert.equal(problems.length, 6);
  assert.match(problems.join('\n'), /no title/);
  assert.match(problems.join('\n'), /no note/);
  assert.match(problems.join('\n'), /https/);
  assert.match(problems.join('\n'), /unknown section "Later"/);
  assert.match(problems.join('\n'), /no icon/);
  assert.match(problems.join('\n'), /section Made is empty/);
});

test('renderTray keeps section order, numbers rows across sections, and escapes text', () => {
  const html = renderTray(
    [
      entry({ section: 'Made', title: 'B & <b>', note: 'say "hi"' }),
      entry({ section: 'Now', title: 'A' }),
      entry({ section: 'Made', title: 'C', icon: 'github', family: 'brands' }),
    ],
    ['Now', 'Made']
  );
  assert.ok(html.indexOf('id="links-now"') < html.indexOf('id="links-made"'));
  assert.deepEqual(
    [...html.matchAll(/--i: (\d+)/g)].map(match => Number(match[1])),
    [0, 1, 2]
  );
  assert.match(html, /B &amp; &lt;b&gt;/);
  assert.match(html, /say &quot;hi&quot;/);
  assert.equal((html.match(/data-family=/g) ?? []).length, 1);
  assert.match(html, /data-icon="github" data-family="brands"/);
});
