import 'tiny-tells/play';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/tooltip/tooltip.js';
import '@awesome.me/webawesome/dist/components/slider/slider.js';
import '@awesome.me/webawesome/dist/components/random-content/random-content.js';
import { makeStars, starCount } from './stars.js';
import { makeClouds } from './clouds.js';

// Sized from the screen, not the window, so resizing or rotating never needs new stars.
const field = document.querySelector('.stars');
field.style.setProperty('--field', `${Math.hypot(screen.width, screen.height)}px`);
field.append(
  ...makeStars(starCount(screen.width, screen.height)).map(star => {
    const dot = document.createElement('i');
    dot.className = 'star wa-border-radius-circle';
    dot.style.cssText = `left:${star.x}%;top:${star.y}%;--size:${star.size}px;--duration:${star.duration}s;--delay:${star.delay}s`;
    return dot;
  })
);

// Each puff is drawn three times, a screen apart, so the drift loops without a seam.
document.querySelector('.clouds').append(
  ...Object.entries(makeClouds()).map(([depth, puffs]) => {
    const drift = document.createElement('div');
    drift.className = `drift ${depth}`;
    drift.append(
      ...puffs.flatMap(puff =>
        [-1, 0, 1].map(copy => {
          const shape = document.createElement('i');
          shape.className = 'puff';
          shape.style.cssText = `--x:${puff.x};--y:${puff.y};--w:${puff.w};--h:${puff.h};--o:${puff.o};--copy:${copy}`;
          return shape;
        })
      )
    );
    return drift;
  })
);
