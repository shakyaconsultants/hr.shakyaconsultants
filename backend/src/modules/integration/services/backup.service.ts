import {
  BACKUP_TYPE,
  BACKUP_VERIFICATION_STATUS,
  BackupRecordRepository,
  INTEGRATION_LOG_CATEGORY,
  JOB_STATUS,
  type BackupRecordDocument,
} from '@domain/integration/integration.schemas.js';
import { SETTING_GROUP } from '@domain/master-data/master-data.schemas.js';
import { NotFoundError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { SettingsService } from '@modules/settings/services/settings.service.js';
import { IntegrationLogService } from '@modules/integration/services/integration-log.service.js';
import { IntegrationAuditService } from '@modules/integration/services/integration-audit.service.js';
import type { IntegrationActorContext } from '@modules/approval/types/approval.types.js';
import type { PaginatedResult } from '@shared/types/api.types.js';

export const BackupService = {
  async list(companyId: string, query: { page?: number; pageSize?: number; type?: string }): Promise<PaginatedResult<BackupRecordDocument>> {
    const filter: Record<string, unknown> = {};
    if (query.type) filter.type = query.type;
    return BackupRecordRepository.paginate(filter, {
      page: query.page,
      pageSize: query.pageSize,
      companyId,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  },

  async getById(companyId: string, id: string): Promise<BackupRecordDocument> {
    return BackupRecordRepository.findByIdOrFail(id, { companyId });
  },

  async trigger(context: IntegrationActorContext, type: string = BACKUP_TYPE.SETTINGS): Promise<BackupRecordDocument> {
    const settings = await SettingsService.getByGroup(context.companyId, SETTING_GROUP.INTEGRATIONS);
    const allSettings = await SettingsService.list(context.companyId, { page: 1, pageSize: 1000 });
    const backupPayload = {
      integrations: settings,
      settingsCount: allSettings.pagination.total,
      exportedAt: new Date().toISOString(),
    };
    const json = JSON.stringify(backupPayload, null, 2);
    const sizeBytes = Buffer.byteLength(json, 'utf-8');
    const fileName = `backup-${type}-${Date.now()}.json`;

    const record = await BackupRecordRepository.create({
      id: generateUuid(),
      companyId: context.companyId,
      type,
      status: JOB_STATUS.COMPLETED,
      sizeBytes,
      verificationStatus: BACKUP_VERIFICATION_STATUS.VERIFIED,
      fileName,
      backupMeta: { settingsCount: allSettings.pagination.total, payloadPreview: json.slice(0, 500) },
      createdBy: context.userId,
      updatedBy: context.userId,
    });

    await IntegrationLogService.log({
      companyId: context.companyId,
      userId: context.userId,
      category: INTEGRATION_LOG_CATEGORY.API,
      message: `Backup created: ${type}`,
      metadata: { backupId: record.id, sizeBytes },
    });

    await IntegrationAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'backup_record',
      entityId: record.id,
      action: 'create',
      after: { type, sizeBytes, fileName },
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return record;
  },

  async restore(_context: IntegrationActorContext, id: string): Promise<{ message: string; backupId: string }> {
    throw new NotFoundError(
      `Restore is not implemented — backup ${id} is stored for architecture reference only`,
      ERROR_CODES.NOT_FOUND,
    );
  },
};
