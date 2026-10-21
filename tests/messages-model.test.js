/**
 * Messenger helpers: what may be shared (mirrors storage.rules), list
 * previews, day grouping and who may record voice notes.
 */
import { describe, it, expect } from 'vitest';
import {
  kindOf, fileProblem, safeFileName, formatBytes, formatDuration, previewText, attachmentsOf, dayLabel,
  groupThread, initials, canRecordVoice, pickRecorderMime, conversationTitle, MAX_FILE_BYTES
} from '../src/features/messages/messageModel.js';

describe('file types', () => {
  it('accepts what storage.rules accepts', () => {
    expect(kindOf('image/png')).toBe('image');
    expect(kindOf('video/quicktime')).toBe('video');
    expect(kindOf('audio/webm;codecs=opus')).toBe('audio');
    expect(kindOf('audio/mp4')).toBe('audio');
    expect(kindOf('application/pdf')).toBe('file');
    expect(kindOf('application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe('file');
    expect(kindOf('text/csv')).toBe('file');
  });

  it('refuses everything else, with a reason the learner can act on', () => {
    for (const t of ['application/x-msdownload', 'application/zip', 'image/svg+xml', 'text/html', '']) expect(kindOf(t)).toBeNull();
    expect(fileProblem({ name: 'game.exe', type: 'application/x-msdownload', size: 10 })).toMatch(/cannot be shared/);
    expect(fileProblem({ name: 'big.mp4', type: 'video/mp4', size: MAX_FILE_BYTES + 1 })).toMatch(/up to 20 MB/);
    expect(fileProblem({ name: 'ok.pdf', type: 'application/pdf', size: 1000 })).toBeNull();
  });

  it('makes storage-safe names that keep the extension', () => {
    expect(safeFileName('My Report (final).docx')).toBe('My_Report_final.docx');
    expect(safeFileName('../../etc/passwd')).toBe('etcpasswd');
    expect(safeFileName('')).toBe('file');
  });
});

describe('formatting', () => {
  it('formats sizes and durations', () => {
    expect(formatBytes(900)).toBe('900 B');
    expect(formatBytes(2048)).toBe('2 KB');
    expect(formatBytes(3.5 * 1024 * 1024)).toBe('3.5 MB');
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(75.4)).toBe('1:15');
  });

  it('previews text first, then the attachment', () => {
    expect(previewText('  Hello\n there ', [])).toBe('Hello there');
    expect(previewText('', [{ kind: 'audio', durationSec: 12 }])).toBe('🎤 Voice message (0:12)');
    expect(previewText('', [{ kind: 'image' }, { kind: 'image' }])).toBe('📷 2 photos');
    expect(previewText('', [{ kind: 'file', name: 'plan.pdf' }])).toBe('📎 plan.pdf');
  });

  it('reads attachments from the older media shape too', () => {
    expect(attachmentsOf({ media: [{ type: 'video', url: 'u' }] })[0].kind).toBe('video');
    expect(attachmentsOf({ attachments: [{ kind: 'audio' }] })[0].kind).toBe('audio');
    expect(attachmentsOf({})).toEqual([]);
  });

  it('initials', () => {
    expect(initials('Mia Chen')).toBe('MC');
    expect(initials('Sam')).toBe('S');
    expect(initials('')).toBe('?');
  });
});

describe('thread grouping', () => {
  const now = new Date(2026, 9, 21, 15, 0).getTime();
  const at = (d, h, m) => new Date(2026, 9, d, h, m).getTime();

  it('labels days', () => {
    expect(dayLabel(at(21, 9, 0), now)).toBe('Today');
    expect(dayLabel(at(20, 9, 0), now)).toBe('Yesterday');
  });

  it('groups by day and starts a new run on a new sender or after 5 minutes', () => {
    const days = groupThread([
      { id: 1, senderId: 'a', createdAt: at(20, 9, 0) },
      { id: 2, senderId: 'a', createdAt: at(21, 9, 0) },
      { id: 3, senderId: 'a', createdAt: at(21, 9, 2) },
      { id: 4, senderId: 'b', createdAt: at(21, 9, 3) },
      { id: 5, senderId: 'b', createdAt: at(21, 9, 20) }
    ], now);
    expect(days.map((d) => d.label)).toEqual(['Yesterday', 'Today']);
    expect(days[1].items.map((m) => m.startsRun)).toEqual([true, false, true, true]);
  });

  it('treats a pending server timestamp as now', () => {
    const days = groupThread([{ id: 1, senderId: 'a', createdAt: null }]);
    expect(days[0].label).toBe('Today');
  });
});

describe('voice notes', () => {
  it('coaches and secondary learners record; primary learners only listen', () => {
    expect(canRecordVoice({ role: 'coach' })).toBe(true);
    expect(canRecordVoice({ role: 'teacher' })).toBe(true);
    expect(canRecordVoice({ role: 'student', isPrimary: false })).toBe(true);
    expect(canRecordVoice({ role: 'student', isPrimary: true })).toBe(false);
    expect(canRecordVoice({ role: 'parent' })).toBe(false);
  });

  it('picks the first recording format the browser supports', () => {
    expect(pickRecorderMime((t) => t === 'audio/mp4')).toBe('audio/mp4');
    expect(pickRecorderMime(() => true)).toBe('audio/webm;codecs=opus');
    expect(pickRecorderMime(() => false)).toBe('');
  });
});

describe('titles', () => {
  it('class chats use their title; direct chats show the other person', () => {
    expect(conversationTitle({ type: 'class', title: 'Year 9' }, 'x')).toBe('Year 9');
    const direct = { coachId: 'c', coachName: 'Sam Rivera', studentName: 'Mia Chen' };
    expect(conversationTitle(direct, 'c')).toBe('Mia Chen');
    expect(conversationTitle(direct, 's')).toBe('Sam Rivera');
  });
});
