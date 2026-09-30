/**
 * Kinetic model for "SO₂ → Sulfate: Gold Nanoparticle Catalytic Conversion".
 *
 * This is a COMPUTATIONAL, EDUCATIONAL model. It is not fitted to any
 * experiment, and no number it produces is a measurement. Every rate constant
 * below is an adjustable model parameter or a named model constant, chosen so
 * the curves are legible on a classroom timescale - not because anyone measured
 * them for Au/TiO₂. The UI labels every curve "Simulated / illustrative model
 * output" for that reason, and so must anything else that displays these values.
 *
 * What the model does try to get right is the chemistry that is not in dispute:
 *   - sulfur goes from +4 in SO₂ to +6 in sulfate, a 2-electron oxidation;
 *   - the gold is a catalyst and is never consumed;
 *   - SO₂ must adsorb on a free surface site before anything happens to it;
 *   - the Au/TiO₂ interface is the active region, not bulk metallic gold
 *     (Rodriguez et al., JACS 2002 - see SOURCES);
 *   - sulfate that does not leave the surface occupies sites, so a catalyst can
 *     slow itself down.
 *
 * Species tracked (state vector):
 *   C  - dissolved/gas-phase SO₂, model mM
 *   a  - θ(SO₂*)  fractional coverage of adsorbed SO₂        S(+4)
 *   b  - θ(SO₃*)  fractional coverage of adsorbed SO₃-type   S(+6)
 *   c  - θ(SO₄*)  fractional coverage of adsorbed sulfate    S(+6)
 *   x  - θ(S_other*) adsorbed sulfur not routed to sulfate (the 1 - Y branch);
 *        its oxidation state is deliberately NOT modelled
 *   S  - released sulfate SO₄²⁻, model mM
 *
 * Simplified mechanistic sequence (a visualisation, not a claim that these are
 * the only real intermediates):
 *   SO₂ + *  ⇌  SO₂*              adsorption / desorption
 *   SO₂*     →  SO₃*   + 2e⁻      the redox step, S(+4) → S(+6)
 *   SO₃*     →  Y·SO₄* + (1-Y)·S_other*   oxygen addition, no change in S state
 *   SO₄*     →  SO₄²⁻ + *          release
 *
 * Sulfur is conserved exactly: C + Γ(a + b + c + x) + S = C₀ at all times, where
 * Γ is the surface capacity. The tests hold the model to that.
 */

export const MODEL_VERSION = 'SO2-Au-TiO2-v1.0';
export const BASELINE_DATE = '2026-09-24';
export const BASELINE_DATE_LABEL = 'September 24, 2026';
export const OUTPUT_LABEL = 'Simulated / illustrative model output';

export const MODES = {
  surface: {
    id: 'surface',
    label: 'Surface Catalysis',
    short: 'Surface',
    blurb: 'Adsorbed SO₂ is oxidised at the Au/TiO₂ interface. The electrons end up on an oxidant (modelled as dissolved O₂), not in an external circuit.'
  },
  electrochemical: {
    id: 'electrochemical',
    label: 'Electrochemical Oxidation',
    short: 'Electrochemical',
    blurb: 'An applied potential drives SO₂ + 2H₂O → SO₄²⁻ + 4H⁺ + 2e⁻. Oxygen comes from water, and the two electrons leave through the electrode as current.'
  },
  comparison: {
    id: 'comparison',
    label: 'Conceptual Comparison',
    short: 'Comparison',
    blurb: 'Both models run on the same parameters side by side. The real mechanism depends strongly on electrolyte, support material, potential, surface structure and reaction environment - this comparison shows only how the two MODEL assumptions differ.'
  }
};

// ---------------------------------------------------------------------------
// Physical constants (these ARE established values)
// ---------------------------------------------------------------------------
export const R_GAS = 8.314462618;      // J mol⁻¹ K⁻¹
export const FARADAY = 96485.33212;    // C mol⁻¹
export const ELECTRONS_PER_SULFUR = 2; // S(+4) → S(+6)
export const T_REF = 298.15;           // K, reference temperature for the Arrhenius factor

