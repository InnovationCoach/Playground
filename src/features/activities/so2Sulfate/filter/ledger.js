/**
 * Firestore storage for the filter lab: budgets, the transaction ledger and
 * the run records.
 *
 *   budgets/{uid}                   balance, preset, txCount, totalSpent
 *   transactions/{uid}_{seq}        one ledger row per paid action
 *   simulationRuns/{runId}          what was run and how it was priced
 *   simulationParameters/{runId}    the model inputs of that run
 *   simulationResults/{runId}       sampled outputs (kind: 'filterRun')
 *   savedSimulations/{id}           a saved configuration
 *   reports/{id}                    a generated report
 *
 * There is no backend in production, so the client writes these. It still
 * cannot set its own prices or balance: firestore.rules recomputes every cost
 * from its own price table, requires balanceAfter = balanceBefore − cost,
 * links each ledger row to exactly one budget change (sequence numbers), and
 * makes the ledger append-only. See the "Simulation economy" block there.
 */
import { db, collection, doc, getDoc, getDocs, query, where, limit, serverTimestamp } from '../../../../firebase.js';
import { ECONOMY_VERSION, BUDGET_PRESETS } from './pricing.js';
import { FILTER_MODEL_VERSION, FILTER_BASELINE_DATE, MODEL_OUTPUT } from './filterModel.js';

export class InsufficientCreditsError extends Error {
  constructor(required, available) {
    super('INSUFFICIENT SIMULATION CREDITS');
    this.required = required;
    this.available = available;
  }
}

const budgetRef = (uid) => doc(db, 'budgets', uid);
const txRef = (uid, seq) => doc(db, 'transactions', `${uid}_${seq}`);

export async function getBudget(uid) {
  const snap = await getDoc(budgetRef(uid));
  return snap.exists ? snap.data() : null;
}

export async function createBudget(uid, preset) {
  const amount = BUDGET_PRESETS[preset]?.amount;
  if (!amount) throw new Error('Unknown budget preset');
  await budgetRef(uid).set({
    userId: uid,
    preset,
    balance: amount,
    startingBalance: amount,
    txCount: 0,
    totalSpent: 0,
    totalUnits: 0,
    resetCount: 0,
    lastResetAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    economyVersion: ECONOMY_VERSION
  });
  return getBudget(uid);
}

// Charges run one at a time. Two at once would both claim the same sequence
// number; the rules would reject the second, but queueing avoids the error.
let queue = Promise.resolve();
function enqueue(fn) {
  const next = queue.then(fn, fn);
  queue = next.catch(() => {});
  return next;
}

/**
 * Charge one priced action, atomically with any records it creates.
 *
 * @param {string} uid
 * @param {ReturnType<import('./pricing.js').quote>} q
 * @param {object} [opts]
 * @param {string|null} [opts.simulationRunId]  the run this cost belongs to
 * @param {string|null} [opts.refId]            id of a record created with it
 * @param {(t: object, txId: string) => void} [opts.extraWrites]
 * @returns {Promise<{transactionId: string, balanceAfter: number, budget: object, tx: object}>}
 */
export function charge(uid, q, { simulationRunId = null, refId = null, extraWrites } = {}) {
  return enqueue(() => db.runTransaction(async (t) => {
    const snap = await t.get(budgetRef(uid));
    if (!snap.exists) throw new Error('No simulation budget yet');
    const b = snap.data();
    if (q.cost > b.balance) throw new InsufficientCreditsError(q.cost, b.balance);

    const seq = b.txCount + 1;
    const transactionId = `${uid}_${seq}`;
    const tx = {
      transactionId,
      userId: uid,
      seq,
      action: q.action,
      label: q.label,
      baseCost: q.base,
      quantity: q.quantity,
      resolutionMultiplier: q.multipliers.resolution,
      particleMultiplier: q.multipliers.particles,
      timeMultiplier: q.multipliers.time,
      nanoparticleMultiplier: q.multipliers.nanoparticles,
      units: q.units,
      cost: q.cost,
      balanceBefore: b.balance,
      balanceAfter: b.balance - q.cost,
      simulationRunId,
      refId,
      economyVersion: ECONOMY_VERSION,
      timestamp: serverTimestamp()
    };
    const budget = {
      balance: tx.balanceAfter,
      txCount: seq,
      totalSpent: b.totalSpent + q.cost,
      totalUnits: (b.totalUnits || 0) + q.units,
      updatedAt: serverTimestamp()
    };
    t.update(budgetRef(uid), budget);
    t.set(txRef(uid, seq), tx);
    if (extraWrites) extraWrites(t, transactionId);
    return { transactionId, balanceAfter: tx.balanceAfter, budget: { ...b, ...budget }, tx: { ...tx, timestamp: new Date() } };
  }));
}

