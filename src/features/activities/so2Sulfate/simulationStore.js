/**
 * Saving SO₂ simulation runs to Firestore.
 *
 *   simulations/{simulationId}        one saved run: parameters, mode, summary
 *   simulationResults/{resultId}      sampled time points, keyed by simulationId
 *
 * Every document carries modelVersion and baselineDate so runs from different
 * model versions can be compared later. Saved runs are immutable - the rules
 * deny update and delete - so a model change can never overwrite an earlier
 * result; it can only add new ones under a new version string.
 *
 * Documents also carry userId, which is what the rules key ownership and coach
 * visibility on. Top-level collections were the brief's shape; the ownership
 * field is what keeps them from being a shared scratchpad for every student.
 */
import { db, collection, getDocs, query, where, limit, serverTimestamp, writeBatch } from '../../../firebase.js';
import { MODEL_VERSION, BASELINE_DATE, OUTPUT_LABEL } from './so2Model.js';

const RESULT_POINTS = 40;

function sampleEvenly(samples, n) {
  if (samples.length <= n) return samples;
  const out = [];
  for (let i = 0; i < n; i++) out.push(samples[Math.round((i / (n - 1)) * (samples.length - 1))]);
  return out;
}

const round = (v) => (Number.isFinite(v) ? Number(v.toPrecision(6)) : null);

/**
 * @param {string} uid
 * @param {'surface'|'electrochemical'|'comparison'} mode
 * @param {object} parameters
 * @param {object[]} runs  one or two results of so2Model.simulate()
 * @returns {Promise<string>} the new simulationId
 */
export async function saveSimulation(uid, mode, parameters, runs) {
  const simRef = collection(db, 'simulations').doc();
  const batch = writeBatch(db);

  const results = {};
  for (const run of runs) {
    results[run.mode] = Object.fromEntries(
      Object.entries(run.summary).map(([k, v]) => [k, round(v)])
    );
  }

  batch.set(simRef, {
    userId: uid,
    createdAt: serverTimestamp(),
    modelVersion: MODEL_VERSION,
    baselineDate: BASELINE_DATE,
    mode,
    parameters,
    results,
    dataStatus: OUTPUT_LABEL
  });

  for (const run of runs) {
    for (const s of sampleEvenly(run.samples, RESULT_POINTS)) {
      batch.set(collection(db, 'simulationResults').doc(), {
        userId: uid,
        simulationId: simRef.id,
        modelVersion: MODEL_VERSION,
        series: run.mode,
        timestamp: serverTimestamp(),
        simulatedTime: round(s.t),
        so2: round(s.so2),
        sulfate: round(s.sulfate),
        surfaceSO2: round(s.surfaceSO2),
        surfaceSulfate: round(s.surfaceSulfate),
        activeSites: round(s.activeSites),
        electronTransfer: round(s.electronTransfer)
      });
    }
  }

  await batch.commit();
  return simRef.id;
}

/** The signed-in learner's saved runs, newest first. */
export async function listSimulations(uid, max = 20) {
  // No orderBy: userId + createdAt ordering would need a composite index, and a
  // learner has a handful of runs, so sorting them here is free.
  const snap = await getDocs(query(collection(db, 'simulations'), where('userId', '==', uid), limit(50)));
  const rows = [];
  snap.forEach((d) => rows.push({ id: d.id, ...d.data() }));
  const ms = (r) => r.createdAt?.toMillis?.() ?? 0;
  return rows.sort((a, b) => ms(b) - ms(a)).slice(0, max);
}
