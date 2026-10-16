import { LASTFM_PROFILE } from './music.js';

// Curate here. Sections show in SECTIONS order; entries keep this file's order within each.
export const SECTIONS = ['Now', 'Made', 'Elsewhere'];

export const links = [
  {
    section: 'Now',
    title: 'Web Awesome',
    note: 'leading UX and design on open-source web components',
    url: 'https://webawesome.com/',
    icon: 'web-awesome',
    family: 'brands',
  },
  {
    section: 'Now',
    title: 'Create',
    note: 'prompt a page, then shape it in code',
    url: 'https://webawesome.com/create',
    icon: 'create.svg',
  },
  {
    section: 'Made',
    title: 'Font Awesome',
    note: 'nine years leading UX, voice, docs, motion, and front end',
    url: 'https://fontawesome.com/',
    icon: 'font-awesome',
    family: 'brands',
  },
  {
    section: 'Made',
    title: 'Tiny Tells',
    note: 'side project: animated faces for app status',
    url: 'https://tinytells.dev/',
    icon: 'tiny-tells.svg',
  },
  {
    section: 'Made',
    title: 'Cookbook',
    note: 'recipes I actually make',
    url: 'https://github.com/talbs/cookbook',
    icon: 'hat-chef',
  },
  {
    section: 'Elsewhere',
    title: 'Email',
    note: 'hello at this domain',
    email: { user: 'hello', domain: 'talbs.me' },
    icon: 'envelope',
  },
  {
    section: 'Elsewhere',
    title: 'GitHub',
    note: 'where the side projects live',
    url: 'https://github.com/talbs',
    icon: 'github',
    family: 'brands',
  },
  {
    section: 'Elsewhere',
    title: 'LinkedIn',
    note: 'the résumé version of this page',
    url: 'https://www.linkedin.com/in/briantalbot',
    icon: 'linkedin',
    family: 'brands',
  },
  {
    section: 'Elsewhere',
    title: 'Bluesky',
    note: 'lurking, mostly. Posting, rarely.',
    url: 'https://bsky.app/profile/talbs.me',
    icon: 'bluesky',
    family: 'brands',
  },
  {
    section: 'Elsewhere',
    title: 'Last.fm',
    note: 'the receipts for everything I play',
    url: LASTFM_PROFILE,
    icon: 'lastfm',
    family: 'brands',
  },
];
