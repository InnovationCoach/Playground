/**
 * Activity 8 - Project Hex-Grid: a floating city for a drowning Bangkok.
 *
 * A theoretical systems model. Each learner owns one system (their role in the
 * project brief) but every system feeds the others: animals eat the farm's soy,
 * the desalination plant eats the solar farm's electricity, heavy fish tanks
 * push a platform towards sinking, and a biogas plant next to housing costs the
 * wellbeing lead. The point is not a "right" city; it is to make a prediction,
 * change one thing, and see what really follows - including for teammates.
 *
 * Honesty rules (same as Activities 5-7):
 *   - Every number is tagged DATA (sourced in hexGridSources.js), ESTIMATE, or
 *     ASSUMPTION, and `simulate()` returns the working for every headline figure.
 *   - Genetic modification is modelled only as a learner's theoretical
 *     multiplier, labelled ASSUMPTION. No real GM organism is implied.
 *   - This is a steady-state daily balance, not a time simulation. It leaves out
 *     weather, storms, waves, seasons, costs and much else - see LIMITATIONS.
 *
 * Pure module: no DOM, no Firebase. Tested in tests/hex-grid-model.test.js.
 */

export const MODEL_VERSION = 'HexGrid-v1.0';

// --- constants -------------------------------------------------------------

/** k = key, v = value, tag = DATA | ESTIMATE, src = key into SOURCES. */
export const K = {
  seawaterDensity:   { v: 1025, unit: 'kg/m³', tag: 'DATA', src: 'physics' },
  freshWaterDensity: { v: 1000, unit: 'kg/m³', tag: 'DATA', src: 'physics' },
  methaneKWhPerM3:   { v: 9.97, unit: 'kWh/m³', tag: 'DATA', src: 'physics' },
  sunKWhPerM2Day:    { v: 5.06, unit: 'kWh/m²/day', tag: 'DATA', src: 'thSolar' },
  proteinGPerKg:     { v: 0.83, unit: 'g/kg/day', tag: 'DATA', src: 'protein2007' },
  hydroLettuceKgM2Yr:{ v: 41, unit: 'kg/m²/yr', tag: 'DATA', src: 'barbosa2015' },
  hydroKWhPerKg:     { v: 25, unit: 'kWh/kg', tag: 'DATA', src: 'barbosa2015', note: '90,000 kJ/kg ÷ 3,600' },
  broilerFCR:        { v: 1.5, unit: 'kg feed/kg', tag: 'DATA', src: 'fcrBroiler' },
  tilapiaFCR:        { v: 1.7, unit: 'kg feed/kg', tag: 'DATA', src: 'fcrFish' },
  broilerKgM2:       { v: 33, unit: 'kg/m²', tag: 'DATA', src: 'euAnimals' },
  hensPerM2:         { v: 9, unit: 'hens/m²', tag: 'DATA', src: 'euAnimals' },
  biogasM3PerT:      { v: 150, unit: 'm³/t', tag: 'DATA', src: 'biogas', note: 'middle of 100-200' },
  methaneShare:      { v: 0.6, unit: '', tag: 'DATA', src: 'biogas', note: 'middle of 50-70%' },
  wasteOrganicShare: { v: 0.5, unit: '', tag: 'DATA', src: 'thWaste' },
  exerciseAdultMin:  { v: 150, unit: 'min/week', tag: 'DATA', src: 'who2020' },
  exerciseYouthMin:  { v: 420, unit: 'min/week', tag: 'DATA', src: 'who2020', note: '60 min × 7 days' },
  crowdingLimit:     { v: 3, unit: 'people/room', tag: 'DATA', src: 'unHabitat' },

  // Needed by the model, not verified against one source - learners may challenge.
  pvEfficiency:      { v: 0.2, unit: '', tag: 'ESTIMATE', note: 'typical modern panel' },
  pvPerformance:     { v: 0.78, unit: '', tag: 'ESTIMATE', note: 'losses from heat, dust, wiring' },
  generatorEff:      { v: 0.35, unit: '', tag: 'ESTIMATE', note: 'biogas engine, electricity only' },
  riceMilling:       { v: 0.65, unit: '', tag: 'ESTIMATE', note: 'paddy → white rice' },
  broilerBatches:    { v: 6, unit: '/yr', tag: 'ESTIMATE', note: '≈ 6-week grow-out + clean-out' },
  eggsPerHen:        { v: 300, unit: '/yr', tag: 'ESTIMATE' },
  eggKg:             { v: 0.05, unit: 'kg', tag: 'ESTIMATE' },
  henFeedKgDay:      { v: 0.11, unit: 'kg/day', tag: 'ESTIMATE' },
  tilapiaKgM3:       { v: 50, unit: 'kg/m³', tag: 'ESTIMATE', note: 'tank harvest density' },
  tilapiaCycles:     { v: 2, unit: '/yr', tag: 'ESTIMATE' },
  meatEdible:        { v: 0.7, unit: '', tag: 'ESTIMATE' },
  fishEdible:        { v: 0.35, unit: '', tag: 'ESTIMATE' },
  usableFloor:       { v: 0.7, unit: '', tag: 'ESTIMATE', note: 'share of a hex that is animal floor' },
  soilDepthM:        { v: 0.3, unit: 'm', tag: 'ESTIMATE' },
  wetSoilDensity:    { v: 1900, unit: 'kg/m³', tag: 'ESTIMATE' },
  roomM2:            { v: 12, unit: 'm²', tag: 'ESTIMATE', note: 'one habitable room' },
  activeM2:          { v: 10, unit: 'm²/person', tag: 'ESTIMATE', note: 'sports floor per exerciser' },
  sportsHoursDay:    { v: 14, unit: 'h/day', tag: 'ESTIMATE' },
  wastewaterShare:   { v: 0.8, unit: '', tag: 'ESTIMATE', note: 'of water used becomes wastewater' },
  rainCapture:       { v: 0.8, unit: '', tag: 'ESTIMATE' },
  wastewaterKWhM3:   { v: 0.5, unit: 'kWh/m³', tag: 'ESTIMATE' },
  storageWPerTB:     { v: 0.5, unit: 'W/TB', tag: 'ESTIMATE', note: 'spinning hard drives, incl. cooling' }
};

/** Mass per m² of each module's contents, on top of the platform itself. ESTIMATE. */
const LOAD_KG_M2 = {
  housingPerFloor: 350, // building + people + furniture, per storey
  hydro: 200,
  poultry: 150,
  solar: 25,
  wind: 80,
  battery: 250,
  desal: 300,
  biogas: 400,
  recycling: 200,
  wastewater: 400,
  park: 300,
  sports: 150,
  studio: 250,
  hub: 200,
  open: 50
};

export const MATERIALS = {
  concrete: { label: 'Hollow concrete', density: 2400, shellM: 0.2 },
  steel:    { label: 'Steel box',        density: 7850, shellM: 0.012 },
  hdpe:     { label: 'Recycled HDPE plastic', density: 950, shellM: 0.05 }
};

export const CROPS = {
  rice:        { label: 'Rice',          yieldTHa: 3.01, src: 'riceTh', edible: K.riceMilling.v, kcal: 365, protein: 7.1, group: 'grains', feed: true },
  sweetPotato: { label: 'Sweet potato',  yieldTHa: 12.35, src: 'sweetPotato', edible: 0.9, kcal: 86, protein: 1.6, group: 'roots' },
  soybean:     { label: 'Soybean',       yieldTHa: 2.8, src: 'soy', edible: 1, kcal: 446, protein: 36.5, group: 'legumes', feed: true },
  herbs:       { label: 'Chili & basil', yieldTHa: 0, src: null, edible: 0, kcal: 0, protein: 0, group: 'flavour' }
};

