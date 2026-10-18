import { brianClock } from './clock.js';
import { clamp } from './sky.js';
import { round } from './stars.js';

const WEATHER =
  'https://api.open-meteo.com/v1/forecast?latitude=42.36&longitude=-71.06&hourly=temperature_2m,weather_code,is_day,cloud_cover&temperature_unit=fahrenheit&timezone=America%2FNew_York';

// Open-Meteo serves about 92 days back and 16 ahead; outside that it answers with an error and no hours.
export function weatherUrl(date) {
  const { dateKey } = brianClock(date);
  return `${WEATHER}&start_date=${dateKey}&end_date=${dateKey}`;
}

// WMO weather codes, grouped: [codes, words, day icon, night icon if it differs].
const GROUPS = [
  [[0], 'clear', 'sun', 'moon'],
  [[1, 2], 'partly cloudy', 'cloud-sun', 'cloud-moon'],
  [[3], 'cloudy', 'cloud'],
  [[45, 48], 'foggy', 'cloud-fog'],
  [[51, 53, 55, 56, 57], 'drizzling', 'cloud-drizzle'],
  [[61, 63, 80, 81], 'raining', 'cloud-rain'],
  [[65, 82], 'pouring', 'cloud-showers-heavy'],
  [[66, 67], 'sleeting', 'cloud-sleet'],
  [[71, 73, 75, 77, 85, 86], 'snowing', 'cloud-snow'],
  [[95, 96, 99], 'storming', 'cloud-bolt'],
];
const groupOf = code => GROUPS.find(([codes]) => codes.includes(code)) ?? GROUPS[2];

export const weatherIcon = (code, isDay) => {
  const [, , day, night = day] = groupOf(code);
  return isDay ? day : night;
};
export const weatherWords = code => groupOf(code)[1];

export function weatherAt(hourly, date) {
  const { dateKey, hour } = brianClock(date);
  const index = hourly?.time.indexOf(`${dateKey}T${String(hour).padStart(2, '0')}:00`) ?? -1;
  if (index < 0) return null;
  return {
    temp: Math.round(hourly.temperature_2m[index]),
    code: hourly.weather_code[index],
    isDay: hourly.is_day[index] === 1,
    cover: hourly.cloud_cover?.[index] ?? 0,
  };
}

// Shapes fill in up to half cover; past that, a flat veil closes over the sky. Both fade over the sun's last 2° and are
// gone by the horizon, before the header ink turns off-white for twilight.
export function cloudsFor(cover, elevation) {
  const amount = (cover ?? 0) / 50;
  const light = clamp(elevation / 2, 0, 1);
  return { clouds: round(clamp(amount, 0, 1) * 0.5 * light), veil: round(clamp(amount - 1, 0, 1) * 0.6 * light) };
}
