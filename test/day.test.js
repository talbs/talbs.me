import { test } from 'node:test';
import assert from 'node:assert/strict';
import { zonedDate, brianClock } from '../src/clock.js';
import { minuteOf, dateAtMinute, dayStops, nearestStop, sunTips, contextFor } from '../src/day.js';

const at = (month, dayOfMonth, hour = 12, minute = 0) => zonedDate({ year: 2026, month, dayOfMonth, hour, minute });
const near = (actual, expected, tolerance, label) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: ${actual} vs ${expected}`);

test('minuteOf and dateAtMinute round-trip on ordinary and DST days', () => {
  assert.equal(minuteOf(at(10, 15, 18, 30)), 1110);
  for (const day of [at(3, 8), at(11, 1), at(10, 15)]) {
    for (const minutes of [0, 600, 750, 1430]) {
      assert.equal(minuteOf(dateAtMinute(day, minutes)), minutes, `${brianClock(day).dayOfMonth} @ ${minutes}`);
    }
  }
});

// Published Boston times (timeanddate.com, 2026): June 21 sunrise 5:07, noon 12:43, sunset 8:25; Dec 21 sunrise 7:10, sunset 4:14.
test('dayStops finds sunrise, solar noon, and sunset', () => {
  const june = dayStops(at(6, 21));
  near(june.sunrise, 5 * 60 + 7, 3, 'June sunrise');
  near(june.noon, 12 * 60 + 43, 3, 'June noon');
  near(june.sunset, 20 * 60 + 25, 3, 'June sunset');
  const december = dayStops(at(12, 21));
  near(december.sunrise, 7 * 60 + 10, 3, 'December sunrise');
  near(december.sunset, 16 * 60 + 14, 3, 'December sunset');
});

test('nearestStop snaps inside the window and not outside it', () => {
  const stops = [427, 763, 1105];
  assert.equal(nearestStop(1100, stops, 10), 1105);
  assert.equal(nearestStop(1090, stops, 10), null);
  assert.equal(nearestStop(770, stops, 10), 763);
});

test('sunTips puts sunrise before or after the 6:30 alarm', () => {
  assert.equal(sunTips('sunrise', at(6, 21))[0], 'before the alarm.');
  assert.equal(sunTips('sunrise', at(12, 21))[0], 'after the alarm.');
});

// dayStops counts the first minute the sun is up, so a 6:30 sunrise came up before 6:30:00.
test('sunTips calls a 6:30 sunrise before the alarm', () => {
  const day = Array.from({ length: 30 }, (_, i) => at(9, i + 1)).find(date => dayStops(date).sunrise === 390);
  assert.ok(day, 'some September day has a 6:30 sunrise');
  assert.equal(sunTips('sunrise', day)[0], 'before the alarm.');
});

test('sunTips names civil dawn and dusk', () => {
  assert.match(sunTips('sunrise', at(12, 1))[1], /^light by 6:2[0-4]am\.$/);
  assert.match(sunTips('sunset', at(12, 1))[1], /^dark by 4:4[1-5]pm\.$/);
});

test('sunTips says clouds not permitting from 50% cover at sunset', () => {
  assert.equal(sunTips('sunset', at(10, 16), null)[0], 'clouds permitting.');
  assert.equal(sunTips('sunset', at(10, 16), 49)[0], 'clouds permitting.');
  assert.equal(sunTips('sunset', at(10, 16), 50)[0], 'clouds not permitting.');
});

test('sunTips adds the minute line only when today moved exactly one minute', () => {
  let seen = 0;
  for (let dayOfMonth = 2; dayOfMonth <= 31; dayOfMonth++) {
    for (const kind of ['sunrise', 'sunset']) {
      const delta = dayStops(at(10, dayOfMonth))[kind] - dayStops(at(10, dayOfMonth - 1))[kind];
      const pool = sunTips(kind, at(10, dayOfMonth));
      if (Math.abs(delta) !== 1) {
        assert.equal(pool.length, 2, `Oct ${dayOfMonth} ${kind} moved ${delta}`);
        continue;
      }
      seen++;
      assert.equal(pool.length, 3);
      assert.equal(pool[2], `a minute ${delta < 0 ? 'earlier' : 'later'} than yesterday.`);
    }
  }
  assert.ok(seen > 10, `${seen} one-minute days in October`);
});

test('sunTips skips the minute line across a clock change', () => {
  for (const day of [at(3, 8), at(11, 1)]) {
    for (const kind of ['sunrise', 'sunset']) assert.doesNotMatch(sunTips(kind, day).join(' '), /minute/);
  }
});

test('contextFor picks one sun quip a day from the pool', () => {
  const plain = { with: null };
  const morning = contextFor(plain, at(10, 16, 13, 0), 30);
  const evening = contextFor(plain, at(10, 16, 17, 30), 5);
  assert.equal(morning.tip, evening.tip);
  assert.ok(
    sunTips('sunset', at(10, 16)).some(quip => morning.tip === `Sunset: ${quip}`),
    morning.tip
  );
  const cloudy = contextFor(plain, at(10, 16, 13, 0), 30, () => 80);
  assert.ok(
    sunTips('sunset', at(10, 16), 80).some(quip => cloudy.tip === `Sunset: ${quip}`),
    cloudy.tip
  );
});
