export const QUEUE_NAMES = {
  EMAIL: 'email',
  NOTIFICATION: 'notification',
  PAYROLL: 'payroll',
  ATTENDANCE: 'attendance',
  REPORT: 'report',
  DOCUMENT: 'document',
  WEBHOOK: 'webhook',
  DEAD_LETTER: 'dead-letter',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

export const QUEUE_DEFAULTS = {
  MAX_ATTEMPTS: 3,
  BACKOFF_DELAY_MS: 5000,
  BACKOFF_TYPE: 'exponential' as const,
  REMOVE_ON_COMPLETE_COUNT: 1000,
  REMOVE_ON_FAIL_COUNT: 5000,
} as const;
