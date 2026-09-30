/**
 * Model for the "Gold Nanoparticle SO₂ Filter" lab (Activity 6, v1.1).
 *
 * A gas stream carrying SO₂ passes through a filter bed of Au nanoparticles on
 * a TiO₂ support. SO₂ adsorbs on free surface sites, is oxidised through a
 * surface intermediate, picks up oxygen from water and leaves as sulfate.
 *
 * Like the v1.0 kinetic instrument this is a COMPUTATIONAL, EDUCATIONAL model.
 * Nothing it produces is a measurement. The model constants are structural
 * choices made so the behaviour is visible on a classroom timescale. Nobody
 * measured them for a real Au/TiO₂ filter, and the UI labels every output
 * MODEL OUTPUT for that reason.
 *
 * Conceptual pathway (a simplified oxidation representation, NOT a complete
 * mechanism):
 *   SO₂(g) + *        ⇌ SO₂*                   adsorption / desorption
 *   SO₂*              → SO₃*    (S +4 → +6)     surface oxidation, 2 e⁻
 *   SO₃* + H₂O        → SO₄*                   sulfate formation
 *   SO₄*              → SO₄²⁻ (output) + *     release into the water film
 * Overall, summarised as SO₂ + 2H₂O → SO₄²⁻ + 4H⁺ + 2e⁻.
 *
 * The filter is split into slices (5 at standard resolution, 10 at high)
 * along its thickness. The gas passes through a slice in milliseconds while
 * surface coverage changes over minutes, so the gas in each slice is solved
 * as quasi-steady and only the surface is integrated (RK4). That keeps the
 * model stable without tiny time steps, and it makes sulfur conservation
 * exact: fed = left in outlet gas + held on surface + released as sulfate.
 */

export const FILTER_MODEL_VERSION = 'SO2-Au-TiO2-v1.1';
export const FILTER_BASELINE_DATE = '2026-09-30';
export const FILTER_BASELINE_LABEL = 'September 30, 2026';
export const MODEL_OUTPUT = 'MODEL OUTPUT';

// Established physical constants.
export const R_GAS = 8.314462618;       // J mol⁻¹ K⁻¹
export const P_ATM = 101325;            // Pa
export const AVOGADRO = 6.02214076e23;  // mol⁻¹
export const M_SULFATE = 96.06;         // g mol⁻¹, SO₄²⁻
export const T_REF = 298.15;            // K

// Model constants. NOT measured values.
export const FILTER_CONSTANTS = {
  siteDensity: 1e-5,          // mol of surface sites per m² of catalytic area (~6 sites/nm²)
  crossSectionCm2: 5,         // filter face area
  porosity: 0.5,              // void fraction of the bed
  kAds: 2e-4,                 // SO₂ adsorption, per ppm per min per unit site affinity
  kDes: 0.05,                 // SO₂* desorption at 298 K, per min
  desorptionEnergyKJ: 50,     // makes SO₂* leave faster when hot
  kOx: 0.25,                  // SO₂* → SO₃* at unit drive, per min
  kSulfate: 0.6,              // SO₃* + H₂O → SO₄* at full water, per min
  kRelease: 0.15,             // SO₄* → output at full water, per min
  activationEnergyKJ: 40,     // apparent, for the three surface steps
  bareSupportAffinity: 0.2,   // TiO₂ with no Au, relative
  bareGoldAffinity: 0.05,     // Au away from an active support, relative
  bareSupportOxidation: 0.05, // TiO₂ with no Au, relative
  dryOxidationShare: 0.3,     // share of the redox step that does not need water
  referenceSizeNm: 3,         // particle size at which the interface factor is 1 per wt%
  maxRate: 200                // per min; faster steps count as "instant" on this timescale
};

export const SUPPORTS = {
  TiO2: { id: 'TiO2', label: 'TiO₂ support', activity: 1 },
  inert: { id: 'inert', label: 'Inert support (no TiO₂ effect)', activity: 0 }
};

