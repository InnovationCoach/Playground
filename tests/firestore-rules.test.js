/**
 * Security-rule tests for the tenancy and privilege boundaries.
 *
 * These encode the findings from the Phase 0 audit, so a regression fails the
 * build instead of quietly re-exposing children's data:
 *   - role cannot be self-assigned (privilege boundary)
 *   - classIds cannot be self-assigned (tenancy boundary)
 *   - a student cannot read any other student
 *   - a coach can only read students who share one of their classes
 *
 * Run: npm test   (starts the Firestore emulator automatically)
 */
import { describe, it, beforeAll, afterAll, beforeEach, expect } from 'vitest';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds
} from '@firebase/rules-unit-testing';
import fs from 'fs';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, addDoc, getDocs, query, where, writeBatch } from 'firebase/firestore';

let testEnv;

const CLASS_A = 'class_a';
const CLASS_B = 'class_b';

// Coaches carry role + classIds as custom claims, set by scripts/grant-coach.js.
const coachA = () => testEnv.authenticatedContext('coach_a', { role: 'teacher', classIds: [CLASS_A] });
const coachB = () => testEnv.authenticatedContext('coach_b', { role: 'teacher', classIds: [CLASS_B] });
// Students carry no role claim at all.
const studentA = () => testEnv.authenticatedContext('student_a');
const studentA2 = () => testEnv.authenticatedContext('student_a2');
const anon = () => testEnv.unauthenticatedContext();

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-hearisland-rules',
    firestore: {
      rules: fs.readFileSync('firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8088
    }
  });
});

afterAll(async () => { await testEnv?.cleanup(); });

beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'classes', CLASS_A), { name: 'Class A', coachIds: ['coach_a'], orgId: 'org1' });
    await setDoc(doc(db, 'classes', CLASS_B), { name: 'Class B', coachIds: ['coach_b'], orgId: 'org2' });

    await setDoc(doc(db, 'users', 'student_a'), {
      uid: 'student_a', email: 'a@school.edu', displayName: 'Ann', role: 'student', classIds: [CLASS_A]
    });
    await setDoc(doc(db, 'users', 'student_a2'), {
      uid: 'student_a2', email: 'a2@school.edu', displayName: 'Abe', role: 'student', classIds: [CLASS_A]
    });
    await setDoc(doc(db, 'users', 'student_b'), {
      uid: 'student_b', email: 'b@school.edu', displayName: 'Ben', role: 'student', classIds: [CLASS_B]
    });

    await setDoc(doc(db, 'users', 'student_a', 'goals', 'g1'), { title: 'Solar goal' });
    await setDoc(doc(db, 'users', 'student_a', 'dailyStats', '2026-09-18'), { timeSpentMinutes: 30 });
    await setDoc(doc(db, 'weeklyTasks', 't1'), { classId: CLASS_A, title: 'Week 1' });

    // Join codes for self-enrolment.
    await setDoc(doc(db, 'classCodes', 'SUN-4K2P'), { classId: CLASS_A, className: 'Class A' });
    await setDoc(doc(db, 'classCodes', 'SEA-9M3T'), { classId: CLASS_B, className: 'Class B' });

    // An unenrolled learner - the Yuri case.
    await setDoc(doc(db, 'users', 'newbie'), {
      uid: 'newbie', email: 'new@school.edu', displayName: 'Newbie', role: 'student', classIds: []
    });
    await setDoc(doc(db, 'leaderboard', 'l1'), { userId: 'student_a', displayName: 'Ann', score: 10 });
  });
});

describe('privilege boundary: role', () => {
  it('rejects a self-assigned teacher role on create', async () => {
    const db = testEnv.authenticatedContext('new_user').firestore();
    await assertFails(setDoc(doc(db, 'users', 'new_user'), {
      uid: 'new_user', email: 'coach.sneaky@gmail.com', role: 'teacher'
    }));
  });

  it('allows creating a student profile', async () => {
    const db = testEnv.authenticatedContext('new_user').firestore();
    await assertSucceeds(setDoc(doc(db, 'users', 'new_user'), {
      uid: 'new_user', email: 'kid@school.edu', role: 'student', classIds: []
    }));
  });

  it('rejects escalating role on update', async () => {
    const db = studentA().firestore();
    await assertFails(updateDoc(doc(db, 'users', 'student_a'), { role: 'teacher' }));
  });

  it('an email containing "coach" grants nothing', async () => {
    // The old client derived role from the email string. Even with such an
    // address, with no teacher claim this user is a student.
    const db = testEnv.authenticatedContext('student_a').firestore();
    await assertFails(getDoc(doc(db, 'users', 'student_b')));
  });
});

