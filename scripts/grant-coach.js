#!/usr/bin/env node

/**
 * Grant or revoke coach access, and assign coaches to classes.
 *
 * `role` and `classIds` are custom auth claims, not Firestore fields. A claim is
 * signed by Firebase Auth, so the client cannot forge or edit it, and the
 * security rules read it without spending a document read. The Firestore mirror
 * is kept only so the admin tooling can list coaches; rules never trust it.
 *
 * Usage:
 *   node scripts/grant-coach.js alice@school.edu --class class_7a
 *   node scripts/grant-coach.js alice@school.edu --class class_7a --class class_8b
 *   node scripts/grant-coach.js alice@school.edu --revoke
 *   node scripts/grant-coach.js --list
 *   node scripts/grant-coach.js --list-classes
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
const args = process.argv.slice(2);
const REVOKE = args.includes('--revoke');
const LIST = args.includes('--list');
const LIST_CLASSES = args.includes('--list-classes');

// --class may be repeated.
const classIds = args.reduce((acc, arg, i) => {
  if (arg === '--class' && args[i + 1] && !args[i + 1].startsWith('--')) acc.push(args[i + 1]);
  return acc;
}, []);

const email = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--class');

const KEY_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS
  || path.join(__dirname, 'firebase-admin-key.json');

if (!fs.existsSync(KEY_PATH)) {
  console.error(`\n  No service account key at: ${KEY_PATH}`);
  console.error('  Firebase Console -> Project Settings -> Service Accounts -> Generate new private key');
  console.error('  Save as scripts/firebase-admin-key.json (gitignored).\n');
  process.exit(1);
}

if (!LIST && !LIST_CLASSES && !email) {
  console.error('\n  Usage: node scripts/grant-coach.js <email> --class <classId> [--class <classId>...]');
  console.error('         node scripts/grant-coach.js <email> --revoke');
  console.error('         node scripts/grant-coach.js --list');
  console.error('         node scripts/grant-coach.js --list-classes\n');
  process.exit(1);
}

initializeApp({ credential: cert(JSON.parse(fs.readFileSync(KEY_PATH, 'utf8'))) });
const db = getFirestore();
const auth = getAuth();

try {
  if (LIST_CLASSES) {
    const snap = await db.collection('classes').get();
    console.log(`\n  ${snap.size} class(es):\n`);
    snap.forEach((d) => {
      const c = d.data();
      console.log(`    ${d.id.padEnd(28)} ${c.name || '(unnamed)'}  coaches: ${(c.coachIds || []).length}`);
    });
    console.log('');
    process.exit(0);
  }

  if (LIST) {
    const snap = await db.collection('users').where('role', '==', 'teacher').get();
    console.log(`\n  ${snap.size} coach account(s):\n`);
    for (const d of snap.docs) {
      // The claim is the source of truth, so report that rather than the mirror.
      let claims = {};
      try {
        claims = (await auth.getUser(d.id)).customClaims || {};
      } catch { /* account deleted but profile left behind */ }
      const assigned = (claims.classIds || []).join(', ') || '(none - cannot see any students)';
      console.log(`    ${(d.data().email || '(no email)').padEnd(32)} ${d.id}`);
      console.log(`      classes: ${assigned}`);
    }
    console.log('');
    process.exit(0);
  }

  const user = await auth.getUserByEmail(email);

  if (REVOKE) {
    await auth.setCustomUserClaims(user.uid, { role: 'student', classIds: [] });
    await db.collection('users').doc(user.uid).set(
      { role: 'student', roleGrantedAt: Date.now(), roleGrantedBy: 'admin-script' },
      { merge: true }
    );
    console.log(`\n  Revoked coach access for ${email}`);
    console.log('  They must sign out and back in for this to take effect.\n');
    process.exit(0);
  }

  if (classIds.length === 0) {
    console.error('\n  Refusing to grant coach access with no class.');
    console.error('  A coach with no class can see no students, which looks like a broken dashboard.');
    console.error('  Pass --class <classId>, or list existing classes with --list-classes.\n');
    process.exit(1);
  }

  // Every class must already exist: a typo would otherwise create a coach
  // pointing at a class id that never gets any students.
  const missing = [];
  for (const cid of classIds) {
    const snap = await db.collection('classes').doc(cid).get();
    if (!snap.exists) missing.push(cid);
  }
  if (missing.length) {
    console.error(`\n  No such class: ${missing.join(', ')}`);
    console.error('  Create it first, or run scripts/migrate-to-classes.js to build classes from existing groupNames.\n');
    process.exit(1);
  }

  await auth.setCustomUserClaims(user.uid, { role: 'teacher', classIds });

  await db.collection('users').doc(user.uid).set(
    { role: 'teacher', roleGrantedAt: Date.now(), roleGrantedBy: 'admin-script' },
    { merge: true }
  );

  // Mirror onto the class so a roster view can list its coaches.
  await Promise.all(classIds.map((cid) =>
    db.collection('classes').doc(cid).set(
      { coachIds: FieldValue.arrayUnion(user.uid) },
      { merge: true }
    )
  ));

  console.log(`\n  Granted coach access to ${email}`);
  console.log(`  uid ${user.uid}`);
  console.log(`  classes: ${classIds.join(', ')}`);
  console.log('  They must sign out and back in for this to take effect.\n');
  process.exit(0);
} catch (err) {
  const msg = err.code === 'auth/user-not-found'
    ? `No account exists for ${email}. They must register first, then run this.`
    : err.message;
  console.error(`\n  Failed: ${msg}\n`);
  process.exit(1);
}