export const FILTER_PARAMETERS = [
  { key: 'so2Ppm', label: 'SO₂ concentration (inlet)', unit: 'ppm', min: 10, max: 1000, step: 10, default: 100 },
  { key: 'water', label: 'Water availability', unit: '0–1 (model)', min: 0, max: 1, step: 0.05, default: 0.6 },
  { key: 'temperatureK', label: 'Temperature', unit: 'K', min: 273, max: 473, step: 1, default: 300 },
  { key: 'flowLpm', label: 'Gas flow rate', unit: 'L/min', min: 0.2, max: 10, step: 0.1, default: 1.0 },
  { key: 'auLoading', label: 'Gold nanoparticle loading', unit: 'wt% (model)', min: 0, max: 5, step: 0.1, default: 2.0 },
  { key: 'particleSizeNm', label: 'Approx. nanoparticle size', unit: 'nm', min: 1, max: 20, step: 0.5, default: 3 },
  { key: 'surfaceArea', label: 'Catalytic surface area', unit: 'm² per mm (model)', min: 1, max: 50, step: 1, default: 10 },
  { key: 'thicknessMm', label: 'Filter thickness', unit: 'mm', min: 0.5, max: 10, step: 0.5, default: 2 },
  { key: 'durationMin', label: 'Simulation duration', unit: 'simulated min', min: 1, max: 30, step: 1, default: 5 }
];

export function defaultFilterParameters() {
  return { ...Object.fromEntries(FILTER_PARAMETERS.map((p) => [p.key, p.default])), support: 'TiO2' };
}

export function normaliseFilterParameters(input = {}) {
  const out = {};
  for (const p of FILTER_PARAMETERS) {
    const v = Number(input[p.key]);
    out[p.key] = Number.isFinite(v) ? Math.min(p.max, Math.max(p.min, v)) : p.default;
  }
  // Duration is a pricing multiplier as well as a model input, so it must be whole minutes.
  out.durationMin = Math.round(out.durationMin);
  out.support = SUPPORTS[input.support] ? input.support : 'TiO2';
  return out;
}

const arrhenius = (energyKJ, T) => Math.exp((-energyKJ * 1000 / R_GAS) * (1 / T - 1 / T_REF));

/** Molar volume of an ideal gas at 1 atm, L/mol. */
export const molarVolumeL = (T) => (R_GAS * T / P_ATM) * 1000;

/**
 * Everything the integrator needs, derived from the parameters. Exposed so the
 * UI can show learners the numbers going into the model.
 */
export function filterRates(rawParams, { slices = 5 } = {}) {
  const p = normaliseFilterParameters(rawParams);
  const k = FILTER_CONSTANTS;
  const support = SUPPORTS[p.support].activity;

  const iface = p.auLoading * (k.referenceSizeNm / p.particleSizeNm);
  // The interface needs both partners: no Au, or an inert support, means none.
  const interfaceActivity = iface * support;
  const affinity = k.bareSupportAffinity * support + k.bareGoldAffinity * iface + interfaceActivity;
  const drive = k.bareSupportOxidation * support + interfaceActivity;
  const fT = arrhenius(k.activationEnergyKJ, p.temperatureK);
  const cap = (v) => Math.min(k.maxRate, v);

  const totalSites = p.surfaceArea * p.thicknessMm * k.siteDensity;          // mol
  const gasMolPerMin = p.flowLpm / molarVolumeL(p.temperatureK);              // mol gas / min
  const voidVolumeL = k.crossSectionCm2 * (p.thicknessMm / 10) * k.porosity / 1000;

  return {
    parameters: p,
    slices,
    interface: iface,
    interfaceActivity,
    affinity,
    drive,
    arrhenius: fT,
    kAds: k.kAds * affinity,                                         // per ppm per min
    kDes: cap(k.kDes * arrhenius(k.desorptionEnergyKJ, p.temperatureK)),
    k1: cap(k.kOx * fT * drive * (k.dryOxidationShare + (1 - k.dryOxidationShare) * p.water)),
    k2: cap(k.kSulfate * fT * p.water),
    kRel: cap(k.kRelease * fT * p.water),
    totalSites,
    sitesPerSlice: totalSites / slices,
    // mol of SO₂ per minute carried by 1 ppm of it.
    fluxPerPpm: gasMolPerMin * 1e-6,
    feedMolPerMin: gasMolPerMin * 1e-6 * p.so2Ppm,
    gasResidenceS: (voidVolumeL / p.flowLpm) * 60
  };
}

