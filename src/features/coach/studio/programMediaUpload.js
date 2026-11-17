/**
 * Media & File Upload Helper for Program Maker.
 * Uploads images/videos to Firebase Storage when authenticated & online,
 * with safe Data URL fallback for local/offline authoring and small attachments.
 */

import { auth, storage } from '../../../firebase.js';

const MAX_STORAGE_BYTES = 20 * 1024 * 1024; // 20 MB (matches storage.rules)
const MAX_INLINE_DOC_BYTES = 750 * 1024; // 750 KB (safe inside 1 MB Firestore doc limit)
const MAX_INLINE_IMG_BYTES = 500 * 1024; // 500 KB fallback if Storage is offline

function sanitizeFileName(name) {
  return String(name || 'file')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .slice(0, 80);
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error(`Could not read "${file.name}".`));
    reader.readAsDataURL(file);
  });
}

/**
 * Downscales an image in the browser to a compact JPEG/WebP Data URL
 * when Firebase Storage is unavailable (e.g. offline/emulator dev).
 */
async function compressImageToDataUrl(file, maxWidth = 1400) {
  if (typeof document === 'undefined' || typeof Image === 'undefined') {
    const raw = await readAsDataUrl(file);
    if (raw.length > MAX_INLINE_IMG_BYTES * 1.4) {
      throw new Error('Image is too large for offline storage. Please use a smaller image or paste an image URL.');
    }
    return raw;
  }

  const rawUrl = await readAsDataUrl(file);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = img.width > maxWidth ? maxWidth / img.width : 1;
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(rawUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      const out = canvas.toDataURL('image/jpeg', 0.82);
      if (out.length > MAX_INLINE_IMG_BYTES * 1.4) {
        reject(new Error('Image is too large even after compression. Please use a smaller file or paste an image URL.'));
        return;
      }
      resolve(out);
    };
    img.onerror = () => reject(new Error(`Could not decode image "${file.name}".`));
    img.src = rawUrl;
  });
}

/**
 * Uploads a cover image, inline image, or video file.
 * @param {File} file
 * @param {{ kind?: 'image' | 'video' | 'any' }} [options]
 * @returns {Promise<{ url: string, fileName: string, fileSize: number, mimeType: string, storagePath?: string }>}
 */
export async function uploadProgramMediaFile(file, { kind = 'image' } = {}) {
  if (!file || !file.size) {
    throw new Error('Please choose a non-empty file.');
  }
  if (file.size > MAX_STORAGE_BYTES) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    throw new Error(`"${file.name}" (${mb} MB) exceeds the 20 MB upload limit.`);
  }

  const ext = String(file.name || '').split('.').at(-1).toLowerCase();
  if (['heic', 'heif'].includes(ext) || file.type === 'image/heic' || file.type === 'image/heif') {
    throw new Error('HEIC/HEIF photos are not supported by browsers. Export as JPEG, PNG, or WebP first.');
  }

  const isImage = file.type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext);
  const isVideo = file.type.startsWith('video/') || ['mp4', 'webm', 'mov'].includes(ext);

  if (kind === 'image' && !isImage) {
    throw new Error('Please select a JPG, PNG, WebP, or GIF image.');
  }
  if (kind === 'video' && !isVideo) {
    throw new Error('Please select an MP4, WebM, or MOV video.');
  }

  const uid = auth?.currentUser?.uid;
  if ((isImage || isVideo) && storage && uid) {
    const path = `community/${uid}/program_${Date.now()}_${sanitizeFileName(file.name)}`;
    try {
      const ref = storage.ref(path);
      await ref.put(file, file.type ? { contentType: file.type } : undefined);
      const url = await ref.getDownloadURL();
      return {
        url,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
        storagePath: path
      };
    } catch (err) {
      // Fall through to inline fallback for images if Storage is unavailable/offline
      if (!isImage) {
        throw new Error(`Video upload failed (${err?.message || 'Storage unavailable'}). You can paste a YouTube, Vimeo, or cloud video URL instead.`);
      }
    }
  }

  if (isImage) {
    const dataUrl = await compressImageToDataUrl(file);
    return {
      url: dataUrl,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || 'image/jpeg'
    };
  }

  throw new Error('Sign in with Firebase Storage connected to upload videos, or paste a YouTube/Vimeo/MP4 URL.');
}

/**
 * Attaches a downloadable document (PDF, DOCX, PPTX, CSV, TXT, ZIP).
 * @param {File} file
 * @returns {Promise<{ url: string, fileName: string, fileSize: number, mimeType: string }>}
 */
export async function uploadProgramAttachmentFile(file) {
  if (!file || !file.size) {
    throw new Error('Please choose a non-empty document.');
  }
  if (file.size > MAX_INLINE_DOC_BYTES) {
    const kb = Math.round(file.size / 1024);
    throw new Error(`"${file.name}" is ${kb} KB. Direct document attachments are limited to 750 KB; for larger files, upload to Google Drive/OneDrive and paste the share link.`);
  }
  const url = await readAsDataUrl(file);
  return {
    url,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type || 'application/octet-stream'
  };
}
