import { AuditLogRepository } from '@domain/audit/audit.schemas.js';
import { AUDIT_ACTION } from '@domain/audit/audit.schemas.js';
import { AuditLogService } from '@infrastructure/audit/audit-log.service.js';
import { getCorrelationId } from '@shared/context/request.context.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { LEAVE_EXIT_AUDIT_WHERE } from '@modules/leave-exit/constants/leave-exit.constants.js';

export interface LeaveExitAuditInput {
  companyId: string;
  userId: string;
  entityType: string;
  entityId: string;
  action: 'create' | 'update' | 'delete' | 'approve' | 'reject' | 'withdraw' | 'clear';
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  ip?: string;
  userAgent?: string;
}

function toRecord(document: unknown): Record<string, unknown> {
  return JSON.parse(JSON.stringify(document)) as Record<string, unknown>;
}

const LEAVE_EXIT_AUDIT_ACTION_MAP: Record<LeaveExitAuditInput['action'], string> = {
  create: AUDIT_ACTION.CREATE,
  update: AUDIT_ACTION.UPDATE,
  delete: AUDIT_ACTION.DELETE,
  approve: AUDIT_ACTION.UPDATE,
  reject: AUDIT_ACTION.UPDATE,
  withdraw: AUDIT_ACTION.UPDATE,
  clear: AUDIT_ACTION.UPDATE,
};

export const LeaveExitAuditService = {
  toRecord,

  async log(input: LeaveExitAuditInput): Promise<void> {
    const correlationId = getCorrelationId() ?? 'system';
    const changes = { before: input.before ?? null, after: input.after ?? null, correlationId };

    AuditLogService.log({
      who: input.userId,
      where: LEAVE_EXIT_AUDIT_WHERE,
      action: LEAVE_EXIT_AUDIT_ACTION_MAP[input.action],
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