export const ANIMALS = {
  broiler: { label: 'Chickens (meat)', kcal: 119, protein: 21.4 },
  layer:   { label: 'Hens (eggs)',     kcal: 143, protein: 12.6 },
  tilapia: { label: 'Tilapia (fish tanks)', kcal: 96, protein: 20.1 }
};

/** Moderately / sedentary / active calorie needs, mean of male & female, DGA Table A2-1. */
export const GROUPS = {
  children: { label: 'Children 5-12', refAge: '9',     kcal: { low: 1500, moderate: 1700, high: 1900 }, bodyKg: 30, youth: true },
  teens:    { label: 'Teens 13-17',   refAge: '15',    kcal: { low: 2000, moderate: 2300, high: 2700 }, bodyKg: 55, youth: true },
  adults:   { label: 'Adults 18-59',  refAge: '36-40', kcal: { low: 2100, moderate: 2300, high: 2500 }, bodyKg: 62 },
  older:    { label: 'Older 60+',     refAge: '66-70', kcal: { low: 1800, moderate: 2000, high: 2300 }, bodyKg: 60 }
};

export const MODULES = {
  open:       { label: 'Open deck',         icon: '⬡',  colour: '#334155', roles: [] },
  housing:    { label: 'Housing',           icon: '🏠', colour: '#f59e0b', roles: ['infrastructure', 'wellbeing'] },
  farm:       { label: 'Soil farm',         icon: '🌾', colour: '#65a30d', roles: ['agriculture'] },
  hydro:      { label: 'Hydroponics',       icon: '🥬', colour: '#22c55e', roles: ['agriculture'] },
  livestock:  { label: 'Livestock',         icon: '🐔', colour: '#d97706', roles: ['livestock'] },
  solar:      { label: 'Solar farm',        icon: '☀️', colour: '#eab308', roles: ['energy'] },
  wind:       { label: 'Wind turbine',      icon: '🌬️', colour: '#94a3b8', roles: ['energy'] },
  battery:    { label: 'Battery store',     icon: '🔋', colour: '#0ea5e9', roles: ['energy'] },
  desal:      { label: 'Desalination',      icon: '💧', colour: '#38bdf8', roles: ['infrastructure', 'energy'] },
  biogas:     { label: 'Biogas digester',   icon: '♻️', colour: '#a16207', roles: ['waste'] },
  recycling:  { label: 'Recycling centre',  icon: '🔁', colour: '#78716c', roles: ['waste'] },
  wastewater: { label: 'Wastewater plant',  icon: '🚰', colour: '#0369a1', roles: ['waste'] },
  park:       { label: 'Park & garden',     icon: '🌳', colour: '#15803d', roles: ['wellbeing', 'nutrition'] },
  sports:     { label: 'Sports court',      icon: '⚽', colour: '#10b981', roles: ['nutrition', 'wellbeing'] },
  studio:     { label: 'Studio & archive',  icon: '🎙️', colour: '#a855f7', roles: ['entertainment'] },
  hub:        { label: 'Transport hub',     icon: '⛴️', colour: '#ef4444', roles: ['energy', 'infrastructure'] }
};

/** Modules that bother neighbours (smell, noise, machinery). ASSUMPTION of the model. */
export const NUISANCE = new Set(['biogas', 'wastewater', 'livestock', 'recycling']);

/** Per-hex capacity of plants, and fixed electricity loads. ESTIMATE. */
const PLANT = {
  desalM3Day: 400,
  biogasTDay: 5,
  recyclingTDay: 3,
  wastewaterM3Day: 400,
  batteryKWh: 4000,
  studioKWhDay: 150,
  hubKWhDay: 300,
  sportsKWhDay: 40,
  recyclingKWhPerT: 50
};

// --- roles (from the Project Hex-Grid brief) ---------------------------------

export const ROLES = {
  livestock: {
    title: 'Livestock', icon: '🐔',
    deliverables: ['Choose what animals to raise', 'Design blueprint for animal living space', 'Plan how animals could be genetically modified to live on the platforms'],
    metrics: ['proteinCoverage', 'feedMet', 'animalProteinKgDay', 'maxLoad'],
    params: ['animalGM', 'importFeedKgDay']
  },
  agriculture: {
    title: 'Agriculture', icon: '🌾',
    deliverables: ['Choose many kinds of plants (not just chili and basil!)', 'Design blueprint for the plant farm', 'Plan how plants could be genetically modified to grow anywhere'],
    metrics: ['kcalCoverage', 'foodGroups', 'energyCoverage', 'maxLoad'],
    params: ['cropGM', 'harvestsPerYear']
  },
  nutrition: {
    title: 'Nutrition & Physical Health', icon: '🥗',
    deliverables: ['Calculate nutritional needs of the population', 'Calculate physical needs', 'Create meal plans for groups', 'Integrate exercise and physical activity'],
    metrics: ['kcalCoverage', 'proteinCoverage', 'exerciseCoverage', 'foodGroups'],
    params: ['population', 'mix', 'activity']
  },
  waste: {
    title: 'Waste Management', icon: '♻️',
    deliverables: ['Solid, liquid and air waste', 'Convert waste processes into energy', 'Plastic, paper and garbage management'],
    metrics: ['wasteManaged', 'wastewaterTreated', 'biogasKWh', 'nuisanceHomes'],
    params: ['wasteKgPerPerson', 'recyclableShare']
  },
  entertainment: {
    title: 'Entertainment', icon: '🎙️',
    deliverables: ['Design recording studio & spaces', 'Choose media to archive'],
    metrics: ['archiveTB', 'archiveKWh', 'cultureSpace', 'energyCoverage'],
    params: ['archiveAudioHours', 'archiveVideoHours']
  },
  energy: {
    title: 'Energy & Electrical Engineering', icon: '⚡',
    deliverables: ['Design vehicles / transport on platforms', 'Design the electrical grid', 'Plan the solar / wind platforms'],
    metrics: ['energyCoverage', 'nightCoverage', 'energySurplus', 'maxWalk'],
    params: ['kWhPerPerson', 'rooftopSolar', 'windCapacityFactor']
  },
  infrastructure: {
    title: 'Infrastructure & Electrical Engineering', icon: '🏗️',
    deliverables: ['Map roads and housing', 'Design floating platform schematic', 'Measure weight distribution', 'Plan around waste and farming systems'],
    metrics: ['maxLoad', 'overloaded', 'tilt', 'housingShortfall'],
    params: ['hexSide', 'pontoonDepth', 'material', 'floors']
  },
  wellbeing: {
    title: 'Emotional Wellbeing', icon: '💚',
    deliverables: ['An operational framework for group cooperation and emotional wellbeing'],
    metrics: ['peoplePerRoom', 'greenPerPerson', 'nuisanceHomes', 'maxWalk'],
    params: ['m2PerPerson']
  }
};

// --- metrics catalogue ---------------------------------------------------------

