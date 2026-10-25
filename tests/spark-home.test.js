import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { SPARK_ROLES, sparkRoleFor, cardHref, cardsFor, pushRecent, RECENT_LIMIT, STATUSES, TONES } from '../src/features/spark/sparkConfig.js';
import { studentContext, parentContext, consoleContext, nextStepHref } from '../src/features/spark/sparkContext.js';
import { parseRoute, hrefFor } from '../src/app/routes.js';
import { messages, translate } from '../src/app/i18n/messages.js';
import { menuFor } from '../src/features/shell/Sidebar.jsx';
import { buildChildProgress } from '../src/features/parent/childProgress.js';
import { childRecords } from '../src/services/api/mockChildRecords.js';

// The screens App.jsx renders for each role. A SPARK card may only point at one of these.
const ALLOWED = {
  student: ['courses', 'pbl', 'goals', 'dashboard', 'futureSkills', 'homeSearch', 'community', 'spark', 'settings', 'canva'],
  teacher: ['coach', 'pbl', 'resources', 'community', 'spark', 'settings', 'canva'],
  parent: ['parent', 'settings', 'spark'],
  supervisor: ['admin', 'pbl', 'settings', 'resources', 'spark', 'canva'],
  admin: ['admin', 'pbl', 'settings', 'resources', 'spark', 'canva']
};
const t = (key, vars) => translate('en', key, vars);

describe('SPARK Home configuration', () => {
  it('has a page for every role, and coach maps to teacher', () => {
    expect(Object.keys(SPARK_ROLES).sort()).toEqual(Object.keys(ALLOWED).sort());
    expect(sparkRoleFor('coach')).toBe('teacher');
    expect(sparkRoleFor('nobody')).toBeNull();
    expect(cardsFor('nobody')).toEqual([]);
  });

  for (const [role, cfg] of Object.entries(SPARK_ROLES)) {
    describe(role, () => {
      it('every card has a valid status, tone and unique id', () => {
        const ids = cfg.cards.map((c) => c.id);
        expect(new Set(ids).size).toBe(ids.length);
        for (const c of cfg.cards) {
          expect(STATUSES).toContain(c.status);
          expect(TONES).toContain(c.tone);
          expect(c.id.startsWith(`${role}.`)).toBe(true);
        }
      });

      it('live cards open a screen this role can open; Coming soon cards go nowhere', () => {
        for (const c of cfg.cards) {
          const href = cardHref(c, 'child-1');
          if (c.status === 'soon') {
            expect(c.route).toBeNull();
            expect(href).toBeNull();
            continue;
          }
          const route = parseRoute(href);
          expect(route, `${c.id} -> ${href}`).not.toBeNull();
          expect(ALLOWED[role], `${c.id} -> ${route.screen}`).toContain(route.screen);
        }
      });

      it('every card has English text in place (and a button label unless Coming soon)', () => {
        for (const c of cfg.cards) {
          for (const part of ['t', 'd', ...(c.status === 'soon' ? [] : ['cta'])]) {
            expect(messages.en[`spark.card.${c.id}.${part}`], `${c.id}.${part}`).toBeTruthy();
          }
          expect(messages.en[`spark.card.${c.id}.cta`] && c.status === 'soon').toBeFalsy();
        }
        expect(messages.en[`spark.welcome.${role}`]).toBeTruthy();
        expect(messages.en[`spark.intro.${role}`]).toBeTruthy();
      });
    });
  }

  it('parent cards need a linked child before they link anywhere', () => {
    const overview = SPARK_ROLES.parent.cards.find((c) => c.id === 'parent.overview');
    expect(cardHref(overview, null)).toBeNull();
    expect(parseRoute(cardHref(SPARK_ROLES.parent.cards.find((c) => c.id === 'parent.goals'), 'kid 1')))
      .toEqual({ screen: 'parent', childUid: 'kid 1', section: 'goals' });
  });

  it('nothing links to Messages any more', () => {
    for (const cfg of Object.values(SPARK_ROLES)) for (const c of cfg.cards) expect(cardHref(c, 'x') || '').not.toContain('messages');
  });

  it('students have a Search for Programs sidebar item that opens the course search page', () => {
    const nav = readFileSync(new URL('../src/features/shell/Sidebar.jsx', import.meta.url), 'utf8');
    expect(nav).toContain("label: 'nav.searchPrograms', href: hrefFor.homeSearch()");
    for (const locale of ['en', 'zh', 'th']) expect(messages[locale]['nav.searchPrograms']).toBeTruthy();
    expect(parseRoute(hrefFor.homeSearch())).toEqual({ screen: 'homeSearch', q: '' });
    expect(ALLOWED.student).toContain('homeSearch');
  });

  it('the legacy router lets #/spark through', () => {
    const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
    const allow = /\^\(([^)]*)\)\(\\\/\|\$\)/.exec(html.slice(html.indexOf('Screens React routes itself')));
    expect(allow[1].split('|')).toContain('spark');
    expect(html).toContain('<title>WeLearn SPARK</title>');
  });
});

