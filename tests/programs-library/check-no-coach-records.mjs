/** Emulator-only: reads, with admin rights, what the review flow left behind. Refuses anything but demo emulators. */
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

if (!/^127\.0\.0\.1:\d+$/.test(process.env.FIRESTORE_EMULATOR_HOST || '') || !/^127\.0\.0\.1:\d+$/.test(process.env.FIREBASE_AUTH_EMULATOR_HOST || '')) {
  throw new Error('Emulators only.');
}
initializeApp({ projectId: 'demo-hearisland-local' });
const db = getFirestore();
const auth = getAuth();
const programs = await db.collection('program_library').get();
for (const p of programs.docs) {
  const id = p.id;
  const enrolments = await db.collection('enrolments').where('programId', '==', id).get();
  console.log(JSON.stringify({ program: id, title: p.data().title, enrolled: enrolments.docs.map((d) => d.data().learnerId) }));
  const learnerEmails = await Promise.all(enrolments.docs.map((d) => auth.getUser(d.data().learnerId).then((u) => u.email)));
  console.log('enrolled accounts:', learnerEmails.join(', ') || 'none');
  for (const email of ['coach.rivera@school.edu', 'coach.okafor@school.edu', 'mia@school.edu']) {
    const { uid } = await auth.getUserByEmail(email);
    const progress = await db.collection('users').doc(uid).collection('activityProgress').doc(`pbl-program-${id}`).get();
    const sessions = progress.exists ? Object.keys(progress.data().sessions || {}) : [];
    const all = await db.collection('users').doc(uid).collection('activityProgress').get();
    console.log(email, JSON.stringify({ progressDoc: progress.exists, sessions, allActivityProgressDocs: all.size }));
  }
  const notes = await db.collection('coach_notifications').where('programId', '==', id).get();
  const comments = await p.ref.collection('comments').get();
  console.log(JSON.stringify({ notifications: notes.size, comments: comments.docs.map((c) => `${c.data().view} v${c.data().version}`) }));
}
