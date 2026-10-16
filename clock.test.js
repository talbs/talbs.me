import { test } from 'node:test';
import assert from 'node:assert/strict';
import { brianClock, zonedDate, previewDate, sunOverride } from './clock.js';
import { blockFor } from './schedule.js';

const et = (year, month, dayOfMonth, hour, minute = 0) =>
  brianClock(zonedDate({ year, month, dayOfMonth, hour, minute }));

test('brianClock reads Eastern time on both sides of DST', () => {
  assert.deepEqual(brianClock(new Date('2026-07-04T18:00:00Z')), {
    year: 2026,
    month: 7,
    dayOfMonth: 4,
    day: 'Sat',
    hour: 14,
    minute: 0,
    dateKey: '2026-07-04',
  });
  assert.equal(brianClock(new Date('2026-12-05T18:00:00Z')).hour, 13);
  assert.equal(brianClock(new Date('2026-11-01T05:30:00Z')).hour, 1);
  assert.equal(brianClock(new Date('2026-11-01T06:30:00Z')).hour, 1);
});

test('zonedDate round-trips an Eastern wall time', () => {
  for (const wall of [
    { year: 2026, month: 1, dayOfMonth: 15, hour: 8, minute: 5 },
    { year: 2026, month: 7, dayOfMonth: 4, hour: 23, minute: 59 },
  ]) {
    const back = brianClock(zonedDate(wall));
    assert.deepEqual([back.year, back.month, back.dayOfMonth, back.hour, back.minute], Object.values(wall));
  }
});

test('blockFor follows the routine, inclusive at the start', () => {
  const at = (day, hour, minute = 0) => blockFor({ day, hour, minute });
  assert.equal(at('Tue', 5, 50), 'sleeping');
  assert.equal(at('Tue', 6), 'morning');
  assert.equal(at('Tue', 8, 20), 'morning');
  assert.equal(at('Tue', 8, 30), 'workday');
  assert.equal(at('Fri', 17, 20), 'workday');
  assert.equal(at('Fri', 17, 30), 'evening');
  assert.equal(at('Sat', 14), 'weekend');
  assert.equal(at('Sun', 8, 30), 'weekend');
  assert.equal(at('Sat', 23, 20), 'evening');
  assert.equal(at('Sat', 23, 30), 'sleeping');
  assert.equal(at('Mon', 0), 'sleeping');
});

test('previewDate fakes hour, day, and month and ignores junk', () => {
  const now = new Date('2026-10-08T16:37:00Z');
  const fake = query => brianClock(previewDate(now, new URLSearchParams(query)));
  assert.deepEqual([fake('hour=3').hour, fake('hour=3').minute], [3, 0]);
  assert.equal(fake('day=Sat').day, 'Sat');
  assert.equal(fake('month=7').month, 7);
  assert.equal(fake('hour=abc').hour, brianClock(now).hour);
  assert.equal(fake('day=Funday').day, brianClock(now).day);
  assert.equal(previewDate(now, new URLSearchParams('')).getTime(), now.getTime());
});

test('previewDate takes any Boston date and time from ?at=', () => {
  const now = new Date('2026-10-08T16:37:00Z');
  const fake = query => brianClock(previewDate(now, new URLSearchParams(query)));
  const at = fake('at=2026-12-21T16:14');
  assert.deepEqual([at.year, at.month, at.dayOfMonth, at.hour, at.minute], [2026, 12, 21, 16, 14]);
  assert.equal(fake('at=2026-12-21T16:14&hour=3').hour, 16);
  assert.equal(previewDate(now, new URLSearchParams('at=soon')).getTime(), now.getTime());
});

test('sunOverride reads ?sun= only when it is a number', () => {
  assert.equal(sunOverride(new URLSearchParams('sun=-3.5')), -3.5);
  assert.equal(sunOverride(new URLSearchParams('sun=up')), null);
  assert.equal(sunOverride(new URLSearchParams('')), null);
});

