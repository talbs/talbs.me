// Add a line: { text } uses the block's default state and skin.
// Optional: state, skin, days ['Mon'…'Sun'], months [1…12], with { icon, label, url } (the fact behind the joke).
const WA = { icon: 'web-awesome', family: 'brands', label: 'Web Awesome', url: 'https://webawesome.com/' };
const CREATE = { icon: 'create.svg', label: 'Create', url: 'https://webawesome.com/create' };
const TINY_TELLS = { icon: 'tiny-tells.svg', label: 'Tiny Tells', url: 'https://tinytells.dev/' };
const game = (label, url) => ({ icon: 'gamepad-modern', label, url });
const book = (label, url) => ({ icon: 'book-open', label, url });
const HADES = game('Hades II', 'https://www.supergiantgames.com/games/hades-ii/');
const BALATRO = game('Balatro', 'https://www.playbalatro.com/');
const HOLLOW_KNIGHT = game('Hollow Knight', 'https://www.hollowknight.com/');
const SILKSONG = game('Silksong', 'https://hollowknightsilksong.com/');
const MISTBORN = book('Mistborn', 'https://www.brandonsanderson.com/pages/the-mistborn-saga');
const STORMLIGHT = book('Stormlight Archive', 'https://www.brandonsanderson.com/pages/the-stormlight-archive-series');
const COSMERE = book('the Cosmere', 'https://coppermind.net/wiki/Hoid');
const CRADLE = book('Cradle', 'https://www.willwight.com/');
const DCC = book('Dungeon Crawler Carl', 'https://mattdinniman.com/');
const recipe = path => ({
  icon: 'pot-food',
  label: 'recipe',
  url: `https://github.com/talbs/cookbook/blob/main/recipes/${path}.md`,
});

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const SCHOOL = { days: WEEKDAYS, months: [1, 2, 3, 4, 5, 6, 9, 10, 11, 12] };

// Evenings after bedtime: five of these a night, half an hour each.
const hobbies = [
  { text: 'Setting up mod-taps on a 60% in VIA…' },
  { text: 'Tuning a spacebar stabilizer. Needs more lube…' },
  { text: 'Soldering hot sockets for a cool keeb…' },
  { text: 'Chasing a Monkeytype PB…' },
  { text: 'Lubing switches…' },
  { text: 'Starting another night as Melinoë…', with: HADES },
  { text: 'Losing to Chronos. Again…', with: HADES },
  { text: 'RIP Gros Michel.', state: 'done', with: BALATRO },
  { text: 'Lining up Blueprint and Brainstorm…', with: BALATRO },
  { text: 'Pantheon of Hallownest, attempt 37…', with: HOLLOW_KNIGHT },
  { text: 'Sitting through all 57 of Zote’s precepts…', with: HOLLOW_KNIGHT },
  { text: 'Silksong is real. Playing it to prove it…', with: SILKSONG },
  { text: 'Shouting “Shaw!” at a Silksong boss…', with: SILKSONG },
  { text: 'There’s always another secret…', skin: 'lens', with: MISTBORN },
  { text: 'Flaring pewter to stay up late…', with: MISTBORN },
  { text: 'Laughing yet again at the Lopen…', skin: 'eyes', with: STORMLIGHT },
  { text: 'Spotting Hoid in yet another book…', skin: 'lens', with: COSMERE },
  { text: 'Cycling madra. Basically breathing, but smug…', with: CRADLE },
  { text: 'Waiting for Eithan to explain. He won’t…', state: 'warning', with: CRADLE },
  { text: 'Princess Donut is livestreaming…', skin: 'eyes', with: DCC },
  { text: 'Mongo is appalled. So am I…', with: DCC },
  { text: 'Floor collapses in ten minutes…', state: 'warning', with: DCC },
  { text: 'Opening a Bronze Adventurer Box…', with: DCC },
  { text: 'Reading Carl. Still no pants…', skin: 'lens', with: DCC },
  { text: 'You will not break me. Back to floor three…', with: DCC },
  { text: 'Drawing a new face for Tiny Tells…', with: TINY_TELLS },
].map(line => ({ ...line, minutes: 30 }));

