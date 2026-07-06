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
import { RecruitmentEmailService } from '@modules/recruitment/services/recruitment-email.service.js';
import type { RecruitmentActorContext } from '@modules/recruitment/types/recruitment.types.js';

export const DEFAULT_PIPELINE_STAGES = [
  { slug: PIPELINE_STAGE.LEAD, name: 'Lead', sortOrder: 1, isTerminal: false, isDefault: true },
  {
    slug: PIPELINE_STAGE.INTERVIEW_SCHEDULED,
    name: 'Interview Scheduled',
    sortOrder: 2,
    isTerminal: false,
    isDefault: false,
  },
  {
    slug: PIPELINE_STAGE.SELECTED,
    name: 'Selected',
    sortOrder: 3,
    isTerminal: false,
    isDefault: false,
  },
  {
    slug: PIPELINE_STAGE.REJECTED,
    name: 'Rejected',
    sortOrder: 4,
    isTerminal: true,
    isDefault: false,
  },
  {
    slug: PIPELINE_STAGE.ONBOARDING,
    name: 'Offer & Onboarding',
    sortOrder: 5,
    isTerminal: false,
    isDefault: false,
  },
  {
    slug: PIPELINE_STAGE.EMPLOYEE_CONVERTED,
    name: 'Employee',
    sortOrder: 6,
    isTerminal: true,
    isDefault: false,
  },
] as const;

/** Legacy stages collapsed into simplified kanban columns. */
export const LEGACY_STAGE_TO_SIMPLIFIED: Record<string, string> = {
  [PIPELINE_STAGE.LEAD]: PIPELINE_STAGE.LEAD,
  [PIPELINE_STAGE.APPLIED]: PIPELINE_STAGE.LEAD,
  [PIPELINE_STAGE.RESUME_SCREENING]: PIPELINE_STAGE.LEAD,
  [PIPELINE_STAGE.SHORTLISTED]: PIPELINE_STAGE.LEAD,
  [PIPELINE_STAGE.INTERVIEW_SCHEDULED]: PIPELINE_STAGE.INTERVIEW_SCHEDULED,
  [PIPELINE_STAGE.INTERVIEW_COMPLETED]: PIPELINE_STAGE.INTERVIEW_SCHEDULED,
  [PIPELINE_STAGE.SELECTED]: PIPELINE_STAGE.SELECTED,
  [PIPELINE_STAGE.REJECTED]: PIPELINE_STAGE.REJECTED,
  [PIPELINE_STAGE.OFFER_SENT]: PIPELINE_STAGE.ONBOARDING,
  [PIPELINE_STAGE.OFFER_ACCEPTED]: PIPELINE_STAGE.ONBOARDING,
  [PIPELINE_STAGE.ONBOARDING]: PIPELINE_STAGE.ONBOARDING,
  [PIPELINE_STAGE.EMPLOYEE_CONVERTED]: PIPELINE_STAGE.EMPLOYEE_CONVERTED,
};

export function simplifyPipelineStage(stage: string): string {
  return LEGACY_STAGE_TO_SIMPLIFIED[stage] ?? PIPELINE_STAGE.LEAD;
}

const STAGE_DISPLAY_NAMES: Record<string, string> = Object.fromEntries(
  DEFAULT_PIPELINE_STAGES.map((stage) => [stage.slug, stage.name]),
);

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
    return [...DEFAULT_PIPELINE_STAGES].map((stage) => ({
      id: stage.slug,
      companyId,
      ...stage,
      status: 'active',
    }));
  },

  async transition(
    context: RecruitmentActorContext,
    candidateLeadId: string,
    toStage: string,
    reason?: string,
    options?: { skipNotification?: boolean },
  ) {
    const candidate = await CandidateLeadRepository.findById(candidateLeadId, {
      companyId: context.companyId,
    });
    if (!candidate) {
      throw new NotFoundError('Candidate not found', ERROR_CODES.NOT_FOUND);
    }

    if (candidate.pipelineStage === PIPELINE_STAGE.EMPLOYEE_CONVERTED) {
      throw new ValidationError(
        'Cannot change pipeline stage after employee conversion',
        [{ toStage }],
        { code: ERROR_CODES.VALIDATION_FAILED },
      );
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

    if (!options?.skipNotification && candidate.email) {
      const candidateName = `${candidate.firstName} ${candidate.lastName}`;
      if (toStage === PIPELINE_STAGE.REJECTED) {
        await RecruitmentEmailService.sendRejection(context, candidate.email, { candidateName });
      } else if (toStage !== PIPELINE_STAGE.EMPLOYEE_CONVERTED) {
        await RecruitmentEmailService.sendStageUpdate(context, candidate.email, {
          candidateName,
          stageName: STAGE_DISPLAY_NAMES[toStage] ?? toStage.replace(/_/g, ' '),
          message: reason,
        });
      }
    }

    return updated;
  },

  async getKanban(companyId: string) {
    await this.ensureDefaultStages(companyId, 'system');
    const stages = await this.listStages(companyId);
    const candidates = await CandidateLeadRepository.findMany({ isArchived: false }, { companyId });

    const board: Record<string, typeof candidates> = {};
    for (const stage of stages) {
      board[stage.slug] = [];
    }
    for (const candidate of candidates) {
      const column = simplifyPipelineStage(candidate.pipelineStage);
      board[column].push(candidate);
    }
    return { stages, board };
  },
};
