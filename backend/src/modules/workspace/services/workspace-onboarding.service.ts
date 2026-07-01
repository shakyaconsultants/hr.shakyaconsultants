import { OnboardingRepository, ONBOARDING_STATUS } from '@domain/recruitment/recruitment.schemas.js';
import { OnboardingService } from '@modules/recruitment/services/onboarding.service.js';
import type { WorkspaceActorContext } from '@modules/workspace/types/workspace.types.js';

export const WorkspaceOnboardingService = {
  async getStatus(companyId: string, employeeId: string) {
    const onboarding = await OnboardingRepository.findOne({ employeeId }, { companyId });
    if (!onboarding) {
      return {
        required: true,
        status: 'not_started',
        progressPercent: 0,
        completedSections: [] as string[],
        currentSection: null,
      };
    }

    return {
      required: onboarding.status !== ONBOARDING_STATUS.COMPLETED,
      status: onboarding.status,
      progressPercent: onboarding.progressPercent,
      completedSections: onboarding.completedSections,
      currentSection: onboarding.currentSection ?? null,
    };
  },

  async requestPortalLink(context: WorkspaceActorContext) {
    return OnboardingService.issuePortalLinkForEmployee(
      {
        companyId: context.companyId,
        userId: context.userId,
        ip: context.ip,
        userAgent: context.userAgent,
      },
      context.employeeId,
    );
  },
};
