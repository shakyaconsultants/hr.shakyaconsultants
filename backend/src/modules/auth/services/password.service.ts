import bcrypt from 'bcrypt';
import { getEnv } from '@config/env.js';
import { PasswordHistoryModel } from '@domain/auth/user.schema.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { ValidationError } from '@shared/errors/app.error.js';

const TIMING_SAFE_DUMMY_HASH =
  '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQrson4sLu9K5hWgKHci';

export const PasswordService = {
  async hashPassword(plainPassword: string): Promise<string> {
    const env = getEnv();
    return bcrypt.hash(plainPassword, env.BCRYPT_ROUNDS);
  },

  async comparePassword(plainPassword: string, passwordHash: string | undefined): Promise<boolean> {
    const hash = passwordHash ?? TIMING_SAFE_DUMMY_HASH;
    return bcrypt.compare(plainPassword, hash);
  },

  validatePasswordStrength(password: string): void {
    if (password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
      throw new ValidationError('Password must contain an uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      throw new ValidationError('Password must contain a lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      throw new ValidationError('Password must contain a number');
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      throw new ValidationError('Password must contain a special character');
    }
  },

  async recordPasswordHistory(
    userId: string,
    companyId: string,
    passwordHash: string,
    changedBy: string,
  ): Promise<void> {
    await PasswordHistoryModel.create({
      id: generateUuid(),
      companyId,
      userId,
      passwordHash,
      changedAt: new Date(),
      createdBy: changedBy,
      updatedBy: changedBy,
    });
  },

  async checkPasswordHistory(
    userId: string,
    companyId: string,
    plainPassword: string,
    lastN = 5,
  ): Promise<boolean> {
    const history = await PasswordHistoryModel.find({ userId, companyId })
      .select('+passwordHash')
      .sort({ changedAt: -1 })
      .limit(lastN)
      .exec();

    for (const entry of history) {
      const matches = await bcrypt.compare(plainPassword, entry.passwordHash);
      if (matches) {
        return true;
      }
    }

    return false;
  },
};
