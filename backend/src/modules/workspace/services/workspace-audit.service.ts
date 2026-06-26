import { AuditLogRepository } from '@domain/audit/audit.schemas.js';
import { AUDIT_ACTION } from '@domain/audit/audit.schemas.js';
import { AuditLogService } from '@infrastructure/audit/audit-log.service.js';
import { getCorrelationId } from '@shared/context/request.context.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { WORKSPACE_AUDIT_WHERE } from '@modules/workspace/constants/workspace.constants.js';

export interface WorkspaceAuditInput {
  companyId: string;
  userId: string;
  entityType: string;
  entityId: string;
  action: 'create' | 'update' | 'delete' | 'read' | 'download' | 'acknowledge';
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  ip?: string;
  userAgent?: string;
}

const ACTION_MAP: Record<WorkspaceAuditInput['action'], string> = {
  create: AUDIT_ACTION.CREATE,
  update: AUDIT_ACTION.UPDATE,
  delete: AUDIT_ACTION.DELETE,
  read: AUDIT_ACTION.READ,
  download: AUDIT_ACTION.READ,
  acknowledge: AUDIT_ACTION.UPDATE,
};

function toRecord(document: unknown): Record<string, unknown> {
  return JSON.parse(JSON.stringify(document)) as Record<string, unknown>;
}

export const WorkspaceAuditService = {
  toRecord,

  async log(input: WorkspaceAuditInput): Promise<void> {
    const correlationId = getCorrelationId() ?? 'system';
    const changes: Record<string, unknown> = {
      before: input.before ?? null,
      after: input.after ?? null,
      correlationId,
    };

    AuditLogService.log({
      who: input.userId,
      where: WORKSPACE_AUDIT_WHERE,
      action: ACTION_MAP[input.action],
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
      action: ACTION_MAP[input.action],
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
