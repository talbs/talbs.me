import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeClouds } from '../src/clouds.js';

test('makeClouds is the same sky every time', () => {
  assert.deepEqual(makeClouds(), makeClouds());
});

// Golden values from the approved spike (day-sky-v9, v7 painterly, seeds 5 and 17).
test('makeClouds lays out the spike’s 51 puffs', () => {
  const { near, far } = makeClouds();
  assert.equal(near.length, 20);
  assert.equal(far.length, 31);
  assert.deepEqual(near[0], { x: 42.8, y: 10.9, w: 33.8, h: 21.1, o: 0.67 });
  assert.deepEqual(near[1], { x: 87.3, y: 15.4, w: 18.6, h: 11.1, o: 0.69 });
  assert.deepEqual(far[0], { x: 16.8, y: 8.4, w: 17.4, h: 9.7, o: 0.48 });
});

test('the far layer is fainter and every puff sits on the screen’s height', () => {
  const { near, far } = makeClouds();
  assert.ok(
    far.every(puff => puff.o <= 0.54),
    'far puffs at 0.6 of the near opacity'
  );
  assert.ok(near.every(puff => puff.o <= 0.9));
  for (const puff of [...near, ...far]) assert.ok(puff.y > -5 && puff.y < 105, `y ${puff.y}`);
});

test('clouds overhead are bigger and rounder than clouds at the horizon', () => {
  const { near } = makeClouds();
  const top = near.filter(puff => puff.y < 30);
  const bottom = near.filter(puff => puff.y > 80);
  const mean = (puffs, of) => puffs.reduce((sum, puff) => sum + of(puff), 0) / puffs.length;
  assert.ok(mean(top, puff => puff.w) > mean(bottom, puff => puff.w));
  assert.ok(mean(top, puff => puff.h / puff.w) > mean(bottom, puff => puff.h / puff.w));
});

test('makeClouds lists its layers back to front, so the near layer paints over the far one', () => {
  assert.deepEqual(Object.keys(makeClouds()), ['far', 'near']);
});
