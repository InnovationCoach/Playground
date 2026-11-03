/** Explicit, disposable local-demo actors. No production configuration or tokens. */
import assert from 'node:assert/strict';

for (const name of ['FIRESTORE_EMULATOR_HOST', 'FIREBASE_AUTH_EMULATOR_HOST']) {
  assert.match(process.env[name] || '', /^(127\.0\.0\.1|localhost):\d{2,5}$/, `${name} must explicitly name a local emulator`);
}
assert.match(process.env.GCLOUD_PROJECT || '', /^demo-[a-z0-9-]+$/, 'An explicit demo project is required');
assert.equal(Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS), false, 'Production credentials are prohibited');
process.env.GOOGLE_CLOUD_PROJECT = process.env.GCLOUD_PROJECT;

// SDK-bearing modules load only after the demo/local safety checks.
const { initializeApp, deleteApp } = await import('firebase-admin/app');
const { getAuth } = await import('firebase-admin/auth');
const { getFirestore } = await import('firebase-admin/firestore');
const app = initializeApp({ projectId: process.env.GCLOUD_PROJECT });
const auth = getAuth(app);
const db = getFirestore(app);
const actors = [
  { uid:'phase1-demo-learner', email:'learner@universe.example', displayName:'Pilot Learner (synthetic)', role:'student', orgId:'phase1-demo-school', classIds:['phase1-demo-class'] },
  { uid:'phase1-demo-coach', email:'coach@universe.example', displayName:'Pilot Coach (synthetic)', role:'coach', orgId:'phase1-demo-school', classIds:['phase1-demo-class'] },
  { uid:'phase1-demo-other', email:'other@universe.example', displayName:'Other School Reviewer (synthetic)', role:'admin', orgId:'phase1-demo-other-school', classIds:[] }
];

try {
  await db.collection('classes').doc('phase1-demo-class').set({
    orgId:'phase1-demo-school', status:'active', synthetic:true,
    coachIds:['phase1-demo-coach'], learnerIds:['phase1-demo-learner']
  });
  for (const actor of actors) {
    const {uid,email,displayName,role,orgId,classIds} = actor;
    // This public fixture password is valid only in the guarded local emulator.
    const fields = {email,displayName,emailVerified:true,password:'Synthetic-Pilot-Only-2026!'};
    try { await auth.getUser(uid); await auth.updateUser(uid, fields); }
    catch (error) {
      if (error.code !== 'auth/user-not-found') throw error;
      await auth.createUser({uid,...fields});
    }
    await auth.setCustomUserClaims(uid, {role,orgId,classIds});
    await db.collection('users').doc(uid).set({uid,displayName,role,orgId,classIds,status:'active',synthetic:true});
    await db.collection('universeMemberships').doc(uid).set({role,orgId,classIds,status:'active',synthetic:true});
  }
  console.log('Seeded three synthetic pilot actors in the explicitly selected local demo emulators.');
} finally {
  await db.terminate();
  await deleteApp(app);
}
