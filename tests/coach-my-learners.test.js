/**
 * My Learners (coach): attention status from agreed dates and recorded
 * evidence, "not available" for missing data, self-assessment kept apart from
 * coach judgement, and parent reports built only from shareable records.
 * src/features/coach/myLearners/
 */
import { describe, it, expect } from 'vitest';
import {
  buildLearner, filterLearners, statusCounts, competencyRows, buildReportDraft, defaultPeriod, daysBetween, termProjectDocId
} from '../src/features/coach/myLearners/myLearnersModel.js';
import {
  emptyRecords, hydrateRecords, addGoal, setGoalDone, addCheckIn, addNote, addMilestone, setMilestoneDone, setFeedback, addAssessment, addCoachEvidence,
  saveReport, approveReport
} from '../src/features/coach/myLearners/coachRecordsStore.js';
import { parseRoute, hrefFor } from '../src/app/routes.js';
import { TERM } from '../src/features/pbl/content/pblModel.js';
import { translate, messages } from '../src/app/i18n/messages.js';

const TODAY = '2026-10-26';
const at = (day, h = 10) => new Date(`${day}T${String(h).padStart(2, '0')}:00:00`).getTime();
const user = (over = {}) => ({ uid: 'u1', givenNames: 'Mia', surname: 'Chen', email: 'mia@school.edu', classIds: ['c1'], status: 'active', yearLevel: 'Year 9', ...over });
const project = (over = {}) => ({
  id: termProjectDocId(),
  data: {
    version: 1, termId: TERM.id, currentPhase: 'prototype', interests: [], sparks: '',
    problem: { hmw: 'How might we keep the school garden watered over the holidays?', who: '', why: '', criteria: '', constraints: '', impactMeasure: '' },
    impact: 'environment', codeLanguage: 'micropython', finalFormat: null,
    tasksDone: { prototype: [0] },
    evidence: [
      { id: 'ev-1', phase: 'prototype', kind: 'media', title: 'Moisture sensor test', body: 'Readings every 10 min', link: 'https://example.org/v', competencies: ['ctps-01'], createdAt: at('2026-10-22') },
      { id: 'ev-2', phase: 'define', kind: 'note', title: 'Interview notes', body: '', link: '', competencies: [], createdAt: at('2026-09-01') }
    ],
    updatedAt: at('2026-10-22'),
    ...over
  }
});
const build = (raw, records = emptyRecords(), opts = {}) => buildLearner({ user: user(), progress: [], stats: [], ...raw }, records, { today: TODAY, ...opts });
const apply = (records, res) => { expect(res.error).toBeUndefined(); return res.records; };

describe('a learner with no records', () => {
  const l = build({});
  it('shows missing data as not available, not as poor progress', () => {
    expect(l.project).toBeNull();
    expect(l.currentProjectTitle).toBeNull();
    expect(l.academic.connected).toBe(false);
    expect(l.next).toBeNull();
    expect(l.evidence).toEqual([]);
  });
  it('is only flagged for the coach action that is missing: a first check-in', () => {
    expect(l.status.id).toBe('checkin');
    expect(l.reasons).toEqual([{ status: 'checkin', code: 'noCheckIn' }]);
    expect(l.reasons.some((r) => r.status === 'overdue' || r.status === 'feedback')).toBe(false);
  });
});

