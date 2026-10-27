/**
 * Security Rule Tests for Coach Records & Private Notes
 * Tests rules M1 - M15 from docs/COACH-MY-LEARNERS-CONTRACT-FOR-GEMINI.md
 */
import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds
} from '@firebase/rules-unit-testing';
import fs from 'fs';
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

let testEnv;

const CLASS_A = 'class_a';
const CLASS_B = 'class_b';

const coachA = () => testEnv.authenticatedContext('coach_a', { role: 'teacher', classIds: [CLASS_A] });
const coachA2 = () => testEnv.authenticatedContext('coach_a2', { role: 'teacher', classIds: [CLASS_A] });
const coachB = () => testEnv.authenticatedContext('coach_b', { role: 'teacher', classIds: [CLASS_B] });
const studentA = () => testEnv.authenticatedContext('student_a');
const parentUser = () => testEnv.authenticatedContext('parent_1', { role: 'parent' });
const adminUser = () => testEnv.authenticatedContext('admin_1', { role: 'admin' });
const anon = () => testEnv.unauthenticatedContext();

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-hearisland-coach-records',
    firestore: {
      rules: fs.readFileSync('firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8088
    }
  });
});

afterAll(async () => {
  await testEnv?.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'classes', CLASS_A), { name: 'Class A', coachIds: ['coach_a', 'coach_a2'], orgId: 'org1' });
    await setDoc(doc(db, 'classes', CLASS_B), { name: 'Class B', coachIds: ['coach_b'], orgId: 'org2' });

    await setDoc(doc(db, 'users', 'student_a'), {
      uid: 'student_a', email: 'a@school.edu', displayName: 'Ann', role: 'student', classIds: [CLASS_A]
    });
    await setDoc(doc(db, 'users', 'coach_a'), {
      uid: 'coach_a', email: 'coach_a@school.edu', displayName: 'Coach A', role: 'teacher', classIds: [CLASS_A]
    });
    await setDoc(doc(db, 'users', 'coach_a2'), {
      uid: 'coach_a2', email: 'coach_a2@school.edu', displayName: 'Coach A2', role: 'teacher', classIds: [CLASS_A]
    });
    await setDoc(doc(db, 'users', 'coach_b'), {
      uid: 'coach_b', email: 'coach_b@school.edu', displayName: 'Coach B', role: 'teacher', classIds: [CLASS_B]
    });
  });
});

describe('Coach Private Notes (M5, M6)', () => {
  const NOTE_PATH = 'coachPrivate/coach_a/learners/student_a/notes/note_1';

  it('allows authoring coach to create, read, update, and delete their own private note', async () => {
    const db = coachA().firestore();
    await assertSucceeds(setDoc(doc(db, NOTE_PATH), {
      id: 'note_1',
      text: 'Private observation about focus hurdles',
      at: Date.now()
    }));
    await assertSucceeds(getDoc(doc(db, NOTE_PATH)));
    await assertSucceeds(updateDoc(doc(db, NOTE_PATH), { text: 'Updated observation' }));
    await assertSucceeds(deleteDoc(doc(db, NOTE_PATH)));
  });

  it('denies learner from reading or writing coach private notes', async () => {
    // Seed note
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), NOTE_PATH), { id: 'note_1', text: 'Private note', at: Date.now() });
    });
    const db = studentA().firestore();
    await assertFails(getDoc(doc(db, NOTE_PATH)));
    await assertFails(setDoc(doc(db, NOTE_PATH), { text: 'Learner tamper' }));
  });

  it('denies co-coach (coach_a2) and outsider coach (coach_b) from reading private note', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), NOTE_PATH), { id: 'note_1', text: 'Private note', at: Date.now() });
    });
    await assertFails(getDoc(doc(coachA2().firestore(), NOTE_PATH)));
    await assertFails(getDoc(doc(coachB().firestore(), NOTE_PATH)));
  });

  it('denies admin and parent from reading private note (M6: strictly private to author)', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), NOTE_PATH), { id: 'note_1', text: 'Private note', at: Date.now() });
    });
    await assertFails(getDoc(doc(adminUser().firestore(), NOTE_PATH)));
    await assertFails(getDoc(doc(parentUser().firestore(), NOTE_PATH)));
  });

  it('denies outsider coach (coach_b) from creating private note for student_a (scope check)', async () => {
    const db = coachB().firestore();
    const OUTSIDER_NOTE = 'coachPrivate/coach_b/learners/student_a/notes/note_b1';
    await assertFails(setDoc(doc(db, OUTSIDER_NOTE), {
      id: 'note_b1', text: 'Outsider note', at: Date.now()
    }));
  });
});

