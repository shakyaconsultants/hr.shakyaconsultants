import type { NotificationChannel } from '@shared/constants/notification.constants.js';
import { NOTIFICATION_CHANNELS } from '@shared/constants/notification.constants.js';
import type { NotificationPayload } from '@shared/types/api.types.js';
import { getCorrelationId } from '@shared/context/request.context.js';
import { queueLogger } from '@logging/winston.logger.js';

export interface NotificationInput {
  channel: NotificationChannel;
  recipientId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  correlationId?: string;
  tenantId?: string;
}

export interface NotificationHandler {
  channel: NotificationChannel;
  send(payload: NotificationPayload): Promise<void>;
}

const handlers = new Map<NotificationChannel, NotificationHandler>();

export const NotificationService = {
  registerHandler(handler: NotificationHandler): void {
    handlers.set(handler.channel, handler);
  },

  buildPayload(input: NotificationInput): NotificationPayload {
    return {
      channel: input.channel,
      recipientId: input.recipientId,
      title: input.title,
      body: input.body,
      data: input.data,
      correlationId: input.correlationId ?? getCorrelationId() ?? 'system',
      tenantId: input.tenantId,
    };
  },

  async send(input: NotificationInput): Promise<void> {
    const payload = this.buildPayload(input);
    const handler = handlers.get(input.channel);

    if (!handler) {
      queueLogger.warn('No notification handler registered', {
        channel: input.channel,
        correlationId: payload.correlationId,
      });
      return;
    }

    await handler.send(payload);
  },

  getSupportedChannels(): NotificationChannel[] {
    return Object.values(NOTIFICATION_CHANNELS);
  },

  getRegisteredChannels(): NotificationChannel[] {
    return [...handlers.keys()];
  },
};

export class DatabaseNotificationHandler implements NotificationHandler {
  readonly channel = NOTIFICATION_CHANNELS.DATABASE;

  send(payload: NotificationPayload): Promise<void> {
    queueLogger.info('Database notification queued', {
      recipientId: payload.recipientId,
      correlationId: payload.correlationId,
    });
    return Promise.resolve();
  }
}

export class EmailNotificationHandler implements NotificationHandler {
  readonly channel = NOTIFICATION_CHANNELS.EMAIL;

  send(payload: NotificationPayload): Promise<void> {
    queueLogger.info('Email notification queued', {
      recipientId: payload.recipientId,
      correlationId: payload.correlationId,
    });
    return Promise.resolve();
  }
}

export class RealtimeNotificationHandler implements NotificationHandler {
  readonly channel = NOTIFICATION_CHANNELS.REALTIME;

  send(payload: NotificationPayload): Promise<void> {
    queueLogger.info('Realtime notification queued', {
      recipientId: payload.recipientId,
      correlationId: payload.correlationId,
    });
    return Promise.resolve();
  }
}

export function initializeNotificationHandlers(): void {
  NotificationService.registerHandler(new DatabaseNotificationHandler());
  NotificationService.registerHandler(new EmailNotificationHandler());
  NotificationService.registerHandler(new RealtimeNotificationHandler());
}