describe('attention status', () => {
  it('flags recent learner evidence without feedback, and not old evidence', () => {
    const l = build({ progress: [project()] });
    const r = l.reasons.find((x) => x.code === 'evidenceWaiting');
    expect(r).toMatchObject({ count: 1, days: 4 });
    expect(l.waitingKeys).toEqual(['proj:ev-1']);
  });

  it('clears "awaiting feedback" once the coach gives feedback', () => {
    let rec = emptyRecords();
    rec = apply(rec, setFeedback(rec, 'proj:ev-1', 'Great test design', at(TODAY)));
    const l = build({ progress: [project()] }, rec);
    expect(l.reasons.some((x) => x.code === 'evidenceWaiting')).toBe(false);
    expect(l.evidence.find((e) => e.key === 'proj:ev-1').feedback.text).toBe('Great test design');
  });

  it('puts an overdue agreed milestone first, with its date', () => {
    let rec = emptyRecords();
    rec = apply(rec, addMilestone(rec, { title: 'Prototype test log', dueOn: '2026-10-21' }));
    rec = apply(rec, addCheckIn(rec, { nextAction: 'Write test log', followUpOn: '2026-11-02' }, at('2026-10-20')));
    const l = build({ progress: [project()] }, rec);
    expect(l.status.id).toBe('overdue');
    expect(l.status.urgent).toBe(true);
    expect(l.reasons[0]).toMatchObject({ code: 'milestoneOverdue', title: 'Prototype test log', dueOn: '2026-10-21', days: 5 });
    expect(l.next).toMatchObject({ type: 'milestone', title: 'Prototype test log', state: 'overdue' });
  });

  it('a done milestone is not overdue', () => {
    let rec = emptyRecords();
    rec = apply(rec, addMilestone(rec, { title: 'Sketch', dueOn: '2026-10-21' }));
    rec = apply(rec, setMilestoneDone(rec, rec.milestones[0].id, '2026-10-20'));
    rec = apply(rec, addCheckIn(rec, { nextAction: 'Build', followUpOn: '2026-11-02' }, at('2026-10-20')));
    const l = build({}, rec);
    expect(l.status.id).toBe('ontrack');
  });

  it('a check-in is due on and after its follow-up date', () => {
    let rec = emptyRecords();
    rec = apply(rec, addCheckIn(rec, { nextAction: 'Build', followUpOn: TODAY }, at('2026-10-19')));
    expect(build({}, rec).reasons[0]).toMatchObject({ code: 'followUpDue', days: 0 });
  });

  it('next step falls back to a class deadline, then an undated program session', () => {
    let rec = emptyRecords();
    rec = apply(rec, addCheckIn(rec, { nextAction: 'Build', followUpOn: '2026-11-02' }, at('2026-10-20')));
    const assignments = [{ id: 'a1', title: 'Essay', classId: 'c1', dueAt: at('2026-10-30') }, { id: 'a2', title: 'Other class', classId: 'c9', dueAt: at('2026-10-27') }];
    expect(build({}, rec, { assignments }).next).toMatchObject({ type: 'assignment', title: 'Essay', dueOn: '2026-10-30' });
    expect(build({}, rec).next).toBeNull();
  });
});

describe('home filters', () => {
  const a = { ...build({}), uid: 'a', name: 'Zoe', status: { id: 'overdue', rank: 0 } };
  const b = { ...build({}), uid: 'b', name: 'Adam', status: { id: 'ontrack', rank: 3 } };
  const c = { ...build({}), uid: 'c', name: 'Mia', status: { id: 'checkin', rank: 2 }, currentProjectTitle: 'Garden watering' };
  it('sorts by urgency, then name', () => {
    expect(filterLearners([b, c, a]).map((l) => l.uid)).toEqual(['a', 'c', 'b']);
  });
  it('filters needs-attention and searches project titles', () => {
    expect(filterLearners([a, b, c], { filter: 'attention' }).map((l) => l.uid)).toEqual(['a', 'c']);
    expect(filterLearners([a, b, c], { query: 'garden' }).map((l) => l.uid)).toEqual(['c']);
    expect(statusCounts([a, b, c])).toMatchObject({ all: 3, attention: 2, overdue: 1, ontrack: 1, checkin: 1 });
  });
});

describe('competencies', () => {
  it('keeps the learner tag and the coach judgement in separate columns', () => {
    let rec = emptyRecords();
    rec = apply(rec, addAssessment(rec, { competencyId: 'ctps-01', level: 'support', evidenceKeys: ['proj:ev-1'] }, at(TODAY)));
    const l = build({ progress: [project()] }, rec);
    const row = competencyRows(l, rec).find((r) => r.id === 'ctps-01');
    expect(row.selfEvidenceCount).toBe(1);
    expect(row.coach.level).toBe('support');
    expect(l.evidence.find((e) => e.key === 'proj:ev-1').assessments).toHaveLength(1);
  });
  it('requires evidence for a demonstrated level, and a known competency', () => {
    const rec = emptyRecords();
    expect(addAssessment(rec, { competencyId: 'ctps-01', level: 'independent' }).error).toBe('evidenceRequired');
    expect(addAssessment(rec, { competencyId: 'nope', level: 'support', evidenceKeys: ['x'] }).error).toBe('competencyRequired');
    expect(addAssessment(rec, { competencyId: 'ctps-01', level: 'insufficient' }).error).toBeUndefined();
  });
});

