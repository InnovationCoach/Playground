import { hrefFor } from '../../app/routes.js';

const textOf = (value) => typeof value === 'string' ? value.trim()
  : value && typeof value === 'object' ? textOf(value.prompt || value.text || value.title) : '';
export const nextGoalStep = (goal) => goal.done ? null : goal.steps.find((step) => !step.done && step.text?.trim()) || null;

/** Suggest from existing records, never manufacture deadlines or completion. */
export function startHere({ data, today, checked, goalsLoaded, hasGoals, termProject = null }) {
  if (!goalsLoaded) return { loading: true, title: 'Finding your next step…', body: 'Loading your saved learning plan.' };
  const task = today.find((item) => item.kind === 'step' && !checked.has(item.id));
  if (task) return { title: task.text, body: `A step towards your goal: ${task.goal}`, href: hrefFor.goals(), action: 'Open my goal', source: 'Your goal', item: task };
  const recheck = data.courses.find((item) => item.needsRecheck);
  if (recheck) return { title: 'Re-check your completed sessions', body: `${recheck.program.title}’s session numbers were corrected. Confirm which sessions you’ve finished.`, href: hrefFor.program(recheck.program.id, 'plan'), action: 'Open project', source: 'Your current project' };
  const course = data.courses.find((item) => !item.progressUnavailable && item.summary?.next);
  if (course) return { title: course.summary.next.title, body: course.program.title, href: hrefFor.program(course.program.id, 'plan'), action: 'Continue project', source: 'Your current project' };
  const personal = today.find((item) => !checked.has(item.id));
  if (personal) return { title: personal.text, body: 'A small thing you chose to do today.', href: hrefFor.goals(), action: 'Open my plan', source: 'Your plan', item: personal };
  if (data.state === 'loading') return { loading: true, title: 'Finding your next project step…', body: 'Your personal checklist has no remaining items. Loading your project records.' };
  if (data.state === 'error' || data.warnings.length || data.courses.some((item) => item.progressUnavailable)) return { title: 'Check your current learning', body: 'Some project records are unavailable. Open your courses to check the next step.', href: hrefFor.courses(), action: 'Open My Courses', source: 'Course records unavailable' };
  const unstarted = data.courses.find((item) => !item.summary);
  if (unstarted) return { title: `Start ${unstarted.program.title}`, body: 'Open your assigned project to choose your first step.', href: hrefFor.program(unstarted.program.id, 'plan'), action: 'Open project', source: 'Your current project' };
  const term = termStep(termProject);
  if (term) return term;
  if (!hasGoals) return { title: 'Choose something to work towards', body: 'It only takes a minute: answer a few short questions and pick one small first step.', href: hrefFor.goals(), action: 'Set my first goal', source: 'Your plan' };
  return { title: 'Look back at what you’ve made', body: 'Your checklist has no remaining items. Review your evidence or plan another step.', href: hrefFor.pbl('portfolio'), action: 'Open my portfolio', source: 'A moment to reflect' };
}

/**
 * Live status beside a section in the menu: only a running focus timer or sounds,
 * so a learner can see them from other sections. Counts belong in My Progress,
 * where their meaning is explained.
 */
export function dockStats({ focus = null, playing = false }) {
  const stats = {};
  if (focus) stats.creative = { text: focus, label: `focus timer ${focus} left` };
  else if (playing) stats.creative = { text: '♪', label: 'focus sounds playing' };
  return stats;
}

/** The term project's next step, only for a learner who has started one in PBL Studio. */
export function termStep(project) {
  if (!project?.updatedAt) return null;
  if ((project.problem?.hmw || '').trim().length < 15) return { title: 'Write your How-might-we problem', body: 'Choose a problem inside the theme that affects people or the environment.', href: hrefFor.pbl('project'), action: 'Open my term project', source: 'Your term project' };
  if ((project.evidence || []).length < 3) return { title: 'Add a piece of evidence', body: 'A note, a link, a test result or an AI log all count.', href: hrefFor.pbl('portfolio'), action: 'Open my portfolio', source: 'Your term project' };
  return null;
}

/** Course-specific stages only; never substitute the generic term checklist. */
export function programJourney({ program, summary, enrolment, progressUnavailable, needsRecheck }) {
  const phases = program.phases || [];
  if (needsRecheck) return { recheck: true, unavailable: true, stages: [], current: null, task: '', evidence: '' };
  if (progressUnavailable) return { unavailable: true, stages: [], current: null, task: '', evidence: '' };
  const next = summary?.next;
  const current = summary?.pct === 100 ? null : phases.find((phase) => (phase.id || phase.phaseId) === next?.phaseId)
    || phases.find((phase) => next && (phase.sessions || []).some((session) => session.sessionNumber === next.sessionNumber))
    || phases.find((phase) => (phase.id || phase.phaseId) === enrolment?.currentPhaseId)
    || null;
  const currentId = current?.id || current?.phaseId;
  return {
    unavailable: false, current,
    stages: phases.map((phase) => {
      const id = phase.id || phase.phaseId;
      return { id, title: phase.title, state: summary?.byPhase?.[id]?.complete ? 'done' : id === currentId ? 'current' : 'planned' };
    }),
    task: (next?.activities || []).map(textOf).find(Boolean) || textOf(next?.title),
    evidence: textOf(next?.evidenceToCollect) || (current?.evidence || current?.deliverables || []).map(textOf).find(Boolean) || ''
  };
}