import { eligibleLines, eligibleErrors, pickLine, SKINS, BLOCK_SKINS } from './schedule.js';
import { pools, errors } from './statuses.js';

test('eligibleLines filters by month and fills the block default state', () => {
  const july = eligibleLines(pools.weekend, et(2026, 7, 11, 14), 'weekend');
  const january = eligibleLines(pools.weekend, et(2026, 1, 10, 14), 'weekend');
  assert.ok(july.some(line => line.text.startsWith('Harvesting more zucchini')));
  assert.ok(!january.some(line => line.text.startsWith('Harvesting more zucchini')));
  assert.equal(january.find(line => line.text === 'Out taking photos…').state, 'working');
  assert.equal(january.find(line => line.text === 'Chores done. Mostly.').state, 'done');
});

test('eligibleErrors respects block and day, and never fires while sleeping', () => {
  const texts = (clock, block) => eligibleErrors(errors, clock, block).map(line => line.text);
  assert.ok(texts(et(2026, 10, 5, 7), 'morning').includes('Error: Encountered a Monday.'));
  assert.ok(!texts(et(2026, 10, 6, 7), 'morning').includes('Error: Encountered a Monday.'));
  assert.ok(!texts(et(2026, 10, 5, 10), 'workday').includes('Error: Encountered a Monday.'));
  assert.deepEqual(texts(et(2026, 10, 5, 2), 'sleeping'), []);
  assert.ok(eligibleErrors(errors, et(2026, 10, 5, 7), 'morning').every(line => line.state === 'error'));
});

const daysFrom = count =>
  Array.from({ length: count }, (_, i) => brianClock(new Date(Date.UTC(2026, 0, 1, 17) + i * 86400000)));
const slotsOf = clock =>
  Array.from({ length: 144 }, (_, slot) => ({ ...clock, hour: Math.floor(slot / 6), minute: (slot % 6) * 10 }));

test('pickLine is stable within a slot and always has a line', () => {
  const clock = et(2026, 10, 8, 14, 37);
  assert.deepEqual(pickLine(clock, pools, errors), pickLine({ ...clock, minute: 31 }, pools, errors));
  for (const day of daysFrom(60)) {
    for (const at of slotsOf(day))
      assert.ok(pickLine(at, pools, errors)?.text, `${day.dateKey} ${at.hour}:${at.minute}`);
  }
});

test('pickLine still works on a faked date that rolls into the next month', () => {
  const faked = brianClock(
    previewDate(new Date('2026-01-30T15:00:00Z'), new URLSearchParams('month=2&day=Sun&hour=10'))
  );
  assert.equal(faked.day, 'Sun');
  assert.equal(faked.month, 2);
  assert.equal(blockFor(faked), 'weekend');
  assert.equal(
    brianClock(previewDate(new Date('2026-09-29T15:00:00Z'), new URLSearchParams('month=9&day=Sat'))).month,
    9
  );
  assert.ok(pickLine(faked, pools, errors).text);
});

test('pickLine shows one or two short errors a day, never while sleeping', () => {
  for (const day of daysFrom(60)) {
    const errorSlots = slotsOf(day).filter(at => pickLine(at, pools, errors).state === 'error');
    assert.ok(errorSlots.length >= 1 && errorSlots.length <= 2, `${day.dateKey}: ${errorSlots.length} error slots`);
    for (const at of errorSlots) assert.notEqual(blockFor(at), 'sleeping', `${day.dateKey} error while sleeping`);
  }
});

const runsOf = day => {
  const runs = [];
  for (const at of slotsOf(day).slice(0, 141)) {
    const { text, state } = pickLine(at, pools, errors);
    if (state !== 'error' && runs.at(-1) !== text) runs.push(text);
  }
  return runs;
};

