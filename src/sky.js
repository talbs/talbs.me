const BOSTON = { lat: 42.36, lon: -71.06 };
const RAD = Math.PI / 180;

const clamp = (n, low, high) => Math.min(high, Math.max(low, n));

// NOAA solar position approximation, geometric (no refraction). Azimuth is degrees clockwise from north.
export function sunPosition(date, { lat, lon } = BOSTON) {
  const jd = date.getTime() / 86400000 + 2440587.5;
  const t = (jd - 2451545) / 36525;
  const l0 = (280.46646 + t * (36000.76983 + t * 0.0003032)) % 360;
  const m = 357.52911 + t * (35999.05029 - 0.0001537 * t);
  const e = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);
  const center =
    Math.sin(m * RAD) * (1.914602 - t * (0.004817 + 0.000014 * t)) +
    Math.sin(2 * m * RAD) * (0.019993 - 0.000101 * t) +
    Math.sin(3 * m * RAD) * 0.000289;
  const omega = 125.04 - 1934.136 * t;
  const lambda = l0 + center - 0.00569 - 0.00478 * Math.sin(omega * RAD);
  const eps0 = 23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60;
  const eps = eps0 + 0.00256 * Math.cos(omega * RAD);
  const decl = Math.asin(Math.sin(eps * RAD) * Math.sin(lambda * RAD));
  const y = Math.tan((eps * RAD) / 2) ** 2;
  const eqTime =
    (4 / RAD) *
    (y * Math.sin(2 * l0 * RAD) -
      2 * e * Math.sin(m * RAD) +
      4 * e * y * Math.sin(m * RAD) * Math.cos(2 * l0 * RAD) -
      0.5 * y * y * Math.sin(4 * l0 * RAD) -
      1.25 * e * e * Math.sin(2 * m * RAD));
  const utcMinutes = (((date.getTime() % 86400000) + 86400000) % 86400000) / 60000;
  const hourAngle = (((((utcMinutes + eqTime + 4 * lon) / 4 - 180) % 360) + 540) % 360) - 180;
  const cosZenith =
    Math.sin(lat * RAD) * Math.sin(decl) + Math.cos(lat * RAD) * Math.cos(decl) * Math.cos(hourAngle * RAD);
  const zenith = Math.acos(clamp(cosZenith, -1, 1));
  const fromNorth =
    Math.acos(
      clamp((Math.sin(decl) - Math.sin(lat * RAD) * cosZenith) / (Math.cos(lat * RAD) * Math.sin(zenith)), -1, 1)
    ) / RAD;
  return { elevation: 90 - zenith / RAD, azimuth: hourAngle > 0 ? 360 - fromNorth : fromNorth };
}

export const sunElevation = (date, place) => sunPosition(date, place).elevation;

export const OFF_WHITE = '#fafbfd';
export const OFF_BLACK = '#0f1115';
export const CARD = '#272d34';

// Base and step-70 values from the Look Bright palette.
export const NAMED = {
  red: { base: '#e94556', 70: '#ff8e90' },
  orange: { base: '#ff6e29', 70: '#ff9164' },
  gold: { base: '#ffb646', 70: '#e2a241' },
  mint: { base: '#19fbc3', 70: '#00c698' },
  teal: { base: '#05d0a4', 70: '#2dc49d' },
  sky: { base: '#1baeee', 70: '#48b9f3' },
  navy: { base: '#063565', 70: '#87b2e5' },
  indigo: { base: '#3b35cd', 70: '#98aaff' },
  purple: { base: '#3c04d4', 70: '#9ca9ff' },
  violet: { base: '#7261f4', 70: '#a6a6ff' },
  lilac: { base: '#e986fe', 70: '#e58df8' },
  magenta: { base: '#f912cb', 70: '#ff83db' },
};

const NIGHT = { at: -18, top: '#0a0630', bottom: '#3c04d4' };
const DAY = { at: 30, top: '#0479ff', bottom: '#1baeee' };

export const SKY = {
  morning: [
    NIGHT,
    { at: -15, top: '#0b1a5c', bottom: '#7261f4' },
    { at: -7.5, top: '#1d3fc4', bottom: '#e94556' },
    { at: -1.5, top: '#e94556', bottom: '#f17025' },
    { at: 3, top: '#ff6e29', bottom: '#ffb646' },
    { at: 13, top: '#05d0a4', bottom: '#009dfe', isLongWay: true },
    DAY,
  ],
  evening: [
    NIGHT,
    { at: -15, top: '#2a0f8a', bottom: '#6817d4' },
    { at: -7.5, top: '#462dc7', bottom: '#e986fe' },
    { at: -1.5, top: '#4f4aa8', bottom: '#ff6e29' },
    { at: 3, top: '#7593ef', bottom: '#ffb646' },
    // A warm haze at the horizon carries blue to gold without passing through magenta.
    { at: 8, top: '#6fa6f7', bottom: '#ffc49c' },
    { at: 13, top: '#0479ff', bottom: '#7fc0f2' },
    DAY,
  ],
};

