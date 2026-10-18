import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pruneTokens, pruneSelectors, usedNames } from '../tools/prune.js';

test('pruneTokens drops Web Awesome tokens nothing uses and keeps the chain that is used', () => {
  const css =
    ':root{--wa-a:red;--wa-b:var(--wa-c);--wa-c:1px;--wa-unused:var(--wa-d);--wa-d:2px;--mine:3px}.x{color:var(--wa-b)}';
  const out = pruneTokens(css, '');
  assert.match(out, /--wa-b:var\(--wa-c\)/);
  assert.match(out, /--wa-c:1px/);
  assert.match(out, /--mine:3px/);
  assert.doesNotMatch(out, /--wa-a:/);
  assert.doesNotMatch(out, /--wa-unused:/);
  assert.doesNotMatch(out, /--wa-d:/);
});

test('pruneTokens keeps tokens the component scripts reference', () => {
  const out = pruneTokens(':root{--wa-tooltip-size:4px;--wa-gone:1px}', 'css`:host{width:var(--wa-tooltip-size)}`');
  assert.match(out, /--wa-tooltip-size:4px/);
  assert.doesNotMatch(out, /--wa-gone/);
});

test('pruneTokens handles a last declaration without a semicolon', () => {
  assert.equal(
    pruneTokens(':root{--wa-x:1px;--wa-y:2px}.a{margin:var(--wa-x)}', ''),
    ':root{--wa-x:1px;}.a{margin:var(--wa-x)}'
  );
});

test('pruneSelectors drops Web Awesome class selectors nothing uses, rule by rule and inside layers', () => {
  const css =
    '@layer wa-utilities{.wa-cluster,.wa-stack{gap:1px}.wa-split{display:flex}}:where(:root),.wa-brand-red{--x:1}.mine{a:b}';
  const out = pruneSelectors(css, new Set(['wa-cluster', 'mine']));
  assert.equal(out, '@layer wa-utilities{.wa-cluster{gap:1px}}:where(:root){--x:1}.mine{a:b}');
});

test('pruneSelectors keeps selectors whose commas sit inside parentheses', () => {
  const css = '.wa-a:is(.x,.y),.wa-b:where(.p,.q){c:d}';
  assert.equal(pruneSelectors(css, new Set(['wa-b'])), '.wa-b:where(.p,.q){c:d}');
});

test('pruneSelectors drops [class*=wa-…] selectors no used class contains, outside of :is() lists', () => {
  const css = '[class*=wa-body]{a:b}[class*="wa-stack"]>*{c:d}:is([class*=wa-flank],[class*=wa-stack])>x{e:f}';
  assert.equal(
    pruneSelectors(css, new Set(['wa-stack', 'wa-gap-s'])),
    '[class*="wa-stack"]>*{c:d}:is([class*=wa-flank],[class*=wa-stack])>x{e:f}'
  );
});

test('pruneSelectors drops selectors needing a class the page never uses, outside of :is() lists', () => {
  const css = '.way-back .rail{a:b}.card{c:d}:root:has(.way-back) .card{e:f}';
  assert.equal(pruneSelectors(css, new Set(['card'])), '.card{c:d}:root:has(.way-back) .card{e:f}');
});

test('usedNames reads class names from markup and scripts, not custom property names', () => {
  const names = usedNames('<i class="cell wa-cluster">x.classList.add("is-live");a{b:var(--wa-font-size-xs)}');
  for (const name of ['cell', 'wa-cluster', 'is-live']) assert.ok(names.has(name), name);
  assert.ok(!names.has('wa-font-size-xs'));
});
