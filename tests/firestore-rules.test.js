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
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, addDoc, getDocs, query, where, writeBatch, serverTimestamp } from 'firebase/firestore';

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

  it('rejects modifying status on update', async () => {
    const db = studentA().firestore();
    await assertFails(updateDoc(doc(db, 'users', 'student_a'), { status: 'active' }));
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

  it('a coach can update activeProgramId and updatedAt for a student in their class', async () => {
    const db = coachA().firestore();
    await assertSucceeds(updateDoc(doc(db, 'users', 'student_a'), {
      activeProgramId: 'prog-123',
      updatedAt: serverTimestamp()
    }));
  });

  it('a coach CANNOT update activeProgramId for a student in another class', async () => {
    const db = coachA().firestore();
    await assertFails(updateDoc(doc(db, 'users', 'student_b'), {
      activeProgramId: 'prog-123',
      updatedAt: serverTimestamp()
    }));
  });

  it('a coach CANNOT update unauthorized fields on a student profile', async () => {
    const db = coachA().firestore();
    await assertFails(updateDoc(doc(db, 'users', 'student_a'), {
      activeProgramId: 'prog-123',
      role: 'coach'
    }));
    await assertFails(updateDoc(doc(db, 'users', 'student_a'), {
      displayName: 'Hacked Name'
    }));
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

  it('a coach CANNOT mint a bare code - it must come with the class pointing at it', async () => {
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

  it('client CANNOT read or write Canva Connect server-managed collections', async () => {
    const clients = [studentA().firestore(), coachA().firestore(), anon().firestore()];
    const collections = ['canvaConnections', 'canvaOAuthStates'];
    for (const db of clients) {
      for (const col of collections) {
        await assertFails(getDoc(doc(db, col, 'test-doc')));
        await assertFails(setDoc(doc(db, col, 'test-doc'), { data: 'secret' }));
      }
    }
  });

  it('client CANNOT create an auditLog entry with source: server', async () => {
    const db = coachA().firestore();
    await assertFails(addDoc(collection(db, 'auditLogs'), {
      eventType: 'FORGED_SERVER_LOG', actorId: 'coach_a', source: 'server'
    }));
  });
});

// ---------------------------------------------------------------------------
// F1: Theme Preference
// ---------------------------------------------------------------------------
describe('F1: Theme Preference', () => {
  it('allows a user to update themePreference on their own profile', async () => {
    const db = studentA().firestore();
    await assertSucceeds(updateDoc(doc(db, 'users', 'student_a'), {
      themePreference: 'dark'
    }));
  });
});

// ---------------------------------------------------------------------------
// F2: Community Space (Posts, Comments, Reactions, Reports)
// ---------------------------------------------------------------------------
describe('F2: Community Space', () => {
  it('allows any signed-in user to create a post with initial counts 0 and status visible', async () => {
    const db = studentA().firestore();
    await assertSucceeds(setDoc(doc(db, 'posts', 'post1'), {
      authorId: 'student_a',
      authorRole: 'student',
      text: 'Hello WeLearn!',
      media: [],
      createdAt: '2026-10-01T10:00:00Z',
      updatedAt: '2026-10-01T10:00:00Z',
      commentCount: 0,
      reactionCount: 0,
      status: 'visible'
    }));
  });

  it('rejects post creation under another authorId', async () => {
    const db = studentA().firestore();
    await assertFails(setDoc(doc(db, 'posts', 'post2'), {
      authorId: 'student_b',
      authorRole: 'student',
      text: 'Impersonated post',
      media: [],
      createdAt: '2026-10-01T10:00:00Z',
      updatedAt: '2026-10-01T10:00:00Z',
      commentCount: 0,
      reactionCount: 0,
      status: 'visible'
    }));
  });

  it('allows author or coach/admin to soft-delete a post (status: removed or hidden)', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'posts', 'post1'), {
        authorId: 'student_a', authorRole: 'student', text: 'Hi', commentCount: 0, reactionCount: 0, status: 'visible'
      });
    });
    // Coach hiding content
    const coachDb = coachA().firestore();
    await assertSucceeds(updateDoc(doc(coachDb, 'posts', 'post1'), {
      status: 'hidden', updatedAt: '2026-10-01T10:05:00Z'
    }));
  });

  it('blocks hard deletion of posts', async () => {
    const db = studentA().firestore();
    await assertFails(deleteDoc(doc(db, 'posts', 'post1')));
  });

  it('allows adding and removing reactions', async () => {
    const db = studentA().firestore();
    await assertSucceeds(setDoc(doc(db, 'posts', 'post1', 'reactions', 'student_a'), {
      type: 'like', createdAt: '2026-10-01T10:00:00Z'
    }));
    await assertSucceeds(deleteDoc(doc(db, 'posts', 'post1', 'reactions', 'student_a')));
  });

  it('allows reporting posts or comments', async () => {
    const db = studentA().firestore();
    await assertSucceeds(setDoc(doc(db, 'reports', 'rep1'), {
      targetType: 'post',
      targetPath: 'posts/post1',
      reporterId: 'student_a',
      reason: 'Inappropriate content',
      createdAt: '2026-10-01T10:00:00Z',
      resolved: false
    }));
  });
});

