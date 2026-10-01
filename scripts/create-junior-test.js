#!/usr/bin/env node

/**
 * Create a Junior Explorer (primary) test student on the LIVE Firebase project.
 *
 * Uses the Firebase Auth REST API + Firestore REST API so no service-account
 * credential is needed — just the public API key.
 *
 * Usage:  node scripts/create-junior-test.js
 */

const API_KEY = 'AIzaSyBpLWqHOfy3A8FTILx4kE4bimhbbwPlOqQ';
const PROJECT_ID = 'dnd-master-73449';
const EMAIL = 'junior.explorer@test.com';
const PASSWORD = 'Junior2026!';
const DISPLAY_NAME = 'Junior Explorer';

async function createOrSignIn() {
  // Try sign-up first
  let res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD, returnSecureToken: true }),
    }
  );
  let data = await res.json();

  if (data.error && data.error.message === 'EMAIL_EXISTS') {
    // Account already exists — sign in instead
    res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: EMAIL, password: PASSWORD, returnSecureToken: true }),
      }
    );
    data = await res.json();
    if (data.error) throw new Error(`Sign-in failed: ${data.error.message}`);
    console.log(`  ✓ Auth account already exists (uid: ${data.localId})`);
  } else if (data.error) {
    throw new Error(`Sign-up failed: ${data.error.message}`);
  } else {
    console.log(`  ✓ Created Auth account (uid: ${data.localId})`);
  }

  return { uid: data.localId, idToken: data.idToken };
}

async function writeProfile(uid, idToken) {
  const docPath = `projects/${PROJECT_ID}/databases/(default)/documents/users/${uid}`;
  const url = `https://firestore.googleapis.com/v1/${docPath}?updateMask.fieldPaths=uid&updateMask.fieldPaths=email&updateMask.fieldPaths=displayName&updateMask.fieldPaths=role&updateMask.fieldPaths=ageBand&updateMask.fieldPaths=groupName&updateMask.fieldPaths=classIds&updateMask.fieldPaths=isFirstTimeUser&updateMask.fieldPaths=updatedAt`;

  const now = new Date().toISOString();

  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      fields: {
        uid: { stringValue: uid },
        email: { stringValue: EMAIL },
        displayName: { stringValue: DISPLAY_NAME },
        role: { stringValue: 'student' },
        ageBand: { stringValue: 'primary' },
        groupName: { stringValue: 'Junior Explorers' },
        classIds: { arrayValue: { values: [] } },
        isFirstTimeUser: { booleanValue: true },
        updatedAt: { timestampValue: now },
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Firestore write failed: ${JSON.stringify(err.error)}`);
  }
  console.log('  ✓ Firestore profile written (ageBand: primary)');
}

console.log(`\n  Creating Junior Explorer test account on project "${PROJECT_ID}"\n`);

const { uid, idToken } = await createOrSignIn();
await writeProfile(uid, idToken);

console.log('\n  ┌──────────────────────────────────────────────┐');
console.log('  │  Junior Explorer Test Account                │');
console.log(`  │  Email:    ${EMAIL.padEnd(34)}│`);
console.log(`  │  Password: ${PASSWORD.padEnd(34)}│`);
console.log('  │  Age Band: primary (Junior Explorers)        │');
console.log('  └──────────────────────────────────────────────┘\n');

process.exit(0);