test('pickLine schedules a day without repeating a line, in about 40 changes', () => {
  for (const day of daysFrom(60)) {
    const runs = runsOf(day);
    assert.equal(new Set(runs).size, runs.length, `${day.dateKey} repeats: ${runs.join(' | ')}`);
    assert.ok(runs.length <= 45, `${day.dateKey}: ${runs.length} changes`);
  }
});

test('pickLine orders each day differently', () => {
  const [monday, nextMonday] = [et(2026, 10, 12, 12), et(2026, 10, 19, 12)];
  assert.notDeepEqual(runsOf(monday), runsOf(nextMonday));
});

test('pickLine honors anchored times and durations', () => {
  const lines = texts => texts.map(text => ({ text }));
  const custom = {
    sleeping: lines(['s1', 's2', 's3']),
    morning: [{ text: 'Walking the dog…', at: '07:00', minutes: 30 }, ...lines(['m1', 'm2'])],
    workday: [
      { text: 'Standup…', at: '09:50', minutes: 20 },
      { text: 'Deep work…', minutes: 120 },
      ...lines(['w1', 'w2', 'w3']),
    ],
    weekend: lines(['e1', 'e2', 'e3']),
    evening: lines(['v1', 'v2', 'v3']),
  };
  const at = (hour, minute) => pickLine(et(2026, 10, 14, hour, minute), custom, []).text;
  assert.equal(at(7, 0), 'Walking the dog…');
  assert.equal(at(7, 20), 'Walking the dog…');
  assert.notEqual(at(7, 30), 'Walking the dog…');
  assert.equal(at(9, 50), 'Standup…');
  assert.notEqual(at(10, 10), 'Standup…');
  const deep = slotsOf(et(2026, 10, 14, 12)).filter(slot => pickLine(slot, custom, []).text === 'Deep work…');
  assert.equal(deep.length, 12);
});