// ---------------------------------------------------------------------------
// F3: Private Messages (Coach-Initiated Only & Admin Audit View)
// ---------------------------------------------------------------------------
describe('F3: Private Messages (Coach-Initiated & Safeguarding)', () => {
  const adminUser = () => testEnv.authenticatedContext('admin1', { role: 'admin' });

  it('STRICT: rejects conversation creation by a student', async () => {
    const db = studentA().firestore();
    await assertFails(setDoc(doc(db, 'conversations', 'conv1'), {
      coachId: 'coach_a',
      studentId: 'student_a',
      participantIds: ['coach_a', 'student_a'],
      createdBy: 'student_a',
      createdAt: '2026-10-01T10:00:00Z',
      lastMessageAt: '2026-10-01T10:00:00Z',
      lastMessagePreview: 'Hello coach',
      unread: { coach_a: 1 }
    }));
  });

  it('allows a coach to initiate a conversation with a student', async () => {
    const db = coachA().firestore();
    await assertSucceeds(setDoc(doc(db, 'conversations', 'conv1'), {
      coachId: 'coach_a',
      studentId: 'student_a',
      participantIds: ['coach_a', 'student_a'],
      createdBy: 'coach_a',
      createdAt: '2026-10-01T10:00:00Z',
      lastMessageAt: '2026-10-01T10:00:00Z',
      lastMessagePreview: 'Welcome to WeLearn!',
      unread: { student_a: 1 }
    }));
  });

  it('allows a student to reply in an existing conversation', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'conversations', 'conv1'), {
        coachId: 'coach_a', studentId: 'student_a', participantIds: ['coach_a', 'student_a'], createdBy: 'coach_a'
      });
    });
    const db = studentA().firestore();
    await assertSucceeds(setDoc(doc(db, 'conversations', 'conv1', 'messages', 'msg1'), {
      senderId: 'student_a',
      text: 'Thanks Coach!',
      media: [],
      createdAt: '2026-10-01T10:01:00Z',
      deletedBySender: false
    }));
  });

  it('prevents non-participants from reading private messages', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'conversations', 'conv1'), {
        coachId: 'coach_a', studentId: 'student_a', participantIds: ['coach_a', 'student_a'], createdBy: 'coach_a'
      });
      await setDoc(doc(ctx.firestore(), 'conversations', 'conv1', 'messages', 'msg1'), {
        senderId: 'coach_a', text: 'Secret message', deletedBySender: false
      });
    });
    const db = studentA2().firestore();
    await assertFails(getDoc(doc(db, 'conversations', 'conv1')));
    await assertFails(getDoc(doc(db, 'conversations', 'conv1', 'messages', 'msg1')));
  });

  it('Admin Audit View: allows admin to read all conversations and messages', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'conversations', 'conv1'), {
        coachId: 'coach_a', studentId: 'student_a', participantIds: ['coach_a', 'student_a'], createdBy: 'coach_a'
      });
      await setDoc(doc(ctx.firestore(), 'conversations', 'conv1', 'messages', 'msg1'), {
        senderId: 'coach_a', text: 'Safeguarded message', deletedBySender: false
      });
    });
    const db = adminUser().firestore();
    await assertSucceeds(getDoc(doc(db, 'conversations', 'conv1')));
    await assertSucceeds(getDoc(doc(db, 'conversations', 'conv1', 'messages', 'msg1')));
  });

  it('allows sender to soft-delete a message (deletedBySender: true)', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'conversations', 'conv1'), {
        coachId: 'coach_a', studentId: 'student_a', participantIds: ['coach_a', 'student_a'], createdBy: 'coach_a'
      });
      await setDoc(doc(ctx.firestore(), 'conversations', 'conv1', 'messages', 'msg1'), {
        senderId: 'student_a', text: 'Mistake', deletedBySender: false
      });
    });
    const db = studentA().firestore();
    await assertSucceeds(updateDoc(doc(db, 'conversations', 'conv1', 'messages', 'msg1'), {
      deletedBySender: true
    }));
    await assertFails(deleteDoc(doc(db, 'conversations', 'conv1', 'messages', 'msg1')));
  });

  it('a direct conversation has exactly the coach and one student', async () => {
    const db = coachA().firestore();
    await assertFails(setDoc(doc(db, 'conversations', 'conv2'), {
      coachId: 'coach_a', studentId: 'student_a', createdBy: 'coach_a',
      participantIds: ['coach_a', 'student_a', 'student_b']
    }));
  });

  it('members may only post and update the summary, not change who is in the chat', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'conversations', 'conv1'), {
        coachId: 'coach_a', studentId: 'student_a', participantIds: ['coach_a', 'student_a'], createdBy: 'coach_a',
        lastMessagePreview: '', unread: {}
      });
    });
    const db = studentA().firestore();
    await assertSucceeds(updateDoc(doc(db, 'conversations', 'conv1'), {
      lastMessagePreview: 'Hi', lastSenderId: 'student_a', lastSenderName: 'Ann', 'unread.coach_a': 1
    }));
    await assertFails(updateDoc(doc(db, 'conversations', 'conv1'), { participantIds: ['coach_a', 'student_a', 'student_b'] }));
    await assertFails(updateDoc(doc(db, 'conversations', 'conv1'), { coachId: 'student_a' }));
  });

  it('rejects an over-long message', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'conversations', 'conv1'), {
        coachId: 'coach_a', studentId: 'student_a', participantIds: ['coach_a', 'student_a'], createdBy: 'coach_a'
      });
    });
    const db = studentA().firestore();
    await assertFails(setDoc(doc(db, 'conversations', 'conv1', 'messages', 'long'), {
      senderId: 'student_a', text: 'x'.repeat(4001), attachments: [], createdAt: 1, deletedBySender: false
    }));
  });
});

