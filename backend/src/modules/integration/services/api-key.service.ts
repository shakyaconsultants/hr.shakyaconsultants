import { createHash, randomBytes } from 'node:crypto';
import {
  ApiKeyRepository,
  INTEGRATION_LOG_CATEGORY,
  type ApiKeyDocument,
} from '@domain/integration/integration.schemas.js';
import { ApiLogRepository } from '@domain/audit/audit.schemas.js';
import { NotFoundError, AuthenticationError, BadRequestError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { IntegrationLogService } from '@modules/integration/services/integration-log.service.js';
import { IntegrationAuditService } from '@modules/integration/services/integration-audit.service.js';
import type { IntegrationActorContext } from '@modules/approval/types/approval.types.js';
import type { PaginatedResult } from '@shared/types/api.types.js';

export interface CreateApiKeyInput {
  name: string;
  permissions?: string[];
  rateLimit?: number;
  expiresAt?: string;
  allowedIps?: string[];
}

function hashKey(plainKey: string): string {
  return createHash('sha256').update(plainKey).digest('hex');
}

function generatePlainKey(): string {
  return `hsk_${randomBytes(32).toString('hex')}`;
}

function sanitize(doc: ApiKeyDocument): Omit<ApiKeyDocument, 'keyHash'> {
  const { keyHash: _keyHash, ...rest } = doc;
  return rest;
}

export const ApiKeyService = {
  async list(companyId: string, query: { page?: number; pageSize?: number; search?: string }): Promise<PaginatedResult<Omit<ApiKeyDocument, 'keyHash'>>> {
    const filter: Record<string, unknown> = {};
    if (query.search) {
      filter.name = { $regex: query.search, $options: 'i' };
    }
    const result = await ApiKeyRepository.paginate(filter, {
      page: query.page,
      pageSize: query.pageSize,
      companyId,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    return {
      ...result,
      items: result.items.map(sanitize),
    };
  },

  async create(context: IntegrationActorContext, input: CreateApiKeyInput): Promise<{ apiKey: Omit<ApiKeyDocument, 'keyHash'>; plainKey: string }> {
    const plainKey = generatePlainKey();
    const keyPrefix = plainKey.slice(0, 12);
    const doc = await ApiKeyRepository.create({
      id: generateUuid(),
      companyId: context.companyId,
      name: input.name,
      keyHash: hashKey(plainKey),
      keyPrefix,
      permissions: input.permissions ?? [],
      rateLimit: input.rateLimit ?? 1000,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
      allowedIps: input.allowedIps ?? [],
      isRevoked: false,
      createdBy: context.userId,
      updatedBy: context.userId,
    });

    await IntegrationAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'api_key',
      entityId: doc.id,
      action: 'create',
      after: IntegrationAuditService.sanitizeApiKey(IntegrationAuditService.toRecord(doc)),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return { apiKey: sanitize(doc), plainKey };
  },

  async rotate(context: IntegrationActorContext, id: string): Promise<{ apiKey: Omit<ApiKeyDocument, 'keyHash'>; plainKey: string }> {
    const existing = await ApiKeyRepository.findByIdOrFail(id, { companyId: context.companyId });
    if (existing.isRevoked) {
      throw new BadRequestError('Cannot rotate a revoked API key');
    }
    const plainKey = generatePlainKey();
    const updated = await ApiKeyRepository.update(id, {
      $set: {
        keyHash: hashKey(plainKey),
        keyPrefix: plainKey.slice(0, 12),
        updatedBy: context.userId,
      },
    }, { companyId: context.companyId });

    if (!updated) throw new NotFoundError('API key not found', ERROR_CODES.NOT_FOUND);

    await IntegrationAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'api_key',
      entityId: id,
      action: 'rotate',
      before: IntegrationAuditService.sanitizeApiKey(IntegrationAuditService.toRecord(existing)),
      after: IntegrationAuditService.sanitizeApiKey(IntegrationAuditService.toRecord(updated)),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return { apiKey: sanitize(updated), plainKey };
  },

  async revoke(context: IntegrationActorContext, id: string): Promise<Omit<ApiKeyDocument, 'keyHash'>> {
    const existing = await ApiKeyRepository.findByIdOrFail(id, { companyId: context.companyId });
    const updated = await ApiKeyRepository.update(id, {
      $set: { isRevoked: true, updatedBy: context.userId },
    }, { companyId: context.companyId });

    if (!updated) throw new NotFoundError('API key not found', ERROR_CODES.NOT_FOUND);

    await IntegrationAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'api_key',
      entityId: id,
      action: 'revoke',
      before: IntegrationAuditService.sanitizeApiKey(IntegrationAuditService.toRecord(existing)),
      after: IntegrationAuditService.sanitizeApiKey(IntegrationAuditService.toRecord(updated)),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return sanitize(updated);
  },

  async regenerate(context: IntegrationActorContext, id: string): Promise<{ apiKey: Omit<ApiKeyDocument, 'keyHash'>; plainKey: string }> {
    await this.revoke(context, id);
    const existing = await ApiKeyRepository.findByIdOrFail(id, { companyId: context.companyId, includeDeleted: false });
    return this.create(context, {
      name: `${existing.name} (regenerated)`,
      permissions: existing.permissions,
      rateLimit: existing.rateLimit,
      allowedIps: existing.allowedIps,
    });
  },

  async validate(companyId: string, plainKey: string, ip?: string): Promise<ApiKeyDocument | null> {
    const keyHash = hashKey(plainKey);
    const doc = await ApiKeyRepository.findOne({ keyHash, isRevoked: false }, { companyId });
    if (!doc) return null;

    if (doc.expiresAt && doc.expiresAt < new Date()) {
      return null;
    }

    if (doc.allowedIps.length > 0 && ip && !doc.allowedIps.includes(ip)) {
      throw new AuthenticationError('IP not allowed for this API key', ERROR_CODES.AUTH_UNAUTHORIZED);
    }

    await ApiKeyRepository.update(doc.id, { $set: { lastUsedAt: new Date() } }, { companyId });

    await IntegrationLogService.log({
      companyId,
      userId: doc.createdBy,
      category: INTEGRATION_LOG_CATEGORY.API,
      message: `API key used: ${doc.name}`,
      metadata: { apiKeyId: doc.id, keyPrefix: doc.keyPrefix, ip },
    });

    await ApiLogRepository.create({
      id: generateUuid(),
      companyId,
      method: 'API_KEY',
      path: '/integration/api',
      statusCode: 200,
      durationMs: 0,
      ipAddress: ip ?? 'unknown',
      requestId: generateUuid(),
      createdBy: doc.createdBy,
      updatedBy: doc.createdBy,
    });

    return doc;
  },

  async getUsage(companyId: string, id: string): Promise<{ apiKeyId: string; lastUsedAt?: Date; logCount: number }> {
    const doc = await ApiKeyRepository.findByIdOrFail(id, { companyId });
    const logCount = await IntegrationLogService.list(companyId, {
      page: 1,
      pageSize: 1,
      search: doc.keyPrefix,
    });
    return {
      apiKeyId: doc.id,
      lastUsedAt: doc.lastUsedAt,
      logCount: logCount.pagination.total,
    };
  },
};
