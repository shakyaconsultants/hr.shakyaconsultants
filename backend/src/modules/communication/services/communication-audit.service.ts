import { AuditLogRepository, AUDIT_ACTION } from '@domain/audit/audit.schemas.js';
import { AuditLogService } from '@infrastructure/audit/audit-log.service.js';
import { getCorrelationId } from '@shared/context/request.context.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { COMMUNICATION_AUDIT_WHERE } from '@modules/communication/constants/communication.constants.js';

export interface CommunicationAuditInput {
  companyId: string;
  userId: string;
  entityType: string;
  entityId: string;
  action: 'create' | 'update' | 'delete' | 'publish' | 'acknowledge' | 'send' | 'read' | 'archive';
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  ip?: string;
  userAgent?: string;
}

const COMMUNICATION_AUDIT_ACTION_MAP: Record<CommunicationAuditInput['action'], string> = {
  create: AUDIT_ACTION.CREATE,
  update: AUDIT_ACTION.UPDATE,
  delete: AUDIT_ACTION.DELETE,
  publish: AUDIT_ACTION.UPDATE,
  acknowledge: AUDIT_ACTION.UPDATE,
  send: AUDIT_ACTION.CREATE,
  read: AUDIT_ACTION.UPDATE,
  archive: AUDIT_ACTION.UPDATE,
};

export const CommunicationAuditService = {
  toRecord(document: unknown): Record<string, unknown> {
    return JSON.parse(JSON.stringify(document)) as Record<string, unknown>;
  },

  async log(input: CommunicationAuditInput): Promise<void> {
    const correlationId = getCorrelationId() ?? 'system';
    const changes = { before: input.before ?? null, after: input.after ?? null, correlationId };

    AuditLogService.log({
      who: input.userId,
      where: COMMUNICATION_AUDIT_WHERE,
      action: COMMUNICATION_AUDIT_ACTION_MAP[input.action],
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
      action: COMMUNICATION_AUDIT_ACTION_MAP[input.action],
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