/**
 * Quasi-steady gas concentrations through the slices for a given surface state.
 * Per slice: flux·(C_in − C_out) = sites·(k_ads·C_out·free − k_des·θ_SO2),
 * solved for C_out. Writes into `out` and returns the outlet concentration.
 */
function gasProfile(s, r, cIn, out) {
  let c = cIn;
  const S = r.sitesPerSlice;
  for (let i = 0; i < r.slices; i++) {
    const a = s[3 * i], b = s[3 * i + 1], cc = s[3 * i + 2];
    const free = Math.max(0, 1 - a - b - cc);
    c = (r.fluxPerPpm * c + S * r.kDes * a) / (r.fluxPerPpm + S * r.kAds * free);
    out[i] = c;
  }
  return c;
}

/**
 * Surface derivatives. State layout: [θSO2, θSO3, θSO4] per slice, then
 * released-sulfate mol, then outlet-SO₂ mol (cumulative).
 */
function derivatives(s, r, cIn, gas, d) {
  const cOut = gasProfile(s, r, cIn, gas);
  let release = 0;
  for (let i = 0; i < r.slices; i++) {
    const a = s[3 * i], b = s[3 * i + 1], c = s[3 * i + 2];
    const free = Math.max(0, 1 - a - b - c);
    const ads = r.kAds * gas[i] * free - r.kDes * a;
    const r1 = r.k1 * a, r2 = r.k2 * b, rr = r.kRel * c;
    d[3 * i] = ads - r1;
    d[3 * i + 1] = r1 - r2;
    d[3 * i + 2] = r2 - rr;
    release += rr;
  }
  d[3 * r.slices] = release * r.sitesPerSlice;
  d[3 * r.slices + 1] = r.fluxPerPpm * cOut;
}

