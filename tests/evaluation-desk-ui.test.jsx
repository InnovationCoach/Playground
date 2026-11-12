// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/features/coach/evaluation/evaluationsStore.js', () => ({
  fetchSubmissions: vi.fn(),
  approveSubmission: vi.fn(),
  requestRevisionSubmission: vi.fn(),
  STUDENT_SUBMISSIONS_CONNECTED: false
}));
vi.mock('../src/features/goals/celebrate.js', () => ({ confettiFrom: vi.fn(), buzz: vi.fn() }));

import { fetchSubmissions } from '../src/features/coach/evaluation/evaluationsStore.js';
import { EvaluationDeskView } from '../src/features/coach/evaluation/EvaluationDeskView.jsx';

let host, root;
beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount()); host.remove(); vi.clearAllMocks();
  delete globalThis.IS_REACT_ACT_ENVIRONMENT;
});
const render = () => act(async () => root.render(<EvaluationDeskView coachUser={{ uid: 'coach-1', classIds: ['class-1'] }} />));

describe('Evaluation Desk while student submissions are not connected', () => {
  it('says the desk is not yet connected instead of implying work is coming', async () => {
    fetchSubmissions.mockResolvedValue([]);
    await render();
    expect(host.querySelector('.cp-eval-notice').textContent).toContain('Not yet connected');
    expect(host.textContent).toContain('No submissions yet.');
    expect(host.querySelector('[role=alert]')).toBeNull();
  });

  it('shows a failed load as an error with a retry, not as an empty queue', async () => {
    fetchSubmissions.mockRejectedValueOnce(new Error('permission-denied')).mockResolvedValueOnce([]);
    await render();
    expect(host.querySelector('[role=alert]').textContent).toContain("couldn't be loaded");
    expect(host.textContent).not.toContain('No submissions yet.');
    await act(async () => [...host.querySelectorAll('button')].find(b => b.textContent === 'Try again').click());
    expect(fetchSubmissions).toHaveBeenCalledTimes(2);
    expect(host.querySelector('[role=alert]')).toBeNull();
    expect(host.textContent).toContain('No submissions yet.');
  });
});

it('simulates both Mastery choices without submitting a review', async () => {
  window.history.replaceState(null, '', '?emulators=1');
  fetchSubmissions.mockResolvedValue([]);
  const clickButton = (label) => act(async () => {
    [...host.querySelectorAll('button')].find((button) => button.textContent.trim() === label).click();
  });

  try {
    await render();
    await clickButton('Preview Mastery transcript');
    const toggle = host.querySelector('[aria-label="Mastery transcript preview"] input');
    expect(toggle.checked).toBe(false);
    await act(async () => toggle.click());
    expect(host.textContent).toContain('MCA 1372');
    await clickButton('Simulate approval and Mastery credit');
    expect(host.textContent).toContain('Simulated approval and Mastery credit.');

    await clickButton('Hide sample');
    await clickButton('Preview Mastery transcript');
    await clickButton('Simulate approval');
    expect(host.textContent).toContain('Simulated approval.');
    expect(fetchSubmissions).toHaveBeenCalledTimes(1);
  } finally {
    window.history.replaceState(null, '', window.location.pathname);
  }
});
