import { describe, expect, it } from 'vitest';
import { FIXTURE_RELEASES, REFERENCE_ARTIFACTS } from '../shared/universe/fixtures/index.js';
import {
  findPilotMission, identityFor, identityKey, emptyWork, workFromSaved, submissionBody, draftBody, checkSubmission, checkDraft,
  partStatus, partToWire, withPart, withCell, tableTemplate, evidenceFromWork
} from '../src/features/universe/pilot/missionSession.js';

const wind = findPilotMission(FIXTURE_RELEASES, 'thalassa-wind-survey');
const journey = findPilotMission(FIXTURE_RELEASES, 'spacecraft-journey');
const windRoute = wind.mission.routes[0];
const forArtifact = (a) => {
  const entry = findPilotMission(FIXTURE_RELEASES, a.endpoint.split('/')[4]);
  const route = entry.mission.routes.find((r) => r.id === a.request.routeId);
  return { route, identity: identityFor(entry.bundle, entry.mission, route) };
};

describe('pilot mission session model', () => {
  it('round-trips all five reference artifacts byte-for-byte and passes the shared submission validator', () => {
    expect(REFERENCE_ARTIFACTS).toHaveLength(5);
    for (const a of REFERENCE_ARTIFACTS) {
      const { route, identity } = forArtifact(a);
      const work = workFromSaved(route, a.request);
      const body = submissionBody(route, identity, work);
      expect(body.evidence).toEqual(a.request.evidence);
      expect(checkSubmission(FIXTURE_RELEASES, identity, body).ok).toBe(true);
      for (const rule of route.requiredParts) expect(partStatus(route, rule.partId, work.parts[rule.partId]).complete).toBe(true);
    }
  });

  it('keeps a saved table exactly when its caption or columns differ, even at the same size', () => {
    const t = tableTemplate(windRoute, 'weighted-results');
    const sameSizeRelabelled = {
      partId: 'weighted-results', kind: 'table', caption: 'My own table', columns: ['A', 'B', 'C', 'D'],
      rows: t.rows.map((r) => r.cells.map((c) => (c.editable ? '1' : c.value)))
    };
    const work = workFromSaved(windRoute, { evidence: [sameSizeRelabelled] });
    expect(work.parts['weighted-results'].savedTable).not.toBeNull();
    expect(partToWire(windRoute, 'weighted-results', work.parts['weighted-results'])).toEqual(sameSizeRelabelled);

    const templateShaped = { ...sameSizeRelabelled, caption: t.caption, columns: [...t.columns] };
    const restored = workFromSaved(windRoute, { evidence: [templateShaped] });
    expect(restored.parts['weighted-results'].savedTable).toBeNull();
    expect(partToWire(windRoute, 'weighted-results', restored.parts['weighted-results'])).toEqual(templateShaped);
  });

  it('uses the shared presentation getter: three wind cells are given “Not applicable”, never learner work', () => {
    const t = tableTemplate(windRoute, 'weighted-results');
    const cells = (id) => t.rows.find((r) => r.id === id).cells;
    expect(cells('total').map((c) => c.editable)).toEqual([false, true, false, true]);
    expect(cells('total')[2].value).toBe('Not applicable');
    expect(cells('capacity-factors').map((c) => c.editable)).toEqual([false, false, true, false]);
    const empty = emptyWork(windRoute).parts['weighted-results'].cells;
    expect(empty.at(-1)).toEqual(['CF raw / planning', 'Not applicable', '', 'Not applicable']);
    // The approved source data is untouched.
    expect(windRoute.tableTemplates['weighted-results'].rows.find((r) => r.id === 'total').cells[2]).toEqual({ value: '', editable: true });
  });

  it('marks a part incomplete while a blank cell or a “__” starter blank remains', () => {
    let work = emptyWork(windRoute);
    expect(partStatus(windRoute, 'weighted-results', work.parts['weighted-results'])).toMatchObject({ complete: false });
    const t = tableTemplate(windRoute, 'weighted-results');
    t.rows.forEach((r, i) => r.cells.forEach((c, j) => { if (c.editable) work = withCell(work, 'weighted-results', i, j, '1'); }));
    expect(partStatus(windRoute, 'weighted-results', work.parts['weighted-results']).complete).toBe(true);
    work = withPart(work, 'criteria', { text: 'Our agreed criteria are __.' });
    expect(partStatus(windRoute, 'criteria', work.parts.criteria)).toMatchObject({ complete: false, reason: expect.stringMatching(/__/) });
  });

  it('keeps every format’s content when the learner switches between table and text', () => {
    let work = emptyWork(windRoute);
    work = withPart(work, 'plan-comparison', { kind: 'text', text: 'Plan A meets every base limit.' });
    work = withCell(work, 'plan-comparison', 0, 1, '14160');
    work = withPart(work, 'plan-comparison', { kind: 'table' });
    expect(work.parts['plan-comparison'].text).toBe('Plan A meets every base limit.');
    expect(partToWire(windRoute, 'plan-comparison', work.parts['plan-comparison']).rows[0][1]).toBe('14160');
  });

  it('serialises diagrams only with selected vocabulary and drops relationships whose place was removed', () => {
    const route = journey.mission.routes.find((r) => r.id === 'guided');
    let work = emptyWork(route);
    work = withPart(work, 'route-plan', { kind: 'diagram', nodeIds: ['station', 'transit', 'delivery'], edgeKeys: ['station>transit>depart', 'transit>delivery>deliver'], description: 'Station to Ignis.' });
    expect(partToWire(route, 'route-plan', work.parts['route-plan']).edges).toHaveLength(2);
    work = withPart(work, 'route-plan', { nodeIds: ['station', 'delivery'] });
    expect(partToWire(route, 'route-plan', work.parts['route-plan'])).toMatchObject({ nodes: [{ id: 'station' }, { id: 'delivery' }], edges: [] });
  });

  it('gives each route its own exact identity and a valid empty draft', () => {
    const [g, a] = journey.mission.routes;
    const gi = identityFor(journey.bundle, journey.mission, g), ai = identityFor(journey.bundle, journey.mission, a);
    expect(identityKey(gi)).not.toBe(identityKey(ai));
    expect(gi).toMatchObject({ routeId: 'guided', taskId: 'journey-rates' });
    expect(ai).toMatchObject({ routeId: 'advanced', taskId: 'journey-mass-power' });
    for (const [route, id] of [[g, gi], [a, ai], [windRoute, identityFor(wind.bundle, wind.mission, windRoute)]]) {
      const body = draftBody(route, id, emptyWork(route), 0);
      expect(checkDraft(FIXTURE_RELEASES, id, body).ok).toBe(true);
      expect(body).not.toHaveProperty('previousSubmissionId');
    }
  });

  it('saves raw numeric input exactly, with a server-recomputable value, including cleared fields', () => {
    const id = identityFor(wind.bundle, wind.mission, windRoute);
    let work = emptyWork(windRoute);
    work = { ...work, answers: { 'capacity-factor': { rawText: '34%' }, hours: { rawText: '' } } };
    const body = draftBody(windRoute, id, work, 0);
    expect(body.answers).toEqual([{ stepId: 'hours', kind: 'number', rawText: '', value: null }, { stepId: 'capacity-factor', kind: 'number', rawText: '34%', value: 0.34 }]);
    expect(checkDraft(FIXTURE_RELEASES, id, body).ok).toBe(true);
    expect(evidenceFromWork(windRoute, work)).toHaveLength(6);
  });
});