describe('routes', () => {
  it('parses SPARK, the coach dashboard, parent sections and a search query', () => {
    expect(parseRoute(hrefFor.spark())).toEqual({ screen: 'spark' });
    expect(parseRoute(hrefFor.coach())).toEqual({ screen: 'coach' });
    expect(parseRoute('#/parent/abc/edmentum').section).toBe('edmentum');
    expect(parseRoute('#/parent/abc/nonsense').section).toBeNull();
    expect(parseRoute(hrefFor.homeSearch('solar car'))).toEqual({ screen: 'homeSearch', q: 'solar car' });
  });
});

describe('recently opened', () => {
  it('keeps newest first, without duplicates, up to the limit', () => {
    let list = [];
    for (let i = 0; i < 6; i += 1) list = pushRecent(list, { id: `c${i}`, href: `#/x/${i}` }, i);
    expect(list).toHaveLength(RECENT_LIMIT);
    expect(list[0].id).toBe('c5');
    list = pushRecent(list, { id: 'c3', href: '#/x/3' }, 99);
    expect(list.filter((r) => r.id === 'c3')).toHaveLength(1);
    expect(list[0]).toMatchObject({ id: 'c3', at: 99 });
    expect(pushRecent('garbage', { id: 'a', href: '#/a' }, 1)).toEqual([{ id: 'a', href: '#/a', at: 1 }]);
  });
});

describe('context lines', () => {
  it('student lines come only from saved work', () => {
    expect(studentContext(null, t)).toEqual({});
    const empty = studentContext({ project: { updatedAt: null, evidence: [], tasksDone: {} }, started: [], goals: null }, t);
    expect(empty).toEqual({});
    const busy = studentContext({
      project: { updatedAt: 1, currentPhase: 'define', evidence: [{}, {}], tasksDone: { explore: [0, 1, 2] } },
      started: ['solar'], goals: { today: { done: 1, total: 2 } }
    }, t);
    expect(busy.project).toMatch(/^Now in: Define · 3 of \d+ tasks$/);
    expect(busy.evidence).toBe('2 pieces of evidence');
    expect(busy.goalsToday).toBe('Today: 1 of 2 done');
  });

  it('parent lines follow the child progress body', () => {
    const now = new Date('2026-10-22T12:00:00');
    const p = buildChildProgress({ child: { uid: 'k', givenNames: 'Hao' }, now, ...childRecords('active', now.getTime()) });
    const ctx = parentContext(p, t, () => 'yesterday');
    expect(ctx.childActive).toBe('Last active yesterday');
    expect(ctx.childPhase).toBe('Now in: Prototype');
    expect(ctx.childGoals).toBe('3 of 4 goal steps done');
    expect(parentContext(buildChildProgress({ child: { uid: 'k' }, now, ...childRecords('new') }), t, () => '')).toEqual({});
  });

  it('console shows pending accounts only when there are some', () => {
    expect(consoleContext({ pending: 3 }, t)).toEqual({ pendingAccounts: '3 accounts awaiting activation' });
    expect(consoleContext({ pending: 0 }, t)).toEqual({});
    expect(consoleContext(null, t)).toEqual({});
  });

  it('next-step targets become links or activities', () => {
    expect(nextStepHref({ type: 'goals' }, hrefFor)).toEqual({ href: '#/goals' });
    expect(nextStepHref({ type: 'pbl', tab: 'portfolio' }, hrefFor)).toEqual({ href: '#/pbl/portfolio' });
    expect(nextStepHref({ type: 'activity', id: 'solar' }, hrefFor)).toEqual({ activity: 'solar' });
    expect(nextStepHref(null, hrefFor)).toBeNull();
  });
});

describe('sidebar menu', () => {
  for (const role of ['student', 'teacher', 'parent', 'supervisor', 'admin']) {
    it(`${role}: every link opens a screen the role can open, with labels in all languages`, () => {
      const items = menuFor(role, { onOpenCourses() {}, onOpenGoals() {}, onNavigate() {} }).flatMap((g) => g.items);
      expect(items[0].key).toBe('spark');
      const keys = items.map((i) => i.key);
      expect(new Set(keys).size).toBe(keys.length);
      for (const i of items) {
        if (i.href) expect(ALLOWED[role], `${role} ${i.href}`).toContain(parseRoute(i.href).screen);
        else expect(typeof i.onClick).toBe('function');
        for (const locale of ['en', 'zh', 'th']) expect(messages[locale][i.label], `${locale} ${i.label}`).toBeTruthy();
      }
      expect(keys.some((k) => k.includes('messages'))).toBe(false);
    });
  }
});
