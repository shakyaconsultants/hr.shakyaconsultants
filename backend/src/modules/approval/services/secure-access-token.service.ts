import { createHash, randomBytes } from 'node:crypto';
import { SecureAccessTokenRepository, SecureAccessTokenModel } from '@domain/leave-exit/leave-exit.schemas.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { NotFoundError, ConflictError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { SECURE_TOKEN_DEFAULT_EXPIRY_HOURS } from '@modules/approval/constants/approval.constants.js';
import type { SecureAccessTokenDocument } from '@domain/leave-exit/leave-exit.schemas.js';

export function hashSecureToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function generateSecureToken(): string {
  return randomBytes(32).toString('hex');
}

export interface ResolvedSecureToken {
  id: string;
  companyId: string;
  purpose: string;
  entityType: string;
  entityId: string;
  record: SecureAccessTokenDocument;
}

async function findActiveTokenRecord(tokenHash: string, purpose: string): Promise<SecureAccessTokenDocument | null> {
  return SecureAccessTokenModel.findOne({
    tokenHash,
    purpose,
    revokedAt: { $exists: false },
    usedAt: { $exists: false },
  })
    .select('+tokenHash')
    .exec();
}

export const SecureAccessTokenService = {
  async issue(input: {
    companyId: string;
    purpose: string;
    entityType: string;
    entityId: string;
    createdByUserId: string;
    expiryHours?: number;
    metadata?: Record<string, unknown>;
  }): Promise<{ token: string; expiresAt: Date; id: string }> {
    const existing = await SecureAccessTokenRepository.findMany(
      { purpose: input.purpose, entityType: input.entityType, entityId: input.entityId, revokedAt: { $exists: false } },
      { companyId: input.companyId },
    );
    for (const record of existing) {
      await SecureAccessTokenRepository.update(
        record.id,
        { revokedAt: new Date(), updatedBy: input.createdByUserId },
        { companyId: input.companyId },
      );
    }

    const rawToken = generateSecureToken();
    const tokenHash = hashSecureToken(rawToken);
    const expiryHours = input.expiryHours ?? SECURE_TOKEN_DEFAULT_EXPIRY_HOURS;
    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);
    const id = generateUuid();

    await SecureAccessTokenRepository.create(
      {
        id,
        companyId: input.companyId,
        tokenHash,
        purpose: input.purpose,
        entityType: input.entityType,
        entityId: input.entityId,
        expiresAt,
        metadata: input.metadata ?? {},
        createdByUserId: input.createdByUserId,
        createdBy: input.createdByUserId,
        updatedBy: input.createdByUserId,
      },
      { companyId: input.companyId },
    );

    return { token: rawToken, expiresAt, id };
  },

  async assertValid(purpose: string, rawToken: string): Promise<ResolvedSecureToken> {
    const tokenHash = hashSecureToken(rawToken);
    const record = await findActiveTokenRecord(tokenHash, purpose);

    if (!record) {
      throw new NotFoundError('Invalid or expired token', ERROR_CODES.NOT_FOUND);
    }

    if (new Date(record.expiresAt) < new Date()) {
      throw new ConflictError('Token has expired', ERROR_CODES.CONFLICT);
    }

    return {
      id: record.id,
      companyId: record.companyId,
      purpose: record.purpose,
      entityType: record.entityType,
      entityId: record.entityId,
      record,
    };
  },

  async consume(resolved: ResolvedSecureToken, updatedBy: string): Promise<void> {
    await SecureAccessTokenRepository.update(
      resolved.id,
      { usedAt: new Date(), updatedBy },
      { companyId: resolved.companyId },
    );
  },

  async validate(companyId: string, purpose: string, rawToken: string): Promise<{ entityType: string; entityId: string; id: string }> {
    const resolved = await this.assertValid(purpose, rawToken);
    if (resolved.companyId !== companyId) {
      throw new NotFoundError('Invalid or expired token', ERROR_CODES.NOT_FOUND);
    }
    await this.consume(resolved, 'system');
    return { entityType: resolved.entityType, entityId: resolved.entityId, id: resolved.id };
  },

  /** @deprecated Prefer assertValid + consume for explicit lifecycle control */
  async validateLegacy(companyId: string, purpose: string, rawToken: string): Promise<{ entityType: string; entityId: string; id: string }> {
    return this.validate(companyId, purpose, rawToken);
  },

  async revoke(companyId: string, purpose: string, entityType: string, entityId: string, userId: string): Promise<void> {
    const records = await SecureAccessTokenRepository.findMany(
      { purpose, entityType, entityId, revokedAt: { $exists: false } },
      { companyId },
    );

    for (const record of records) {
      await SecureAccessTokenRepository.update(
        record.id,
        { revokedAt: new Date(), updatedBy: userId },
        { companyId },
      );
    }
  },
};