describe('check-ins and notes', () => {
  it('turns the next action into a milestone in one step', () => {
    let rec = emptyRecords();
    rec = apply(rec, addCheckIn(rec, { strength: 'Careful testing', nextAction: 'Write the test log', followUpOn: '2026-11-02', asMilestone: true }, at(TODAY)));
    expect(rec.milestones).toHaveLength(1);
    expect(rec.milestones[0]).toMatchObject({ title: 'Write the test log', dueOn: '2026-11-02', fromCheckIn: rec.checkIns[0].id });
  });
  it('validates input', () => {
    const rec = emptyRecords();
    expect(addCheckIn(rec, { nextAction: '', followUpOn: TODAY }).error).toBe('checkInEmpty');
    expect(addCheckIn(rec, { strength: 'x', followUpOn: TODAY }).error).toBe('nextActionRequired');
    expect(addCheckIn(rec, { nextAction: 'x' }).error).toBe('followUpRequired');
    expect(addNote(rec, { text: 'x', visibility: 'everyone' }).error).toBe('noteVisibility');
    expect(addCoachEvidence(rec, { kind: 'media', title: 'Photo', link: 'javascript:alert(1)' }).error).toBe('evidenceLink');
    expect(addCoachEvidence(rec, { kind: 'media', title: 'Photo' }).error).toBe('evidenceLinkRequired');
  });
  it('drops malformed stored records instead of trusting them', () => {
    const rec = hydrateRecords({ notes: [{ id: 'n1', text: 'x', visibility: 'public' }, { id: 'n2', text: 'y', visibility: 'private' }], checkIns: 'nope' });
    expect(rec.notes.map((n) => n.id)).toEqual(['n2']);
    expect(rec.checkIns).toEqual([]);
  });
});

describe('parent report', () => {
  const period = { from: '2026-10-01', to: TODAY };
  const recordsWith = () => {
    let rec = emptyRecords();
    rec = apply(rec, addCheckIn(rec, { strength: 'SHARED strength', challenge: 'SHARED challenge', nextAction: 'SHARED next', followUpOn: '2026-11-02', shareWithParent: true }, at('2026-10-10')));
    rec = apply(rec, addCheckIn(rec, { strength: 'PRIVATE strength', nextAction: 'PRIVATE next', followUpOn: '2026-11-02' }, at('2026-10-12')));
    rec = apply(rec, addNote(rec, { text: 'PRIVATE note about family', visibility: 'private' }, at('2026-10-11')));
    rec = apply(rec, addNote(rec, { text: 'Ask about the sensor at dinner', visibility: 'parent' }, at('2026-10-11')));
    rec = apply(rec, addAssessment(rec, { competencyId: 'ctps-01', level: 'independent', evidenceKeys: ['proj:ev-1'] }, at('2026-10-23')));
    return rec;
  };
  const draftFor = (rec, learner) => buildReportDraft(learner, { checkIns: rec.checkIns, sharedNotes: rec.notes.filter((n) => n.visibility === 'parent'), assessments: rec.assessments }, period);

  it('uses only check-ins approved for sharing, and never private notes', () => {
    const rec = recordsWith();
    const d = draftFor(rec, build({ progress: [project()] }, rec));
    const all = JSON.stringify(d);
    expect(d.text.strengths).toBe('SHARED strength');
    expect(d.text.home).toBe('Ask about the sensor at dinner');
    expect(all).not.toContain('PRIVATE');
  });

  it('includes evidence and judgements from the period only, and pre-selects judged evidence', () => {
    const rec = recordsWith();
    const d = draftFor(rec, build({ progress: [project()] }, rec));
    expect(d.evidenceOptions.map((e) => e.key)).toEqual(['proj:ev-1']);
    expect(d.selectedEvidence).toEqual(['proj:ev-1']);
    expect(d.competencies).toMatchObject([{ id: 'ctps-01', level: 'independent' }]);
    expect(d.facts).toMatchObject({ stage: 'Prototype', tasksDone: 1, independent: 1, withSupport: 0 });
  });

  it('flags missing and outdated data rather than filling it in', () => {
    const d = buildReportDraft(build({}), {}, period);
    const ids = d.flags.map((f) => f.id);
    expect(ids).toEqual(expect.arrayContaining(['academicUnavailable', 'noProject', 'noMilestones', 'noEvidence', 'noAssessments', 'noSharedCheckIn']));
    expect(d.text).toEqual({ strengths: '', challenges: '', nextSteps: '', home: '', narrative: '' });
    const stale = buildReportDraft(build({ progress: [project({ updatedAt: at('2026-08-01'), evidence: [] })] }), {}, period);
    expect(stale.flags.find((f) => f.id === 'stale')).toMatchObject({ day: '2026-08-01' });
  });

  it('an approved report goes back to draft when it is saved again', () => {
    let rec = emptyRecords();
    const saved = saveReport(rec, { period, text: { narrative: 'x' }, selectedEvidence: [] }, at(TODAY));
    rec = saved.records;
    rec = apply(rec, approveReport(rec, saved.id, at(TODAY, 11)));
    expect(rec.reports[0].status).toBe('approved');
    rec = saveReport(rec, { ...rec.reports[0], text: { narrative: 'y' } }, at(TODAY, 12)).records;
    expect(rec.reports[0]).toMatchObject({ status: 'draft', approvedAt: null });
  });

  it('defaults to the last 4 weeks', () => {
    const p = defaultPeriod(TODAY);
    expect(p.to).toBe(TODAY);
    expect(daysBetween(p.from, p.to)).toBe(27);
  });
});

