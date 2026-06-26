import type { QueueName } from '@shared/constants/queue.constants.js';
import { getQueue, getAllQueueNames } from '@infrastructure/queue/bullmq.connection.js';

export interface QueueStats {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
}

export const QueueMonitor = {
  async getQueueStats(queueName: QueueName): Promise<QueueStats> {
    const queue = getQueue(queueName);
    const counts = await queue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed', 'paused');
    return {
      name: queueName,
      waiting: counts.waiting,
      active: counts.active,
      completed: counts.completed,
      failed: counts.failed,
      delayed: counts.delayed,
      paused: counts.paused,
    };
  },

  async getAllStats(): Promise<QueueStats[]> {
    const names = getAllQueueNames();
    return Promise.all(names.map((name) => this.getQueueStats(name)));
  },
};