/** better: which direction is good for the city. */
export const METRICS = {
  energyCoverage:     { label: 'Electricity made ÷ needed', unit: '%', better: 'higher' },
  energySurplus:      { label: 'Electricity surplus', unit: 'kWh/day', better: 'higher' },
  nightCoverage:      { label: 'Night-time power covered', unit: '%', better: 'higher' },
  kcalCoverage:       { label: 'Food energy grown ÷ needed', unit: '%', better: 'higher' },
  proteinCoverage:    { label: 'Protein grown ÷ needed', unit: '%', better: 'higher' },
  animalProteinKgDay: { label: 'Animal protein produced', unit: 'kg/day', better: 'higher' },
  feedMet:            { label: 'Animal feed available', unit: '%', better: 'higher' },
  foodGroups:         { label: 'Food groups grown (of 5)', unit: '', better: 'higher' },
  waterCoverage:      { label: 'Fresh water supplied ÷ needed', unit: '%', better: 'higher' },
  wasteManaged:       { label: 'Solid waste processed on the city', unit: '%', better: 'higher' },
  wastewaterTreated:  { label: 'Wastewater treated', unit: '%', better: 'higher' },
  biogasKWh:          { label: 'Electricity from waste', unit: 'kWh/day', better: 'higher' },
  maxLoad:            { label: 'Most loaded platform (% of its safe load)', unit: '%', better: 'lower' },
  overloaded:         { label: 'Platforms over safe load', unit: 'hexes', better: 'lower' },
  tilt:               { label: 'Weight off-centre', unit: 'm', better: 'lower' },
  housingShortfall:   { label: 'People without a home', unit: 'people', better: 'lower' },
  peoplePerRoom:      { label: 'People per room', unit: '', better: 'lower' },
  greenPerPerson:     { label: 'Green & sports space', unit: 'm²/person', better: 'higher' },
  exerciseCoverage:   { label: 'Exercise space for WHO minutes', unit: '%', better: 'higher' },
  nuisanceHomes:      { label: 'Homes next to smelly/noisy plants', unit: 'hexes', better: 'lower' },
  maxWalk:            { label: 'Longest walk home → transport hub', unit: 'm', better: 'lower' },
  archiveTB:          { label: 'Media archive size', unit: 'TB', better: null },
  archiveKWh:         { label: 'Archive electricity', unit: 'kWh/day', better: 'lower' },
  cultureSpace:       { label: 'Studio & culture space', unit: 'm²/person', better: 'higher' }
};

export const LIMITATIONS = [
  'A daily average: no seasons, storms, cloudy weeks, waves or tides.',
  'Water for crops and animals, manure, and air pollution are not counted.',
  'Calorie needs use US reference body sizes; Thai averages are smaller.',
  'The 0.83 g/kg protein figure is for adults; children need a little more per kg.',
  'Platforms are checked one at a time; the connections between them are not.',
  'Genetic modification is only your idea, typed in as a multiplier - not data.',
  'No money: nothing here says whether the city is affordable.'
];

// --- geometry -----------------------------------------------------------------

export const GRID_RADIUS = 3;
export const DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];

export function gridCells(radius = GRID_RADIUS) {
  const cells = [];
  for (let q = -radius; q <= radius; q++) {
    for (let r = Math.max(-radius, -q - radius); r <= Math.min(radius, -q + radius); r++) cells.push({ q, r });
  }
  return cells;
}

export const hexKey = (q, r) => `${q},${r}`;
export const hexDistance = (a, b) => (Math.abs(a.q - b.q) + Math.abs(a.r - b.r) + Math.abs(a.q + a.r - b.q - b.r)) / 2;
export const hexArea = (side) => (3 * Math.sqrt(3) / 2) * side * side;

/** Pointy-top axial → metres from the city centre. */
export function hexCentre(q, r, side) {
  return { x: side * Math.sqrt(3) * (q + r / 2), y: side * 1.5 * r };
}

// --- learner-controlled settings ------------------------------------------------

/**
 * Every setting a learner can move. `tag` says what kind of number it is; a
 * DATA default is a published figure the learner may still change to test an idea.
 */
export const PARAMS = {
  hexSide:            { label: 'Hex side length', unit: 'm', min: 10, max: 40, step: 1, tag: 'ASSUMPTION' },
  pontoonDepth:       { label: 'Pontoon depth', unit: 'm', min: 1, max: 5, step: 0.25, tag: 'ASSUMPTION' },
  material:           { label: 'Platform material', options: Object.fromEntries(Object.entries(MATERIALS).map(([k, m]) => [k, m.label])), tag: 'ASSUMPTION' },
  reserve:            { label: 'Pontoon kept above water (safety)', unit: '%', min: 0.1, max: 0.5, step: 0.05, pct: true, tag: 'ASSUMPTION' },
  population:         { label: 'Population', unit: 'people', min: 50, max: 3000, step: 50, tag: 'ASSUMPTION' },
  activity:           { label: 'How active people are', options: { low: 'Sedentary', moderate: 'Moderately active', high: 'Active' }, tag: 'DATA', src: 'dga' },
  m2PerPerson:        { label: 'Home floor space per person', unit: 'm²', min: 8, max: 50, step: 1, tag: 'ASSUMPTION' },
  kWhPerPerson:       { label: 'Electricity per person', unit: 'kWh/day', min: 1, max: 15, step: 0.1, tag: 'DATA', src: 'thElectricity', hint: 'Default 8.3 = Thailand average incl. industry; homes alone use less' },
  waterLPerPerson:    { label: 'Water per person', unit: 'L/day', min: 20, max: 200, step: 5, tag: 'DATA', src: 'water', hint: 'UN: 50-100 L' },
  wasteKgPerPerson:   { label: 'Rubbish per person', unit: 'kg/day', min: 0.3, max: 2, step: 0.05, tag: 'DATA', src: 'thWaste' },
  recyclableShare:    { label: 'Share of rubbish that is recyclable', unit: '%', min: 0, max: 0.5, step: 0.05, pct: true, tag: 'ASSUMPTION' },
  rainMm:             { label: 'Rainfall', unit: 'mm/yr', min: 1000, max: 2000, step: 50, tag: 'DATA', src: 'rainBkk' },
  nightShare:         { label: 'Electricity used after dark', unit: '%', min: 0.2, max: 0.8, step: 0.05, pct: true, tag: 'ESTIMATE' },
  rooftopSolar:       { label: 'Solar panels on housing roofs', bool: true, tag: 'ASSUMPTION' },
  windKW:             { label: 'Wind turbine size', unit: 'kW each', min: 10, max: 2000, step: 10, tag: 'ASSUMPTION' },
  windCapacityFactor: { label: 'Wind capacity factor (from your research)', unit: '', min: 0, max: 0.6, step: 0.01, nullable: true, tag: 'ASSUMPTION', hint: 'Leave empty until you have a source' },
  cropGM:             { label: 'Crop GM idea: yield ×', unit: '×', min: 0.5, max: 3, step: 0.1, tag: 'ASSUMPTION', hint: 'Hypothetical - your theory, not data' },
  animalGM:           { label: 'Animal GM idea: growth ×', unit: '×', min: 0.5, max: 3, step: 0.1, tag: 'ASSUMPTION', hint: 'Hypothetical - your theory, not data' },
  harvestsPerYear:    { label: 'Harvests per year', unit: '', min: 1, max: 3, step: 1, tag: 'ASSUMPTION' },
  importFeedKgDay:    { label: 'Animal feed shipped in', unit: 'kg/day', min: 0, max: 20000, step: 100, tag: 'ASSUMPTION' },
  archiveAudioHours:  { label: 'Audio to archive', unit: 'hours', min: 0, max: 100000, step: 500, tag: 'ASSUMPTION' },
  archiveVideoHours:  { label: 'Video to archive', unit: 'hours', min: 0, max: 50000, step: 500, tag: 'ASSUMPTION' },
  greenTarget:        { label: 'Team target: green space per person', unit: 'm²', min: 1, max: 30, step: 1, tag: 'ASSUMPTION' }
};

