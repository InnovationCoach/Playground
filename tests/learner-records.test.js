import { describe, it, expect, beforeEach } from 'vitest';
import { validateUpload, filterRecords, formatBytes, MAX_FILE_BYTES } from '../src/features/records/learnerRecords.js';
import { handleLearnerRecordsFallback, resetLearnerRecordsFallback } from '../src/services/api/learnerRecordsFallback.js';
import { parseRoute, hrefFor } from '../src/app/routes.js';
import { cardsFor, cardHref } from '../src/features/spark/sparkConfig.js';

const pdf = (size = 1000) => ({ name: 'p.pdf', type: 'application/pdf', size });
const ok = { learnerUid: 'u1', type: 'portfolio', title: 'Term 1', file: pdf() };

describe('validateUpload', () => {
  it('accepts a complete upload', () => expect(validateUpload(ok)).toBeNull());
  it('names the first missing piece', () => {
    expect(validateUpload({ ...ok, learnerUid: '' })).toMatch(/learner/);
    expect(validateUpload({ ...ok, type: 'x' })).toMatch(/kind/);
    expect(validateUpload({ ...ok, title: '  ' })).toMatch(/title/);
    expect(validateUpload({ ...ok, file: null })).toMatch(/file/);
  });
  it('rejects other file types, empty and oversized files', () => {
    expect(validateUpload({ ...ok, file: { ...pdf(), type: 'application/zip' } })).toMatch(/PDF/);
    expect(validateUpload({ ...ok, file: pdf(MAX_FILE_BYTES + 1) })).toMatch(/5 MB/);
    expect(validateUpload({ ...ok, file: pdf(0) })).toMatch(/empty/);
  });
});

describe('filterRecords and formatBytes', () => {
  const items = [
    { id: 1, status: 'submitted', type: 'portfolio', learnerName: 'Alex Chen', title: 'Solar car' },
    { id: 2, status: 'approved', type: 'transcript', learnerName: 'Mia Chen', title: 'Term 1', coachName: 'Sara' }
  ];
  it('filters by status, kind and search text', () => {
    expect(filterRecords(items, { status: 'submitted' }).map((r) => r.id)).toEqual([1]);
    expect(filterRecords(items, { type: 'transcript' }).map((r) => r.id)).toEqual([2]);
    expect(filterRecords(items, { q: 'sara' }).map((r) => r.id)).toEqual([2]);
    expect(filterRecords(items, {}).length).toBe(2);
  });
  it('formats sizes', () => {
    expect(formatBytes(500)).toBe('500 B');
    expect(formatBytes(2048)).toBe('2 KB');
    expect(formatBytes(1.5 * 1024 * 1024)).toBe('1.5 MB');
  });
});

describe('local fallback', () => {
  beforeEach(() => resetLearnerRecordsFallback());
  const P = '/api/pilot/learner-records';
  it('ignores other paths', () => expect(handleLearnerRecordsFallback('GET', '/api/pilot/leave', null, 'admin')).toBeUndefined());
  it('runs upload → review → share → download, and lists without file data', () => {
    const { id } = handleLearnerRecordsFallback('POST', P, { learnerUid: 'student-alex', type: 'portfolio', title: 'T', fileName: 'p.pdf', contentType: 'application/pdf', size: 3, fileData: 'data:application/pdf;base64,AAA' }, 'teacher');
    const [listed] = handleLearnerRecordsFallback('GET', P, null, 'teacher').items;
    expect(listed).toMatchObject({ id, learnerName: 'Alex Chen', status: 'submitted' });
    expect(listed.fileData).toBeUndefined();
    expect(() => handleLearnerRecordsFallback('PATCH', `${P}/${id}`, { status: 'approved' }, 'teacher')).toThrow(/Administrator/);
    expect(handleLearnerRecordsFallback('PATCH', `${P}/${id}`, { status: 'approved', response: '' }, 'admin').status).toBe('approved');
    expect(handleLearnerRecordsFallback('PATCH', `${P}/${id}`, { sharedWithParents: true }, 'admin').sharedWithParents).toBe(true);
    expect(handleLearnerRecordsFallback('GET', `${P}/${id}/download`, null, 'admin')).toEqual({ url: 'data:application/pdf;base64,AAA', fileName: 'p.pdf' });
    expect(() => handleLearnerRecordsFallback('DELETE', `${P}/${id}`, null, 'teacher')).toThrow(/awaiting review/);
  });
});

describe('admin SPARK card and route', () => {
  it('routes #/admin/records to the records page', () => {
    expect(parseRoute(hrefFor.learnerRecords())).toEqual({ screen: 'admin', page: 'records' });
  });
  it('admin home links Portfolio & Transcripts and no longer shows studio, projects or competencies', () => {
    const ids = cardsFor('admin').map((c) => c.id);
    expect(ids).not.toEqual(expect.arrayContaining(['admin.studio']));
    expect(ids.some((id) => ['admin.studio', 'admin.projects', 'admin.competencies'].includes(id))).toBe(false);
    expect(cardHref(cardsFor('admin').find((c) => c.id === 'admin.portfolio'))).toBe('#/admin/records');
  });
});
