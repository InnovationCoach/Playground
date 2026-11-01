export const SCENE_VERSION = 1;
export const MAX_OBJECTS = 40;
export const THEMES = [{ id: 'moon', name: 'Moon garden' }, { id: 'orbital', name: 'Orbital workshop' }, { id: 'neon', name: 'Neon outpost' }];
export const ASSETS = [
  ['fern', 'Moon fern', 'nature'], ['tree', 'Bubble tree', 'nature'], ['mushroom', 'Giant mushroom', 'nature'], ['flower', 'Star flowers', 'nature'],
  ['crystal', 'Crystal cluster', 'nature'], ['rock', 'Moon rocks', 'nature'], ['pond', 'Little pond', 'nature'], ['terrarium', 'Tiny ecosystem', 'nature'],
  ['dome', 'Habitat dome', 'build'], ['observatory', 'Observatory', 'build'], ['arch', 'Stone arch', 'build'], ['bridge', 'Small bridge', 'build'],
  ['solar', 'Solar array', 'build'], ['beacon', 'Signal beacon', 'build'], ['portal', 'Portal frame', 'build'], ['bench', 'Quiet bench', 'build'],
  ['flag', 'Your flag', 'details'], ['lamp', 'Orbit lamp', 'details'], ['moon', 'Mini moon', 'rewards'], ['waterfall', 'Waterfall kit', 'rewards']
].map(([id, name, category]) => ({ id, name, category, reward: category === 'rewards' }));
export const PALETTES = [{ id: 'purple', color: '#a58bd4', label: 'Cosmic purple' }, { id: 'lime', color: '#badc65', label: 'Lunar lime' }, { id: 'sky', color: '#80cfe3', label: 'Starlight blue' }, { id: 'peach', color: '#ecaa96', label: 'Comet peach' }];
export const BODY_TYPES = ['mushroom', 'blob', 'robot'];
export const TRAITS = ['curious', 'sleepy', 'energetic'];
export const ACCESSORIES = ['boots', 'backpack', 'headphones'];
const validAsset = id => ASSETS.some(a => a.id === id);
const bound = (n, min, max, fallback) => Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
const oneOf = (v, choices, fallback) => choices.includes(v) ? v : fallback;
export const assetById = id => ASSETS.find(a => a.id === id);
export const position = (x, y) => ({ x: Math.round(bound(x, 110, 890, 500)), y: Math.round(bound(y, 210, 475, 360)) });

export function starterWorld() {
  return { version: SCENE_VERSION, theme: 'moon', name: 'My little universe',
    objects: [
      { id: 'starter-dome', asset: 'dome', x: 360, y: 330, rotation: 0, scale: 1 },
      { id: 'starter-fern', asset: 'fern', x: 240, y: 375, rotation: 0, scale: 1.1 },
      { id: 'starter-crystal', asset: 'crystal', x: 720, y: 385, rotation: 0, scale: 1 },
      { id: 'starter-lamp', asset: 'lamp', x: 630, y: 280, rotation: 0, scale: 1 },
      { id: 'starter-flower', asset: 'flower', x: 440, y: 440, rotation: 0, scale: .9 }
    ], creature: { name: 'Miso', body: 'mushroom', palette: 'purple', trait: 'curious', accessory: 'boots', x: 550, y: 370 },
    sampleReward: null };
}

