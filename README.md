# talbs.me

The doorstep for www.talbs.me. A Tiny Tell and one status line say what Brian is probably doing right now, on his own clock (`America/New_York`). The sky behind it follows the real sun over Boston. The card also shows Boston's time and weather (Open-Meteo) and what Brian last played (Last.fm), opens into a tray of links, and has a slider for scrubbing back through the day.

Built with esbuild into `dist/` and deployed to GitHub Pages by Actions.

    npm install
    npm run dev    # http://localhost:4321, rebuilds on save
    npm test

- `src/` is the page: markup, styles, scripts, and the copy in `statuses.js` and `links.js`.
- `assets/` holds files that ship as-is (favicon, share image, custom icons).
- `tools/` builds and serves the site, and holds the local proof page.
- `test/` has the unit tests.

## Add or change a status

Edit `src/statuses.js`. Each block (`sleeping`, `morning`, `workday`, `weekend`, `evening`) has a list of lines.

```js
{ text: 'Dying in the Path of Pain again…', skin: 'dekatron', with: { icon: 'gamepad-modern', label: 'Hollow Knight', url: 'https://www.hollowknight.com/' } }
```

- `state` is optional (`working`, `warning`, `done`, `idle`). It defaults to the block's state.
- `days` (`'Mon'`…`'Sun'`) and `months` (1–12) limit when a line can show.
- Errors live in `errors`. One or two show up a day, never while Brian's asleep.
- `skin` picks the tell (`drones`, `flipdot`, `eyes`, `blot`, `dekatron`, `lens`). It defaults to the block's tell.
- `with` is the chip in the card's bottom row: a Font Awesome icon name (Sharp Duotone Solid, or `family: 'brands'` for a logo), a label, and an optional link. Use it for the fact behind the joke, not to repeat the line.

The line changes every 10 minutes and is the same for every visitor.

## Add or change a link

Edit `src/links.js`. Each entry needs a `section` from `SECTIONS`, a `title`, a short `note`, an `https://` `url`, and an `icon` (add `family: 'brands'` for a logo, or put a custom SVG in `assets/` and use its filename). The build fails on a missing field or an empty section.

## Preview any time

Run `npm run dev` and add URL parameters:

- `?at=2026-10-15T17:30` pins Brian's clock to a moment (status, sky, and weather)
- `?hour=3&day=Sat&month=7` fakes parts of the clock instead
- `?sun=-2` pins the sun's elevation in degrees, for tuning the sky
- `?music=live`, `last`, or `off` fakes the Last.fm row

`http://localhost:4321/proof` lines up the card at several times of day, and you can add frames for any moment.

## Test

```bash
npm test
```

Besides the unit tests, this checks formatting, holds the CSS to Baseline (newly available), and fails the build if `index.html` goes over 24 KB gzip.
