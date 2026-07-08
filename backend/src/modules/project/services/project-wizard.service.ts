import {
  ProjectDraftRepository,
  projectDraftModel,
} from '@domain/project/project-extended.schemas.js';
import { PROJECT_MEMBER_ROLE } from '@domain/project/project-extended.schemas.js';
import { NotFoundError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { ProjectService } from '@modules/project/services/project.service.js';
import { KnowledgeBaseService } from '@modules/project/services/knowledge-base.service.js';
import { ProjectMemberService } from '@modules/project/services/project-member.service.js';
import { ProjectModuleService } from '@modules/project/services/project-module.service.js';
import { MilestoneService } from '@modules/project/services/milestone.service.js';
import { SprintService } from '@modules/project/services/sprint.service.js';
import { ProjectActivityService } from '@modules/project/services/project-activity.service.js';
import { ProjectEventService } from '@modules/project/services/project-event.service.js';
import type { ProjectActorContext } from '@modules/project/types/project.types.js';
import type {
  ProjectWizardDraftInput,
  ProjectWizardFinalizeInput,
} from '@modules/project/validators/project.validator.js';
import { logger } from '@logging/winston.logger.js';

type DraftShape = {
  id: string;
  currentStep: string;
  payload: Record<string, unknown>;
  updatedAt?: Date;
};

function formatDraftResponse(draft: {
  id: string;
  currentStep: string;
  payload: Record<string, unknown>;
  updatedAt?: Date;
}): DraftShape {
  return {
    id: draft.id,
    currentStep: draft.currentStep,
    payload: draft.payload,
    updatedAt: draft.updatedAt,
  };
}

export const ProjectWizardService = {
  async getDraft(context: ProjectActorContext) {
    const draft = await ProjectDraftRepository.findOne(
      { userId: context.userId },
      { companyId: context.companyId },
    );
    if (!draft) {
      return null;
    }
    return formatDraftResponse(draft);
  },

  async saveDraft(context: ProjectActorContext, input: ProjectWizardDraftInput) {
    const existing = await ProjectDraftRepository.findOne(
      { userId: context.userId },
      { companyId: context.companyId },
    );

    if (existing) {
      const updated = await ProjectDraftRepository.update(
        existing.id,
        {
          currentStep: input.currentStep,
          payload: input.payload,
          updatedBy: context.userId,
        },
        { companyId: context.companyId },
      );
      if (!updated) {
        throw new NotFoundError('Project draft not found', ERROR_CODES.NOT_FOUND);
      }
      return formatDraftResponse(updated);
    }

    const id = generateUuid();
    const created = await ProjectDraftRepository.create(
      {
        id,
        companyId: context.companyId,
        userId: context.userId,
        currentStep: input.currentStep,
        payload: input.payload,
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );
    return formatDraftResponse(created);
  },

  async deleteDraft(context: ProjectActorContext) {
    const existing = await ProjectDraftRepository.findOne(
      { userId: context.userId },
      { companyId: context.companyId },
    );
    if (existing) {
      await projectDraftModel.model.deleteOne({ id: existing.id, companyId: context.companyId });
    }
  },

  async finalize(context: ProjectActorContext, input: ProjectWizardFinalizeInput) {
    const {
      basicInfo,
      repository,
      technologyIds,
      documentUrls,
      modules,
      milestones,
      sprint,
      assistantManagerIds,
      teamMembers,
      labels,
    } = input;

    let projectId: string | undefined;

    try {
      const project = await ProjectService.create(context, {
        ...basicInfo,
        technologyIds: technologyIds ?? basicInfo.technologyIds,
        tags: labels ?? basicInfo.tags,
      });
      projectId = project.id;

      if (repository) {
        await KnowledgeBaseService.upsert(context, project.id, {
          repositoryUrl: repository.repositoryUrl,
          branches: repository.defaultBranch
            ? [repository.defaultBranch, ...(repository.branches ?? [])]
            : repository.branches,
          apiDocsUrl: repository.apiDocsUrl ?? repository.documentationUrl,
          swaggerUrl: repository.swaggerUrl,
          credentials: repository.credentials,
          envVariables: repository.envVariables,
          deploymentGuide: repository.deploymentGuide,
          architectureNotes: repository.architectureNotes,
          cloudflareEmail: repository.cloudflareEmail,
          devHostingPlatform: repository.devHostingPlatform,
          prodHostingPlatform: repository.prodHostingPlatform,
          documentUrls: documentUrls ?? repository.documentUrls,
        });

        const urlUpdates: Record<string, string | undefined> = {};
        if (repository.productionUrl) urlUpdates.productionUrl = repository.productionUrl;
        if (repository.stagingUrl) urlUpdates.stagingUrl = repository.stagingUrl;
        if (repository.apiUrl) urlUpdates.apiUrl = repository.apiUrl;
        if (repository.documentationUrl) urlUpdates.documentationUrl = repository.documentationUrl;
        if (repository.repositoryUrl) urlUpdates.repositoryUrl = repository.repositoryUrl;
        if (Object.keys(urlUpdates).length > 0) {
          await ProjectService.update(context, project.id, urlUpdates);
        }
      }

      await ProjectMemberService.assign(context, {
        projectId: project.id,
        employeeId: basicInfo.projectManagerId,
        role: PROJECT_MEMBER_ROLE.PROJECT_MANAGER,
        allocationPercent: 100,
      });

      for (const assistantId of assistantManagerIds ?? []) {
        if (assistantId !== basicInfo.projectManagerId) {
          await ProjectMemberService.assign(context, {
            projectId: project.id,
            employeeId: assistantId,
            role: PROJECT_MEMBER_ROLE.ASSISTANT_PROJECT_MANAGER,
            allocationPercent: 50,
          });
        }
      }

      for (const member of teamMembers ?? []) {
        if (member.employeeId === basicInfo.projectManagerId) {
          continue;
        }
        await ProjectMemberService.assign(context, {
          projectId: project.id,
          employeeId: member.employeeId,
          role: member.role,
          allocationPercent: member.allocationPercent,
        });
      }

      for (const moduleInput of modules ?? []) {
        await ProjectModuleService.create(context, { ...moduleInput, projectId: project.id });
      }

      for (const milestoneInput of milestones ?? []) {
        await MilestoneService.create(context, { ...milestoneInput, projectId: project.id });
      }

      if (sprint) {
        await SprintService.create(context, { ...sprint, projectId: project.id });
      }

      await ProjectEventService.emit(context, {
        activityType: ProjectActivityService.TYPES.PROJECT_CREATED,
        activityDescription: `Enterprise project ${project.name} created via wizard`,
        entityType: 'project',
        entityId: project.id,
        metadata: { viaWizard: true },
      });

      await this.deleteDraft(context);

      return project;
    } catch (error) {
      if (projectId) {
        try {
          await ProjectService.softDelete(context, projectId);
        } catch (rollbackError) {
          logger.error('Project wizard finalize rollback failed', {
            projectId,
            error: rollbackError instanceof Error ? rollbackError.message : String(rollbackError),
          });
        }
      }
      throw error;
    }
  },

  async getDraftById(context: ProjectActorContext, id: string) {
    const draft = await ProjectDraftRepository.findById(id, { companyId: context.companyId });
    if (!draft || draft.userId !== context.userId) {
      throw new NotFoundError('Project draft not found', ERROR_CODES.NOT_FOUND);
    }
    return draft;
  },
};
