function ago(ms) {
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`;
}

export const TEN_MINUTES = 600000;
export const FETCH_TIMEOUT = 8000;
export const LASTFM_PROFILE = 'https://www.last.fm/user/B-Tal';
// Holds the row while Last.fm loads, and stands in when it fails or has nothing.
export const RESTING = {
  icon: 'music',
  text: 'Last.fm',
  url: LASTFM_PROFILE,
  tip: 'Listening history, on Last.fm.',
  isQuiet: true,
};

export const recentTracks = url =>
  fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT) })
    .then(response => response.json())
    .then(json => [].concat(json.recenttracks.track));

// isThen: the page shows a past moment, and `now` is that moment. A track that started within ten minutes of it counts as
// playing then. The boombox only ever means live right now, so past moments always get notes.
export function musicCell(track, now, isThen = false) {
  const artist = track?.artist?.['#text'];
  if (!artist) return RESTING;
  const cell = { text: artist, url: track.url.split('/_/')[0], icon: 'music' };
  if (track['@attr']?.nowplaying === 'true') {
    if (isThen) return { ...cell, label: 'Playing now', tip: 'Playing now, not back then.' };
    return { ...cell, icon: 'boombox', label: 'Now playing', isLive: true, tip: 'Playing now, via Last.fm.' };
  }
  const sinceStart = now - track.date.uts * 1000;
  if (isThen && sinceStart < TEN_MINUTES) return { ...cell, label: 'Playing then', tip: 'Playing then, via Last.fm.' };
  return { ...cell, label: 'Last played', tip: `Last played ${ago(sinceStart)}` };
}

export function previewTrack(kind, now) {
  if (kind === 'off') return undefined;
  const track = {
    artist: { '#text': 'The Octopus Project' },
    url: 'https://www.last.fm/music/The+Octopus+Project/_/Hello+Avalanche',
  };
  return kind === 'live'
    ? { ...track, '@attr': { nowplaying: 'true' } }
    : { ...track, date: { uts: String(Math.floor((now - 7200000) / 1000)) } };
}
