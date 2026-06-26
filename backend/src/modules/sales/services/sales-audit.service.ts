import { AuditLogRepository } from '@domain/audit/audit.schemas.js';
import { AUDIT_ACTION } from '@domain/audit/audit.schemas.js';
import { AuditLogService } from '@infrastructure/audit/audit-log.service.js';
import { getCorrelationId } from '@shared/context/request.context.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { SALES_AUDIT_WHERE } from '@modules/sales/constants/sales.constants.js';

export interface SalesAuditInput {
  companyId: string;
  userId: string;
  entityType: string;
  entityId: string;
  action: 'create' | 'update' | 'delete' | 'assign' | 'move' | 'import' | 'export';
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  ip?: string;
  userAgent?: string;
}

function toRecord(document: unknown): Record<string, unknown> {
  return JSON.parse(JSON.stringify(document)) as Record<string, unknown>;
}

const SALES_AUDIT_ACTION_MAP: Record<SalesAuditInput['action'], string> = {
  create: AUDIT_ACTION.CREATE,
  update: AUDIT_ACTION.UPDATE,
  delete: AUDIT_ACTION.DELETE,
  assign: AUDIT_ACTION.UPDATE,
  move: AUDIT_ACTION.UPDATE,
  import: AUDIT_ACTION.CREATE,
  export: AUDIT_ACTION.UPDATE,
};

export const SalesAuditService = {
  toRecord,

  async log(input: SalesAuditInput): Promise<void> {
    const correlationId = getCorrelationId() ?? 'system';
    const changes = { before: input.before ?? null, after: input.after ?? null, correlationId };

    AuditLogService.log({
      who: input.userId,
      where: SALES_AUDIT_WHERE,
      action: SALES_AUDIT_ACTION_MAP[input.action],
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
      action: AUDIT_ACTION.UPDATE,
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
