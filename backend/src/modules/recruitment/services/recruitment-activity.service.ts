import { ActivityLogRepository } from '@domain/audit/audit.schemas.js';
import { RECRUITMENT_ACTIVITY_TYPE } from '@domain/recruitment/recruitment-extended.schemas.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import type { RecruitmentActorContext } from '@modules/recruitment/types/recruitment.types.js';

export interface ActivityInput {
  activityType: string;
  description: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

export const RecruitmentActivityService = {
  TYPES: RECRUITMENT_ACTIVITY_TYPE,

  async publish(context: RecruitmentActorContext, input: ActivityInput): Promise<void> {
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
