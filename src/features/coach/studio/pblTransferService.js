/**
 * PBL Transfer Pipeline: 1-Click Coach-to-Student Publishing
 * Transports synthesized & edited curriculum units from Coach Studio directly
 * into the Student's active Dashboard and database.
 */

import { db, doc, setDoc } from '../../../firebase.js';
import { hrefFor } from '../../../app/routes.js';
import { saveCustomProgram } from '../programs/customProgramsStore.js';
import { publishProgram } from '../../../services/pblService.js';

const BROADCAST_CHANNEL_NAME = 'hearisland_pbl_transfer_channel';

/**
 * Transforms an authored PblUnit into a complete PblProgram shape compatible
 * with WeLearn's ProgramDetail component and catalog.
 */
export function convertUnitToProgram(unit) {
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

  return {
    id: unit.id,
    title: unit.unitTitle,
    subtitle: `${unit.theme} · 2e Customized for ${unit.targetLearner.name}`,
    theme: unit.theme,
    drivingQuestion: unit.drivingQuestion,
    status: 'published',
    visibility: 'centre',
    authorId: unit.authorId || coachUid || 'coach',
    realProblem: unit.realProblem,
    targetAgeRange: 'Ages 12–16 (2e Adapted Secondary)',
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
      pedagogicalScaffolding: unit.targetLearner.appliedAccommodations,
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
        if (event.data?.type === 'PBL_PROGRAM_TRANSFERRED') {
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

  return () => {
    if (channel) channel.close();
    window.removeEventListener('pbl-program-transferred', handleCustomEvent);
  };
}
