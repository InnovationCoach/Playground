/**
 * Course Maker Import Parser
 * Parses supported external file formats and extracts course data into the
 * standard course schema.
 *
 * Supported formats:
 * - JSON: WeLearn PBL Program, PblUnit, or generic course outline
 * - Markdown: Syllabus with hierarchical # / ## headers and bulleted lists
 * - CSV: Structured table with columns for stages, goals, activities, and evidence
 * - Text: Plain structured syllabus
 *
 * Unsupported or corrupt files are cleanly detected and flagged.
 */

import { WELEARN_DT_FRAMEWORK } from '../../pbl/programs/libraryProgramsData.js';
import { competencyById, COMPETENCIES } from '../../pbl/content/competencies.js';

export const SUPPORTED_IMPORT_FORMATS = [
  { ext: '.json', mime: 'application/json', label: 'WeLearn JSON or Course JSON (.json)' },
  { ext: '.md', mime: 'text/markdown', label: 'Markdown Syllabus (.md)' },
  { ext: '.csv', mime: 'text/csv', label: 'Curriculum Table (.csv)' },
  { ext: '.txt', mime: 'text/plain', label: 'Plain Text Syllabus (.txt)' }
];

export const SUPPORTED_EXTENSIONS = ['.json', '.md', '.csv', '.txt'];

/**
 * Checks whether a filename or mime type is supported.
 */
export function isSupportedFormat(fileName = '', mimeType = '') {
  const lower = fileName.toLowerCase();
  const hasExt = SUPPORTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
  if (hasExt) return true;
  if (mimeType.includes('json') || mimeType.includes('markdown') || mimeType.includes('csv') || mimeType.includes('text/plain')) {
    return true;
  }
  return false;
}

/**
 * Parses raw text content according to the detected or specified format.
 * Returns { success: true, course: {...}, format: '...', warnings: [] }
 * or { success: false, error: '...', format: '...' }
 */