describe('tenancy boundary: classIds', () => {
  it('rejects a self-assigned class enrolment', async () => {
    const db = studentA().firestore();
    await assertFails(updateDoc(doc(db, 'users', 'student_a'), { classIds: [CLASS_A, CLASS_B] }));
  });

  it('allows an ordinary profile update that leaves role and classIds alone', async () => {
    const db = studentA().firestore();
    await assertSucceeds(updateDoc(doc(db, 'users', 'student_a'), { displayName: 'Ann B' }));
  });
});

describe('student data isolation', () => {
  it('a student can read their own profile', async () => {
    const db = studentA().firestore();
    await assertSucceeds(getDoc(doc(db, 'users', 'student_a')));
  });

  it('a student CANNOT read a classmate profile', async () => {
    const db = studentA().firestore();
    await assertFails(getDoc(doc(db, 'users', 'student_a2')));
  });

  it('a student CANNOT read another student goals', async () => {
    const db = studentA2().firestore();
    await assertFails(getDoc(doc(db, 'users', 'student_a', 'goals', 'g1')));
  });

  it('a student CANNOT read another student dailyStats', async () => {
    const db = studentA2().firestore();
    await assertFails(getDoc(doc(db, 'users', 'student_a', 'dailyStats', '2026-09-18')));
  });
});

describe('coach access is scoped to their own classes', () => {
  it('a coach can read a student in their class', async () => {
    const db = coachA().firestore();
    await assertSucceeds(getDoc(doc(db, 'users', 'student_a')));
  });

  it('a coach can read goals for a student in their class', async () => {
    const db = coachA().firestore();
    await assertSucceeds(getDoc(doc(db, 'users', 'student_a', 'goals', 'g1')));
  });

  it('a coach CANNOT read a student from another class', async () => {
    const db = coachA().firestore();
    await assertFails(getDoc(doc(db, 'users', 'student_b')));
  });

  it('a coach CANNOT read goals of a student from another class', async () => {
    const db = coachB().firestore();
    await assertFails(getDoc(doc(db, 'users', 'student_a', 'goals', 'g1')));
  });
});

describe('weeklyTasks are no longer world-writable', () => {
  it('a student CANNOT delete a task', async () => {
    const db = studentA().firestore();
    await assertFails(deleteDoc(doc(db, 'weeklyTasks', 't1')));
  });

  it('a student in the class can read a task', async () => {
    const db = studentA().firestore();
    await assertSucceeds(getDoc(doc(db, 'weeklyTasks', 't1')));
  });

  it('a coach can create a task for their own class', async () => {
    const db = coachA().firestore();
    await assertSucceeds(setDoc(doc(db, 'weeklyTasks', 't2'), { classId: CLASS_A, title: 'Week 2' }));
  });

  it('a coach CANNOT create a task for a class they do not teach', async () => {
    const db = coachA().firestore();
    await assertFails(setDoc(doc(db, 'weeklyTasks', 't3'), { classId: CLASS_B, title: 'Nope' }));
  });
});

describe('leaderboards are no longer public', () => {
  it('an anonymous visitor CANNOT read the leaderboard', async () => {
    const db = anon().firestore();
    await assertFails(getDoc(doc(db, 'leaderboard', 'l1')));
  });

  it('a signed-in student can read the leaderboard', async () => {
    const db = studentA().firestore();
    await assertSucceeds(getDoc(doc(db, 'leaderboard', 'l1')));
  });

  it('a student CANNOT submit a score under another uid', async () => {
    const db = studentA().firestore();
    await assertFails(setDoc(doc(db, 'leaderboard', 'l2'), { userId: 'student_b', score: 999 }));
  });
});

