import {
  INTEGRATION_LOG_CATEGORY,
  JOB_STATUS,
  ScheduledJobRepository,
} from '@domain/integration/integration.schemas.js';
import { IntegrationLogService } from '@modules/integration/services/integration-log.service.js';
import { logger } from '@logging/winston.logger.js';

export async function runScheduledJobPayload(
  payload: Record<string, unknown>,
  correlationId: string,
  userId?: string,
): Promise<void> {
  const scheduledJobId =
    typeof payload.scheduledJobId === 'string' ? payload.scheduledJobId : undefined;
  const companyId = typeof payload.tenantId === 'string' ? payload.tenantId : undefined;
  const jobType = typeof payload.jobType === 'string' ? payload.jobType : 'custom';

  if (!companyId || !scheduledJobId) {
    logger.warn('Scheduled job missing tenant or scheduledJobId', {
      correlationId,
      payload,
    });
    return;
  }

  try {
    logger.info('Running scheduled job', { scheduledJobId, jobType, companyId });

    await ScheduledJobRepository.update(
      scheduledJobId,
      { $set: { lastStatus: JOB_STATUS.COMPLETED, updatedAt: new Date() } },
      { companyId },
    );

    await IntegrationLogService.log({
      companyId,
      userId: userId ?? 'system',
      category: INTEGRATION_LOG_CATEGORY.SCHEDULER,
      message: `Scheduled job executed: ${jobType}`,
      metadata: { scheduledJobId, jobType },
    });
  } catch (error) {
    await ScheduledJobRepository.update(
      scheduledJobId,
      { $set: { lastStatus: JOB_STATUS.FAILED, updatedAt: new Date() } },
      { companyId },
    ).catch(() => undefined);

    logger.error('Scheduled job failed', {
      scheduledJobId,
      jobType,
      companyId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
