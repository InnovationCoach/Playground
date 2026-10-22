/**
 * SPARK Home, configured per role. Each card is a door into a screen that
 * already exists; SPARK adds links, never permissions. App.jsx still decides
 * which screen a role may open, and the API and Firestore rules decide what
 * data comes back.
 *
 * status:
 *   live    - opens a working screen
 *   partial - opens a working screen that covers part of what the card says;
 *             the card's own text says which part
 *   soon    - not built: shown, not clickable, no route
 *
 * Making a card live later is one line: give it a route and status 'live'
 * (for example when Gemini publishes the AI Course Studio route).
 *
 * Card text lives in messages.js as spark.card.<id>.t / .d / .cta, so it is
 * translated with the rest of the interface. `ctx` names a context reader in
 * sparkContext.js that may add one short line from data the app already has.
 */
import { hrefFor } from '../../app/routes.js';

export const STATUSES = ['live', 'partial', 'soon'];
export const TONES = ['lime', 'purple', 'navy', 'magenta'];

const card = (id, icon, tone, status, route = null, ctx = null) => ({ id, icon, tone, status, route, ctx });

export const SPARK_ROLES = {
  student: {
    tone: 'lime',
    cards: [
      card('student.path', 'BookOpen', 'lime', 'live', hrefFor.courses()),
      card('student.projects', 'Rocket', 'purple', 'live', hrefFor.pbl('project'), 'project'),
      card('student.portfolio', 'FolderOpen', 'purple', 'live', hrefFor.pbl('portfolio'), 'evidence'),
      card('student.mastery', 'Award', 'magenta', 'partial', hrefFor.pbl('competencies')),
      card('student.resources', 'Compass', 'navy', 'live', hrefFor.pbl('explore'), 'activities'),
      card('student.goals', 'Target', 'lime', 'live', hrefFor.goals(), 'goalsToday'),
      card('student.dashboard', 'LayoutDashboard', 'purple', 'live', hrefFor.dashboard()),
      card('student.futureSkills', 'Sparkles', 'magenta', 'live', hrefFor.futureSkills())
    ]
  },
  teacher: {
    tone: 'purple',
    cards: [
      card('teacher.learners', 'Users', 'purple', 'live', hrefFor.coach()),
      card('teacher.projects', 'Rocket', 'lime', 'live', hrefFor.pbl('programs')),
      card('teacher.resources', 'BookOpen', 'navy', 'live', hrefFor.resources()),
      card('teacher.portfolio', 'FolderOpen', 'purple', 'partial', hrefFor.coach()),
      card('teacher.assessment', 'ClipboardCheck', 'magenta', 'soon'),
      card('teacher.reports', 'FileText', 'navy', 'soon'),
      card('teacher.community', 'Heart', 'magenta', 'live', hrefFor.community())
    ]
  },
  parent: {
    tone: 'navy',
    perChild: true,
    cards: [
      card('parent.overview', 'LayoutDashboard', 'navy', 'live', (uid) => hrefFor.parentChild(uid), 'childActive'),
      card('parent.projects', 'Rocket', 'purple', 'live', (uid) => hrefFor.parentChild(uid, 'pbl'), 'childPhase'),
      card('parent.portfolio', 'FolderOpen', 'purple', 'partial', (uid) => hrefFor.parentChild(uid, 'pbl'), 'childEvidence'),
      card('parent.competencies', 'Award', 'magenta', 'live', (uid) => hrefFor.parentChild(uid, 'competencies'), 'childCompetencies'),
      card('parent.reports', 'FileText', 'navy', 'soon'),
      card('parent.goals', 'Target', 'lime', 'live', (uid) => hrefFor.parentChild(uid, 'goals'), 'childGoals')
    ]
  },
  supervisor: {
    tone: 'magenta',
    cards: [
      card('supervisor.studio', 'WandSparkles', 'magenta', 'soon'),
      card('supervisor.library', 'Layers', 'purple', 'live', hrefFor.pbl('programs')),
      card('supervisor.projects', 'ClipboardCheck', 'navy', 'soon'),
      card('supervisor.competencies', 'Award', 'magenta', 'live', hrefFor.pbl('competencies')),
      card('supervisor.portfolio', 'FolderOpen', 'purple', 'soon'),
      card('supervisor.reports', 'FileText', 'navy', 'soon'),
      card('supervisor.people', 'Users', 'navy', 'live', hrefFor.list('students'), 'pendingAccounts')
    ]
  },
  admin: {
    tone: 'navy',
    cards: [
      card('admin.platform', 'Users', 'navy', 'live', hrefFor.list('students'), 'pendingAccounts'),
      card('admin.studio', 'Layers', 'purple', 'live', hrefFor.pbl('programs')),
      card('admin.projects', 'Rocket', 'lime', 'live', hrefFor.pbl('project')),
      card('admin.competencies', 'Award', 'magenta', 'live', hrefFor.pbl('competencies')),
      card('admin.portfolio', 'FolderOpen', 'purple', 'soon'),
      card('admin.reports', 'FileText', 'navy', 'soon'),
      card('admin.insights', 'ChartLine', 'lime', 'soon'),
      card('admin.operations', 'Settings', 'navy', 'live', hrefFor.billing())
    ]
  }
};

/** The SPARK role key for an app role ('coach' is the legacy name for teacher). */
export function sparkRoleFor(role) {
  if (role === 'coach') return 'teacher';
  return SPARK_ROLES[role] ? role : null;
}

/** Resolve a card's route. Parent cards need a linked child's uid; without one they have no route. */
export function cardHref(c, childUid = null) {
  if (c.status === 'soon' || !c.route) return null;
  if (typeof c.route === 'function') return childUid ? c.route(childUid) : null;
  return c.route;
}

export const cardsFor = (role) => SPARK_ROLES[sparkRoleFor(role)]?.cards || [];

/* ------------------------------------------------- recently opened (per device) */

export const RECENT_LIMIT = 4;
export const recentKey = (uid) => `hearisland.spark.recent.v1:${uid}`;

/** Newest first, no duplicates, at most RECENT_LIMIT. Pure, so it is unit-tested. */
export function pushRecent(list, entry, now = Date.now()) {
  const clean = Array.isArray(list) ? list.filter((r) => r && typeof r.id === 'string' && typeof r.href === 'string') : [];
  return [{ ...entry, at: now }, ...clean.filter((r) => r.id !== entry.id || r.href !== entry.href)].slice(0, RECENT_LIMIT);
}
