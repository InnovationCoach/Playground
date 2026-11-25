/**
 * Activity 1 - Townsville Urban Heat Island: the city model.
 *
 * A pure module (no React, no Firebase) so every number the activity shows can
 * be tested. The previous version moved four sliders and subtracted fixed
 * amounts from 36.5 °C. A learner could not see WHERE the city was hot, WHY, or
 * what their choices cost anything other than money. This model works tile by
 * tile, so the answer to "where should the trees go?" depends on the map.
 *
 * It is a TEACHING model, not a weather forecast. It keeps the four physical
 * ideas a Year 7-10 learner can reason about and drops everything else:
 *
 *   1. Albedo     - dark surfaces absorb more sunlight and get hotter.
 *   2. Shade      - a canopy or a sail stops sunlight reaching the ground.
 *   3. Evaporation- plants and water use the sun's energy to evaporate water
 *                   instead of heating the surface (evapotranspiration).
 *   4. Heat storage - concrete, asphalt and tall buildings soak up heat by day
 *                   and give it back at night. This is why the urban heat island
 *                   is usually strongest at 3 am, not 3 pm.
 *
 * Plus one geographic idea: in Townsville the afternoon breeze comes off the sea
 * from the north-east, so a cool park cools the tiles DOWNWIND of it more.
 *
 * Every constant is tagged in TILE_TYPES / WEATHER / SOURCES as DATA (a
 * published figure a teacher can open), ESTIMATE (a round figure chosen for the
 * model) or ASSUMPTION (a simplification). The UI shows the tags.
 */

export const COLS = 8;
export const ROWS = 6;
export const TILE_M = 50;          // each tile is a 50 m x 50 m block
export const TILE_AREA_M2 = TILE_M * TILE_M;

export const SOURCES = {
  bom: {
    label: 'Bureau of Meteorology - climate statistics for Townsville Aero (station 032040). Check the summer mean maximum and minimum here.',
    url: 'http://www.bom.gov.au/climate/averages/tables/cw_032040.shtml'
  },
  utci: {
    label: 'UTCI assessment scale (Bröde et al. 2012, Int J Biometeorol 56:481) - the heat-stress bands used for the feels-like colours.',
    url: 'https://doi.org/10.1007/s00484-011-0454-1'
  },
  albedo: {
    label: 'US EPA - Reducing Urban Heat Islands: Compendium of Strategies (albedo of pavements, roofs and vegetation).',
    url: 'https://www.epa.gov/heatislands/heat-island-compendium'
  },
  coolingEffect: {
    label: 'Bowler et al. 2010, Landscape and Urban Planning 97:147 - meta-analysis: urban parks are on average about 1 °C cooler than their surroundings by day.',
    url: 'https://doi.org/10.1016/j.landurbplan.2010.05.006'
  }
};

/**
 * Tile palette.
 *
 *   albedo  - fraction of sunlight reflected (DATA-range, EPA compendium; one
 *             representative value is picked per tile).
 *   shade   - fraction of the ground in shade at 3 pm (ESTIMATE).
 *   veg     - how much of the tile evaporates water, 0-1 (ESTIMATE).
 *   storage - how much daytime heat the tile gives back at night, 0-1 (ESTIMATE).
 *   canyon  - how much a tall street canyon traps night heat, 0-1 (ESTIMATE).
 *   cost    - AUD to build this tile on a 2,500 m² block (ESTIMATE, see costNote).
 *   waterKl - dry-season water use, kilolitres per day (ESTIMATE, see waterNote).
 *   people  - people who live or work on the tile (ASSUMPTION).
 *   paved   - people can walk and drive through it (roads, plazas).
 *   road    - counts as a street for the access rule.
 */