describe('F3: Class group chats', () => {
  const classChat = (over = {}) => ({
    type: 'class', classId: CLASS_A, title: 'Class A', coachId: 'coach_a', createdBy: 'coach_a',
    participantIds: ['coach_a', 'student_a', 'student_a2'], memberNames: {}, unread: {}, ...over
  });

  it('a coach can open the chat for a class they teach, under its fixed id', async () => {
    const db = coachA().firestore();
    await assertSucceeds(setDoc(doc(db, 'conversations', `class_${CLASS_A}`), classChat()));
  });

  it('rejects a class chat under any other id, for another coach\'s class, or by a student', async () => {
    await assertFails(setDoc(doc(coachA().firestore(), 'conversations', 'class_other'), classChat()));
    await assertFails(setDoc(doc(coachB().firestore(), 'conversations', `class_${CLASS_A}`),
      classChat({ coachId: 'coach_b', createdBy: 'coach_b', participantIds: ['coach_b', 'student_a'] })));
    await assertFails(setDoc(doc(studentA().firestore(), 'conversations', `class_${CLASS_A}`),
      classChat({ coachId: 'student_a', createdBy: 'student_a' })));
  });

  it('a coach can check whether the class chat exists before creating it', async () => {
    await assertSucceeds(getDoc(doc(coachA().firestore(), 'conversations', `class_${CLASS_A}`)));
  });

  it('every member can read and post; outsiders cannot', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'conversations', `class_${CLASS_A}`), classChat());
    });
    await assertSucceeds(getDoc(doc(studentA2().firestore(), 'conversations', `class_${CLASS_A}`)));
    await assertSucceeds(setDoc(doc(studentA2().firestore(), 'conversations', `class_${CLASS_A}`, 'messages', 'm1'), {
      senderId: 'student_a2', senderName: 'Abe', text: 'Hi all', attachments: [], createdAt: 1, deletedBySender: false
    }));
    const outsider = testEnv.authenticatedContext('student_b').firestore();
    await assertFails(getDoc(doc(outsider, 'conversations', `class_${CLASS_A}`)));
    await assertFails(setDoc(doc(outsider, 'conversations', `class_${CLASS_A}`, 'messages', 'm2'), {
      senderId: 'student_b', text: 'let me in', createdAt: 1, deletedBySender: false
    }));
  });

  it('only the class coach changes the members', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'conversations', `class_${CLASS_A}`), classChat());
    });
    await assertSucceeds(updateDoc(doc(coachA().firestore(), 'conversations', `class_${CLASS_A}`), {
      participantIds: ['coach_a', 'student_a'], memberNames: { student_a: 'Ann' }
    }));
    await assertFails(updateDoc(doc(studentA().firestore(), 'conversations', `class_${CLASS_A}`), {
      participantIds: ['coach_a', 'student_a', 'student_b']
    }));
    await assertFails(updateDoc(doc(coachA().firestore(), 'conversations', `class_${CLASS_A}`), {
      participantIds: ['student_a']
    }));
  });
});

