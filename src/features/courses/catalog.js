/**
 * One catalogue for the My Courses search: HearIsland STEAM activities, PBL
 * programs and partner courses, each reduced to the same entry shape so a
 * single search box can find all of them.
 *
 * Pure functions; the caller passes ACTIVITY_NAV and PROGRAMS in, so this file
 * pulls in no DOM or Firebase code and is unit-tested in tests/course-catalog.test.js.
 *
 * Partner entries link to pages that exist today (checked 2026-10-21). They
 * are plain links, not partnerships: no logos, no progress comes back, and
 * nothing is bought. Primary learners do not see them.
 */

export const SOURCES = ['activity', 'program', 'partner'];

/**
 * Outside courses. Add one only after opening its URL and checking it suits
 * secondary learners. `host` is shown on the card so a learner knows they are
 * leaving HearIsland.
 */
export const PARTNER_COURSES = [
  {
    id: 'orions-quest-missions',
    provider: "Orion's Quest",
    title: 'Space station research missions',
    description: 'Work with data from real experiments on the International Space Station. Free to join; past missions cover plants, fruit flies, spiders and cancer in microgravity.',
    keywords: 'space nasa iss science biology research plants microgravity free mission',
    url: 'https://www.orionsquest.org/missions/',
    facts: ['Free', 'Online missions', 'Upper primary to high school']
  },
  {
    id: 'orions-quest-classroom',
    provider: "Orion's Quest",
    title: 'Distance Learning Classroom',
    description: 'Self-paced space-science activities you can do at home.',
    keywords: 'space science self-paced home free',
    url: 'https://www.orionsquest.org/athome',
    facts: ['Free', 'Self-paced']
  },
  {
    id: 'stanford-online',
    provider: 'Stanford Online',
    title: 'Stanford Online course catalogue',
    description: 'University courses from Stanford, some free. Written for adults, so best for older secondary students with their coach.',
    keywords: 'university stanford computer science engineering medicine business free advanced',
    url: 'https://online.stanford.edu/',
    facts: ['Some free', 'University level', 'Ages 16+ with coach']
  }
];

const hostOf = (url) => {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; }
};

/**
 * @param {{ activities: Array, programs: Array, parseLabel: Function, includePartners: boolean }} input
 * @returns {Array<{ key, source, id, kicker, title, description, keywords, facts, url?, host? }>}
 */
export function buildCatalog({ activities = [], programs = [], parseLabel = (l) => ({ kicker: '', title: l }), includePartners = true }) {
  const fromActivities = activities.filter((a) => a.id !== 'home').map((a) => {
    const { kicker, title } = parseLabel(a.label);
    return {
      key: `activity:${a.id}`, source: 'activity', id: a.id, kicker, title,
      description: a.description || '', keywords: a.keywords || '', facts: []
    };
  });

  const fromPrograms = programs.map((p) => ({
    key: `program:${p.id}`, source: 'program', id: p.id,
    kicker: 'PBL program', title: p.title, icon: p.identity?.icon, tone: p.identity?.tone,
    description: p.subtitle || p.drivingQuestion || '',
    keywords: [p.theme, p.drivingQuestion, p.identity?.short, ...(p.tags || []), ...(p.searchTokens || [])].filter(Boolean).join(' '),
    facts: [p.durationWeeks ? `${p.durationWeeks} weeks` : null, p.sessions?.length ? `${p.sessions.length} sessions` : null].filter(Boolean)
  }));

  const fromPartners = includePartners ? PARTNER_COURSES.map((c) => ({
    key: `partner:${c.id}`, source: 'partner', id: c.id,
    kicker: c.provider, title: c.title, description: c.description,
    keywords: `${c.provider} ${c.keywords}`, facts: c.facts, url: c.url, host: hostOf(c.url)
  })) : [];

  return [...fromActivities, ...fromPrograms, ...fromPartners];
}

const norm = (s) => (s || '').toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}\s]/gu, ' ');

/**
 * Every typed word must appear in the entry. Title matches rank above
 * description or keyword matches; ties keep catalogue order. A source of
 * 'all' (or none) searches everything.
 */
export function searchCatalog(items, query, source = 'all') {
  const pool = source && source !== 'all' ? items.filter((i) => i.source === source) : items;
  const words = norm(query).split(/\s+/).filter(Boolean);
  if (!words.length) return pool;

  const scored = [];
  pool.forEach((item, order) => {
    const title = norm(`${item.kicker} ${item.title}`);
    const hay = `${title} ${norm(item.description)} ${norm(item.keywords)} ${norm(item.facts.join(' '))}`;
    let score = 0;
    for (const w of words) {
      if (title.includes(w)) score += 2;
      else if (hay.includes(w)) score += 1;
      else return;
    }
    scored.push({ item, score, order });
  });
  return scored.sort((a, b) => b.score - a.score || a.order - b.order).map((x) => x.item);
}

/** Result counts per source for the filter chips, for the current query. */
export function countBySource(items, query) {
  const hits = searchCatalog(items, query, 'all');
  const counts = { all: hits.length };
  for (const s of SOURCES) counts[s] = hits.filter((i) => i.source === s).length;
  return counts;
}

/* ---------- My Path: courses a learner saved for later ---------- */

/**
 * Kept on this device only (localStorage, per learner) until the backend
 * stores it; the UI says so. Unknown or duplicate keys are dropped on read.
 */
export const pathStorageKey = (uid) => `hearisland.myPath.v1:${uid || 'signed-out'}`;
export const PATH_LIMIT = 50;

export function parsePath(raw, knownKeys) {
  let list;
  try { list = JSON.parse(raw || '[]'); } catch { return []; }
  if (!Array.isArray(list)) return [];
  const known = knownKeys ? new Set(knownKeys) : null;
  const out = [];
  for (const k of list) {
    if (typeof k !== 'string' || out.includes(k)) continue;
    if (known && !known.has(k)) continue;
    out.push(k);
    if (out.length >= PATH_LIMIT) break;
  }
  return out;
}

export function togglePath(list, key) {
  return list.includes(key) ? list.filter((k) => k !== key) : [...list, key].slice(-PATH_LIMIT);
}
