import { brianClock, previewDate, sunOverride, contextFor, shortTime, timeTip, capitalize } from './clock.js';
import { pickLine, firstPick } from './schedule.js';
import { skyVars, CARD } from './sky.js';
import { pools, errors, lost } from './statuses.js';
import { musicCell, previewTrack, recentTracks, FETCH_TIMEOUT, RESTING, TEN_MINUTES } from './music.js';
import { weatherUrl, weatherAt, weatherIcon, weatherWords } from './weather.js';
import { minuteOf, dateAtMinute, dayStops, nearestStop } from './day.js';

const LASTFM =
  'https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=B-Tal&limit=1&format=json&api_key=727679ecf88465a0ca161d4d8c5efabf';
const DANCE_LINE = '…I’m just dancing on my own.';
const PEEK_LINES = [
  'Nice try. No spoilers.',
  'Great Scott! The future isn’t written yet.',
  'Future Brian says hi. That’s all you get.',
];
// Through a variable so esbuild leaves the import for runtime instead of inlining enhance.js into the page.
const ENHANCE = './enhance.js';
// The Web Animations API can't read var(), so these mirror --ease-in and --ease-out.
const EASE_IN = 'cubic-bezier(0.4, 0, 1, 1)';
const EASE_OUT = 'cubic-bezier(0.2, 0.8, 0.2, 1)';
const params = new URLSearchParams(location.search);
const isFaked = ['at', 'hour', 'day', 'month'].some(key => params.has(key));
const tally = (name, data) => window.umami?.track(name, data);
const failedSources = new Set();
// Once per source per visit: Last.fm is polled every two minutes, and one long visit shouldn't flood the numbers.
function tallyFailure(source, error) {
  if (failedSources.has(source)) return;
  failedSources.add(source);
  tally('Fetch failed', { source, reason: error?.name ?? 'Error' });
}
// Umami checks this key before every send, so ?stats=off keeps Brian's own visits out of the numbers.
const stats = params.get('stats');
try {
  if (stats === 'off') localStorage.setItem('umami.disabled', '1');
  if (stats === 'on') localStorage.removeItem('umami.disabled');
} catch {}
const pinnedSun = sunOverride(params);
const loadedAt = Date.now();
const fakedStart = previewDate(new Date(), params);
// IS_LOST is set per page by tools/build.js: true only on the 404.
const lostAt = IS_LOST && dateAtMinute(new Date(), 244);
const lostPick = {
  text: lost[Math.floor(Math.random() * lost.length)],
  skin: 'eyes',
  state: 'error',
  context: { icon: 'ghost', text: location.pathname, tip: 'Not here at 4:04 either.' },
  music: {
    icon: 'music',
    text: 'Missing',
    url: 'https://www.last.fm/music/Everything+But+the+Girl/_/Missing',
    tip: 'Everything but the Girl, on repeat at 4:04.',
  },
  timeTip: 'nobody’s up but us.',
};
const now = () => lostAt || (isFaked ? new Date(fakedStart.getTime() + Date.now() - loadedAt) : new Date());
const isCalm = matchMedia('(prefers-reduced-motion: reduce)');

const root = document.documentElement;
const tell = document.getElementById('tell');
const line = document.getElementById('line');
const favicon = document.getElementById('favicon');
const tray = document.getElementById('tray');
const summary = tray.querySelector('summary');
const nav = tray.querySelector('nav');
const scroller = document.getElementById('scroller');
const highlight = document.getElementById('highlight');
const meta = document.getElementById('meta');
const main = document.querySelector('main');
const card = tray.closest('.card');
const FOLD_BELOW = 320;
const rows = [...nav.querySelectorAll('a')];
const day = document.getElementById('day');
const scrubber = document.getElementById('scrubber');
let currentPick = null;
let activeIndex = 0;
let swapId = 0;
let isDancing = false;
let faviconKey = '';
let closeTimer = 0;
let isScrubbing = false;
let hourly;
let weatherDay = '';
let weatherFetchedAt = 0;
let isScrubberSet = false;
let peekLine = '';
let track;
let shownAt = new Date();
let lineAnimations = [];
let pastTimer = 0;
const pastTracks = new Map();

