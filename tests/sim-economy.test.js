/**
 * Security-rule tests for the filter lab's simulation-credit economy.
 *
 * The client writes its own ledger (there is no backend in production), so
 * these rules are the only thing standing between a learner and unlimited
 * credits. Each test is an attack or a legitimate flow.
 *
 * Run: npm test   (or `npx vitest run tests/sim-economy.test.js` against a
 * running emulator on 8088 - the project namespace is separate).
 */
import { describe, it, beforeAll, afterAll, beforeEach, expect } from 'vitest';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import fs from 'fs';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, writeBatch, serverTimestamp, Timestamp } from 'firebase/firestore';
import { quote } from '../src/features/activities/so2Sulfate/filter/pricing.js';

let testEnv;
const UID = 'learner';
const student = () => testEnv.authenticatedContext(UID);
const teacher = () => testEnv.authenticatedContext('teach', { role: 'teacher', classIds: ['c1'] });
const other = () => testEnv.authenticatedContext('someone_else');

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-hearisland-rules',
    firestore: { rules: fs.readFileSync(process.env.RULES_FILE || 'firestore.rules', 'utf8'), host: '127.0.0.1', port: 8088 }
  });
});
afterAll(async () => { await testEnv?.cleanup(); });
beforeEach(async () => { await testEnv.clearFirestore(); });

function newBudget(preset = 'RESEARCHER', amount = 10000) {
  return {
    userId: UID, preset, balance: amount, startingBalance: amount, txCount: 0, totalSpent: 0, totalUnits: 0, resetCount: 0,
    lastResetAt: serverTimestamp(), createdAt: serverTimestamp(), updatedAt: serverTimestamp(), economyVersion: 'SIM-COST-v1.0'
  };
}

/** Seed a budget directly, bypassing rules (e.g. to backdate lastResetAt). */
async function seedBudget(over = {}) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'budgets', UID), {
      userId: UID, preset: 'RESEARCHER', balance: 10000, startingBalance: 10000, txCount: 0, totalSpent: 0, totalUnits: 0,
      resetCount: 0, lastResetAt: Timestamp.now(), createdAt: Timestamp.now(), updatedAt: Timestamp.now(), economyVersion: 'SIM-COST-v1.0', ...over
    });
  });
}

/** The same writes ledger.js makes, with optional tampering. */
function chargeBatch(db, before, q, { tx: txOver = {}, budget: budgetOver = {}, runId = null } = {}) {
  const seq = before.txCount + 1;
  const txId = `${UID}_${seq}`;
  const batch = writeBatch(db);
  const tx = {
    transactionId: txId, userId: UID, seq, action: q.action, label: q.label, baseCost: q.base, quantity: q.quantity,
    resolutionMultiplier: q.multipliers.resolution, particleMultiplier: q.multipliers.particles,
    timeMultiplier: q.multipliers.time, nanoparticleMultiplier: q.multipliers.nanoparticles,
    units: q.units, cost: q.cost, balanceBefore: before.balance, balanceAfter: before.balance - q.cost,
    simulationRunId: runId, refId: runId, economyVersion: 'SIM-COST-v1.0', timestamp: serverTimestamp(), ...txOver
  };
  batch.update(doc(db, 'budgets', UID), {
    balance: tx.balanceAfter, txCount: seq, totalSpent: before.totalSpent + tx.cost,
    totalUnits: before.totalUnits + tx.units, updatedAt: serverTimestamp(), ...budgetOver
  });
  batch.set(doc(db, 'transactions', txId), tx);
  return { batch, txId };
}

const start = { balance: 10000, txCount: 0, totalSpent: 0, totalUnits: 0 };

