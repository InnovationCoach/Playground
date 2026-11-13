// Assign Spark learner IDs (publicId) to students that do not have one.
//
// DEFAULT = DRY-RUN (read-only): prints the plan, writes nothing.
//   node scripts/assign-learner-ids.js
//   FIRESTORE_EMULATOR_HOST=... node scripts/assign-learner-ids.js --apply     (emulator only)
//
// --apply is refused outside the Firestore emulator. A live write needs Mani's written go for
// that exact step (AGENTS.md).
//
// Idempotent: students that already have a publicId are skipped. The Mastery externalId is
// derived (never stored here); masteryLearnerId is filled in later by the Mastery sync.
// Edmentum ID is NOT handled: the required identifier has not been confirmed.
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { JOIN_CODE_ALPHABET } from '../src/utils/joinCode.js';
import { buildDeterministicMasteryExternalId } from '../server/routes/mastery.js';

const apply = process.argv.includes('--apply');
const onEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
if (apply && !onEmulator) {
  console.error('Refusing --apply: not running against the Firestore emulator.');
  process.exit(1);
}

initializeApp({ credential: onEmulator ? undefined : applicationDefault(), projectId: process.env.GCLOUD_PROJECT || 'dnd-master-73449' });
const db = getFirestore();

const alphabet = JOIN_CODE_ALPHABET || 'BCDFGHJKMNPQRSTVWXYZ23456789';
const reservedThisRun = new Set();

async function nextFreeId() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const id = Array.from({ length: 4 }, () =>
      Array.from({ length: 3 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('')
    ).join('-');
    if (reservedThisRun.has(id)) continue;
    if ((await db.collection('publicIds').doc(id).get()).exists) continue;
    reservedThisRun.add(id);
    return id;
  }
  throw new Error('Could not find a free publicId');
}

const students = (await db.collection('users').where('role', '==', 'student').get()).docs.map((d) => ({ uid: d.id, ...d.data() }));
const plan = [];
for (const s of students) {
  if (s.publicId) { plan.push({ uid: s.uid, email: s.email, action: 'skip (has publicId)', publicId: s.publicId }); continue; }
  plan.push({
    uid: s.uid,
    email: s.email,
    action: 'assign',
    publicId: await nextFreeId(),
    masteryExternalId: buildDeterministicMasteryExternalId(s.uid)
  });
}

console.log(JSON.stringify({ mode: apply ? 'APPLY(emulator)' : 'DRY-RUN', total: plan.length, toAssign: plan.filter((p) => p.action === 'assign').length, plan }, null, 2));

if (apply) {
  for (const p of plan.filter((x) => x.action === 'assign')) {
    const batch = db.batch();
    batch.set(db.collection('users').doc(p.uid), { publicId: p.publicId, updatedAt: new Date().toISOString() }, { merge: true });
    batch.create(db.collection('publicIds').doc(p.publicId), { uid: p.uid, createdAt: new Date().toISOString() });
    await batch.commit();
    console.log('assigned (emulator)', p.email, p.publicId);
  }
}
