import { hrefFor } from '../../app/routes.js';
import { gaugeReading } from './instrumentModel.js';

/**
 * My Quests: goal (long vision) -> tasks (checklist) -> one quest per task.
 * Pure helpers over the goal plan and the learner's real course records.
 */
export const QUEST_LABELS = { course: 'Course quest', activity: 'STEM activity', project: 'Term project', own: 'My own challenge' };
export const TERM_PROJECT_QUEST = { kind: 'project', ref: '', title: 'My PBL Studio term project' };

/** Every quest a task can take on today, grouped for a <select>. Values are `kind:ref`. */
export function questOptions({ courses = [], activities = [] }) {
  return [
    { group: 'My courses & projects', items: courses.map(({ program }) => ({ value: `course:${program.id}`, quest: { kind: 'course', ref: program.id, title: program.title } })) },
    { group: 'STEM activities', items: activities.map((item) => ({ value: `activity:${item.id}`, quest: { kind: 'activity', ref: item.id, title: item.label } })) },
    { group: 'PBL Studio', items: [{ value: 'project:', quest: TERM_PROJECT_QUEST }] }
  ].filter((group) => group.items.length);
}
export const questValue = (quest) => (quest ? `${quest.kind}:${quest.ref || ''}` : '');

/** Where a quest opens: a hash link, an activity id, or nothing for an own challenge. */
export function questTarget(quest) {
  if (!quest) return null;
  if (quest.kind === 'course') return { href: hrefFor.program(quest.ref, 'plan') };
  if (quest.kind === 'project') return { href: hrefFor.pbl('project') };
  if (quest.kind === 'activity') return { activity: quest.ref };
  return null;
}

/** Recorded status only, from the course record the quest points at; never invented. */
export function questStatus(quest, courses = []) {
  if (quest?.kind !== 'course') return null;
  const course = courses.find((item) => item.program.id === quest.ref);
  if (!course) return 'Not in your current courses';
  if (course.needsRecheck) return 'Re-check your sessions';
  if (course.progressUnavailable) return 'Progress unavailable';
  if (!course.summary) return 'Not started';
  return gaugeReading(course.summary.done, course.summary.total) ? `${course.summary.done} of ${course.summary.total} sessions marked complete` : 'No sessions listed yet';
}

/** Tasks checked across goals, plus how many tasks already have a quest. */
export function questTally(goals = []) {
  const steps = goals.flatMap((goal) => goal.steps || []);
  return { done: steps.filter((s) => s.done).length, total: steps.length, withQuest: steps.filter((s) => s.quest).length };
}