describe('budgets', () => {
  it('a learner can open a Student or Researcher budget', async () => {
    await assertSucceeds(setDoc(doc(student().firestore(), 'budgets', UID), newBudget()));
  });

  it('a learner cannot open with an arbitrary balance', async () => {
    await assertFails(setDoc(doc(student().firestore(), 'budgets', UID), { ...newBudget(), balance: 1e9, startingBalance: 1e9 }));
  });

  it('a learner cannot pick the staff-only Institution preset', async () => {
    await assertFails(setDoc(doc(student().firestore(), 'budgets', UID), newBudget('INSTITUTION', 250000)));
  });

  it('a teacher can pick the Institution preset for themselves', async () => {
    const db = teacher().firestore();
    await assertSucceeds(setDoc(doc(db, 'budgets', 'teach'), { ...newBudget('INSTITUTION', 250000), userId: 'teach' }));
  });

  it('a learner cannot simply raise their balance', async () => {
    await seedBudget();
    await assertFails(updateDoc(doc(student().firestore(), 'budgets', UID), { balance: 999999 }));
  });

  it('nobody can delete a budget', async () => {
    await seedBudget();
    await assertFails(deleteDoc(doc(student().firestore(), 'budgets', UID)));
  });

  it('another learner cannot read the budget', async () => {
    await seedBudget();
    await assertFails(getDoc(doc(other().firestore(), 'budgets', UID)));
    await assertSucceeds(getDoc(doc(student().firestore(), 'budgets', UID)));
  });
});

describe('charges', () => {
  beforeEach(() => seedBudget());

  it('an honest charge succeeds and lands with the right balance', async () => {
    const db = student().firestore();
    const { batch, txId } = chargeBatch(db, start, quote('GENERATE_PERFORMANCE_GRAPH'));
    await assertSucceeds(batch.commit());
    const b = (await getDoc(doc(db, 'budgets', UID))).data();
    expect(b.balance).toBe(9985);
    expect(b.txCount).toBe(1);
    expect((await getDoc(doc(db, 'transactions', txId))).data().cost).toBe(15);
  });

  it('a scaled charge succeeds when the formula is followed', async () => {
    const q = quote('FAST_FORWARD', { resolution: 'high', particleCount: 400 });
    expect(q.cost).toBe(45);
    const { batch } = chargeBatch(student().firestore(), start, q);
    await assertSucceeds(batch.commit());
  });

  it('rejects a charge below the price table', async () => {
    const { batch } = chargeBatch(student().firestore(), start, quote('FULL_PARAMETER_SWEEP'), { tx: { cost: 1, balanceAfter: 9999 }, budget: { balance: 9999, totalSpent: 1 } });
    await assertFails(batch.commit());
  });

  it('rejects a charge that lies about the base cost', async () => {
    const q = quote('FULL_PARAMETER_SWEEP');
    const { batch } = chargeBatch(student().firestore(), start, { ...q, base: 1, cost: 1 });
    await assertFails(batch.commit());
  });

  it('rejects a multiplier the action does not use (price-shaping)', async () => {
    const q = quote('SAVE_SIMULATION');
    const { batch } = chargeBatch(student().firestore(), start, { ...q, multipliers: { ...q.multipliers, resolution: 2 }, units: 2, cost: 10 });
    await assertFails(batch.commit());
  });

  it('rejects a multiplier below 1', async () => {
    const q = quote('START_SIMULATION', { minutes: 5 });
    const { batch } = chargeBatch(student().firestore(), start, { ...q, multipliers: { ...q.multipliers, particles: 0.5 }, units: 2.5, cost: 63 });
    await assertFails(batch.commit());
  });

  it('rejects a charge whose balance arithmetic is wrong', async () => {
    const { batch } = chargeBatch(student().firestore(), start, quote('EXPORT_DATA'), { tx: { balanceAfter: 10000 }, budget: { balance: 10000 } });
    await assertFails(batch.commit());
  });

  it('rejects a budget change with no ledger row', async () => {
    await assertFails(updateDoc(doc(student().firestore(), 'budgets', UID), { balance: 9975, txCount: 1, totalSpent: 25, updatedAt: serverTimestamp() }));
  });

  it('rejects spending more than the balance', async () => {
    await seedBudget({ balance: 100 });
    const { batch } = chargeBatch(student().firestore(), { ...start, balance: 100 }, quote('FULL_PARAMETER_SWEEP'));
    await assertFails(batch.commit());
  });

  it('rejects writing a ledger row for someone else', async () => {
    const q = quote('EXPORT_DATA');
    await assertFails(setDoc(doc(other().firestore(), 'transactions', `${UID}_1`), {
      transactionId: `${UID}_1`, userId: UID, seq: 1, action: q.action, cost: q.cost
    }));
  });

  it('makes the ledger append-only', async () => {
    const db = student().firestore();
    const { batch, txId } = chargeBatch(db, start, quote('EXPORT_DATA'));
    await batch.commit();
    await assertFails(updateDoc(doc(db, 'transactions', txId), { cost: 0 }));
    await assertFails(deleteDoc(doc(db, 'transactions', txId)));
  });

  it('rejects reusing a sequence number (replaying an old row)', async () => {
    const db = student().firestore();
    await chargeBatch(db, start, quote('EXPORT_DATA')).batch.commit();
    const { batch } = chargeBatch(db, start, quote('EXPORT_DATA'));
    await assertFails(batch.commit());
  });
});