function makeIcon(name, family = 'sharp-duotone', label = '') {
  const icon = document.createElement('wa-icon');
  if (name.endsWith('.svg')) {
    icon.setAttribute('src', name);
    return icon;
  }
  icon.setAttribute('name', name);
  icon.setAttribute('family', family);
  if (family !== 'brands') icon.setAttribute('variant', 'solid');
  if (label) icon.setAttribute('label', label);
  return icon;
}

function setCell(
  cell,
  {
    icon = '',
    family,
    label: iconLabel = '',
    text = '',
    url = '',
    datetime = '',
    tip = '',
    isLive = false,
    isQuiet = false,
  }
) {
  cell.hidden = !text;
  if (!text) return;
  cell.classList.toggle('is-live', isLive);
  cell.classList.toggle('is-quiet', isQuiet);
  const shape = [icon, iconLabel, url, Boolean(datetime), Boolean(tip)].join('|');
  if (cell.dataset.shape !== shape) {
    cell.dataset.shape = shape;
    cell.replaceChildren();
    // The tooltip points at this wrapper, which hugs the icon and text rather than the whole cell.
    const wrap = document.createElement('span');
    wrap.id = `${cell.id}-body`;
    wrap.className = 'cell-body wa-cluster wa-flex-nowrap wa-gap-s';
    if (tip) {
      const tooltip = document.createElement('wa-tooltip');
      tooltip.setAttribute('for', wrap.id);
      cell.append(tooltip);
    }
    if (icon) wrap.append(makeIcon(icon, family, iconLabel));
    const label = document.createElement(url ? 'a' : 'span');
    label.id = `${cell.id}-text`;
    if (url) {
      label.href = url;
      label.className = 'appearance-plain';
    } else if (tip) {
      label.tabIndex = 0;
    }
    if (cell.classList.contains('cell-cut')) label.classList.add('wa-text-truncate');
    if (datetime) label.append(document.createElement('time'));
    wrap.append(label);
    cell.append(wrap);
  }
  const body = cell.querySelector('time') ?? cell.querySelector(`#${cell.id}-text`);
  if (datetime) body.dateTime = datetime;
  if (body.textContent !== text) body.textContent = text;
  const tooltip = cell.querySelector('wa-tooltip');
  if (tooltip && tooltip.textContent !== tip) tooltip.textContent = tip;
}

const wantedLine = () => (isDancing ? DANCE_LINE : peekLine || currentPick.text);

function animateLine(keyframes, options) {
  const animation = line.animate(keyframes, options);
  lineAnimations.push(animation);
  return animation;
}
function placeLine() {
  lineAnimations.forEach(animation => animation.cancel());
  lineAnimations = [];
  line.textContent = wantedLine();
}

async function swapLine() {
  const id = ++swapId;
  if (!isCalm.matches) {
    const leave = animateLine(
      [
        { opacity: 1, translate: '0 0' },
        { opacity: 0, translate: '0 -0.35em' },
      ],
      { duration: 100, easing: EASE_IN, fill: 'forwards' }
    );
    await leave.finished.catch(() => {});
    if (id !== swapId) return;
  }
  placeLine();
  const enter = isCalm.matches
    ? [{ opacity: 0 }, { opacity: 1 }]
    : [
        { opacity: 0, translate: '0 0.5em' },
        { opacity: 1, translate: '0 0' },
      ];
  animateLine(enter, { duration: 200, easing: EASE_OUT });
}

function setLine(isInstant) {
  const isMoving = lineAnimations.some(animation => animation.playState === 'running');
  if (line.textContent === wantedLine() && !isMoving) return;
  if (!isInstant) return swapLine();
  ++swapId;
  placeLine();
}