export const pools = {
  sleeping: [
    { text: 'Sleeping. Back at 6:30 ET.' },
    { text: 'Out cold. So is the dog.' },
    { text: 'Sleeping. Cold brew is steeping.' },
    { text: 'Asleep. The AeroPress is primed.' },
    { text: 'Sleeping. Still hearing that stabilizer rattle.' },
    { text: 'Sleeping. Phone’s in the other room.' },
    { text: 'Waiting on sunrise…', at: '05:30', minutes: 30, state: 'warning', skin: 'lens' },
  ],
  // Anchored lines claim their slot in this order, so a later one replaces an earlier one at the same time.
  morning: [
    { text: 'Snoozing. Just once.', at: '06:00', minutes: 30, state: 'idle', skin: 'eyes', days: ['Mon', 'Sun'] },
    { text: 'Letting the dog out first…', at: '06:30', minutes: 30 },
    { text: 'First coffee. Speak softly…', at: '07:00', minutes: 10 },
    { text: 'Holding Zone 2 before sunrise…', at: '06:00', minutes: 30, state: 'working', days: ['Tue', 'Thu'] },
    { text: 'Dinking at dawn…', at: '06:00', minutes: 60, state: 'working', days: ['Wed', 'Fri'] },
    { text: 'Staying out of the kitchen at pickleball…', at: '06:00', minutes: 60, state: 'working', days: ['Sat'] },
    { text: 'Packing healthy school snacks…', at: '07:10', minutes: 30, ...SCHOOL },
    { text: 'Walking to school…', at: '07:45', minutes: 20, state: 'working', ...SCHOOL },
    { text: 'Pooch perambulating…', at: '08:00', minutes: 30, state: 'working' },
    {
      text: 'Checking the community garden beds…',
      at: '08:00',
      minutes: 30,
      state: 'working',
      days: ['Wed', 'Sat'],
      months: [5, 6, 7, 8, 9, 10],
    },
    { text: 'Making breakfast…', state: 'working' },
  ],
  workday: [
    { text: 'In the Monday Slack huddle…', at: '09:00', minutes: 30, skin: 'drones', days: ['Mon'] },
    {
      text: 'Posting my status in Slack. The other status.',
      at: '09:00',
      minutes: 10,
      days: ['Tue', 'Wed', 'Thu', 'Fri'],
    },
    { text: 'Second breakfast. It’s coffee.', at: '10:00', minutes: 10 },
    { text: 'Living in Zone 4 for a minute…', at: '12:30', minutes: 60, days: ['Mon'] },
    { text: 'Walking wherever the dog wants…', at: '12:30', minutes: 60, skin: 'lens', days: ['Wed'] },
    {
      text: 'Burrito for lunch, obviously…',
      at: '12:30',
      minutes: 60,
      skin: 'blot',
      days: ['Tue', 'Thu', 'Fri'],
    },
    { text: 'Talking myself into a third coffee…', at: '13:30', minutes: 10, state: 'warning' },
    { text: 'Picking up the kid. School was “fine.”', at: '14:30', minutes: 30, skin: 'eyes', ...SCHOOL },
    { text: 'Designing a Web Awesome component…', with: WA },
    {
      text: 'Writing Web Awesome docs…',
      with: { icon: 'book', label: 'docs', url: 'https://webawesome.com/docs' },
    },
    { text: 'Polishing a corner of Create…', with: CREATE },
    { text: 'Pairing with an agent on Create…', with: CREATE },
    { text: 'Sketching a layout on actual paper…', skin: 'lens' },
    { text: 'Building it in the browser, not Figma…' },
    { text: 'Renaming a CSS custom property, slowly…' },
    {
      text: 'Reviewing a pull request…',
      with: { icon: 'code-pull-request', label: 'webawesome', url: 'https://github.com/shoelace-style/webawesome' },
    },
    {
      text: 'Hunting for the right icon…',
      with: { icon: 'font-awesome', family: 'brands', label: 'Font Awesome', url: 'https://fontawesome.com/' },
    },
    { text: 'In a huddle…', skin: 'drones' },
    { text: 'Waiting on CI…', state: 'warning' },
    { text: 'Meeting ended early.', state: 'done' },
  ],
  evening: [
    { text: 'Checking homework. Showing my work…', at: '17:30', minutes: 30, skin: 'eyes', days: WEEKDAYS },
    { text: 'Sous-chefing…', at: '18:00', minutes: 30, skin: 'blot' },
    { text: 'Eating dinner with the fam…', at: '18:30', minutes: 30, skin: 'blot' },
    { text: 'Family time. Status: do not disturb.', at: '19:00', minutes: 30, state: 'idle', skin: 'eyes' },
    { text: 'Washing the dishes…', at: '19:30', minutes: 30, skin: 'blot', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Sat'] },
    { text: 'Dishes are done, mannn.', at: '19:30', minutes: 30, state: 'done', days: ['Fri', 'Sun'] },
    { text: 'Negotiating one more bedtime story…', at: '20:00', minutes: 30, skin: 'eyes' },
    {
      text: 'Drilling third-shot drops at league night…',
      at: '19:00',
      minutes: 90,
      days: ['Tue'],
    },
    { text: 'One last run in Hades. Then bed. Probably.', at: '23:00', minutes: 30, with: HADES },
    ...hobbies,
  ],
  weekend: [
    { text: 'Half-fixing a thing around the house…' },
    { text: 'Making a second trip to the hardware store…' },
    { text: 'Walking the dog the long way…' },
    { text: 'Out taking photos…', skin: 'lens' },
    { text: 'Telling a dad joke…', skin: 'eyes' },
    { text: 'Matching keycaps to switch color…', skin: 'dekatron' },
    { text: 'Floating through Ori…', with: game('Ori', 'https://www.orithegame.com/') },
    { text: 'Descending another floor with Carl…', skin: 'lens', with: DCC },
    { text: 'Journey before destination…', with: STORMLIGHT },
    {
      text: 'Reading Cook’s Illustrated like a novel…',
      skin: 'lens',
      with: book('Cook’s Illustrated', 'https://www.americastestkitchen.com/cooksillustrated'),
    },
    { text: 'Tuning a Tiny Tells skin by 16 milliseconds…', with: TINY_TELLS },
    {
      text: 'Waiting on cookie dough to rest 36 hours…',
      state: 'warning',
      skin: 'blot',
      with: recipe('desserts/chocolate-chip-cookies'),
    },
    { text: 'Waiting on the oven…', state: 'warning', skin: 'blot' },
    {
      text: 'Baking pumpkin cheesecake bars…',
      skin: 'blot',
      months: [10, 11],
      with: recipe('desserts/pumpkin-cheesecake-bars'),
    },
    { text: 'Sous viding pots de crème at 158°F…', skin: 'blot', with: recipe('desserts/chocolate-pot-de-creme') },
    { text: 'Wearing gloves for the ghost chilies…', skin: 'blot', with: recipe('food/pineapple-ghost-chili-sauce') },
    { text: 'Cutting cold butter into biscuit dough…', skin: 'blot', with: recipe('food/buttermilk-biscuits') },
    { text: 'Baking Milk Bar corn cookies…', skin: 'blot', with: recipe('desserts/corn-cookies') },
    { text: 'Hardening off seedlings on the porch…', months: [4, 5] },
    { text: 'Watering in a liquid feed…', skin: 'blot', months: [5, 6, 7, 8] },
    {
      text: 'Side-dressing the tomatoes with dry fertilizer…',
      months: [6, 7, 8],
      with: { icon: 'seedling', label: 'zone 6b', url: 'https://planthardiness.ars.usda.gov/' },
    },
    { text: 'Pruning the tomatoes to a single leader…', months: [6, 7, 8] },
    { text: 'Pickling cucumbers…', skin: 'blot', months: [7, 8, 9] },
    { text: 'Harvesting more zucchini than anyone asked for…', months: [7, 8, 9] },
    { text: 'Chores done. Mostly.', state: 'done' },
  ],
};

// Errors show about 1 slot in 20, never while sleeping. Optional filters: blocks, days, months.
export const errors = [
  { text: 'Error: Too many tabs open.', blocks: ['workday'] },
  { text: 'Error: Meeting could have been an email.', blocks: ['workday'] },
  { text: 'Error: Encountered a Monday.', blocks: ['morning'], days: ['Mon'] },
  { text: 'Error: Out of coffee.', blocks: ['morning'] },
  { text: 'Error: Stabilizer rattle detected.', blocks: ['evening', 'weekend'] },
];

// The 404's lines. One shows per visit; the first is the no-JS line.
export const lost = [
  'Up at 4:04, looking for that page…',
  'Checked under the keyboard. Nothing…',
  'Pretty sure it was here yesterday…',
];