// --- city ----------------------------------------------------------------------

export function defaultParams() {
  return {
    hexSide: 25,
    pontoonDepth: 2.5,
    material: 'hdpe',
    reserve: 0.3,
    population: 500,
    mix: { children: 0.15, teens: 0.1, adults: 0.6, older: 0.15 },
    activity: 'moderate',
    m2PerPerson: 20,
    kWhPerPerson: 8.3, // 3,032 kWh/yr ÷ 365 - national average incl. industry
    waterLPerPerson: 100,
    wasteKgPerPerson: 1.15,
    recyclableShare: 0.3,
    rainMm: 1650,
    nightShare: 0.5,
    rooftopSolar: false,
    windKW: 100,
    windCapacityFactor: null,
    cropGM: 1,
    animalGM: 1,
    importFeedKgDay: 0,
    harvestsPerYear: 2,
    archiveAudioHours: 5000,
    archiveVideoHours: 2000,
    greenTarget: 10
  };
}

/** Where a starter city puts things. Ring 0 = centre. */
const STARTER = {
  '0,0': { type: 'hub' },
  '1,0': { type: 'housing', floors: 3 }, '0,1': { type: 'housing', floors: 3 }, '-1,1': { type: 'housing', floors: 3 },
  '-1,0': { type: 'housing', floors: 3 }, '0,-1': { type: 'park' }, '1,-1': { type: 'sports' },
  '2,-2': { type: 'solar' }, '2,-1': { type: 'solar' }, '2,0': { type: 'farm', crop: 'rice' },
  '1,1': { type: 'farm', crop: 'soybean' }, '0,2': { type: 'farm', crop: 'sweetPotato' }, '-1,2': { type: 'hydro' },
  '-2,2': { type: 'livestock', animal: 'layer' }, '-2,1': { type: 'biogas' }, '-2,0': { type: 'wastewater' },
  '-1,-1': { type: 'desal' }, '0,-2': { type: 'studio' }, '1,-2': { type: 'battery' },
  '3,-3': { type: 'solar' }, '3,-2': { type: 'solar' }, '3,-1': { type: 'solar' }, '3,0': { type: 'solar' },
  '-3,3': { type: 'recycling' }, '2,1': { type: 'farm', crop: 'rice' }, '1,2': { type: 'farm', crop: 'soybean' }
};

export function starterCity() {
  const hexes = gridCells().map(({ q, r }) => ({ q, r, ...(STARTER[hexKey(q, r)] || { type: 'open' }) }));
  return { params: defaultParams(), hexes };
}

/** Fill in any field a stored city is missing, so old saves open after an upgrade. */
export function normaliseCity(city) {
  const base = starterCity();
  if (!city || typeof city !== 'object') return base;
  const params = { ...base.params, ...(city.params || {}) };
  params.mix = { ...base.params.mix, ...(city.params?.mix || {}) };
  const stored = new Map((city.hexes || []).map((h) => [hexKey(h.q, h.r), h]));
  const hexes = gridCells().map(({ q, r }) => {
    const h = stored.get(hexKey(q, r));
    return h && MODULES[h.type] ? { ...h, q, r } : { q, r, type: 'open' };
  });
  return { params, hexes };
}

// --- simulation ---------------------------------------------------------------

const pct = (a, b) => (b > 0 ? (a / b) * 100 : a > 0 ? 100 : 0);
const r1 = (v) => Math.round(v * 10) / 10;
const r0 = (v) => Math.round(v);
const fmt = (v) => (Math.abs(v) >= 100 ? r0(v).toLocaleString('en-US') : r1(v).toLocaleString('en-US'));

/**
 * Run the city for one average day.
 * Returns { metrics, workings, hexes, flags, needs, supply }.
 * `workings[metric]` is a list of { text, tag?, src? } lines - the formula with
 * the learner's own numbers substituted, as in the Solar Car readout.
 */
