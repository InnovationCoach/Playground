/**
 * SIM-COST-v1.0: the filter lab's virtual economy.
 *
 * Every figure here is SIMULATION CREDITS, an educational cost metric for how
 * computational and hypothetical process costs add up. None of them is a
 * real price for gold, chemicals, lab equipment or industrial filtration, and
 * the UI must never present them as one.
 *
 * firestore.rules keeps its own copy of the price table and the multiplier
 * tiers, so a modified client cannot charge itself less than the published
 * formula. tests/sim-economy.test.js checks that the two copies agree.
 *
 *   TOTAL COST = BASE ACTION COST × QUANTITY × RESOLUTION MULTIPLIER
 *                × PARTICLE MULTIPLIER × TIME MULTIPLIER × NANOPARTICLE MULTIPLIER
 *
 * rounded up to a whole credit. Each action lists which multipliers apply to
 * it. The rest are fixed at ×1.
 */

export const ECONOMY_VERSION = 'SIM-COST-v1.0';
export const CREDIT_LABEL = 'Simulation Credits ($)';
export const VIRTUAL_NOTICE = 'All costs are virtual simulation credits and are not real-world pricing.';

// `scales` lists the multipliers that apply. `unit` says what one quantity is.
export const ACTIONS = {
  START_SIMULATION: { label: 'Start simulation', base: 25, unit: 'run', scales: ['resolution', 'particles', 'time', 'nanoparticles'] },
  RESET_SIMULATION: { label: 'Reset simulation', base: 10, unit: 'reset', scales: [] },
  STEP_MODE: { label: 'Step-by-step mode', base: 5, unit: 'simulated step', scales: ['resolution', 'particles'] },
  FAST_FORWARD: { label: 'Fast-forward', base: 15, unit: 'simulated minute', scales: ['resolution', 'particles'] },
  HIGH_RESOLUTION_SIMULATION: { label: 'High-resolution simulation', base: 50, unit: 'simulated minute', scales: ['particles'] },
  NANOPARTICLE_VIEW: { label: 'Microscopic nanoparticle view', base: 20, unit: 'simulated minute', scales: ['nanoparticles'] },
  ACTIVE_SITE_VIEW: { label: 'Active-site view', base: 35, unit: 'simulated minute', scales: [] },
  MOLECULAR_TRAJECTORY_TRACKING: { label: 'Molecular trajectory tracking', base: 40, unit: 'tracked molecule', scales: ['resolution'] },
  ADD_100_AU_NANOPARTICLES: { label: 'Add 100 simulated Au nanoparticles', base: 75, unit: 'purchase', scales: [] },
  INCREASE_PARTICLE_RESOLUTION: { label: 'Increase particle resolution', base: 100, unit: 'purchase', scales: [] },
  DOUBLE_PARTICLE_COUNT: { label: 'Double simulation particle count', base: 150, unit: 'purchase', scales: [] },
  TEMPERATURE_SWEEP: { label: 'Temperature sweep', base: 200, unit: 'sweep', scales: ['resolution'] },
  SO2_CONCENTRATION_SWEEP: { label: 'SO₂ concentration sweep', base: 200, unit: 'sweep', scales: ['resolution'] },
  FLOW_RATE_SWEEP: { label: 'Flow-rate sweep', base: 175, unit: 'sweep', scales: ['resolution'] },
  CATALYST_LOADING_SWEEP: { label: 'Catalyst-loading sweep', base: 250, unit: 'sweep', scales: ['resolution'] },
  FULL_PARAMETER_SWEEP: { label: 'Full parameter sweep', base: 750, unit: 'sweep', scales: ['resolution'] },
  // Not in the default price list: priced at the Start Simulation base per configuration.
  CATALYST_COMPARISON: { label: 'Catalyst comparison', base: 25, unit: 'configuration', scales: ['resolution'] },
  GENERATE_PERFORMANCE_GRAPH: { label: 'Generate performance graph', base: 15, unit: 'graph', scales: [] },
  GENERATE_DETAILED_REPORT: { label: 'Generate detailed report', base: 50, unit: 'report', scales: [] },
  EXPORT_DATA: { label: 'Export data', base: 25, unit: 'export', scales: [] },
  EXPORT_HIGH_RES_GRAPHICS: { label: 'Export high-resolution graphics', base: 40, unit: 'export', scales: [] },
  SAVE_SIMULATION: { label: 'Save simulation', base: 5, unit: 'save', scales: [] },
  LOAD_SAVED_SIMULATION: { label: 'Load saved simulation', base: 5, unit: 'load', scales: [] }
};