export const TILE_TYPES = {
  R: { id: 'R', label: 'Asphalt road', short: 'Road', emoji: '🛣️', color: '#3f3f46', group: 'streets',
    albedo: 0.08, shade: 0, veg: 0, storage: 0.9, canyon: 0, cost: 60000, waterKl: 0, people: 0, paved: true, road: true,
    tip: 'Black asphalt reflects under 10% of sunlight. It can pass 60 °C on a summer afternoon.' },
  C: { id: 'C', label: 'Cool-coated road', short: 'Cool road', emoji: '🩶', color: '#9ca3af', group: 'streets',
    albedo: 0.3, shade: 0, veg: 0, storage: 0.75, canyon: 0, cost: 75000, waterKl: 0, people: 0, paved: true, road: true,
    tip: 'A light coating reflects more sunlight. Cars still drive on it.' },
  E: { id: 'E', label: 'Tree-lined street', short: 'Tree street', emoji: '🌳', color: '#4d7c0f', group: 'streets',
    albedo: 0.15, shade: 0.7, veg: 0.4, storage: 0.45, canyon: 0, cost: 90000, waterKl: 2, people: 0, paved: true, road: true,
    tip: 'Street trees shade the footpath and the road. It is still a street.' },
  P: { id: 'P', label: 'Concrete plaza / car park', short: 'Plaza', emoji: '⬜', color: '#a8a29e', group: 'open',
    albedo: 0.3, shade: 0, veg: 0, storage: 0.85, canyon: 0, cost: 40000, waterKl: 0, people: 0, paved: true, road: false,
    tip: 'Paved open space. People can walk through it, but it bakes in the sun.' },
  S: { id: 'S', label: 'Plaza with shade sails', short: 'Shade sail', emoji: '⛱️', color: '#0ea5e9', group: 'open',
    albedo: 0.3, shade: 0.85, veg: 0, storage: 0.55, canyon: 0, cost: 120000, waterKl: 0, people: 0, paved: true, road: false,
    tip: 'Shade without water. Works in a drought, but nothing evaporates to cool the air.' },
  G: { id: 'G', label: 'Dry grass / bare ground', short: 'Dry grass', emoji: '🟫', color: '#b48a4a', group: 'open',
    albedo: 0.22, shade: 0, veg: 0.15, storage: 0.35, canyon: 0, cost: 5000, waterKl: 0, people: 0, paved: false, road: false,
    tip: 'Unwatered grass dries out in the Townsville dry season and gets almost as hot as concrete.' },
  K: { id: 'K', label: 'Watered park', short: 'Park', emoji: '🟩', color: '#22c55e', group: 'green',
    albedo: 0.24, shade: 0.1, veg: 0.75, storage: 0.25, canyon: 0, cost: 80000, waterKl: 12, people: 0, paved: false, road: false,
    tip: 'Green, watered grass cools by evaporation - but it needs water every day.' },
  T: { id: 'T', label: 'Tree canopy (pocket forest)', short: 'Trees', emoji: '🌲', color: '#166534', group: 'green',
    albedo: 0.18, shade: 0.9, veg: 0.8, storage: 0.2, canyon: 0, cost: 70000, waterKl: 4, people: 0, paved: false, road: false,
    tip: 'Shade AND evaporation. The strongest cooling by day - but nobody can drive through it.' },
  W: { id: 'W', label: 'Pond / wetland', short: 'Water', emoji: '💧', color: '#0284c7', group: 'green',
    albedo: 0.07, shade: 0, veg: 0, storage: 0.6, canyon: 0, cost: 250000, waterKl: 15, people: 0, paved: false, road: false, pond: true,
    tip: 'Water stays near air temperature by day, but it holds heat and stays warm at night.' },
  B: { id: 'B', label: 'Building - dark roof', short: 'Dark roof', emoji: '🏠', color: '#7f1d1d', group: 'buildings',
    albedo: 0.1, shade: 0.15, veg: 0, storage: 0.85, canyon: 0.2, cost: 0, waterKl: 0, people: 40, paved: false, road: false, building: true,
    tip: 'Homes and shops for 40 people. A dark roof gets very hot.' },
  L: { id: 'L', label: 'Building - cool white roof', short: 'Cool roof', emoji: '🏡', color: '#e2e8f0', group: 'buildings',
    albedo: 0.7, shade: 0.15, veg: 0, storage: 0.7, canyon: 0.2, cost: 50000, waterKl: 0, people: 40, paved: false, road: false, building: true,
    tip: 'Same building, white reflective roof. Cheap and uses no water.' },
  V: { id: 'V', label: 'Building - green roof', short: 'Green roof', emoji: '🪴', color: '#65a30d', group: 'buildings',
    albedo: 0.25, shade: 0.15, veg: 0.55, storage: 0.45, canyon: 0.2, cost: 450000, waterKl: 6, people: 40, paved: false, road: false, building: true,
    tip: 'Plants on the roof cool by evaporation and insulate. Expensive, and needs watering.' },
  H: { id: 'H', label: 'Tall apartment tower', short: 'Tower', emoji: '🏢', color: '#334155', group: 'buildings',
    albedo: 0.12, shade: 0.35, veg: 0, storage: 1, canyon: 1, cost: 0, waterKl: 0, people: 160, paved: false, road: false, building: true,
    tip: 'Room for 160 people on one block. Shades the street by day, traps heat at night.' }
};

