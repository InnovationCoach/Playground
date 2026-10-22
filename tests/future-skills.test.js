/**
 * Learner Future Skills page: seven complete skills, each tied to real design
 * thinking phases, every phase building at least one skill, and the route.
 */
import { describe, it, expect } from 'vitest';
import { SKILLS, GROWTH } from '../src/features/futureSkills/content.js';
import { PHASES, AI_PRINCIPLES } from '../src/features/pbl/content/pblModel.js';
import { parseRoute, hrefFor } from '../src/app/routes.js';

const phaseIds = new Set(PHASES.map((p) => p.id));

describe('future skills content', () => {
  it('has exactly seven skills, each complete and unique', () => {
    expect(SKILLS).toHaveLength(7);
    expect(new Set(SKILLS.map((s) => s.id)).size).toBe(7);
    for (const s of SKILLS) {
      for (const k of ['name', 'tagline', 'why', 'kids', 'teens', 'tryIt', 'icon']) expect(s[k], `${s.id}.${k}`).toBeTruthy();
    }
  });

  it('ties every skill to real design thinking phases', () => {
    for (const s of SKILLS) {
      expect(s.phases.length, s.id).toBeGreaterThan(0);
      for (const p of s.phases) expect(phaseIds.has(p), `${s.id} -> ${p}`).toBe(true);
    }
  });

  it('every phase builds at least one skill', () => {
    for (const p of PHASES) expect(SKILLS.some((s) => s.phases.includes(p.id)), p.id).toBe(true);
  });

  it('reuses the AI rules and phases learners already see in PBL Studio', () => {
    expect(AI_PRINCIPLES.length).toBeGreaterThan(0);
    for (const p of PHASES) {
      expect(p.goal).toBeTruthy();
      expect(p.tasks.length).toBeGreaterThan(0);
      expect(p.ai.length).toBeGreaterThan(0);
    }
    expect(GROWTH.length).toBeGreaterThanOrEqual(3);
  });

  it('is written to the learner, not as a sales page', () => {
    const text = JSON.stringify(SKILLS) + JSON.stringify(GROWTH);
    expect(text).not.toMatch(/sign up|book a|talk to us|contact us|enrol now/i);
  });

  it('#/future-skills is the page', () => {
    expect(parseRoute(hrefFor.futureSkills())).toEqual({ screen: 'futureSkills' });
  });
});
