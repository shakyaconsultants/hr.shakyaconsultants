import { NotificationRepository } from '@domain/communication/communication.schemas.js';
import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_STATUS,
} from '@shared/constants/notification.constants.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { ActivityLogRepository } from '@domain/audit/audit.schemas.js';
import { SALES_NOTIFICATION_JOB } from '@modules/sales/constants/sales.constants.js';
import type { SalesActorContext } from '@modules/approval/types/approval.types.js';

export const SalesEventService = {
  async publishActivity(
    context: SalesActorContext,
    input: {
      activityType: string;
      description: string;
      entityType?: string;
      entityId?: string;
      metadata?: Record<string, unknown>;
    },
  ): Promise<void> {
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

  async notify(
    context: SalesActorContext,
    input: {
      recipientUserId: string;
      title: string;
      body: string;
      entityType?: string;
      entityId?: string;
      category?: string;
      deepLink?: string;
      jobName: string;
    },
  ): Promise<void> {
    await NotificationRepository.create(
      {
        id: generateUuid(),
        companyId: context.companyId,
        recipientId: input.recipientUserId,
        title: input.title,
        body: input.body,
        channel: NOTIFICATION_CHANNELS.DATABASE,
        status: NOTIFICATION_STATUS.SENT,
        entityType: input.entityType,
        entityId: input.entityId,
        category: input.category ?? 'sales',
        deepLink: input.deepLink,
        isArchived: false,
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );
  },
};

export { SALES_NOTIFICATION_JOB };
