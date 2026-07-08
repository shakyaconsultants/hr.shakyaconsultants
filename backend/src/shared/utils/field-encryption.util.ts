import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';
import { getEnv } from '@config/env.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

function deriveKey(): Buffer {
  const secret = getEnv().FIELD_ENCRYPTION_KEY;
  return scryptSync(secret, 'hr-shakya-field-encryption', 32);
}

export function encryptField(plainText: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, deriveKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
}

const ENCRYPTED_FIELD_PATTERN = /^[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+$/;

export function decryptField(cipherText: string): string {
  const [ivB64, tagB64, dataB64] = cipherText.split(':');
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error('Invalid encrypted field format');
  }
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(tagB64, 'base64');
  const encrypted = Buffer.from(dataB64, 'base64');
  const decipher = createDecipheriv(ALGORITHM, deriveKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

/** Read a field that may be encrypted or legacy plain text stored before encryption rollout. */
export function readEncryptedField(stored?: string | null): string | undefined {
  if (!stored) {
    return undefined;
  }

  if (!ENCRYPTED_FIELD_PATTERN.test(stored)) {
    return stored;
  }

  try {
    return decryptField(stored);
  } catch {
    return undefined;
  }
}
