import { randomBytes, randomUUID } from 'node:crypto';

export function generateRandomId(length = 16): string {
  return randomBytes(length).toString('hex').slice(0, length);
}

export function generateUuid(): string {
  return randomUUID();
}

export function generateNumericCode(length = 6): string {
  const max = 10 ** length;
  const num = Math.floor(Math.random() * max);
  return num.toString().padStart(length, '0');
}

export function generateAlphanumericCode(length = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const bytes = randomBytes(length);
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}
