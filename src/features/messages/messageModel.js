/**
 * Pure helpers for the messenger: which files may be shared, how a message is
 * summarised in the conversation list, and how a thread is grouped by day.
 * Unit-tested in tests/messages-model.test.js.
 *
 * The allowed types and the 20 MB limit mirror storage.rules
 * (match /messages/{convId}/{msgId}/{filename}); keep the two in step.
 */

export const MAX_FILE_BYTES = 20 * 1024 * 1024;
export const MAX_FILES = 5;
export const MAX_TEXT = 4000;
export const MAX_VOICE_SECONDS = 120;

const DOC_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.ms-excel',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv'
]);

/** What the file picker offers; the same set the rules accept. */
export const ACCEPT = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'video/mp4', 'video/webm', 'video/quicktime',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv'
].join(',');

const baseType = (mime) => String(mime || '').toLowerCase().split(';')[0].trim();

/** 'image' | 'video' | 'audio' | 'file', or null when the rules would refuse it. */
export function kindOf(mime) {
  const t = baseType(mime);
  if (/^image\/(jpeg|png|webp|gif)$/.test(t)) return 'image';
  if (/^video\/(mp4|webm|quicktime)$/.test(t)) return 'video';
  if (/^audio\/(webm|ogg|mp4|mpeg|aac|x-m4a|wav)$/.test(t)) return 'audio';
  if (DOC_TYPES.has(t)) return 'file';
  return null;
}

/** Why a file cannot be sent, in words for the learner, or null if it can. */
export function fileProblem(file) {
  if (!file) return 'No file.';
  if (!kindOf(file.type)) return `${file.name || 'This file'} is a type that cannot be shared here. Try a photo, video, PDF, Word, Excel, PowerPoint or text file.`;
  if (file.size > MAX_FILE_BYTES) return `${file.name || 'This file'} is ${formatBytes(file.size)}. Files can be up to 20 MB.`;
  return null;
}

/** A storage-safe file name that keeps the extension readable. */
export function safeFileName(name, fallback = 'file') {
  const clean = String(name || '').normalize('NFKD').replace(/[^\w.\- ]+/g, '').replace(/\s+/g, '_').replace(/^\.+/, '');
  return (clean || fallback).slice(-80);
}

export function formatBytes(n) {
  if (!Number.isFinite(n) || n < 0) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(n < 10 * 1024 * 1024 ? 1 : 0)} MB`;
}

export function formatDuration(sec) {
  const s = Math.max(0, Math.round(Number(sec) || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** The one line shown under a conversation in the list. */
export function previewText(text, attachments = []) {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  if (t) return t.slice(0, 80);
  const a = attachments[0];
  if (!a) return '';
  if (a.kind === 'audio') return `🎤 Voice message (${formatDuration(a.durationSec)})`;
  if (a.kind === 'image') return attachments.length > 1 ? `📷 ${attachments.length} photos` : '📷 Photo';
  if (a.kind === 'video') return '🎬 Video';
  return `📎 ${a.name || 'File'}`;
}

/** Message attachments, including the older `media` shape ({ type: 'image'|'video' }). */
export function attachmentsOf(msg) {
  if (Array.isArray(msg?.attachments)) return msg.attachments;
  if (Array.isArray(msg?.media)) {
    return msg.media.map((m) => ({ ...m, kind: m.type === 'video' ? 'video' : 'image', name: m.name || '' }));
  }
  return [];
}

/** Firestore Timestamp, Date, millis or ISO string to millis; pending server time is "now". */
export function toMillis(ts) {
  if (!ts) return Date.now();
  if (typeof ts.toMillis === 'function') return ts.toMillis();
  if (ts instanceof Date) return ts.getTime();
  if (typeof ts === 'number') return ts;
  const n = Date.parse(ts);
  return Number.isFinite(n) ? n : Date.now();
}

const startOfDay = (ms) => { const d = new Date(ms); d.setHours(0, 0, 0, 0); return d.getTime(); };

/** 'Today', 'Yesterday', a weekday within the week, otherwise a date. */
export function dayLabel(ms, now = Date.now()) {
  const days = Math.round((startOfDay(now) - startOfDay(ms)) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days > 1 && days < 7) return new Date(ms).toLocaleDateString(undefined, { weekday: 'long' });
  return new Date(ms).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: new Date(ms).getFullYear() === new Date(now).getFullYear() ? undefined : 'numeric' });
}

/** Short time for the list: a clock time today, otherwise the day label. */
export function listTime(ms, now = Date.now()) {
  if (startOfDay(ms) === startOfDay(now)) return new Date(ms).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return dayLabel(ms, now);
}

/**
 * Group a thread into days, and mark runs of messages from the same sender
 * within 5 minutes so the view shows the name and avatar once per run.
 */
export function groupThread(messages, now = Date.now()) {
  const days = [];
  let prev = null;
  for (const m of messages) {
    const at = toMillis(m.createdAt);
    const label = dayLabel(at, now);
    if (!days.length || days.at(-1).label !== label) { days.push({ label, items: [] }); prev = null; }
    const startsRun = !prev || prev.senderId !== m.senderId || at - prev.at > 5 * 60000;
    days.at(-1).items.push({ ...m, at, startsRun });
    prev = { senderId: m.senderId, at };
  }
  return days;
}

export function initials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts.at(-1)[0] : '')).toUpperCase();
}

/**
 * Voice notes: coaches and secondary learners record; primary learners (under
 * 13) can listen but not record, matching the platform's no-voice-input rule
 * for under-13s.
 */
export function canRecordVoice({ role, isPrimary }) {
  if (role === 'teacher' || role === 'coach') return true;
  return role === 'student' && !isPrimary;
}

/** The first recording format this browser supports (Chrome/Firefox: webm, Safari: mp4). */
export function pickRecorderMime(isTypeSupported) {
  const options = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
  return options.find((t) => { try { return isTypeSupported(t); } catch { return false; } }) || '';
}

/** Display name of the other side of a direct chat, or the class chat's title. */
export function conversationTitle(conv, myUid) {
  if (!conv) return 'Conversation';
  if (conv.type === 'class') return conv.title || 'Class chat';
  const name = conv.coachId === myUid ? conv.studentName : conv.coachName;
  return name || (conv.coachId === myUid ? 'Student' : 'Coach');
}
