const SEED = 7;
const PER_SCREEN = 80;

// mulberry32: tiny and seedable, so every visitor sees the same sky.
export function random(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round = n => Math.round(n * 100) / 100;

export function makeStars(count) {
  const next = random(SEED);
  return Array.from({ length: count }, () => {
    const radius = Math.sqrt(next()) * 50;
    const angle = next() * 2 * Math.PI;
    return {
      x: round(50 + radius * Math.cos(angle)),
      y: round(50 + radius * Math.sin(angle)),
      size: round(1 + next() * 1.5),
      duration: round(3 + next() * 4),
      delay: round(next() * 5),
    };
  });
}

export const starCount = (width, height) =>
  Math.round((PER_SCREEN * Math.PI * (width ** 2 + height ** 2)) / 4 / (width * height));
