import { CandidateLeadRepository } from '@domain/recruitment/recruitment.schemas.js';
import {
  PIPELINE_STAGE,
  PipelineStageConfigRepository,
  PipelineTransitionRepository,
} from '@domain/recruitment/recruitment-extended.schemas.js';
import { NotFoundError, ValidationError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { RecruitmentAuditService } from '@modules/recruitment/services/recruitment-audit.service.js';
import { RecruitmentTimelineService } from '@modules/recruitment/services/recruitment-timeline.service.js';
import { RecruitmentActivityService } from '@modules/recruitment/services/recruitment-activity.service.js';
import type { RecruitmentActorContext } from '@modules/recruitment/types/recruitment.types.js';

export const DEFAULT_PIPELINE_STAGES = [
  { slug: PIPELINE_STAGE.LEAD, name: 'Lead', sortOrder: 1, isTerminal: false, isDefault: true },
  { slug: PIPELINE_STAGE.APPLIED, name: 'Applied', sortOrder: 2, isTerminal: false, isDefault: false },
  { slug: PIPELINE_STAGE.RESUME_SCREENING, name: 'Resume Screening', sortOrder: 3, isTerminal: false, isDefault: false },
  { slug: PIPELINE_STAGE.SHORTLISTED, name: 'Shortlisted', sortOrder: 4, isTerminal: false, isDefault: false },
  { slug: PIPELINE_STAGE.INTERVIEW_SCHEDULED, name: 'Interview Scheduled', sortOrder: 5, isTerminal: false, isDefault: false },
  { slug: PIPELINE_STAGE.INTERVIEW_COMPLETED, name: 'Interview Completed', sortOrder: 6, isTerminal: false, isDefault: false },
  { slug: PIPELINE_STAGE.SELECTED, name: 'Selected', sortOrder: 7, isTerminal: false, isDefault: false },
  { slug: PIPELINE_STAGE.REJECTED, name: 'Rejected', sortOrder: 8, isTerminal: true, isDefault: false },
  { slug: PIPELINE_STAGE.OFFER_SENT, name: 'Offer Sent', sortOrder: 9, isTerminal: false, isDefault: false },
  { slug: PIPELINE_STAGE.OFFER_ACCEPTED, name: 'Offer Accepted', sortOrder: 10, isTerminal: false, isDefault: false },
  { slug: PIPELINE_STAGE.ONBOARDING, name: 'Onboarding', sortOrder: 11, isTerminal: false, isDefault: false },
  { slug: PIPELINE_STAGE.EMPLOYEE_CONVERTED, name: 'Employee Converted', sortOrder: 12, isTerminal: true, isDefault: false },
] as const;

export const CandidatePipelineService = {
  async ensureDefaultStages(companyId: string, userId: string): Promise<void> {
    const existing = await PipelineStageConfigRepository.findMany({}, { companyId });
    if (existing.length > 0) {
      return;
    }
    for (const stage of DEFAULT_PIPELINE_STAGES) {
      await PipelineStageConfigRepository.create(
        {
          id: generateUuid(),
          companyId,
          ...stage,
          status: 'active',
          createdBy: userId,
          updatedBy: userId,
        },
        { companyId },
      );
    }
  },

  async listStages(companyId: string) {
    await this.ensureDefaultStages(companyId, 'system');
    const stages = await PipelineStageConfigRepository.findMany({}, { companyId });
    return stages.sort((a, b) => a.sortOrder - b.sortOrder);
  },

  async transition(
    context: RecruitmentActorContext,
    candidateLeadId: string,
    toStage: string,
    reason?: string,
  ) {
    const candidate = await CandidateLeadRepository.findById(candidateLeadId, { companyId: context.companyId });
    if (!candidate) {
      throw new NotFoundError('Candidate not found', ERROR_CODES.NOT_FOUND);
    }

    if (candidate.pipelineStage === PIPELINE_STAGE.EMPLOYEE_CONVERTED) {
      throw new ValidationError('Cannot change pipeline stage after employee conversion', [{ toStage }], { code: ERROR_CODES.VALIDATION_FAILED });
    }

    const fromStage = candidate.pipelineStage;
    if (fromStage === toStage) {
      return candidate;
    }

    const updated = await CandidateLeadRepository.update(
      candidateLeadId,
      { pipelineStage: toStage, updatedBy: context.userId },
      { companyId: context.companyId },
    );
    if (!updated) {
      throw new NotFoundError('Candidate not found', ERROR_CODES.NOT_FOUND);
    }

    await PipelineTransitionRepository.create(
      {
        id: generateUuid(),
        companyId: context.companyId,
        candidateLeadId,
        fromStage,
        toStage,
        reason,
        actorId: context.userId,
        transitionedAt: new Date(),
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    await RecruitmentTimelineService.record(context, {
      candidateLeadId,
      eventType: RecruitmentTimelineService.EVENT.STATUS_CHANGED,
      title: `Pipeline: ${fromStage} → ${toStage}`,
      metadata: { fromStage, toStage, reason },
    });

    await RecruitmentActivityService.publish(context, {
      activityType: RecruitmentActivityService.TYPES.PIPELINE_CHANGED,
      description: `Candidate moved from ${fromStage} to ${toStage}`,
      entityType: 'candidate',
      entityId: candidateLeadId,
      metadata: { fromStage, toStage },
    });

    await RecruitmentAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'candidate_pipeline',
      entityId: candidateLeadId,
      action: 'transition',
      before: { pipelineStage: fromStage },
      after: { pipelineStage: toStage },
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return updated;
  },

  async getKanban(companyId: string) {
    await this.ensureDefaultStages(companyId, 'system');
    const stages = await this.listStages(companyId);
    const candidates = await CandidateLeadRepository.findMany({ isArchived: false }, { companyId });

    const board: Record<string, typeof candidates> = {};
    for (const stage of stages) {
      board[stage.slug] = candidates.filter((c) => c.pipelineStage === stage.slug);
    }
    return { stages, board };
  },
};
