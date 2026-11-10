/**
 * What the lower-secondary pages show, derived only from existing records. Pure,
 * unit-tested in tests/lower-secondary-selector.test.js.
 *
 * The rule throughout: an unknown value is reported as unknown, never as zero.
 */
import { hrefFor } from '../../app/routes.js';
import { menuFor } from '../shell/Sidebar.jsx';

const SECTION_HREF = { dashboard: '#/dashboard', learning: '#/dashboard/learning', universe: '#/dashboard/universe', portfolio: '#/dashboard/portfolio' };
export const sectionHref = (section) => SECTION_HREF[section] || SECTION_HREF.dashboard;

/** Science, design and technology cards point at destinations that exist, never concept worlds. */
export const WORLDS = Object.freeze([
  { id: 'science', label: 'Science', destination: 'Thalassa', title: 'Wind energy estimate', description: 'Help Thalassa choose a power plan.', preview: true,
    arrival: { planetId: 'thalassa', missionId: 'thalassa-wind-survey', routeId: 'guided' }, action: 'Explore Thalassa' },
  { id: 'design', label: 'Design', destination: 'Project Hex-Grid', title: 'Floating city model', description: 'Test hypotheses in a floating-city model of Bangkok.', preview: false,
    activity: 'hexgrid', action: 'Open Hex-Grid' },
  { id: 'technology', label: 'Technology', destination: 'Micro:bit Coding', title: 'Program a micro:bit', description: 'Program a micro:bit in MicroPython.', preview: false,
    activity: 'coding', action: 'Open coding' }
]);

/** Everything the existing student menu offers except the screen the shell replaces. */
export function moreMenuItems({ isPrimary, onOpenCourses, onOpenGoals }) {
  if (isPrimary) return [
    { key: 'resources', label: 'nav.primaryResources', href: hrefFor.resources() },
    { key: 'settings', label: 'nav.settings', href: hrefFor.settings() }
  ];
  return menuFor('student', { onOpenCourses, onOpenGoals }).flatMap((group) => group.items).filter((item) => item.key !== 'dashboard');
}

/** The My progress card: 'off' and 'unknown' are not the same as level 1, 0 XP. */
export function progressView({ questEnabled, schoolLoading, schoolError, quest }) {
  if (schoolLoading) return { state: 'loading' };
  if (schoolError) return { state: 'unknown' };
  if (!questEnabled) return { state: 'off' };
  if (quest.loading && !quest.data) return { state: 'loading' };
  if (!quest.data) return { state: 'unknown' };
  const { level, badges, nextBadge } = quest.data;
  if (!level) return { state: 'unknown' };
  const earned = (badges || []).filter((badge) => badge.earned);
  return { state: 'ready', level, earned, nextBadge: nextBadge || null };
}

/** The next action on a course, or the reason no honest count can be shown. */
export function courseStatus(course) {
  if (course.needsRecheck) return { kind: 'recheck', label: 'Session numbers were corrected. Open the project to re-check which sessions you’ve finished.' };
  if (course.progressUnavailable) return { kind: 'unavailable', label: 'Progress could not be loaded right now.' };
  if (!course.summary) return { kind: 'unstarted', label: 'Not started yet' };
  const { done, total, pct } = course.summary;
  return { kind: 'counted', done, total, pct, label: `${done} of ${total} sessions marked complete` };
}

/** Only a real, unfinished course can be continued. */
export function continueCourse(courses = []) {
  const course = courses.find((item) => !item.progressUnavailable && !item.needsRecheck && item.summary?.next);
  if (!course) return null;
  return { id: course.program.id, title: course.program.title, next: course.summary.next.title, href: hrefFor.program(course.program.id, 'plan'), status: courseStatus(course) };
}

export const taskText = (value) => (typeof value === 'string' ? value : value?.text || value?.title || '');

/**
 * The dashboard hero: an active course first, then the server's quest for the
 * term project, then the same guidance as My Dashboard's "Start here". Both
 * destinations are exact: a course's plan opens at its next unfinished session,
 * and the term project opens at its current phase.
 */
export function heroAction({ courses, quest, progress, fallback }) {
  if (courses.state === 'loading' || progress.state === 'loading') return { loading: true, title: 'Finding your next step…', body: 'Loading your quests and projects.' };
  const course = continueCourse(courses.courses);
  if (course) return { kind: 'course', source: 'Continue your quest', title: course.title, body: `Next: ${course.next}`, href: course.href, action: 'Continue quest', step: course.status.label };
  const step = quest?.todaysQuest;
  if (step) return { kind: 'quest', source: 'Today’s quest', title: taskText(step.task), body: `${step.phaseTitle} · your term project`, href: hrefFor.pbl('project'), action: 'Continue quest', step: `${step.done} of ${step.total} steps done` };
  return { kind: 'guidance', ...fallback };
}

/** What the hero didn't have room for, so an active quest or goal step is never hidden. */
export function alsoToday({ hero, quest, fallback }) {
  if (hero.loading) return [];
  const rows = [];
  if (hero.kind === 'course' && quest?.todaysQuest) rows.push({ id: 'quest', label: 'Today’s quest', text: taskText(quest.todaysQuest.task), href: hrefFor.pbl('project') });
  if (hero.kind !== 'guidance' && fallback.href === hrefFor.goals() && !fallback.loading) rows.push({ id: 'goal', label: 'From your plan', text: fallback.title, href: fallback.href });
  return rows;
}

const AUDIENCE_SHORT ={ coaches: 'Coaches', classmates: 'Classmates', wider: 'Approved audience' };
export const audienceLabel = (audiences = []) => (audiences.length ? audiences.map((id) => AUDIENCE_SHORT[id] || id).join(', ') : 'Private');

/** A reflection always starts private: the audience controls live on the existing editor. */
export function reflectionItem(text, title = 'What I’m proud of') {
  return { title, kind: 'writing', body: text.trim(), link: '', media: null, audiences: [] };
}

/** First name for a greeting; no fallback to the email address. */
export const firstNameOf = (profile) => (profile?.displayName || '').trim().split(/\s+/)[0] || '';
