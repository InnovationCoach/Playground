// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/features/universe/universeApi.js', () => ({
  getCoachSubmissions: vi.fn(),
  reviewSubmission: vi.fn()
}));

const { CoachUniverseSubmissions } = await import('../src/features/coach/universe/CoachUniverseSubmissions.jsx');
const { getCoachSubmissions, reviewSubmission } = await import('../src/features/universe/universeApi.js');

let host, root;
const text = () => document.body.textContent;
const buttonNamed = (name) => [...document.body.querySelectorAll('button')].find((b) => b.textContent.includes(name));

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

describe('CoachUniverseSubmissions Component', () => {
  it('renders empty pending message when no submissions are awaiting review', async () => {
    getCoachSubmissions.mockResolvedValueOnce({ submissions: [] });

    await act(async () => {
      root.render(<CoachUniverseSubmissions coachUser={{ uid: 'coach_alpha', classIds: ['class_orbit_a'] }} />);
    });

    expect(text()).toContain('My Universe · Mission Reviews');
    expect(text()).toContain('No mission submissions awaiting review in your classes.');
  });

  it('renders pending submissions with reflection and handles approval', async () => {
    const mockSubs = [
      {
        id: 'sub-101',
        learnerUid: 'learner_a',
        missionId: 'spacecraft-journey',
        routeId: 'guided',
        classIds: ['class_orbit_a'],
        reflection: 'I recommend the chemical rocket with 42-day transit duration.',
        status: 'submitted',
        createdAt: new Date().toISOString()
      }
    ];
    getCoachSubmissions.mockResolvedValueOnce({ submissions: mockSubs });
    reviewSubmission.mockResolvedValueOnce({ status: 'approved' });

    await act(async () => {
      root.render(<CoachUniverseSubmissions coachUser={{ uid: 'coach_alpha', classIds: ['class_orbit_a'] }} />);
    });

    expect(text()).toContain('spacecraft-journey');
    expect(text()).toContain('guided route');
    expect(text()).toContain('learner_a');
    expect(text()).toContain('I recommend the chemical rocket with 42-day transit duration.');

    // Approve the submission
    const approveBtn = buttonNamed('Approve & Unlock Planet');
    expect(approveBtn).toBeDefined();

    await act(async () => {
      approveBtn.click();
    });

    expect(reviewSubmission).toHaveBeenCalledWith({
      submissionId: 'sub-101',
      decision: 'approved',
      note: undefined
    });
  });

  it('handles returning a submission for revision with a coach note', async () => {
    const mockSubs = [
      {
        id: 'sub-102',
        learnerUid: 'learner_b',
        missionId: 'spacecraft-journey',
        routeId: 'advanced',
        classIds: ['class_orbit_b'],
        reflection: 'Advanced route calculation of mass ratio and propellant burn.',
        status: 'submitted',
        createdAt: new Date().toISOString()
      }
    ];
    getCoachSubmissions.mockResolvedValueOnce({ submissions: mockSubs });
    reviewSubmission.mockResolvedValueOnce({ status: 'returned' });

    await act(async () => {
      root.render(<CoachUniverseSubmissions coachUser={{ uid: 'coach_beta', classIds: ['class_orbit_b'] }} />);
    });

    const noteInput = host.querySelector('#coach-note-sub-102');
    expect(noteInput).toBeDefined();

    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(noteInput, 'Please double-check the food mass multiplier.');
      noteInput.dispatchEvent(new Event('input', { bubbles: true }));
      noteInput.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const returnBtn = buttonNamed('Return for Revision');
    await act(async () => {
      returnBtn.click();
    });

    expect(reviewSubmission).toHaveBeenCalledWith({
      submissionId: 'sub-102',
      decision: 'returned',
      note: 'Please double-check the food mass multiplier.'
    });
  });
});