export const TILE_GROUPS = [
  { id: 'streets', label: 'Streets' },
  { id: 'open', label: 'Open space' },
  { id: 'green', label: 'Green & blue' },
  { id: 'buildings', label: 'Buildings' }
];

export const DEMOLITION_COST = 150000; // ESTIMATE: clearing a building that was already there

export const COST_NOTE = 'Costs are round ESTIMATES for a 2,500 m² block in Australian dollars, chosen so the trade-offs are realistic (a green roof costs several times a cool roof). New buildings are paid for by the builder, so they cost the council nothing; better roofs and public spaces do. Knocking down a building that was already there costs $150,000 and the people who lived or worked there have to move.';
export const WATER_NOTE = 'Water use is an ESTIMATE for the dry season. A watered park needs about 5 mm of water a day: 5 mm × 2,500 m² = 12.5 kL a day. A pond loses about 6 mm a day to evaporation (15 kL). Townsville often has water restrictions in the dry season, so every scenario has a water limit.';

/**
 * Weather. The base temperatures are ESTIMATES close to a Townsville summer
 * (check the BoM link); the heatwave is an ASSUMPTION for a stress test.
 */
export const WEATHER = {
  breeze: {
    id: 'breeze', label: 'Summer day with sea breeze', emoji: '🌬️',
    airDay: 31, airNight: 25, windMs: 4, coupling: 0.06, nightCoupling: 0.8, upwind: 0.2,
    tag: 'ESTIMATE', note: 'Close to a typical Townsville summer: about 31 °C at 3 pm, 25 °C at 3 am, with a north-easterly sea breeze of about 4 m/s.'
  },
  heatwave: {
    id: 'heatwave', label: 'Heatwave, no breeze', emoji: '🔥',
    airDay: 37, airNight: 28, windMs: 1, coupling: 0.09, nightCoupling: 1.1, upwind: 0,
    tag: 'ASSUMPTION', note: 'A stress test: 37 °C at 3 pm, 28 °C at 3 am and almost no wind. Heat is not blown away, so the city holds it.'
  }
};

/** Model constants for the surface energy balance. All ESTIMATE, calibrated so
 *  asphalt reaches about 60 °C and tree shade stays near air temperature. */
export const MODEL = {
  solar: 30,        // °C a fully absorbing, unshaded, dry surface rises above air
  evap: 22,         // °C fully evaporating vegetation removes
  shadeBlock: 0.85, // a full canopy blocks 85% of direct sun
  floorBelowAir: 2, // a shaded, wet surface does not get much colder than air
  pondBelowAir: 3,  // water surface by day
  radiantSun: 8,    // extra °C a person feels standing in full sun
  radiantGround: 0.1, // per °C the ground is hotter than the air
  windCool: 0.7,    // °C per m/s of wind on a person
  nightStorage: 3.2, nightCanyon: 1.6, nightOpenVeg: 0.6, nightCanopy: 0.4, nightPond: 1.2,
  ownWeight: 0.6
};

/** UTCI heat-stress bands (DATA, Bröde et al. 2012). Lower bound in °C. */
export const STRESS_BANDS = [
  { min: 46, id: 'extreme', label: 'Extreme heat stress', color: '#7f1d1d' },
  { min: 38, id: 'very-strong', label: 'Very strong heat stress', color: '#dc2626' },
  { min: 32, id: 'strong', label: 'Strong heat stress', color: '#f97316' },
  { min: 26, id: 'moderate', label: 'Moderate heat stress', color: '#facc15' },
  { min: -Infinity, id: 'none', label: 'No heat stress', color: '#22c55e' }
];

export function stressBand(feels) {
  return STRESS_BANDS.find((b) => feels >= b.min) || STRESS_BANDS[STRESS_BANDS.length - 1];
}

const round1 = (v) => Math.round(v * 10) / 10;
const tileOf = (code) => TILE_TYPES[code] || TILE_TYPES.G;

