import type { JobsOptions } from 'bullmq';
import { getQueue, isQueuesEnabled } from '@infrastructure/queue/bullmq.connection.js';
import { deliverEmailPayload } from '@infrastructure/queue/processors/email-queue.processor.js';
import { isRedisAvailable } from '@infrastructure/redis/redis.client.js';
import { QUEUE_NAMES, type QueueName } from '@shared/constants/queue.constants.js';
import { getCorrelationId } from '@shared/context/request.context.js';
import { queueLogger } from '@logging/winston.logger.js';

export interface QueueJobData {
  correlationId: string;
  tenantId?: string;
  userId?: string;
  payload: Record<string, unknown>;
}

export const QueueProducer = {
  async addJob(
    queueName: QueueName,
    jobName: string,
    payload: Record<string, unknown>,
    options?: JobsOptions,
  ): Promise<string | undefined> {
    if (!isQueuesEnabled()) {
      return undefined;
    }

    const queue = getQueue(queueName);
    const correlationId = getCorrelationId() ?? 'system';
    const data: QueueJobData = {
      correlationId,
      tenantId: typeof payload.tenantId === 'string' ? payload.tenantId : undefined,
      userId: typeof payload.userId === 'string' ? payload.userId : undefined,
      payload,
    };

    const job = await queue.add(jobName, data, options);
    queueLogger.info('Job enqueued', { queue: queueName, jobName, jobId: job.id, correlationId });
    return job.id;
  },

  async addEmailJob(
    jobName: string,
    payload: Record<string, unknown>,
    options?: JobsOptions,
  ): Promise<string> {
    const correlationId = getCorrelationId() ?? 'system';
    const data: QueueJobData = {
      correlationId,
      tenantId: typeof payload.tenantId === 'string' ? payload.tenantId : undefined,
      userId: typeof payload.userId === 'string' ? payload.userId : undefined,
      payload,
    };

    if (isQueuesEnabled() && isRedisAvailable()) {
      try {
        const jobId = await this.addJob(QUEUE_NAMES.EMAIL, jobName, payload, options);
        queueLogger.info('Email job queued', { jobName, correlationId, to: payload.to, jobId });
        return jobId ?? 'queued';
      } catch (error) {
        queueLogger.warn('Email queue unavailable — delivering directly', {
          jobName,
          correlationId,
          to: payload.to,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    try {
      await deliverEmailPayload(data, jobName);
      queueLogger.info('Email delivered directly (queue unavailable)', {
        jobName,
        correlationId,
        to: payload.to,
      });
      return 'delivered';
    } catch (error) {
      queueLogger.error('Direct email delivery failed', {
        jobName,
        correlationId,
        to: payload.to,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  },

  addNotificationJob(
    jobName: string,
    payload: Record<string, unknown>,
    options?: JobsOptions,
  ): Promise<string | undefined> {
    return this.addJob(QUEUE_NAMES.NOTIFICATION, jobName, payload, options);
  },

  addPayrollJob(
    jobName: string,
    payload: Record<string, unknown>,
    options?: JobsOptions,
  ): Promise<string | undefined> {
    return this.addJob(QUEUE_NAMES.PAYROLL, jobName, payload, options);
  },

  addAttendanceJob(
    jobName: string,
    payload: Record<string, unknown>,
    options?: JobsOptions,
  ): Promise<string | undefined> {
    return this.addJob(QUEUE_NAMES.ATTENDANCE, jobName, payload, options);
  },

  addReportJob(
    jobName: string,
    payload: Record<string, unknown>,
    options?: JobsOptions,
  ): Promise<string | undefined> {
    return this.addJob(QUEUE_NAMES.REPORT, jobName, payload, options);
  },

  addDocumentJob(
    jobName: string,
    payload: Record<string, unknown>,
    options?: JobsOptions,
  ): Promise<string | undefined> {
    return this.addJob(QUEUE_NAMES.DOCUMENT, jobName, payload, options);
  },

  addWebhookJob(
    jobName: string,
    payload: Record<string, unknown>,
    options?: JobsOptions,
  ): Promise<string | undefined> {
    return this.addJob(QUEUE_NAMES.WEBHOOK, jobName, payload, options);
  },

  addSchedulerJob(
    jobName: string,
    payload: Record<string, unknown>,
    options?: JobsOptions,
  ): Promise<string | undefined> {
    return this.addJob(QUEUE_NAMES.WEBHOOK, jobName, payload, options);
  },
};
