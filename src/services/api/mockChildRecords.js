/**
 * Synthetic saved records for mock children, in the exact shapes the real app
 * stores (goalPlan, the PBL project, STEAM activity docs) plus an Edmentum
 * AGS-style result set. The mock backend feeds them through
 * buildChildProgress, the same function the real backend will use, so the
 * parent dashboard can be reviewed before any child has real work saved.
 *
 * Three profiles, so every state of the dashboard can be seen:
 *   active   - well into the term project, goals and habit, Edmentum connected
 *   starting - first week: one goal, one piece of evidence, no Edmentum yet
 *   new      - nothing saved yet
 * The demo invite child is always `active`; the rest are spread by uid.
 */
import { TERM } from '../../features/pbl/content/pblModel.js';
import { dayKey } from '../../features/goals/goalPlan.js';

const DAY = 86400000;

export const PROFILES = ['active', 'starting', 'new'];

export function profileFor(uid, demoUid) {
  if (uid === demoUid) return 'active';
  let h = 0;
  for (const ch of uid) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PROFILES[h % PROFILES.length];
}

function habitDays(now, pattern) {
  const days = {};
  pattern.forEach((on, i) => {
    if (!on) return;
    const d = new Date(now - (pattern.length - 1 - i) * DAY);
    days[dayKey(d)] = ['habit'];
  });
  return days;
}

function evidence(now, items) {
  return items.map(([phase, kind, title, competencies, daysAgo], i) => ({
    id: `ev-mock-${i}`, phase, kind, title, body: '(private to the learner)', link: '', competencies, createdAt: now - daysAgo * DAY
  }));
}

export function childRecords(profile, now = Date.now()) {
  if (profile === 'new') return { goalPlan: null, pblProject: null, activityDocs: {}, edmentum: { status: 'not_connected' } };

  if (profile === 'starting') {
    return {
      goalPlan: {
        version: 2, strengths: ['curious'], goals: [{ id: 'g1', explore: 'how plants grow without soil', steps: [
          { id: 's1', text: 'Watch a video about hydroponics', done: false },
          { id: 's2', text: 'Draw a simple setup', done: false },
          { id: 's3', text: 'Ask my coach for a container', done: false }
        ], done: false, createdAt: now - 3 * DAY }],
        focus: null, recharge: [], days: {}, updatedAt: now - 3 * DAY
      },
      pblProject: {
        termId: TERM.id, currentPhase: 'explore', tasksDone: { explore: [0] },
        problem: { hmw: '', who: '', why: '', criteria: '', constraints: '', impactMeasure: '' },
        evidence: evidence(now, [['explore', 'note', 'What I noticed in the plant lab', ['ctps-01'], 2]]),
        updatedAt: now - 2 * DAY
      },
      activityDocs: { 'plant-lab': { records: [{ id: 'r1' }], updatedAt: now - 2 * DAY } },
      edmentum: { status: 'not_connected' }
    };
  }

  return {
    goalPlan: {
      version: 2, strengths: ['building', 'curious'], supports: ['checklists'],
      goals: [
        { id: 'g1', explore: 'how to build a walking robot', steps: [
          { id: 's1', text: 'Sketch the leg design', done: true },
          { id: 's2', text: 'Build one leg from LEGO', done: true },
          { id: 's3', text: 'Program it to step with the micro:bit', done: false }
        ], done: false, createdAt: now - 20 * DAY },
        { id: 'g2', explore: 'presenting without notes', steps: [
          { id: 's4', text: 'Practise my intro twice', done: true }
        ], done: true, createdAt: now - 18 * DAY }
      ],
      focus: { skill: 'planning', habit: 'Plan my three tasks before starting', daysPerWeek: 5 },
      recharge: ['walk'],
      days: habitDays(now, [true, true, false, true, true, false, true]),
      updatedAt: now - 1 * DAY
    },
    pblProject: {
      termId: TERM.id, currentPhase: 'prototype',
      tasksDone: { explore: [0, 1, 2], empathise: [0, 1, 2], define: [0, 1, 2, 3], ideate: [0, 1, 2], prototype: [0] },
      problem: { hmw: 'How might we help younger students carry heavy school bags up the stairs?', who: 'Year 3 students', why: '', criteria: 'Carries 5 kg up one flight', constraints: '', impactMeasure: 'Fewer sore backs reported in a week' },
      impact: 'people', finalFormat: 'showcase',
      evidence: evidence(now, [
        ['explore', 'note', 'Solar car: which panel angle worked best', ['ctps-01', 'ctps-02'], 19],
        ['empathise', 'feedback', 'Interview with two Year 3 students', ['ec-01', 'sea-01'], 15],
        ['define', 'note', 'My problem statement, version 2', ['ctps-03', 'sdl-01'], 12],
        ['ideate', 'media', 'Sketches of three robot leg ideas', ['ct-01', 'ct-02'], 9],
        ['ideate', 'feedback', 'Peer feedback on my ideas', ['lc-01', 'ec-02'], 8],
        ['prototype', 'code', 'micro:bit code for one leg', ['ctps-04'], 4],
        ['prototype', 'ai', 'Asked the co-pilot why the servo jittered', ['sdl-04', 'ctps-04'], 2]
      ]),
      updatedAt: now - 2 * DAY
    },
    activityDocs: {
      'solar-car': { build: { panel: 'mono' }, updatedAt: now - 19 * DAY },
      'hex-grid': { cells: 4, updatedAt: now - 6 * DAY }
    },
    edmentum: {
      status: 'connected',
      syncedAt: now - 3 * 3600000,
      courses: [
        { id: 'edm-math', title: 'Mathematics', progressPercent: 46, lastActivityAt: now - 1 * DAY, recent: [
          { title: 'Unit 3 quiz: Linear equations', scoreGiven: 17, scoreMaximum: 20, submittedAt: now - 1 * DAY },
          { title: 'Unit 3 practice', scoreGiven: 8, scoreMaximum: 10, submittedAt: now - 3 * DAY },
          { title: 'Unit 2 test: Ratios', scoreGiven: 31, scoreMaximum: 40, submittedAt: now - 11 * DAY }
        ] },
        { id: 'edm-ela', title: 'English Language Arts', progressPercent: 38, lastActivityAt: now - 4 * DAY, recent: [
          { title: 'Reading check: Short stories', scoreGiven: 9, scoreMaximum: 10, submittedAt: now - 4 * DAY },
          { title: 'Persuasive paragraph', scoreGiven: 14, scoreMaximum: 20, submittedAt: now - 9 * DAY }
        ] }
      ]
    }
  };
}