// ---------------------------------------------------------------------------
// Model constants. NOT measured values - structural choices of this model.
// ---------------------------------------------------------------------------
export const MODEL_CONSTANTS = {
  surfaceCapacityMm: 0.4,     // Γ per unit surface-area factor, model mM-equivalent of sites
  adsorptionRate: 2.0,        // base SO₂ adsorption rate scale, per model mM per τ
  bareSupportAffinity: 0.2,   // site affinity of TiO₂ with no Au, relative
  bareGoldAffinity: 0.05,     // site affinity of Au away from the support, relative
  bareSupportOxidation: 0.05, // oxidation drive on TiO₂ with no Au, relative
  step2Ratio: 1.5,            // SO₃* → SO₄* relative to the redox step
  transferCoefficient: 0.5,   // α in the Butler-Volmer-style potential factor
  potentialFactorCap: 50,     // caps exp(αF(E−E_onset)/RT) so the model stays on-screen
  referenceSizeNm: 3,         // particle size at which the interface factor is 1 per wt%
  maxRate: 60                 // per τ; faster steps are treated as "fast on this timescale"
};

// ---------------------------------------------------------------------------
// Adjustable model parameters. Defaults are illustrative, NOT validated
// operating conditions for any real reactor or electrode.
// ---------------------------------------------------------------------------
export const PARAMETERS = [
  { key: 'so2Initial', group: 'feed', label: 'SO₂ starting concentration', unit: 'mM (model)', min: 0.1, max: 5, step: 0.1, default: 1.0 },
  { key: 'duration', group: 'feed', label: 'Simulated reaction time', unit: 'τ (model time)', min: 10, max: 200, step: 5, default: 60 },

  { key: 'areaFactor', group: 'catalyst', label: 'Catalyst surface-area factor', unit: '×', min: 0.2, max: 3, step: 0.1, default: 1.0 },
  { key: 'auLoading', group: 'catalyst', label: 'Au nanoparticle loading', unit: 'wt% (model)', min: 0, max: 3, step: 0.1, default: 1.0 },
  { key: 'particleSizeNm', group: 'catalyst', label: 'Approx. nanoparticle size', unit: 'nm', min: 2, max: 20, step: 0.5, default: 3 },
  { key: 'supportActivity', group: 'catalyst', label: 'TiO₂ support activity factor', unit: '×', min: 0, max: 2, step: 0.05, default: 1.0 },

  { key: 'temperatureK', group: 'conditions', label: 'Temperature', unit: 'K', min: 273, max: 353, step: 1, default: 298 },
  { key: 'o2Availability', group: 'conditions', label: 'Dissolved O₂ availability', unit: '0–1', min: 0, max: 1, step: 0.05, default: 0.5, modes: ['surface'] },
  { key: 'potentialV', group: 'electro', label: 'Applied potential', unit: 'V vs model ref.', min: 0, max: 1.4, step: 0.02, default: 0.76, modes: ['electrochemical'] },
  { key: 'onsetV', group: 'electro', label: 'Model onset potential', unit: 'V vs model ref.', min: 0.3, max: 1.2, step: 0.02, default: 0.7, modes: ['electrochemical'] },

  { key: 'adsorptionStrength', group: 'kinetics', label: 'Adsorption strength (K_ads)', unit: '×', min: 0.1, max: 10, step: 0.1, default: 2.0 },
  { key: 'kOx', group: 'kinetics', label: 'Oxidation rate constant (k_ox)', unit: 'τ⁻¹', min: 0.01, max: 3, step: 0.01, default: 0.4 },
  { key: 'releaseFactor', group: 'kinetics', label: 'Sulfate desorption / release factor', unit: 'τ⁻¹', min: 0, max: 2, step: 0.01, default: 0.3 },
  { key: 'sulfateYield', group: 'kinetics', label: 'Sulfate yield factor (Y_sulfate)', unit: '0–1', min: 0.5, max: 1, step: 0.01, default: 0.9 },
  { key: 'activationEnergyKJ', group: 'kinetics', label: 'Apparent activation energy', unit: 'kJ/mol (model)', min: 10, max: 80, step: 1, default: 40 }
];

export const PARAMETER_GROUPS = [
  { id: 'feed', label: 'Feed & time' },
  { id: 'catalyst', label: 'Catalyst (Au/TiO₂)' },
  { id: 'conditions', label: 'Conditions' },
  { id: 'electro', label: 'Electrochemistry' },
  { id: 'kinetics', label: 'Kinetics' }
];