function rk4(s, r, cIn, dt, work) {
  const { k1, k2, k3, k4, tmp, gas } = work;
  const n = s.length;
  derivatives(s, r, cIn, gas, k1);
  for (let i = 0; i < n; i++) tmp[i] = s[i] + k1[i] * dt / 2;
  derivatives(tmp, r, cIn, gas, k2);
  for (let i = 0; i < n; i++) tmp[i] = s[i] + k2[i] * dt / 2;
  derivatives(tmp, r, cIn, gas, k3);
  for (let i = 0; i < n; i++) tmp[i] = s[i] + k3[i] * dt;
  derivatives(tmp, r, cIn, gas, k4);
  for (let i = 0; i < n; i++) s[i] += (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
}

/**
 * Run the filter from t = 0 to durationMin.
 *
 * @param {object} rawParams
 * @param {{resolution?: 'standard'|'high'}} [opts]
 */
export function simulateFilter(rawParams, { resolution = 'standard' } = {}) {
  const high = resolution === 'high';
  const r = filterRates(rawParams, { slices: high ? 10 : 5 });
  const p = r.parameters;
  const points = high ? 240 : 120;
  const n = 3 * r.slices + 2;
  const s = new Float64Array(n);
  const work = {
    k1: new Float64Array(n), k2: new Float64Array(n), k3: new Float64Array(n), k4: new Float64Array(n),
    tmp: new Float64Array(n), gas: new Float64Array(r.slices)
  };

  const fastest = r.kAds * p.so2Ppm + r.kDes + r.k1 + r.k2 + r.kRel;
  const dtMax = Math.min(0.02, 2 / Math.max(fastest, 1e-6));
  const sampleEvery = p.durationMin / points;
  const sub = Math.max(1, Math.ceil(sampleEvery / dtMax));
  const dt = sampleEvery / sub;

  let steps = 0;
  let prev = null;
  const samples = [];
  const record = (t) => {
    const smp = sampleFilter(t, s, r, work.gas, prev);
    samples.push(smp);
    prev = smp;
  };
  record(0);
  for (let i = 1; i <= points; i++) {
    for (let j = 0; j < sub; j++) { rk4(s, r, p.so2Ppm, dt, work); steps++; }
    record(i * sampleEvery);
  }

  return {
    parameters: p,
    resolution: high ? 'high' : 'standard',
    rates: r,
    samples,
    integrationSteps: steps,
    summary: summariseFilter(samples, r)
  };
}

function sampleFilter(t, s, r, gas, prev) {
  const cOut = gasProfile(s, r, r.parameters.so2Ppm, gas);
  const S = r.sitesPerSlice;
  let so2Ads = 0, so3Ads = 0, so4Ads = 0;
  const slices = [];
  for (let i = 0; i < r.slices; i++) {
    const a = Math.max(0, s[3 * i]), b = Math.max(0, s[3 * i + 1]), c = Math.max(0, s[3 * i + 2]);
    so2Ads += a; so3Ads += b; so4Ads += c;
    slices.push({ so2Ppm: gas[i], thetaSO2: a, thetaSO3: b, thetaSO4: c });
  }
  const released = Math.max(0, s[3 * r.slices]);
  const outletMol = Math.max(0, s[3 * r.slices + 1]);
  const fedMol = r.feedMolPerMin * t;
  const surfaceSulfateMol = so4Ads * S;
  const sulfateMol = surfaceSulfateMol + released;
  const heldMol = (so2Ads + so3Ads + so4Ads) * S;
  const removedMol = fedMol - outletMol;
  const occupied = r.slices ? (so2Ads + so3Ads + so4Ads) / r.slices : 0;

  // Rates over the last sample interval, for the "per minute" charts.
  const dtS = prev ? t - prev.t : 0;
  const sulfateRate = dtS > 0 ? (sulfateMol - prev.sulfateMol) / dtS : 0;
  const removalRate = r.fluxPerPpm * (r.parameters.so2Ppm - cOut);

  return {
    t,
    so2Out: cOut,
    removal: r.parameters.so2Ppm > 0 ? 1 - cOut / r.parameters.so2Ppm : 0,
    fedMol,
    outletMol,
    removedMol,
    heldMol,
    releasedMol: released,
    surfaceSulfateMol,
    sulfateMol,
    sulfateUg: sulfateMol * M_SULFATE * 1e6,
    releasedUg: released * M_SULFATE * 1e6,
    conversionPct: fedMol > 0 ? (sulfateMol / fedMol) * 100 : 0,
    throughputNmolMin: removalRate * 1e9,
    siteUtilization: occupied,
    thetaSO2: so2Ads / r.slices,
    thetaSO3: so3Ads / r.slices,
    thetaSO4: so4Ads / r.slices,
    // Little's law: mean time sulfur spends on the surface = inventory / throughput.
    // Throughput is whichever is larger, sulfur arriving or sulfate forming.
    surfaceResidenceMin: Math.max(sulfateRate, removalRate) > 1e-18 ? heldMol / Math.max(sulfateRate, removalRate) : 0,
    turnoversPerSite: r.totalSites > 0 ? sulfateMol / r.totalSites : 0,
    // Per sulfate: 2 H₂O consumed, 4 H⁺ and 2 e⁻ released (the conceptual equation).
    waterUsedNmol: 2 * sulfateMol * 1e9,
    protonsNmol: 4 * sulfateMol * 1e9,
    electronsNmol: 2 * sulfateMol * 1e9,
    slices
  };
}

export function summariseFilter(samples, r) {
  const last = samples[samples.length - 1];
  const p = r.parameters;
  return {
    initialSO2Ppm: p.so2Ppm,
    finalSO2Ppm: last.so2Out,
    conversionPct: last.conversionPct,
    removalPct: last.fedMol > 0 ? (last.removedMol / last.fedMol) * 100 : 0,
    sulfateUg: last.sulfateUg,
    sulfateMol: last.sulfateMol,
    releasedUg: last.releasedUg,
    simulatedMin: last.t,
    catalystUtilization: last.turnoversPerSite,
    finalSiteUtilization: last.siteUtilization,
    fedMol: last.fedMol,
    gasResidenceS: r.gasResidenceS
  };
}

/** Linear interpolation of numeric sample fields at time t. */
export function filterStateAt(samples, t) {
  if (!samples.length) return null;
  if (t <= 0) return samples[0];
  const last = samples[samples.length - 1];
  if (t >= last.t) return last;
  const dt = samples[1].t - samples[0].t;
  const i = Math.min(samples.length - 2, Math.floor(t / dt));
  const f = (t - samples[i].t) / dt;
  const A = samples[i], B = samples[i + 1];
  const out = { t, slices: f < 0.5 ? A.slices : B.slices };
  for (const key of Object.keys(A)) {
    if (key !== 't' && typeof A[key] === 'number') out[key] = A[key] + (B[key] - A[key]) * f;
  }
  return out;
}

/** Sulfur balance residual in mol - should be ~0. Used by the tests. */
export function filterSulfurBalance(sample) {
  return sample.fedMol - sample.outletMol - sample.heldMol - sample.releasedMol;
}

/**
 * Hypothetical catalyst configurations for side-by-side comparison. Each one
 * is the current parameters with a few changed. None is labelled "best".
 */
export const CATALYST_CONFIGS = [
  { id: 'current', label: 'Au/TiO₂ (your settings)', apply: (p) => p },
  { id: 'au-only', label: 'Gold nanoparticles on an inert support', apply: (p) => ({ ...p, support: 'inert' }) },
  { id: 'low-loading', label: 'Au/TiO₂, 0.5 wt% Au', apply: (p) => ({ ...p, support: 'TiO2', auLoading: 0.5 }) },
  { id: 'high-loading', label: 'Au/TiO₂, 4 wt% Au', apply: (p) => ({ ...p, support: 'TiO2', auLoading: 4 }) },
  { id: 'small-np', label: 'Au/TiO₂, 2 nm particles', apply: (p) => ({ ...p, support: 'TiO2', particleSizeNm: 2 }) },
  { id: 'large-np', label: 'Au/TiO₂, 10 nm particles', apply: (p) => ({ ...p, support: 'TiO2', particleSizeNm: 10 }) },
  { id: 'control', label: 'Control: TiO₂ with no Au', apply: (p) => ({ ...p, support: 'TiO2', auLoading: 0 }) }
];

/** Parameter sweeps: which input, and the values it steps through. */
export const SWEEPS = {
  TEMPERATURE_SWEEP: { key: 'temperatureK', label: 'Temperature', unit: 'K', values: [273, 300, 325, 350, 375, 400, 425, 450, 473] },
  SO2_CONCENTRATION_SWEEP: { key: 'so2Ppm', label: 'SO₂ concentration', unit: 'ppm', values: [10, 50, 100, 200, 300, 500, 700, 1000] },
  FLOW_RATE_SWEEP: { key: 'flowLpm', label: 'Gas flow rate', unit: 'L/min', values: [0.2, 0.5, 1, 2, 3, 5, 7.5, 10] },
  CATALYST_LOADING_SWEEP: { key: 'auLoading', label: 'Au loading', unit: 'wt%', values: [0, 0.25, 0.5, 1, 1.5, 2, 3, 4, 5] }
};

export function runSweep(sweepId, params, opts) {
  const sw = SWEEPS[sweepId];
  return sw.values.map((v) => {
    const run = simulateFilter({ ...params, [sw.key]: v }, opts);
    return { x: v, conversionPct: run.summary.conversionPct, removalPct: run.summary.removalPct, sulfateUg: run.summary.sulfateUg };
  });
}
