/**
 * Future Skills page content: seven complete skills, links that resolve to a
 * real screen, and the route.
 */
import { describe, it, expect } from 'vitest';
import { SKILLS, WORRIES, PROMISES, AT_HOME, VIDEO } from '../src/features/futureSkills/content.js';
import { parseRoute, hrefFor } from '../src/app/routes.js';

describe('future skills content', () => {
  it('has exactly seven skills, each complete and unique', () => {
    expect(SKILLS).toHaveLength(7);
    expect(new Set(SKILLS.map((s) => s.id)).size).toBe(7);
    for (const s of SKILLS) {
      for (const k of ['name', 'tagline', 'why', 'kids', 'teens', 'tryIt', 'icon']) expect(s[k], `${s.id}.${k}`).toBeTruthy();
    }
  });

  it('every "practise it" link opens a real screen', () => {
    for (const s of SKILLS) expect(parseRoute(s.where.href()), s.id).not.toBeNull();
  });

  it('has the supporting sections', () => {
    expect(WORRIES).toHaveLength(3);
    expect(PROMISES.length).toBeGreaterThanOrEqual(4);
    expect(AT_HOME).toHaveLength(3);
    expect(VIDEO.src).toMatch(/^https:\/\/res\.cloudinary\.com\/dkplz6vbx\/video\//);
  });

  it('#/future-skills is the page', () => {
    expect(parseRoute(hrefFor.futureSkills())).toEqual({ screen: 'futureSkills' });
  });
});