describe('Coaching Records: Check-ins (M1, M2, M3, M4b, M8, M10)', () => {
  const CHECKIN_PATH = 'learners/student_a/checkIns/ci_1';

  it('allows assigned coach to create and read check-in', async () => {
    const db = coachA().firestore();
    await assertSucceeds(setDoc(doc(db, CHECKIN_PATH), {
      id: 'ci_1',
      strength: 'Great curiosity',
      challenge: 'Time estimation',
      nextAction: 'Prototype telemetry harness',
      followUpOn: '2026-11-05',
      authorUid: 'coach_a',
      at: Date.now()
    }));
    await assertSucceeds(getDoc(doc(db, CHECKIN_PATH)));
  });

  it('denies co-coach from modifying author coach check-in (M4b)', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), CHECKIN_PATH), {
        id: 'ci_1', strength: 'Strong', nextAction: 'Build', authorUid: 'coach_a', at: Date.now()
      });
    });
    // Co-coach A2 can read check-in (M1)
    await assertSucceeds(getDoc(doc(coachA2().firestore(), CHECKIN_PATH)));
    // But cannot update or delete it (M4b)
    await assertFails(updateDoc(doc(coachA2().firestore(), CHECKIN_PATH), { nextAction: 'Changed by co-coach' }));
    await assertFails(deleteDoc(doc(coachA2().firestore(), CHECKIN_PATH)));
  });

  it('denies learner and parent from reading check-in (M8, M10)', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), CHECKIN_PATH), {
        id: 'ci_1', strength: 'Strong', nextAction: 'Build', authorUid: 'coach_a', at: Date.now()
      });
    });
    await assertFails(getDoc(doc(studentA().firestore(), CHECKIN_PATH)));
    await assertFails(getDoc(doc(parentUser().firestore(), CHECKIN_PATH)));
  });

  it('denies coach of another class from reading or writing check-in (M2)', async () => {
    const db = coachB().firestore();
    await assertFails(getDoc(doc(db, CHECKIN_PATH)));
    await assertFails(setDoc(doc(db, CHECKIN_PATH), {
      id: 'ci_1', nextAction: 'Invalid', authorUid: 'coach_b', at: Date.now()
    }));
  });
});

describe('Coaching Records: Agreed Milestones & Coach Goals (M4, M7)', () => {
  const MILESTONE_PATH = 'learners/student_a/milestones/ms_1';
  const GOAL_PATH = 'learners/student_a/coachGoals/gl_1';

  it('allows learner to read milestones and coach-set goals (M7)', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), MILESTONE_PATH), {
        id: 'ms_1', title: 'Complete CAD chassis', dueOn: '2026-11-10', doneOn: null, authorUid: 'coach_a', at: Date.now()
      });
      await setDoc(doc(ctx.firestore(), GOAL_PATH), {
        id: 'gl_1', text: 'Document 3 user tests before Friday', dueOn: '2026-11-08', doneOn: null, authorUid: 'coach_a', at: Date.now()
      });
    });

    const studentDb = studentA().firestore();
    await assertSucceeds(getDoc(doc(studentDb, MILESTONE_PATH)));
    await assertSucceeds(getDoc(doc(studentDb, GOAL_PATH)));

    // Learner cannot write/update them (M9)
    await assertFails(updateDoc(doc(studentDb, MILESTONE_PATH), { doneOn: '2026-11-05' }));
    await assertFails(updateDoc(doc(studentDb, GOAL_PATH), { doneOn: '2026-11-05' }));
  });

  it('allows co-coach (coach_a2) to update milestones and coach goals (M4)', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), MILESTONE_PATH), {
        id: 'ms_1', title: 'Complete CAD chassis', dueOn: '2026-11-10', doneOn: null, authorUid: 'coach_a', at: Date.now()
      });
      await setDoc(doc(ctx.firestore(), GOAL_PATH), {
        id: 'gl_1', text: 'Document 3 user tests', dueOn: null, doneOn: null, authorUid: 'coach_a', at: Date.now()
      });
    });

    // Co-coach A2 can mark milestone or coach goal done
    const coCoachDb = coachA2().firestore();
    await assertSucceeds(updateDoc(doc(coCoachDb, MILESTONE_PATH), { doneOn: '2026-11-05' }));
    await assertSucceeds(updateDoc(doc(coCoachDb, GOAL_PATH), { doneOn: '2026-11-05' }));

    // But co-coach CANNOT rewrite milestone title or goal text (M4 field constraint)
    await assertFails(updateDoc(doc(coCoachDb, MILESTONE_PATH), { title: 'Rewritten by co-coach' }));
    await assertFails(updateDoc(doc(coCoachDb, GOAL_PATH), { text: 'Rewritten by co-coach' }));
  });
});

