import { describe, it, expect } from 'vitest';
import { COMPETENCIES, COMPETENCY_DOMAINS, COMPETENCY_DATA_ISSUES, competencyById } from '../src/features/pbl/content/competencies.js';
import { PHASES, EVIDENCE_KINDS, TERM } from '../src/features/pbl/content/pblModel.js';
import { STEAM_NGSS, DIMENSIONS, DIMENSION_DESCRIPTORS, RUBRIC_LEVELS } from '../src/features/pbl/content/steamNgss.js';
import { ACTIVITY_NAV } from '../src/features/activities/activityHost.js';
import {
  newProject, hydrateProject, addEvidence, removeEvidence, toggleTask, updateProject,
  phaseProgress, competencyCoverage, readiness, copilotContext, copilotRequest, safeLink, LIMITS
} from '../src/features/pbl/engine/pblProject.js';
import { parseRoute, hrefFor } from '../src/app/routes.js';

describe('competency framework (from the school spreadsheet)', () => {
  it('has all 85 competencies in 7 domains with unique ids', () => {
    expect(COMPETENCY_DOMAINS).toHaveLength(7);
    expect(COMPETENCIES).toHaveLength(85);
    expect(new Set(COMPETENCIES.map((c) => c.id)).size).toBe(85);
  });
  it('every competency belongs to a domain and is foundational or advanced', () => {
    const domains = new Set(COMPETENCY_DOMAINS.map((d) => d.id));
    for (const c of COMPETENCIES) {
      expect(domains.has(c.domain)).toBe(true);
      expect(['foundational', 'advanced']).toContain(c.level);
      expect(c.statement.length).toBeGreaterThan(20);
    }
  });
  it('data-issue notes point at real competencies', () => {
    for (const issue of COMPETENCY_DATA_ISSUES) for (const id of issue.ids) expect(competencyById(id)).not.toBeNull();
  });
});

describe('PBL phases', () => {
  it('runs Explore first and Share last, within the term', () => {
    expect(PHASES[0].id).toBe('explore');
    expect(PHASES.at(-1).id).toBe('share');
    for (const p of PHASES) {
      expect(p.weeks[0]).toBeGreaterThanOrEqual(1);
      expect(p.weeks[1]).toBeLessThanOrEqual(TERM.weeks);
      expect(p.weeks[0]).toBeLessThanOrEqual(p.weeks[1]);
    }
  });
  it('only references competencies that exist, and every phase has AI starters', () => {
    for (const p of PHASES) {
      for (const id of [...p.competencies, ...p.stretch]) expect(competencyById(id), `${p.id}: ${id}`).not.toBeNull();
      expect(p.ai.length).toBeGreaterThan(0);
    }
  });
});

describe('STEAM activities as Explore, aligned to NGSS', () => {
  it('maps only real activities, with well-formed PE codes', () => {
    const ids = new Set(ACTIVITY_NAV.map((a) => a.id));
    for (const [id, ngss] of Object.entries(STEAM_NGSS)) {
      expect(ids.has(id), id).toBe(true);
      for (const pe of ngss.pes) expect(pe.code).toMatch(/^(K|[1-5]|MS|HS)-(PS|LS|ESS|ETS)\d-\d$/);
    }
  });
  it('every rubric covers SEP, DCI and CCC with a look-for, on four levels', () => {
    expect(RUBRIC_LEVELS).toHaveLength(4);
    for (const d of Object.keys(DIMENSIONS)) expect(DIMENSION_DESCRIPTORS[d]).toHaveLength(4);
    for (const ngss of Object.values(STEAM_NGSS)) {
      for (const dim of ['sep', 'dci', 'ccc']) expect(ngss.rubric[dim]?.lookFor).toBeTruthy();
      for (const dim of Object.keys(ngss.rubric)) expect(DIMENSIONS[dim]).toBeDefined();
    }
  });
});

