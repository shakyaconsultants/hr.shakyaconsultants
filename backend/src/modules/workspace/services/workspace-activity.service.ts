import { ActivityLogRepository } from '@domain/audit/audit.schemas.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { WORKSPACE_ACTIVITY_TYPE } from '@modules/workspace/constants/workspace.constants.js';
import type { WorkspaceActorContext } from '@modules/workspace/types/workspace.types.js';

export interface WorkspaceActivityInput {
  activityType: string;
  description: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

export const WorkspaceActivityService = {
  TYPES: WORKSPACE_ACTIVITY_TYPE,

  async publish(context: WorkspaceActorContext, input: WorkspaceActivityInput): Promise<void> {
    await ActivityLogRepository.create(
      {
        id: generateUuid(),
        companyId: context.companyId,
        userId: context.userId,
        activityType: input.activityType,
        description: input.description,
        entityType: input.entityType,
        entityId: input.entityId,
        activityMeta: { ...input.metadata, employeeId: context.employeeId },
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );
  },
};
