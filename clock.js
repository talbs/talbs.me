import { HORIZON, moonPhase, moonTip, nextSunEvent } from './sky.js';

const TIME_ZONE = 'America/New_York';
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const etFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  weekday: 'short',
  hour: 'numeric',
  minute: 'numeric',
  hourCycle: 'h23',
});

export function brianClock(date) {
  const parts = Object.fromEntries(etFormat.formatToParts(date).map(({ type, value }) => [type, value]));
  const year = Number(parts.year);
  const month = Number(parts.month);
  const dayOfMonth = Number(parts.day);
  const pad = n => String(n).padStart(2, '0');
  return {
    year,
    month,
    dayOfMonth,
    day: parts.weekday,
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    dateKey: `${year}-${pad(month)}-${pad(dayOfMonth)}`,
  };
}

export function zonedDate({ year, month, dayOfMonth, hour, minute }) {
  const wanted = Date.UTC(year, month - 1, dayOfMonth, hour, minute);
  let ts = wanted;
  for (let i = 0; i < 2; i++) {
    const c = brianClock(new Date(ts));
    ts += wanted - Date.UTC(c.year, c.month - 1, c.dayOfMonth, c.hour, c.minute);
  }
  return new Date(ts);
}

const toInt = (value, min, max) => {
  const n = Number.parseInt(value, 10);
  return Number.isNaN(n) ? null : Math.min(max, Math.max(min, n));
};

export function previewDate(now, params) {
  const at = params.get('at')?.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (at) {
    const [year, month, dayOfMonth, hour, minute] = at.slice(1).map(Number);
    return zonedDate({ year, month, dayOfMonth, hour, minute });
  }
  let { year, month, dayOfMonth, hour, minute } = brianClock(now);
  const fakeMonth = toInt(params.get('month'), 1, 12);
  const fakeHour = toInt(params.get('hour'), 0, 23);
  if (fakeMonth !== null) {
    month = fakeMonth;
    dayOfMonth = Math.min(dayOfMonth, 28);
  }
  if (fakeHour !== null) {
    hour = fakeHour;
    minute = 0;
  }
  const wantDay = DAYS.indexOf(params.get('day'));
  if (wantDay >= 0) {
    const haveDay = DAYS.indexOf(brianClock(zonedDate({ year, month, dayOfMonth, hour, minute })).day);
    dayOfMonth += (wantDay - haveDay + 7) % 7;
    if (brianClock(zonedDate({ year, month, dayOfMonth, hour, minute })).month !== month) dayOfMonth -= 7;
  }
  return zonedDate({ year, month, dayOfMonth, hour, minute });
}

export function sunOverride(params) {
  if (!params.has('sun')) return null;
  const n = Number(params.get('sun'));
  return Number.isFinite(n) ? n : null;
}

export const capitalize = text => text.replace(/^./, letter => letter.toUpperCase());

const shortTimeFormat = new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, hour: 'numeric', minute: '2-digit' });
// Some ICU builds (Safari) put a narrow no-break space before am/pm.
export const shortTime = date => shortTimeFormat.format(date).replace(/\s/gu, '').toLowerCase();

// Fragments that follow "<weather> in Boston: …", or stand alone capitalized when there's no forecast.
const TIME_TIPS = [
  [0, 'it’s wicked late heah.'],
  [5, 'Dunks is already open.'],
  [7, 'iced coffee is a year-round thing here.'],
  [10, 'the T is running late. Again.'],
  [12, 'a frappe is a milkshake.'],
  [14, 'Storrow just ate another truck.'],
  [17, '93 is a pahkin’ lot.'],
  [19, 'the Sox are on somewhere.'],
  [22, 'it’s getting wicked late.'],
];

export const timeTip = hour => TIME_TIPS.findLast(([from]) => hour >= from)[1];

const SUN_TIPS = { sunset: 'Sunset: gonna be a beauty.', sunrise: 'Sunrise: coffee first.' };

export function contextFor(pick, date, elevation) {
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
  return { icon: next.kind, label: capitalize(next.kind), text: shortTime(next.at), tip: SUN_TIPS[next.kind] };
}
