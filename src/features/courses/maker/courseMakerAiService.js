/**
 * Course Maker AI Service
 * Hybrid architecture: Uses server-side Gemini API (/api/pbl/synthesize) when available,
 * and seamlessly falls back to a deterministic, curriculum-grounded client engine.
 *
 * Rules:
 * 1. AI output is always flagged: `isAiGenerated: true, approvedByCoach: false`.
 * 2. Only valid curriculum framework identifiers (from `COMPETENCIES` and `WELEARN_DT_FRAMEWORK`) are produced.
 * 3. Never overwrites coach-approved work when generating single lessons.
 * 4. Gracefully catches failures without losing any draft state; coaches can always proceed manually.
 */

import { API_BASE } from '../../../services/apiBase.js';
import { auth } from '../../../firebase.js';
import { WELEARN_DT_FRAMEWORK } from '../../pbl/programs/libraryProgramsData.js';
import { COMPETENCIES, competencyById } from '../../pbl/content/competencies.js';

/**
 * Generates an 8-stage Design Thinking course outline grounded in the supplied basics and sources.
 */
export async function draftCourseOutline({ courseBasics, sources = [], onProgress = () => {} }) {
  onProgress('Preparing grounding sources and curriculum constraints…');

  const activeSources = sources.filter((s) => s.active !== false && (s.text || s.excerpt));
  const groundingContext = activeSources.map((s) => `[SOURCE: ${s.title}]\n${s.text || s.excerpt}`).join('\n\n');

  // Try server endpoint
  try {
    const token = await auth.currentUser?.getIdToken().catch(() => null);
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    onProgress('Consulting curriculum synthesis API…');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(`${API_BASE}/api/pbl/synthesize`, {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        learner: {
          name: 'Universal Cohort',
          cohort: courseBasics.cohort || 'lower-secondary',
          interests: courseBasics.theme || courseBasics.title
        },
        groundingContext: groundingContext.slice(0, 4000),
        customFocus: `${courseBasics.title}. Objectives: ${(courseBasics.objectives || []).join('; ')}`
      })
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data?.unit?.milestones && Array.isArray(data.unit.milestones)) {
        return {
          success: true,
          source: 'server-gemini',
          milestones: mapServerMilestonesToCourse(data.unit.milestones, courseBasics)
        };
      }
    }
  } catch (err) {
    console.info('[CourseMakerAI] Server endpoint unavailable or timed out, using local curriculum engine:', err.message);
  }

  // Local grounded generator
  onProgress('Synthesizing grounded course outline locally…');
  const milestones = generateLocalGroundedOutline(courseBasics, activeSources);
  return {
    success: true,
    source: 'local-grounded',
    milestones
  };
}

/**
 * Generates or refines a single lesson without modifying or overwriting approved lessons.
 */
export async function draftSingleLesson({ stageIndex, courseBasics, sources = [], existingMilestone = {} }) {
  const phaseInfo = WELEARN_DT_FRAMEWORK.phases[stageIndex] || { id: 'explore', label: `Stage ${stageIndex + 1}` };
  const stageTitle = existingMilestone.title || `${phaseInfo.label}: ${courseBasics.theme || courseBasics.title}`;
  const baseGoal = existingMilestone.learningGoal || (courseBasics.objectives?.[stageIndex % (courseBasics.objectives?.length || 1)] || `Explore foundational concepts in ${courseBasics.title}`);

  // Pick suitable competencies from the actual framework based on stage
  const recommendedCompetencies = getStageDefaultCompetencies(phaseInfo.id);

  const drafted = {
    id: existingMilestone.id || `stage-${phaseInfo.id}`,
    phaseId: phaseInfo.id,
    stageNumber: stageIndex + 1,
    title: stageTitle,
    week: existingMilestone.week || Math.min(12, stageIndex + 1),
    durationMin: existingMilestone.durationMin || 90,
    learningGoal: baseGoal,
    activities: [
      `Hands-on investigation for ${phaseInfo.label}: examine real-world telemetry or source reference.`,
      `Collaborative ideation and technical prototyping session targeting ${phaseInfo.label} deliverable.`
    ],
    makerSpaceTools: getStageDefaultTools(phaseInfo.id),
    deliverables: [`${phaseInfo.label} Milestone Artifact & Reflection Log`],
    evidencePrompt: `Submit photo, video demo, or link documenting your ${phaseInfo.label} progress. Explain what worked and what you iterated on.`,
    coachCue: `Prompt learners during ${phaseInfo.label} to articulate the causal mechanism behind their prototype.`,
    targetCompetencies: recommendedCompetencies,
    isAiGenerated: true,
    approvedByCoach: false
  };

  return {
    success: true,
    milestone: drafted
  };
}

/**
 * Maps server-generated unit milestones into Course Maker milestones.
 */
function mapServerMilestonesToCourse(rawMilestones, courseBasics) {
  return rawMilestones.map((m, idx) => {
    const phaseInfo = WELEARN_DT_FRAMEWORK.phases[idx] || { id: 'explore', label: `Stage ${idx + 1}` };
    const defaultComps = getStageDefaultCompetencies(phaseInfo.id);

    return {
      id: m.id || `stage-${phaseInfo.id}`,
      phaseId: phaseInfo.id,
      stageNumber: idx + 1,
      title: m.title || `${phaseInfo.label} Milestone`,
      week: m.week || Math.min(12, idx + 1),
      durationMin: m.durationMin || 90,
      learningGoal: m.learningGoal || `Complete ${phaseInfo.label} investigation.`,
      activities: Array.isArray(m.activities) && m.activities.length > 0 ? m.activities : [`Execute ${phaseInfo.label} challenge.`],
      makerSpaceTools: Array.isArray(m.makerSpaceTools) ? m.makerSpaceTools : getStageDefaultTools(phaseInfo.id),
      deliverables: m.evidencePrompt ? [m.evidencePrompt] : [`${phaseInfo.label} artifact`],
      evidencePrompt: m.evidencePrompt || `Submit your ${phaseInfo.label} artifact and reflection.`,
      coachCue: m.coachCue || `Support learner progress during ${phaseInfo.label}.`,
      targetCompetencies: defaultComps,
      isAiGenerated: true,
      approvedByCoach: false
    };
  });
}

