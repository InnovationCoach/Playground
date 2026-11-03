import { fail } from './schoolScope.js';
import { LEARNING_MEDIA_TYPES } from '../../src/features/school/media/mediaSpec.js';
export const LESSON_MEDIA_TYPES = LEARNING_MEDIA_TYPES;
export async function validateLessonAttachments(attachments, prefix, bucket) {
  if (!Array.isArray(attachments) || attachments.length > 8) fail(400, 'VALIDATION', 'Choose up to eight images, videos, PDFs or slide presentations.');
  const seen = new Set();
  for (const attachment of attachments) {
    const path = attachment?.path;
    if (typeof path !== 'string' || !path.startsWith(prefix) || !/^[A-Za-z0-9_-]+\/[A-Za-z0-9_.-]+$/.test(path.slice(prefix.length)) || seen.has(path)) fail(400, 'VALIDATION', 'Media must belong to this lesson.');
    seen.add(path);
  }
  return Promise.all(attachments.map(async attachment => {
    const path = attachment.path;
    const file = bucket().file(path);
    let metadata;
    try { [metadata] = await file.getMetadata(); } catch { fail(400, 'VALIDATION', 'The uploaded resource is unavailable. Upload it again.'); }
    const size = Number(metadata.size);
    if (!LESSON_MEDIA_TYPES.includes(metadata.contentType) || !Number.isFinite(size) || size <= 0 || size > 100 * 1024 * 1024) fail(400, 'VALIDATION', 'Unsupported media type or file larger than 100 MB.');
    if (typeof attachment.name !== 'string' || !attachment.name.trim() || attachment.name.length > 200) fail(400, 'VALIDATION', 'Media filename is required.');
    // Keep publication/enrollment checks effective even if the SDK added a token.
    if (metadata.metadata?.firebaseStorageDownloadTokens) await file.setMetadata({metadata:{firebaseStorageDownloadTokens:null}});
    return { path, name: attachment.name.trim(), contentType: metadata.contentType, size };
  }));
}
