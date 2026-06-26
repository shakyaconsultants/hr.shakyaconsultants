import { AuditLogRepository, AUDIT_ACTION } from '@domain/audit/audit.schemas.js';
import { AuditLogService } from '@infrastructure/audit/audit-log.service.js';
import { getCorrelationId } from '@shared/context/request.context.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { INTEGRATION_AUDIT_WHERE } from '@modules/integration/constants/integration.constants.js';

export interface IntegrationAuditInput {
  companyId: string;
  userId: string;
  entityType: string;
  entityId: string;
  action: 'create' | 'update' | 'delete' | 'view' | 'export' | 'import' | 'test' | 'rotate' | 'revoke';
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  ip?: string;
  userAgent?: string;
}

const INTEGRATION_AUDIT_ACTION_MAP: Record<IntegrationAuditInput['action'], string> = {
  create: AUDIT_ACTION.CREATE,
  update: AUDIT_ACTION.UPDATE,
  delete: AUDIT_ACTION.DELETE,
  view: AUDIT_ACTION.READ,
  export: AUDIT_ACTION.EXPORT,
  import: AUDIT_ACTION.IMPORT,
  test: AUDIT_ACTION.READ,
  rotate: AUDIT_ACTION.UPDATE,
  revoke: AUDIT_ACTION.UPDATE,
};

export const IntegrationAuditService = {
  toRecord(document: unknown): Record<string, unknown> {
    return JSON.parse(JSON.stringify(document)) as Record<string, unknown>;
  },

  sanitizeApiKey(record: Record<string, unknown>): Record<string, unknown> {
    const copy = { ...record };
    delete copy.keyHash;
    return copy;
  },

  async log(input: IntegrationAuditInput): Promise<void> {
    const correlationId = getCorrelationId() ?? 'system';
    const changes = { before: input.before ?? null, after: input.after ?? null, correlationId };

    AuditLogService.log({
      who: input.userId,
      where: INTEGRATION_AUDIT_WHERE,
      action: INTEGRATION_AUDIT_ACTION_MAP[input.action],
      entity: input.entityType,
      entityId: input.entityId,
      oldValue: input.before ?? null,
      newValue: input.after ?? null,
      ip: input.ip,
      device: input.userAgent,
      correlationId,
      tenantId: input.companyId,
    });

    await AuditLogRepository.create({
      id: generateUuid(),
      companyId: input.companyId,
      action: INTEGRATION_AUDIT_ACTION_MAP[input.action],
      entityType: input.entityType,
      entityId: input.entityId,
      userId: input.userId,
      changes,
      ipAddress: input.ip,
      userAgent: input.userAgent,
      createdBy: input.userId,
      updatedBy: input.userId,
    });
  },
};
