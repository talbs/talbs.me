import 'tiny-tells/play';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/tooltip/tooltip.js';
import '@awesome.me/webawesome/dist/components/slider/slider.js';
import '@awesome.me/webawesome/dist/components/random-content/random-content.js';
import { makeStars, starCount } from './stars.js';

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
