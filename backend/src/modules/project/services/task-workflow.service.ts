import { TaskWorkflowConfigRepository } from '@domain/project/project-extended.schemas.js';
import { DEFAULT_TASK_WORKFLOW_STAGES } from '@modules/project/constants/project.constants.js';
import { generateUuid } from '@shared/utils/random-id.util.js';

export const TaskWorkflowService = {
  async ensureDefaultStages(companyId: string, userId: string, projectId?: string): Promise<void> {
    const filter: Record<string, unknown> = projectId ? { projectId } : { projectId: { $exists: false } };
    const existing = await TaskWorkflowConfigRepository.findMany(filter, { companyId });
    if (existing.length > 0) {
      return;
    }

    for (const stage of DEFAULT_TASK_WORKFLOW_STAGES) {
      await TaskWorkflowConfigRepository.create(
        {
          id: generateUuid(),
          companyId,
          projectId,
          slug: stage.slug,
          name: stage.name,
          sortOrder: stage.sortOrder,
          isTerminal: stage.isTerminal,
          isDefault: stage.isDefault,
          createdBy: userId,
          updatedBy: userId,
        },
        { companyId },
      );
    }
  },

  async listStages(companyId: string, projectId?: string) {
    const filter = projectId ? { projectId } : { projectId: { $exists: false } };
    const stages = await TaskWorkflowConfigRepository.findMany(filter, { companyId });
    if (stages.length === 0) {
      await this.ensureDefaultStages(companyId, 'system', projectId);
      return TaskWorkflowConfigRepository.findMany(filter, { companyId });
    }
    return stages.sort((a, b) => a.sortOrder - b.sortOrder);
  },
};
