/**
 * Portfolio & transcript files: coaches upload a file for one of their
 * learners, an administrator reviews it, downloads it and marks it shared
 * with the family.
 *
 * The endpoints live under /api/pilot/learner-records (server/ is Gemini's;
 * see docs/LEARNER-RECORDS-CONTRACT-FOR-GEMINI.md). In local development,
 * when the API has no such route yet, schoolFallback.js answers instead.
 *
 * The pure helpers (validation, labels, filters) are unit-tested.
 */
import { schoolRequest } from '../../services/api/apiClient.js';

export const RECORD_TYPES = ['portfolio', 'transcript', 'report', 'other'];
export const TYPE_LABEL = { portfolio: 'Portfolio', transcript: 'Transcript', report: 'Progress report', other: 'Other' };
export const STATUS_LABEL = { submitted: 'Awaiting review', approved: 'Approved', returned: 'Returned to coach' };

/** JSON bodies are capped at 8 MB on the API; base64 adds a third, so files stay under 5 MB. */
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED = {
  'application/pdf': '.pdf',
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx'
};
export const ACCEPT_ATTR = Object.entries(ACCEPTED).flatMap(([mime, ext]) => [mime, ext, ...(ext === '.jpg' ? ['.jpeg'] : [])]).join(',');

/** Returns a message for the first problem with a coach's upload, or null when it can be sent. */
export function validateUpload({ learnerUid, type, title, file } = {}) {
  if (!learnerUid) return 'Choose a learner.';
  if (!RECORD_TYPES.includes(type)) return 'Choose what kind of file this is.';
  if (!String(title || '').trim()) return 'Give the file a title.';
  if (String(title).trim().length > 120) return 'Keep the title under 120 characters.';
  if (!file) return 'Choose a file to upload.';
  if (!ACCEPTED[file.type]) return 'Upload a PDF, Word (.docx), PNG or JPG file.';
  if (file.size > MAX_FILE_BYTES) return 'The file is larger than 5 MB. Export a smaller PDF and try again.';
  if (file.size === 0) return 'The file is empty.';
  return null;
}

export function formatBytes(n) {
  if (!Number.isFinite(n) || n < 0) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/** Filters the admin list. Pure. */
export function filterRecords(items, { status = 'all', type = 'all', q = '' } = {}) {
  const needle = q.trim().toLowerCase();
  return (items || []).filter((r) => (status === 'all' || r.status === status)
    && (type === 'all' || r.type === type)
    && (!needle || [r.learnerName, r.title, r.coachName, r.term].some((v) => String(v || '').toLowerCase().includes(needle))));
}

export function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('The file could not be read.'));
    reader.readAsDataURL(file);
  });
}

const request = (method, path, options) => schoolRequest(method, `/api/pilot/learner-records${path}`, options);

export const listRecords = () => request('GET', '').then((d) => d?.items || []);
export const listLearners = () => request('GET', '/learners').then((d) => d?.items || []);

export async function uploadRecord({ learnerUid, type, title, term, note, file }) {
  const fileData = await readAsDataUrl(file);
  return request('POST', '', {
    body: { learnerUid, type, title: title.trim(), term: String(term || '').trim(), note: String(note || '').trim(), fileName: file.name, contentType: file.type, size: file.size, fileData }
  });
}

export const reviewRecord = (id, { status, response }) => request('PATCH', `/${encodeURIComponent(id)}`, { body: { status, response: String(response || '').trim() } });
export const markShared = (id, shared) => request('PATCH', `/${encodeURIComponent(id)}`, { body: { sharedWithParents: Boolean(shared) } });
export const withdrawRecord = (id) => request('DELETE', `/${encodeURIComponent(id)}`);

/** Asks the API for a short-lived link and saves the file under its original name. */
export async function downloadRecord(id) {
  const { url, fileName } = await request('GET', `/${encodeURIComponent(id)}/download`);
  if (!url) throw new Error('The file is not available.');
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName || 'learner-record';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
}
