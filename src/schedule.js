import { brianClock, zonedDate } from './clock.js';

export function blockFor({ hour, minute = 0, day }) {
  const time = hour * 60 + minute;
  if (time >= 23 * 60 + 30 || time < 6 * 60) return 'sleeping';
  if (time < 8 * 60 + 30) return 'morning';
  if (time < 17 * 60 + 30) return day === 'Sat' || day === 'Sun' ? 'weekend' : 'workday';
  return 'evening';
}

export const SKINS = ['drones', 'flipdot', 'eyes', 'blot', 'dekatron', 'lens'];
const BLOCK_STATES = {
  sleeping: 'idle',
  morning: 'warning',
  workday: 'working',
  weekend: 'working',
  evening: 'working',
};
export const BLOCK_SKINS = {
  sleeping: 'eyes',
  morning: 'blot',
  workday: 'flipdot',
  weekend: 'drones',
  evening: 'dekatron',
};
const slotOf = ({ hour, minute }) => hour * 6 + Math.floor(minute / 10);

export function hash(text) {
  let h = 0x811c9dc5;
  for (const ch of text) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

const matches = (line, clock) =>
  (!line.days || line.days.includes(clock.day)) && (!line.months || line.months.includes(clock.month));

const toPick = (line, block) => ({
  text: line.text,
  state: line.state ?? BLOCK_STATES[block],
  skin: line.skin ?? BLOCK_SKINS[block],
  with: line.with ?? null,
});

export function eligibleLines(pool, clock, block) {
  return pool.filter(line => matches(line, clock)).map(line => toPick(line, block));
}

export function eligibleErrors(errors, clock, block) {
  if (block === 'sleeping') return [];
  return errors
    .filter(line => (!line.blocks || line.blocks.includes(block)) && matches(line, clock))
    .map(line => ({ text: line.text, state: 'error', skin: 'flipdot', with: null }));
}

const MIN_SLOTS = 4;
const SPANS = [
  ['morning', 36, 15],
  ['day', 51, 54],
  ['evening', 105, 36],
];

function shuffled(items, seed) {
  const out = [...items];
  let h = seed;
  for (let i = out.length - 1; i > 0; i--) {
    h = (Math.imul(h ^ (h >>> 15), 0x2c1b3c6d) + 0x6d2b79f5) >>> 0;
    const j = h % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const slotOfTime = time => {
  const [hour, minute] = time.split(':').map(Number);
  return slotOf({ hour, minute });
};

// Lays a block's lines across `length` slots from `start`: anchored lines at their time, the rest shuffled into the gaps.
function fillSpan(pool, clock, block, start, length) {
  const lines = pool.filter(line => matches(line, clock));
  const slots = new Array(length);
  const lengthOf = line =>
    line.minutes ? Math.ceil(line.minutes / 10) : Math.max(MIN_SLOTS, Math.floor(length / lines.length));
  for (const line of lines.filter(line => line.at)) {
    const offset = (slotOfTime(line.at) - start + 144) % 144;
    for (let i = offset; i < Math.min(length, offset + lengthOf(line)); i++) slots[i] = toPick(line, block);
  }
  const floating = shuffled(
    lines.filter(line => !line.at),
    hash(`${clock.dateKey}:${block}`)
  );
  let next = 0;
  for (let i = 0; i < length;) {
    if (slots[i]) {
      i++;
      continue;
    }
    let end = i;
    while (end < length && !slots[end]) end++;
    while (i < end && floating.length) {
      // Out of fresh lines: the last one stretches instead of a line coming back.
      if (next >= floating.length && slots[i - 1]) {
        for (; i < end; i++) slots[i] = slots[i - 1];
        break;
      }
      let line = floating[next++ % floating.length];
      if (floating.length > 1 && line.text === slots[i - 1]?.text) line = floating[next++ % floating.length];
      const run = end - (i + lengthOf(line)) < 2 ? end - i : lengthOf(line);
      for (let k = i; k < i + run; k++) slots[k] = toPick(line, block);
      i += run;
    }
    i = end;
  }
  return slots;
}

const days = new WeakMap();

// The night runs 11:30pm to 6am as one span, keyed by the morning it ends on, so nothing repeats across midnight.
function scheduleDay(clock, pools, errors) {
  const key = `${clock.dateKey}|${errors.length}`;
  const cache = days.get(pools) ?? days.set(pools, new Map()).get(pools);
  if (cache.has(key)) return cache.get(key);
  const tomorrow = brianClock(zonedDate({ ...clock, dayOfMonth: clock.dayOfMonth + 1, hour: 12, minute: 0 }));
  const work = blockFor({ hour: 12, day: clock.day });
  const slots = [
    ...fillSpan(pools.sleeping ?? [], clock, 'sleeping', 141, 39).slice(3),
    ...SPANS.flatMap(([block, start, length]) => {
      const name = block === 'day' ? work : block;
      return fillSpan(pools[name] ?? [], clock, name, start, length);
    }),
    ...fillSpan(pools.sleeping ?? [], tomorrow, 'sleeping', 141, 39).slice(0, 3),
  ];
  const h = hash(`${clock.dateKey}:errors`);
  const awake = slots
    .map((pick, slot) => ({
      pick,
      slot,
      block: blockFor({ hour: Math.floor(slot / 6), minute: (slot % 6) * 10, day: clock.day }),
    }))
    .filter(({ block }) => block !== 'sleeping' && eligibleErrors(errors, clock, block).length);
  for (let n = 0; n < 1 + (h & 1) && awake.length; n++) {
    const { slot, block } = awake.splice(hash(`${clock.dateKey}:error:${n}`) % awake.length, 1)[0];
    const errs = eligibleErrors(errors, clock, block);
    slots[slot] = errs[(h >>> 8) % errs.length];
  }
  cache.set(key, slots);
  return slots;
}

export const pickLine = (clock, pools, errors) => scheduleDay(clock, pools, errors)[slotOf(clock)];

export function firstPick(clock, pools, errors) {
  const pick = pickLine(clock, pools, errors);
  return pick.state === 'error' ? pickLine(clock, pools, []) : pick;
}
