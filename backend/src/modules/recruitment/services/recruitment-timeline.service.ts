import { CandidateTimelineRepository } from '@domain/recruitment/recruitment-extended.schemas.js';
import { CANDIDATE_TIMELINE_EVENT } from '@domain/recruitment/recruitment-extended.schemas.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import type { RecruitmentActorContext } from '@modules/recruitment/types/recruitment.types.js';

export interface TimelineEntryInput {
  candidateLeadId: string;
  eventType: string;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  occurredAt?: Date;
}

export const RecruitmentTimelineService = {
  EVENT: CANDIDATE_TIMELINE_EVENT,

  async record(context: RecruitmentActorContext, input: TimelineEntryInput): Promise<void> {
    await CandidateTimelineRepository.create(
      {
        id: generateUuid(),
        companyId: context.companyId,
        candidateLeadId: input.candidateLeadId,
        eventType: input.eventType,
        title: input.title,
        description: input.description,
        metadata: input.metadata ?? {},
        occurredAt: input.occurredAt ?? new Date(),
        actorId: context.userId,
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );
  },

  async list(companyId: string, candidateLeadId: string, limit = 100) {
    const items = await CandidateTimelineRepository.findMany({ candidateLeadId }, { companyId });
    return items.sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime()).slice(0, limit);
  },
};
