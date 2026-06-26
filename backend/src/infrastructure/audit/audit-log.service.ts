import type { AuditLogEntry } from '@shared/types/api.types.js';
import { AuditAction } from '@shared/enums/index.js';
import { auditLogger } from '@logging/winston.logger.js';
import { getCorrelationId, getRequestContext } from '@shared/context/request.context.js';

export interface AuditLogInput {
  who: string;
  where: string;
  action: AuditAction | string;
  entity: string;
  entityId: string;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  ip?: string;
  device?: string;
  correlationId?: string;
  tenantId?: string;
}

export const AuditLogService = {
  log(input: AuditLogInput): void {
    const ctx = getRequestContext();
    const entry: AuditLogEntry = {
      who: input.who,
      when: new Date().toISOString(),
      where: input.where,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      oldValue: input.oldValue ?? null,
      newValue: input.newValue ?? null,
      ip: input.ip ?? ctx?.ip,
      device: input.device ?? ctx?.userAgent,
      correlationId: input.correlationId ?? getCorrelationId() ?? 'system',
      tenantId: input.tenantId ?? ctx?.tenantId,
    };
    auditLogger.info('audit_event', entry);
  },

  logCreate(entity: string, entityId: string, who: string, where: string, newValue: Record<string, unknown>): void {
    this.log({ who, where, action: AuditAction.Create, entity, entityId, newValue });
  },

  logUpdate(
    entity: string,
    entityId: string,
    who: string,
    where: string,
    oldValue: Record<string, unknown>,
    newValue: Record<string, unknown>,
  ): void {
    this.log({ who, where, action: AuditAction.Update, entity, entityId, oldValue, newValue });
  },

  logDelete(
    entity: string,
    entityId: string,
    who: string,
    where: string,
    oldValue: Record<string, unknown>,
  ): void {
    this.log({ who, where, action: AuditAction.Delete, entity, entityId, oldValue });
  },
};
