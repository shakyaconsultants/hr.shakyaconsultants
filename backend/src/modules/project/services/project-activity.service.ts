import { ActivityLogRepository } from '@domain/audit/audit.schemas.js';
import { PROJECT_ACTIVITY_TYPE } from '@domain/project/project-extended.schemas.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import type { ProjectActorContext } from '@modules/project/types/project.types.js';

export interface ActivityInput {
  activityType: string;
  description: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

export const ProjectActivityService = {
  TYPES: PROJECT_ACTIVITY_TYPE,

  async publish(context: ProjectActorContext, input: ActivityInput): Promise<void> {
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
};