export function neighbours(i, cols = COLS, rows = ROWS) {
  const r = Math.floor(i / cols); const c = i % cols;
  const out = [];
  if (r > 0) out.push(i - cols);
  if (r < rows - 1) out.push(i + cols);
  if (c > 0) out.push(i - 1);
  if (c < cols - 1) out.push(i + 1);
  return out;
}

/** The tile the north-east sea breeze reaches this tile from (top-right), or null. */
export function upwindOf(i, cols = COLS) {
  const r = Math.floor(i / cols); const c = i % cols;
  if (r === 0 || c === cols - 1) return null;
  return i - cols + 1;
}

/** 3 pm surface temperature of one tile - the four ideas in one line each. */
export function surfaceDay(code, weather = WEATHER.breeze) {
  const t = tileOf(code);
  const air = weather.airDay;
  if (t.pond) return air - MODEL.pondBelowAir;
  const absorbed = 1 - t.albedo;                       // idea 1: albedo
  const sunReaching = 1 - MODEL.shadeBlock * t.shade;  // idea 2: shade
  const heating = MODEL.solar * absorbed * sunReaching;
  const cooling = MODEL.evap * t.veg;                  // idea 3: evaporation
  return Math.max(air - MODEL.floorBelowAir, air + heating - cooling);
}

/** 3 am: how much heat the tile gives back (idea 4: storage), in °C of "push". */
export function nightPush(code) {
  const t = tileOf(code);
  return MODEL.nightStorage * t.storage
    + MODEL.nightCanyon * t.canyon
    + MODEL.nightCanopy * t.shade * (t.veg > 0 ? 1 : 0)
    + (t.pond ? MODEL.nightPond : 0)
    - MODEL.nightOpenVeg * t.veg * (1 - t.shade);
}

/** Mix each tile's own value with its neighbours and, on a breezy day, the tile upwind. */
function mix(values, weather) {
  return values.map((own, i) => {
    const ns = neighbours(i);
    const nAvg = ns.reduce((s, j) => s + values[j], 0) / ns.length;
    const up = upwindOf(i);
    const w = weather.upwind;
    const upVal = up === null ? own : values[up];
    const rest = 1 - MODEL.ownWeight - w;
    return MODEL.ownWeight * own + rest * nAvg + w * upVal;
  });
}

/** 3 am air temperature over open dry grass: the rural reference. */
export function countrysideNight(weatherId = 'breeze') {
  const weather = WEATHER[weatherId] || WEATHER.breeze;
  return round1(weather.airNight + weather.nightCoupling * nightPush('G'));
}

/** 3 pm air temperature over open dry grass: the rural reference by day. */
export function countrysideDay(weatherId = 'breeze') {
  const weather = WEATHER[weatherId] || WEATHER.breeze;
  return round1(weather.airDay + weather.coupling * (surfaceDay('G', weather) - weather.airDay));
}

/**
 * Heat across the whole map.
 * Returns per-tile figures and the district summary used by the readouts.
 */
export function computeHeat(grid, weatherId = 'breeze', focus = []) {
  const weather = WEATHER[weatherId] || WEATHER.breeze;
  const surf = grid.map((code) => surfaceDay(code, weather));
  const excess = mix(surf.map((s) => s - weather.airDay), weather);
  const night = mix(grid.map(nightPush), weather);

  const tiles = grid.map((code, i) => {
    const t = tileOf(code);
    const airDay = weather.airDay + weather.coupling * excess[i];
    const feels = airDay
      + MODEL.radiantSun * (1 - t.shade)
      + MODEL.radiantGround * (surf[i] - weather.airDay)
      - MODEL.windCool * weather.windMs;
    const airNight = weather.airNight + weather.nightCoupling * night[i];
    return {
      code,
      surfaceDay: round1(surf[i]),
      airDay: round1(airDay),
      feelsDay: round1(feels),
      airNight: round1(airNight),
      band: stressBand(feels).id
    };
  });

  const avg = (key, idx) => {
    const list = idx && idx.length ? idx : tiles.map((_, i) => i);
    return round1(list.reduce((s, i) => s + tiles[i][key], 0) / list.length);
  };

  let hottest = 0;
  tiles.forEach((t, i) => { if (t.feelsDay > tiles[hottest].feelsDay) hottest = i; });

  const districtNight = avg('airNight');
  return {
    countrysideNight: countrysideNight(weather.id),
    countrysideDay: countrysideDay(weather.id),
    weather: weather.id,
    tiles,
    districtSurface: avg('surfaceDay'),
    districtAirDay: avg('airDay'),
    districtFeels: avg('feelsDay'),
    districtNight,
    // The heat island is measured against countryside (dry grass), as a
    // weather station outside town would see it - not against the base air.
    nightIsland: round1(districtNight - countrysideNight(weather.id)),
    dayIsland: round1(avg('airDay') - countrysideDay(weather.id)),
    focusFeels: avg('feelsDay', focus),
    hottest: { index: hottest, feels: tiles[hottest].feelsDay }
  };
}

