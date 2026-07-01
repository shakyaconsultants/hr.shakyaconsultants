import type { Job } from 'bullmq';
import { registerWorker, isQueuesEnabled } from '@infrastructure/queue/bullmq.connection.js';
import { QUEUE_NAMES } from '@shared/constants/queue.constants.js';
import type { QueueJobData } from '@infrastructure/queue/queue.producer.js';
import { processEmailJob } from '@infrastructure/queue/processors/email-queue.processor.js';
import { queueLogger } from '@logging/winston.logger.js';
import { runWithRequestContext } from '@shared/context/request.context.js';

type JobProcessor = (job: Job<QueueJobData>) => Promise<void>;

const noopProcessor: JobProcessor = (job) => {
  queueLogger.info('No-op job processed', {
    queue: job.queueName,
    jobName: job.name,
    correlationId: job.data.correlationId,
  });
  return Promise.resolve();
};

function wrapProcessor(processor: JobProcessor): JobProcessor {
  return (job: Job<QueueJobData>) =>
    runWithRequestContext(
      {
        correlationId: job.data.correlationId,
        requestId: job.id ?? 'queue-job',
        tenantId: job.data.tenantId,
        userId: job.data.userId,
      },
      () => processor(job),
    );
}

export function initializeWorkers(): void {
  if (!isQueuesEnabled()) {
    return;
  }

  registerWorker(QUEUE_NAMES.EMAIL, wrapProcessor(processEmailJob));
  registerWorker(QUEUE_NAMES.NOTIFICATION, wrapProcessor(noopProcessor));
  registerWorker(QUEUE_NAMES.PAYROLL, wrapProcessor(noopProcessor));
  registerWorker(QUEUE_NAMES.ATTENDANCE, wrapProcessor(noopProcessor));
  registerWorker(QUEUE_NAMES.REPORT, wrapProcessor(noopProcessor));
  registerWorker(QUEUE_NAMES.DOCUMENT, wrapProcessor(noopProcessor));
  registerWorker(QUEUE_NAMES.WEBHOOK, wrapProcessor(noopProcessor));
  registerWorker(QUEUE_NAMES.DEAD_LETTER, wrapProcessor(noopProcessor));
  queueLogger.info('Queue workers initialized');
}

export function registerCustomWorker(
  queueName: typeof QUEUE_NAMES[keyof typeof QUEUE_NAMES],
  processor: JobProcessor,
  concurrency = 1,
): void {
  registerWorker(queueName, wrapProcessor(processor), concurrency);
}
