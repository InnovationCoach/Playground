import { describe, it, expect } from 'vitest';
import { bandsForCohort } from '../src/features/admin/accounts/AccountForm.jsx';
import { sortUsers, extractUserRecord } from '../server/routes/admin-users.js';

describe('bandsForCohort (admin account form)', () => {
  it('offers only the primary band for WPR', () => {
    expect(bandsForCohort({ code: 'WPR', ageBands: ['primary', '13-15'] }, 'cohort-wpr')).toEqual(['primary']);
    expect(bandsForCohort(undefined, 'cohort-wpr')).toEqual(['primary']);
  });
  it('never offers the primary band for secondary cohorts', () => {
    expect(bandsForCohort({ code: 'WLS', ageBands: ['primary', '13-15'] }, 'cohort-wls')).toEqual(['13-15']);
    expect(bandsForCohort(undefined, 'cohort-whs')).toEqual(['13-15', '16-18']);
  });
});

describe('sortUsers (admin-users)', () => {
  it('sorts safely when documents are missing uid or givenNames', () => {
    const rows = [
      { surname: 'Baker', givenNames: 'Bob', uid: 'user-2' },
      { surname: 'Adams', uid: 'user-1' },
      { surname: 'Adams' },
      { surname: 'Clark', uid: undefined }
    ];

    expect(() => sortUsers(rows, 'surname')).not.toThrow();
    expect(rows.map((r) => r.surname)).toEqual(['Adams', 'Adams', 'Baker', 'Clark']);
  });

  it('tolerates tie-breaking comparison with missing uid', () => {
    const rows = [
      { surname: 'Same', givenNames: 'Same', uid: undefined },
      { surname: 'Same', givenNames: 'Same', uid: 'user-a' },
      { surname: 'Same', givenNames: 'Same' }
    ];

    expect(() => sortUsers(rows, 'surname')).not.toThrow();
  });
});

describe('extractUserRecord (admin-users)', () => {
  it('falls back to doc.id when uid is missing from document data', () => {
    const snap = { id: 'doc-123', data: () => ({ name: 'Test' }) };
    expect(extractUserRecord(snap)).toEqual({ name: 'Test', uid: 'doc-123' });
  });

  it('keeps existing uid if present in doc data', () => {
    const snap = { id: 'doc-123', data: () => ({ name: 'Test', uid: 'user-real' }) };
    expect(extractUserRecord(snap)).toEqual({ name: 'Test', uid: 'user-real' });
  });
});
