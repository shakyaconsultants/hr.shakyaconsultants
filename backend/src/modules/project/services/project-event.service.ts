import { NotificationRepository } from '@domain/communication/communication.schemas.js';
import { NOTIFICATION_CHANNELS, NOTIFICATION_STATUS } from '@shared/constants/notification.constants.js';
import { QueueProducer } from '@infrastructure/queue/queue.producer.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { PROJECT_NOTIFICATION_JOB } from '@modules/project/constants/project.constants.js';
import type { ProjectActorContext } from '@modules/project/types/project.types.js';

export interface NotificationInput {
  userId: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  jobName: string;
}

export const ProjectNotificationService = {
  async notify(context: ProjectActorContext, input: NotificationInput): Promise<void> {
    await NotificationRepository.create(
      {
        id: generateUuid(),
        companyId: context.companyId,
        recipientId: input.userId,
        title: input.title,
        body: input.message,
        channel: NOTIFICATION_CHANNELS.DATABASE,
        status: NOTIFICATION_STATUS.PENDING,
        entityType: input.entityType,
        entityId: input.entityId,
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    await QueueProducer.addNotificationJob(input.jobName, {
      tenantId: context.companyId,
      recipientId: input.userId,
      title: input.title,
      body: input.message,
      entityType: input.entityType,
      entityId: input.entityId,
    });
  },
};

export const PROJECT_EVENT = {
  TASK_ASSIGNED: PROJECT_NOTIFICATION_JOB.TASK_ASSIGNED,
  TASK_DUE: PROJECT_NOTIFICATION_JOB.TASK_DUE,
  TASK_COMPLETED: PROJECT_NOTIFICATION_JOB.TASK_COMPLETED,
  TASK_REJECTED: PROJECT_NOTIFICATION_JOB.TASK_REJECTED,
  SPRINT_STARTED: PROJECT_NOTIFICATION_JOB.SPRINT_STARTED,
  MILESTONE_COMPLETED: PROJECT_NOTIFICATION_JOB.MILESTONE_COMPLETED,
  PROJECT_ARCHIVED: PROJECT_NOTIFICATION_JOB.PROJECT_ARCHIVED,
} as const;

export const ProjectEventService = {
  async emit(
    context: ProjectActorContext,
    event: {
      activityType: string;
      activityDescription: string;
      entityType?: string;
      entityId?: string;
      metadata?: Record<string, unknown>;
      notification?: NotificationInput;
    },
  ): Promise<void> {
    const { ProjectActivityService } = await import('@modules/project/services/project-activity.service.js');

    await ProjectActivityService.publish(context, {
      activityType: event.activityType,
      description: event.activityDescription,
      entityType: event.entityType,
      entityId: event.entityId,
      metadata: event.metadata,
    });

    if (event.notification) {
      await ProjectNotificationService.notify(context, event.notification);
    }
  },
};