export function defaultParameters() {
  return Object.fromEntries(PARAMETERS.map((p) => [p.key, p.default]));
}

/**
 * Coerce stored or user input into a complete, in-range parameter set.
 * A saved run from an older model version may lack newer keys; they fall back
 * to defaults rather than NaN-ing the whole simulation.
 */
export function normaliseParameters(input = {}) {
  const out = {};
  for (const p of PARAMETERS) {
    const v = Number(input[p.key]);
    out[p.key] = Number.isFinite(v) ? Math.min(p.max, Math.max(p.min, v)) : p.default;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Derived factors
// ---------------------------------------------------------------------------

/**
 * Au/TiO₂ perimeter proxy. At fixed loading, the number of particles scales as
 * 1/d³ and each particle's perimeter as d, so perimeter per gram of Au scales
 * as 1/d². Surface atoms per gram scale as 1/d. The model uses 1/d as a single
 * deliberately gentle proxy for "more, smaller particles expose more active
 * region" and says so in the assumptions panel.
 */
export function interfaceFactor(p) {
  return p.auLoading * (MODEL_CONSTANTS.referenceSizeNm / p.particleSizeNm);
}

export function arrheniusFactor(p) {
  return Math.exp((-p.activationEnergyKJ * 1000 / R_GAS) * (1 / p.temperatureK - 1 / T_REF));
}

/** exp(αF(E − E_onset)/RT), capped. Below onset it falls off exponentially. */
export function potentialFactor(p) {
  const { transferCoefficient, potentialFactorCap } = MODEL_CONSTANTS;
  const x = (transferCoefficient * FARADAY * (p.potentialV - p.onsetV)) / (R_GAS * p.temperatureK);
  return Math.min(potentialFactorCap, Math.exp(x));
}

/**
 * Turn parameters into the rate constants the ODE uses, for one mode.
 * Exposed so the UI can show students the actual numbers going into the model.
 */
export function rateConstants(rawParams, mode) {
  const p = normaliseParameters(rawParams);
  const k = MODEL_CONSTANTS;
  const iface = interfaceFactor(p);
  // The interface needs both partners: no Au, or an inert support, means none.
  const interfaceActivity = iface * p.supportActivity;
  const fT = arrheniusFactor(p);

  const siteAffinity = k.bareSupportAffinity * p.supportActivity + k.bareGoldAffinity * iface + interfaceActivity;
  const kAds = k.adsorptionRate * siteAffinity;
  const kDes = k.adsorptionRate / p.adsorptionStrength;

  let drive;
  if (mode === 'electrochemical') {
    // Water supplies the oxygen; the electrode takes the electrons. Au surface
    // and the interface both count as electrochemically active area.
    drive = (k.bareSupportOxidation * p.supportActivity + iface + interfaceActivity) * potentialFactor(p);
  } else {
    // Dissolved O₂ is the electron acceptor, and the interface is where it and
    // SO₂* meet. Metallic Au alone contributes nothing here - the point of the
    // 2002 JACS result is that it is the Au/TiO₂ combination that is active.
    drive = p.o2Availability * (k.bareSupportOxidation * p.supportActivity + interfaceActivity);
  }

  const cap = (v) => Math.min(k.maxRate, v);
  return {
    capacity: k.surfaceCapacityMm * p.areaFactor,
    kAds: cap(kAds),
    kDes: cap(kDes),
    k1: cap(p.kOx * fT * drive),
    k2: cap(p.kOx * fT * k.step2Ratio),
    kRel: cap(p.releaseFactor * fT),
    yield: p.sulfateYield,
    interface: iface,
    interfaceActivity,
    arrhenius: fT,
    potential: mode === 'electrochemical' ? potentialFactor(p) : null
  };
}

// ---------------------------------------------------------------------------
// Integration
// ---------------------------------------------------------------------------

// Written with scalars and a reused output array: this runs tens of thousands
// of times per slider movement, and the allocating version took seconds at the
// stiff corner of the parameter space.
function derivatives(s, r, out) {
  const C = s[0], a = s[1], b = s[2], c = s[3], x = s[4];
  const free = Math.max(0, 1 - a - b - c - x);
  const net = r.kAds * Math.max(0, C) * free - r.kDes * a;
  const r1 = r.k1 * a;
  const r2 = r.k2 * b;
  const rRel = r.kRel * c;
  out[0] = -r.capacity * net;
  out[1] = net - r1;
  out[2] = r1 - r2;
  out[3] = r.yield * r2 - rRel;
  out[4] = (1 - r.yield) * r2;
  out[5] = r.capacity * rRel;
}

const N = 6;
const K1 = new Float64Array(N), K2 = new Float64Array(N), K3 = new Float64Array(N), K4 = new Float64Array(N);
const TMP = new Float64Array(N);

function rk4(s, r, dt) {
  derivatives(s, r, K1);
  for (let i = 0; i < N; i++) TMP[i] = s[i] + K1[i] * dt / 2;
  derivatives(TMP, r, K2);
  for (let i = 0; i < N; i++) TMP[i] = s[i] + K2[i] * dt / 2;
  derivatives(TMP, r, K3);
  for (let i = 0; i < N; i++) TMP[i] = s[i] + K3[i] * dt;
  derivatives(TMP, r, K4);
  for (let i = 0; i < N; i++) s[i] += (dt / 6) * (K1[i] + 2 * K2[i] + 2 * K3[i] + K4[i]);
}

function sample(t, s, r) {
  const [C, a, b, c, x, S] = Array.from(s, (v) => Math.max(0, v));
  const occupied = Math.min(1, a + b + c + x);
  return {
    t,
    so2: C,
    sulfate: S,
    surfaceSO2: r.capacity * a,     // model mM-equivalent
    surfaceSO3: r.capacity * b,
    surfaceSulfate: r.capacity * c,
    surfaceOther: r.capacity * x,
    thetaSO2: a,
    thetaSO3: b,
    thetaSulfate: c,
    thetaOther: x,
    activeSites: occupied,
    // 2 e⁻ per sulfur oxidised, and only the SO₂* → SO₃* step changes S's state.
    electronTransfer: ELECTRONS_PER_SULFUR * r.capacity * r.k1 * a
  };
}

/**
 * Run the model from t = 0 to params.duration.
 *
 * Returns `samples` at a fixed number of evenly spaced times, so charts and the
 * clock never depend on the internal step size. The step itself shrinks to keep
 * RK4 stable for the fastest process present.
 */
export function simulate(rawParams, mode = 'surface', { points = 300 } = {}) {
  const p = normaliseParameters(rawParams);
  const r = rateConstants(p, mode);

  const fastest = r.kAds * p.so2Initial + r.capacity * r.kAds + r.kDes + r.k1 + r.k2 + r.kRel;
  // `fastest` sums every rate, so it over-estimates the largest eigenvalue;
  // 2/fastest stays inside RK4's stability limit (~2.8/λ) with margin.
  const dtMax = Math.min(0.05, 2 / Math.max(fastest, 1e-6));
  const sampleEvery = p.duration / points;
  const sub = Math.max(1, Math.ceil(sampleEvery / dtMax));
  const dt = sampleEvery / sub;

  const s = Float64Array.of(p.so2Initial, 0, 0, 0, 0, 0);
  const samples = [sample(0, s, r)];
  for (let i = 1; i <= points; i++) {
    for (let j = 0; j < sub; j++) rk4(s, r, dt);
    samples.push(sample(i * sampleEvery, s, r));
  }

  return { mode, parameters: p, rates: r, samples, summary: summarise(samples, p) };
}

export function summarise(samples, p) {
  const last = samples[samples.length - 1];
  const peakElectron = samples.reduce((m, s) => Math.max(m, s.electronTransfer), 0);
  const half = samples.find((s) => s.so2 <= p.so2Initial / 2);
  return {
    simulatedTime: last.t,
    finalSO2: last.so2,
    finalSulfate: last.sulfate,
    finalSurfaceSulfate: last.surfaceSulfate,
    finalActiveSites: last.activeSites,
    so2Removed: 1 - last.so2 / p.so2Initial,
    sulfateYield: last.sulfate / p.so2Initial,
    halfLife: half ? half.t : null,
    peakElectronTransfer: peakElectron
  };
}

/** Linear interpolation of a trajectory at time t, for the live clock. */
export function stateAt(samples, t) {
  if (!samples.length) return null;
  if (t <= 0) return samples[0];
  const last = samples[samples.length - 1];
  if (t >= last.t) return last;
  const dt = samples[1].t - samples[0].t;
  const i = Math.min(samples.length - 2, Math.floor(t / dt));
  const f = (t - samples[i].t) / dt;
  const A = samples[i];
  const B = samples[i + 1];
  const out = { t };
  for (const key of Object.keys(A)) if (key !== 't') out[key] = A[key] + (B[key] - A[key]) * f;
  return out;
}

/** Sulfur mass balance residual - should be ~0. Used by the tests. */
export function sulfurBalance(sample, p) {
  return sample.so2 + sample.surfaceSO2 + sample.surfaceSO3 + sample.surfaceSulfate + sample.surfaceOther + sample.sulfate - p.so2Initial;
}

// ---------------------------------------------------------------------------
// Chemistry reference data shown in the UI. Oxidation states are textbook
// assignments, not model outputs.
// ---------------------------------------------------------------------------
export const SPECIES = [
  { formula: 'SO₂', name: 'Sulfur dioxide', sulfurOx: '+4' },
  { formula: 'SO₃²⁻', name: 'Sulfite', sulfurOx: '+4' },
  { formula: 'SO₄²⁻', name: 'Sulfate', sulfurOx: '+6' },
  { formula: 'H₂O', name: 'Water' },
  { formula: 'H⁺', name: 'Hydrogen ion' },
  { formula: 'Au', name: 'Gold' },
  { formula: 'Auₙ', name: 'Gold nanoparticle (n = many Au atoms, no fixed composition)' },
  { formula: 'TiO₂', name: 'Titanium dioxide support' },
  { formula: 'SO₂(ads)', name: 'Adsorbed SO₂', sulfurOx: '+4' },
  { formula: 'SO₃(ads)', name: 'Adsorbed SO₃-type species', sulfurOx: '+6' },
  { formula: 'SO₄(ads)', name: 'Adsorbed sulfate-type species', sulfurOx: '+6' }
];

export const SOURCES = [
  {
    id: 'rodriguez2002',
    cite: 'Rodriguez, J. A.; Liu, G.; Jirsak, T.; Hrbek, J.; Chang, Z.; Dvorak, J.; Maiti, A. "Activation of Gold on Titania: Adsorption and Reaction of SO₂ on Au/TiO₂(110)." J. Am. Chem. Soc. 2002, 124 (18), 5242–5250.',
    url: 'https://doi.org/10.1021/ja020115y',
    relevance: 'Synchrotron photoemission and DFT study. Reported that Au nanoparticles on TiO₂(110) adsorb and dissociate SO₂ far more readily than metallic gold or stoichiometric titania, attributing this to Au–TiO₂ electronic interaction and O-vacancy migration. This is why the model makes the Au/TiO₂ interface, not bulk Au, the active region.'
  },
  {
    id: 'seo1965',
    cite: 'Seo, E. T.; Sawyer, D. T. "Electrochemical oxidation of dissolved sulphur dioxide at platinum and gold electrodes." Electrochimica Acta 1965, 10, 239–252.',
    url: 'https://www.sciencedirect.com/science/article/abs/pii/0013468665870220',
    relevance: 'Early voltammetric study of SO₂ oxidation on Pt and Au electrodes. Reported that electrode history and surface state (including surface oxides and adsorbed sulfur species) strongly affect the oxidation.'
  },
  {
    id: 'obrien2010',
    cite: "O'Brien, J. A.; Hinkley, J. T.; Donne, S. W.; Lindquist, S.-E. \"The electrochemical oxidation of aqueous sulfur dioxide: A critical review of work with respect to the hybrid sulfur cycle.\" Electrochimica Acta 2010, 55 (3), 573–591.",
    url: 'https://www.sciencedirect.com/science/article/abs/pii/S0013468609012389',
    relevance: 'Critical review of the mechanism. Concludes the pathway depends heavily on electrode material, solution pH and applied potential, and that poorly defined electrode preconditioning has produced non-reproducible results - the reason this simulation refuses to give its curves experimental meaning.'
  }
];