describe('audit log is append-only', () => {
  it('accepts a log entry written by the acting user', async () => {
    const db = coachA().firestore();
    await assertSucceeds(addDoc(collection(db, 'auditLogs'), {
      eventType: 'COACH_DASHBOARD_LOADED', actorId: 'coach_a'
    }));
  });

  it('rejects a log entry forged under another uid', async () => {
    const db = coachA().firestore();
    await assertFails(addDoc(collection(db, 'auditLogs'), {
      eventType: 'FORGED', actorId: 'someone_else'
    }));
  });

  it('a student CANNOT read the audit log', async () => {
    const db = studentA().firestore();
    await assertFails(getDoc(doc(db, 'auditLogs', 'anything')));
  });
});

describe('AI tutor conversations are server-written only', () => {
  it('a student CANNOT write their own AI transcript', async () => {
    const db = studentA().firestore();
    await assertFails(setDoc(doc(db, 'users', 'student_a', 'aiConversations', 'm1'), { text: 'hi' }));
  });

  it('a coach in the class can read a transcript for safeguarding', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users', 'student_a', 'aiConversations', 'm1'), { text: 'hi' });
    });
    const db = coachA().firestore();
    await assertSucceeds(getDoc(doc(db, 'users', 'student_a', 'aiConversations', 'm1')));
  });
});

/**
 * Queries, not single-document reads.
 *
 * The original suite only exercised getDoc(), so it never caught that the
 * coach's roster QUERY was rejected: isCoachOf() did a get() on the very
 * document being evaluated, which does not work for a list operation. The coach
 * dashboard failed with permission-denied while all 26 get() tests passed.
 */
describe('coach roster query (list, not get)', () => {
  it('a coach can list students in their own class', async () => {
    const db = coachA().firestore();
    const snap = await assertSucceeds(getDocs(
      query(collection(db, 'users'), where('classIds', 'array-contains-any', [CLASS_A]))
    ));
    const emails = snap.docs.map((d) => d.data().email).sort();
    expect(emails).toEqual(['a2@school.edu', 'a@school.edu']);
  });

  it('a coach CANNOT list students of another class', async () => {
    const db = coachA().firestore();
    await assertFails(getDocs(
      query(collection(db, 'users'), where('classIds', 'array-contains-any', [CLASS_B]))
    ));
  });

  it('a coach CANNOT list the whole users collection', async () => {
    // This is the query the dashboard used to run - the entire user table.
    const db = coachA().firestore();
    await assertFails(getDocs(collection(db, 'users')));
  });

  it('a student CANNOT list their classmates', async () => {
    const db = studentA().firestore();
    await assertFails(getDocs(
      query(collection(db, 'users'), where('classIds', 'array-contains-any', [CLASS_A]))
    ));
  });

  it('a coach can list weeklyTasks for their class', async () => {
    const db = coachA().firestore();
    await assertSucceeds(getDocs(
      query(collection(db, 'weeklyTasks'), where('classId', 'in', [CLASS_A]))
    ));
  });

  it('a coach CANNOT list weeklyTasks of another class', async () => {
    const db = coachA().firestore();
    await assertFails(getDocs(
      query(collection(db, 'weeklyTasks'), where('classId', 'in', [CLASS_B]))
    ));
  });
});


// ---------------------------------------------------------------------------
// Self-enrolment by join code
// ---------------------------------------------------------------------------

