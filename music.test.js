import { test } from 'node:test';
import assert from 'node:assert/strict';
import { musicCell, previewTrack, RESTING } from './music.js';

const NOW = Date.UTC(2026, 9, 15, 20, 0);
const track = extra => ({
  artist: { '#text': 'The Octopus Project' },
  url: 'https://www.last.fm/music/The+Octopus+Project/_/Hello+Avalanche',
  ...extra,
});

test('a live track shows its artist, linked, and says it’s playing', () => {
  assert.deepEqual(musicCell(track({ '@attr': { nowplaying: 'true' } }), NOW), {
    icon: 'boombox',
    label: 'Now playing',
    text: 'The Octopus Project',
    url: 'https://www.last.fm/music/The+Octopus+Project',
    isLive: true,
    tip: 'Playing now, via Last.fm.',
  });
});

test('a live track viewed from another time stays linked but stops claiming it’s playing then', () => {
  assert.deepEqual(musicCell(track({ '@attr': { nowplaying: 'true' } }), NOW, true), {
    icon: 'headphones',
    label: 'Playing now',
    text: 'The Octopus Project',
    url: 'https://www.last.fm/music/The+Octopus+Project',
    tip: 'Playing now, not back then.',
  });
});

test('a past moment shows what was playing then, or what played last before it', () => {
  const at = minutesBefore => track({ date: { uts: String((NOW - minutesBefore * 60000) / 1000) } });
  assert.deepEqual(musicCell(at(4), NOW, true), {
    icon: 'headphones',
    label: 'Playing then',
    text: 'The Octopus Project',
    url: 'https://www.last.fm/music/The+Octopus+Project',
    tip: 'Playing then, via Last.fm.',
  });
  assert.equal(musicCell(at(42), NOW, true).icon, 'headphones');
  assert.equal(musicCell(at(42), NOW, true).tip, 'Last played 42m ago');
});

test('the last played track says how long ago', () => {
  const ago = minutes => musicCell(track({ date: { uts: String((NOW - minutes * 60000) / 1000) } }), NOW).tip;
  assert.equal(ago(0), 'Last played just now');
  assert.equal(ago(42), 'Last played 42m ago');
  assert.equal(ago(125), 'Last played 2h ago');
  assert.equal(ago(60 * 50), 'Last played 2d ago');
  assert.ok(!musicCell(track({ date: { uts: '0' } }), NOW).isLive);
  assert.equal(musicCell(track({ date: { uts: '0' } }), NOW).icon, 'headphones');
});

test('without a track, the row stays and quietly links to the Last.fm profile', () => {
  assert.equal(RESTING.isQuiet, true);
  assert.equal(musicCell(undefined, NOW), RESTING);
  assert.equal(musicCell(null, NOW, true), RESTING);
  assert.equal(musicCell({ artist: { '#text': '' } }, NOW), RESTING);
});

test('previewTrack fakes each state', () => {
  assert.equal(musicCell(previewTrack('live', NOW), NOW).isLive, true);
  assert.equal(musicCell(previewTrack('last', NOW), NOW).tip, 'Last played 2h ago');
  assert.equal(musicCell(previewTrack('off', NOW), NOW).isQuiet, true);
});
