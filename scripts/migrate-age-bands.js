#!/usr/bin/env node

/**
 * One-time migration: rewrite retired age bands after the scope change to 13-18.
 *
 * Accounts created before 2026-09-18 carry '6-9', '10-13' or '14-18'. The first
 * two no longer exist. They still *resolve* safely at runtime (see
 * resolveAgeBand in server/safety.js), but leaving them stored means the profile
 * disagrees with the signup form and any coverage report double-counts bands.
 *
 *   '6-9'   -> flagged for review; these accounts are below the supported age
 *   '10-13' -> '13-15'
 *   '14-18' -> '16-18' when the account looks upper-secondary, else '13-15'
 *
 * Usage:
 *   node scripts/migrate-age-bands.js --dry-run
 *   node scripts/migrate-age-bands.js
 */

// firebase-admin v14's ESM default export carries only app-level helpers;
// `auth` and `admin.firestore()` are undefined on it. Use the subpath
// entry points, which are the supported ESM surface.
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DRY_RUN = process.argv.includes('--dry-run');

const KEY_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS
  || path.join(__dirname, 'firebase-admin-key.json');

if (!fs.existsSync(KEY_PATH)) {
  console.error(`\n  No service account key at: ${KEY_PATH}\n`);
  process.exit(1);
}

initializeApp({ credential: cert(JSON.parse(fs.readFileSync(KEY_PATH, 'utf8'))) });
const db = getFirestore();
const auth = getAuth();

// '14-18' spans the new boundary, so it cannot be mapped mechanically. Send it
// to the younger band: under-pitching a 17-year-old is recoverable, addressing
// a 14-year-old as a final-year student is not.
const REMAP = { '10-13': '13-15', '14-18': '13-15' };
const UNSUPPORTED = ['6-9'];

console.log(`\n  Age band migration to 13-18 scope${DRY_RUN ? '  [DRY RUN]' : ''}\n`);

const snap = await db.collection('users').get();
const changes = [];
const belowAge = [];
let alreadyOk = 0;

snap.forEach((d) => {
  const data = d.data();
  const current = data.ageBand;

  if (current === '13-15' || current === '16-18') { alreadyOk++; return; }
  if (UNSUPPORTED.includes(current)) {
    belowAge.push({ id: d.id, email: data.email, current });
    return;
  }
  changes.push({ id: d.id, email: data.email, from: current || '(unset)', to: REMAP[current] || '13-15' });
});

console.log(`  ${alreadyOk} account(s) already on a supported band.`);
console.log(`  ${changes.length} account(s) to rewrite.`);
console.log(`  ${belowAge.length} account(s) below the supported age.\n`);

changes.slice(0, 20).forEach((c) =>
  console.log(`    ${(c.email || c.id).padEnd(34)} ${c.from} -> ${c.to}`));
if (changes.length > 20) console.log(`    ... and ${changes.length - 20} more`);

if (belowAge.length) {
  console.log('\n  These accounts were registered as under-13 and are now out of scope.');
  console.log('  They are NOT modified - decide whether to offboard or re-age them:\n');
  belowAge.forEach((b) => console.log(`    ${b.email || b.id}  (${b.current})`));
}

if (DRY_RUN) {
  console.log('\n  Dry run complete. Re-run without --dry-run to apply.\n');
  process.exit(0);
}

let batch = db.batch();
let ops = 0;
for (const c of changes) {
  batch.set(db.collection('users').doc(c.id), { ageBand: c.to }, { merge: true });
  if (++ops >= 400) { await batch.commit(); batch = db.batch(); ops = 0; }
}
if (ops) await batch.commit();

console.log(`\n  Rewrote ${changes.length} account(s).`);
console.log('  Students pick up the new band on their next sign-in.\n');
process.exit(0);
