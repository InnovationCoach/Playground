/**
 * The My Courses catalogue: one search over STEAM activities, PBL programs and
 * partner courses, source filters, and the saved My Path list.
 */
import { describe, it, expect } from 'vitest';
import {
  buildCatalog, searchCatalog, countBySource, PARTNER_COURSES, SOURCES,
  parsePath, togglePath, pathStorageKey, PATH_LIMIT
} from '../src/features/courses/catalog.js';
import { ACTIVITY_NAV } from '../src/features/activities/activityHost.js';
import { PROGRAMS } from '../src/features/pbl/programs/catalog.js';
import { parseActivityLabel } from '../src/features/shell/activityIcons.jsx';

const catalog = buildCatalog({ activities: ACTIVITY_NAV, programs: PROGRAMS, parseLabel: parseActivityLabel });
const keys = (q, source) => searchCatalog(catalog, q, source).map((c) => c.key);

describe('course catalogue', () => {
  it('holds every activity except home, every program and every partner course', () => {
    const activities = ACTIVITY_NAV.filter((a) => a.id !== 'home');
    expect(catalog.filter((c) => c.source === 'activity')).toHaveLength(activities.length);
    expect(catalog.filter((c) => c.source === 'program')).toHaveLength(PROGRAMS.length);
    expect(catalog.filter((c) => c.source === 'partner')).toHaveLength(PARTNER_COURSES.length);
    expect(new Set(catalog.map((c) => c.key)).size).toBe(catalog.length);
  });

  it('can leave partner courses out', () => {
    const noPartners = buildCatalog({ activities: ACTIVITY_NAV, programs: PROGRAMS, includePartners: false });
    expect(noPartners.some((c) => c.source === 'partner')).toBe(false);
  });

  it('partner courses link out over https and show the host', () => {
    for (const c of catalog.filter((x) => x.source === 'partner')) {
      expect(c.url).toMatch(/^https:\/\//);
      expect(c.host).toBe(new URL(c.url).hostname.replace(/^www\./, ''));
      expect(c.host).not.toBe('');
    }
  });
});

describe('catalogue search', () => {
  it('an empty query returns everything in catalogue order', () => {
    expect(keys('')).toEqual(catalog.map((c) => c.key));
  });

  it('finds across sources and needs every word', () => {
    const space = keys('space');
    expect(space).toContain('partner:orions-quest-missions');
    expect(keys('space station')).toContain('partner:orions-quest-missions');
    expect(keys('space zzzqqq')).toEqual([]);
  });

  it('finds an activity by name, ignoring case and punctuation', () => {
    expect(keys('SOLAR')[0]).toBe('activity:solar');
  });

  it('ranks title matches above description matches', () => {
    const r = searchCatalog(catalog, 'stanford');
    expect(r[0].key).toBe('partner:stanford-online');
  });

  it('filters by source', () => {
    for (const s of SOURCES) {
      expect(searchCatalog(catalog, '', s).every((c) => c.source === s)).toBe(true);
    }
    expect(keys('space', 'activity')).not.toContain('partner:orions-quest-missions');
  });

  it('counts per source add up to the total', () => {
    for (const q of ['', 'space', 'design', 'nothing-matches-this']) {
      const n = countBySource(catalog, q);
      expect(SOURCES.reduce((sum, s) => sum + n[s], 0)).toBe(n.all);
    }
  });
});

describe('My Path', () => {
  const known = catalog.map((c) => c.key);

  it('keys storage by learner', () => {
    expect(pathStorageKey('abc')).not.toBe(pathStorageKey('xyz'));
    expect(pathStorageKey(undefined)).toContain('signed-out');
  });

  it('survives bad storage', () => {
    expect(parsePath(null, known)).toEqual([]);
    expect(parsePath('not json', known)).toEqual([]);
    expect(parsePath('{"a":1}', known)).toEqual([]);
  });

  it('drops unknown, duplicate and non-string keys', () => {
    const raw = JSON.stringify([known[0], known[0], 'activity:gone', 7, known[1]]);
    expect(parsePath(raw, known)).toEqual([known[0], known[1]]);
  });

  it('toggles a course in and out', () => {
    const once = togglePath([], known[0]);
    expect(once).toEqual([known[0]]);
    expect(togglePath(once, known[0])).toEqual([]);
  });

  it('never grows past the limit', () => {
    let list = [];
    for (let i = 0; i < PATH_LIMIT + 5; i += 1) list = togglePath(list, `k${i}`);
    expect(list).toHaveLength(PATH_LIMIT);
    expect(list.at(-1)).toBe(`k${PATH_LIMIT + 4}`);
  });
});
