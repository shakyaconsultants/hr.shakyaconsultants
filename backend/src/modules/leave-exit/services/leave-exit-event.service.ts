import { NotificationRepository } from '@domain/communication/communication.schemas.js';
import { NOTIFICATION_CHANNELS, NOTIFICATION_STATUS } from '@shared/constants/notification.constants.js';
import { QueueProducer } from '@infrastructure/queue/queue.producer.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { ActivityLogRepository } from '@domain/audit/audit.schemas.js';
import { LEAVE_EXIT_NOTIFICATION_JOB } from '@modules/leave-exit/constants/leave-exit.constants.js';
import type { LeaveExitActorContext } from '@modules/approval/types/approval.types.js';

export const LeaveExitEventService = {
  async publishActivity(context: LeaveExitActorContext, input: {
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

  async notify(context: LeaveExitActorContext, input: {
    recipientUserId: string;
    title: string;
    body: string;
    entityType?: string;
    entityId?: string;
    category?: string;
    deepLink?: string;
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
        category: input.category ?? 'leave',
        deepLink: input.deepLink,
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

export { LEAVE_EXIT_NOTIFICATION_JOB };
