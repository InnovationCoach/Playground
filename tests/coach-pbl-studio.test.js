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

});