function moveHighlight(index, isKeyed = false) {
  activeIndex = (index + rows.length) % rows.length;
  highlight.classList.toggle('is-keyed', isKeyed);
  const item = rows[activeIndex].parentElement;
  highlight.style.translate = `0 ${item.offsetTop}px`;
  highlight.style.blockSize = `${item.offsetHeight}px`;
  rows.forEach((row, i) => row.parentElement.classList.toggle('is-active', i === activeIndex));
}

const isOpen = () => tray.open && !tray.classList.contains('is-closing');

// WebKit drops the content before a native close can animate, so closing runs the collapse first.
function setOpen(isOpening) {
  clearTimeout(closeTimer);
  if (isOpening) {
    tray.classList.remove('is-closing');
    tray.open = true;
    return;
  }
  if (!isOpen()) return;
  if (nav.contains(document.activeElement)) summary.focus();
  if (isCalm.matches) {
    tray.open = false;
    return;
  }
  tray.classList.add('is-closing');
  closeTimer = setTimeout(() => {
    tray.classList.remove('is-closing');
    tray.open = false;
  }, 200);
}

function loadTrayIcons() {
  for (const square of nav.querySelectorAll('.ic[data-icon]:empty')) {
    square.append(makeIcon(square.dataset.icon, square.dataset.family));
  }
}

function paintSky(date) {
  const { elevation, vars } = skyVars(date, pinnedSun ?? undefined);
  for (const [name, value] of Object.entries(vars)) {
    const text = String(value);
    if (root.style.getPropertyValue(name) !== text) root.style.setProperty(name, text);
  }
  root.classList.toggle('has-stars', vars['--stars'] > 0);
  return elevation;
}

function showStatus(date, elevation, isInstant) {
  const pick = IS_LOST ? lostPick : (currentPick ? pickLine : firstPick)(brianClock(date), pools, errors);
  currentPick = pick;
  setLine(isInstant);
  document.title = `${pick.text} · Brian Talbot`;
  // Attributes, not properties: the custom elements may not be upgraded yet.
  tell.setAttribute('skin', pick.skin);
  tell.setAttribute('state', peekLine ? 'error' : pick.state);
  const time = shortTime(date);
  const tip = IS_LOST ? lostPick.timeTip : timeTip(brianClock(date).hour);
  const weather = weatherAt(hourly, date);
  // '--°' holds the temperature's width until the forecast lands; a day with no forecast falls back to the city.
  setCell(document.getElementById('time'), {
    icon: weather ? weatherIcon(weather.code, weather.isDay) : 'clock',
    label: weather ? weatherWords(weather.code) : '',
    text: weather ? `${time} · ${weather.temp}°` : hourly === undefined ? `${time} · --°` : `${time} Boston`,
    url: 'https://time.is/Boston',
    datetime: date.toISOString(),
    tip: weather ? `${capitalize(weatherWords(weather.code))} in Boston: ${tip}` : capitalize(tip),
  });
  setCell(document.getElementById('context'), pick.context ?? contextFor(pick, date, elevation));
}

function paintFavicon() {
  const source = tell.shadowRoot?.querySelector('canvas');
  const key = [tell.getAttribute('skin'), tell.getAttribute('state')].join('|');
  if (!source?.width || key === faviconKey) return;
  faviconKey = key;
  const icon = document.createElement('canvas');
  icon.width = icon.height = 64;
  const context = icon.getContext('2d');
  context.fillStyle = CARD;
  context.beginPath();
  context.roundRect(0, 0, 64, 64, 14);
  context.fill();
  context.drawImage(source, 8, 8, 48, 48);
  favicon.href = icon.toDataURL('image/png');
}

async function checkWeather() {
  const { dateKey } = brianClock(now());
  if (dateKey === weatherDay && Date.now() - weatherFetchedAt < 1800000) return;
  if (dateKey !== weatherDay) hourly = undefined;
  weatherDay = dateKey;
  weatherFetchedAt = Date.now();
  try {
    const response = await fetch(weatherUrl(now()), { signal: AbortSignal.timeout(FETCH_TIMEOUT) });
    hourly = (await response.json()).hourly;
    if (!hourly) throw new TypeError('no hourly forecast');
  } catch (error) {
    hourly = null;
    tallyFailure('weather', error);
  }
  update();
}

