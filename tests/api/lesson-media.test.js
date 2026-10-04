import { describe, expect, it, vi } from 'vitest';
import { validateLessonAttachments } from '../../server/lib/lessonMedia.js';
const prefix = 'lessonMedia/school/program/lesson/';
const attachment = { path: `${prefix}coach/file`, name: 'Demo' };
const bucket = (metadata = { contentType: 'video/mp4', size: '1024' }) => () => ({ file: () => ({ getMetadata: async () => [metadata] }) });
describe('Lesson media validation', () => {
  it('uses verified storage metadata instead of client types and sizes', async () => {
    const [saved] = await validateLessonAttachments([{ ...attachment, size: 1, contentType: 'image/png', url: 'https://untrusted.test' }], prefix, bucket());
    expect(saved).toEqual({ ...attachment, size: 1024, contentType: 'video/mp4' });
  });
  it('rejects foreign lesson paths, duplicate paths and too many files before storage access', async () => {
    const access = vi.fn();
    for (const input of [[{ ...attachment, path: 'lessonMedia/school/other/lesson/coach/file' }], [attachment, attachment], Array(9).fill(attachment)]) {
      await expect(validateLessonAttachments(input, prefix, access)).rejects.toMatchObject({ status: 400 });
    }
  });
  it('rejects unsupported media and oversized or empty objects', async () => {
    for (const metadata of [{ contentType: 'text/html', size: 50 }, { contentType: 'video/mp4', size: 101 * 1024 * 1024 }, { contentType: 'image/png', size: 0 }]) {
      await expect(validateLessonAttachments([attachment], prefix, bucket(metadata))).rejects.toMatchObject({ status: 400 });
    }
  });
});
