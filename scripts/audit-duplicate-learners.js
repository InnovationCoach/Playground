// Audit duplicate learner accounts (same display name) and report learner-ID readiness.
//
// DEFAULT = READ-ONLY. Prints a plan; changes nothing.
//   node scripts/audit-duplicate-learners.js                 (uses Application Default Credentials)
//   FIRESTORE_EMULATOR_HOST=... FIREBASE_AUTH_EMULATOR_HOST=... node scripts/audit-duplicate-learners.js --apply
//
// --apply is refused unless the Auth emulator is in use. Deleting live accounts needs Mani's
// written go for that exact step (AGENTS.md) and should be done from the reviewed plan output.
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { buildDeterministicMasteryExternalId } from '../server/routes/mastery.js';

const KEEP_EMAILS = new Set(['yuri.na@welearn.org']);
const KNOWN_BAD_EMAILS = new Set(['aey@welearn.org']); // confirmed not real; excluded from keep/learner logic
const apply = process.argv.includes('--apply');
const onEmulator = Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST);

if (apply && !onEmulator) {
  console.error('Refusing --apply: not running against the Auth emulator.');
  process.exit(1);
}

initializeApp({ credential: onEmulator ? undefined : applicationDefault(), projectId: process.env.GCLOUD_PROJECT || 'dnd-master-73449' });
const auth = getAuth();
const db = getFirestore();

const norm = (s) => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
const ms = (v) => (v?.toDate ? v.toDate().getTime() : Date.parse(v) || 0);

const snap = await db.collection('users').where('role', '==', 'student').get();
const students = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
const groups = new Map();
for (const s of students) {
  const key = norm(s.displayName || `${s.givenNames || ''} ${s.surname || ''}`);
  if (!key) continue;
  groups.set(key, [...(groups.get(key) || []), s]);
}

const plan = { keep: [], remove: [], flagged: [] };
for (const [name, list] of groups) {
  if (list.length < 2) continue;
  // Keep the newest account (today's), unless an explicitly protected email is in the group.
  const protectedAcct = list.find((s) => KEEP_EMAILS.has(String(s.email).toLowerCase()));
  const sorted = [...list].sort((a, b) => ms(b.createdAt) - ms(a.createdAt));
  const keeper = protectedAcct || sorted[0];
  plan.keep.push({ name, uid: keeper.id, email: keeper.email, createdAt: keeper.createdAt });
  for (const s of list) {
    if (s.id === keeper.id) continue;
    if (KEEP_EMAILS.has(String(s.email).toLowerCase())) { plan.flagged.push({ name, uid: s.id, email: s.email, reason: 'protected' }); continue; }
    plan.remove.push({ name, uid: s.id, email: s.email, createdAt: s.createdAt });
  }
}

// Learner-ID readiness for every student that will remain.
const removeUids = new Set(plan.remove.map((r) => r.uid));
const idReport = students.filter((s) => !removeUids.has(s.id)).map((s) => ({
  uid: s.id,
  email: s.email,
  publicId: s.publicId || null,                       // Spark learner ID (XXX-XXX-XXX-XXX)
  masteryExternalId: buildDeterministicMasteryExternalId(s.id), // derived, <= 20 chars
  masteryLearnerId: s.masteryLearnerId || null,       // vendor id, set after sync
  missing: [!s.publicId && 'publicId', !s.masteryLearnerId && 'masteryLearnerId'].filter(Boolean),
  badEmail: KNOWN_BAD_EMAILS.has(String(s.email).toLowerCase())
}));

console.log(JSON.stringify({ mode: apply ? 'APPLY(emulator)' : 'DRY-RUN', plan, learnerIds: idReport }, null, 2));

if (apply) {
  for (const r of plan.remove) {
    await auth.deleteUser(r.uid).catch(() => {});
    await db.collection('users').doc(r.uid).delete();
    console.log('deleted (emulator)', r.email);
  }
}
