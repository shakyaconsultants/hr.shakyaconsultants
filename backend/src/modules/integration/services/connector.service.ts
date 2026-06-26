import {
  CONNECTOR_HEALTH_STATUS,
  INTEGRATION_TYPE,
  IntegrationConnectorRepository,
  type IntegrationConnectorDocument,
} from '@domain/integration/integration.schemas.js';
import { SETTING_GROUP } from '@domain/master-data/master-data.schemas.js';
import { NotFoundError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { SettingsService } from '@modules/settings/services/settings.service.js';
import { EmailPlatformService } from '@modules/integration/services/email-platform.service.js';
import { FilePlatformService } from '@modules/integration/services/file-platform.service.js';
import { IntegrationAuditService } from '@modules/integration/services/integration-audit.service.js';
import { INTEGRATION_SETTINGS_GROUP } from '@modules/integration/constants/integration.constants.js';
import type { IntegrationActorContext } from '@modules/approval/types/approval.types.js';
import type { PaginatedResult } from '@shared/types/api.types.js';

export interface ConnectorInput {
  type: string;
  name: string;
  config?: Record<string, unknown>;
  enabled?: boolean;
}

export const ConnectorService = {
  async list(companyId: string, query: { page?: number; pageSize?: number; type?: string; enabled?: boolean }): Promise<PaginatedResult<IntegrationConnectorDocument>> {
    const filter: Record<string, unknown> = {};
    if (query.type) filter.type = query.type;
    if (query.enabled !== undefined) filter.enabled = query.enabled;
    return IntegrationConnectorRepository.paginate(filter, {
      page: query.page,
      pageSize: query.pageSize,
      companyId,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  },

  async getById(companyId: string, id: string): Promise<IntegrationConnectorDocument> {
    return IntegrationConnectorRepository.findByIdOrFail(id, { companyId });
  },

  async create(context: IntegrationActorContext, input: ConnectorInput): Promise<IntegrationConnectorDocument> {
    const doc = await IntegrationConnectorRepository.create({
      id: generateUuid(),
      companyId: context.companyId,
      type: input.type,
      name: input.name,
      config: input.config ?? {},
      status: ENTITY_STATUS.ACTIVE,
      enabled: input.enabled ?? true,
      healthStatus: CONNECTOR_HEALTH_STATUS.UNKNOWN,
      createdBy: context.userId,
      updatedBy: context.userId,
    });

    await this.syncSettings(context, doc);

    await IntegrationAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'integration_connector',
      entityId: doc.id,
      action: 'create',
      after: IntegrationAuditService.toRecord(doc),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return doc;
  },

  async update(context: IntegrationActorContext, id: string, input: Partial<ConnectorInput>): Promise<IntegrationConnectorDocument> {
    const before = await IntegrationConnectorRepository.findByIdOrFail(id, { companyId: context.companyId });
    const update: Record<string, unknown> = { updatedBy: context.userId };
    if (input.name !== undefined) update.name = input.name;
    if (input.config !== undefined) update.config = input.config;
    if (input.enabled !== undefined) update.enabled = input.enabled;
    if (input.type !== undefined) update.type = input.type;

    const updated = await IntegrationConnectorRepository.update(id, { $set: update }, { companyId: context.companyId });
    if (!updated) throw new NotFoundError('Connector not found', ERROR_CODES.NOT_FOUND);

    await this.syncSettings(context, updated);

    await IntegrationAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'integration_connector',
      entityId: id,
      action: 'update',
      before: IntegrationAuditService.toRecord(before),
      after: IntegrationAuditService.toRecord(updated),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return updated;
  },

  async delete(context: IntegrationActorContext, id: string): Promise<void> {
    const before = await IntegrationConnectorRepository.findByIdOrFail(id, { companyId: context.companyId });
    await IntegrationConnectorRepository.softDelete(id, context.userId, { companyId: context.companyId });

    await IntegrationAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'integration_connector',
      entityId: id,
      action: 'delete',
      before: IntegrationAuditService.toRecord(before),
      ip: context.ip,
      userAgent: context.userAgent,
    });
  },

  async syncSettings(context: IntegrationActorContext, connector: IntegrationConnectorDocument): Promise<void> {
    const settingsKey = `${INTEGRATION_SETTINGS_GROUP}.connector.${connector.type}.${connector.id}`;
    try {
      await SettingsService.getByKey(context.companyId, settingsKey);
      await SettingsService.update(context.companyId, settingsKey, {
        value: { name: connector.name, config: connector.config, enabled: connector.enabled },
        group: SETTING_GROUP.INTEGRATIONS,
      }, context);
    } catch {
      await SettingsService.create(context.companyId, {
        key: settingsKey,
        name: connector.name,
        value: { name: connector.name, config: connector.config, enabled: connector.enabled },
        valueType: 'json',
        group: SETTING_GROUP.INTEGRATIONS,
        description: `Connector config for ${connector.name}`,
        isPublic: false,
        isEditable: true,
        encrypted: false,
      }, context);
    }
  },

  async healthCheck(companyId: string, id: string): Promise<{ healthStatus: string; message: string }> {
    const connector = await IntegrationConnectorRepository.findByIdOrFail(id, { companyId });
    const result = await this.testConnector(connector);

    await IntegrationConnectorRepository.update(id, {
      $set: {
        healthStatus: result.healthStatus,
        lastSyncAt: new Date(),
        lastError: result.healthStatus === CONNECTOR_HEALTH_STATUS.HEALTHY ? undefined : result.message,
      },
    }, { companyId });

    return result;
  },

  async testConnector(connector: IntegrationConnectorDocument): Promise<{ healthStatus: string; message: string }> {
    switch (connector.type) {
      case INTEGRATION_TYPE.SMTP: {
        const ok = await EmailPlatformService.verifyConnection();
        return ok
          ? { healthStatus: CONNECTOR_HEALTH_STATUS.HEALTHY, message: 'SMTP connection verified' }
          : { healthStatus: CONNECTOR_HEALTH_STATUS.UNHEALTHY, message: 'SMTP connection failed' };
      }
      case INTEGRATION_TYPE.CLOUDINARY: {
        try {
          FilePlatformService.createSignedUploadParams('health-check');
          return { healthStatus: CONNECTOR_HEALTH_STATUS.HEALTHY, message: 'Cloudinary configured' };
        } catch {
          return { healthStatus: CONNECTOR_HEALTH_STATUS.UNHEALTHY, message: 'Cloudinary configuration invalid' };
        }
      }
      case INTEGRATION_TYPE.WEBHOOK:
        return { healthStatus: CONNECTOR_HEALTH_STATUS.HEALTHY, message: 'Webhook connector ready' };
      default:
        return { healthStatus: CONNECTOR_HEALTH_STATUS.UNKNOWN, message: `Health check not implemented for ${connector.type}` };
    }
  },

  async test(context: IntegrationActorContext, id: string): Promise<{ success: boolean; message: string }> {
    const connector = await IntegrationConnectorRepository.findByIdOrFail(id, { companyId: context.companyId });
    const result = await this.testConnector(connector);

    await IntegrationAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'integration_connector',
      entityId: id,
      action: 'test',
      after: result,
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return {
      success: result.healthStatus === CONNECTOR_HEALTH_STATUS.HEALTHY,
      message: result.message,
    };
  },
};
