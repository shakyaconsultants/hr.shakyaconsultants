import {
  ApiKeyRepository,
  IntegrationConnectorRepository,
  WebhookSubscriptionRepository,
  ImportJobRepository,
  ExportJobRepository,
  ScheduledJobRepository,
  IntegrationLogRepository,
  BackupRecordRepository,
  JOB_STATUS,
  CONNECTOR_HEALTH_STATUS,
} from '@domain/integration/integration.schemas.js';
import { SystemAdminService } from '@modules/settings/services/system-admin.service.js';

export const IntegrationDashboardService = {
  async getOverview(companyId: string) {
    const [
      connectors,
      apiKeys,
      webhooks,
      importJobs,
      exportJobs,
      scheduledJobs,
      logs,
      backups,
      systemHealth,
    ] = await Promise.all([
      IntegrationConnectorRepository.count({}, { companyId }),
      ApiKeyRepository.count({ isRevoked: false }, { companyId }),
      WebhookSubscriptionRepository.count({ enabled: true }, { companyId }),
      ImportJobRepository.count({ status: JOB_STATUS.COMPLETED }, { companyId }),
      ExportJobRepository.count({ status: JOB_STATUS.COMPLETED }, { companyId }),
      ScheduledJobRepository.count({ enabled: true }, { companyId }),
      IntegrationLogRepository.count({}, { companyId }),
      BackupRecordRepository.count({}, { companyId }),
      SystemAdminService.getSystemHealth(),
    ]);

    const unhealthyConnectors = await IntegrationConnectorRepository.count(
      { healthStatus: { $in: [CONNECTOR_HEALTH_STATUS.UNHEALTHY, CONNECTOR_HEALTH_STATUS.DEGRADED] } },
      { companyId },
    );

    const recentImports = await ImportJobRepository.paginate({}, {
      page: 1,
      pageSize: 5,
      companyId,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    const recentExports = await ExportJobRepository.paginate({}, {
      page: 1,
      pageSize: 5,
      companyId,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    return {
      summary: {
        connectors,
        apiKeys,
        webhooks,
        completedImports: importJobs,
        completedExports: exportJobs,
        scheduledJobs,
        logs,
        backups,
        unhealthyConnectors,
      },
      systemHealth,
      recentImports: recentImports.items,
      recentExports: recentExports.items,
    };
  },
};
