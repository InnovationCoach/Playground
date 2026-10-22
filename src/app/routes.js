/**
 * Hash routes for the Growth Hub screens. Pure, so it can be unit-tested.
 *
 *   #/admin/staff | #/admin/students | #/admin/parents   account lists
 *   #/admin/users/<uid>                                  one account
 *   #/admin/new/<kind>                                   create
 *   #/settings   #/courses   #/parent                    everyone else
 *   #/primary-resources  #/worksheet/<id>  #/guide/<id>  printable primary material
 *   #/pbl  #/pbl/<tab>                                   PBL Studio (term project)
 *   #/pbl/programs/<programId>/<section>                 one program in the PBL library
 *   #/community                                          community posts
 *   #/messages  #/messages/<convId>                      private messages
 *   #/goals                                              goal setting (secondary learners)
 *   #/future-skills                                      Future Skills: AI in education + the 7 skills
 *   #/search                                             Home: course search (secondary learners);
 *                                                        "My Dashboard" is the no-hash default.
 *                                                        (#/home is the live site's dashboard, so it is not reused.)
 *
 * Anything unrecognised returns null and the caller shows its default screen.
 * A route is a request to SEE a screen; whether the role may is decided by
 * App.jsx, and whether the data comes back is decided by the API.
 */
const KINDS = ['staff', 'students', 'parents'];

export function parseRoute(hash) {
  const parts = String(hash || '').replace(/^#\/?/, '').split('/').filter(Boolean).map((p) => {
    try { return decodeURIComponent(p); } catch { return p; }
  });
  const [head, a, b, c] = parts;
  if (head === 'admin') {
    if (KINDS.includes(a)) return { screen: 'admin', page: 'list', kind: a };
    if (a === 'billing') return { screen: 'admin', page: 'billing' };
    if (a === 'materials') return { screen: 'admin', page: 'materials' };
    if (a === 'users' && b) return { screen: 'admin', page: 'detail', uid: b };
    if (a === 'new' && KINDS.includes(b)) return { screen: 'admin', page: 'create', kind: b };
    return { screen: 'admin', page: 'list', kind: 'students' };
  }
  if (head === 'settings') return { screen: 'settings' };
  if (head === 'primary-resources') return { screen: 'resources' };
  if (head === 'worksheet' && a) return { screen: 'worksheet', activityId: a };
  if (head === 'guide' && a) return { screen: 'guide', activityId: a };
  if (head === 'courses') return { screen: 'courses' };
  if (head === 'pbl' && a === 'programs' && b) return { screen: 'pbl', tab: 'programs', programId: b, section: c || null };
  if (head === 'pbl') return { screen: 'pbl', tab: a || null };
  if (head === 'parent') return { screen: 'parent' };
  if (head === 'community') return { screen: 'community' };
  if (head === 'messages') return { screen: 'messages', conversationId: a || null };
  if (head === 'goals') return { screen: 'goals' };
  if (head === 'search') return { screen: 'homeSearch' };
  if (head === 'future-skills') return { screen: 'futureSkills' };
  return null;
}

export const hrefFor = {
  list: (kind) => `#/admin/${kind}`,
  billing: () => '#/admin/billing',
  materials: () => '#/admin/materials',
  detail: (uid) => `#/admin/users/${encodeURIComponent(uid)}`,
  create: (kind) => `#/admin/new/${kind}`,
  settings: () => '#/settings',
  courses: () => '#/courses',
  parent: () => '#/parent',
  resources: () => '#/primary-resources',
  worksheet: (id) => `#/worksheet/${id}`,
  guide: (id) => `#/guide/${id}`,
  pbl: (tab) => (tab ? `#/pbl/${tab}` : '#/pbl'),
  program: (id, section) => `#/pbl/programs/${encodeURIComponent(id)}${section ? `/${section}` : ''}`,
  community: () => '#/community',
  messages: (convId) => (convId ? `#/messages/${convId}` : '#/messages'),
  goals: () => '#/goals',
  homeSearch: () => '#/search',
  futureSkills: () => '#/future-skills'
};
