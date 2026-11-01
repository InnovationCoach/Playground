#!/usr/bin/env node

/**
 * Migration: rewrite legacy age bands to the three official cohorts:
 *   - 'primary'          (ages 6–11)
 *   - 'lower-secondary'  (ages 12–14)
 *   - 'higher-secondary' (ages 15–18)
 *
 * Mappings:
 *   'primary'  -> 'primary'
 *   '6-9'      -> 'primary'
 *   '13-15'    -> 'lower-secondary'
 *   '10-13'    -> 'lower-secondary'
 *   '11-13'    -> 'lower-secondary'
 *   '14-16'    -> 'lower-secondary'
 *   '16-18'    -> 'higher-secondary'
 *   '17-18'    -> 'higher-secondary'
 *   '14-18'    -> 'higher-secondary'
 *
 * Usage:
 *   node scripts/migrate-age-bands.js --dry-run
 *   node scripts/migrate-age-bands.js
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DRY_RUN = process.argv.includes('--dry-run');

const KEY_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS
  || path.join(__dirname, 'firebase-admin-key.json');

if (process.env.FIRESTORE_EMULATOR_HOST) {
  initializeApp({ projectId: process.env.GOOGLE_CLOUD_PROJECT || 'demo-hearisland-local' });
} else {
  if (!fs.existsSync(KEY_PATH)) {
    console.error(`\n  No service account key at: ${KEY_PATH}\n`);
    process.exit(1);
  }
  initializeApp({ credential: cert(JSON.parse(fs.readFileSync(KEY_PATH, 'utf8'))) });
}

const db = getFirestore();

const REMAP = {
  primary: 'primary',
  '6-9': 'primary',
  '13-15': 'lower-secondary',
  '10-13': 'lower-secondary',
  '11-13': 'lower-secondary',
  '14-16': 'lower-secondary',
  '16-18': 'higher-secondary',
  '17-18': 'higher-secondary',
  '14-18': 'higher-secondary'
};

const VALID_COHORTS = ['primary', 'lower-secondary', 'higher-secondary'];

console.log(`\n  Cohort migration to three cohorts (primary, lower-secondary, higher-secondary)${DRY_RUN ? '  [DRY RUN]' : ''}\n`);

const snap = await db.collection('users').get();
const changes = [];
let alreadyOk = 0;
const countsByCohort = { primary: 0, 'lower-secondary': 0, 'higher-secondary': 0 };

snap.forEach((d) => {
  const data = d.data();
  // Only students/learners need cohort migration
  if (data.role && data.role !== 'student' && data.role !== 'learner') {
    return;
  }

  const currentCohort = data.cohort;
  const currentBand = data.ageBand;

  if (currentCohort && VALID_COHORTS.includes(currentCohort) && currentBand === currentCohort) {
    alreadyOk++;
    countsByCohort[currentCohort] = (countsByCohort[currentCohort] || 0) + 1;
    return;
  }

  const targetCohort = (currentCohort && REMAP[currentCohort]) ||
                       (currentBand && REMAP[currentBand]) ||
                       'lower-secondary';

  changes.push({
    id: d.id,
    from: `cohort:${currentCohort || '(unset)'}, band:${currentBand || '(unset)'}`,
    to: targetCohort
  });
  countsByCohort[targetCohort] = (countsByCohort[targetCohort] || 0) + 1;
});

console.log(`  ${alreadyOk} account(s) already correctly assigned to a valid cohort.`);
console.log(`  ${changes.length} account(s) to rewrite.`);
console.log('  Distribution across cohorts:');
for (const [c, count] of Object.entries(countsByCohort)) {
  console.log(`    ${c.padEnd(20)}: ${count}`);
}

if (DRY_RUN) {
  console.log('\n  Dry run complete. No data modified. Re-run without --dry-run to apply.\n');
  process.exit(0);
}

let batch = db.batch();
let ops = 0;
for (const c of changes) {
  batch.set(db.collection('users').doc(c.id), { cohort: c.to, ageBand: c.to }, { merge: true });
  if (++ops >= 400) { await batch.commit(); batch = db.batch(); ops = 0; }
}
if (ops) await batch.commit();

console.log(`\n  Rewrote ${changes.length} account(s) with new cohort values.`);
process.exit(0);

