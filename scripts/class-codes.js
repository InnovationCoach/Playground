#!/usr/bin/env node

/**
 * Issue, list and rotate class join codes.
 *
 * A code is what a learner types to join a class, so it is the only thing
 * standing between an outsider and a class roster. Codes are written here with
 * the Admin SDK because `classCodes` is client-unwritable by rule - a learner
 * who could mint a code could enrol into any class they liked.
 *
 * Usage:
 *   node scripts/class-codes.js --list
 *   node scripts/class-codes.js --issue <classId>
 *   node scripts/class-codes.js --rotate <classId>     (revokes the old code)
 *   node scripts/class-codes.js --revoke <classId>
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateJoinCode } from '../src/utils/joinCode.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? null : (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true);
};

const LIST = args.includes('--list');
const issue = flag('issue');
const rotate = flag('rotate');
const revoke = flag('revoke');

const KEY_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS
  || path.join(__dirname, 'firebase-admin-key.json');

const useEmulator = !!process.env.FIRESTORE_EMULATOR_HOST;

if (!useEmulator && !fs.existsSync(KEY_PATH)) {
  console.error(`\n  No service account key at: ${KEY_PATH}`);
  console.error('  Firebase Console -> Project Settings -> Service Accounts -> Generate new private key\n');
  process.exit(1);
}

if (!LIST && !issue && !rotate && !revoke) {
  console.error('\n  Usage: node scripts/class-codes.js --list');
  console.error('         node scripts/class-codes.js --issue <classId>');
  console.error('         node scripts/class-codes.js --rotate <classId>');
  console.error('         node scripts/class-codes.js --revoke <classId>\n');
  process.exit(1);
}

initializeApp(useEmulator
  ? { projectId: process.env.GCLOUD_PROJECT || 'demo-hearisland-local' }
  : { credential: cert(JSON.parse(fs.readFileSync(KEY_PATH, 'utf8'))) });
const db = getFirestore();

/** Retries on the astronomically unlikely collision rather than overwriting. */
async function freshCode() {
  for (let i = 0; i < 20; i += 1) {
    const code = generateJoinCode();
    if (!(await db.collection('classCodes').doc(code).get()).exists) return code;
  }
  throw new Error('Could not find an unused code after 20 attempts');
}

async function currentCodesFor(classId) {
  const snap = await db.collection('classCodes').where('classId', '==', classId).get();
  return snap.docs.map((d) => d.id);
}

try {
  if (LIST) {
    const classes = await db.collection('classes').get();
    console.log(`\n  ${classes.size} class(es):\n`);
    for (const c of classes.docs) {
      const codes = await currentCodesFor(c.id);
      const roster = await db.collection('users').where('classIds', 'array-contains', c.id).get();
      console.log(`    ${c.id}`);
      console.log(`      name    ${c.data().name || '(unnamed)'}`);
      console.log(`      code    ${codes.length ? codes.join(', ') : '(none issued - learners cannot join)'}`);
      console.log(`      members ${roster.size}`);
    }
    console.log('');
    process.exit(0);
  }

  const classId = issue || rotate || revoke;
  const classRef = db.collection('classes').doc(classId);
  const classSnap = await classRef.get();

  if (!classSnap.exists) {
    console.error(`\n  No such class: ${classId}`);
    console.error('  Run with --list to see valid class ids.\n');
    process.exit(1);
  }

  const existing = await currentCodesFor(classId);

  if (revoke) {
    await Promise.all(existing.map((c) => db.collection('classCodes').doc(c).delete()));
    console.log(`\n  Revoked ${existing.length} code(s) for ${classId}.`);
    console.log('  Nobody can join this class until a new code is issued.\n');
    process.exit(0);
  }

  if (issue && existing.length) {
    console.log(`\n  ${classId} already has a code: ${existing.join(', ')}`);
    console.log('  Use --rotate to replace it (the old one stops working).\n');
    process.exit(0);
  }

  // Rotating deletes the old code first, so a code that has leaked genuinely
  // stops working rather than lingering alongside its replacement.
  if (rotate && existing.length) {
    await Promise.all(existing.map((c) => db.collection('classCodes').doc(c).delete()));
  }

  const code = await freshCode();
  await db.collection('classCodes').doc(code).set({
    classId,
    className: classSnap.data().name || classId,
    createdAt: FieldValue.serverTimestamp()
  });
  await classRef.set({ joinCode: code }, { merge: true });

  console.log(`\n  ${rotate ? 'Rotated' : 'Issued'} join code for ${classSnap.data().name || classId}\n`);
  console.log(`      ${code}\n`);
  if (rotate && existing.length) console.log(`  The previous code (${existing.join(', ')}) no longer works.`);
  console.log('  Learners enter this on the sign-up form, or under "Join a class".\n');
  process.exit(0);
} catch (err) {
  console.error(`\n  Failed: ${err.message}\n`);
  process.exit(1);
}
