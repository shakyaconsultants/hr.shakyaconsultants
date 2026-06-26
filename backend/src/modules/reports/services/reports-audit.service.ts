import { AuditLogRepository, AUDIT_ACTION } from '@domain/audit/audit.schemas.js';
import { AuditLogService } from '@infrastructure/audit/audit-log.service.js';
import { getCorrelationId } from '@shared/context/request.context.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { REPORTS_AUDIT_WHERE } from '@modules/reports/constants/reports.constants.js';

export interface ReportsAuditInput {
  companyId: string;
  userId: string;
  entityType: string;
  entityId: string;
  action: 'view' | 'export' | 'update_settings' | 'generate';
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  ip?: string;
  userAgent?: string;
}

const REPORTS_AUDIT_ACTION_MAP: Record<ReportsAuditInput['action'], string> = {
  view: AUDIT_ACTION.READ,
  export: AUDIT_ACTION.EXPORT,
  update_settings: AUDIT_ACTION.UPDATE,
  generate: AUDIT_ACTION.READ,
};

export const ReportsAuditService = {
  toRecord(document: unknown): Record<string, unknown> {
    return JSON.parse(JSON.stringify(document)) as Record<string, unknown>;
  },

  async log(input: ReportsAuditInput): Promise<void> {
    const correlationId = getCorrelationId() ?? 'system';
    const changes = { before: input.before ?? null, after: input.after ?? null, correlationId };

    AuditLogService.log({
      who: input.userId,
      where: REPORTS_AUDIT_WHERE,
      action: REPORTS_AUDIT_ACTION_MAP[input.action],
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
      action: REPORTS_AUDIT_ACTION_MAP[input.action],
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