/** Reset to a preset. Ledgered like any other action; the rules allow one per 24 h. */
export function resetBudget(uid, preset) {
  return enqueue(() => db.runTransaction(async (t) => {
    const snap = await t.get(budgetRef(uid));
    const b = snap.data();
    const amount = BUDGET_PRESETS[preset].amount;
    const seq = b.txCount + 1;
    const transactionId = `${uid}_${seq}`;
    t.update(budgetRef(uid), {
      balance: amount,
      preset,
      startingBalance: amount,
      txCount: seq,
      resetCount: (b.resetCount || 0) + 1,
      lastResetAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    t.set(txRef(uid, seq), {
      transactionId,
      userId: uid,
      seq,
      action: 'RESET_BUDGET',
      label: `Reset budget to ${BUDGET_PRESETS[preset].label}`,
      preset,
      baseCost: 0,
      quantity: 1,
      resolutionMultiplier: 1,
      particleMultiplier: 1,
      timeMultiplier: 1,
      nanoparticleMultiplier: 1,
      units: 0,
      cost: 0,
      balanceBefore: b.balance,
      balanceAfter: amount,
      simulationRunId: null,
      refId: null,
      economyVersion: ECONOMY_VERSION,
      timestamp: serverTimestamp()
    });
    return { transactionId };
  }));
}

async function listByUser(name, uid, max = 500) {
  const snap = await getDocs(query(collection(db, name), where('userId', '==', uid), limit(max)));
  const rows = [];
  snap.forEach((d) => rows.push({ id: d.id, ...d.data() }));
  return rows;
}

export async function listTransactions(uid) {
  const rows = await listByUser('transactions', uid, 1000);
  return rows.sort((a, b) => b.seq - a.seq);
}

/** New document ids without writing anything yet. */
export const newId = (name) => collection(db, name).doc().id;

/**
 * Start a run: charge START_SIMULATION and write the run and its parameters in
 * the same transaction, so a run record cannot exist without its payment.
 */
export function startRun(uid, q, { runId, parameters, compute }) {
  return charge(uid, q, {
    simulationRunId: runId,
    refId: runId,
    extraWrites: (t, txId) => {
      t.set(doc(db, 'simulationRuns', runId), {
        userId: uid,
        runId,
        status: 'started',
        modelVersion: FILTER_MODEL_VERSION,
        baselineDate: FILTER_BASELINE_DATE,
        economyVersion: ECONOMY_VERSION,
        parameters,
        compute,
        startTransactionId: txId,
        startCost: q.cost,
        createdAt: serverTimestamp()
      });
      t.set(doc(db, 'simulationParameters', runId), {
        userId: uid,
        runId,
        modelVersion: FILTER_MODEL_VERSION,
        parameters,
        compute,
        createdAt: serverTimestamp()
      });
    }
  });
}

const round = (v) => (Number.isFinite(v) ? Number(v.toPrecision(6)) : null);
const SERIES_FIELDS = ['so2Out', 'sulfateUg', 'conversionPct', 'throughputNmolMin', 'siteUtilization', 'surfaceResidenceMin', 'turnoversPerSite'];

/** Results of a run that played to the end. One document per run, create-only. */
export async function saveRunResults(uid, runId, run) {
  const step = Math.max(1, Math.floor(run.samples.length / 40));
  const pts = run.samples.filter((_, i) => i % step === 0 || i === run.samples.length - 1);
  const series = { t: pts.map((s) => round(s.t)) };
  for (const f of SERIES_FIELDS) series[f] = pts.map((s) => round(s[f]));
  await doc(db, 'simulationResults', runId).set({
    userId: uid,
    runId,
    kind: 'filterRun',
    modelVersion: FILTER_MODEL_VERSION,
    dataStatus: MODEL_OUTPUT,
    summary: Object.fromEntries(Object.entries(run.summary).map(([k, v]) => [k, round(v)])),
    series,
    createdAt: serverTimestamp()
  });
}

export async function listRuns(uid) {
  const [runs, results] = await Promise.all([
    listByUser('simulationRuns', uid, 300),
    getDocs(query(collection(db, 'simulationResults'), where('userId', '==', uid), where('kind', '==', 'filterRun'), limit(300)))
  ]);
  const byRun = {};
  results.forEach((d) => { byRun[d.id] = d.data(); });
  const ms = (r) => r.createdAt?.toMillis?.() ?? Date.now();
  return runs
    .map((r) => ({ ...r, result: byRun[r.runId] || null, createdMs: ms(r) }))
    .sort((a, b) => b.createdMs - a.createdMs);
}

/** Save a configuration ($5), in the same transaction as its charge. */
export function saveConfiguration(uid, q, { name, parameters, compute, simulationRunId }) {
  const id = newId('savedSimulations');
  return charge(uid, q, {
    simulationRunId,
    refId: id,
    extraWrites: (t, txId) => t.set(doc(db, 'savedSimulations', id), {
      userId: uid,
      name: String(name || 'Saved configuration').slice(0, 80),
      parameters,
      compute,
      modelVersion: FILTER_MODEL_VERSION,
      transactionId: txId,
      createdAt: serverTimestamp()
    })
  });
}

export async function listSavedConfigurations(uid) {
  const rows = await listByUser('savedSimulations', uid, 100);
  const ms = (r) => r.createdAt?.toMillis?.() ?? Date.now();
  return rows.sort((a, b) => ms(b) - ms(a));
}

/** Store a generated report ($50) in the same transaction as its charge. */
export function saveReport(uid, q, { simulationRunId, summary, title }) {
  const id = newId('reports');
  return charge(uid, q, {
    simulationRunId,
    refId: id,
    extraWrites: (t, txId) => t.set(doc(db, 'reports', id), {
      userId: uid,
      runId: simulationRunId,
      title,
      summary,
      modelVersion: FILTER_MODEL_VERSION,
      economyVersion: ECONOMY_VERSION,
      dataStatus: MODEL_OUTPUT,
      transactionId: txId,
      createdAt: serverTimestamp()
    })
  }).then((r) => ({ ...r, reportId: id }));
}
