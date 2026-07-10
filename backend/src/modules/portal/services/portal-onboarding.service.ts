import {
  OnboardingRepository,
  ONBOARDING_STATUS,
} from '@domain/recruitment/recruitment.schemas.js';
import { ONBOARDING_SECTION } from '@domain/recruitment/recruitment-extended.schemas.js';
import { SecureAccessTokenService } from '@modules/approval/services/secure-access-token.service.js';
import {
  SECURE_TOKEN_ENTITY_TYPE,
  SECURE_TOKEN_PURPOSE,
} from '@shared/constants/secure-token.constants.js';
import { NotFoundError, ConflictError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { AuditLogService } from '@infrastructure/audit/audit-log.service.js';
import { AuditAction } from '@shared/enums/index.js';
import { getEnv } from '@config/env.js';
import { EmployeeOnboardingApplyService } from '@modules/employee/services/employee-onboarding-apply.service.js';

/** Sections shown in the employee self-service onboarding portal (not the full HR checklist). */
export const PORTAL_ONBOARDING_SECTIONS = [
  'personal',
  'address',
  'bank',
  'emergency',
  'documents',
] as const;

const ALL_SECTIONS = Object.values(ONBOARDING_SECTION);

function computePortalProgress(completedSections: string[]): number {
  const done = PORTAL_ONBOARDING_SECTIONS.filter((section) => completedSections.includes(section));
  return Math.round((done.length / PORTAL_ONBOARDING_SECTIONS.length) * 100);
}

function computeProgress(completedSections: string[]): number {
  if (ALL_SECTIONS.length === 0) {
    return 0;
  }
  return Math.round((completedSections.length / ALL_SECTIONS.length) * 100);
}

export const PortalOnboardingService = {
  async getPortalState(rawToken: string) {
    const resolved = await SecureAccessTokenService.assertValid(
      SECURE_TOKEN_PURPOSE.CANDIDATE_ONBOARDING,
      rawToken,
    );
    const onboarding = await OnboardingRepository.findById(resolved.entityId, {
      companyId: resolved.companyId,
    });
    if (!onboarding) {
      throw new NotFoundError('Onboarding record not found', ERROR_CODES.NOT_FOUND);
    }

    return {
      onboardingId: onboarding.id,
      progressPercent: onboarding.progressPercent,
      currentSection: onboarding.currentSection,
      completedSections: onboarding.completedSections,
      formData: onboarding.formData,
      status: onboarding.status,
      expiresAt: resolved.record.expiresAt,
    };
  },

  async saveDraft(rawToken: string, section: string, data: Record<string, unknown>) {
    const resolved = await SecureAccessTokenService.assertValid(
      SECURE_TOKEN_PURPOSE.CANDIDATE_ONBOARDING,
      rawToken,
    );
    const onboarding = await OnboardingRepository.findById(resolved.entityId, {
      companyId: resolved.companyId,
    });
    if (!onboarding) {
      throw new NotFoundError('Onboarding record not found', ERROR_CODES.NOT_FOUND);
    }

    if (onboarding.status === ONBOARDING_STATUS.COMPLETED) {
      throw new ConflictError('Onboarding already submitted', ERROR_CODES.CONFLICT);
    }

    const formData = { ...onboarding.formData, [section]: data };
    const completedSections = Array.from(
      new Set(
        [...onboarding.completedSections, section].filter((s) =>
          PORTAL_ONBOARDING_SECTIONS.includes(s as (typeof PORTAL_ONBOARDING_SECTIONS)[number]),
        ),
      ),
    );
    const progressPercent = computePortalProgress(completedSections);
    const updated = await OnboardingRepository.update(
      onboarding.id,
      {
        formData,
        currentSection: section,
        completedSections,
        progressPercent,
        updatedBy: 'portal',
      },
      { companyId: resolved.companyId },
    );

    AuditLogService.log({
      who: 'portal',
      where: 'portal.onboarding.draft',
      action: AuditAction.Update,
      entity: 'onboarding',
      entityId: onboarding.id,
      newValue: { section },
      tenantId: resolved.companyId,
    });

    return updated;
  },

  async submit(rawToken: string) {
    const resolved = await SecureAccessTokenService.assertValid(
      SECURE_TOKEN_PURPOSE.CANDIDATE_ONBOARDING,
      rawToken,
    );
    const onboarding = await OnboardingRepository.findById(resolved.entityId, {
      companyId: resolved.companyId,
    });
    if (!onboarding) {
      throw new NotFoundError('Onboarding record not found', ERROR_CODES.NOT_FOUND);
    }

    if (onboarding.status === ONBOARDING_STATUS.COMPLETED) {
      throw new ConflictError('Onboarding already submitted', ERROR_CODES.CONFLICT);
    }

    if (onboarding.employeeId) {
      await EmployeeOnboardingApplyService.applyFormData(
        resolved.companyId,
        onboarding.employeeId,
        onboarding.formData,
        'portal',
      );
    }

    const updated = await OnboardingRepository.update(
      onboarding.id,
      {
        status: ONBOARDING_STATUS.COMPLETED,
        progressPercent: 100,
        completedSections: [...PORTAL_ONBOARDING_SECTIONS],
        updatedBy: 'portal',
      },
      { companyId: resolved.companyId },
    );

    await SecureAccessTokenService.consume(resolved, 'portal');

    AuditLogService.log({
      who: 'portal',
      where: 'portal.onboarding.submit',
      action: AuditAction.Update,
      entity: 'onboarding',
      entityId: onboarding.id,
      tenantId: resolved.companyId,
    });

    return updated;
  },

  async issuePortalToken(input: {
    companyId: string;
    onboardingId: string;
    candidateLeadId: string;
    createdByUserId: string;
  }): Promise<{ token: string; expiresAt: Date; portalUrl: string }> {
    const env = getEnv();
    const { token, expiresAt } = await SecureAccessTokenService.issue({
      companyId: input.companyId,
      purpose: SECURE_TOKEN_PURPOSE.CANDIDATE_ONBOARDING,
      entityType: SECURE_TOKEN_ENTITY_TYPE.ONBOARDING,
      entityId: input.onboardingId,
      createdByUserId: input.createdByUserId,
      expiryHours: env.SECURE_TOKEN_EXPIRY_HOURS,
      metadata: { candidateLeadId: input.candidateLeadId },
    });

    const portalUrl = `${env.FRONTEND_URL.split(',')[0]}/onboarding/${token}`;
    return { token, expiresAt, portalUrl };
  },

  recomputeProgress(completedSections: string[]): number {
    return computeProgress(completedSections);
  },
};
