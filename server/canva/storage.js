import { getStorage } from 'firebase-admin/storage';
import crypto from 'node:crypto';

/**
 * Downloads a file from a URL as a Buffer and determines its MIME type.
 */
export async function fetchFileBuffer(url, fetchFn = globalThis.fetch) {
  const res = await fetchFn(url);
  if (!res.ok) {
    throw new Error(`Failed to download exported asset from Canva (HTTP ${res.status})`);
  }
  const contentType = res.headers.get('content-type') || 'application/octet-stream';
  const arrayBuffer = await res.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    contentType
  };
}

/**
 * Stores a private export in Firebase Storage under:
 * canva-exports/{ownerUid}/{exportId}.{ext}
 */
export async function storePrivateExport({ ownerUid, exportId, buffer, contentType, ext = 'png' }) {
  const storage = getStorage();
  const bucketName = process.env.STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || `${process.env.GOOGLE_CLOUD_PROJECT || 'demo-hearisland-local'}.appspot.com`;
  const bucket = storage.bucket(bucketName);
  const filePath = `canva-exports/${ownerUid}/${exportId}.${ext}`;
  const file = bucket.file(filePath);

  await file.save(buffer, {
    metadata: {
      contentType,
      metadata: {
        ownerUid,
        exportId,
        uploadedAt: new Date().toISOString()
      }
    }
  });

  return {
    storagePath: filePath,
    bucket: bucket.name
  };
}

/**
 * Stores a class-visible export in Cloudinary using section 1 folders:
 * - resources/<classId>/ for coach resources
 * - portfolio/<ownerUid>/ for portfolio items
 */
export async function storeCloudinaryExport({
  ownerUid,
  classId,
  purpose = 'resource',
  buffer,
  format = 'png'
}) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  const folder = purpose === 'resource' && classId
    ? `resources/${classId}`
    : `portfolio/${ownerUid}`;

  if (!cloudName || !apiKey || !apiSecret) {
    // Return structured metadata indicating storage target
    return {
      folder,
      provider: 'cloudinary',
      simulated: true,
      url: `https://res.cloudinary.com/welearn/image/upload/v1/${folder}/canva-export-${Date.now()}.${format}`
    };
  }

  const timestamp = Math.round(Date.now() / 1000);
  const signatureString = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash('sha1').update(signatureString).digest('hex');

  const formData = new FormData();
  formData.append('file', new Blob([buffer]), `export.${format}`);
  formData.append('api_key', apiKey);
  formData.append('timestamp', String(timestamp));
  formData.append('signature', signature);
  formData.append('folder', folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Cloudinary upload failed: ${err}`);
  }

  const data = await res.json();
  return {
    provider: 'cloudinary',
    folder,
    url: data.secure_url || data.url,
    publicId: data.public_id
  };
}
