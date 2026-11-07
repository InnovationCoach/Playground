/**
 * Emulator-only: a second, synthetic coach makes a first save through the Firestore
 * rules, so an already signed-in coach can be seen receiving the toast.
 */
import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { connectFirestoreEmulator, doc, getFirestore, writeBatch } from 'firebase/firestore';
import { initializeApp as adminApp } from 'firebase-admin/app';
import { getAuth as adminAuth } from 'firebase-admin/auth';

if (process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8288' || process.env.FIREBASE_AUTH_EMULATOR_HOST !== '127.0.0.1:9399') throw new Error('Emulators only.');
const EMAIL = 'coach.third@school.test';
const PASSWORD = `fixture-${Date.now()}`;
const project = 'demo-hearisland-local';

adminApp({ projectId: project });
let user;
try { user = await adminAuth().getUserByEmail(EMAIL); await adminAuth().updateUser(user.uid, { password: PASSWORD }); }
catch { user = await adminAuth().createUser({ email: EMAIL, password: PASSWORD, displayName: 'Third Coach', emailVerified: true }); }
await adminAuth().setCustomUserClaims(user.uid, { role: 'coach', classIds: [] });

const app = initializeApp({ projectId: project, apiKey: 'fake' }, 'client');
const auth = getAuth(app);
connectAuthEmulator(auth, 'http://127.0.0.1:9399', { disableWarnings: true });
const db = getFirestore(app);
connectFirestoreEmulator(db, '127.0.0.1', 8288);
await signInWithEmailAndPassword(auth, EMAIL, PASSWORD);

const id = `pbl-third-${Date.now()}`;
const now = Date.now();
const milestones = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({ id: `ms-${n}`, stageNumber: n, stageName: `Stage ${n}`, title: `Stage ${n} work`, week: n, durationMin: 90, learningGoal: 'Goal', activities: ['Do it'], makerSpaceTools: ['Bench'], evidencePrompt: 'Show it', allowedSubmissions: ['video'], coachCue: 'Cue', competencies: [] }));
const unit = { id, unitTitle: 'Solar Shade Studio', theme: 'Energy', drivingQuestion: 'How might shade structures make our yard cooler?', realProblem: { summary: 'The yard is too hot at noon.', peopleImpact: 'Cooler play', environmentalImpact: 'Less cooling power' }, makerSpaceSpecs: [{ toolType: 'Workstation', specs: 'Laser cutter', safetyGuidelines: 'Eye protection' }], coachCues: { leadCoach: 'Lead' }, milestones };
const batch = writeBatch(db);
batch.set(doc(db, 'program_library', id), { programId: id, orgId: 'org-welearn', creatorUid: user.uid, creatorName: 'Third Coach', title: unit.unitTitle, description: unit.realProblem.summary, unit, status: 'draft', draftVersion: 1, publishedVersion: null, hasUnpublishedChanges: false, createdAt: now, updatedAt: now, publishedAt: null });
batch.set(doc(db, 'coach_notifications', `program-review_${id}`), { type: 'program_review', programId: id, orgId: 'org-welearn', actorUid: user.uid, actorName: 'Third Coach', programTitle: unit.unitTitle, createdAt: now });
await batch.commit();
console.log('saved', id);
process.exit(0);