describe('routes', () => {
  it('parses coach sub-pages and round-trips hrefs', () => {
    expect(parseRoute('#/coach/dashboard')).toEqual({ screen: 'coach', page: 'home' });
    expect(parseRoute('#/coach')).toEqual({ screen: 'coach', page: 'home' });
    expect(parseRoute('#/coach/classes')).toEqual({ screen: 'coach', page: 'classes' });
    expect(parseRoute(hrefFor.coachLearner('u 1'))).toEqual({ screen: 'coach', page: 'learner', uid: 'u 1', tab: 'overview' });
    expect(parseRoute(hrefFor.coachLearner('u1', 'evidence'))).toMatchObject({ tab: 'evidence' });
    expect(parseRoute('#/coach/learners/u1/bogus')).toMatchObject({ tab: 'overview' });
    expect(parseRoute(hrefFor.coachReport('u1'))).toEqual({ screen: 'coach', page: 'report', uid: 'u1' });
  });
});

describe('interface text', () => {
  it('has every My Learners key in English, Chinese and Thai', () => {
    const keys = Object.keys(messages.en).filter((k) => k.startsWith('ml.'));
    expect(keys.length).toBeGreaterThan(200);
    for (const l of ['zh', 'th']) expect(keys.filter((k) => !messages[l][k])).toEqual([]);
    expect(translate('en', 'ml.reason.milestoneOverdue', { title: 'A', date: '1 Oct', days: 3 })).toBe('“A” was due 1 Oct (3 days ago)');
  });
});

describe('content faults', () => {
  it('counts a program session once even when the program repeats a session number', () => {
    const doc = { id: 'pbl-program-entrepreneurship-product-creation-2026', data: { version: 1, programId: 'entrepreneurship-product-creation-2026', startedAt: at('2026-10-01'), tools: {}, sessions: { 1: { done: true, reflection: 'Found three frictions' } }, updatedAt: at('2026-10-24') } };
    const l = build({ progress: [doc] });
    expect(l.evidence.filter((e) => e.key.startsWith('prog:'))).toHaveLength(1);
  });
  it('counts missions from the catalog program', () => {
    const doc = { id: 'pbl-program-entrepreneurship-product-creation-2026', data: { version: 1, programId: 'entrepreneurship-product-creation-2026', startedAt: at('2026-10-01'), tools: {}, sessions: { 1: { done: true } }, updatedAt: at('2026-10-24') } };
    expect(build({ progress: [doc] }).programs[0]).toMatchObject({ countReliable: true, done: 1 });
  });
  it('withholds mission counts when a program repeats session numbers, instead of counting one tick several times', () => {
    // A coach-authored program saved on the device (customProgramsStore) overrides the catalog copy.
    const store = { 'hearisland.custom_pbl_programs.v1': JSON.stringify({ 'dup-prog': {
      id: 'dup-prog', title: 'Dup', phases: [{ id: 'p1', title: 'P1', sessions: [{ sessionNumber: 1, title: 'A', activities: [] }, { sessionNumber: 1, title: 'B', activities: [] }] }]
    } }) };
    globalThis.window = { localStorage: { getItem: (k) => store[k] ?? null, setItem() {} }, dispatchEvent() {} };
    try {
      const doc = { id: 'pbl-program-dup-prog', data: { version: 1, programId: 'dup-prog', startedAt: at('2026-10-01'), tools: {}, sessions: { 1: { done: true } }, updatedAt: at('2026-10-24') } };
      const l = build({ progress: [doc] });
      expect(l.programs[0]).toMatchObject({ countReliable: false, done: null, total: null });
      expect(buildReportDraft(l, {}, { from: '2026-10-01', to: TODAY }).flags.map((f) => f.id)).toContain('programCount');
    } finally {
      delete globalThis.window;
    }
  });
});

