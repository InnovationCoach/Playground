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