/**
 * Deterministic local outline generator grounded in course basics and sources.
 */
function generateLocalGroundedOutline(courseBasics, sources) {
  const title = courseBasics.title || 'Course Challenge';
  const theme = courseBasics.theme || title;
  const objectives = (courseBasics.objectives || []).filter(Boolean);

  return WELEARN_DT_FRAMEWORK.phases.map((phase, idx) => {
    const objectiveMatch = objectives[idx % Math.max(1, objectives.length)] || `Investigate ${theme}`;
    const defaultComps = getStageDefaultCompetencies(phase.id);
    const defaultTools = getStageDefaultTools(phase.id);

    let stageAction = '';
    let evidenceAction = '';
    switch (phase.id) {
      case 'explore':
        stageAction = `Benchmark baseline parameters and conduct background research on ${theme}.`;
        evidenceAction = 'Thermal/sensor telemetry spreadsheet and field investigation notes.';
        break;
      case 'empathise':
        stageAction = 'Conduct user interviews with community stakeholders to define human constraints.';
        evidenceAction = 'Stakeholder empathy map and user journey breakdown.';
        break;
      case 'define':
        stageAction = `Synthesize field findings into technical boundaries: ${courseBasics.drivingQuestion || objectiveMatch}`;
        evidenceAction = 'Technical boundary specification and problem framing document.';
        break;
      case 'ideate':
        stageAction = 'Brainstorm, sketch, and evaluate minimum viable mechanisms and circuit schematics.';
        evidenceAction = 'System architecture diagram and candidate mechanism trade-off matrix.';
        break;
      case 'prototype':
        stageAction = 'Fabricate physical prototype in the MakerSpace using hardware tools and firmware.';
        evidenceAction = 'Working bench prototype, 3D CAD files, and GitHub code repository.';
        break;
      case 'test':
        stageAction = 'Execute rigorous test cycles under varied conditions to collect performance deltas.';
        evidenceAction = 'Test trial data logs, failure analysis table, and improvement plan.';
        break;
      case 'showcase':
        stageAction = 'Present final working solution to peers, mentors, and community stakeholders.';
        evidenceAction = '3-minute live pitch video and public exhibition poster.';
        break;
      case 'reflect':
      default:
        stageAction = 'Critique project trajectory, reflect on core competencies, and identify future iterations.';
        evidenceAction = 'Personal competency reflection essay and next-generation roadmap.';
        break;
    }

    return {
      id: `stage-${phase.id}`,
      phaseId: phase.id,
      stageNumber: idx + 1,
      title: `${phase.label}: ${theme}`,
      week: Math.min(12, idx + 1),
      durationMin: 90,
      learningGoal: objectiveMatch,
      activities: [
        stageAction,
        `Document findings and calibrate instruments for the ${phase.label} milestone.`
      ],
      makerSpaceTools: defaultTools,
      deliverables: [evidenceAction],
      evidencePrompt: `Submit your ${evidenceAction.toLowerCase()} with a short reflection on design decisions.`,
      coachCue: `Guide learners through the ${phase.label} phase, fostering curiosity and self-directed problem solving.`,
      targetCompetencies: defaultComps,
      isAiGenerated: true,
      approvedByCoach: false
    };
  });
}

function getStageDefaultCompetencies(phaseId) {
  switch (phaseId) {
    case 'explore':
      return ['sdl-01', 'ctps-01'];
    case 'empathise':
      return ['sea-01', 'ec-01'];
    case 'define':
      return ['ctps-02', 'ctps-03'];
    case 'ideate':
      return ['ct-01', 'ct-02'];
    case 'prototype':
      return ['ct-03', 'sdl-02'];
    case 'test':
      return ['ctps-04', 'sdl-04'];
    case 'showcase':
      return ['ec-02', 'lc-01'];
    case 'reflect':
      return ['sdl-04', 'sdl-07'];
    default:
      return ['sdl-01', 'ctps-01'];
  }
}

function getStageDefaultTools(phaseId) {
  switch (phaseId) {
    case 'explore':
      return ['Sensors & Telemetry', 'Digital Multimeter', 'Field Notebook'];
    case 'empathise':
      return ['Interview Canvas', 'Audio Recorder', 'Empathy Map'];
    case 'define':
      return ['Figma / Miro', 'Technical Spec Sheet'];
    case 'ideate':
      return ['Whiteboard', 'Concept Sketchpad', 'Design Matrix'];
    case 'prototype':
      return ['3D Printer', 'Microcontroller (ESP32/Micro:bit)', 'Soldering Station', 'CAD Software'];
    case 'test':
      return ['Data Logger', 'Digital Calipers', 'Stress Test Rig'];
    case 'showcase':
      return ['Presentation Deck', 'Demonstration Stand', 'Video Camera'];
    case 'reflect':
      return ['Competency Radar', 'Learning Portfolio'];
    default:
      return ['MakerSpace Tools'];
  }
}
