import test from 'node:test';
import assert from 'node:assert/strict';
import { skyVars, OFF_WHITE } from '../src/sky.js';
import { zonedDate } from '../src/clock.js';

const at = (hour, minute) => zonedDate({ year: 2026, month: 10, dayOfMonth: 15, hour, minute });

test('skyVars gives every custom property the page paints, for any moment', () => {
  const { vars } = skyVars(at(4, 4));
  assert.equal(Object.keys(vars).length, 15);
  assert.ok(Object.keys(vars).every(name => name.startsWith('--')));
});

test('at 4:04 a.m. the sky has stars and light ink', () => {
  const { vars, elevation } = skyVars(at(4, 4));
  assert.ok(elevation < 0);
  assert.ok(vars['--stars'] > 0);
  assert.equal(vars['--header-ink'], OFF_WHITE);
  assert.equal(vars['--dial-ink'], OFF_WHITE);
});

test('a pinned sun elevation overrides the real one', () => {
  assert.equal(skyVars(at(4, 4), 30).elevation, 30);
});