export function simulate(cityIn) {
  const city = normaliseCity(cityIn);
  const p = city.params;
  const side = Math.max(5, Number(p.hexSide) || 25);
  const A = hexArea(side);
  const pop = Math.max(0, Math.round(Number(p.population) || 0));
  const W = {};
  const flags = [];
  const count = (t) => city.hexes.filter((h) => h.type === t).length;

  // People -----------------------------------------------------------------
  const mixTotal = Object.values(p.mix).reduce((s, v) => s + (Number(v) || 0), 0) || 1;
  const people = Object.fromEntries(Object.keys(GROUPS).map((g) => [g, pop * (Number(p.mix[g]) || 0) / mixTotal]));
  const act = ['low', 'moderate', 'high'].includes(p.activity) ? p.activity : 'moderate';
  const kcalNeed = Object.entries(people).reduce((s, [g, n]) => s + n * GROUPS[g].kcal[act], 0);
  const proteinNeedG = Object.entries(people).reduce((s, [g, n]) => s + n * GROUPS[g].bodyKg * K.proteinGPerKg.v, 0);

  // Food: crops -------------------------------------------------------------
  const harvests = Math.max(1, Math.min(3, Number(p.harvestsPerYear) || 1));
  const cropGM = Math.max(0.5, Number(p.cropGM) || 1);
  const cropKgDay = { rice: 0, sweetPotato: 0, soybean: 0, herbs: 0 };
  for (const h of city.hexes.filter((x) => x.type === 'farm')) {
    const crop = CROPS[h.crop] ? h.crop : 'rice';
    cropKgDay[crop] += (CROPS[crop].yieldTHa * 1000 / 10000) * A * harvests * cropGM / 365;
  }
  const lettuceKgDay = count('hydro') * A * K.hydroLettuceKgM2Yr.v * cropGM / 365;

  // Food: animals, and the feed they take from the farm ------------------------
  const animalGM = Math.max(0.5, Number(p.animalGM) || 1);
  const floor = A * K.usableFloor.v;
  let broilerLiveKgDay = 0; let hens = 0; let fishLiveKgDay = 0;
  for (const h of city.hexes.filter((x) => x.type === 'livestock')) {
    const a = ANIMALS[h.animal] ? h.animal : 'broiler';
    if (a === 'broiler') broilerLiveKgDay += floor * K.broilerKgM2.v * K.broilerBatches.v * animalGM / 365;
    if (a === 'layer') hens += floor * K.hensPerM2.v;
    if (a === 'tilapia') fishLiveKgDay += floor * 1.2 * K.tilapiaKgM3.v * K.tilapiaCycles.v * animalGM / 365;
  }
  const feedNeed = broilerLiveKgDay * K.broilerFCR.v + hens * K.henFeedKgDay.v + fishLiveKgDay * K.tilapiaFCR.v;
  // Animals eat soy first, then rice (paddy weight). Whatever they eat, people cannot.
  // Shipped-in feed is used first, so the city's own crops stay for people.
  const importFeed = Math.max(0, Number(p.importFeedKgDay) || 0);
  const feedAvail = cropKgDay.soybean + cropKgDay.rice + importFeed;
  const feedMetFrac = feedNeed > 0 ? Math.min(1, feedAvail / feedNeed) : 1;
  let feedLeft = Math.max(0, Math.min(feedNeed, feedAvail) - importFeed);
  const soyToAnimals = Math.min(cropKgDay.soybean, feedLeft); feedLeft -= soyToAnimals;
  const riceToAnimals = Math.min(cropKgDay.rice, feedLeft);
  if (feedNeed > 0 && feedMetFrac < 1) flags.push({ role: 'livestock', text: `Animals are hungry: the farm grows only ${r0(feedMetFrac * 100)}% of the feed they need. They produce that much less.` });

  const eggsKgDay = hens * K.eggsPerHen.v * K.eggKg.v * animalGM / 365 * feedMetFrac;
  const meatKgDay = broilerLiveKgDay * K.meatEdible.v * feedMetFrac;
  const fishKgDay = fishLiveKgDay * K.fishEdible.v * feedMetFrac;

  const foods = [
    { name: 'Rice', kg: (cropKgDay.rice - riceToAnimals) * CROPS.rice.edible, ...CROPS.rice },
    { name: 'Sweet potato', kg: cropKgDay.sweetPotato * CROPS.sweetPotato.edible, ...CROPS.sweetPotato },
    { name: 'Soybean', kg: (cropKgDay.soybean - soyToAnimals) * CROPS.soybean.edible, ...CROPS.soybean },
    { name: 'Lettuce', kg: lettuceKgDay, kcal: 15, protein: 1.4, group: 'vegetables' },
    { name: 'Chicken', kg: meatKgDay, ...ANIMALS.broiler, group: 'animal' },
    { name: 'Eggs', kg: eggsKgDay, ...ANIMALS.layer, group: 'animal' },
    { name: 'Tilapia', kg: fishKgDay, ...ANIMALS.tilapia, group: 'animal' }
  ];
  const kcalGrown = foods.reduce((s, f) => s + f.kg * 10 * f.kcal, 0);
  const proteinGrownG = foods.reduce((s, f) => s + f.kg * 10 * f.protein, 0);
  const animalProteinKg = foods.filter((f) => f.group === 'animal').reduce((s, f) => s + f.kg * f.protein / 100, 0);
  const groups = new Set(foods.filter((f) => f.kg > 0.01 && f.group !== 'flavour').map((f) => f.group));
  if (count('farm') > 0 && city.hexes.filter((h) => h.type === 'farm').every((h) => h.crop === 'herbs')) {
    flags.push({ role: 'agriculture', text: 'Only chili and basil! Tasty, but they are counted as flavour, not food energy.' });
  }

  // Water -----------------------------------------------------------------------
  const waterNeedM3 = pop * (Number(p.waterLPerPerson) || 0) / 1000;
  const roofTypes = new Set(['housing', 'hub', 'studio', 'sports', 'recycling', 'battery']);
  const roofArea = city.hexes.filter((h) => roofTypes.has(h.type)).length * A;
  const rainM3 = roofArea * (Number(p.rainMm) || 0) / 1000 * K.rainCapture.v / 365;
  const desalCap = count('desal') * PLANT.desalM3Day;
  const desalM3 = Math.min(desalCap, Math.max(0, waterNeedM3 - rainM3));
  const waterSupplied = rainM3 + desalM3;

  // Waste ----------------------------------------------------------------------
  const wasteT = pop * (Number(p.wasteKgPerPerson) || 0) / 1000;
  const organicT = wasteT * K.wasteOrganicShare.v;
  const recyclableT = wasteT * Math.min(1 - K.wasteOrganicShare.v, Math.max(0, Number(p.recyclableShare) || 0));
  const digestedT = Math.min(organicT, count('biogas') * PLANT.biogasTDay);
  const recycledT = Math.min(recyclableT, count('recycling') * PLANT.recyclingTDay);
  const biogasKWh = digestedT * K.biogasM3PerT.v * K.methaneShare.v * K.methaneKWhPerM3.v * K.generatorEff.v;
  const wastewaterM3 = Math.min(waterSupplied, waterNeedM3) * K.wastewaterShare.v;
  const treatedM3 = Math.min(wastewaterM3, count('wastewater') * PLANT.wastewaterM3Day);

  // Media archive (Entertainment) ----------------------------------------------
  // Bit-rate arithmetic: MP3 at 320 kbit/s; 1080p video at 5 Mbit/s (ESTIMATE).
  const audioTB = (Number(p.archiveAudioHours) || 0) * 320e3 * 3600 / 8 / 1e12;
  const videoTB = (Number(p.archiveVideoHours) || 0) * 5e6 * 3600 / 8 / 1e12;
  const archiveTB = count('studio') > 0 ? audioTB + videoTB : 0;
  const archiveKWh = archiveTB * K.storageWPerTB.v * 24 / 1000;

  // Energy ---------------------------------------------------------------------
  const pvPerM2 = K.sunKWhPerM2Day.v * K.pvEfficiency.v * K.pvPerformance.v;
  const solarArea = count('solar') * A * 0.85 + (p.rooftopSolar ? count('housing') * A * 0.6 : 0);
  const solarKWh = solarArea * pvPerM2;
  const cf = p.windCapacityFactor === null || p.windCapacityFactor === '' ? null : Number(p.windCapacityFactor);
  const windKWh = count('wind') > 0 && Number.isFinite(cf) ? count('wind') * (Number(p.windKW) || 0) * cf * 24 : 0;
  if (count('wind') > 0 && !Number.isFinite(cf)) {
    flags.push({ role: 'energy', text: 'Wind turbines make 0 kWh until you enter a capacity factor from your own research (Gulf of Thailand winds are gentle - find the data!).' });
  }
  const demand = {
    homes: pop * (Number(p.kWhPerPerson) || 0),
    hydroponics: lettuceKgDay * K.hydroKWhPerKg.v,
    desalination: desalM3 * 3.5,
    wastewater: treatedM3 * K.wastewaterKWhM3.v,
    recycling: recycledT * PLANT.recyclingKWhPerT,
    studio: count('studio') * PLANT.studioKWhDay + archiveKWh,
    transport: count('hub') * PLANT.hubKWhDay,
    sports: count('sports') * PLANT.sportsKWhDay
  };
  const demandKWh = Object.values(demand).reduce((s, v) => s + v, 0);
  const supplyKWh = solarKWh + windKWh + biogasKWh;
  // Solar only works by day; wind and biogas run around the clock. A battery can
  // only give back at night what the daytime surplus put into it.
  const night = Math.min(0.9, Math.max(0.1, Number(p.nightShare) || 0.5));
  const steadyKWh = windKWh + biogasKWh;
  const nightNeed = demandKWh * night;
  const daySurplus = Math.max(0, solarKWh + steadyKWh * (1 - night) - demandKWh * (1 - night));
  const batteryKWh = Math.min(count('battery') * PLANT.batteryKWh, daySurplus);
  const nightUsable = steadyKWh * night + batteryKWh;

  // Platforms: buoyancy and weight -------------------------------------------------
  const mat = MATERIALS[p.material] || MATERIALS.hdpe;
  const depth = Math.max(0.5, Number(p.pontoonDepth) || 2);
  const structureKgM2 = 2 * mat.shellM * mat.density;
  const displacementKg = A * depth * K.seawaterDensity.v;
  const safeKg = displacementKg * (1 - p.reserve) - structureKgM2 * A;

  const hexResults = city.hexes.map((h) => {
    let kgM2;
    switch (h.type) {
      case 'housing': kgM2 = LOAD_KG_M2.housingPerFloor * Math.max(1, Math.min(8, Number(h.floors) || 1)); break;
      case 'farm': kgM2 = K.soilDepthM.v * K.wetSoilDensity.v; break;
      case 'livestock': kgM2 = h.animal === 'tilapia' ? K.usableFloor.v * 1.2 * K.freshWaterDensity.v + 100 : LOAD_KG_M2.poultry; break;
      default: kgM2 = LOAD_KG_M2[h.type] ?? LOAD_KG_M2.open;
    }
    if (h.type === 'housing' && p.rooftopSolar) kgM2 += LOAD_KG_M2.solar * 0.6;
    const loadKg = kgM2 * A;
    const use = safeKg > 0 ? loadKg / safeKg : Infinity;
    return { ...h, kgM2, loadKg, use: use * 100, pos: hexCentre(h.q, h.r, side) };
  });
  if (safeKg <= 0) flags.push({ role: 'infrastructure', text: 'The empty platform already sits too low: make the pontoon deeper or the material lighter.' });
  const maxLoad = Math.max(...hexResults.map((h) => h.use));
  const overloaded = hexResults.filter((h) => h.use > 100).length;
  const totalLoad = hexResults.reduce((s, h) => s + h.loadKg, 0);
  const cx = hexResults.reduce((s, h) => s + h.loadKg * h.pos.x, 0) / (totalLoad || 1);
  const cy = hexResults.reduce((s, h) => s + h.loadKg * h.pos.y, 0) / (totalLoad || 1);
  const tilt = Math.hypot(cx, cy);

  // Housing & wellbeing -----------------------------------------------------------
  const housingHexes = hexResults.filter((h) => h.type === 'housing');
  const floorArea = housingHexes.reduce((s, h) => s + A * (Number(h.floors) || 1), 0);
  const homesFor = floorArea / Math.max(5, Number(p.m2PerPerson) || 20);
  const housed = Math.min(pop, homesFor);
  const rooms = floorArea / K.roomM2.v;
  const peoplePerRoom = rooms > 0 ? housed / rooms : 0;
  const greenArea = (count('park') + count('sports')) * A;
  const youth = people.children + people.teens;
  const adultsAll = people.adults + people.older;
  const exerciseNeedMin = adultsAll * K.exerciseAdultMin.v + youth * K.exerciseYouthMin.v;
  const exerciseCapMin = (count('sports') * A + count('park') * A * 0.5) / K.activeM2.v * K.sportsHoursDay.v * 60 * 7;

  const byKey = new Map(hexResults.map((h) => [hexKey(h.q, h.r), h]));
  const neighbours = (h) => DIRS.map(([dq, dr]) => byKey.get(hexKey(h.q + dq, h.r + dr))).filter(Boolean);
  const nuisanceHomes = housingHexes.filter((h) => neighbours(h).some((n) => NUISANCE.has(n.type))).length;
  const hubs = hexResults.filter((h) => h.type === 'hub');
  const walkHexes = housingHexes.length && hubs.length
    ? Math.max(...housingHexes.map((h) => Math.min(...hubs.map((b) => hexDistance(h, b)))))
    : (housingHexes.length ? Infinity : 0);
  const maxWalk = walkHexes === Infinity ? Infinity : walkHexes * Math.sqrt(3) * side;
  if (housingHexes.length && !hubs.length) flags.push({ role: 'energy', text: 'No transport hub: nobody can get on or off the city.' });

  const metrics = {
    energyCoverage: pct(supplyKWh, demandKWh),
    energySurplus: supplyKWh - demandKWh,
    nightCoverage: pct(nightUsable, nightNeed),
    kcalCoverage: pct(kcalGrown, kcalNeed),
    proteinCoverage: pct(proteinGrownG, proteinNeedG),
    animalProteinKgDay: animalProteinKg,
    feedMet: feedMetFrac * 100,
    foodGroups: groups.size,
    waterCoverage: pct(waterSupplied, waterNeedM3),
    wasteManaged: pct(digestedT + recycledT, wasteT),
    wastewaterTreated: pct(treatedM3, wastewaterM3),
    biogasKWh,
    maxLoad,
    overloaded,
    tilt,
    housingShortfall: Math.max(0, pop - homesFor),
    peoplePerRoom,
    greenPerPerson: pop > 0 ? greenArea / pop : 0,
    exerciseCoverage: pct(exerciseCapMin, exerciseNeedMin),
    nuisanceHomes,
    maxWalk,
    archiveTB,
    archiveKWh,
    cultureSpace: pop > 0 ? count('studio') * A / pop : 0
  };

  // How much farmland would feeding everyone take? Derived only from the data above.
  if (pop > 0 && metrics.kcalCoverage < 50) {
    const spKcalPerHex = (CROPS.sweetPotato.yieldTHa / 10) * A * harvests * cropGM / 365 * CROPS.sweetPotato.edible * 10 * CROPS.sweetPotato.kcal;
    flags.push({
      role: 'agriculture',
      text: `Food grown covers ${r0(metrics.kcalCoverage)}% of calories. Even sweet potato - the highest-calorie crop here - would need about ${fmt(kcalNeed / spKcalPerHex)} farm hexes to feed ${fmt(pop)} people. Where will the rest come from?`
    });
  }

  // Workings: the formula with the learner's numbers, tagged. -------------------------
  const tag = (key) => ({ tag: K[key].tag, src: K[key].src });
  W.energyCoverage = [
    { text: `Solar: ${fmt(solarArea)} m² of panels × ${K.sunKWhPerM2Day.v} kWh/m²/day sun`, ...tag('sunKWhPerM2Day') },
    { text: `  × ${K.pvEfficiency.v * 100}% panel efficiency × ${K.pvPerformance.v * 100}% after losses = ${fmt(solarKWh)} kWh/day`, tag: 'ESTIMATE' },
    { text: `Wind: ${fmt(windKWh)} kWh/day${cf === null ? ' (no capacity factor entered)' : ` (capacity factor ${cf})`}`, tag: 'ASSUMPTION' },
    { text: `Waste → biogas: ${fmt(biogasKWh)} kWh/day (see waste)`, tag: 'DATA', src: 'biogas' },
    { text: `Needed: homes ${fmt(pop)} × ${p.kWhPerPerson} kWh = ${fmt(demand.homes)}; hydroponics ${fmt(demand.hydroponics)}; desalination ${fmt(demand.desalination)}; others ${fmt(demand.wastewater + demand.recycling + demand.studio + demand.transport + demand.sports)}`, tag: 'DATA', src: 'thElectricity' },
    { text: `${fmt(supplyKWh)} made ÷ ${fmt(demandKWh)} needed = ${r0(metrics.energyCoverage)}%` }
  ];
  W.energySurplus = W.energyCoverage;
  W.nightCoverage = [
    { text: `${r0(night * 100)}% of use happens after dark = ${fmt(nightNeed)} kWh`, tag: 'ESTIMATE' },
    { text: `Daytime surplus to charge batteries: ${fmt(daySurplus)} kWh; battery space ${count('battery')} × ${fmt(PLANT.batteryKWh)} kWh → ${fmt(batteryKWh)} kWh stored`, tag: 'ESTIMATE' },
    { text: `Wind & biogas at night: ${fmt(steadyKWh * night)} kWh` },
    { text: `${fmt(nightUsable)} ÷ ${fmt(nightNeed)} = ${r0(metrics.nightCoverage)}%` }
  ];
  W.kcalCoverage = [
    { text: `Need: ${Object.entries(people).map(([g, n]) => `${r0(n)} ${GROUPS[g].label.split(' ')[0].toLowerCase()} × ${GROUPS[g].kcal[act]}`).join(' + ')} = ${fmt(kcalNeed)} kcal/day (${act} activity)`, tag: 'DATA', src: 'dga' },
    ...foods.filter((f) => f.kg > 0.01).map((f) => ({ text: `${f.name}: ${fmt(f.kg)} kg/day × ${f.kcal} kcal/100 g = ${fmt(f.kg * 10 * f.kcal)} kcal`, tag: 'DATA', src: 'usda' })),
    { text: `Harvests per year: ${harvests}; crop GM multiplier ×${cropGM}`, tag: 'ASSUMPTION' },
    { text: `${fmt(kcalGrown)} ÷ ${fmt(kcalNeed)} = ${r0(metrics.kcalCoverage)}%` }
  ];
  W.proteinCoverage = [
    { text: `Need: body mass × ${K.proteinGPerKg.v} g/kg = ${fmt(proteinNeedG / 1000)} kg protein/day`, ...tag('proteinGPerKg') },
    { text: `Body masses (child ${GROUPS.children.bodyKg}, teen ${GROUPS.teens.bodyKg}, adult ${GROUPS.adults.bodyKg}, older ${GROUPS.older.bodyKg} kg)`, tag: 'ESTIMATE' },
    { text: `Grown: ${fmt(proteinGrownG / 1000)} kg protein/day → ${r0(metrics.proteinCoverage)}%`, tag: 'DATA', src: 'usda' }
  ];
  W.animalProteinKgDay = [
    { text: `Chickens: floor ${fmt(floor)} m² × ${K.broilerKgM2.v} kg/m² × ${K.broilerBatches.v} batches/yr`, ...tag('broilerKgM2') },
    { text: `Hens: ${fmt(hens)} birds × ${K.eggsPerHen.v} eggs/yr`, tag: 'ESTIMATE' },
    { text: `Tilapia: tanks 1.2 m deep × ${K.tilapiaKgM3.v} kg/m³ × ${K.tilapiaCycles.v} harvests/yr`, tag: 'ESTIMATE' },
    { text: `Animal GM multiplier ×${animalGM}; fed ${r0(feedMetFrac * 100)}%`, tag: 'ASSUMPTION' },
    { text: `= ${fmt(animalProteinKg)} kg protein/day` }
  ];
  W.feedMet = [
    { text: `Feed needed: chickens × FCR ${K.broilerFCR.v} + hens × ${K.henFeedKgDay.v} kg + fish × FCR ${K.tilapiaFCR.v} = ${fmt(feedNeed)} kg/day`, tag: 'DATA', src: 'fcrFish' },
    { text: `Feed on the city: soybean ${fmt(cropKgDay.soybean)} + rice ${fmt(cropKgDay.rice)} kg/day. Animals eat it before people do.` },
    { text: `Feed shipped in by boat: ${fmt(importFeed)} kg/day`, tag: 'ASSUMPTION' },
    { text: `= ${r0(metrics.feedMet)}%` }
  ];
  W.foodGroups = [{ text: `Grown: ${[...groups].join(', ') || 'none'} (grains, roots, legumes, vegetables, animal foods)` }];
  W.waterCoverage = [
    { text: `Need: ${fmt(pop)} × ${p.waterLPerPerson} L = ${fmt(waterNeedM3)} m³/day`, tag: 'DATA', src: 'water' },
    { text: `Rain on ${fmt(roofArea)} m² of roofs × ${p.rainMm} mm/yr × ${K.rainCapture.v * 100}% captured = ${fmt(rainM3)} m³/day`, tag: 'DATA', src: 'rainBkk' },
    { text: `Desalination: ${fmt(desalM3)} of ${fmt(desalCap)} m³/day capacity, at 3.5 kWh/m³`, tag: 'DATA', src: 'swro' },
    { text: `${fmt(waterSupplied)} ÷ ${fmt(waterNeedM3)} = ${r0(metrics.waterCoverage)}%` }
  ];
  W.wasteManaged = [
    { text: `Waste: ${fmt(pop)} × ${p.wasteKgPerPerson} kg = ${fmt(wasteT * 1000)} kg/day`, tag: 'DATA', src: 'thWaste' },
    { text: `Organic ${K.wasteOrganicShare.v * 100}% = ${fmt(organicT * 1000)} kg → digesters take ${fmt(digestedT * 1000)} kg`, ...tag('wasteOrganicShare') },
    { text: `Recyclable ${r0(p.recyclableShare * 100)}% = ${fmt(recyclableT * 1000)} kg → recycling takes ${fmt(recycledT * 1000)} kg`, tag: 'ASSUMPTION' },
    { text: `Left over: ${fmt((wasteT - digestedT - recycledT) * 1000)} kg/day must leave the city by boat` },
    { text: `= ${r0(metrics.wasteManaged)}% processed` }
  ];
  W.biogasKWh = [
    { text: `${fmt(digestedT)} t × ${K.biogasM3PerT.v} m³ biogas/t × ${K.methaneShare.v * 100}% methane`, ...tag('biogasM3PerT') },
    { text: `  × ${K.methaneKWhPerM3.v} kWh/m³ × ${K.generatorEff.v * 100}% engine efficiency = ${fmt(biogasKWh)} kWh/day`, tag: 'ESTIMATE' }
  ];
  W.wastewaterTreated = [
    { text: `${K.wastewaterShare.v * 100}% of water used = ${fmt(wastewaterM3)} m³/day; plants treat ${fmt(treatedM3)}`, tag: 'ESTIMATE' },
    { text: `= ${r0(metrics.wastewaterTreated)}%` }
  ];
  const worst = hexResults.reduce((a, b) => (b.use > a.use ? b : a), hexResults[0]);
  W.maxLoad = [
    { text: `Hex area: 2.598 × ${side}² = ${fmt(A)} m²` },
    { text: `Floats: ${fmt(A)} m² × ${depth} m deep × ${K.seawaterDensity.v} kg/m³ = ${fmt(displacementKg / 1000)} t of seawater pushed aside`, ...tag('seawaterDensity') },
    { text: `Keep ${p.reserve * 100}% of the pontoon above water for safety`, tag: 'ASSUMPTION' },
    { text: `Platform shell: 2 × ${mat.shellM} m × ${mat.density} kg/m³ (${mat.label}) = ${fmt(structureKgM2)} kg/m²`, tag: 'DATA', src: 'physics' },
    { text: `Safe load per hex = ${fmt(safeKg / 1000)} t` },
    { text: `Heaviest: ${MODULES[worst.type].label} at ${fmt(worst.kgM2)} kg/m² = ${fmt(worst.loadKg / 1000)} t → ${r0(worst.use)}%`, tag: 'ESTIMATE' }
  ];
  W.overloaded = W.maxLoad;
  W.tilt = [
    { text: `Centre of all the weight is ${fmt(tilt)} m from the middle of the city` },
    { text: 'Heavy hexes on one side pull the centre of weight that way. Balance them around the middle.' }
  ];
  W.housingShortfall = [
    { text: `Floor area: ${housingHexes.length} housing hexes × floors × ${fmt(A)} m² = ${fmt(floorArea)} m²` },
    { text: `÷ ${p.m2PerPerson} m² per person = homes for ${fmt(homesFor)} of ${fmt(pop)} people`, tag: 'ASSUMPTION' }
  ];
  W.peoplePerRoom = [
    { text: `${fmt(housed)} people ÷ ${fmt(rooms)} rooms (${K.roomM2.v} m² each) = ${r1(peoplePerRoom)}`, tag: 'ESTIMATE' },
    { text: `UN-Habitat calls more than ${K.crowdingLimit.v} per room overcrowded`, ...tag('crowdingLimit') }
  ];
  W.greenPerPerson = [{ text: `${fmt(greenArea)} m² of parks & sports ÷ ${fmt(pop)} people = ${r1(metrics.greenPerPerson)} m²; your team's target is ${p.greenTarget} m²`, tag: 'ASSUMPTION' }];
  W.exerciseCoverage = [
    { text: `Need: ${fmt(adultsAll)} adults × ${K.exerciseAdultMin.v} min + ${fmt(youth)} young people × ${K.exerciseYouthMin.v} min = ${fmt(exerciseNeedMin)} min/week`, ...tag('exerciseAdultMin') },
    { text: `Space: courts + half of parks ÷ ${K.activeM2.v} m² per person × ${K.sportsHoursDay.v} h × 7 days = ${fmt(exerciseCapMin)} min/week`, tag: 'ESTIMATE' },
    { text: `= ${r0(metrics.exerciseCoverage)}%` }
  ];
  W.nuisanceHomes = [{ text: `${nuisanceHomes} housing hexes touch a biogas, wastewater, recycling or livestock hex`, tag: 'ASSUMPTION' }];
  W.maxWalk = [{ text: maxWalk === Infinity ? 'No transport hub on the city.' : `Furthest home is ${walkHexes} hexes from a hub × ${fmt(Math.sqrt(3) * side)} m = ${fmt(maxWalk)} m` }];
  W.archiveTB = [
    { text: `Audio: ${fmt(p.archiveAudioHours)} h × 320 kbit/s = ${r1(audioTB)} TB (arithmetic)` },
    { text: `Video: ${fmt(p.archiveVideoHours)} h × 5 Mbit/s (1080p) = ${r1(videoTB)} TB`, tag: 'ESTIMATE' },
    { text: count('studio') ? '' : 'No studio hex: there is nowhere to keep the archive.' }
  ].filter((l) => l.text);
  W.archiveKWh = [{ text: `${r1(archiveTB)} TB × ${K.storageWPerTB.v} W/TB × 24 h = ${r1(archiveKWh)} kWh/day`, tag: 'ESTIMATE' }];
  W.cultureSpace = [{ text: `${count('studio')} studio hexes × ${fmt(A)} m² ÷ ${fmt(pop)} people` }];

  return {
    version: MODEL_VERSION,
    metrics,
    workings: W,
    hexes: hexResults,
    flags,
    area: A,
    safeKg,
    demand,
    supply: { solar: solarKWh, wind: windKWh, biogas: biogasKWh },
    foods
  };
}