const lin = c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const gam = c => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

const channels = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
const linear = hex => channels(hex).map(c => lin(c / 255));
const toHex = rgb =>
  `#${rgb
    .map(c =>
      Math.round(clamp(c, 0, 255))
        .toString(16)
        .padStart(2, '0')
    )
    .join('')}`;

function toOklab(hex) {
  const [r, g, b] = linear(hex);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function fromOklab([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const rgb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return toHex(rgb.map(c => gam(c) * 255));
}

export function overlay(base, top, alpha) {
  const under = channels(base);
  const over = channels(top);
  return toHex(under.map((c, i) => c + (over[i] - c) * alpha));
}

export function oklch(hex) {
  const [L, a, b] = toOklab(hex);
  return [L, Math.hypot(a, b), (Math.atan2(b, a) / RAD + 360) % 360];
}

// Blending around the hue wheel keeps chroma up; a straight oklab blend between gold and blue passes through gray.
function mixOklch(from, to, amount, isLongWay = false) {
  const [l1, c1, h1] = oklch(from);
  const [l2, c2, h2] = oklch(to);
  const short = ((h2 - h1 + 540) % 360) - 180;
  const turn = isLongWay ? short - Math.sign(short) * 360 : short;
  const L = l1 + (l2 - l1) * amount;
  const C = c1 + (c2 - c1) * amount;
  return fromOklch(L, C, h1 + turn * amount);
}

export function mixOklab(from, to, amount) {
  const a = toOklab(from);
  const b = toOklab(to);
  return fromOklab(a.map((v, i) => v + (b[i] - v) * amount));
}

const hueOf = hex => oklch(hex)[2];
const hueGap = (x, y) => Math.min(Math.abs(x - y), 360 - Math.abs(x - y));

const NAMED_HUES = Object.values(NAMED).map(color => ({ hue: hueOf(color.base), key: color[70] }));

export function skyKey(hex, avoid) {
  const hue = hueOf(hex);
  return NAMED_HUES.filter(named => named.key !== avoid).reduce((best, named) =>
    hueGap(named.hue, hue) < hueGap(best.hue, hue) ? named : best
  ).key;
}

const isWarm = hue => hue >= 20 && hue <= 110;
const fromOklch = (L, C, hue) => fromOklab([L, C * Math.cos(hue * RAD), C * Math.sin(hue * RAD)]);

// Dark orange reads as brown, so the card borrows only a cool hue from the sky and keeps its own lightness.
function surfaceHue(top, bottom) {
  const [, , topHue] = oklch(top);
  if (!isWarm(topHue)) return topHue;
  const [, , bottomHue] = oklch(bottom);
  return isWarm(bottomHue) ? 285 : bottomHue;
}

// Mirrors the sky's --sun-spot: the bottom color lifted, warming toward amber as the sun drops.
export function sunSpot(bottom, sunLow) {
  const [L, C, h] = oklch(bottom);
  return mixOklch(fromOklch(L + 0.12, C, h), '#ffb646', sunLow * 0.45);
}

// Where the header text and the slider sit down the sky's gradient. The sky's box overhangs the viewport by 15%, so the
// screen runs from 11.5% to 88.5%.
export const HEADER_SPOTS = [0.07, 0.11, 0.15, 0.19, 0.23, 0.27, 0.31, 0.34];
export const DIAL_SPOTS = [0.76, 0.8, 0.84, 0.88, 0.92];

// The sun glow may or may not sit behind an element, depending on the screen's shape, so both cases count. Picks the ink
// that needs the lighter wash of its opposite to hold the ratio, and that wash; past maxWash, the ink that reads best.
function inkFor(sky, detail, spots, ratio, maxWash) {
  const plain = spots.map(at => mixOklab(sky.top, sky.bottom, at));
  const spot = sunSpot(sky.bottom, detail.sunLow);
  const behind = [...plain, ...plain.map(color => overlay(color, spot, detail.sunStrength))];
  const inks = isDark => (isDark ? [OFF_BLACK, OFF_WHITE] : [OFF_WHITE, OFF_BLACK]);
  const washFor = isDark => {
    const [ink, opposite] = inks(isDark);
    for (let wash = 0; wash <= maxWash + 1e-9; wash = Math.round((wash + 0.05) * 100) / 100) {
      if (behind.every(color => contrast(ink, overlay(color, opposite, wash)) >= ratio)) return wash;
    }
    return Infinity;
  };
  const [dark, light] = [washFor(true), washFor(false)];
  if (dark === Infinity && light === Infinity) {
    const worst = isDark => Math.min(...behind.map(color => contrast(inks(isDark)[0], color)));
    return { isDark: worst(true) >= worst(false), wash: maxWash };
  }
  return dark <= light ? { isDark: true, wash: dark } : { isDark: false, wash: light };
}

// 4.6, not 4.5: anti-aliasing and gradient banding cost the rendered text a few hundredths.
export const headerInk = (sky, detail) => inkFor(sky, detail, HEADER_SPOTS, 4.6, 0.3);
export const isDarkDial = (sky, detail) => inkFor(sky, detail, DIAL_SPOTS, 3, 0).isDark;

export function skyAt(elevation, isRising) {
  const anchors = SKY[isRising ? 'morning' : 'evening'];
  const upper = anchors.find(anchor => anchor.at >= elevation) ?? anchors.at(-1);
  const lower = anchors.findLast(anchor => anchor.at <= elevation) ?? anchors[0];
  const amount = upper === lower ? 0 : (elevation - lower.at) / (upper.at - lower.at);
  const top = mixOklch(lower.top, upper.top, amount, upper.isLongWay);
  const bottom = mixOklch(lower.bottom, upper.bottom, amount, upper.isLongWay);
  const hue = surfaceHue(top, bottom);
  const key = skyKey(bottom);
  return {
    top,
    bottom,
    key,
    // The top key steps to its next-nearest named color when the bottom already took the nearest one.
    keyTop: skyKey(top, key),
    surface: fromOklch(0.3, 0.035, hue),
    surfaceDeep: fromOklch(0.255, 0.03, hue),
  };
}

// Facing south: east is the left edge, west the right; Boston's highest sun (~72°) sits near the top.
export function skyDetail(elevation, azimuth) {
  return {
    sunX: clamp(0.5 + (azimuth - 180) / 240, 0, 1) * 100,
    sunY: 100 - clamp(elevation / 72, 0, 1) * 85,
    sunStrength: clamp((elevation + 6) / 12, 0, 1),
    sunLow: clamp(1 - elevation / 20, 0, 1),
    stars: clamp((-6 - elevation) / 12, 0, 1),
  };
}

export const isRising = date => sunElevation(new Date(date.getTime() + 600000)) > sunElevation(date);

export const HORIZON = -0.833;

export function nextSunEvent(date) {
  let before = sunElevation(date);
  for (let minute = 1; minute <= 1440; minute++) {
    const at = new Date(date.getTime() + minute * 60000);
    const after = sunElevation(at);
    if (before < HORIZON !== after < HORIZON) return { kind: after > before ? 'sunrise' : 'sunset', at };
    before = after;
  }
  return null;
}

const SYNODIC_DAYS = 29.530588853;
const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);

const MOON_NAMES = [
  'New moon',
  'Waxing crescent',
  'First quarter',
  'Waxing gibbous',
  'Full moon',
  'Waning gibbous',
  'Last quarter',
  'Waning crescent',
];

const moonAge = date => {
  const days = (date.getTime() - KNOWN_NEW_MOON) / 86400000;
  return ((days % SYNODIC_DAYS) + SYNODIC_DAYS) % SYNODIC_DAYS;
};

export function moonTip(date) {
  const age = moonAge(date);
  const name = MOON_NAMES[Math.round((age / SYNODIC_DAYS) * 8) % 8];
  const isNextFull = name === 'New moon' || (age < SYNODIC_DAYS / 2 && name !== 'Full moon');
  const target = isNextFull ? SYNODIC_DAYS / 2 : SYNODIC_DAYS;
  const days = Math.round((((target - age) % SYNODIC_DAYS) + SYNODIC_DAYS) % SYNODIC_DAYS);
  return `${name}. ${isNextFull ? 'Full' : 'New'} moon in ${days} days.`;
}

export function moonPhase(date) {
  const age = moonAge(date);
  return {
    phase: age < SYNODIC_DAYS / 2 ? 'waxing' : 'waning',
    lit: Math.round(((1 - Math.cos((2 * Math.PI * age) / SYNODIC_DAYS)) / 2) * 100),
  };
}

const luminance = hex => {
  const [r, g, b] = linear(hex);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// Everything the page paints for a moment, so the page and the build (for the 404's no-JS sky) agree.
export function skyVars(date, pinnedElevation) {
  const sun = sunPosition(date);
  const elevation = pinnedElevation ?? sun.elevation;
  const sky = skyAt(elevation, isRising(date));
  const detail = skyDetail(elevation, sun.azimuth);
  const ink = headerInk(sky, detail);
  const vars = {
    '--sky-top': sky.top,
    '--sky-bottom': sky.bottom,
    '--key': sky.key,
    '--key-top': sky.keyTop,
    '--surface': sky.surface,
    '--surface-deep': sky.surfaceDeep,
    '--sun-x': detail.sunX,
    '--sun-y': detail.sunY,
    '--sun-strength': detail.sunStrength,
    '--sun-low': detail.sunLow,
    '--stars': detail.stars,
    '--header-wash': ink.wash,
    '--header-ink': ink.isDark ? OFF_BLACK : OFF_WHITE,
    '--wash-ink': ink.isDark ? OFF_WHITE : OFF_BLACK,
    '--dial-ink': isDarkDial(sky, detail) ? OFF_BLACK : OFF_WHITE,
  };
  return { elevation, vars };
}
