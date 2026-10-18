import { brianClock, zonedDate, shortTime, capitalize } from './clock.js';
import { sunElevation, HORIZON, moonPhase, moonTip, nextSunEvent } from './sky.js';
import { hash } from './schedule.js';

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

const ALARM = 6 * 60 + 30;
const stopsByDay = new Map();

export function stopsOn(date) {
  const { dateKey } = brianClock(date);
  if (!stopsByDay.has(dateKey)) stopsByDay.set(dateKey, dayStops(date));
  return stopsByDay.get(dateKey);
}

// Only what the page can vouch for: a one-minute change is the only one worth saying, and a clock change isn't one.
export function sunTips(kind, date, cover) {
  const clock = brianClock(date);
  const today = stopsOn(date)[kind];
  const delta = today - stopsOn(zonedDate({ ...clock, dayOfMonth: clock.dayOfMonth - 1, hour: 12, minute: 0 }))[kind];
  const civil = nextSunEvent(dateAtMinute(date, kind === 'sunrise' ? 0 : 720), -6).at;
  const tips =
    kind === 'sunrise'
      ? [today <= ALARM ? 'before the alarm.' : 'after the alarm.', `light by ${shortTime(civil)}.`]
      : [cover >= 50 ? 'clouds not permitting.' : 'clouds permitting.', `dark by ${shortTime(civil)}.`];
  if (Math.abs(delta) === 1) tips.push(`a minute ${delta < 0 ? 'earlier' : 'later'} than yesterday.`);
  return tips;
}

export function contextFor(pick, date, elevation, coverAt) {
  if (pick.with) {
    const { label, ...chip } = pick.with;
    return { ...chip, text: label, tip: `Open ${label}` };
  }
  const next = nextSunEvent(date);
  const minutes = next ? Math.round((next.at - date) / 60000) : Infinity;
  if (elevation < HORIZON && !(next?.kind === 'sunrise' && minutes <= 180)) {
    const moon = moonPhase(date);
    return { icon: 'moon', text: `${moon.lit}% ${moon.phase}`, tip: moonTip(date) };
  }
  if (!next) return { icon: '', text: '' };
  const tips = sunTips(next.kind, next.at, coverAt?.(next.at));
  const tip = tips[hash(`${brianClock(next.at).dateKey}:${next.kind}`) % tips.length];
  return {
    icon: next.kind,
    label: capitalize(next.kind),
    text: shortTime(next.at),
    tip: `${capitalize(next.kind)}: ${tip}`,
  };
}