describe('budget resets', () => {
  function resetBatch(db, before, preset, amount) {
    const seq = before.txCount + 1;
    const batch = writeBatch(db);
    batch.update(doc(db, 'budgets', UID), {
      balance: amount, preset, startingBalance: amount, txCount: seq, resetCount: 1, lastResetAt: serverTimestamp(), updatedAt: serverTimestamp()
    });
    batch.set(doc(db, 'transactions', `${UID}_${seq}`), {
      transactionId: `${UID}_${seq}`, userId: UID, seq, action: 'RESET_BUDGET', label: 'Reset', preset, baseCost: 0, quantity: 1,
      resolutionMultiplier: 1, particleMultiplier: 1, timeMultiplier: 1, nanoparticleMultiplier: 1, units: 0, cost: 0,
      balanceBefore: before.balance, balanceAfter: amount, simulationRunId: null, refId: null, economyVersion: 'SIM-COST-v1.0', timestamp: serverTimestamp()
    });
    return batch;
  }

  it('allows one reset after 24 hours', async () => {
    await seedBudget({ balance: 12, lastResetAt: Timestamp.fromMillis(Date.now() - 25 * 3600e3) });
    await assertSucceeds(resetBatch(student().firestore(), { ...start, balance: 12 }, 'RESEARCHER', 10000).commit());
  });

  it('refuses a second reset inside 24 hours', async () => {
    await seedBudget({ balance: 12 });
    await assertFails(resetBatch(student().firestore(), { ...start, balance: 12 }, 'RESEARCHER', 10000).commit());
  });

  it('refuses a reset to a non-preset amount', async () => {
    await seedBudget({ balance: 12, lastResetAt: Timestamp.fromMillis(Date.now() - 25 * 3600e3) });
    await assertFails(resetBatch(student().firestore(), { ...start, balance: 12 }, 'RESEARCHER', 99999).commit());
  });

  it('refuses a learner reset to a staff-only preset', async () => {
    await seedBudget({ balance: 12, lastResetAt: Timestamp.fromMillis(Date.now() - 25 * 3600e3) });
    await assertFails(resetBatch(student().firestore(), { ...start, balance: 12 }, 'INSTITUTION', 250000).commit());
  });
});

describe('Activity 6 v1.0 kinetic runs still save', () => {
  it('a v1.0 run and its result points are accepted', async () => {
    const db = student().firestore();
    const batch = writeBatch(db);
    batch.set(doc(db, 'simulations', 'k1'), { userId: UID, modelVersion: 'SO2-Au-TiO2-v1.0', baselineDate: '2026-09-24', mode: 'surface', createdAt: serverTimestamp() });
    batch.set(doc(db, 'simulationResults', 'k1p0'), { userId: UID, simulationId: 'k1', modelVersion: 'SO2-Au-TiO2-v1.0', series: 'surface', simulatedTime: 0 });
    await assertSucceeds(batch.commit());
  });
});

