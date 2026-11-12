// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/features/coach/evaluation/evaluationsStore.js', () => ({
  fetchSubmissions: vi.fn(),
  approveSubmission: vi.fn(),
  requestRevisionSubmission: vi.fn(),
  createSubmission: vi.fn(),
  STUDENT_SUBMISSIONS_CONNECTED: false
}));

vi.mock('../src/features/coach/evaluation/masteryIntegration.js', () => ({
  checkCompetencyMapping: vi.fn(),
  recordToMasteryTranscript: vi.fn()
}));

vi.mock('../src/features/goals/celebrate.js', () => ({
  confettiFrom: vi.fn(),
  buzz: vi.fn()
}));

import { fetchSubmissions, approveSubmission, createSubmission } from '../src/features/coach/evaluation/evaluationsStore.js';
import { checkCompetencyMapping, recordToMasteryTranscript } from '../src/features/coach/evaluation/masteryIntegration.js';
import { EvaluationDeskView } from '../src/features/coach/evaluation/EvaluationDeskView.jsx';

let host, root;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  vi.clearAllMocks();
});

afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  delete globalThis.IS_REACT_ACT_ENVIRONMENT;
});

const render = (props = {}) => act(async () => {
  root.render(
    <EvaluationDeskView
      coachUser={{ uid: 'coach-1', displayName: 'Coach Sarah', classIds: ['class-wls-pbl'] }}
      {...props}
    />
  );
});

