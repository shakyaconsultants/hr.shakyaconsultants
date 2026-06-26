import { NotificationRepository } from '@domain/communication/communication.schemas.js';
import { NOTIFICATION_CATEGORY } from '@domain/communication/communication.schemas.js';
import { NOTIFICATION_CHANNELS, NOTIFICATION_STATUS } from '@shared/constants/notification.constants.js';
import { QueueProducer } from '@infrastructure/queue/queue.producer.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { ActivityLogRepository } from '@domain/audit/audit.schemas.js';
import { COMMUNICATION_NOTIFICATION_JOB } from '@modules/communication/constants/communication.constants.js';
import type { CommunicationActorContext } from '@modules/approval/types/approval.types.js';

export const CommunicationEventService = {
  async publishActivity(context: CommunicationActorContext, input: {
    activityType: string;
    description: string;
    entityType?: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await ActivityLogRepository.create(
      {
        id: generateUuid(),
        companyId: context.companyId,
        userId: context.userId,
        activityType: input.activityType,
        description: input.description,
        entityType: input.entityType,
        entityId: input.entityId,
        activityMeta: input.metadata ?? {},
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );
  },

  async notify(context: CommunicationActorContext, input: {
    recipientUserId: string;
    title: string;
    body: string;
    entityType?: string;
    entityId?: string;
    category?: string;
    deepLink?: string;
    priority?: string;
    jobName: string;
  }): Promise<void> {
    await NotificationRepository.create(
      {
        id: generateUuid(),
        companyId: context.companyId,
        recipientId: input.recipientUserId,
        title: input.title,
        body: input.body,
        channel: NOTIFICATION_CHANNELS.DATABASE,
        status: NOTIFICATION_STATUS.PENDING,
        entityType: input.entityType,
        entityId: input.entityId,
        category: input.category ?? NOTIFICATION_CATEGORY.COMMUNICATION,
        deepLink: input.deepLink,
        priority: input.priority,
        isArchived: false,
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    await QueueProducer.addNotificationJob(input.jobName, {
      tenantId: context.companyId,
      recipientId: input.recipientUserId,
      title: input.title,
      body: input.body,
      entityType: input.entityType,
      entityId: input.entityId,
    });
  },
};

export { COMMUNICATION_NOTIFICATION_JOB };
