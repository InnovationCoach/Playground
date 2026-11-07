// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/firebase.js', () => ({
  db: {}, collection: vi.fn(), query: vi.fn(), where: vi.fn(), getDocs: vi.fn(),
  doc: vi.fn((_db, ...parts) => parts.join('/')), getDoc: vi.fn(), setDoc: vi.fn(),
  updateDoc: vi.fn(), deleteDoc: vi.fn(), orderBy: vi.fn()
}));

import { updateDoc } from '../src/firebase.js';
import { approveSubmission, getEvaluations, requestRevisionSubmission } from '../src/features/coach/evaluation/evaluationsStore.js';

describe('coach evaluations store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateDoc.mockResolvedValue(undefined);
  });

  it('offers no invented evaluations', () => {
    expect(getEvaluations()).toEqual([]);
  });

  it('saves an approval with feedback, XP and the reviewing coach', async () => {
    const patch = await approveSubmission('sub-1', { feedback: 'Strong telemetry work.', xp: 100, coachUid: 'coach-1' });
    expect(updateDoc).toHaveBeenCalledWith('submissions/sub-1', patch);
    expect(patch).toMatchObject({ status: 'approved', coachFeedback: 'Strong telemetry work.', xpAwarded: 100, evaluatedBy: 'coach-1' });
    expect(Number.isFinite(patch.evaluatedAt)).toBe(true);
  });

  it('saves a revision request with the coach guidance and no XP', async () => {
    const patch = await requestRevisionSubmission('sub-2', { guidance: 'Add your test results.', coachUid: 'coach-1' });
    expect(updateDoc).toHaveBeenCalledWith('submissions/sub-2', patch);
    expect(patch).toMatchObject({ status: 'revision_requested', coachFeedback: 'Add your test results.', evaluatedBy: 'coach-1' });
    expect(patch).not.toHaveProperty('xpAwarded');
  });

  it('passes a failed save to the caller and does not announce an update', async () => {
    updateDoc.mockRejectedValue(new Error('permission-denied'));
    const updated = vi.fn();
    window.addEventListener('hearisland-evaluations-updated', updated);
    await expect(approveSubmission('sub-3', { coachUid: 'coach-1' })).rejects.toThrow('permission-denied');
    await expect(requestRevisionSubmission('sub-3', { coachUid: 'coach-1' })).rejects.toThrow('permission-denied');
    window.removeEventListener('hearisland-evaluations-updated', updated);
    expect(updated).not.toHaveBeenCalled();
  });
});
