import type { Job } from 'bullmq';
import {
  INTEGRATION_LOG_CATEGORY,
  JOB_STATUS,
  ScheduledJobRepository,
} from '@domain/integration/integration.schemas.js';
import { SCHEDULER_QUEUE_JOB } from '@modules/integration/constants/integration.constants.js';
import { IntegrationLogService } from '@modules/integration/services/integration-log.service.js';
import type { QueueJobData } from '@infrastructure/queue/queue.producer.js';
import { queueLogger } from '@logging/winston.logger.js';

export async function processSchedulerJob(job: Job<QueueJobData>): Promise<void> {
  if (job.name !== SCHEDULER_QUEUE_JOB.RUN) {
    queueLogger.info('Webhook queue job skipped (unknown scheduler name)', {
      jobName: job.name,
      correlationId: job.data.correlationId,
    });
    return;
  }

  const payload = job.data.payload;
  const scheduledJobId =
    typeof payload.scheduledJobId === 'string' ? payload.scheduledJobId : undefined;
  const companyId =
    job.data.tenantId ?? (typeof payload.tenantId === 'string' ? payload.tenantId : undefined);
  const jobType = typeof payload.jobType === 'string' ? payload.jobType : 'custom';

  if (!companyId || !scheduledJobId) {
    queueLogger.warn('Scheduler job missing tenant or scheduledJobId', {
      correlationId: job.data.correlationId,
      payload,
    });
    return;
  }

  try {
    queueLogger.info('Running scheduled job', { scheduledJobId, jobType, companyId });

    await ScheduledJobRepository.update(
      scheduledJobId,
      { $set: { lastStatus: JOB_STATUS.COMPLETED, updatedAt: new Date() } },
      { companyId },
    );

    await IntegrationLogService.log({
      companyId,
      userId: job.data.userId ?? 'system',
      category: INTEGRATION_LOG_CATEGORY.SCHEDULER,
      message: `Scheduled job executed: ${jobType}`,
      metadata: { scheduledJobId, jobType, queueJobId: job.id },
    });
  } catch (error) {
    await ScheduledJobRepository.update(
      scheduledJobId,
      { $set: { lastStatus: JOB_STATUS.FAILED, updatedAt: new Date() } },
      { companyId },
    ).catch(() => undefined);

    queueLogger.error('Scheduled job failed', {
      scheduledJobId,
      jobType,
      companyId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function runSchedulerPayload(
  payload: Record<string, unknown>,
  correlationId: string,
): Promise<void> {
  const mockJob = {
    name: SCHEDULER_QUEUE_JOB.RUN,
    id: 'direct',
    data: {
      correlationId,
      tenantId: typeof payload.tenantId === 'string' ? payload.tenantId : undefined,
      userId: typeof payload.userId === 'string' ? payload.userId : undefined,
      payload,
    },
  } as Job<QueueJobData>;

  await processSchedulerJob(mockJob);
}