// --- hypothesis testing ---------------------------------------------------------

/** What changed between two cities, in words a learner recognises. */
export function describeChanges(before, after) {
  const a = normaliseCity(before);
  const b = normaliseCity(after);
  const out = [];
  for (const [k, v] of Object.entries(b.params)) {
    if (k === 'mix') {
      for (const g of Object.keys(GROUPS)) {
        if (a.params.mix[g] !== v[g]) out.push(`${GROUPS[g].label} share: ${a.params.mix[g]} → ${v[g]}`);
      }
    } else if (JSON.stringify(a.params[k]) !== JSON.stringify(v)) {
      const meta = PARAMS[k];
      const show = (x) => (x === null || x === undefined || x === '' ? 'none'
        : meta?.options ? meta.options[x] ?? x
          : meta?.bool ? (x ? 'on' : 'off')
            : meta?.pct ? `${Math.round(x * 100)}%` : `${x}${meta?.unit && meta.unit !== '%' ? ` ${meta.unit}` : ''}`);
      out.push(`${meta?.label || k}: ${show(a.params[k])} → ${show(v)}`);
    }
  }
  const byKey = new Map(a.hexes.map((h) => [hexKey(h.q, h.r), h]));
  const describe = (h) => {
    const extra = h.type === 'farm' ? ` (${CROPS[h.crop]?.label || 'Rice'})`
      : h.type === 'livestock' ? ` (${ANIMALS[h.animal]?.label || 'Chickens'})`
        : h.type === 'housing' ? ` (${h.floors || 1} floors)` : '';
    return `${MODULES[h.type].label}${extra}`;
  };
  for (const h of b.hexes) {
    const old = byKey.get(hexKey(h.q, h.r));
    if (old && describe(old) !== describe(h)) out.push(`Hex ${h.q},${h.r}: ${describe(old)} → ${describe(h)}`);
  }
  return out;
}