describe('Coaching Records: Feedback & Assessments (M7, M13)', () => {
  it('allows learner to read coach feedback on evidence (M7)', async () => {
    const FB_PATH = 'learners/student_a/feedback/proj_rover_1';
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), FB_PATH), {
        evidenceKey: 'proj_rover_1', text: 'Great sensor wiring!', authorUid: 'coach_a', at: Date.now()
      });
    });

    await assertSucceeds(getDoc(doc(studentA().firestore(), FB_PATH)));
  });

  it('enforces M13: competency assessment requires evidenceKeys unless level is insufficient', async () => {
    const coachDb = coachA().firestore();
    const ASM_1 = 'learners/student_a/assessments/asm_1';
    const ASM_2 = 'learners/student_a/assessments/asm_2';

    // Fails: level is independent but evidenceKeys is empty
    await assertFails(setDoc(doc(coachDb, ASM_1), {
      id: 'asm_1', competencyId: 'stem-04', level: 'independent', evidenceKeys: [], authorUid: 'coach_a', at: Date.now()
    }));

    // Succeeds: level is independent and has evidenceKeys
    await assertSucceeds(setDoc(doc(coachDb, ASM_1), {
      id: 'asm_1', competencyId: 'stem-04', level: 'independent', evidenceKeys: ['ev_rover_telemetry'], authorUid: 'coach_a', at: Date.now()
    }));

    // Succeeds: level is insufficient with empty evidenceKeys
    await assertSucceeds(setDoc(doc(coachDb, ASM_2), {
      id: 'asm_2', competencyId: 'stem-05', level: 'insufficient', evidenceKeys: [], authorUid: 'coach_a', at: Date.now()
    }));

    // Learner cannot read assessments (M8)
    await assertFails(getDoc(doc(studentA().firestore(), ASM_1)));
  });
});

describe('Coaching Records: Coach Evidence & Parent Reports (M11, M12, M14)', () => {
  it('enforces M14: coach-added evidence requires http/https link if link provided', async () => {
    const coachDb = coachA().firestore();
    const EV_1 = 'learners/student_a/coachEvidence/ev_1';

    // Fails: link is javascript URI
    await assertFails(setDoc(doc(coachDb, EV_1), {
      id: 'ev_1', kind: 'photo', title: 'Maker bench', link: 'javascript:alert(1)', authorUid: 'coach_a', at: Date.now()
    }));

    // Succeeds: link is https
    await assertSucceeds(setDoc(doc(coachDb, EV_1), {
      id: 'ev_1', kind: 'photo', title: 'Maker bench', link: 'https://cdn.example.com/photo.jpg', authorUid: 'coach_a', at: Date.now()
    }));

    // Learner can read coach evidence (M7)
    await assertSucceeds(getDoc(doc(studentA().firestore(), EV_1)));
  });

  it('enforces M11 & M12: report approval requires approvedAt, and approved report cannot be deleted or text rewritten', async () => {
    const coachDb = coachA().firestore();
    const RP_PATH = 'learners/student_a/reports/rp_1';

    // 1. Create draft report
    await assertSucceeds(setDoc(doc(coachDb, RP_PATH), {
      id: 'rp_1',
      status: 'draft',
      text: { summary: 'Initial draft' },
      authorUid: 'coach_a',
      createdAt: Date.now(),
      updatedAt: Date.now()
    }));

    // 2. Fails: approving without approvedAt (M11)
    await assertFails(updateDoc(doc(coachDb, RP_PATH), {
      status: 'approved',
      updatedAt: Date.now()
    }));

    // 3. Succeeds: approving with approvedAt (M11)
    await assertSucceeds(updateDoc(doc(coachDb, RP_PATH), {
      status: 'approved',
      approvedAt: Date.now(),
      updatedAt: Date.now()
    }));

    // 4. Fails: rewriting text of an approved report directly (M12)
    await assertFails(updateDoc(doc(coachDb, RP_PATH), {
      text: { summary: 'Rewritten after approval' },
      updatedAt: Date.now()
    }));

    // 5. Fails: deleting an approved report
    await assertFails(deleteDoc(doc(coachDb, RP_PATH)));
  });
});

describe('Admin & Supervisor Read-Only Oversight (M8b, Q5)', () => {
  it('allows admin/supervisor to read check-ins, assessments, and reports (read-only)', async () => {
    const CHECKIN_PATH = 'learners/student_a/checkIns/ci_audit';
    const RP_PATH = 'learners/student_a/reports/rp_audit';
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), CHECKIN_PATH), {
        id: 'ci_audit', strength: 'Strong', nextAction: 'Build', authorUid: 'coach_a', at: Date.now()
      });
      await setDoc(doc(ctx.firestore(), RP_PATH), {
        id: 'rp_audit', status: 'approved', text: { summary: 'Audit report' }, authorUid: 'coach_a', createdAt: Date.now(), updatedAt: Date.now()
      });
    });

    const adminDb = adminUser().firestore();
    // Admin can read (M8b)
    await assertSucceeds(getDoc(doc(adminDb, CHECKIN_PATH)));
    await assertSucceeds(getDoc(doc(adminDb, RP_PATH)));

    // Admin cannot write or delete (read-only)
    await assertFails(updateDoc(doc(adminDb, CHECKIN_PATH), { strength: 'Tampered' }));
    await assertFails(deleteDoc(doc(adminDb, RP_PATH)));
  });
});