/**
 * Which buildings cannot be reached from the city's streets.
 *
 * Streets that touch the map edge connect to the rest of Townsville. From there
 * people can move through any paved tile (roads, plazas). A building is reached
 * if it touches a reached tile. This stops "turn the whole city into forest"
 * from being a winning design - real cities need streets.
 */
export function unreachableBuildings(grid, cols = COLS, rows = ROWS) {
  const reached = new Set();
  const queue = [];
  grid.forEach((code, i) => {
    const r = Math.floor(i / cols); const c = i % cols;
    const edge = r === 0 || r === rows - 1 || c === 0 || c === cols - 1;
    if (edge && tileOf(code).road) { reached.add(i); queue.push(i); }
  });
  while (queue.length) {
    const i = queue.shift();
    for (const j of neighbours(i, cols, rows)) {
      if (!reached.has(j) && tileOf(grid[j]).paved) { reached.add(j); queue.push(j); }
    }
  }
  return grid
    .map((code, i) => (tileOf(code).building && !neighbours(i, cols, rows).some((j) => reached.has(j)) ? i : -1))
    .filter((i) => i >= 0);
}

/** What a design costs and uses, compared with the scenario's starting map. */
export function computeBudget(grid, start) {
  let cost = 0; let changed = 0; let demolished = 0;
  grid.forEach((code, i) => {
    if (code === start[i]) return;
    changed += 1;
    cost += tileOf(code).cost;
    if (tileOf(start[i]).building && !tileOf(code).building) {
      cost += DEMOLITION_COST;
      demolished += 1;
    }
  });
  const waterKl = grid.reduce((s, code) => s + tileOf(code).waterKl, 0);
  const people = grid.reduce((s, code) => s + tileOf(code).people, 0);
  return { cost, changed, demolished, waterKl: round1(waterKl), people };
}

/** Everything the report card needs, for one design in one weather. */
export function evaluateDesign(grid, scenario, weatherId = 'breeze') {
  const heat = computeHeat(grid, weatherId, scenario.focus);
  const baseline = computeHeat(scenario.start, weatherId, scenario.focus);
  const budget = computeBudget(grid, scenario.start);
  const unreachable = unreachableBuildings(grid);

  const checks = {
    budget: budget.cost <= scenario.budget,
    water: budget.waterKl <= scenario.waterLimitKl,
    people: budget.people >= scenario.minPeople,
    access: unreachable.length === 0
  };
  const rulesMet = Object.values(checks).every(Boolean);

  const goals = scenario.goals.map((g) => {
    const value = g.metric === 'focusFeels' ? heat.focusFeels
      : g.metric === 'nightIsland' ? heat.nightIsland
        : g.metric === 'districtFeels' ? heat.districtFeels
          : null;
    return { ...g, value, met: value !== null && value <= g.target };
  });

  const stars = rulesMet ? goals.filter((g) => g.met).length : 0;

  return {
    heat,
    baseline,
    budget,
    unreachable,
    checks,
    rulesMet,
    goals,
    stars,
    change: {
      focusFeels: round1(heat.focusFeels - baseline.focusFeels),
      nightIsland: round1(heat.nightIsland - baseline.nightIsland),
      districtFeels: round1(heat.districtFeels - baseline.districtFeels)
    }
  };
}

