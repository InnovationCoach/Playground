#!/usr/bin/env node

/**
 * One-time migration: give every existing account a class, and move coach
 * privileges from Firestore fields into signed auth claims.
 *
 * Why this is needed: the hardened rules scope every read to a class
 * (users.classIds vs the coach's classIds claim). Existing documents predate
 * both fields, so without this migration:
 *   - every student profile becomes unreadable by any coach, and
 *   - every existing coach loses coach access, because rules no longer trust
 *     the `role` field in Firestore.
 *
 * Classes are derived from the existing `groupName` string, which is the only
 * grouping the app had. Coaches are assigned to the class matching their own
 * groupName; any coach that leaves unassigned is reported so an admin can place
 * them explicitly with scripts/grant-coach.js.
 *
 * Usage:
 *   node scripts/migrate-to-classes.js --dry-run     # report only, writes nothing
 *   node scripts/migrate-to-classes.js
 *   node scripts/migrate-to-classes.js --assign-all-coaches
 *       Give every coach every class. Correct only for a single-school
 *       deployment where all coaches genuinely share all students.
 */

// firebase-admin v14's ESM default export carries only app-level helpers;
// `auth` and `admin.firestore()` are undefined on it. Use the subpath
// entry points, which are the supported ESM surface.
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { generateJoinCode } from '../src/utils/joinCode.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const ASSIGN_ALL = args.includes('--assign-all-coaches');
const DEFAULT_ORG = process.env.MIGRATION_ORG_ID || 'org_default';

const KEY_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS
  || path.join(__dirname, 'firebase-admin-key.json');

if (!fs.existsSync(KEY_PATH)) {
  console.error(`\n  No service account key at: ${KEY_PATH}\n`);
  process.exit(1);
}

initializeApp({ credential: cert(JSON.parse(fs.readFileSync(KEY_PATH, 'utf8'))) });
const db = getFirestore();
const auth = getAuth();

const slug = (name) =>
  'class_' + String(name || 'unassigned')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);

console.log(`\n  Migration to class-scoped tenancy${DRY_RUN ? '  [DRY RUN - nothing will be written]' : ''}\n`);

const usersSnap = await db.collection('users').get();
console.log(`  ${usersSnap.size} user document(s) found.\n`);

// 1. Derive the class set from existing groupNames.
const classesByName = new Map();
usersSnap.forEach((d) => {
  const name = d.data().groupName || 'Unassigned';
  if (!classesByName.has(name)) classesByName.set(name, slug(name));
});

console.log(`  Classes to create (${classesByName.size}):`);
for (const [name, id] of classesByName) console.log(`    ${id.padEnd(30)} <- "${name}"`);
console.log('');

// 2. Split accounts. Role still comes from the Firestore field here - this is
//    the migration that moves it into a claim, so the field is all we have.
const coaches = [];
const students = [];
usersSnap.forEach((d) => {
  const data = d.data();
  const target = (data.role === 'teacher' || data.role === 'coach') ? coaches : students;
  target.push({ id: d.id, ...data });
});

console.log(`  ${coaches.length} coach account(s), ${students.length} student account(s).\n`);

const allClassIds = [...classesByName.values()];
const unassignedCoaches = [];

if (DRY_RUN) {
  for (const c of coaches) {
    const own = classesByName.get(c.groupName);
    const assigned = ASSIGN_ALL ? allClassIds : (own ? [own] : []);
    if (!assigned.length) unassignedCoaches.push(c);
    console.log(`    coach  ${(c.email || c.id).padEnd(32)} -> ${assigned.join(', ') || '(NONE)'}`);
  }
  for (const s of students.slice(0, 10)) {
    console.log(`    student ${(s.email || s.id).padEnd(31)} -> ${classesByName.get(s.groupName || 'Unassigned')}`);
  }
  if (students.length > 10) console.log(`    ... and ${students.length - 10} more student(s)`);
  console.log(`\n  Dry run complete. Re-run without --dry-run to apply.\n`);
  process.exit(0);
}

// 3. Create class documents.
let batch = db.batch();
let ops = 0;
const commit = async () => { if (ops) { await batch.commit(); batch = db.batch(); ops = 0; } };

const codesByClass = {};
for (const [name, id] of classesByName) {
  const code = generateJoinCode();
  codesByClass[id] = code;

  batch.set(db.collection('classes').doc(id), {
    name,
    orgId: DEFAULT_ORG,
    coachIds: [],
    joinCode: code,
    migratedFromGroupName: name,
    createdAt: FieldValue.serverTimestamp()
  }, { merge: true });

  // Without a code, a migrated class exists but nobody can join it.
  batch.set(db.collection('classCodes').doc(code), {
    classId: id,
    className: name,
    createdAt: FieldValue.serverTimestamp()
  });

  if (++ops >= 400) await commit();
}
await commit();
console.log(`  Created/updated ${classesByName.size} class document(s), each with a join code.`);

// 4. Backfill classIds on every user.
for (const u of [...students, ...coaches]) {
  const cid = classesByName.get(u.groupName || 'Unassigned');
  if (!cid) continue;
  batch.set(db.collection('users').doc(u.id), { classIds: [cid] }, { merge: true });
  if (++ops >= 400) await commit();
}
await commit();
console.log(`  Backfilled classIds on ${students.length + coaches.length} user document(s).`);

// 5. Move coach privilege into auth claims. This is what the rules actually
//    read; the Firestore `role` field is kept only for admin listings.
for (const c of coaches) {
  const own = classesByName.get(c.groupName);
  const assigned = ASSIGN_ALL ? allClassIds : (own ? [own] : []);

  if (!assigned.length) {
    unassignedCoaches.push(c);
    continue;
  }

  try {
    await auth.setCustomUserClaims(c.id, { role: 'teacher', classIds: assigned });
    await Promise.all(assigned.map((cid) =>
      db.collection('classes').doc(cid).set(
        { coachIds: FieldValue.arrayUnion(c.id) },
        { merge: true }
      )
    ));
    console.log(`  coach ${c.email || c.id} -> ${assigned.join(', ')}`);
  } catch (err) {
    console.warn(`  WARNING could not set claims for ${c.email || c.id}: ${err.message}`);
    unassignedCoaches.push(c);
  }
}

console.log('\n  Migration complete.\n');

if (unassignedCoaches.length) {
  console.log('  These coaches were NOT assigned to a class and will see an empty');
  console.log('  dashboard until an admin places them:\n');
  unassignedCoaches.forEach((c) => console.log(`    node scripts/grant-coach.js ${c.email || c.id} --class <classId>`));
  console.log('');
}

console.log('  Join codes to hand out:');
for (const [name, id] of classesByName) console.log(`    ${codesByClass[id]}  -> ${name}`);
console.log('');
console.log('  Every coach must sign out and back in before their new claims take effect.\n');
process.exit(0);