describe('runs and paid records', () => {
  beforeEach(() => seedBudget());

  function runBatch(db, { compute, durationMin, q }) {
    const runId = 'run1';
    const { batch, txId } = chargeBatch(db, start, q, { runId });
    batch.set(doc(db, 'simulationRuns', runId), {
      userId: UID, runId, status: 'started', modelVersion: 'SO2-Au-TiO2-v1.1', baselineDate: '2026-09-30', economyVersion: 'SIM-COST-v1.0',
      parameters: { durationMin, so2Ppm: 100 }, compute, startTransactionId: txId, startCost: q.cost, createdAt: serverTimestamp()
    });
    batch.set(doc(db, 'simulationParameters', runId), { userId: UID, runId, modelVersion: 'SO2-Au-TiO2-v1.1', parameters: { durationMin }, compute, createdAt: serverTimestamp() });
    return batch;
  }

  it('a paid run with matching settings is accepted', async () => {
    const compute = { particleCount: 400, resolution: 'high', nanoparticles: 200, tracked: 0 };
    const q = quote('START_SIMULATION', { resolution: 'high', particleCount: 400, minutes: 5, nanoparticles: 200 });
    await assertSucceeds(runBatch(student().firestore(), { compute, durationMin: 5, q }).commit());
  });

  it('a run priced at lower settings than it stores is rejected', async () => {
    const compute = { particleCount: 3200, resolution: 'high', nanoparticles: 100, tracked: 0 };
    const q = quote('START_SIMULATION', { resolution: 'standard', particleCount: 200, minutes: 1 });
    await assertFails(runBatch(student().firestore(), { compute, durationMin: 30, q }).commit());
  });

  it('a run record without a payment is rejected', async () => {
    await assertFails(setDoc(doc(student().firestore(), 'simulationRuns', 'free'), {
      userId: UID, runId: 'free', modelVersion: 'SO2-Au-TiO2-v1.1', parameters: { durationMin: 5 },
      compute: { particleCount: 200, resolution: 'standard', nanoparticles: 100 }, startTransactionId: `${UID}_1`, createdAt: serverTimestamp()
    }));
  });

  it('results can be written once for the learner\'s own run, never rewritten', async () => {
    const compute = { particleCount: 200, resolution: 'standard', nanoparticles: 100, tracked: 0 };
    const db = student().firestore();
    await runBatch(db, { compute, durationMin: 5, q: quote('START_SIMULATION', { minutes: 5 }) }).commit();
    const result = { userId: UID, runId: 'run1', kind: 'filterRun', modelVersion: 'SO2-Au-TiO2-v1.1', summary: { conversionPct: 40 }, series: {}, createdAt: serverTimestamp() };
    await assertSucceeds(setDoc(doc(db, 'simulationResults', 'run1'), result));
    await assertFails(setDoc(doc(db, 'simulationResults', 'run1'), { ...result, summary: { conversionPct: 99 } }));
    await assertFails(setDoc(doc(other().firestore(), 'simulationResults', 'run1'), { ...result, userId: 'someone_else' }));
  });

  it('a saved simulation needs its SAVE_SIMULATION payment', async () => {
    const db = student().firestore();
    await assertFails(setDoc(doc(db, 'savedSimulations', 's1'), { userId: UID, name: 'x', transactionId: `${UID}_1` }));
    const { batch, txId } = chargeBatch(db, start, quote('SAVE_SIMULATION'), { tx: { refId: 's1' } });
    batch.set(doc(db, 'savedSimulations', 's1'), { userId: UID, name: 'x', parameters: {}, compute: {}, transactionId: txId });
    await assertSucceeds(batch.commit());
  });
});
