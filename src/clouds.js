import { random } from './stars.js';

// [percent down the screen, clouds across] per row. Rows run the whole height; each cloud gets its own slot.
const NEAR = {
  seed: 5,
  scale: 1,
  fade: 1,
  rows: [
    [14, 2],
    [42, 3],
    [70, 3],
    [92, 4],
  ],
};
const FAR = {
  seed: 17,
  scale: 0.55,
  fade: 0.6,
  rows: [
    [8, 3],
    [30, 4],
    [56, 4],
    [82, 5],
  ],
};

const tenth = n => Math.round(n * 10) / 10;
const hundredth = n => Math.round(n * 100) / 100;

// Overhead (top) clouds are big and round, toward the horizon small and flat. Each is 1–3 puffs, densest in the middle.
function layer({ seed, scale, fade, rows }) {
  const next = random(seed);
  const puffs = [];
  for (const [rowY, count] of rows) {
    const slot = 100 / count;
    const offset = next() * slot;
    for (let c = 0; c < count; c++) {
      const cx = (offset + c * slot + (next() - 0.5) * slot * 0.5 + 100) % 100;
      const cy = rowY + (next() - 0.5) * 10;
      const depth = cy / 100;
      const size = (34 - depth * 20) * (0.8 + next() * 0.4) * scale;
      const n = 1 + Math.floor(next() * 3);
      for (let p = 0; p < n; p++) {
        const edge = Math.abs(p - (n - 1) / 2) / Math.max(1, (n - 1) / 2);
        const w = size * (0.6 + next() * 0.7) * (1 - edge * 0.15);
        puffs.push({
          x: tenth(cx + (p - (n - 1) / 2) * size * 0.42 + (next() - 0.5) * size * 0.2),
          y: tenth(cy + (next() - 0.5) * size * 0.18 + edge * size * 0.06),
          w: tenth(w),
          h: tenth(w * (0.55 - depth * 0.3 + next() * 0.12)),
          o: hundredth((0.6 + next() * 0.3) * (1 - edge * 0.3) * fade),
        });
        // The spike drew a swell delay here; the draw stays so the approved layout does too.
        next();
      }
    }
  }
  return puffs;
}

export const makeClouds = () => ({ far: layer(FAR), near: layer(NEAR) });