// ---------------------------------------------------------------------------
// Coaches issuing, rotating and revoking codes, and assigning a program
// ---------------------------------------------------------------------------

describe('coaches manage join codes and programs for their own classes', () => {
  // Well-formed codes (no vowels, no 0/1/O/I/L).
  const A_CODE = 'BCDF-2345';
  const B_CODE = 'QRST-6789';
  const NEW_CODE = 'GHJK-7892';

  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await setDoc(doc(db, 'classCodes', A_CODE), { classId: CLASS_A, className: 'Class A' });
      await setDoc(doc(db, 'classCodes', B_CODE), { classId: CLASS_B, className: 'Class B' });
      await updateDoc(doc(db, 'classes', CLASS_A), { joinCode: A_CODE });
      await updateDoc(doc(db, 'classes', CLASS_B), { joinCode: B_CODE });
    });
  });

  const issue = (db, code, classId, extra = {}, classPatch = { joinCode: code }) => {
    const batch = writeBatch(db);
    batch.set(doc(db, 'classCodes', code), {
      classId, className: 'Class', createdBy: 'coach_a', createdAt: serverTimestamp(), ...extra
    });
    if (classPatch) batch.update(doc(db, 'classes', classId), classPatch);
    return batch.commit();
  };

  it('issues a new code for their class when the class points at it', async () => {
    const db = coachA().firestore();
    await assertSucceeds(issue(db, NEW_CODE, CLASS_A));
  });

  it('CANNOT issue a code without pointing the class at it', async () => {
    await assertFails(issue(coachA().firestore(), NEW_CODE, CLASS_A, {}, null));
  });

  it("CANNOT issue a code for a class they do not teach", async () => {
    await assertFails(issue(coachA().firestore(), NEW_CODE, CLASS_B));
  });

  it('CANNOT issue a malformed code', async () => {
    const db = coachA().firestore();
    await assertFails(issue(db, 'HAX-0001', CLASS_A));
    await assertFails(issue(db, 'bcdf-2345', CLASS_A));
    await assertFails(issue(db, 'BCDFG-2345', CLASS_A));
  });

  it('CANNOT add extra fields or claim another author', async () => {
    const db = coachA().firestore();
    await assertFails(issue(db, NEW_CODE, CLASS_A, { classIdOverride: CLASS_B }));
    await assertFails(issue(db, NEW_CODE, CLASS_A, { createdBy: 'coach_b' }));
  });

  it("CANNOT take over an existing code by writing it again", async () => {
    await assertFails(issue(coachA().firestore(), B_CODE, CLASS_A));
  });

  it('a learner CANNOT issue a code even for their own class', async () => {
    const db = studentA().firestore();
    await assertFails(issue(db, NEW_CODE, CLASS_A, { createdBy: 'student_a' }));
  });

  it('rotates in one write: old code gone, new code live', async () => {
    const db = coachA().firestore();
    const batch = writeBatch(db);
    batch.delete(doc(db, 'classCodes', A_CODE));
    batch.set(doc(db, 'classCodes', NEW_CODE), { classId: CLASS_A, className: 'Class A', createdBy: 'coach_a', createdAt: serverTimestamp() });
    batch.update(doc(db, 'classes', CLASS_A), { joinCode: NEW_CODE });
    await assertSucceeds(batch.commit());

    const learner = testEnv.authenticatedContext('newbie').firestore();
    expect((await getDoc(doc(learner, 'classCodes', A_CODE))).exists()).toBe(false);
    expect((await getDoc(doc(learner, 'classCodes', NEW_CODE))).data().classId).toBe(CLASS_A);
  });

  it('revokes by deleting the code and clearing the class in one write', async () => {
    const db = coachA().firestore();
    const batch = writeBatch(db);
    batch.delete(doc(db, 'classCodes', A_CODE));
    batch.update(doc(db, 'classes', CLASS_A), { joinCode: null });
    await assertSucceeds(batch.commit());
  });

  it('CANNOT delete a code the class still advertises', async () => {
    await assertFails(deleteDoc(doc(coachA().firestore(), 'classCodes', A_CODE)));
  });

  it("CANNOT revoke another class's code", async () => {
    const db = coachA().firestore();
    const batch = writeBatch(db);
    batch.delete(doc(db, 'classCodes', B_CODE));
    await assertFails(batch.commit());
  });

  it("CANNOT point their class at another class's code", async () => {
    await assertFails(updateDoc(doc(coachA().firestore(), 'classes', CLASS_A), { joinCode: B_CODE }));
    await assertFails(updateDoc(doc(coachA().firestore(), 'classes', CLASS_A), { joinCode: 'ZZZZ-9999' }));
  });

  it('a learner who used a revoked code can no longer join with it', async () => {
    const db = coachA().firestore();
    const batch = writeBatch(db);
    batch.delete(doc(db, 'classCodes', A_CODE));
    batch.update(doc(db, 'classes', CLASS_A), { joinCode: null });
    await batch.commit();
    const newbie = testEnv.authenticatedContext('newbie').firestore();
    await assertFails(updateDoc(doc(newbie, 'users', 'newbie'), { classIds: [CLASS_A], groupName: 'Class A', enrolledVia: A_CODE }));
  });

  it('assigns a program to their class', async () => {
    await assertSucceeds(updateDoc(doc(coachA().firestore(), 'classes', CLASS_A), { programId: 'ecocool-smart-garden-2026' }));
    await assertSucceeds(updateDoc(doc(coachA().firestore(), 'classes', CLASS_A), { programId: null }));
  });

  it('CANNOT assign a program to a class they do not teach, or a non-string', async () => {
    await assertFails(updateDoc(doc(coachB().firestore(), 'classes', CLASS_A), { programId: 'ecocool-smart-garden-2026' }));
    await assertFails(updateDoc(doc(coachA().firestore(), 'classes', CLASS_A), { programId: 42 }));
    await assertFails(updateDoc(doc(coachA().firestore(), 'classes', CLASS_A), { programId: 'x'.repeat(101) }));
  });

  it("a learner CANNOT change their class's program, but can read it", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await updateDoc(doc(ctx.firestore(), 'classes', CLASS_A), { programId: 'hex-city-thailand-2026' });
    });
    const db = studentA().firestore();
    await assertFails(updateDoc(doc(db, 'classes', CLASS_A), { programId: 'ecocool-smart-garden-2026' }));
    expect((await assertSucceeds(getDoc(doc(db, 'classes', CLASS_A)))).data().programId).toBe('hex-city-thailand-2026');
  });

  it('a new class cannot be created already pointing at a code', async () => {
    const db = coachA().firestore();
    await assertFails(setDoc(doc(db, 'classes', 'class_new'), { name: 'New', coachIds: ['coach_a'], joinCode: A_CODE }));
  });
});