/** The working for one tile, as sentences a learner can follow. */
export function explainTile(code, weatherId = 'breeze') {
  const weather = WEATHER[weatherId] || WEATHER.breeze;
  const t = tileOf(code);
  if (t.pond) {
    return [
      `Water heats up slowly, so its surface stays about ${MODEL.pondBelowAir} °C below the air: ${weather.airDay} − ${MODEL.pondBelowAir} = ${weather.airDay - MODEL.pondBelowAir} °C.`,
      'At night it gives that stored heat back, so ponds keep their surroundings a little warmer.'
    ];
  }
  const absorbed = 1 - t.albedo;
  const sun = 1 - MODEL.shadeBlock * t.shade;
  const heating = MODEL.solar * absorbed * sun;
  const cooling = MODEL.evap * t.veg;
  const lines = [
    `Reflects ${Math.round(t.albedo * 100)}% of sunlight, absorbs ${Math.round(absorbed * 100)}%.`,
    t.shade > 0 ? `Shade lets only ${Math.round(sun * 100)}% of the sun reach the ground.` : 'No shade: the full sun reaches the ground.',
    `Sun heating: ${MODEL.solar} × ${absorbed.toFixed(2)} × ${sun.toFixed(2)} = +${heating.toFixed(1)} °C.`,
    t.veg > 0 ? `Evaporation cooling: ${MODEL.evap} × ${t.veg} = −${cooling.toFixed(1)} °C.` : 'Nothing evaporates, so no evaporation cooling.',
    `Surface at 3 pm ≈ ${weather.airDay} + ${heating.toFixed(1)}${cooling ? ` − ${cooling.toFixed(1)}` : ''} = ${(weather.airDay + heating - cooling).toFixed(1)} °C.`
  ];
  const floor = weather.airDay - MODEL.floorBelowAir;
  if (weather.airDay + heating - cooling < floor) {
    lines.push(`But a shaded, damp surface cannot get much colder than the air around it, so the model stops at ${weather.airDay} − ${MODEL.floorBelowAir} = ${floor.toFixed(1)} °C.`);
  }
  return lines;
}

/** A blank grid of one tile type. */
export function fillGrid(code, cols = COLS, rows = ROWS) {
  return Array.from({ length: cols * rows }, () => code);
}

/** Parse a layout written as rows of tile letters, e.g. 'RRRRRRRR'. */
export function parseLayout(rows) {
  const grid = rows.join('').split('');
  if (grid.length !== COLS * ROWS) throw new Error(`Layout must be ${COLS}x${ROWS}`);
  grid.forEach((c) => { if (!TILE_TYPES[c]) throw new Error(`Unknown tile ${c}`); });
  return grid;
}

export function isValidGrid(grid) {
  return Array.isArray(grid) && grid.length === COLS * ROWS && grid.every((c) => TILE_TYPES[c]);
}

/**
 * A fair test: change ONE thing (the focus tiles) and keep everything else the
 * same as the starting map. Used to check the learner's prediction of which
 * strategy cools the focus area most. Access and budget are ignored on purpose -
 * this is an experiment, not a design.
 */
export const FAIR_TEST_OPTIONS = [
  { id: 'trees', label: 'Street trees / tree canopy', roadTile: 'E', otherTile: 'T' },
  { id: 'sails', label: 'Shade sails', roadTile: 'S', otherTile: 'S' },
  { id: 'cool', label: 'Cool, light-coloured surfaces', roadTile: 'C', otherTile: 'C' },
  { id: 'park', label: 'Watered grass', roadTile: 'K', otherTile: 'K' },
  { id: 'water', label: 'Ponds and water', roadTile: 'W', otherTile: 'W' }
];

export function fairTest(scenario, weatherId = 'breeze') {
  const before = computeHeat(scenario.start, weatherId, scenario.focus).focusFeels;
  return FAIR_TEST_OPTIONS.map((opt) => {
    const grid = scenario.start.map((code, i) => {
      if (!scenario.focus.includes(i)) return code;
      return tileOf(code).road ? opt.roadTile : opt.otherTile;
    });
    const after = computeHeat(grid, weatherId, scenario.focus).focusFeels;
    return { ...opt, before, after, change: round1(after - before) };
  }).sort((a, b) => a.change - b.change);
}

/** The n tiles that feel hottest at 3 pm on a given map. */
export function hottestTiles(grid, n = 3, weatherId = 'breeze') {
  const { tiles } = computeHeat(grid, weatherId);
  return tiles.map((t, i) => ({ i, feels: t.feelsDay }))
    .sort((a, b) => b.feels - a.feels || a.i - b.i)
    .slice(0, n)
    .map((t) => t.i);
}