export function hydrateWorld(raw) {
  if (!raw || raw.version !== SCENE_VERSION || !Array.isArray(raw.objects) || raw.objects.length > MAX_OBJECTS) return null;
  const ids = new Set();
  for (const o of raw.objects) {
    if (!o || typeof o.id !== 'string' || !o.id || o.id === 'creature' || o.id.length > 100 || ids.has(o.id) || !validAsset(o.asset)) return null;
    ids.add(o.id);
  }
  const reward = oneOf(raw.sampleReward, ['moon', 'waterfall', 'star-hat'], null);
  if (raw.objects.some(o => assetById(o.asset).reward && o.asset !== reward)) return null;
  const base = starterWorld(), c = raw.creature || {};
  return { version: SCENE_VERSION, theme: oneOf(raw.theme, THEMES.map(t => t.id), 'moon'),
    name: typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim().slice(0, 40) : base.name,
    objects: raw.objects.map(o => ({ id: o.id, asset: o.asset, ...position(o.x, o.y), rotation: bound(o.rotation, -180, 180, 0), scale: bound(o.scale, .6, 1.5, 1) })),
    creature: { name: typeof c.name === 'string' && c.name.trim() ? c.name.trim().slice(0, 24) : 'Miso',
      body: oneOf(c.body, BODY_TYPES, 'mushroom'), palette: oneOf(c.palette, PALETTES.map(p => p.id), 'purple'),
      trait: oneOf(c.trait, TRAITS, 'curious'), accessory: oneOf(c.accessory, [...ACCESSORIES, ...(reward === 'star-hat' ? ['star-hat'] : [])], 'boots'), ...position(c.x, c.y) }, sampleReward: reward };
}

export function updateWorld(world, action) {
  let next = world;
  if (action.type === 'add') {
    const asset = assetById(action.asset);
    if (!asset || world.objects.length >= MAX_OBJECTS || world.objects.some(o => o.id === action.id) || asset.reward && world.sampleReward !== asset.id) return world;
    const offset = world.objects.length % 7;
    next = { ...world, objects: [...world.objects, { id: action.id, asset: asset.id, x: 390 + offset * 43, y: 340 + offset % 3 * 28, rotation: 0, scale: 1 }] };
  } else if (action.type === 'move') {
    const p = position(action.x, action.y);
    next = action.id === 'creature' ? { ...world, creature: { ...world.creature, ...p } } : { ...world, objects: world.objects.map(o => o.id === action.id ? { ...o, ...p } : o) };
  } else if (action.type === 'object') next = { ...world, objects: world.objects.map(o => o.id === action.id ? { ...o, rotation: action.rotation ?? o.rotation, scale: action.scale ?? o.scale } : o) };
  else if (action.type === 'remove') next = { ...world, objects: world.objects.filter(o => o.id !== action.id) };
  else if (action.type === 'creature') next = { ...world, creature: { ...world.creature, ...action.patch } };
  else if (action.type === 'theme') next = { ...world, theme: action.theme };
  else if (action.type === 'name') next = { ...world, name: action.name };
  else if (action.type === 'reward' && !world.sampleReward && ['moon', 'waterfall', 'star-hat'].includes(action.reward)) next = { ...world, sampleReward: action.reward };
  else if (action.type === 'reset') next = starterWorld();
  return hydrateWorld(next) || world;
}

export function historyState(world) { return { world, past: [], future: [] }; }
export function universeReducer(state, action) {
  if (action.type === 'undo') return state.past.length ? { world: state.past.at(-1), past: state.past.slice(0, -1), future: [state.world, ...state.future].slice(0, 40) } : state;
  if (action.type === 'redo') return state.future.length ? { world: state.future[0], past: [...state.past, state.world].slice(-40), future: state.future.slice(1) } : state;
  const world = updateWorld(state.world, action);
  if (JSON.stringify(world) === JSON.stringify(state.world)) return state;
  return { world, past: [...state.past, state.world].slice(-40), future: [] };
}

export function gravityPose(seconds, gravity, trait = 'curious') {
  const strength = gravity === 'zero' ? 38 : gravity === 'low' ? 64 : 9;
  const speed = trait === 'sleepy' ? .7 : trait === 'energetic' ? 1.5 : 1;
  return { height: Math.abs(Math.sin(seconds * speed * (gravity === 'normal' ? 2.8 : 1.25))) * strength,
    rotation: gravity === 'zero' ? Math.sin(seconds * .7) * 14 : 0 };
}
