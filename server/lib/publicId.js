import { JOIN_CODE_ALPHABET } from '../../src/utils/joinCode.js';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Generate unique publicId (e.g. KZN-TKL-PRS-VQM) and claim it in publicIds collection.
 */
export async function generateUniquePublicId(db) {
  const alphabet = JOIN_CODE_ALPHABET || 'BCDFGHJKMNPQRSTVWXYZ23456789';
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const groups = [];
    for (let g = 0; g < 4; g += 1) {
      let s = '';
      for (let i = 0; i < 3; i += 1) {
        s += alphabet[Math.floor(Math.random() * alphabet.length)];
      }
      groups.push(s);
    }
    const publicId = groups.join('-');
    const docRef = db.collection('publicIds').doc(publicId);
    const snap = await docRef.get();
    if (!snap.exists) {
      return publicId;
    }
  }
  // Fallback fallback
  return `PUB-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`;
}