/** Free controls, listed so the price table shows them. They write no ledger entry. */
export const FREE_ACTIONS = ['Pause', 'Resume', 'Slow motion', 'Macro view', 'Filter view', 'Export ledger'];

export const BUDGET_PRESETS = {
  STUDENT: { label: 'Student', amount: 1000 },
  RESEARCHER: { label: 'Researcher', amount: 10000 },
  ADVANCED: { label: 'Advanced', amount: 50000, staffOnly: true },
  INSTITUTION: { label: 'Institution', amount: 250000, staffOnly: true }
};
export const DEFAULT_PRESET = 'RESEARCHER';
export const RESET_COOLDOWN_HOURS = 24;

// Multiplier tiers. The rules accept only these values.
export const RESOLUTIONS = {
  standard: { label: 'Standard (5 filter slices)', multiplier: 1 },
  high: { label: 'High (10 filter slices)', multiplier: 2 }
};
export const PARTICLE_TIERS = [
  { count: 200, multiplier: 1 },
  { count: 400, multiplier: 1.5 },
  { count: 800, multiplier: 2 },
  { count: 1600, multiplier: 2.5 },
  { count: 3200, multiplier: 3 }
];
export const STARTING_PARTICLE_CAP = 400;
export const STARTING_NANOPARTICLES = 100;
export const MAX_NANOPARTICLES = 1000;
export const MAX_TRACKED = 5;
export const MAX_DURATION_MIN = 30;

export const particleMultiplier = (count) => PARTICLE_TIERS.find((t) => t.count === count)?.multiplier ?? 1;
export const nanoparticleMultiplier = (n) => 1 + 0.25 * (Math.round(n / 100) - 1);
export const resolutionMultiplier = (res) => RESOLUTIONS[res]?.multiplier ?? 1;

/** Actions that ask for confirmation before they run. */
export const CONFIRM_THRESHOLD = 50;

/**
 * Price one action.
 *
 * @param {string} action           key of ACTIONS
 * @param {object} ctx
 * @param {number} [ctx.quantity]   steps, minutes, molecules or configurations
 * @param {'standard'|'high'} [ctx.resolution]
 * @param {number} [ctx.particleCount]
 * @param {number} [ctx.minutes]    simulated minutes, for the time multiplier
 * @param {number} [ctx.nanoparticles]
 */
export function quote(action, ctx = {}) {
  const def = ACTIONS[action];
  if (!def) throw new Error(`Unknown action ${action}`);
  const applies = (k) => def.scales.includes(k);
  const quantity = Math.max(1, Math.round(ctx.quantity ?? 1));
  const m = {
    resolution: applies('resolution') ? resolutionMultiplier(ctx.resolution) : 1,
    particles: applies('particles') ? particleMultiplier(ctx.particleCount) : 1,
    time: applies('time') ? Math.max(1, Math.round(ctx.minutes ?? 1)) : 1,
    nanoparticles: applies('nanoparticles') ? nanoparticleMultiplier(ctx.nanoparticles ?? STARTING_NANOPARTICLES) : 1
  };
  // Computational units: the workload before it is priced. Same product order as the rules.
  const units = quantity * m.resolution * m.particles * m.time * m.nanoparticles;
  const cost = Math.ceil(def.base * units - 1e-9);
  return { action, label: def.label, base: def.base, unit: def.unit, quantity, multipliers: m, units, cost };
}

