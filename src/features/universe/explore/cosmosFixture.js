/**
 * Sample cosmos for the Stage B spike (UNIVERSE.md §13.6). Fixture data only:
 * every name and value is an authored fictional world, never real astronomy,
 * and nothing here is read from or written to a backend. Gemini's catalog
 * contract will replace this file; keep the shape close to its proposal.
 */
export const COSMOS_VERSION = 'fixture-0.1';

export const GALAXIES = [
  {
    id: 'lyra-spiral', name: 'Lyra Spiral', type: 'spiral', position: [-15, 0, 0], tilt: 0.45,
    colors: { core: '#fff1d6', arm: '#b98ee0', dust: '#e0589c' },
    summary: 'A barred spiral with bright violet arms and one charted star system.',
    systems: ['lyra-prime'], uncharted: 2
  },
  {
    id: 'aurora-elliptical', name: 'Aurora Elliptical', type: 'elliptical', position: [16, 4, -10], tilt: 0.2,
    colors: { core: '#fff6dc', arm: '#e8c37a', dust: '#ffd9a0' },
    summary: 'An old, golden elliptical galaxy. No systems charted here yet.',
    systems: [], uncharted: 3
  }
];

export const SYSTEMS = [
  {
    id: 'lyra-prime', galaxyId: 'lyra-spiral', name: 'Lyra Prime', starClass: 'Yellow dwarf (G-type)', starColor: '#ffe9a8',
    summary: 'A single yellow star with three charted planets.',
    planets: ['thalassa', 'ignis', 'boreas']
  }
];

/** access: 'public' destinations may be entered; 'gated' ones need a trusted decision. */
export const PLANETS = [
  {
    id: 'thalassa', systemId: 'lyra-prime', name: 'Thalassa', kind: 'ocean', orbit: 7, angle: 0.6, radius: 1.1,
    colors: { base: '#1d5f8a', deep: '#0b2f52', light: '#7cc7e8', cloud: '#eaf6ff', atmosphere: '#9bd2ff' },
    summary: 'A warm ocean world with volcanic headlands and long, steady swells.',
    facts: [
      'Almost the whole surface is ocean; a few volcanic headlands break the water.',
      'Swells are long and regular, driven by steady trade winds.',
      'A research platform floats off the largest headland.'
    ],
    access: 'public', environmentId: 'thalassa-station'
  },
  {
    id: 'ignis', systemId: 'lyra-prime', name: 'Ignis', kind: 'basalt', orbit: 11, angle: 2.4, radius: 0.85,
    colors: { base: '#4d4440', deep: '#231d1c', light: '#85766c', glow: '#ff7a2e', atmosphere: '#ffb27a' },
    summary: 'A dark basalt world crossed by glowing fissures.',
    facts: ['Columnar basalt plains cover most of the surface.', 'Volcanic vents release sulfur-rich gas.'],
    access: 'gated', requirementText: 'Sample requirement: an Atmospheric Chemistry mission reviewed by your coach.',
    environmentId: null
  },
  {
    id: 'boreas', systemId: 'lyra-prime', name: 'Boreas', kind: 'ice', orbit: 15.5, angle: 4.3, radius: 1.3, rings: true,
    colors: { base: '#cfe3ef', deep: '#8fb3c9', light: '#ffffff', ring: '#d9cbb0', atmosphere: '#dff1ff' },
    summary: 'A ringed ice giant. No landing site is charted yet.',
    facts: ['Its rings are mostly ice and dust.', 'Upper clouds are bitterly cold.'],
    access: 'public', environmentId: null
  }
];

export const ENVIRONMENTS = [
  {
    id: 'thalassa-station', planetId: 'thalassa', name: 'Thalassa Research Station', biome: 'Coastal ocean and volcanic headland',
    summary: 'A bounded stretch of open ocean beside a basalt headland, with a floating research platform.',
    locations: [
      {
        id: 'platform', name: 'Research platform', position: [6, 1.6, 4], view: [16, 9, 18],
        purpose: 'Future home of a floating-settlement design project.',
        observations: ['Platform deck about 40 m across (fictional world value).', 'Six hexagonal modules on pontoons.']
      },
      {
        id: 'tide-gauge', name: 'Tide gauge', position: [-6, 0.5, 10], view: [-14, 6, 24],
        purpose: 'Records water level over time.',
        observations: ['Tidal range about 1.8 m (fictional world value).']
      },
      {
        id: 'weather-mast', name: 'Weather mast', position: [-14, 8.5, -6], view: [-4, 14, 10],
        purpose: 'Measures wind, temperature and pressure on the headland.',
        observations: ['Steady easterly wind, about 6 m/s (fictional world value).']
      },
      {
        id: 'vent', name: 'Vent overlook', position: [2, -1, -14], view: [14, 8, -4],
        purpose: 'A shallow hydrothermal vent visible through clear water.',
        observations: ['Warm water shimmers above the vent (illustrative, not simulated).']
      }
    ]
  }
];

export const galaxyById = (id) => GALAXIES.find((g) => g.id === id) || null;
export const systemById = (id) => SYSTEMS.find((s) => s.id === id) || null;
export const planetById = (id) => PLANETS.find((p) => p.id === id) || null;
export const environmentById = (id) => ENVIRONMENTS.find((e) => e.id === id) || null;
