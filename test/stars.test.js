import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeStars, starCount } from '../src/stars.js';

test('makeStars is the same sky every time', () => {
  assert.deepEqual(makeStars(50), makeStars(50));
});

test('every star sits inside the turning circle and inside xdim’s ranges', () => {
  for (const star of makeStars(400)) {
    assert.ok(Math.hypot(star.x - 50, star.y - 50) <= 50.01, `(${star.x}, ${star.y}) inside the circle`);
    assert.ok(star.size >= 1 && star.size <= 2.5, `size ${star.size}`);
    assert.ok(star.duration >= 3 && star.duration <= 7, `duration ${star.duration}`);
    assert.ok(star.delay >= 0 && star.delay <= 5, `delay ${star.delay}`);
  }
});

// The circle is the screen's diagonal wide, so a turning field always covers the screen; about 80 land on it.
test('starCount fills that circle at xdim’s density', () => {
  assert.equal(starCount(1280, 800), 140);
  assert.equal(starCount(1440, 900), 140);
  assert.equal(starCount(390, 844), 165);
  assert.equal(starCount(844, 390), 165);
});