describe('project engine', () => {
  const T = 'term-x';
  const note = { kind: 'note', phase: 'empathise', title: 'Interview with Ana', body: 'She said…', competencies: ['ec-05', 'nope'] };

  it('rejects script links and keeps http(s)', () => {
    expect(safeLink('javascript:alert(1)')).toBe('');
    expect(safeLink('data:text/html,hi')).toBe('');
    expect(safeLink('https://makecode.microbit.org/_abc')).toBe('https://makecode.microbit.org/_abc');
  });

  it('adds evidence, drops unknown competencies, and refuses bad entries', () => {
    const p = newProject(T);
    const ok = addEvidence(p, note, 1000);
    expect(ok.project.evidence).toHaveLength(1);
    expect(ok.project.evidence[0].competencies).toEqual(['ec-05']);
    expect(addEvidence(p, { ...note, title: ' ' }).error).toMatch(/title/);
    expect(addEvidence(p, { ...note, link: 'javascript:alert(1)' }).error).toMatch(/http/);
    expect(addEvidence(p, { kind: 'ai', phase: 'prototype', title: 'x', ai: { asked: 'write code', kept: '' } }).error).toMatch(/kept/);
  });

  it('an AI log needs what was asked AND what was kept', () => {
    const r = addEvidence(newProject(T), { kind: 'ai', phase: 'prototype', title: 'Servo code', ai: { asked: 'servo code', gave: 'code…', kept: 'Kept the loop, changed the angle' } }, 5);
    expect(r.project.evidence[0].ai.kept).toMatch(/angle/);
  });

  it('hydrate ignores another term and strips bad data', () => {
    const stored = { termId: T, currentPhase: 'hack', finalFormat: 'dance', tasksDone: { explore: [0, 0, 99, 'x'] },
      evidence: [{ id: 'e1', title: 'ok', kind: 'weird', link: 'javascript:x', competencies: ['ct-03'] }, { id: 'e2' }] };
    const p = hydrateProject(stored, T);
    expect(p.currentPhase).toBe('explore');
    expect(p.finalFormat).toBeNull();
    expect(p.tasksDone.explore).toEqual([0]);
    expect(p.evidence).toHaveLength(1);
    expect(p.evidence[0]).toMatchObject({ kind: 'note', link: '', competencies: ['ct-03'] });
    expect(hydrateProject({ ...stored, termId: 'other' }, T).evidence).toHaveLength(0);
  });

  it('tracks progress, coverage and removal', () => {
    let p = addEvidence(newProject(T), note, 1).project;
    PHASES[1].tasks.forEach((_, i) => { p = toggleTask(p, 'empathise', i); });
    expect(phaseProgress(p, 'empathise')).toMatchObject({ complete: true, evidenceCount: 1 });
    expect(competencyCoverage(p)).toEqual({ 'ec-05': 1 });
    p = removeEvidence(p, p.evidence[0].id);
    expect(phaseProgress(p, 'empathise').complete).toBe(false);
  });

  it('readiness needs evidence of every kind the showcase relies on', () => {
    let p = updateProject(newProject(T), { impact: 'environment', problem: { hmw: 'How might we keep class plants alive over the holidays?', criteria: 'Soil stays moist 5 days', impactMeasure: 'Plants alive after 2 weeks' }, finalFormat: 'showcase' });
    const kinds = { explore: 'note', empathise: 'feedback', define: 'note', ideate: 'ai', prototype: 'code', test: 'data', share: 'reflection' };
    for (const [phase, kind] of Object.entries(kinds)) {
      p = addEvidence(p, { phase, kind, title: phase, ai: { asked: 'q', kept: 'k' } }).project;
    }
    const r = readiness(p);
    expect(r.checks.filter((c) => !c.ok)).toEqual([]);
    expect(readiness(newProject(T)).done).toBe(0);
  });

  it('co-pilot context fits the server limit and carries no personal fields', () => {
    const p = updateProject(newProject(T), { problem: { hmw: 'x'.repeat(LIMITS.field) } });
    const ctx = copilotContext(p, 'prototype');
    expect(ctx.length).toBeLessThanOrEqual(800);
    expect(ctx).toMatch(/Prototype/);
  });

  it('a project must say who it helps, and how that is measured', () => {
    const noImpact = readiness(updateProject(newProject(T), { problem: { impactMeasure: 'litres saved per week' } }));
    expect(noImpact.checks.find((c) => c.id === 'impact').ok).toBe(false);
    const ok = readiness(updateProject(newProject(T), { impact: 'people', problem: { impactMeasure: 'litres saved per week' } }));
    expect(ok.checks.find((c) => c.id === 'impact').ok).toBe(true);
  });

  it('hydrate keeps valid impact and language, drops invalid ones', () => {
    expect(hydrateProject({ termId: T, impact: 'environment', codeLanguage: 'arduino' }, T)).toMatchObject({ impact: 'environment', codeLanguage: 'arduino' });
    expect(hydrateProject({ termId: T, impact: 'aliens', codeLanguage: 'cobol' }, T)).toMatchObject({ impact: null, codeLanguage: 'micropython' });
  });

  it('co-pilot request carries project text, impact and language only', () => {
    const p = updateProject(newProject(T), { impact: 'both', codeLanguage: 'python', problem: { hmw: '  How might we…  ', who: 'x'.repeat(900) } });
    const req = copilotRequest(p, 'prototype', 'write code');
    expect(req).toMatchObject({ phase: 'prototype', impact: 'both', language: 'python', message: 'write code' });
    expect(req.problem.hmw).toBe('How might we…');
    expect(req.problem.who.length).toBe(200);
    expect(Object.keys(req).sort()).toEqual(['impact', 'language', 'message', 'phase', 'problem']);
    expect(copilotRequest(p, 'nope', 'x').phase).toBe('explore');
  });

  it('evidence kinds include an AI log', () => {
    expect(EVIDENCE_KINDS.map((k) => k.id)).toContain('ai');
  });
});

describe('PBL route', () => {
  it('parses #/pbl and tabs', () => {
    expect(parseRoute('#/pbl')).toEqual({ screen: 'pbl', tab: null });
    expect(parseRoute(hrefFor.pbl('portfolio'))).toEqual({ screen: 'pbl', tab: 'portfolio' });
  });
});