// The last scrobble before a past moment, cached per ten-minute slot so scrubbing back and forth asks once.
function trackBefore(date) {
  const slot = Math.floor(date / TEN_MINUTES);
  if (!pastTracks.has(slot)) {
    const answer = recentTracks(`${LASTFM}&to=${Math.floor(date / 1000)}`)
      .then(tracks => tracks.find(item => !item['@attr']?.nowplaying) ?? null)
      .catch(error => {
        tallyFailure('lastfm', error);
        pastTracks.delete(slot);
        return undefined;
      });
    pastTracks.set(slot, answer);
  }
  return pastTracks.get(slot);
}

// More than ten minutes from the real time counts as a past moment; the ?music= preview always counts as now.
function showMusic(date) {
  if (IS_LOST) return setCell(document.getElementById('music'), lostPick.music);
  if (track === undefined) return;
  const music = document.getElementById('music');
  clearTimeout(pastTimer);
  if (IS_LOST || params.has('music') || Math.abs(date - Date.now()) <= TEN_MINUTES) {
    setCell(music, musicCell(track, params.has('music') ? now() : Date.now()));
    return;
  }
  music.classList.add('is-quiet');
  pastTimer = setTimeout(async () => {
    const then = await trackBefore(date);
    if (shownAt !== date) return;
    // Without the past lookup, only a live track can be described from here, and only as live now, not then.
    const fallback = musicCell(track, Date.now(), track?.['@attr']?.nowplaying === 'true');
    setCell(music, then === undefined ? fallback : musicCell(then, date.getTime(), true));
  }, 250);
}

async function checkMusic() {
  if (document.hidden) return;
  try {
    track = params.has('music') ? (previewTrack(params.get('music'), now()) ?? null) : (await recentTracks(LASTFM))[0];
  } catch (error) {
    track = null;
    tallyFailure('lastfm', error);
  }
  showMusic(shownAt);
}

function render(date, isInstant) {
  shownAt = date;
  showStatus(date, paintSky(date), isInstant);
  showMusic(date);
  if (document.hidden) paintFavicon();
  else requestAnimationFrame(paintFavicon);
}

function update(isInstant = false) {
  if (isScrubbing) return;
  render(now(), isInstant);
  if (isScrubberSet) scrubber.value = nowValue();
}

const nowValue = () => Math.min(scrubber.max, Math.floor(minuteOf(now()) / 10) * 10);

