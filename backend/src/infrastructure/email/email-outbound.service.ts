import { deliverEmailPayload, type EmailJobData } from '@infrastructure/email/email-dispatcher.js';
import { runScheduledJobPayload } from '@infrastructure/scheduler/scheduled-job.runner.js';
import { getCorrelationId } from '@shared/context/request.context.js';
import { logger } from '@logging/winston.logger.js';

function buildJobData(payload: Record<string, unknown>): EmailJobData {
  const correlationId = getCorrelationId() ?? 'system';
  return {
    correlationId,
    tenantId: typeof payload.tenantId === 'string' ? payload.tenantId : undefined,
    userId: typeof payload.userId === 'string' ? payload.userId : undefined,
    payload,
  };
}

/** Sends transactional email immediately via SMTP (no queue). */
export const EmailDispatcher = {
  async sendEmail(jobName: string, payload: Record<string, unknown>): Promise<string> {
    const data = buildJobData(payload);
    await deliverEmailPayload(data, jobName);
    logger.info('Email sent directly', {
      jobName,
      correlationId: data.correlationId,
      to: payload.to,
    });
    return 'delivered';
  },

  async runScheduledJob(payload: Record<string, unknown>): Promise<string> {
    const correlationId = getCorrelationId() ?? 'system';
    const userId = typeof payload.userId === 'string' ? payload.userId : undefined;
    await runScheduledJobPayload(payload, correlationId, userId);
    return 'delivered';
  },
};