describe('coach media on a class program', () => {
  const media = [{ id: 'm1', programId: 'p1', place: 'overview', title: 'Welcome', url: 'https://youtu.be/dQw4w9WgXcQ', type: 'video', createdBy: 'coach_a', createdAt: 1 }];

  it('the class coach can add media and a cover', async () => {
    const db = coachA().firestore();
    await assertSucceeds(updateDoc(doc(db, 'classes', CLASS_A), { programMedia: media, 'programCovers.p1': 'https://res.cloudinary.com/x/image/upload/a.png' }));
  });

  it('another class coach cannot', async () => {
    await assertFails(updateDoc(doc(coachB().firestore(), 'classes', CLASS_A), { programMedia: media }));
  });

  it('a student in the class can read it but not change it', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await updateDoc(doc(ctx.firestore(), 'classes', CLASS_A), { programMedia: media });
    });
    const db = studentA().firestore();
    await assertSucceeds(getDoc(doc(db, 'classes', CLASS_A)));
    await assertFails(updateDoc(doc(db, 'classes', CLASS_A), { programMedia: [] }));
  });
});

describe('pbl_programs: authoring and publishing', () => {
  const programData = {
    title: 'Smart Garden 2026',
    authorUid: 'coach_a',
    durationWeeks: 12
  };

  it('unauthenticated users cannot read or write programs', async () => {
    const db = anon().firestore();
    await assertFails(getDoc(doc(db, 'pbl_programs', 'prog-1')));
    await assertFails(setDoc(doc(db, 'pbl_programs', 'prog-1'), programData));
  });

  it('coaches can create and update programs', async () => {
    const db = coachA().firestore();
    await assertSucceeds(setDoc(doc(db, 'pbl_programs', 'prog-1'), programData));
    await assertSucceeds(updateDoc(doc(db, 'pbl_programs', 'prog-1'), { title: 'Updated Title' }));
  });

  it('students can read published programs but cannot read drafts', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'pbl_programs', 'prog-published'), {
        ...programData,
        status: 'published',
        visibility: 'centre'
      });
      await setDoc(doc(ctx.firestore(), 'pbl_programs', 'prog-draft'), {
        ...programData,
        status: 'draft',
        visibility: 'centre'
      });
    });
    const db = studentA().firestore();
    await assertSucceeds(getDoc(doc(db, 'pbl_programs', 'prog-published')));
    await assertFails(getDoc(doc(db, 'pbl_programs', 'prog-draft')));
  });

  it('students can read programs but cannot create or update them', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'pbl_programs', 'prog-read'), programData);
    });
    const db = studentA().firestore();
    await assertSucceeds(getDoc(doc(db, 'pbl_programs', 'prog-read')));
    await assertFails(setDoc(doc(db, 'pbl_programs', 'prog-student'), programData));
    await assertFails(updateDoc(doc(db, 'pbl_programs', 'prog-read'), { title: 'Hacked' }));
  });

  it('deleting programs is disallowed', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'pbl_programs', 'prog-del'), programData);
    });
    await assertFails(deleteDoc(doc(coachA().firestore(), 'pbl_programs', 'prog-del')));
    await assertFails(deleteDoc(doc(studentA().firestore(), 'pbl_programs', 'prog-del')));
  });
});

