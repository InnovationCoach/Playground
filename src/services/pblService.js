/**
 * PBL Data Access Layer & Services
 * Shared Data Contract: docs/data-contract.md
 * Owned by Gemini 3.8 (Backend and Data Lead).
 */

import { z } from 'zod';
import {
  db, doc, getDoc, setDoc, updateDoc, writeBatch, collection, query, where, getDocs,
  arrayUnion, serverTimestamp, usingEmulators
} from '../firebase.js';
import { WELEARN_DT_FRAMEWORK, LIBRARY_PROGRAMS, generateSearchTokens } from '../features/pbl/programs/libraryProgramsData.js';

// ============================================================================
// Zod Schemas enforcing the Data Contract
// ============================================================================

export const PblSessionContractSchema = z.object({
  title: z.string().default(''),
  minutes: z.number().default(90),
  activities: z.array(z.string()).default([])
});

export const PblPhaseContractSchema = z.object({
  phaseId: z.string(),
  title: z.string().default(''),
  learningGoal: z.string().default(''),
  sessions: z.array(PblSessionContractSchema).default([]),
  tools: z.array(z.string()).default([]),
  deliverables: z.array(z.string()).default([]),
  coachCue: z.string().optional().default('')
});

export const PblProgramContractSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  drivingQuestion: z.string().min(1, 'Driving question is required'),
  theme: z.string().min(1, 'Theme is required'),
  impact: z.object({
    people: z.string().default(''),
    environment: z.string().default('')
  }).default({ people: '', environment: '' }),
  frameworkId: z.literal('welearn-dt').default('welearn-dt'),
  frameworkVersion: z.number().default(1),
  phases: z.array(PblPhaseContractSchema).default([]),
  ageBand: z.string().default('11-16'),
  durationWeeks: z.number().default(12),
  authorId: z.string().default('coach'),
  source: z.enum(['studio', 'library']).default('studio'),
  status: z.enum(['draft', 'published', 'archived']).default('published'),
  visibility: z.enum(['class', 'centre']).default('class'),
  searchTokens: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  createdAt: z.number().default(() => Date.now()),
  updatedAt: z.number().default(() => Date.now()),
});

export function validateProgramContract(program) {
  return PblProgramContractSchema.safeParse(program);
}

// ============================================================================
// Reader Guards & Normalisation (P0-2)
// ============================================================================

/**
 * Normalises any program object to guarantee that all contract fields
 * and arrays exist. Never returns undefined for array collections.
 */
