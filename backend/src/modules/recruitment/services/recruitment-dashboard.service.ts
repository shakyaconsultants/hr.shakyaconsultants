import { CandidateLeadRepository } from '@domain/recruitment/recruitment.schemas.js';
import { OfferLetterRepository, OFFER_STATUS } from '@domain/recruitment/recruitment.schemas.js';
import { ActivityLogRepository } from '@domain/audit/audit.schemas.js';
import { PIPELINE_STAGE } from '@domain/recruitment/recruitment-extended.schemas.js';
import { InterviewService } from '@modules/recruitment/services/interview.service.js';
import {
  CandidatePipelineService,
  simplifyPipelineStage,
} from '@modules/recruitment/services/candidate-pipeline.service.js';
import type { RecruitmentDashboardData } from '@modules/recruitment/types/recruitment.types.js';

export const RecruitmentDashboardService = {
  async getDashboard(companyId: string): Promise<RecruitmentDashboardData> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 86400000);
    const weekEnd = new Date(startOfDay.getTime() + 7 * 86400000);

    const [candidates, stages, allInterviews, offers, activities] = await Promise.all([
      CandidateLeadRepository.findMany({ isArchived: false }, { companyId }),
      CandidatePipelineService.listStages(companyId),
      InterviewService.list(companyId, {}),
      OfferLetterRepository.findMany({ status: OFFER_STATUS.SENT }, { companyId }),
      ActivityLogRepository.findMany({}, { companyId }),
    ]);

    const pipelineOverview: Record<string, number> = {};
    for (const stage of stages) {
      pipelineOverview[stage.slug] = 0;
    }
    for (const candidate of candidates) {
      const bucket = simplifyPipelineStage(candidate.pipelineStage);
      if (bucket in pipelineOverview) {
        pipelineOverview[bucket] += 1;
      }
    }

    const todaysInterviews = allInterviews.filter(
      (i) => i.scheduledAt >= startOfDay && i.scheduledAt < endOfDay,
    );

    const upcomingInterviews = allInterviews.filter(
      (i) => i.scheduledAt >= now && i.scheduledAt <= weekEnd,
    );

    const joiningThisWeek = candidates.filter(
      (c) => c.convertedAt && c.convertedAt >= startOfDay && c.convertedAt < weekEnd,
    );

    const converted = candidates.filter(
      (c) => simplifyPipelineStage(c.pipelineStage) === PIPELINE_STAGE.EMPLOYEE_CONVERTED,
    ).length;
    const total = candidates.length || 1;
    const conversionRate = Math.round((converted / total) * 100);

    const recentActivity = activities
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 20)
      .map((a) => ({
        id: a.id,
        activityType: a.activityType,
        description: a.description,
        createdAt: a.createdAt,
      }));

    return {
      pipelineOverview,
      todaysInterviews,
      upcomingInterviews,
      offersPending: offers,
      joiningThisWeek,
      conversionRate,
      recentActivity,
    };
  },
};
