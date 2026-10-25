/**
 * PBL Transfer Pipeline: 1-Click Coach-to-Student Publishing
 * Transports synthesized & edited curriculum units from Coach Studio directly
 * into the Student's active Dashboard and database.
 */

import { db, doc, setDoc } from '../../../firebase.js';
import { hrefFor } from '../../../app/routes.js';
import { saveCustomProgram } from '../programs/customProgramsStore.js';
import { publishProgram } from '../../../services/pblService.js';
import { generateSearchTokens } from '../../pbl/programs/libraryProgramsData.js';

const BROADCAST_CHANNEL_NAME = 'hearisland_pbl_transfer_channel';

/**
 * Transforms an authored PblUnit into a complete PblProgram shape compatible
 * with WeLearn's ProgramDetail component and catalog.
 */
export function convertUnitToProgram(unit, coachUid = null) {
  const phases = unit.milestones.map((m) => {
    const session = {
      sessionNumber: m.stageNumber,
      week: m.week,
      title: m.title,
      durationMin: m.durationMin || 90,
      learningGoal: m.learningGoal,
      activities: m.activities || [],
      makerSpaceTools: m.makerSpaceTools || [],
      allowedSubmissions: m.allowedSubmissions || ['video', 'github', 'prototype'],
      learnerChoices: {
        question: `Submission Format for ${m.stageName}`,
        options: (m.allowedSubmissions || ['video', 'github', 'prototype']).map((sub) => ({
          id: `opt-${sub}`,
          label: sub === 'video' ? '📹 60s Video Pitch' : sub === 'github' ? '💻 GitHub Repo Link' : '🛠️ Physical Prototype',
          description: sub === 'video' ? 'Submit video demo' : sub === 'github' ? 'Submit code & firmware' : 'Register physical MakerSpace artifact'
        }))
      },
      evidenceToCollect: {
        kind: 'media',
        prompt: m.evidencePrompt,
        targetCompetencies: ['sdl-01', 'ctps-01', 'ct-03']
      },
      reflectionPrompt: `What surprised you during this ${m.stageName} milestone, and how did your MakerSpace tools help?`,
      teacherTips: m.coachCue || 'Support learner initiation and celebrate iterations.'
    };

    return {
      id: `phase-${m.stageNumber}`,
      title: `Stage ${m.stageNumber}: ${m.stageName}`,
      strap: `Week ${m.week} · ${m.title}`,
      weeks: [m.week, m.week],
      goal: m.learningGoal,
      tasks: m.activities,
      evidence: [m.evidencePrompt],
      aiPromptStarters: [
        `Help me brainstorm alternative solutions for ${unit.drivingQuestion}`,
        `Explain how to calibrate MakerSpace tools for ${m.stageName}`,
        `Check my prototype against engineering constraints`
      ],
      competencies: ['sdl-01', 'ctps-01'],
      stretchCompetencies: ['ct-10'],
      sessions: [session]
    };
  });

  const sessions = phases.flatMap((p) => p.sessions);
  const isUniversal = !unit.targetLearner?.name || unit.targetLearner?.isUniversal || unit.targetLearner?.id === 'universal-all';
  const learnerName = isUniversal ? 'All Learners' : (unit.targetLearner?.name || 'All Learners');
  const tags = [
    unit.theme,
    ...(unit.makerSpaceSpecs || []).map((s) => s.toolType?.split(' ')?.[0]).filter(Boolean),
    'stem', 'makerspace', 'pbl', 'rover', 'robotics'
  ];
  const searchTokens = generateSearchTokens(unit.unitTitle, unit.theme, tags, unit.drivingQuestion);

  return {
    id: unit.id,
    title: unit.unitTitle,
    subtitle: isUniversal
      ? `${unit.theme} · Open Library Program`
      : `${unit.theme} · 2e Customized for ${learnerName}`,
    theme: unit.theme,
    drivingQuestion: unit.drivingQuestion,
    status: 'published',
    visibility: 'centre',
    tags,
    searchTokens,
    authorId: unit.authorId || coachUid || 'coach',
    realProblem: unit.realProblem,
    targetAgeRange: isUniversal ? 'Ages 12–18 (Secondary PBL)' : 'Ages 12–16 (2e Adapted Secondary)',
    durationWeeks: 12,
    totalSessions: sessions.length,
    materialsAndKit: {
      microcontrollers: unit.makerSpaceSpecs.filter((s) => s.toolType.includes('Microcontroller')).map((s) => s.specs),
      sensorsAndActuators: ['Grove Capacitive Sensors', 'Ultrasonic HC-SR04', 'Servo / DC Motors'],
      fabricationMaterials: unit.makerSpaceSpecs.map((s) => `${s.toolType}: ${s.specs}`),
      softwareAndTools: ['Blender 4.2 / CAD', 'MicroPython Web Editor', 'Bambu Studio']
    },
    teacherGuidance: {
      safetyProtocol: unit.makerSpaceSpecs.map((s) => s.safetyGuidelines),
      pedagogicalScaffolding: unit.targetLearner?.appliedAccommodations || [],
      aiEthicsRules: ['AI as Co-Pilot for ideation & coding', 'Learner explains every design decision']
    },
    coachCues: unit.coachCues,
    phases,
    sessions,
    identity: {
      icon: 'Store',
      tone: 'amber',
      short: unit.unitTitle.slice(0, 24)
    },
    targetLearner: unit.targetLearner,
    makerSpaceSpecs: unit.makerSpaceSpecs,
    issues: []
  };
}

