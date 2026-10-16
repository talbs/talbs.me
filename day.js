import { brianClock, zonedDate } from './clock.js';
import { sunElevation, HORIZON } from './sky.js';

export const minuteOf = date => {
  const { hour, minute } = brianClock(date);
  return hour * 60 + minute;
};

export function dateAtMinute(date, minutes) {
  const { year, month, dayOfMonth } = brianClock(date);
  return zonedDate({ year, month, dayOfMonth, hour: Math.floor(minutes / 60), minute: minutes % 60 });
}

export function dayStops(date) {
  const midnight = dateAtMinute(date, 0).getTime();
  const at = minutes => new Date(midnight + minutes * 60000);
  let sunrise = null;
  let sunset = null;
  let noon = 0;
  let high = -Infinity;
  let before = sunElevation(at(0));
  for (let minutes = 1; minutes < 1440; minutes++) {
    const elevation = sunElevation(at(minutes));
    if (before < HORIZON && elevation >= HORIZON) sunrise = minutes;
    if (before >= HORIZON && elevation < HORIZON) sunset = minutes;
    if (elevation > high) [high, noon] = [elevation, minutes];
    before = elevation;
  }
  // Counted in real minutes from midnight; read back as clock minutes, which differ on daylight-saving days.
  const clockMinute = minutes => (minutes === null ? null : minuteOf(at(minutes)));
  return { sunrise: clockMinute(sunrise), noon: clockMinute(noon), sunset: clockMinute(sunset) };
}

export function nearestStop(minutes, stops, within) {
  const closest = stops.reduce((best, stop) => (Math.abs(stop - minutes) < Math.abs(best - minutes) ? stop : best));
  return Math.abs(closest - minutes) <= within ? closest : null;
}