export function parseCourseContent(content, fileName = '') {
  if (typeof content !== 'string') {
    return {
      success: false,
      error: 'Content must be text. Binary files (PDF, images, archives) are unsupported.',
      code: 'UNSUPPORTED_BINARY'
    };
  }

  const trimmed = content.trim();
  if (trimmed.length === 0) {
    return {
      success: false,
      error: 'The imported file is empty.',
      code: 'EMPTY_FILE'
    };
  }

  // Detect format
  const lowerName = fileName.toLowerCase();
  const isJson = lowerName.endsWith('.json') || (trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'));
  const isCsv = lowerName.endsWith('.csv') || (trimmed.includes(',') && trimmed.includes('\n') && /stage|title|lesson|activity|goal/i.test(trimmed.split('\n')[0]));
  const isMarkdown = lowerName.endsWith('.md') || trimmed.startsWith('# ') || trimmed.includes('\n## ');

  try {
    if (isJson) {
      return parseJsonCourse(trimmed);
    }
    if (isCsv) {
      return parseCsvCourse(trimmed);
    }
    if (isMarkdown) {
      return parseMarkdownCourse(trimmed);
    }
    return parsePlainTextCourse(trimmed);
  } catch (err) {
    return {
      success: false,
      error: `Failed to parse imported material: ${err.message}`,
      code: 'PARSE_ERROR'
    };
  }
}

/**
 * Parses JSON course format (PblUnit, Library Program, or generic).
 */
function parseJsonCourse(jsonStr) {
  let data;
  try {
    data = JSON.parse(jsonStr);
  } catch (e) {
    return {
      success: false,
      error: 'Invalid JSON format: check for syntax errors or mismatched brackets.',
      code: 'INVALID_JSON'
    };
  }

  const warnings = [];

  // Shape 1: PBL Program (e.g., from LIBRARY_PROGRAMS)
  if (data.phases || data.drivingQuestion || data.frameworkId) {
    const milestones = (data.phases || []).map((p, idx) => {
      const session = p.sessions?.[0] || {};
      return {
        id: p.id || `phase-${idx + 1}`,
        phaseId: p.phaseId || p.id || WELEARN_DT_FRAMEWORK.phases[idx]?.id || 'explore',
        title: p.title || session.title || `Phase ${idx + 1}`,
        learningGoal: p.goal || p.learningGoal || session.learningGoal || '',
        activities: p.tasks || session.activities || [],
        makerSpaceTools: p.tools || session.makerSpaceTools || [],
        deliverables: p.deliverables || p.evidence || [],
        evidencePrompt: (p.evidence && p.evidence[0]) || session.evidenceToCollect?.prompt || '',
        coachCue: p.coachCue || session.teacherTips || '',
        targetCompetencies: (p.competencies || session.evidenceToCollect?.targetCompetencies || []).filter((id) => competencyById(id)),
        approvedByCoach: true
      };
    });

    // Extract all competencies used
    const allCompetencies = new Set();
    milestones.forEach((m) => m.targetCompetencies.forEach((c) => allCompetencies.add(c)));

    return {
      success: true,
      format: 'WeLearn PBL Program (JSON)',
      course: {
        title: data.title || 'Imported PBL Program',
        theme: data.theme || '',
        drivingQuestion: data.drivingQuestion || '',
        cohort: data.ageBand === '6-11' ? 'primary' : data.ageBand === '14-18' ? 'higher-secondary' : 'lower-secondary',
        ageBand: data.ageBand || '11-13',
        durationWeeks: data.durationWeeks || 12,
        objectives: data.phases?.map((p) => p.goal || p.learningGoal).filter(Boolean) || [data.drivingQuestion || ''],
        competencies: Array.from(allCompetencies),
        milestones,
        makerSpaceSpecs: data.makerSpaceSpecs || []
      },
      warnings
    };
  }

  // Shape 2: PblUnit (from synthesizer / studio)
  if (data.unitTitle || data.milestones) {
    const milestones = (data.milestones || []).map((m, idx) => ({
      id: m.id || `ms-${idx + 1}`,
      phaseId: m.phaseId || WELEARN_DT_FRAMEWORK.phases[idx]?.id || 'explore',
      stageNumber: m.stageNumber || idx + 1,
      title: m.title || `Stage ${idx + 1}`,
      week: m.week || Math.min(12, idx + 1),
      durationMin: m.durationMin || 90,
      learningGoal: m.learningGoal || '',
      activities: m.activities || [],
      makerSpaceTools: m.makerSpaceTools || [],
      evidencePrompt: m.evidencePrompt || '',
      deliverables: m.evidencePrompt ? [m.evidencePrompt] : [],
      coachCue: m.coachCue || '',
      targetCompetencies: (m.targetCompetencies || []).filter((id) => competencyById(id)),
      approvedByCoach: Boolean(m.approvedByCoach)
    }));

    const allCompetencies = new Set();
    milestones.forEach((m) => m.targetCompetencies.forEach((c) => allCompetencies.add(c)));
    if (allCompetencies.size === 0) {
      allCompetencies.add('sdl-01');
      allCompetencies.add('ctps-01');
    }

    return {
      success: true,
      format: 'WeLearn PblUnit (JSON)',
      course: {
        title: data.unitTitle || 'Imported Course Unit',
        theme: data.theme || '',
        drivingQuestion: data.drivingQuestion || '',
        cohort: 'lower-secondary',
        ageBand: '11-13',
        durationWeeks: 12,
        objectives: milestones.map((m) => m.learningGoal).filter(Boolean),
        competencies: Array.from(allCompetencies),
        milestones,
        makerSpaceSpecs: data.makerSpaceSpecs || []
      },
      warnings
    };
  }

  // Shape 3: Generic Course JSON
  const modules = data.modules || data.lessons || data.stages || [];
  const milestones = modules.map((mod, idx) => {
    const phaseId = WELEARN_DT_FRAMEWORK.phases[idx % 8]?.id || 'explore';
    return {
      id: `mod-${idx + 1}`,
      phaseId,
      stageNumber: idx + 1,
      title: mod.title || mod.name || `Lesson ${idx + 1}`,
      learningGoal: mod.goal || mod.objective || mod.description || '',
      activities: Array.isArray(mod.activities) ? mod.activities : (mod.activity ? [mod.activity] : []),
      makerSpaceTools: Array.isArray(mod.tools) ? mod.tools : [],
      deliverables: Array.isArray(mod.deliverables) ? mod.deliverables : (mod.evidence ? [mod.evidence] : []),
      evidencePrompt: mod.evidence || (Array.isArray(mod.deliverables) ? mod.deliverables[0] : ''),
      coachCue: mod.coachCue || mod.teacherTips || '',
      targetCompetencies: ['sdl-01'],
      approvedByCoach: false
    };
  });

  return {
    success: true,
    format: 'Standard Course Outline (JSON)',
    course: {
      title: data.title || data.courseName || 'Imported Course',
      theme: data.theme || data.subject || '',
      drivingQuestion: data.drivingQuestion || data.overview || '',
      cohort: 'lower-secondary',
      ageBand: '11-13',
      durationWeeks: data.durationWeeks || Math.max(1, modules.length),
      objectives: data.objectives || [data.overview || 'Master foundational course competencies.'],
      competencies: ['sdl-01', 'ctps-01'],
      milestones: milestones.length > 0 ? milestones : defaultEightStages(),
      makerSpaceSpecs: []
    },
    warnings
  };
}

/**
 * Parses Markdown syllabus format.
 */
function parseMarkdownCourse(md) {
  const lines = md.split('\n');
  let title = 'Imported Course';
  let drivingQuestion = '';
  const objectives = [];
  const milestones = [];
  let currentMilestone = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('# ') && title === 'Imported Course') {
      title = line.replace(/^#\s+/, '').trim();
    } else if (line.startsWith('## ')) {
      if (currentMilestone) {
        milestones.push(currentMilestone);
      }
      const stageIdx = milestones.length % 8;
      const stageInfo = WELEARN_DT_FRAMEWORK.phases[stageIdx];
      currentMilestone = {
        id: `ms-${milestones.length + 1}`,
        phaseId: stageInfo.id,
        stageNumber: stageIdx + 1,
        title: line.replace(/^##\s+/, '').trim(),
        learningGoal: '',
        activities: [],
        makerSpaceTools: [],
        deliverables: [],
        evidencePrompt: '',
        coachCue: '',
        targetCompetencies: ['sdl-01', 'ctps-01'],
        approvedByCoach: false
      };
    } else if (line.startsWith('### ') && currentMilestone) {
      currentMilestone.title += ` — ${line.replace(/^###\s+/, '').trim()}`;
    } else if (/^[-*]\s+(goal|objective):/i.test(line)) {
      const goal = line.replace(/^[-*]\s+(goal|objective):\s*/i, '').trim();
      if (currentMilestone) currentMilestone.learningGoal = goal;
      objectives.push(goal);
    } else if (/^[-*]\s+(activity|task):/i.test(line)) {
      const act = line.replace(/^[-*]\s+(activity|task):\s*/i, '').trim();
      if (currentMilestone) currentMilestone.activities.push(act);
    } else if (/^[-*]\s+(evidence|deliverable):/i.test(line)) {
      const ev = line.replace(/^[-*]\s+(evidence|deliverable):\s*/i, '').trim();
      if (currentMilestone) {
        currentMilestone.evidencePrompt = ev;
        currentMilestone.deliverables.push(ev);
      }
    } else if (/^[-*]\s+(tool|tools|materials):/i.test(line)) {
      const tool = line.replace(/^[-*]\s+(tool|tools|materials):\s*/i, '').trim();
      if (currentMilestone) currentMilestone.makerSpaceTools.push(tool);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      const text = line.replace(/^[-*]\s+/, '').trim();
      if (currentMilestone) {
        currentMilestone.activities.push(text);
      } else if (text.length > 10) {
        objectives.push(text);
      }
    } else if (/^driving\s*question:/i.test(line)) {
      drivingQuestion = line.replace(/^driving\s*question:\s*/i, '').trim();
    }
  }

  if (currentMilestone) {
    milestones.push(currentMilestone);
  }

  return {
    success: true,
    format: 'Markdown Syllabus (.md)',
    course: {
      title,
      theme: '',
      drivingQuestion: drivingQuestion || (objectives[0] ? `How might we explore ${objectives[0]}?` : ''),
      cohort: 'lower-secondary',
      ageBand: '11-13',
      durationWeeks: Math.max(8, milestones.length),
      objectives: objectives.length > 0 ? objectives : ['Explore key course concepts and build evidence.'],
      competencies: ['sdl-01', 'ctps-01'],
      milestones: milestones.length > 0 ? milestones : defaultEightStages(),
      makerSpaceSpecs: []
    },
    warnings: []
  };
}

/**
 * Parses CSV course format.
 */
function parseCsvCourse(csv) {
  const lines = csv.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) {
    return {
      success: false,
      error: 'CSV must contain a header row and at least one data row.',
      code: 'CSV_TOO_SHORT'
    };
  }

  const header = lines[0].split(',').map((h) => h.replace(/^["']|["']$/g, '').trim().toLowerCase());
  const milestones = [];

  for (let i = 1; i < lines.length; i++) {
    // Simple CSV row parser handling quotes
    const row = parseCsvRow(lines[i]);
    const rowObj = {};
    header.forEach((key, kIdx) => {
      rowObj[key] = row[kIdx] || '';
    });

    const stageIdx = (i - 1) % 8;
    const stageInfo = WELEARN_DT_FRAMEWORK.phases[stageIdx];

    const title = rowObj.title || rowObj.lesson || rowObj.stage || `Stage ${i}`;
    const goal = rowObj.goal || rowObj.objective || rowObj['learning goal'] || '';
    const activities = (rowObj.activities || rowObj.tasks || '').split(';').map((s) => s.trim()).filter(Boolean);
    const evidence = rowObj.evidence || rowObj.deliverables || '';
    const tools = (rowObj.tools || rowObj.materials || '').split(';').map((s) => s.trim()).filter(Boolean);
    const cue = rowObj.coachcue || rowObj['coach cue'] || '';

    milestones.push({
      id: `ms-${i}`,
      phaseId: stageInfo.id,
      stageNumber: stageIdx + 1,
      title,
      learningGoal: goal,
      activities: activities.length > 0 ? activities : [title],
      makerSpaceTools: tools,
      deliverables: evidence ? [evidence] : [],
      evidencePrompt: evidence,
      coachCue: cue,
      targetCompetencies: ['sdl-01', 'ctps-01'],
      approvedByCoach: false
    });
  }

  return {
    success: true,
    format: 'CSV Curriculum Table (.csv)',
    course: {
      title: 'Imported CSV Course',
      theme: '',
      drivingQuestion: '',
      cohort: 'lower-secondary',
      ageBand: '11-13',
      durationWeeks: Math.max(8, milestones.length),
      objectives: milestones.map((m) => m.learningGoal).filter(Boolean),
      competencies: ['sdl-01', 'ctps-01'],
      milestones,
      makerSpaceSpecs: []
    },
    warnings: []
  };
}

/**
 * Fallback parser for plain text.
 */
function parsePlainTextCourse(text) {
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const title = paragraphs[0]?.split('\n')[0]?.slice(0, 100) || 'Imported Text Course';
  const objectives = paragraphs.slice(0, 3).map((p) => p.replace(/\n+/g, ' ').slice(0, 160));

  return {
    success: true,
    format: 'Plain Text Syllabus (.txt)',
    course: {
      title,
      theme: '',
      drivingQuestion: objectives[0] ? `How might we investigate: ${objectives[0]}?` : '',
      cohort: 'lower-secondary',
      ageBand: '11-13',
      durationWeeks: 12,
      objectives,
      competencies: ['sdl-01', 'ctps-01'],
      milestones: defaultEightStages(),
      makerSpaceSpecs: []
    },
    warnings: ['Imported from plain text: review and refine each stage in the outline editor.']
  };
}

function parseCsvRow(rowStr) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < rowStr.length; i++) {
    const c = rowStr[i];
    if (c === '"' || c === "'") {
      inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += c;
    }
  }
  result.push(current.trim());
  return result;
}

function defaultEightStages() {
  return WELEARN_DT_FRAMEWORK.phases.map((p, idx) => ({
    id: `stage-${p.id}`,
    phaseId: p.id,
    stageNumber: idx + 1,
    title: `${p.label} Stage`,
    week: Math.min(12, idx + 1),
    durationMin: 90,
    learningGoal: `Investigate and execute key tasks for the ${p.label} milestone.`,
    activities: [`Conduct research and practical work for ${p.label}.`],
    makerSpaceTools: [],
    deliverables: [`${p.label} reflection and artifact submission`],
    evidencePrompt: `Submit your ${p.label} documentation or prototype artifact.`,
    coachCue: `Guide learners to focus on ${p.label} questions.`,
    targetCompetencies: ['sdl-01', 'ctps-01'],
    approvedByCoach: false
  }));
}