describe('joining a class with a code', () => {
  const newbie = () => testEnv.authenticatedContext('newbie');

  it('a learner can look up a code they were given', async () => {
    const db = newbie().firestore();
    const snap = await assertSucceeds(getDoc(doc(db, 'classCodes', 'SUN-4K2P')));
    expect(snap.data().classId).toBe(CLASS_A);
  });

  it('codes CANNOT be listed - one query must not reveal every class', async () => {
    const db = newbie().firestore();
    await assertFails(getDocs(collection(db, 'classCodes')));
  });

  it('a learner CANNOT mint or edit a code', async () => {
    const db = newbie().firestore();
    await assertFails(setDoc(doc(db, 'classCodes', 'FAKE-0000'), { classId: CLASS_A }));
    await assertFails(updateDoc(doc(db, 'classCodes', 'SUN-4K2P'), { classId: CLASS_B }));
  });

  it('a coach CANNOT mint a code either - admin tooling only', async () => {
    const db = coachA().firestore();
    await assertFails(setDoc(doc(db, 'classCodes', 'HAX-0001'), { classId: CLASS_A }));
  });

  it('enrols the learner into the class their code names', async () => {
    const db = newbie().firestore();
    await assertSucceeds(updateDoc(doc(db, 'users', 'newbie'), {
      classIds: [CLASS_A], groupName: 'Class A', enrolledVia: 'SUN-4K2P'
    }));
  });

  it('the coach can then see them - the whole point', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await updateDoc(doc(ctx.firestore(), 'users', 'newbie'), { classIds: [CLASS_A] });
    });
    const db = coachA().firestore();
    const snap = await assertSucceeds(getDocs(
      query(collection(db, 'users'), where('classIds', 'array-contains-any', [CLASS_A]))
    ));
    expect(snap.docs.map((d) => d.id)).toContain('newbie');
  });

  // --- the attacks this has to resist -------------------------------------

  it('CANNOT join a class by guessing its id without a code', async () => {
    const db = newbie().firestore();
    await assertFails(updateDoc(doc(db, 'users', 'newbie'), { classIds: [CLASS_A] }));
  });

  it('CANNOT join a class the code does not name', async () => {
    // Holds a valid code for Class A, tries to enter Class B with it.
    const db = newbie().firestore();
    await assertFails(updateDoc(doc(db, 'users', 'newbie'), {
      classIds: [CLASS_B], enrolledVia: 'SUN-4K2P'
    }));
  });

  it('CANNOT join with a code that does not exist', async () => {
    const db = newbie().firestore();
    await assertFails(updateDoc(doc(db, 'users', 'newbie'), {
      classIds: [CLASS_A], enrolledVia: 'NOPE-9999'
    }));
  });

  it('CANNOT join two classes with one code', async () => {
    const db = newbie().firestore();
    await assertFails(updateDoc(doc(db, 'users', 'newbie'), {
      classIds: [CLASS_A, CLASS_B], enrolledVia: 'SUN-4K2P'
    }));
  });

  it('CANNOT drop a class they are already in while joining another', async () => {
    const db = studentA().firestore();
    await assertFails(updateDoc(doc(db, 'users', 'student_a'), {
      classIds: [CLASS_B], enrolledVia: 'SEA-9M3T'
    }));
  });

  it('CANNOT smuggle a role change through an enrolment', async () => {
    const db = newbie().firestore();
    await assertFails(updateDoc(doc(db, 'users', 'newbie'), {
      classIds: [CLASS_A], enrolledVia: 'SUN-4K2P', role: 'teacher'
    }));
  });

  it('CANNOT enrol somebody else', async () => {
    const db = newbie().firestore();
    await assertFails(updateDoc(doc(db, 'users', 'student_a'), {
      classIds: [CLASS_A, CLASS_B], enrolledVia: 'SEA-9M3T'
    }));
  });

  it('an ordinary profile edit still works and still cannot touch classIds', async () => {
    const db = newbie().firestore();
    await assertSucceeds(updateDoc(doc(db, 'users', 'newbie'), { displayName: 'Newbie Two' }));
    await assertFails(updateDoc(doc(db, 'users', 'newbie'), { classIds: [CLASS_A], displayName: 'x' }));
  });
});

