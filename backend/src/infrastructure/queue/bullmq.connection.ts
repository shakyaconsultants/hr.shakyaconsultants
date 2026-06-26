import { Queue, Worker, type ConnectionOptions, type Job, type JobsOptions } from 'bullmq';
import { getEnv } from '@config/env.js';
import { getRedisConnectionOptions, isRedisAvailable } from '@infrastructure/redis/redis.client.js';
import { QUEUE_DEFAULTS, QUEUE_NAMES, type QueueName } from '@shared/constants/queue.constants.js';
import type { QueueJobData } from '@infrastructure/queue/queue.producer.js';
import { queueLogger } from '@logging/winston.logger.js';

const queues = new Map<string, Queue>();
const workers = new Map<string, Worker>();
let queuesEnabled = false;
let queueDisabledWarningLogged = false;

function logQueueDisabledOnce(message: string): void {
  if (!queueDisabledWarningLogged) {
    queueLogger.warn(message);
    queueDisabledWarningLogged = true;
  }
}

export function isQueuesEnabled(): boolean {
  return queuesEnabled;
}

function getConnection(): ConnectionOptions {
  return getRedisConnectionOptions();
}

function getQueuePrefix(): string {
  return getEnv().QUEUE_PREFIX;
}

function getDefaultJobOptions(): JobsOptions {
  const env = getEnv();
  return {
    attempts: env.QUEUE_MAX_ATTEMPTS,
    backoff: {
      type: QUEUE_DEFAULTS.BACKOFF_TYPE,
      delay: env.QUEUE_BACKOFF_DELAY_MS,
    },
    removeOnComplete: { count: QUEUE_DEFAULTS.REMOVE_ON_COMPLETE_COUNT },
    removeOnFail: { count: QUEUE_DEFAULTS.REMOVE_ON_FAIL_COUNT },
  };
}

function createQueueInstance(name: QueueName): Queue {
  const key = `${getQueuePrefix()}:${name}`;
  let queue = queues.get(key);
  if (!queue) {
    queue = new Queue(name, {
      connection: getConnection(),
      prefix: getQueuePrefix(),
      defaultJobOptions: getDefaultJobOptions(),
    });
    queues.set(key, queue);
  }
  return queue;
}

export function getQueue(name: QueueName): Queue {
  if (!queuesEnabled) {
    throw new Error('BullMQ is disabled because Redis is unavailable');
  }

  return createQueueInstance(name);
}

export function getAllQueueNames(): QueueName[] {
  return Object.values(QUEUE_NAMES);
}

export function initializeQueues(): void {
  if (!isRedisAvailable()) {
    logQueueDisabledOnce('BullMQ disabled — Redis unavailable');
    queuesEnabled = false;
    return;
  }

  getAllQueueNames().forEach((name) => {
    createQueueInstance(name);
  });
  queuesEnabled = true;
  queueLogger.info('BullMQ queues initialized (Upstash Redis)', { queues: getAllQueueNames() });
}

export async function closeQueues(): Promise<void> {
  if (!queuesEnabled) {
    return;
  }

  const closingQueues = Array.from(queues.values()).map((queue) => queue.close());
  const closingWorkers = Array.from(workers.values()).map((worker) => worker.close());
  await Promise.all([...closingQueues, ...closingWorkers]);
  queues.clear();
  workers.clear();
  queuesEnabled = false;
  queueLogger.info('BullMQ queues and workers closed');
}

export function registerWorker(
  queueName: QueueName,
  processor: (job: Job<QueueJobData>) => Promise<void>,
  concurrency = 1,
): Worker | null {
  if (!queuesEnabled) {
    return null;
  }

  const key = `${getQueuePrefix()}:${queueName}:worker`;
  const existing = workers.get(key);
  if (existing) {
    return existing;
  }

  const worker = new Worker<QueueJobData>(queueName, processor, {
    connection: getConnection(),
    prefix: getQueuePrefix(),
    concurrency,
  });

  worker.on('failed', (job, error) => {
    queueLogger.error('Job failed', {
      queue: queueName,
      jobId: job?.id,
      attempt: job?.attemptsMade,
      error: error.message,
      correlationId: job?.data.correlationId,
    });

    if (
      queueName !== QUEUE_NAMES.DEAD_LETTER &&
      job &&
      job.attemptsMade >= (job.opts.attempts ?? QUEUE_DEFAULTS.MAX_ATTEMPTS)
    ) {
      void moveToDeadLetter(queueName, job.id ?? 'unknown', job.data, error.message);
    }
  });

  worker.on('completed', (job) => {
    queueLogger.info('Job completed', {
      queue: queueName,
      jobId: job.id,
      correlationId: job.data.correlationId,
    });
  });

  workers.set(key, worker);
  return worker;
}

async function moveToDeadLetter(
  sourceQueue: string,
  jobId: string,
  data: QueueJobData,
  errorMessage: string,
): Promise<void> {
  const dlq = getQueue(QUEUE_NAMES.DEAD_LETTER);
  await dlq.add('dead-letter', {
    sourceQueue,
    originalJobId: jobId,
    data,
    errorMessage,
    failedAt: new Date().toISOString(),
  });
  queueLogger.warn('Job moved to dead letter queue', { sourceQueue, jobId });
}

export function getQueueHealthStatus(): 'enabled' | 'disabled' {
  return queuesEnabled ? 'enabled' : 'disabled';
}

export { QUEUE_NAMES };
