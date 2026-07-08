import {
  ApiKeyRepository,
  IntegrationConnectorRepository,
  WebhookSubscriptionRepository,
  WebhookDeliveryRepository,
  ImportJobRepository,
  ExportJobRepository,
  ScheduledJobRepository,
  IntegrationLogRepository,
  BackupRecordRepository,
  JOB_STATUS,
  CONNECTOR_HEALTH_STATUS,
  INTEGRATION_LOG_CATEGORY,
} from '@domain/integration/integration.schemas.js';
import { SystemAdminService } from '@modules/settings/services/system-admin.service.js';

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export const IntegrationDashboardService = {
  async getOverview(companyId: string) {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const todayStart = startOfToday();

    const [
      totalConnectors,
      unhealthyConnectors,
      enabledConnectors,
      apiKeys,
      webhooks,
      importsToday,
      exportsToday,
      schedulerActiveJobs,
      schedulerFailedJobs,
      webhookActivity24h,
      apiUsage24h,
      storageInfo,
      emailDelivery,
      recentErrorLogs,
    ] = await Promise.all([
      IntegrationConnectorRepository.count({}, { companyId }),
      IntegrationConnectorRepository.count(
        {
          healthStatus: {
            $in: [CONNECTOR_HEALTH_STATUS.UNHEALTHY, CONNECTOR_HEALTH_STATUS.DEGRADED],
          },
        },
        { companyId },
      ),
      IntegrationConnectorRepository.count({ enabled: true }, { companyId }),
      ApiKeyRepository.count({ isRevoked: false }, { companyId }),
      WebhookSubscriptionRepository.count({ enabled: true }, { companyId }),
      ImportJobRepository.count({ createdAt: { $gte: todayStart } }, { companyId }),
      ExportJobRepository.count({ createdAt: { $gte: todayStart } }, { companyId }),
      ScheduledJobRepository.count({ enabled: true }, { companyId }),
      ScheduledJobRepository.count({ lastStatus: JOB_STATUS.FAILED }, { companyId }),
      WebhookDeliveryRepository.count({ createdAt: { $gte: since24h } }, { companyId }),
      ApiKeyRepository.count({ lastUsedAt: { $gte: since24h } }, { companyId }),
      SystemAdminService.getStorageInfo(companyId),
      Promise.resolve(SystemAdminService.getEmailDeliveryStatus()),
      IntegrationLogRepository.paginate(
        { category: INTEGRATION_LOG_CATEGORY.WEBHOOK },
        {
          page: 1,
          pageSize: 10,
          companyId,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        },
      ),
    ]);

    const connectedServices = Math.max(0, enabledConnectors - unhealthyConnectors);

    return {
      connectedServices,
      failedIntegrations: unhealthyConnectors,
      webhookActivity24h,
      apiUsage24h: apiUsage24h,
      importJobsToday: importsToday,
      exportJobsToday: exportsToday,
      schedulerActiveJobs,
      schedulerFailedJobs,
      storageUsedMb: storageInfo.usedMb ?? 0,
      storageQuotaMb: storageInfo.quotaMb,
      emailQueuePending: 0,
      emailQueueFailed: emailDelivery.configured ? 0 : 1,
      emailConfigured: emailDelivery.configured,
      emailMode: emailDelivery.mode as 'direct',
      recentFailures: recentErrorLogs.items
        .filter((log) => log.message.toLowerCase().includes('fail'))
        .slice(0, 5)
        .map((log) => ({
          id: log.id,
          source: log.category,
          message: log.message,
          occurredAt: log.createdAt.toISOString(),
        })),
      updatedAt: new Date().toISOString(),
      summary: {
        connectors: totalConnectors,
        apiKeys,
        webhooks,
        backups: await BackupRecordRepository.count({}, { companyId }),
      },
    };
  },
};