export function normaliseContractProgram(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const rawPhases = Array.isArray(raw.phases)
    ? raw.phases
    : (Array.isArray(raw.milestones)
      ? raw.milestones.map((m) => ({
          phaseId: `phase-${m.stageNumber || 1}`,
          title: m.stageName || m.title || '',
          learningGoal: m.learningGoal || '',
          sessions: [{
            title: m.title || m.stageName || '',
            minutes: m.durationMin || 90,
            activities: Array.isArray(m.activities) ? m.activities : []
          }],
          tools: Array.isArray(m.makerSpaceTools) ? m.makerSpaceTools : [],
          deliverables: Array.isArray(m.allowedSubmissions) ? m.allowedSubmissions : (m.evidencePrompt ? [m.evidencePrompt] : []),
          coachCue: m.coachCue || ''
        }))
      : []);

  const phases = rawPhases.map((ph, idx) => {
    const phaseId = ph.phaseId || ph.id || `phase-${idx + 1}`;
    const pWeeks = Array.isArray(ph.weeks) && ph.weeks.length >= 2 ? ph.weeks : [idx + 1, idx + 1];
    return {
      id: phaseId,
      phaseId,
      title: ph.title || '',
      learningGoal: ph.learningGoal || ph.goal || '',
      goal: ph.goal || ph.learningGoal || '',
      strap: ph.strap || '',
      weeks: pWeeks,
      sessions: Array.isArray(ph.sessions) ? ph.sessions.map((s, sIdx) => ({
        sessionNumber: s.sessionNumber || sIdx + 1,
        title: s.title || `Session ${sIdx + 1}`,
        minutes: Number(s.minutes || s.durationMin || 90),
        durationMin: Number(s.durationMin || s.minutes || 90),
        week: s.week || pWeeks[0] || idx + 1,
        learningGoal: s.learningGoal || '',
        activities: Array.isArray(s.activities) ? s.activities : [],
        evidenceToCollect: s.evidenceToCollect || { kind: 'note', prompt: '', targetCompetencies: [] },
        teacherTips: s.teacherTips || ''
      })) : [],
      tools: Array.isArray(ph.tools) ? ph.tools : (Array.isArray(ph.makerSpaceTools) ? ph.makerSpaceTools : []),
      deliverables: Array.isArray(ph.deliverables) ? ph.deliverables : (Array.isArray(ph.evidence) ? ph.evidence : []),
      tasks: Array.isArray(ph.tasks) ? ph.tasks : (Array.isArray(ph.deliverables) ? ph.deliverables : []),
      evidence: Array.isArray(ph.evidence) ? ph.evidence : (Array.isArray(ph.deliverables) ? ph.deliverables : []),
      competencies: Array.isArray(ph.competencies) ? ph.competencies : [],
      stretchCompetencies: Array.isArray(ph.stretchCompetencies) ? ph.stretchCompetencies : [],
      aiPromptStarters: Array.isArray(ph.aiPromptStarters) ? ph.aiPromptStarters : [],
      coachCue: ph.coachCue || ph.teacherTips || ''
    };
  });

  const title = raw.title || raw.unitTitle || 'Untitled Program';
  const theme = raw.theme || 'General STEM';
  const drivingQuestion = raw.drivingQuestion || '';
  const tags = Array.isArray(raw.tags) ? raw.tags : [];
  const searchTokens = Array.isArray(raw.searchTokens) && raw.searchTokens.length > 0
    ? raw.searchTokens
    : generateSearchTokens(title, theme, tags, drivingQuestion);

  const sessions = Array.isArray(raw.sessions) && raw.sessions.length > 0
    ? raw.sessions
    : phases.flatMap((ph) => ph.sessions);

  return {
    id: raw.id || raw.slug,
    slug: raw.slug || raw.id,
    title,
    subtitle: raw.subtitle || '',
    drivingQuestion,
    theme,
    impact: {
      people: raw.impact?.people || '',
      environment: raw.impact?.environment || ''
    },
    frameworkId: raw.frameworkId || 'welearn-dt',
    frameworkVersion: raw.frameworkVersion || 1,
    phases,
    sessions,
    ageBand: raw.ageBand || raw.targetAgeRange || '11-16',
    targetAgeRange: raw.targetAgeRange || raw.ageBand || '11-16',
    durationWeeks: raw.durationWeeks || 12,
    authorId: raw.authorId || raw.authorUid || 'coach',
    source: raw.source || 'studio',
    status: raw.status === 'draft' || raw.status === 'archived' ? raw.status : 'published',
    visibility: raw.visibility === 'centre' ? 'centre' : 'class',
    searchTokens,
    tags,
    createdAt: raw.createdAt || Date.now(),
    updatedAt: raw.updatedAt || Date.now(),
    publishedAt: raw.publishedAt || raw.transferredAt || raw.createdAt || Date.now(),
    // Presentation helper properties for backward compatibility with UI components
    realProblem: raw.realProblem || {
      summary: drivingQuestion,
      peopleImpact: raw.impact?.people || 'Community impact',
      environmentalImpact: raw.impact?.environment || 'Sustainable design'
    },
    measurableImpactCriteria: Array.isArray(raw.measurableImpactCriteria) ? raw.measurableImpactCriteria : [],
    teacherGuidance: raw.teacherGuidance || {
      safetyProtocol: [],
      pedagogicalScaffolding: [],
      aiEthicsRules: [],
      differentiationNotes: []
    },
    materialsAndKit: raw.materialsAndKit || {
      microcontrollers: [],
      sensorsAndActuators: [],
      fabricationMaterials: [],
      softwareAndTools: []
    },
    assumptions: Array.isArray(raw.assumptions) ? raw.assumptions : [],
    identity: raw.identity || {
      icon: 'Compass',
      tone: 'amber',
      short: title.slice(0, 24)
    },
    issues: Array.isArray(raw.issues) ? raw.issues : []
  };
}

/**
 * Guarded reader for program documents.
 * Returns { status: 'not_found', program: null } instead of throwing.
 */