function setUpScrubber() {
  const scrubTip = day.querySelector('wa-tooltip');
  const placeThumbAnchor = () => day.style.setProperty('--at', scrubber.value / scrubber.max);
  let isDragging = false;
  let isKeying = false;
  scrubber.addEventListener('pointerenter', () => {
    placeThumbAnchor();
    scrubTip.open = !isDragging;
  });
  scrubber.addEventListener('pointerleave', () => (scrubTip.open = false));
  scrubber.valueFormatter = minutes => `${shortTime(dateAtMinute(now(), minutes))}, ${wantedLine()}`;
  scrubber.value = nowValue();
  isScrubberSet = true;

  let stops = [];
  let stopsDay = 0;
  const stopsToday = () => {
    const { dayOfMonth } = brianClock(now());
    if (dayOfMonth !== stopsDay) {
      stopsDay = dayOfMonth;
      stops = Object.values(dayStops(now()))
        .filter(stop => stop !== null)
        .sort((a, b) => a - b);
    }
    return stops;
  };
  let returnTimer = 0;
  let returnFrame = 0;
  // The page eases to now through its usual sky transition and one status swap; only the thumb glides.
  // A keyboard scrub holds until focus leaves, so a screen reader user isn't pulled back mid-listen.
  function settle() {
    clearTimeout(returnTimer);
    if (isDragging || (isKeying && document.activeElement === scrubber)) return;
    returnTimer = setTimeout(() => {
      const from = scrubber.value;
      isScrubbing = false;
      peekLine = '';
      root.classList.remove('is-scrubbing');
      update();
      const to = scrubber.value;
      if (isCalm.matches) return;
      const start = performance.now();
      const step = time => {
        const t = Math.min(1, (time - start) / 800);
        const eased = t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
        scrubber.value = Math.round(from + (to - from) * eased);
        if (t < 1) returnFrame = requestAnimationFrame(step);
      };
      returnFrame = requestAnimationFrame(step);
    }, 1500);
  }
  function scrub() {
    cancelAnimationFrame(returnFrame);
    // Only a pointer snaps; arrow keys would step off a stop and get pulled straight back.
    const snapped = isDragging ? nearestStop(scrubber.value, stopsToday(), 10) : null;
    if (snapped !== null) scrubber.value = snapped;
    const nowMinute = minuteOf(now());
    if (scrubber.value > nowMinute) {
      scrubber.value = nowMinute;
      if (!peekLine) {
        tally('Peek');
        peekLine = PEEK_LINES[Math.floor(Math.random() * PEEK_LINES.length)];
      }
    } else {
      peekLine = '';
    }
    if (!isScrubbing) root.classList.add('is-scrubbing');
    isScrubbing = true;
    render(dateAtMinute(now(), scrubber.value), true);
    settle();
  }
  scrubber.addEventListener('pointerdown', () => {
    scrubTip.open = false;
    isDragging = true;
    isKeying = false;
  });
  const release = () => {
    if (!isDragging) return;
    isDragging = false;
    if (isScrubbing) settle();
  };
  addEventListener('pointerup', release);
  addEventListener('pointercancel', release);
  scrubber.addEventListener('input', scrub);
  scrubber.addEventListener('input', () => tally('Scrub'), { once: true });
  scrubber.addEventListener('blur', () => isScrubbing && settle());
  // Capture runs before the slider's own Page Up/Down, which would move by a fixed amount instead of to a stop.
  scrubber.addEventListener(
    'keydown',
    event => {
      isKeying = true;
      if (event.key !== 'PageUp' && event.key !== 'PageDown') return;
      event.preventDefault();
      event.stopPropagation();
      const next =
        event.key === 'PageUp'
          ? stopsToday().find(stop => stop > scrubber.value)
          : stopsToday().findLast(stop => stop < scrubber.value);
      if (next === undefined) return;
      scrubber.value = next;
      scrub();
    },
    true
  );
}

// The style read applies the new sky under the class (snapping: no transitions; ticking: only ink fades) before it lifts.
function repaint(className, isInstant = false) {
  root.classList.add(className);
  update(isInstant);
  getComputedStyle(root).getPropertyValue('--sky-top');
  root.classList.remove(className);
}
const snap = () => repaint('is-snapping', true);

const untilNextMinute = () => 60000 - (Date.now() % 60000);
// Minute steps in the sky are too small to see, so only an ink flip gets its fade.
function tick() {
  repaint('is-ticking');
  checkWeather();
  setTimeout(tick, untilNextMinute());
}

tell.addEventListener('click', event => event.preventDefault());
// Every link on the page, tracked by where it sits and where it goes; Umami sends with keepalive, so it survives the navigation.
document.addEventListener('click', event => {
  const link = event.target.closest('a[href]');
  if (!link) return;
  const to =
    link.protocol === 'mailto:' ? 'email' : `${link.host.replace(/^www\./, '')}${link.pathname.replace(/\/$/, '')}`;
  tally('Link', { from: link.closest('#tray, #bio, .cell')?.id, to });
});
tell.addEventListener('tell-dance', () => {
  tally('Dance');
  isDancing = true;
  setLine(false);
});
tell.addEventListener('tell-after-dance', () => {
  isDancing = false;
  setLine(false);
});
// Loaded on intent, so the icons are in place before the tray starts to open.
summary.addEventListener('pointerenter', loadTrayIcons, { once: true });
summary.addEventListener('focus', loadTrayIcons, { once: true });
summary.addEventListener('click', event => {
  if (!tray.open || event.defaultPrevented) return;
  event.preventDefault();
  setOpen(!isOpen());
});
const markEnd = () =>
  nav.classList.toggle(
    'is-at-end',
    rows.at(-1).getBoundingClientRect().bottom <= scroller.getBoundingClientRect().bottom + 1
  );