const money = (v) => `$${Math.round(v).toLocaleString('en-US')}`;
export const formatCredits = money;

/** The formula written out, factor by factor, so the pricing is never hidden. */
export function explainQuote(q) {
  const parts = [{ label: `${q.label} (base)`, value: money(q.base) }];
  if (q.quantity !== 1) parts.push({ label: `${q.quantity} × ${q.unit}${q.quantity === 1 ? '' : 's'}`, value: `×${q.quantity}` });
  const def = ACTIONS[q.action];
  if (def.scales.includes('resolution')) parts.push({ label: 'Resolution multiplier', value: `×${q.multipliers.resolution}` });
  if (def.scales.includes('particles')) parts.push({ label: 'Particle multiplier', value: `×${q.multipliers.particles}` });
  if (def.scales.includes('time')) parts.push({ label: `${q.multipliers.time} simulated minute${q.multipliers.time === 1 ? '' : 's'}`, value: `×${q.multipliers.time}` });
  if (def.scales.includes('nanoparticles')) parts.push({ label: 'Nanoparticle multiplier', value: `×${q.multipliers.nanoparticles}` });
  const factors = [money(q.base)];
  if (q.quantity !== 1) factors.push(String(q.quantity));
  for (const k of ['resolution', 'particles', 'time', 'nanoparticles']) {
    if (def.scales.includes(k)) factors.push(String(q.multipliers[k]));
  }
  return { parts, formula: `${factors.join(' × ')} = ${money(q.cost)}` };
}

/** Why an expensive action costs more. Shown on request next to the action. */
export const WHY_COSTS_MORE = {
  START_SIMULATION: 'The run cost scales with everything the computer has to do: more filter slices (resolution), more animated particles, more simulated minutes and more explicitly simulated nanoparticles all mean more calculations.',
  HIGH_RESOLUTION_SIMULATION: 'High resolution splits the filter into twice as many slices and records twice as many time points, so every simulated minute needs roughly twice the calculation.',
  MOLECULAR_TRAJECTORY_TRACKING: 'Tracking individual molecular trajectories requires more simulated calculations than displaying bulk concentration data, so this action has a higher virtual computational cost.',
  NANOPARTICLE_VIEW: 'The nanoparticle view draws individual molecules and surface sites instead of bulk dots, which needs more simulated detail for every minute it is on.',
  ACTIVE_SITE_VIEW: 'The active-site view resolves a single Au/TiO₂ perimeter site step by step. It is the most detailed view, so it has the highest per-minute cost.',
  FAST_FORWARD: 'Fast-forward computes the same simulated minutes in less time, which in a real computing setting needs more computing power at once.',
  FULL_PARAMETER_SWEEP: 'A full sweep re-runs the whole model for every value of four parameters, so it bundles about 34 complete simulations.',
  TEMPERATURE_SWEEP: 'A sweep re-runs the whole model once for every value in the range.',
  SO2_CONCENTRATION_SWEEP: 'A sweep re-runs the whole model once for every value in the range.',
  FLOW_RATE_SWEEP: 'A sweep re-runs the whole model once for every value in the range.',
  CATALYST_LOADING_SWEEP: 'A sweep re-runs the whole model once for every value in the range.',
  CATALYST_COMPARISON: 'Each configuration is a complete simulation, so the cost is one Start Simulation base per configuration.',
  DOUBLE_PARTICLE_COUNT: 'Doubling the animated particles doubles the number of positions updated every frame.',
  INCREASE_PARTICLE_RESOLUTION: 'Unlocks the high-resolution setting. Runs that use it also pay the resolution multiplier.',
  GENERATE_DETAILED_REPORT: 'A report compiles the run, its charts, costs and model notes into one document.'
};
