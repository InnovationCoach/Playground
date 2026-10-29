// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { SAMPLE_EVALUATIONS } from './fixtures/evaluations.fixture.js';
import { newProgress, setSubmission } from '../src/features/pbl/programs/progress.js';

describe('Coach AI PBL Authoring Studio', () => {
  it('supports multi-modal student submissions', () => {
    let prog = newProgress('test-prog');
    prog = setSubmission(prog, 1, 'video', 'https://youtu.be/demo-vid');
    prog = setSubmission(prog, 1, 'github', 'https://github.com/welearn/robotics');

    expect(prog.sessions[1].submissions.video.url).toBe('https://youtu.be/demo-vid');
    expect(prog.sessions[1].submissions.github.url).toBe('https://github.com/welearn/robotics');
    expect(Number.isFinite(prog.sessions[1].submissions.video.submittedAt)).toBe(true);
  });

  it('manages coach evaluations desk with formative assessment and XP awards', async () => {
    const { getEvaluations, approveSubmission, requestRevisionSubmission, saveEvaluations } = await import('../src/features/coach/evaluation/evaluationsStore.js');
    expect(getEvaluations()).toEqual([]);
    saveEvaluations(structuredClone(SAMPLE_EVALUATIONS));
    const evals = getEvaluations();
    expect(evals.length).toBeGreaterThanOrEqual(3);

    const liamEval = evals.find((e) => e.studentName === 'Liam Chen');
    expect(liamEval).toBeDefined();
    expect(liamEval.submissions.video.url).toContain('youtube.com');
    expect(liamEval.submissions.github.repo).toContain('liam-chen');
    expect(liamEval.submissions.prototype.assetTag).toBe('MS-PRUSA-04');
    expect(liamEval.status).toBe('pending');

    const approved = approveSubmission(liamEval.id, {
      feedback: 'Outstanding motor telemetry calibration!',
      xp: 100,
      coachName: 'Coach Donovan'
    });
    expect(approved.status).toBe('approved');
    expect(approved.xpAwarded).toBe(100);
    expect(approved.coachFeedback).toBe('Outstanding motor telemetry calibration!');
  });

  // The learner-tailored unit synthesiser is retired; Course Maker publishes through the same
  // service, so these tests build a minimal open-catalog unit by hand.
  const openUnit = {
    id: 'pbl-open-test-mars-rover',
    unitTitle: 'Autonomous Mars Rover Telemetry',
    theme: 'Space Robotics',
    drivingQuestion: 'How can a rover report where it is?',
    realProblem: 'Rovers lose contact with base.',
    targetLearner: { id: 'universal-all', isUniversal: true },
    makerSpaceSpecs: [],
    coachCues: [],
    milestones: [{ stageNumber: 1, stageName: 'Curiosity', week: 1, title: 'Explore', learningGoal: 'Ask questions', activities: ['Brainstorm'], evidencePrompt: 'Photo of your question wall' }]
  };

  it('publishes program to open catalog without selecting a specific learner', async () => {
    const { publishProgramToCatalog } = await import('../src/features/coach/studio/pblTransferService.js');
    const { programById } = await import('../src/features/pbl/programs/catalog.js');

    const res = await publishProgramToCatalog(structuredClone(openUnit), 'coach-donovan');
    expect(res.success).toBe(true);
    expect(res.programId).toContain('pbl-open');
    expect(res.searchUrl).toContain('#/search');
    expect(res.studentUrl).toContain('#/pbl/programs');

    // Program resolves cleanly from library and catalog
    const resolved = programById(res.programId);
    expect(resolved).not.toBeNull();
    expect(resolved.title).toContain('Autonomous Mars Rover Telemetry');
    expect(resolved.visibility).toBe('centre');
    expect(resolved.status).toBe('published');
  });

  it('allows any learner to find published program on #/search and add/start it', async () => {
    const { buildCatalog, searchCatalog } = await import('../src/features/courses/catalog.js');
    const { getCustomPrograms } = await import('../src/features/coach/programs/customProgramsStore.js');
    const { addToMyCourse } = await import('../src/services/pblService.js');

    const custom = Object.values(getCustomPrograms());
    const catalog = buildCatalog({
      activities: [],
      programs: custom,
      includePartners: false
    });

    // Student searches for 'Mars' or 'Rover' or 'Telemetry'
    const results = searchCatalog(catalog, 'Mars Rover');
    expect(results.length).toBeGreaterThanOrEqual(1);
    const marsCourse = results.find((r) => r.title.includes('Mars Rover'));
    expect(marsCourse).toBeDefined();
    expect(marsCourse.source).toBe('program');

    // Any learner self-enrols in the course
    const studentUid = 'student-test-learner-99';
    const enrolRes = await addToMyCourse(marsCourse.id, studentUid);
    expect(enrolRes.success).toBe(true);
    expect(enrolRes.enrolmentId).toBe(`${studentUid}_${marsCourse.id}`);
  });
});