/**
 * Publishes the PBL Unit to the global catalog and search engine (No specific student required).
 * Available immediately across the student search engine (`#/search`).
 * @param {object} pblUnit - The authored unit
 * @param {string} coachUid - Current coach ID
 * @param {string} [classId] - Optional class ID
 * @returns {Promise<{success: boolean, programId: string, programTitle: string, searchUrl: string, studentUrl: string}>}
 */
export async function publishProgramToCatalog(pblUnit, coachUid, classId = null) {
  const program = convertUnitToProgram(pblUnit);
  if (coachUid) program.authorId = coachUid;
  program.status = 'published';
  program.visibility = 'centre';
  const now = Date.now();

  // 1. Save to local Custom Programs Store (instant client persistence)
  saveCustomProgram(program);

  // 2. Publish to Firestore via publishProgram service (no student assigned)
  const assignTo = {};
  if (classId && classId !== 'all') assignTo.classId = classId;
  const { enrolmentIds } = await publishProgram(program, { assignTo });
  console.log('[PBL Publish] Cloud catalog save successful to pbl_programs/' + program.id, enrolmentIds);

  // 3. Emit real-time Broadcast Channel event for instant live multi-tab search sync
  try {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      channel.postMessage({
        type: 'PBL_PROGRAM_PUBLISHED',
        programId: program.id,
        programTitle: program.title,
        program,
        publishedAt: now
      });
      channel.close();
    }
  } catch (err) {
    console.warn('[PBL Publish] BroadcastChannel notice:', err);
  }

  // 4. Dispatch in-window custom events
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('pbl-program-published', {
      detail: { programId: program.id, programTitle: program.title, program }
    }));
    window.dispatchEvent(new CustomEvent('pbl-program-transferred', {
      detail: { programId: program.id, program }
    }));
    window.dispatchEvent(new CustomEvent('pbl-custom-programs-changed', {
      detail: { programId: program.id }
    }));
  }

  return {
    success: true,
    programId: program.id,
    programTitle: program.title,
    searchUrl: hrefFor.homeSearch(program.title),
    studentUrl: hrefFor.program(program.id)
  };
}

/**
 * Publishes the PBL Unit to the database and broadcasts real-time transfer.
 * @param {object} pblUnit - The authored unit
 * @param {string} studentUid - The recipient student ID
 * @param {string} coachUid - Current coach ID
 * @param {string} [classId] - Optional student class ID
 * @returns {Promise<{success: boolean, programId: string, studentUrl: string}>}
 */
export async function publishAndTransferToStudent(pblUnit, studentUid, coachUid, classId = null) {
  const program = convertUnitToProgram(pblUnit);
  if (coachUid) program.authorId = coachUid;
  const now = Date.now();

  // 1. Save to local Custom Programs Store (instant client persistence)
  saveCustomProgram(program);

  // 2. Set as active program for student in localStorage
  try {
    localStorage.setItem(`hearisland.activeProgram.${studentUid}`, program.id);
    localStorage.setItem(`hearisland.activeProgram.lastTransferred`, JSON.stringify({
      programId: program.id,
      title: program.title,
      studentUid,
      transferredAt: now
    }));
  } catch (err) {
    console.warn('[PBL Transfer] localStorage write warning:', err);
  }

  // 3. Save to Firestore via publishProgram service (atomic batch + strict contract validation)
  const assignTo = { learnerId: studentUid };
  if (classId) assignTo.classId = classId;
  const { enrolmentIds } = await publishProgram(program, { assignTo });
  console.log('[PBL Transfer] Cloud save successful to pbl_programs/' + program.id, enrolmentIds);

  // 4. Emit real-time Broadcast Channel event for instant live multi-tab sync
  try {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      channel.postMessage({
        type: 'PBL_PROGRAM_TRANSFERRED',
        programId: program.id,
        programTitle: program.title,
        studentUid,
        program,
        transferredAt: now
      });
      channel.close();
    }
  } catch (err) {
    console.warn('[PBL Transfer] BroadcastChannel notice:', err);
  }

  // 5. Dispatch in-window custom event so any open student view updates synchronously
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('pbl-program-transferred', {
      detail: { programId: program.id, studentUid, program }
    }));
  }

  return {
    success: true,
    programId: program.id,
    programTitle: program.title,
    studentUrl: hrefFor.program(program.id)
  };
}

/**
 * Subscribes to transfer events in real time.
 */
export function subscribeToPblTransfers(callback) {
  let channel = null;
  try {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      channel.onmessage = (event) => {
        if (event.data?.type === 'PBL_PROGRAM_TRANSFERRED' || event.data?.type === 'PBL_PROGRAM_PUBLISHED') {
          callback(event.data);
        }
      };
    }
  } catch {
    // Ignore
  }

  const handleCustomEvent = (e) => {
    if (e.detail) callback(e.detail);
  };
  window.addEventListener('pbl-program-transferred', handleCustomEvent);
  window.addEventListener('pbl-program-published', handleCustomEvent);

  return () => {
    if (channel) channel.close();
    window.removeEventListener('pbl-program-transferred', handleCustomEvent);
    window.removeEventListener('pbl-program-published', handleCustomEvent);
  };
}
