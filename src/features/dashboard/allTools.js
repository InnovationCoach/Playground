import { hrefFor } from '../../app/routes.js';
import { menuFor } from '../shell/Sidebar.jsx';

/**
 * The All tools panel on My Dashboard. Tools come from the sidebar's own student
 * menu, so both open the same routes and neither can list something the other
 * doesn't. Only the grouping and plain explanations live here.
 */
const GROUPS = [
  { id: 'learning', label: 'Learning', keys: ['courses', 'programs', 'pbl', 'homeSearch'] },
  { id: 'skills', label: 'Goals and skills', keys: ['goals', 'competencies', 'futureSkills'] },
  { id: 'creating', label: 'Creating', keys: ['canva', 'space', 'journey'] },
  { id: 'more', label: 'People and settings', keys: ['community', 'spark', 'settings'] }
];

const ABOUT = {
  courses: 'See the courses you’ve joined or added.',
  programs: 'Projects and programs your coach has set up.',
  pbl: 'Work on a big project, step by step.',
  homeSearch: 'Search every quest and course.',
  goals: 'Set a goal and choose small steps.',
  competencies: 'See the skills you’re building and the work that shows them.',
  futureSkills: 'Learn which skills matter most, and how to practise them.',
  canva: 'Design posters, slides and more in Canva.',
  space: 'Your own page, with your cover and profile pictures.',
  journey: 'Collect your work into a portfolio you can share.',
  community: 'See what other students are posting.',
  spark: 'Go to the SPARK home page.',
  settings: 'Change your password, language and light or dark look.'
};

/** The sidebar opens these two with click handlers; these are the routes those handlers go to. */
const ROUTES = { courses: hrefFor.courses(), goals: hrefFor.goals() };

export function toolGroups() {
  const items = new Map(menuFor('student').flatMap((group) => group.items).map((item) => [item.key, item]));
  return GROUPS.map(({ keys, ...group }) => ({
    ...group,
    tools: keys.map((key) => ({ key, icon: items.get(key).icon, label: items.get(key).label, about: ABOUT[key], href: items.get(key).href || ROUTES[key] }))
  }));
}