scroller.addEventListener('scroll', markEnd, { passive: true });
// The list gets whatever main has left, so the open card never outgrows main and clips. Short of about five rows,
// the meta row folds away and the list takes its space too.
function fitTray() {
  const base = card.offsetHeight - nav.offsetHeight - meta.offsetHeight + meta.clientTop;
  const room = main.clientHeight - base;
  const isFolded = room - meta.scrollHeight < FOLD_BELOW;
  card.classList.toggle('is-folded', isFolded);
  scroller.style.setProperty('--tray-room', `${isFolded ? room : room - meta.scrollHeight}px`);
}

addEventListener('resize', () => tray.open && fitTray(), { passive: true });
tray.addEventListener('toggle', () => {
  if (!tray.open) return;
  tally('Tray open');
  fitTray();
  scroller.scrollTop = 0;
  markEnd();
  loadTrayIcons();
  moveHighlight(0);
});
rows.forEach((row, i) => {
  row.addEventListener('pointerenter', () => moveHighlight(i));
  row.addEventListener('focus', () => moveHighlight(i, true));
});
document.addEventListener('pointerdown', event => {
  if (isOpen() && !tray.contains(event.target) && !event.target.closest('a')) setOpen(false);
});
tray.addEventListener('focusout', event => {
  if (isOpen() && event.relatedTarget && !tray.contains(event.relatedTarget)) setOpen(false);
});
document.addEventListener('keydown', event => {
  if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) return;
  if (event.key === '/') {
    event.preventDefault();
    setOpen(!isOpen());
    if (isOpen()) rows[0].focus({ preventScroll: true });
    return;
  }
  if (!isOpen()) return;
  if (event.key === 'Escape') {
    setOpen(false);
    summary.focus();
  } else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
    event.preventDefault();
    const jump = { Home: 0, End: rows.length - 1 }[event.key];
    if (jump !== undefined) moveHighlight(jump, true);
    else if (nav.contains(document.activeElement)) {
      moveHighlight(rows.indexOf(document.activeElement) + (event.key === 'ArrowDown' ? 1 : -1), true);
    }
    rows[activeIndex].focus({ preventScroll: true });
    rows[activeIndex].scrollIntoView({ block: 'nearest' });
  }
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden || IS_LOST) return;
  snap();
  checkMusic();
  checkWeather();
});

for (const link of nav.querySelectorAll('a[data-user]'))
  link.href = `mailto:${link.dataset.user}@${link.dataset.domain}`;
setCell(document.getElementById('music'), RESTING);
meta.hidden = false;
// Shown before first paint so the row is in layout from the start and nothing shifts when the slider upgrades.
day.hidden = false;
highlight.hidden = false;
// After unhiding, so the first paint of the cells lands under is-snapping and skips their fade-in.
snap();
if (!IS_LOST) setTimeout(tick, untilNextMinute());
addEventListener(
  'load',
  () => {
    const enhanced = import(ENHANCE);
    enhanced
      .then(() => customElements.whenDefined('tiny-tell'))
      .then(() => requestAnimationFrame(() => requestAnimationFrame(paintFavicon)))
      .catch(() => {});
    checkWeather();
    // The 404 is frozen: no scrubber, no polling, and its song never changes.
    if (IS_LOST) return tally('404', { path: location.pathname });
    checkMusic();
    enhanced.then(setUpScrubber).catch(() => {});
    setInterval(checkMusic, 120000);
  },
  { once: true }
);