export async function getProgram(id) {
  if (!id || typeof id !== 'string') {
    return { status: 'not_found', program: null };
  }

  // 1. Check Firestore pbl_programs collection
  try {
    const snap = await getDoc(doc(db, 'pbl_programs', id));
    if (snap && (typeof snap.exists === 'function' ? snap.exists() : snap.exists)) {
      const data = snap.data();
      return { status: 'found', program: normaliseContractProgram({ id: snap.id, ...data }) };
    }
  } catch (err) {
    console.warn('[PBL Service] Firestore read notice:', err?.message);
  }

  // 2. Check 6 library programs
  const libProg = LIBRARY_PROGRAMS.find((p) => p.id === id || p.slug === id);
  if (libProg) {
    return { status: 'found', program: normaliseContractProgram(libProg) };
  }

  // 3. Check client localStorage (custom programs store from emulator/mock)
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem('hearisland.custom_pbl_programs.v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed[id]) {
          return { status: 'found', program: normaliseContractProgram(parsed[id]) };
        }
      }
    }
  } catch {
    // Ignore storage parse issues
  }

  return { status: 'not_found', program: null };
}

// ============================================================================
// Publish Program Pipeline (P0-1, P0-5)
// ============================================================================

/**
 * Publishes a PBL program draft and assigns it to a class or learner(s).
 * - Validates against PblProgramContractSchema
 * - Writes pbl_programs and updates classes.programId or enrolments in a batch
 * - REJECTS on error; suppresses NO errors in production
 * - Returns { programId, enrolmentIds }
 */
export async function publishProgram(draft, { assignTo = {} } = {}) {
  const now = Date.now();
  const normalized = normaliseContractProgram(draft);
  if (!normalized) {
    throw new Error('Invalid program draft: unable to normalize.');
  }

  // If no slug/id, generate a URL-friendly slug
  const programId = normalized.id || normalized.slug || `prog-${now}`;
  normalized.id = programId;
  normalized.slug = normalized.slug || programId;
  normalized.status = normalized.status || 'published';
  normalized.updatedAt = now;
  normalized.publishedAt = normalized.publishedAt || now;

  // Validate against Zod contract
  const validation = PblProgramContractSchema.safeParse(normalized);
  if (!validation.success) {
    const issueMsg = validation.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
    throw new Error(`Data Contract validation failed: ${issueMsg}`);
  }
  const programData = validation.data;

  // Prepare batch write
  const batch = writeBatch(db);
  const programRef = doc(db, 'pbl_programs', programId);
  batch.set(programRef, programData, { merge: true });

  const enrolmentIds = [];
  const firstPhaseId = programData.phases[0]?.phaseId || 'explore';

  // 1. Assign to class if specified
  if (assignTo.classId) {
    const classRef = doc(db, 'classes', assignTo.classId);
    batch.update(classRef, {
      programId: programId,
      updatedAt: serverTimestamp()
    });
  }

  // 2. Assign to individual learner if specified
  if (assignTo.learnerId) {
    const enrolmentId = `${assignTo.learnerId}_${programId}`;
    enrolmentIds.push(enrolmentId);
    const enrolRef = doc(db, 'enrolments', enrolmentId);
    batch.set(enrolRef, {
      learnerId: assignTo.learnerId,
      programId: programId,
      classId: assignTo.classId || null,
      source: 'coach-assigned',
      currentPhaseId: firstPhaseId,
      status: 'active',
      startedAt: now,
      updatedAt: now
    }, { merge: true });

    const phaseRef = doc(db, 'enrolments', enrolmentId, 'phaseProgress', firstPhaseId);
    batch.set(phaseRef, {
      status: 'in_progress',
      evidence: [],
      updatedAt: now
    }, { merge: true });

    // Also update student user document for fast lookup
    const userRef = doc(db, 'users', assignTo.learnerId);
    batch.set(userRef, {
      activeProgramId: programId,
      updatedAt: serverTimestamp()
    }, { merge: true });
  }

  // 3. Assign to list of learners if specified
  if (Array.isArray(assignTo.learnerIds)) {
    for (const lId of assignTo.learnerIds) {
      const enrolmentId = `${lId}_${programId}`;
      enrolmentIds.push(enrolmentId);
      const enrolRef = doc(db, 'enrolments', enrolmentId);
      batch.set(enrolRef, {
        learnerId: lId,
        programId: programId,
        classId: assignTo.classId || null,
        source: 'coach-assigned',
        currentPhaseId: firstPhaseId,
        status: 'active',
        startedAt: now,
        updatedAt: now
      }, { merge: true });
    }
  }

  // Write to client localStorage as instant optimistic cache
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem('hearisland.custom_pbl_programs.v1');
      const existing = raw ? JSON.parse(raw) : {};
      existing[programId] = programData;
      localStorage.setItem('hearisland.custom_pbl_programs.v1', JSON.stringify(existing));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('pbl-custom-programs-changed', { detail: { programId } }));
      }
    }
  } catch {
    // Non-fatal
  }

  // Commit batch write to Firestore
  try {
    await batch.commit();
    return { programId, enrolmentIds };
  } catch (err) {
    // Contract requirement P0-1: REJECT on error. Strictly throw on failure so caller knows status.
    console.error('[PBL Service] Failed to commit program to Firestore:', err);
    throw new Error(`Failed to publish program to Firestore: ${err?.message || 'Permission denied'}`);
  }
}

