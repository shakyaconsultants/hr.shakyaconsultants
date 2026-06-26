import { randomBytes } from 'node:crypto';

export function generateSecureToken(bytes = 32): string {
  return randomBytes(bytes).toString('hex');
}

export function maskToken(token: string, visibleChars = 4): string {
  if (token.length <= visibleChars * 2) return '*'.repeat(token.length);
  return `${token.slice(0, visibleChars)}${'*'.repeat(token.length - visibleChars * 2)}${token.slice(-visibleChars)}`;
}