describe('program phase submissions', () => {
  const enrol = (phaseData, id = 'u1_entrepreneurship-product-creation-2026') => ({
    id, data: { learnerId: 'u1', programId: 'entrepreneurship-product-creation-2026', status: 'active' },
    phases: [{ id: 'empathize', data: phaseData }]
  });
  const submitted = { status: 'submitted', evidence: [{ type: 'link', url: 'https://example.org/demo', note: 'Prototype video', at: at('2026-10-24') }, { type: 'text', url: 'javascript:alert(1)', note: '', at: at('2026-10-25') }], updatedAt: at('2026-10-25') };

  it('shows a submitted phase as evidence awaiting feedback, with only safe links', () => {
    const l = build({ enrolments: [enrol(submitted)] });
    const e = l.evidence.find((x) => x.key.startsWith('phase:'));
    expect(e).toMatchObject({ kind: 'submission', awaiting: true, remote: { enrolmentId: 'u1_entrepreneurship-product-creation-2026', phaseId: 'empathize' } });
    expect(e.links).toEqual(['https://example.org/demo']);
    expect(l.status.id).toBe('feedback');
    expect(l.waitingKeys).toContain(e.key);
  });

  it('a reviewed phase is not waiting, and its feedback comes from the record, not the device', () => {
    let rec = emptyRecords();
    rec = apply(rec, setFeedback(rec, 'phase:u1_entrepreneurship-product-creation-2026:empathize', 'device copy', at(TODAY)));
    const l = build({ enrolments: [enrol({ ...submitted, status: 'reviewed', coachFeedback: { text: 'Clear video', coachId: 'c1', at: at(TODAY) } })] }, rec);
    const e = l.evidence.find((x) => x.key.startsWith('phase:'));
    expect(e.awaiting).toBe(false);
    expect(e.feedback).toMatchObject({ text: 'Clear video', remote: true });
    expect(e.at).toBe(at('2026-10-25'));
    expect(l.waitingKeys).not.toContain(e.key);
  });

  it('a resubmission after feedback waits again, however old', () => {
    const l = build({ enrolments: [enrol({ ...submitted, updatedAt: at('2026-08-01'), evidence: [{ type: 'text', note: 'v2', at: at('2026-08-01') }], coachFeedback: { text: 'Try again', at: at('2026-07-30') } })] });
    expect(l.evidence.find((x) => x.key.startsWith('phase:'))).toMatchObject({ awaiting: true });
    expect(l.status.id).toBe('feedback');
  });

  it('skips untouched phases', () => {
    expect(build({ enrolments: [enrol({ status: 'in_progress', evidence: [] })] }).evidence).toEqual([]);
  });
});

describe('submission feedback record', async () => {
  const { feedbackRecord } = await import('../src/features/coach/myLearners/submissionFeedback.js');
  it('carries no invented rating', () => {
    expect(feedbackRecord('  Good  ', 'c1', 5)).toEqual({ text: 'Good', coachId: 'c1', at: 5 });
    expect(feedbackRecord('   ', 'c1')).toBeNull();
  });
});

describe('goals set by coaches', () => {
  it('adds, marks met and validates', () => {
    let rec = emptyRecords();
    rec = apply(rec, addGoal(rec, { text: 'Explain the test results to a Year 7', dueOn: '2026-11-20' }, at(TODAY)));
    expect(rec.goals[0]).toMatchObject({ text: 'Explain the test results to a Year 7', dueOn: '2026-11-20', doneOn: null });
    rec = apply(rec, setGoalDone(rec, rec.goals[0].id, TODAY));
    expect(rec.goals[0].doneOn).toBe(TODAY);
    expect(addGoal(rec, { text: '  ' }).error).toBe('goalText');
    expect(addGoal(rec, { text: 'x', dueOn: 'soon' }).error).toBe('milestoneDate');
    expect(apply(rec, addGoal(rec, { text: 'No date' })).goals[1].dueOn).toBeNull();
  });
  it('are never mixed into the learner\'s own goals', () => {
    let rec = emptyRecords();
    rec = apply(rec, addGoal(rec, { text: 'Coach goal' }));
    expect(build({}, rec).goals).toEqual([]);
  });
});