// ============================================================================
// Learner Discovery & Self-Enrolment (P0-4)
// ============================================================================

/**
 * Searches published, centre-visible programs by keyword token.
 */
export async function searchPrograms(queryText = '') {
  const token = String(queryText || '').trim().toLowerCase();

  try {
    const colRef = collection(db, 'pbl_programs');
    let q;
    if (token) {
      q = query(
        colRef,
        where('status', '==', 'published'),
        where('visibility', '==', 'centre'),
        where('searchTokens', 'array-contains', token)
      );
    } else {
      q = query(
        colRef,
        where('status', '==', 'published'),
        where('visibility', '==', 'centre')
      );
    }
    const snap = await getDocs(q);
    const results = [];
    snap.forEach((d) => {
      results.push(normaliseContractProgram({ id: d.id, ...d.data() }));
    });
    if (results.length > 0) return results;
  } catch (err) {
    console.warn('[PBL Service] Firestore search notice:', err?.message);
  }

  // Fallback to library programs
  return LIBRARY_PROGRAMS
    .filter((p) => p.status === 'published' && p.visibility === 'centre')
    .filter((p) => !token || p.searchTokens.includes(token) || p.title.toLowerCase().includes(token) || p.theme.toLowerCase().includes(token))
    .map(normaliseContractProgram);
}

/**
 * Idempotently enrols a learner in a published centre-visible program.
 * Creates enrolments/{uid}_{programId} with source: 'self-added'.
 */
export async function addToMyCourse(programId, uid) {
  if (!uid) throw new Error('Unauthenticated learner cannot enrol in a program.');
  if (!programId) throw new Error('Program ID is required.');

  const enrolmentId = `${uid}_${programId}`;
  const enrolRef = doc(db, 'enrolments', enrolmentId);

  // Check if already enrolled (Idempotency)
  try {
    const existing = await getDoc(enrolRef);
    if (existing && (typeof existing.exists === 'function' ? existing.exists() : existing.exists)) {
      return {
        success: true,
        alreadyEnrolled: true,
        enrolmentId
      };
    }
  } catch (err) {
    // Proceed to create
  }

  const progRes = await getProgram(programId);
  const firstPhaseId = progRes.program?.phases?.[0]?.phaseId || 'explore';
  const now = Date.now();

  const batch = writeBatch(db);
  batch.set(enrolRef, {
    learnerId: uid,
    programId,
    source: 'self-added',
    currentPhaseId: firstPhaseId,
    status: 'active',
    startedAt: now,
    updatedAt: now
  });

  const phaseProgressRef = doc(db, 'enrolments', enrolmentId, 'phaseProgress', firstPhaseId);
  batch.set(phaseProgressRef, {
    status: 'in_progress',
    evidence: [],
    updatedAt: now
  });

  await batch.commit();

  return {
    success: true,
    alreadyEnrolled: false,
    enrolmentId
  };
}

// ============================================================================
// Evidence Submission & Coach Feedback
// ============================================================================

/**
 * Learner submits evidence for a phase.
 */
export async function submitPhaseEvidence(enrolmentId, phaseId, evidenceItem) {
  const phaseRef = doc(db, 'enrolments', enrolmentId, 'phaseProgress', phaseId);
  const record = {
    type: evidenceItem.type || 'text',
    url: evidenceItem.url || null,
    note: evidenceItem.note || '',
    at: Date.now()
  };

  await setDoc(phaseRef, {
    status: 'submitted',
    evidence: arrayUnion(record),
    updatedAt: Date.now()
  }, { merge: true });

  return record;
}

/**
 * Coach reviews phase progress and records feedback.
 */
export async function saveCoachFeedback(enrolmentId, phaseId, { text, rating = 5, coachId }) {
  const phaseRef = doc(db, 'enrolments', enrolmentId, 'phaseProgress', phaseId);
  const coachFeedback = {
    text: String(text || '').trim(),
    rating: Number(rating) || 5,
    coachId: String(coachId),
    at: Date.now()
  };

  await updateDoc(phaseRef, {
    coachFeedback,
    status: 'reviewed',
    updatedAt: Date.now()
  });

  return coachFeedback;
}