// ---------------------------------------------------------------------------
// Activity 6: SO₂ simulation runs. Saved runs are immutable so a later model
// version can never overwrite an earlier result.
// ---------------------------------------------------------------------------
describe('SO₂ simulation runs', () => {
  const run = (userId) => ({
    userId, modelVersion: 'SO2-Au-TiO2-v1.0', baselineDate: '2026-09-24',
    mode: 'surface', parameters: { so2Initial: 1 }, results: {}
  });
  const point = (userId, simulationId) => ({
    userId, simulationId, modelVersion: 'SO2-Au-TiO2-v1.0', series: 'surface', simulatedTime: 0, so2: 1
  });

  // Mirrors simulationStore.saveSimulation: parent + points in one batch. 80
  // points is the comparison-mode size, which exercises getAfter() per point.
  async function saveBatch(db, userId, points = 80) {
    const batch = writeBatch(db);
    const simRef = doc(collection(db, 'simulations'));
    batch.set(simRef, run(userId));
    for (let i = 0; i < points; i++) batch.set(doc(collection(db, 'simulationResults')), point(userId, simRef.id));
    await batch.commit();
    return simRef.id;
  }

  it('a learner can save a run with its time points in one batch', async () => {
    await assertSucceeds(saveBatch(studentA().firestore(), 'student_a'));
  });

  it('a learner can list their own runs', async () => {
    const db = studentA().firestore();
    await saveBatch(db, 'student_a', 2);
    await assertSucceeds(getDocs(query(collection(db, 'simulations'), where('userId', '==', 'student_a'))));
  });

  it('a saved run CANNOT be overwritten or deleted', async () => {
    const db = studentA().firestore();
    const id = await saveBatch(db, 'student_a', 1);
    await assertFails(updateDoc(doc(db, 'simulations', id), { modelVersion: 'SO2-Au-TiO2-v2.0' }));
    await assertFails(setDoc(doc(db, 'simulations', id), run('student_a')));
    await assertFails(deleteDoc(doc(db, 'simulations', id)));
  });

  it('CANNOT save a run under another uid', async () => {
    await assertFails(setDoc(doc(studentA().firestore(), 'simulations', 's1'), run('student_a2')));
  });

  it('CANNOT save a run without a model version', async () => {
    const { modelVersion, ...rest } = run('student_a');
    await assertFails(setDoc(doc(studentA().firestore(), 'simulations', 's1'), rest));
  });

  it('CANNOT attach time points to somebody else\'s run', async () => {
    const id = await saveBatch(studentA().firestore(), 'student_a', 1);
    await assertFails(setDoc(doc(studentA2().firestore(), 'simulationResults', 'r1'), point('student_a2', id)));
  });

  it('a classmate CANNOT read a run; the class coach can', async () => {
    const id = await saveBatch(studentA().firestore(), 'student_a', 1);
    await assertFails(getDoc(doc(studentA2().firestore(), 'simulations', id)));
    await assertSucceeds(getDoc(doc(coachA().firestore(), 'simulations', id)));
    await assertFails(getDoc(doc(coachB().firestore(), 'simulations', id)));
  });
});

describe('Phase 0 security boundaries', () => {
  it('user CANNOT self-update protected Phase 0 fields', async () => {
    const db = studentA().firestore();
    await assertFails(updateDoc(doc(db, 'users', 'student_a'), { orgId: 'org_hacked' }));
    await assertFails(updateDoc(doc(db, 'users', 'student_a'), { schoolIds: ['sch-hacked'] }));
    await assertFails(updateDoc(doc(db, 'users', 'student_a'), { status: 'active' }));
    await assertFails(updateDoc(doc(db, 'users', 'student_a'), { publicId: 'HAK-1234' }));
    await assertFails(updateDoc(doc(db, 'users', 'student_a'), { consent: { status: 'verified' } }));
  });

  it('user CAN self-update locale and updatedAt', async () => {
    const db = studentA().firestore();
    await assertSucceeds(setDoc(doc(db, 'users', 'student_a'), { locale: 'th', updatedAt: '2026-09-27T12:00:00.000Z' }, { merge: true }));
  });

  it('client CANNOT read or write Phase 0 server-managed collections', async () => {
    const db = coachA().firestore();
    const collections = ['organizations', 'schools', 'cohorts', 'programmes', 'publicIds', 'parentLinks', 'parentInvites'];
    for (const col of collections) {
      await assertFails(getDoc(doc(db, col, 'doc1')));
      await assertFails(setDoc(doc(db, col, 'doc1'), { data: 'test' }));
    }
  });

  it('client CANNOT create an auditLog entry with source: server', async () => {
    const db = coachA().firestore();
    await assertFails(addDoc(collection(db, 'auditLogs'), {
      eventType: 'FORGED_SERVER_LOG', actorId: 'coach_a', source: 'server'
    }));
  });
});