/** Change smaller than this (relative) is "about the same". */
export const SAME_TOLERANCE = 0.02;

export function direction(before, after) {
  if (!Number.isFinite(before) || !Number.isFinite(after)) {
    if (before === after) return 'same';
    return after === Infinity ? 'increase' : 'decrease';
  }
  const scale = Math.max(Math.abs(before), Math.abs(after), 1e-9);
  if (Math.abs(after - before) / scale <= SAME_TOLERANCE) return 'same';
  return after > before ? 'increase' : 'decrease';
}

/**
 * Compare a test city against the baseline.
 * verdict: 'supported' | 'not-supported' | 'no-change' (nothing measurable moved).
 */
export function evaluateHypothesis(baselineCity, testCity, hypothesis) {
  const base = simulate(baselineCity);
  const test = simulate(testCity);
  const rows = Object.keys(METRICS).map((id) => ({
    id,
    before: base.metrics[id],
    after: test.metrics[id],
    dir: direction(base.metrics[id], test.metrics[id])
  }));
  const target = rows.find((r) => r.id === hypothesis.metric);
  const verdict = !target ? null : target.dir === hypothesis.expect ? 'supported' : 'not-supported';

  // Teammates whose own metrics moved: the cross-disciplinary point.
  const ripples = Object.entries(ROLES)
    .map(([roleId, role]) => ({
      roleId,
      title: role.title,
      moved: role.metrics.map((m) => rows.find((r) => r.id === m)).filter((r) => r && r.dir !== 'same')
    }))
    .filter((r) => r.moved.length && r.roleId !== hypothesis.role);

  return { verdict, target, rows, ripples, changes: describeChanges(baselineCity, testCity), version: MODEL_VERSION };
}

/** Number for display, with Infinity handled. */
export function showMetric(id, v) {
  if (v === Infinity) return '∞';
  if (!Number.isFinite(v)) return '—';
  const unit = METRICS[id]?.unit || '';
  const n = Math.abs(v) >= 100 ? Math.round(v).toLocaleString('en-US') : (Math.round(v * 10) / 10).toLocaleString('en-US');
  return unit === '%' ? `${n}%` : unit ? `${n} ${unit}` : n;
}
