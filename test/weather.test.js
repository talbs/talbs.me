import { test } from 'node:test';
import assert from 'node:assert/strict';
import { zonedDate } from '../src/clock.js';
import { skyVars, OFF_BLACK } from '../src/sky.js';
import { weatherIcon, weatherWords, weatherAt, weatherUrl, cloudsFor } from '../src/weather.js';

test('weatherIcon maps each WMO group to a Font Awesome icon, by day and night', () => {
  assert.equal(weatherIcon(0, true), 'sun');
  assert.equal(weatherIcon(0, false), 'moon');
  assert.equal(weatherIcon(2, true), 'cloud-sun');
  assert.equal(weatherIcon(1, false), 'cloud-moon');
  assert.equal(weatherIcon(3, true), 'cloud');
  assert.equal(weatherIcon(45, true), 'cloud-fog');
  assert.equal(weatherIcon(53, true), 'cloud-drizzle');
  assert.equal(weatherIcon(61, true), 'cloud-rain');
  assert.equal(weatherIcon(65, true), 'cloud-showers-heavy');
  assert.equal(weatherIcon(66, true), 'cloud-sleet');
  assert.equal(weatherIcon(73, true), 'cloud-snow');
  assert.equal(weatherIcon(95, true), 'cloud-bolt');
});

test('weatherWords says it plainly', () => {
  assert.equal(weatherWords(0), 'clear');
  assert.equal(weatherWords(2), 'partly cloudy');
  assert.equal(weatherWords(63), 'raining');
  assert.equal(weatherWords(99), 'storming');
});

const hourly = {
  time: Array.from({ length: 24 }, (_, hour) => `2026-10-15T${String(hour).padStart(2, '0')}:00`),
  temperature_2m: Array.from({ length: 24 }, (_, hour) => 40 + hour / 2),
  weather_code: Array.from({ length: 24 }, (_, hour) => (hour < 12 ? 0 : 61)),
  is_day: Array.from({ length: 24 }, (_, hour) => (hour >= 7 && hour < 18 ? 1 : 0)),
  cloud_cover: Array.from({ length: 24 }, (_, hour) => hour * 4),
};

test('weatherAt reads the Boston hour, rounded to a whole degree', () => {
  const at = (hour, minute = 0) =>
    weatherAt(hourly, zonedDate({ year: 2026, month: 10, dayOfMonth: 15, hour, minute }));
  assert.deepEqual(at(13, 40), { temp: 47, code: 61, isDay: true, cover: 52 });
  assert.deepEqual(at(3), { temp: 42, code: 0, isDay: false, cover: 12 });
  assert.equal(weatherAt(hourly, zonedDate({ year: 2026, month: 10, dayOfMonth: 16, hour: 9, minute: 0 })), null);
  assert.equal(weatherAt(undefined, new Date()), null);
});

test('weatherUrl asks for the Boston date being shown', () => {
  const url = weatherUrl(zonedDate({ year: 2026, month: 10, dayOfMonth: 14, hour: 23, minute: 30 }));
  assert.match(url, /start_date=2026-10-14&end_date=2026-10-14$/);
  assert.match(url, /^https:\/\/api\.open-meteo\.com\/v1\/forecast\?/);
  assert.match(url, /hourly=[\w,]*\bcloud_cover\b/);
});

test('weatherAt reads no cover as clear', () => {
  const { cloud_cover, ...old } = hourly;
  assert.equal(weatherAt(old, zonedDate({ year: 2026, month: 10, dayOfMonth: 15, hour: 9, minute: 0 })).cover, 0);
});

test('cloudsFor grows the clouds to 50% cover, then the veil to 100%', () => {
  assert.deepEqual(cloudsFor(0, 30), { clouds: 0, veil: 0 });
  assert.deepEqual(cloudsFor(25, 30), { clouds: 0.25, veil: 0 });
  assert.deepEqual(cloudsFor(50, 30), { clouds: 0.5, veil: 0 });
  assert.deepEqual(cloudsFor(75, 30), { clouds: 0.5, veil: 0.3 });
  assert.deepEqual(cloudsFor(100, 30), { clouds: 0.5, veil: 0.6 });
  assert.deepEqual(cloudsFor(null, 30), { clouds: 0, veil: 0 });
  assert.deepEqual(cloudsFor(undefined, 30), { clouds: 0, veil: 0 });
});

// Measured: under 100% cover the off-white header ink of a winter dusk fell to 3.7:1. That ink only shows below 0°.
// The fade starts at 2°, not 6°, so sunset keeps its clouds: at 5:45pm in October the sun is still 2° up.
test('cloudsFor fades the clouds out over the last 2° of sun, gone by the horizon', () => {
  assert.deepEqual(cloudsFor(100, 6), { clouds: 0.5, veil: 0.6 });
  assert.deepEqual(cloudsFor(100, 2), { clouds: 0.5, veil: 0.6 });
  assert.deepEqual(cloudsFor(100, 1), { clouds: 0.25, veil: 0.3 });
  assert.deepEqual(cloudsFor(100, 0), { clouds: 0, veil: 0 });
  assert.deepEqual(cloudsFor(100, -4), { clouds: 0, veil: 0 });
});

test('the header ink is never off-white while the sun is up, so clouds never sit under it', () => {
  for (let month = 1; month <= 12; month++) {
    for (let minutes = 0; minutes < 1440; minutes += 4) {
      const date = zonedDate({
        year: 2026,
        month,
        dayOfMonth: 15,
        hour: Math.floor(minutes / 60),
        minute: minutes % 60,
      });
      const { elevation, vars } = skyVars(date);
      if (cloudsFor(100, elevation).clouds > 0) assert.equal(vars['--header-ink'], OFF_BLACK, `${month}/15 ${minutes}`);
    }
  }
});
