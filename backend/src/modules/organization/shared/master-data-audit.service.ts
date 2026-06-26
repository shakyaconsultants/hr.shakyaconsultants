import { AuditLogRepository } from '@domain/audit/audit.schemas.js';
import { AUDIT_ACTION } from '@domain/audit/audit.schemas.js';
import { AuditLogService } from '@infrastructure/audit/audit-log.service.js';
import { AuditAction } from '@shared/enums/index.js';
import { getCorrelationId } from '@shared/context/request.context.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { ORGANIZATION_AUDIT_WHERE } from '@modules/organization/constants/organization.constants.js';

export interface MasterDataAuditInput {
  companyId: string;
  userId: string;
  entityType: string;
  entityId: string;
  action: 'create' | 'update' | 'delete' | 'restore' | 'bulk_create' | 'bulk_update' | 'bulk_delete' | 'import' | 'export';
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  ip?: string;
  userAgent?: string;
}

const ACTION_MAP: Record<MasterDataAuditInput['action'], string> = {
  create: AUDIT_ACTION.CREATE,
  update: AUDIT_ACTION.UPDATE,
  delete: AUDIT_ACTION.DELETE,
  restore: AUDIT_ACTION.UPDATE,
  bulk_create: AUDIT_ACTION.IMPORT,
  bulk_update: AUDIT_ACTION.UPDATE,
  bulk_delete: AUDIT_ACTION.DELETE,
  import: AUDIT_ACTION.IMPORT,
  export: AUDIT_ACTION.EXPORT,
};

const WINSTON_ACTION_MAP: Record<MasterDataAuditInput['action'], AuditAction | string> = {
  create: AuditAction.Create,
  update: AuditAction.Update,
  delete: AuditAction.Delete,
  restore: AuditAction.Update,
  bulk_create: AuditAction.Create,
  bulk_update: AuditAction.Update,
  bulk_delete: AuditAction.Delete,
  import: AuditAction.Create,
  export: AuditAction.Export,
};

export const MasterDataAuditService = {
  async log(input: MasterDataAuditInput): Promise<void> {
    const correlationId = getCorrelationId() ?? 'system';
    const auditAction = ACTION_MAP[input.action];
    const changes: Record<string, unknown> = {
      before: input.before ?? null,
      after: input.after ?? null,
      correlationId,
    };

    AuditLogService.log({
      who: input.userId,
      where: ORGANIZATION_AUDIT_WHERE.ORGANIZATION,
      action: WINSTON_ACTION_MAP[input.action],
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
      action: auditAction,
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
