import { describe, expect, it } from 'vitest';
import { FRAMEWORK_VERSION, confirmedIds, recommendPathway } from '../src/features/quest/pathwayModel.js';

const lesson = (patch = {}) => ({ id: 'lesson', offeringId: 'offering', revision: 1, title: 'Investigate', outcome: 'Use evidence to explain a finding', status: 'published',
  competencyIds: ['ctps-01'], successCriteria: ['Explain your sources'], steps: [{ id: 'research', title: 'Investigate', instructions: 'Compare two sources.' }], ...patch });
const confirmed = id => ({ competencyId: id, state: 'confirmed', frameworkVersion: FRAMEWORK_VERSION });
describe('Evidence-backed pathway suggestions', () => {
  it('offers foundational published work without claiming existing achievement', () => {
    const [r] = recommendPathway({ lessons: [lesson()] });
    expect(r.basis).toBe('foundational'); expect(r.reason).toContain('no recorded competency prerequisites');
    expect(r.competencyIds).toEqual(['ctps-01']);
  });
  it('only unlocks authored prerequisites using confirmed, current-framework decisions', () => {
    const next = lesson({ competencyIds: ['ctps-06'], prerequisiteCompetencyIds: ['sdl-01'] });
    for (const achievements of [[], [{ ...confirmed('sdl-01'), state: 'reopened' }], [{ ...confirmed('sdl-01'), frameworkVersion: 'old' }], [{ competencyId: 'sdl-01', xp: 1000 }]]) {
      expect(recommendPathway({ lessons: [next], achievements })).toEqual([]);
    }
    expect(recommendPathway({ lessons: [next], achievements: [confirmed('sdl-01')] })[0].reason).toContain('Goal Setting');
  });
  it('does not infer advanced readiness from domain, XP, free text or display codes', () => {
    const lessons = [lesson({ id: 'advanced', competencyIds: ['ctps-06'] }), lesson({ id: 'text', prerequisites: 'knows research' }), lesson({ id: 'unknown', competencyIds: ['2.1.1'] })];
    expect(recommendPathway({ lessons, achievements: [confirmed('ctps-01')] })).toEqual([]);
  });
  it('omits mastered work, drafts, active quests and lessons without assessable instructions', () => {
    const lessons = [lesson(), lesson({ id: 'draft', status: 'draft' }), lesson({ id: 'criteria', successCriteria: [] }), lesson({ id: 'steps', steps: [] })];
    expect(recommendPathway({ lessons, achievements: [confirmed('ctps-01')] })).toEqual([]);
    expect(recommendPathway({ lessons: [lesson()], goals: [{ source: 'competency-pathway', state: 'active', recommendationId: 'offering:lesson' }] })).toEqual([]);
  });
  it('ranks confirmed-prerequisite options first and caps suggestions at three', () => {
    const lessons = ['d', 'a', 'c', 'b'].map(id => lesson({ id }));
    lessons.push(lesson({ id: 'stretch', competencyIds: ['ctps-06'], prerequisiteCompetencyIds: ['sdl-01'] }));
    expect(recommendPathway({ lessons, achievements: [confirmed('sdl-01')] }).map(r => r.lessonId)).toEqual(['stretch', 'a', 'b']);
    expect([...confirmedIds([confirmed('unknown')])]).toEqual([]);
  });
});
