export const NOTIFICATION_CHANNELS = {
  DATABASE: 'database',
  EMAIL: 'email',
  REALTIME: 'realtime',
  PUSH: 'push',
  SMS: 'sms',
  WHATSAPP: 'whatsapp',
} as const;

export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[keyof typeof NOTIFICATION_CHANNELS];

export const NOTIFICATION_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  FAILED: 'failed',
  READ: 'read',
} as const;
