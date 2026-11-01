import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 12 bytes recommended for GCM
const TAG_LENGTH = 16;

/**
 * Derives a 32-byte Buffer from the environment variable CANVA_TOKEN_KEY.
 * Throws a descriptive error if the key is missing.
 */
export function getEncryptionKey() {
  const secret = process.env.CANVA_TOKEN_KEY;
  if (!secret) {
    throw new Error('CANVA_TOKEN_KEY is required in environment variables for Canva token encryption.');
  }

  // If 64-char hex string, convert to 32 bytes
  if (typeof secret === 'string' && /^[0-9a-fA-F]{64}$/.test(secret)) {
    return Buffer.from(secret, 'hex');
  }

  // If base64-encoded 32-byte key (44 chars with padding)
  if (typeof secret === 'string' && /^[A-Za-z0-9+/]{43}=$/.test(secret)) {
    return Buffer.from(secret, 'base64');
  }

  // Otherwise, deterministically hash to 32 bytes using SHA-256
  return crypto.createHash('sha256').update(String(secret)).digest();
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Output format: "iv_hex:tag_hex:ciphertext_hex"
 *
 * @param {string} plaintext - The secret string to encrypt
 * @returns {string} - Combined IV, Auth Tag, and Ciphertext
 */
export function encryptToken(plaintext) {
  if (plaintext === null || plaintext === undefined) {
    return null;
  }
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(String(plaintext), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts an AES-256-GCM ciphertext created by encryptToken.
 *
 * @param {string} encryptedString - Format: "iv_hex:tag_hex:ciphertext_hex"
 * @returns {string} - Decrypted plaintext string
 */
export function decryptToken(encryptedString) {
  if (!encryptedString) {
    return null;
  }
  const parts = String(encryptedString).split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted token format.');
  }

  const [ivHex, tagHex, ciphertextHex] = parts;
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(ciphertextHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
