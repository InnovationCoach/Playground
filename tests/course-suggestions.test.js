import express from 'express';
import { describe, expect, it, vi } from 'vitest';
import { suggestCourses } from '../server/routes/course-suggestions.js';

const data = { programs: [], goals: [], achievements: [], reviewedEvidence: [], recommendations: [{ id: 'quest-1' }] };
const known = { id: 'program:sustainable-futures', reason: 'Explore how to design for a sustainable future.' };
const fallback = { source: 'standard', suggestions: [], recommendations: data.recommendations };

describe('course suggestions', () => {
  it('uses Gemini results and drops unknown and duplicate catalogue IDs', async () => {
    const generate = vi.fn(async () => JSON.stringify([{ id: 'made-up', reason: 'Try it.' }, known, known]));
    await expect(suggestCourses(data, generate)).resolves.toEqual({ source: 'ai', suggestions: [known] });
    expect(JSON.parse(generate.mock.calls[0][0]).catalogue).toContainEqual(expect.objectContaining({ id: known.id }));
  });

  it('uses standard suggestions after a timeout', async () => {
    await expect(suggestCourses(data, () => new Promise(() => {}), 1)).resolves.toEqual(fallback);
  });

  it.each(['', '[]', '{', '[null]'])('uses standard suggestions for unusable output %j', async output => {
    await expect(suggestCourses(data, async () => output)).resolves.toEqual(fallback);
  });

  it.each([429, 503])('uses standard suggestions after upstream status %s', async status => {
    await expect(suggestCourses(data, async () => { throw Object.assign(new Error(), { status }); })).resolves.toEqual(fallback);
  });

  it('requires authentication at the public route', async () => {
    const { default: router } = await import('../server/routes/school-workspace.js');
    const app = express().use(express.json()).use('/api', router);
    const server = app.listen(0, '127.0.0.1');
    try {
      await new Promise((resolve, reject) => server.once('listening', resolve).once('error', reject));
      const response = await fetch('http://127.0.0.1:' + server.address().port + '/api/learner/course-suggestions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}'
      });
      expect(response.status).toBe(401);
    } finally {
      server.close();
    }
  });
});