describe('Evaluation Desk Mastery Transcript Integration', () => {
  const sampleSubmission = {
    id: 'sub-mars-1',
    submissionId: 'sub-mars-1',
    studentId: 'student-377',
    studentName: 'Sparky Tester',
    avatar: '🚀',
    classId: 'class-wls-pbl',
    schoolId: '15',
    projectTitle: 'Mars Habitat Engineering',
    milestoneTitle: 'Life Support Prototype',
    milestoneStage: 'Testing',
    sessionNumber: 1,
    status: 'pending',
    competencies: ['1.1.1 Goal Setting'],
    submissions: {
      video: { url: 'https://example.com/demo.mp4', title: 'Telemetry Walkthrough' },
      reflection: 'Iterated on the oxygen recycling valve and met our milestone targets.'
    },
    coachFeedback: '',
    xpAwarded: 0
  };

  it('keeps Record to Mastery Transcript toggle unchecked by default', async () => {
    fetchSubmissions.mockResolvedValue([sampleSubmission]);
    checkCompetencyMapping.mockResolvedValue({
      canRecord: true,
      credit: { id: 1372, title: '1.1.1 Goal Setting', area: 'Self-directed Learning', type: 'FOUNDATIONAL' }
    });

    await render();

    const checkbox = host.querySelector('.cp-mastery-toggle-card input[type="checkbox"]');
    expect(checkbox).not.toBeNull();
    expect(checkbox.checked).toBe(false);

    // Shows explanation note when unchecked
    expect(host.textContent).toContain('Explicit coach choice. Check to record an official earned competency in Mastery.');
  });

  it('disables Mastery toggle and explains when competency has no mapping, leaving ordinary approval available', async () => {
    const unmappedSubmission = {
      ...sampleSubmission,
      id: 'sub-unmapped',
      competencies: ['9.9.9 Martian Astro-biology']
    };
    fetchSubmissions.mockResolvedValue([unmappedSubmission]);
    checkCompetencyMapping.mockResolvedValue({
      canRecord: false,
      reason: 'No verified Mastery credit mapping found for competency "9.9.9 Martian Astro-biology". Ordinary approval is available.'
    });

    await render();

    const checkbox = host.querySelector('.cp-mastery-toggle-card input[type="checkbox"]');
    expect(checkbox).not.toBeNull();
    expect(checkbox.disabled).toBe(true);
    expect(host.textContent).toContain('No verified Mastery credit mapping found');
    expect(host.textContent).toContain('Ordinary approval is available.');

    // Ordinary approval button remains available and enabled
    const approveBtn = host.querySelector('.cp-btn-approve');
    expect(approveBtn).not.toBeNull();
    expect(approveBtn.disabled).toBe(false);
    expect(approveBtn.textContent).toContain('Approve & Award +100 XP');
  });

  it('approves ordinarily without calling Mastery when toggle is left off', async () => {
    fetchSubmissions.mockResolvedValue([sampleSubmission]);
    checkCompetencyMapping.mockResolvedValue({
      canRecord: true,
      credit: { id: 1372, title: '1.1.1 Goal Setting', area: 'Self-directed Learning', type: 'FOUNDATIONAL' }
    });
    approveSubmission.mockResolvedValue({ status: 'approved' });

    await render();

    const approveBtn = host.querySelector('.cp-btn-approve');
    await act(async () => approveBtn.click());

    expect(approveSubmission).toHaveBeenCalledWith('sub-mars-1', expect.objectContaining({
      xp: 100,
      coachUid: 'coach-1'
    }));
    // Mastery endpoint MUST NOT be called when toggle was off
    expect(recordToMasteryTranscript).not.toHaveBeenCalled();
  });

  it('calls both approve and recordToMasteryTranscript when toggle is checked', async () => {
    fetchSubmissions.mockResolvedValue([sampleSubmission]);
    checkCompetencyMapping.mockResolvedValue({
      canRecord: true,
      credit: { id: 1372, title: '1.1.1 Goal Setting', area: 'Self-directed Learning', type: 'FOUNDATIONAL' }
    });
    approveSubmission.mockResolvedValue({ status: 'approved' });
    recordToMasteryTranscript.mockResolvedValue({
      success: true,
      mastery: {
        status: 'recorded',
        creditId: 1372,
        creditTitle: '1.1.1 Goal Setting',
        learnerId: 377,
        evidenceId: 42
      }
    });

    await render();

    const checkbox = host.querySelector('.cp-mastery-toggle-card input[type="checkbox"]');
    await act(async () => checkbox.click());
    expect(checkbox.checked).toBe(true);
    expect(host.textContent).toContain('MCA Credit: 1372');

    const approveBtn = host.querySelector('.cp-btn-approve');
    expect(approveBtn.textContent).toContain('Approve & Record to Mastery');

    await act(async () => approveBtn.click());

    expect(approveSubmission).toHaveBeenCalledWith('sub-mars-1', expect.any(Object));
    expect(recordToMasteryTranscript).toHaveBeenCalledWith('sub-mars-1', expect.objectContaining({
      competency: '1.1.1 Goal Setting'
    }));
  });

  it('handles partial failure: SPARK approval succeeds but Mastery fails with an independent retry action', async () => {
    fetchSubmissions.mockResolvedValue([sampleSubmission]);
    checkCompetencyMapping.mockResolvedValue({
      canRecord: true,
      credit: { id: 1372, title: '1.1.1 Goal Setting' }
    });
    approveSubmission.mockResolvedValue({ status: 'approved' });
    const masteryError = new Error('Mastery Sandbox timed out');
    masteryError.canRetry = true;
    masteryError.evidenceId = 42;
    recordToMasteryTranscript.mockRejectedValue(masteryError);

    await render();

    // Check the toggle
    const checkbox = host.querySelector('.cp-mastery-toggle-card input[type="checkbox"]');
    await act(async () => checkbox.click());

    // Click approve
    const approveBtn = host.querySelector('.cp-btn-approve');
    await act(async () => approveBtn.click());

    // SPARK approval succeeded
    expect(approveSubmission).toHaveBeenCalledTimes(1);

    // Error banner with Retry button is rendered
    expect(host.textContent).toContain('Mastery recording failed: Mastery Sandbox timed out');
    const retryBtn = [...host.querySelectorAll('button')].find((b) => b.textContent.includes('Retry Mastery Record'));
    expect(retryBtn).not.toBeNull();

    // Clicking retry calls recordToMasteryTranscript without re-approving SPARK
    recordToMasteryTranscript.mockResolvedValueOnce({
      success: true,
      mastery: { status: 'recorded', creditId: 1372, learnerId: 377 }
    });

    await act(async () => retryBtn.click());

    expect(recordToMasteryTranscript).toHaveBeenCalledTimes(2);
    expect(approveSubmission).toHaveBeenCalledTimes(1); // Not duplicated!
  });

  it('can seed a synthetic deliverable through the normal evaluation entry point (createSubmission)', async () => {
    window.history.replaceState(null, '', '?emulators=1');
    fetchSubmissions.mockResolvedValue([]);
    createSubmission.mockResolvedValue({ id: 'sub-synthetic-1' });

    try {
      await render();
      const seedBtn = [...host.querySelectorAll('button')].find((b) => b.textContent.includes('Seed sample deliverable'));
      expect(seedBtn).not.toBeNull();

      await act(async () => seedBtn.click());

      expect(createSubmission).toHaveBeenCalledWith(expect.objectContaining({
        studentName: 'Sparky Tester',
        competencies: ['1.1.1 Goal Setting'],
        milestoneStage: 'Prototyping'
      }));
    } finally {
      window.history.replaceState(null, '', window.location.pathname);
    }
  });
});