describe('WeLearn SPARK: enrolments and phaseProgress rules', () => {
  const enrolmentId = 'student_a_prog-1';
  const enrolmentData = {
    learnerId: 'student_a',
    programId: 'prog-1',
    source: 'self-added',
    currentPhaseId: 'explore',
    status: 'active'
  };

  it('learner can create own enrolment and read it', async () => {
    const db = studentA().firestore();
    await assertSucceeds(setDoc(doc(db, 'enrolments', enrolmentId), enrolmentData));
    await assertSucceeds(getDoc(doc(db, 'enrolments', enrolmentId)));
  });

  it('learner CANNOT create enrolment for another learner', async () => {
    const db = studentA().firestore();
    await assertFails(setDoc(doc(db, 'enrolments', 'student_a2_prog-1'), {
      ...enrolmentData,
      learnerId: 'student_a2'
    }));
  });

  it('learner CANNOT read another learner enrolment unless coach', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'enrolments', 'student_b_prog-1'), {
        learnerId: 'student_b',
        programId: 'prog-1',
        status: 'active'
      });
    });
    await assertFails(getDoc(doc(studentA().firestore(), 'enrolments', 'student_b_prog-1')));
  });

  it('learner can submit evidence to phaseProgress', async () => {
    const db = studentA().firestore();
    await assertSucceeds(setDoc(doc(db, 'enrolments', enrolmentId, 'phaseProgress', 'explore'), {
      status: 'submitted',
      evidence: [{ type: 'text', note: 'Learner research findings' }],
      updatedAt: Date.now()
    }));
  });

  it('learner CANNOT write coachFeedback or set status to reviewed', async () => {
    const db = studentA().firestore();
    await assertFails(setDoc(doc(db, 'enrolments', enrolmentId, 'phaseProgress', 'explore'), {
      status: 'reviewed',
      evidence: [],
      coachFeedback: { text: 'Self graded A+' }
    }));
  });

  it('coach can write coachFeedback and mark status reviewed', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'enrolments', enrolmentId), enrolmentData);
    });
    const db = coachA().firestore();
    await assertSucceeds(setDoc(doc(db, 'enrolments', enrolmentId, 'phaseProgress', 'explore'), {
      status: 'reviewed',
      coachFeedback: { text: 'Excellent prototype', rating: 5, coachId: 'coach_a' },
      updatedAt: Date.now()
    }));
  });

  it('coach update on phaseProgress CANNOT alter learner evidence (restricted to coachFeedback, status, updatedAt)', async () => {
    // 0. Ensure enrolment exists
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'enrolments', enrolmentId), enrolmentData);
    });
    // 1. Learner submits evidence
    const studentDb = studentA().firestore();
    await setDoc(doc(studentDb, 'enrolments', enrolmentId, 'phaseProgress', 'explore_p1'), {
      status: 'submitted',
      evidence: [{ type: 'text', note: 'Learner research findings' }],
      updatedAt: Date.now()
    });

    // 2. Coach attempts to rewrite learner evidence -> fails
    const coachDb = coachA().firestore();
    await assertFails(updateDoc(doc(coachDb, 'enrolments', enrolmentId, 'phaseProgress', 'explore_p1'), {
      evidence: [{ type: 'text', note: 'Tampered by coach' }],
      coachFeedback: { text: 'Good work', coachId: 'coach_a' },
      status: 'reviewed',
      updatedAt: Date.now()
    }));

    // 3. Coach updates only coachFeedback, status, updatedAt -> succeeds
    await assertSucceeds(updateDoc(doc(coachDb, 'enrolments', enrolmentId, 'phaseProgress', 'explore_p1'), {
      coachFeedback: { text: 'Good work', coachId: 'coach_a' },
      status: 'reviewed',
      updatedAt: Date.now()
    }));
  });

  it('unassigned coach (coachB) CANNOT read or write phaseProgress', async () => {
    const coachBDb = coachB().firestore();
    await assertFails(getDoc(doc(coachBDb, 'enrolments', enrolmentId, 'phaseProgress', 'explore')));
    await assertFails(setDoc(doc(coachBDb, 'enrolments', enrolmentId, 'phaseProgress', 'explore'), {
      status: 'reviewed',
      coachFeedback: { text: 'Unauthorized coach review', coachId: 'coach_b' },
      updatedAt: Date.now()
    }));
  });

  it('unassigned coach (coachB) CANNOT read or write phaseProgress even when enrolment doc is missing', async () => {
    const coachBDb = coachB().firestore();
    const missingEnrolmentId = 'student_a_missing-course';
    await assertFails(getDoc(doc(coachBDb, 'enrolments', missingEnrolmentId, 'phaseProgress', 'explore')));
    await assertFails(setDoc(doc(coachBDb, 'enrolments', missingEnrolmentId, 'phaseProgress', 'explore'), {
      status: 'reviewed',
      coachFeedback: { text: 'Unauthorized coach review', coachId: 'coach_b' },
      updatedAt: Date.now()
    }));
  });

  it('lockdown: only coach of student can create/update feedback and ratings on student profile', async () => {
    const studentDb = studentA().firestore();
    const coachADb = coachA().firestore();
    const coachBDb = coachB().firestore();

    // Student cannot create their own feedback or ratings
    await assertFails(setDoc(doc(studentDb, 'users', 'student_a', 'feedback', 'fb-1'), {
      text: 'Self praise',
      authorUid: 'student_a'
    }));
    await assertFails(setDoc(doc(studentDb, 'users', 'student_a', 'ratings', 'rt-1'), {
      score: 5,
      authorUid: 'student_a'
    }));

    // Unassigned coach cannot create feedback or ratings on student_a
    await assertFails(setDoc(doc(coachBDb, 'users', 'student_a', 'feedback', 'fb-1'), {
      text: 'Good job from wrong coach',
      authorUid: 'coach_b'
    }));
    await assertFails(setDoc(doc(coachBDb, 'users', 'student_a', 'ratings', 'rt-1'), {
      score: 5,
      authorUid: 'coach_b'
    }));

    // Assigned coach (coachA) can create feedback and ratings
    await assertSucceeds(setDoc(doc(coachADb, 'users', 'student_a', 'feedback', 'fb-1'), {
      text: 'Excellent critical thinking',
      authorUid: 'coach_a'
    }));
    await assertSucceeds(setDoc(doc(coachADb, 'users', 'student_a', 'ratings', 'rt-1'), {
      score: 5,
      authorUid: 'coach_a'
    }));
  });
});

