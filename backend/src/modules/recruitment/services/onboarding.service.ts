import {
  OnboardingRepository,
  ONBOARDING_STATUS,
  OfferLetterRepository,
} from '@domain/recruitment/recruitment.schemas.js';
import { ONBOARDING_SECTION } from '@domain/recruitment/recruitment-extended.schemas.js';
import { PIPELINE_STAGE } from '@domain/recruitment/recruitment-extended.schemas.js';
import { NotFoundError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { CandidateService } from '@modules/recruitment/services/candidate.service.js';
import { CandidatePipelineService } from '@modules/recruitment/services/candidate-pipeline.service.js';
import { RecruitmentTimelineService } from '@modules/recruitment/services/recruitment-timeline.service.js';
import { EmployeeRepository } from '@domain/employee/employee.schemas.js';
import { RecruitmentAuditService } from '@modules/recruitment/services/recruitment-audit.service.js';
import { RecruitmentEmailService } from '@modules/recruitment/services/recruitment-email.service.js';
import { PortalOnboardingService } from '@modules/portal/services/portal-onboarding.service.js';
import { QueueProducer } from '@infrastructure/queue/queue.producer.js';
import { EMAIL_TEMPLATE_TYPES } from '@shared/constants/email.constants.js';
import { AUTH_EMAIL_JOBS } from '@modules/auth/constants/auth.constants.js';
import type { RecruitmentActorContext } from '@modules/recruitment/types/recruitment.types.js';

const ALL_SECTIONS = Object.values(ONBOARDING_SECTION);

export const OnboardingService = {
  SECTIONS: ONBOARDING_SECTION,

  async getByCandidate(companyId: string, candidateLeadId: string) {
    const onboarding = await OnboardingRepository.findOne({ candidateLeadId }, { companyId });
    if (!onboarding) {
      throw new NotFoundError('Onboarding not found', ERROR_CODES.NOT_FOUND);
    }
    return onboarding;
  },

  async start(
    context: RecruitmentActorContext,
    candidateLeadId: string,
    offerLetterId: string,
    startDate: Date,
  ) {
    const candidate = await CandidateService.getById(context.companyId, candidateLeadId);
    const offer = await OfferLetterRepository.findById(offerLetterId, {
      companyId: context.companyId,
    });
    if (!offer || offer.candidateLeadId !== candidateLeadId) {
      throw new NotFoundError('Offer not found for this candidate', ERROR_CODES.NOT_FOUND);
    }

    const existing = await OnboardingRepository.findOne(
      { candidateLeadId },
      { companyId: context.companyId },
    );
    if (existing) {
      return existing;
    }

    const effectiveStartDate = startDate;

    const id = generateUuid();
    const onboarding = await OnboardingRepository.create(
      {
        id,
        companyId: context.companyId,
        candidateLeadId,
        offerLetterId,
        startDate: effectiveStartDate,
        formData: {},
        completedSections: [],
        progressPercent: 0,
        currentSection: ONBOARDING_SECTION.PERSONAL,
        status: ONBOARDING_STATUS.PENDING,
        checklistItems: ALL_SECTIONS.map((section) => ({ title: section, isCompleted: false })),
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    await CandidatePipelineService.transition(
      context,
      candidateLeadId,
      PIPELINE_STAGE.ONBOARDING,
      undefined,
      {
        skipNotification: true,
      },
    );
    await RecruitmentTimelineService.record(context, {
      candidateLeadId,
      eventType: RecruitmentTimelineService.EVENT.ONBOARDING_STARTED,
      title: 'Digital onboarding started',
    });

    if (candidate.email) {
      await RecruitmentEmailService.sendJoiningInstructions(context, candidate.email, {
        candidateName: `${candidate.firstName} ${candidate.lastName}`,
        joiningDate: effectiveStartDate.toLocaleDateString(),
      });
    }

    await RecruitmentAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'onboarding',
      entityId: id,
      action: 'create',
      after: RecruitmentAuditService.toRecord(onboarding),
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return onboarding;
  },

  async saveDraft(
    context: RecruitmentActorContext,
    candidateLeadId: string,
    section: string,
    data: Record<string, unknown>,
  ) {
    const onboarding = await this.getByCandidate(context.companyId, candidateLeadId);
    const formData = { ...onboarding.formData, [section]: data };

    const updated = await OnboardingRepository.update(
      onboarding.id,
      {
        formData,
        currentSection: section,
        status: ONBOARDING_STATUS.IN_PROGRESS,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    await RecruitmentTimelineService.record(context, {
      candidateLeadId,
      eventType: RecruitmentTimelineService.EVENT.ONBOARDING_UPDATED,
      title: `Onboarding draft saved: ${section}`,
    });

    return updated;
  },

  async completeSection(
    context: RecruitmentActorContext,
    candidateLeadId: string,
    section: string,
    data: Record<string, unknown>,
  ) {
    const onboarding = await this.getByCandidate(context.companyId, candidateLeadId);
    const completedSections = onboarding.completedSections.includes(section)
      ? onboarding.completedSections
      : [...onboarding.completedSections, section];

    const formData = { ...onboarding.formData, [section]: data };
    const progressPercent = Math.round((completedSections.length / ALL_SECTIONS.length) * 100);
    const isComplete = progressPercent >= 100;

    const checklistItems = onboarding.checklistItems.map((item) =>
      item.title === section
        ? { ...item, isCompleted: true, completedAt: new Date(), completedBy: context.userId }
        : item,
    );

    const updated = await OnboardingRepository.update(
      onboarding.id,
      {
        formData,
        completedSections,
        progressPercent,
        checklistItems,
        status: isComplete ? ONBOARDING_STATUS.COMPLETED : ONBOARDING_STATUS.IN_PROGRESS,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    await RecruitmentAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'onboarding',
      entityId: onboarding.id,
      action: 'update',
      after: { section, progressPercent },
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return updated;
  },

  async issuePortalLink(context: RecruitmentActorContext, candidateLeadId: string) {
    const onboarding = await OnboardingRepository.findOne(
      { candidateLeadId },
      { companyId: context.companyId },
    );
    if (!onboarding) {
      throw new NotFoundError(
        'Onboarding not found — start onboarding first',
        ERROR_CODES.NOT_FOUND,
      );
    }

    const candidate = await CandidateService.getById(context.companyId, candidateLeadId);
    const { portalUrl, expiresAt } = await PortalOnboardingService.issuePortalToken({
      companyId: context.companyId,
      onboardingId: onboarding.id,
      candidateLeadId,
      createdByUserId: context.userId,
    });

    await QueueProducer.addEmailJob(AUTH_EMAIL_JOBS.ONBOARDING_PORTAL, {
      tenantId: context.companyId,
      userId: context.userId,
      to: candidate.email,
      templateType: EMAIL_TEMPLATE_TYPES.ONBOARDING_PORTAL,
      portalUrl,
      expiresAt: expiresAt.toISOString(),
    });

    await RecruitmentAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'onboarding',
      entityId: onboarding.id,
      action: 'update',
      after: { portalIssued: true, expiresAt: expiresAt.toISOString() },
      ip: context.ip,
      userAgent: context.userAgent,
    });

    return { portalUrl, expiresAt };
  },

  async startForEmployee(
    context: { companyId: string; userId: string },
    employeeId: string,
    startDate: Date,
  ) {
    const existing = await OnboardingRepository.findOne(
      { employeeId },
      { companyId: context.companyId },
    );
    if (existing) {
      return existing;
    }

    const id = generateUuid();
    const onboarding = await OnboardingRepository.create(
      {
        id,
        companyId: context.companyId,
        employeeId,
        startDate,
        formData: {},
        completedSections: [],
        progressPercent: 0,
        currentSection: ONBOARDING_SECTION.PERSONAL,
        status: ONBOARDING_STATUS.PENDING,
        checklistItems: ALL_SECTIONS.map((section) => ({ title: section, isCompleted: false })),
        createdBy: context.userId,
        updatedBy: context.userId,
      },
      { companyId: context.companyId },
    );

    return onboarding;
  },

  async issuePortalLinkForEmployee(
    context: { companyId: string; userId: string; ip?: string; userAgent?: string },
    employeeId: string,
  ) {
    const employee = await EmployeeRepository.findById(employeeId, {
      companyId: context.companyId,
    });
    if (!employee) {
      throw new NotFoundError('Employee not found', ERROR_CODES.NOT_FOUND);
    }

    // Start onboarding first if it hasn't been started
    const onboarding = await this.startForEmployee(context, employeeId, employee.joinedAt);

    const { portalUrl, expiresAt } = await PortalOnboardingService.issuePortalToken({
      companyId: context.companyId,
      onboardingId: onboarding.id,
      candidateLeadId: '',
      createdByUserId: context.userId,
    });

    await QueueProducer.addEmailJob(AUTH_EMAIL_JOBS.ONBOARDING_PORTAL, {
      tenantId: context.companyId,
      userId: context.userId,
      to: employee.email,
      templateType: EMAIL_TEMPLATE_TYPES.ONBOARDING_PORTAL,
      portalUrl,
      expiresAt: expiresAt.toISOString(),
    });

    return { portalUrl, expiresAt };
  },
};
