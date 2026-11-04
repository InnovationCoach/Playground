/**
 * Removes the three sample material requests that the server used to seed into
 * materialRequests (server/routes/operations.js, before this change).
 *
 * Dry run by default: lists what would be deleted and changes nothing.
 *   node scripts/remove-sample-material-requests.mjs --project dnd-master-73449
 * Delete, only after reviewing the dry run:
 *   node scripts/remove-sample-material-requests.mjs --project dnd-master-73449 --confirm
 *
 * Only documents that match the sample exactly (id, requester email and item name) are touched.
 * Authenticate with `gcloud auth application-default login` first.
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const SAMPLES = [
  { requestId: 'mat-001', item: 'Digital Solar Irradiance Sensors' },
  { requestId: 'mat-002', item: 'Microplastics Water Sample Centrifuge' },
  { requestId: 'mat-003', item: 'Arduino Microcontroller Kits (Pack of 10)' }
];
const SAMPLE_EMAIL = 'coach.wpr@school.edu';

const args = process.argv.slice(2);
const projectId = args[args.indexOf('--project') + 1];
const confirm = args.includes('--confirm');
if (!projectId || projectId.startsWith('demo-')) {
  console.error('Pass the live project id with --project <id>.');
  process.exit(1);
}

initializeApp({ credential: applicationDefault(), projectId });
const db = getFirestore();
const matches = [];
for (const sample of SAMPLES) {
  const snap = await db.collection('materialRequests').doc(sample.requestId).get();
  if (!snap.exists) continue;
  const data = snap.data();
  if (data.requestedByEmail === SAMPLE_EMAIL && data.item === sample.item) {
    matches.push(snap.ref);
    console.log(`match  ${sample.requestId}  ${data.item}  (${data.status})`);
  } else {
    console.log(`skip   ${sample.requestId}  does not match the sample; left in place`);
  }
}

if (!matches.length) {
  console.log('Nothing to remove.');
} else if (!confirm) {
  console.log(`Dry run: ${matches.length} document(s) would be deleted. Re-run with --confirm to delete.`);
} else {
  const batch = db.batch();
  matches.forEach(ref => batch.delete(ref));
  await batch.commit();
  console.log(`Deleted ${matches.length} sample document(s).`);
}
