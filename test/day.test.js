import { test } from 'node:test';
import assert from 'node:assert/strict';
import { zonedDate, brianClock } from '../src/clock.js';
import { minuteOf, dateAtMinute, dayStops, nearestStop } from '../src/day.js';

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
