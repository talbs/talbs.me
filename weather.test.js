import { test } from 'node:test';
import assert from 'node:assert/strict';
import { zonedDate } from './clock.js';
import { weatherIcon, weatherWords, weatherAt, weatherUrl } from './weather.js';

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
};

test('weatherAt reads the Boston hour, rounded to a whole degree', () => {
  const at = (hour, minute = 0) =>
    weatherAt(hourly, zonedDate({ year: 2026, month: 10, dayOfMonth: 15, hour, minute }));
  assert.deepEqual(at(13, 40), { temp: 47, code: 61, isDay: true });
  assert.deepEqual(at(3), { temp: 42, code: 0, isDay: false });
  assert.equal(weatherAt(hourly, zonedDate({ year: 2026, month: 10, dayOfMonth: 16, hour: 9, minute: 0 })), null);
  assert.equal(weatherAt(undefined, new Date()), null);
});

test('weatherUrl asks for the Boston date being shown', () => {
  const url = weatherUrl(zonedDate({ year: 2026, month: 10, dayOfMonth: 14, hour: 23, minute: 30 }));
  assert.match(url, /start_date=2026-10-14&end_date=2026-10-14$/);
  assert.match(url, /^https:\/\/api\.open-meteo\.com\/v1\/forecast\?/);
});
