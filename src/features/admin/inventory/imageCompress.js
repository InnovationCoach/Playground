/**
 * Client-side image compression for Equipment Inventory photos.
 *
 * Requirements (Section 2 & 3.3 of ASSET-INVENTORY-PLAN.md):
 * - Accepts image/jpeg, image/png, image/webp, image/heic.
 * - Resizes so long edge <= 1600 px while preserving aspect ratio.
 * - Draws to Canvas, stripping EXIF/GPS metadata.
 * - Compresses to image/jpeg at quality 0.8; if size > 1.5 MB, steps quality down to 0.6.
 * - Maximum server limit is 5 MB.
 */

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
export const MAX_LONG_EDGE = 1600;
export const TARGET_MAX_BYTES = 1.5 * 1024 * 1024; // 1.5 MB
export const SERVER_MAX_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Calculates new dimensions keeping aspect ratio with long edge <= maxEdge.
 * Pure function suitable for unit testing.
 *
 * @param {number} width
 * @param {number} height
 * @param {number} [maxEdge=1600]
 * @returns {{ width: number, height: number }}
 */
export function calculateDimensions(width, height, maxEdge = MAX_LONG_EDGE) {
  if (!width || !height || width <= 0 || height <= 0) {
    return { width: Math.max(1, width || 0), height: Math.max(1, height || 0) };
  }

  if (width <= maxEdge && height <= maxEdge) {
    return { width: Math.round(width), height: Math.round(height) };
  }

  if (width > height) {
    const scale = maxEdge / width;
    return { width: maxEdge, height: Math.max(1, Math.round(height * scale)) };
  } else {
    const scale = maxEdge / height;
    return { width: Math.max(1, Math.round(width * scale)), height: maxEdge };
  }
}

/**
 * Converts a Canvas to a Blob with given mime type and quality.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {string} type
 * @param {number} quality
 * @returns {Promise<Blob>}
 */
function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to create image blob from canvas'));
    }, type, quality);
  });
}

/**
 * Compresses an image File or Blob in the browser.
 *
 * @param {File|Blob} file
 * @returns {Promise<{ blob: Blob, width: number, height: number, bytes: number, contentType: string }>}
 */
export async function compressAssetPhoto(file) {
  if (!file) {
    throw new Error('No file provided for compression.');
  }

  const mime = (file.type || '').toLowerCase();
  const isHeic = mime === 'image/heic' || (file.name && /\.heic$/i.test(file.name));

  if (mime && !ALLOWED_IMAGE_TYPES.includes(mime) && !isHeic) {
    throw new Error('Unsupported image format. Please select a JPEG, PNG, WebP, or HEIC image.');
  }

  let imgBitmap;
  if (typeof createImageBitmap === 'function') {
    try {
      imgBitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      // Fallback to Image element below
    }
  }

  let origWidth, origHeight;
  let sourceElement;

  if (imgBitmap) {
    origWidth = imgBitmap.width;
    origHeight = imgBitmap.height;
    sourceElement = imgBitmap;
  } else {
    sourceElement = await new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Could not decode image file.'));
      };
      img.src = url;
    });
    origWidth = sourceElement.naturalWidth || sourceElement.width;
    origHeight = sourceElement.naturalHeight || sourceElement.height;
  }

  const { width, height } = calculateDimensions(origWidth, origHeight, MAX_LONG_EDGE);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not obtain canvas 2D rendering context.');
  }

  // Draw image to canvas (this also strips EXIF / GPS metadata)
  ctx.drawImage(sourceElement, 0, 0, width, height);

  if (imgBitmap && typeof imgBitmap.close === 'function') {
    imgBitmap.close();
  }

  // First compression attempt: quality 0.8
  let blob = await canvasToBlob(canvas, 'image/jpeg', 0.8);

  // If still larger than target (1.5 MB), step quality down to 0.6
  if (blob.size > TARGET_MAX_BYTES) {
    const smallerBlob = await canvasToBlob(canvas, 'image/jpeg', 0.6);
    if (smallerBlob.size < blob.size) {
      blob = smallerBlob;
    }
  }

  if (blob.size > SERVER_MAX_BYTES) {
    throw new Error(`Photo size (${(blob.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 5 MB server limit even after compression.`);
  }

  return {
    blob,
    width,
    height,
    bytes: blob.size,
    contentType: 'image/jpeg'
  };
}