describe('WeLearn SPARK: privilege boundaries and audit trail', () => {
  it('user CANNOT change their own role on users doc', async () => {
    const db = studentA().firestore();
    await assertFails(updateDoc(doc(db, 'users', 'student_a'), { role: 'coach' }));
  });

  it('auditLogs are append-only: create succeeds, update and delete fail', async () => {
    const db = studentA().firestore();
    const logData = {
      actorId: 'student_a',
      eventType: 'COURSE_ENROLLED',
      source: 'client',
      timestamp: Date.now()
    };
    await assertSucceeds(setDoc(doc(db, 'auditLogs', 'log-1'), logData));
    await assertFails(updateDoc(doc(db, 'auditLogs', 'log-1'), { eventType: 'TAMPERED' }));
    await assertFails(deleteDoc(doc(db, 'auditLogs', 'log-1')));
  });

  it('user can manage own session document', async () => {
    const db = studentA().firestore();
    await assertSucceeds(setDoc(doc(db, 'sessions', 'session-1'), {
      uid: 'student_a',
      startedAt: Date.now(),
      lastHeartbeatAt: Date.now()
    }));
    await assertSucceeds(updateDoc(doc(db, 'sessions', 'session-1'), {
      lastHeartbeatAt: Date.now()
    }));
  });

  it('user CANNOT hijack another user session', async () => {
    const db = studentA().firestore();
    await assertFails(setDoc(doc(db, 'sessions', 'session-other'), {
      uid: 'student_b',
      startedAt: Date.now()
    }));
  });
});