test('every line casts a real tell and every chip is complete', () => {
  const lines = [...Object.values(pools).flat(), ...errors];
  for (const line of lines) {
    if (line.skin) assert.ok(SKINS.includes(line.skin), `${line.text} skin ${line.skin}`);
    if (line.with) {
      assert.ok(line.with.icon && line.with.label, `${line.text} chip`);
      if (line.with.url) assert.match(line.with.url, /^https:\/\//, `${line.text} url`);
    }
  }
  for (const skin of Object.values(BLOCK_SKINS)) assert.ok(SKINS.includes(skin));
});

test('pickLine carries the skin and chip, falling back to the block default', () => {
  const huddle = eligibleLines(pools.workday, et(2026, 10, 6, 10), 'workday').find(
    line => line.text === 'In a huddle…'
  );
  assert.equal(huddle.skin, 'drones');
  const sketch = eligibleLines(pools.workday, et(2026, 10, 6, 10), 'workday').find(
    line => line.text === 'Renaming a CSS custom property, slowly…'
  );
  assert.equal(sketch.skin, BLOCK_SKINS.workday);
  assert.equal(sketch.with, null);
  assert.equal(eligibleErrors(errors, et(2026, 10, 6, 10), 'workday')[0].skin, 'flipdot');
});

import { sunElevation } from './sky.js';

const near = (actual, expected, tolerance, label) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: ${actual.toFixed(2)} vs ${expected}`);
const sunAt = (month, dayOfMonth, hour, minute) =>
  sunElevation(zonedDate({ year: 2026, month, dayOfMonth, hour, minute }));

test('sunElevation matches Boston at solar noon', () => {
  near(sunAt(6, 21, 12, 43), 71.1, 1.5, 'June solstice noon');
  near(sunAt(12, 21, 11, 42), 24.2, 1.5, 'December solstice noon');
});

// Published times for Boston on 2026-12-21 (timeanddate.com): sunset 4:14pm (apparent −0.83°), civil dusk 4:46pm (−6°).
test('sunElevation matches Boston at the horizon, where the sky changes fastest', () => {
  near(sunAt(12, 21, 16, 14), -0.83, 0.5, 'sunset');
  near(sunAt(12, 21, 16, 46), -6, 0.5, 'civil dusk');
});

import {
  skyAt,
  skyKey,
  isRising,
  contrast,
  mixOklab,
  overlay,
  SKY,
  NAMED,
  CARD,
  OFF_WHITE,
  OFF_BLACK,
  headerInk,
  isDarkDial,
  HEADER_SPOTS,
  DIAL_SPOTS,
  sunSpot,
} from './sky.js';

const at = (month, dayOfMonth, hour, minute) => zonedDate({ year: 2026, month, dayOfMonth, hour, minute });

test('isRising flips at solar noon', () => {
  assert.equal(isRising(at(10, 14, 9, 0)), true);
  assert.equal(isRising(at(10, 14, 15, 0)), false);
});

test('skyAt lands on every anchor in both sequences and clamps past the ends', () => {
  for (const [direction, anchors] of Object.entries(SKY)) {
    for (const anchor of anchors) {
      const sky = skyAt(anchor.at, direction === 'morning');
      assert.deepEqual([sky.top, sky.bottom], [anchor.top, anchor.bottom], `${direction} ${anchor.at}°`);
    }
  }
  assert.deepEqual(skyAt(-40, true), skyAt(-18, true));
  assert.deepEqual(skyAt(60, false), skyAt(30, false));
});

test('the sky key is always a named step-70 color that reads on the card', () => {
  const steps = Object.values(NAMED).map(color => color[70]);
  for (let i = -250; i <= 500; i += 5) {
    for (const rising of [true, false]) {
      const { key } = skyAt(i / 10, rising);
      assert.ok(steps.includes(key), `${i / 10}° key ${key}`);
      assert.ok(contrast(key, CARD) >= 3, `${i / 10}° key contrast`);
    }
  }
  assert.equal(skyKey('#ffb646'), NAMED.gold[70]);
});

test('the top key is a named step-70 color that reads as text on the card', () => {
  const steps = Object.values(NAMED).map(color => color[70]);
  for (let i = -250; i <= 500; i += 5) {
    for (const rising of [true, false]) {
      const { key, keyTop } = skyAt(i / 10, rising);
      assert.ok(steps.includes(keyTop), `${i / 10}° top key ${keyTop}`);
      assert.ok(contrast(keyTop, CARD) >= 4.5, `${i / 10}° top key contrast ${contrast(keyTop, CARD).toFixed(2)}`);
      assert.notEqual(keyTop, key, `${i / 10}° top key repeats the bottom key`);
    }
  }
});

// The sky's box overhangs the viewport by 15%, so the screen runs from 11.5% to 88.5% down its gradient. The sun glow may
// or may not sit behind an element (that depends on the screen's shape), so its ink must pass both ways.
const inkCases = (spots, check) => {
  for (let i = -250; i <= 500; i++) {
    for (const rising of [true, false]) {
      const sky = skyAt(i / 10, rising);
      const detail = skyDetail(i / 10, 180);
      for (const at of spots) {
        const plain = mixOklab(sky.top, sky.bottom, at);
        for (const behind of [plain, overlay(plain, sunSpot(sky.bottom, detail.sunLow), detail.sunStrength)]) {
          check(sky, detail, behind, `${i / 10}° ${rising ? 'rising' : 'setting'}`);
        }
      }
    }
  }
};

test('the header ink reads at the top of the screen, with only the wash it needs, at every sun angle', () => {
  inkCases(HEADER_SPOTS, (sky, detail, behind, where) => {
    const { isDark, wash } = headerInk(sky, detail);
    const [ink, washInk] = isDark ? [OFF_BLACK, OFF_WHITE] : [OFF_WHITE, OFF_BLACK];
    const ratio = contrast(ink, overlay(behind, washInk, wash));
    assert.ok(ratio >= 4.5, `${where} ${ratio.toFixed(2)}`);
  });
});

test('the header wash stays off when the sky has contrast to spare', () => {
  assert.equal(headerInk(skyAt(-20, false), skyDetail(-20, 180)).wash, 0);
  assert.equal(headerInk(skyAt(55, true), skyDetail(55, 180)).wash, 0);
});

test('the dial ink reads at the bottom of the screen at every sun angle', () => {
  inkCases(DIAL_SPOTS, (sky, detail, behind, where) => {
    const ratio = contrast(isDarkDial(sky, detail) ? OFF_BLACK : OFF_WHITE, behind);
    assert.ok(ratio >= 3, `${where} ${ratio.toFixed(2)}`);
  });
});

test('overlay composites like the browser does', () => {
  assert.equal(overlay('#000000', '#ffffff', 0.5), '#808080');
  assert.equal(overlay('#123456', '#ffffff', 0), '#123456');
});

import { contextFor, shortTime } from './clock.js';
import { nextSunEvent, moonPhase, moonTip } from './sky.js';

const withinMinutes = (a, b, minutes) => Math.abs(a - b) <= minutes * 60000;

// Published times for Boston (timeanddate.com, 2026): Oct 14 sunrise 6:56am, sunset 6:03pm; Dec 21 sunrise 7:10am, sunset 4:14pm.
test('nextSunEvent matches published Boston sunrise and sunset', () => {
  for (const [from, kind, expected] of [
    [at(10, 14, 3, 0), 'sunrise', at(10, 14, 6, 56)],
    [at(10, 14, 12, 0), 'sunset', at(10, 14, 18, 3)],
    [at(12, 21, 3, 0), 'sunrise', at(12, 21, 7, 10)],
    [at(12, 21, 12, 0), 'sunset', at(12, 21, 16, 14)],
  ]) {
    const event = nextSunEvent(from);
    assert.equal(event.kind, kind);
    assert.ok(withinMinutes(event.at, expected, 2), `${kind} ${shortTime(event.at)}`);
  }
});

// Published 2026 phases for Boston (timeanddate.com): new Oct 10 11:50am, full Oct 26 12:11am, new Dec 8 7:51pm, full Dec 23 8:28pm.
test('moonPhase matches published new and full moons', () => {
  assert.ok(moonPhase(at(10, 10, 11, 50)).lit <= 3);
  assert.ok(moonPhase(at(12, 8, 19, 51)).lit <= 3);
  assert.ok(moonPhase(at(10, 26, 0, 11)).lit >= 97);
  assert.ok(moonPhase(at(12, 23, 20, 28)).lit >= 97);
  assert.equal(moonPhase(at(10, 14, 23, 0)).phase, 'waxing');
  assert.equal(moonPhase(at(10, 30, 23, 0)).phase, 'waning');
});

test('moonTip names the phase and counts the days to the next full or new moon', () => {
  assert.match(moonTip(at(10, 10, 11, 50)), /^New moon\. Full moon in 1[56] days\.$/);
  assert.equal(moonTip(at(10, 15, 22, 30)), 'Waxing crescent. Full moon in 10 days.');
  assert.match(moonTip(at(10, 18, 12, 0)), /^First quarter\. Full moon in [78] days\.$/);
  assert.match(moonTip(at(10, 22, 12, 0)), /^Waxing gibbous\. Full moon in [34] days\.$/);
  assert.match(moonTip(at(10, 26, 0, 11)), /^Full moon\. New moon in 1[45] days\.$/);
  assert.match(moonTip(at(10, 30, 23, 0)), /^Waning gibbous\. New moon in (9|10) days\.$/);
  assert.match(moonTip(at(11, 2, 12, 0)), /^Last quarter\. New moon in [67] days\.$/);
  assert.match(moonTip(at(11, 5, 12, 0)), /^Waning crescent\. New moon in [34] days\.$/);
});

test('nextSunEvent just after sunset looks ahead to the next sunrise', () => {
  const event = nextSunEvent(at(10, 14, 18, 10));
  assert.equal(event.kind, 'sunrise');
  assert.ok(withinMinutes(event.at, at(10, 15, 6, 57), 3), shortTime(event.at));
});

test('contextFor picks the chip, then the moon at night, then the sun', () => {
  const plain = { with: null };
  const chip = { with: { icon: 'gamepad-modern', label: 'Hollow Knight', url: 'https://www.hollowknight.com/' } };
  assert.deepEqual(contextFor(chip, at(10, 14, 21, 0), -30), {
    icon: 'gamepad-modern',
    text: 'Hollow Knight',
    url: 'https://www.hollowknight.com/',
    tip: 'Open Hollow Knight',
  });
  assert.equal(contextFor(plain, at(10, 15, 22, 30), -30).tip, 'Waxing crescent. Full moon in 10 days.');
  assert.match(contextFor(plain, at(10, 14, 23, 0), -30).text, /^\d+% (waxing|waning)$/);
  assert.deepEqual(contextFor(plain, at(10, 14, 16, 52), 10), {
    icon: 'sunset',
    label: 'Sunset',
    text: '6:04pm',
    tip: 'Sunset: gonna be a beauty.',
  });
  assert.equal(contextFor(plain, at(10, 14, 9, 0), 25).text, '6:04pm');
  assert.deepEqual(contextFor(plain, at(10, 15, 5, 30), -12), {
    icon: 'sunrise',
    label: 'Sunrise',
    text: '6:58am',
    tip: 'Sunrise: coffee first.',
  });
});

test('shortTime reads Boston time in lowercase with no space', () => {
  assert.equal(shortTime(at(10, 14, 18, 3)), '6:03pm');
  assert.equal(shortTime(at(10, 14, 9, 0)), '9:00am');
});

test('contextFor shows the moon from sunset on, and sunrise only in its last 3 hours', () => {
  const plain = { with: null };
  const moon = contextFor(plain, at(10, 14, 18, 10), -1.5);
  assert.equal(moon.icon, 'moon');
  assert.match(moon.text, /^\d+% (waxing|waning)$/);
  assert.doesNotMatch(contextFor(plain, at(10, 14, 2, 0), -40).text, /moon/);
  assert.equal(contextFor(plain, at(10, 14, 5, 30), -14).icon, 'sunrise');
});

import { firstPick } from './schedule.js';

test('firstPick never opens on an error line', () => {
  const erroring = slotsOf(daysFrom(30)[0])
    .concat(...daysFrom(30).slice(1).map(slotsOf))
    .find(at => pickLine(at, pools, errors).state === 'error');
  assert.ok(erroring, 'some slot in 30 days picks an error');
  const first = firstPick(erroring, pools, errors);
  assert.notEqual(first.state, 'error');
  assert.deepEqual(first, pickLine(erroring, pools, []));
  const calm = { ...erroring, minute: (erroring.minute + 10) % 60 };
  if (pickLine(calm, pools, errors).state !== 'error')
    assert.deepEqual(firstPick(calm, pools, errors), pickLine(calm, pools, errors));
});

import { oklch } from './sky.js';

test('the sky never goes gray between twilight and full day', () => {
  for (let i = -30; i <= 300; i++) {
    for (const rising of [true, false]) {
      const sky = skyAt(i / 10, rising);
      for (const [edge, hex] of [
        ['top', sky.top],
        ['bottom', sky.bottom],
      ]) {
        assert.ok(
          oklch(hex)[1] >= 0.08,
          `${i / 10}° ${rising ? 'rising' : 'setting'} ${edge} ${hex} chroma ${oklch(hex)[1].toFixed(3)}`
        );
      }
    }
  }
});

test('the morning sky rises through pink, never olive', () => {
  for (let i = 30; i <= 130; i++) {
    const sky = skyAt(i / 10, true);
    for (const [edge, hex] of [
      ['top', sky.top],
      ['bottom', sky.bottom],
    ]) {
      const hue = oklch(hex)[2];
      assert.ok(hue < 95 || hue > 150, `${i / 10}° ${edge} ${hex} hue ${hue.toFixed(0)}`);
    }
  }
});

test('the card surface takes a cool hue from the sky and never turns brown', () => {
  for (const rising of [true, false]) {
    for (let i = -180; i <= 300; i += 5) {
      const sky = skyAt(i / 10, rising);
      for (const tone of [sky.surface, sky.surfaceDeep]) {
        const [, , hue] = oklch(tone);
        assert.ok(hue < 20 || hue > 110, `${rising} ${i / 10}° hue ${hue.toFixed(0)}`);
        assert.ok(
          contrast('#a8afb7', tone) >= 4.5,
          `${rising} ${i / 10}° meta ${contrast('#a8afb7', tone).toFixed(2)}`
        );
      }
    }
  }
  const noon = skyAt(30, false);
  assert.ok(Math.abs(oklch(noon.surface)[2] - oklch(noon.top)[2]) < 2);
});

import { sunPosition, skyDetail } from './sky.js';

// Published azimuths for Boston (timeanddate.com, 2026): June sunrise 56°, sunset 304°; December sunrise 122°.
test('sunPosition points the sun the right way at sunrise, noon, and sunset', () => {
  const azimuthAt = (month, dayOfMonth, hour, minute) =>
    sunPosition(zonedDate({ year: 2026, month, dayOfMonth, hour, minute })).azimuth;
  near(azimuthAt(6, 21, 5, 8), 56, 2, 'June sunrise');
  near(azimuthAt(6, 21, 12, 43), 180, 3, 'June noon');
  near(azimuthAt(6, 21, 20, 25), 304, 2, 'June sunset');
  near(azimuthAt(12, 21, 7, 10), 122, 2, 'December sunrise');
});

test('skyDetail places the glow facing south and clamps it to the sky', () => {
  assert.equal(skyDetail(10, 60).sunX, 0);
  assert.equal(skyDetail(10, 180).sunX, 50);
  assert.equal(skyDetail(10, 300).sunX, 100);
  assert.equal(skyDetail(10, 40).sunX, 0);
  assert.equal(skyDetail(10, 320).sunX, 100);
  assert.equal(skyDetail(0, 180).sunY, 100);
  assert.equal(skyDetail(72, 180).sunY, 15);
  assert.equal(skyDetail(-10, 180).sunY, 100);
});

test('skyDetail fades the glow through civil dusk and the stars through twilight', () => {
  assert.equal(skyDetail(-6, 250).sunStrength, 0);
  assert.equal(skyDetail(0, 250).sunStrength, 0.5);
  assert.equal(skyDetail(6, 250).sunStrength, 1);
  assert.equal(skyDetail(-6, 250).stars, 0);
  assert.equal(skyDetail(-12, 250).stars, 0.5);
  assert.equal(skyDetail(-18, 250).stars, 1);
  assert.equal(skyDetail(10, 250).stars, 0);
});

test('skyDetail marks how low the sun is', () => {
  assert.equal(skyDetail(0, 250).sunLow, 1);
  assert.equal(skyDetail(10, 250).sunLow, 0.5);
  assert.equal(skyDetail(20, 250).sunLow, 0);
  assert.equal(skyDetail(-4, 250).sunLow, 1);
});

import { timeTip } from './clock.js';

test('timeTip gives Boston a voice through the day', () => {
  assert.equal(timeTip(1), 'it’s wicked late heah.');
  assert.equal(timeTip(5), 'Dunks is already open.');
  assert.equal(timeTip(17), '93 is a pahkin’ lot.');
  assert.equal(timeTip(22), 'it’s getting wicked late.');
  for (let hour = 0; hour < 24; hour++) assert.ok(timeTip(hour), `hour ${hour} has a line`);
});
