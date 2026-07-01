import { USER_STATUS } from '@domain/auth/user.schema.js';
import { EmployeeRepository } from '@domain/employee/employee.schemas.js';
import type { EmployeeLifecycleEmails } from '@domain/employee/employee.schemas.js';
import { OnboardingRepository, ONBOARDING_STATUS } from '@domain/recruitment/recruitment.schemas.js';
import { AuthUserRepository } from '@modules/auth/repositories/user.repository.js';
import { AuthPasswordResetRepository } from '@modules/auth/repositories/password-reset.repository.js';
import { AccountActivationService } from '@modules/auth/services/account-activation.service.js';
import { OnboardingService } from '@modules/recruitment/services/onboarding.service.js';
import { NotFoundError, ValidationError, ConflictError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { getEnv } from '@config/env.js';
import { QueueProducer } from '@infrastructure/queue/queue.producer.js';
import { AUTH_EMAIL_JOBS } from '@modules/auth/constants/auth.constants.js';
import { EMAIL_TEMPLATE_TYPES } from '@shared/constants/email.constants.js';
import { PASSWORD_RESET_TOKEN_BYTES, PASSWORD_RESET_EXPIRY_MS } from '@modules/auth/constants/auth.constants.js';
import { randomBytes } from 'node:crypto';
import { hashRefreshToken } from '@modules/auth/services/token.service.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import type { EmployeeActorContext } from '@modules/employee/types/employee.types.js';

export const EMPLOYEE_LIFECYCLE_EMAIL = {
  ACCOUNT_ACTIVATION: 'accountActivation',
  ONBOARDING_PORTAL: 'onboardingPortal',
  PASSWORD_RESET: 'passwordReset',
} as const;

export type EmployeeLifecycleEmailType = (typeof EMPLOYEE_LIFECYCLE_EMAIL)[keyof typeof EMPLOYEE_LIFECYCLE_EMAIL];

type EmailDeliveryStatus = 'never_sent' | 'sent' | 'failed';

export interface EmployeeEmailDeliveryView {
  deliveryStatus: EmailDeliveryStatus;
  lastSentAt: string | null;
  sendCount: number;
  lastError: string | null;
}

export interface EmployeeLifecycleProfileView {
  account: {
    hasUserAccount: boolean;
    userStatus: string | null;
    isActivated: boolean;
    email: EmployeeEmailDeliveryView;
  };
  onboarding: {
    status: string;
    progressPercent: number;
    isComplete: boolean;
    email: EmployeeEmailDeliveryView;
  };
  passwordReset: {
    email: EmployeeEmailDeliveryView;
  };
}

function toEmailView(snapshot?: EmployeeLifecycleEmails[keyof EmployeeLifecycleEmails]): EmployeeEmailDeliveryView {
  const sendCount = snapshot?.sendCount ?? 0;
  const lastSentAt = snapshot?.lastSentAt ? new Date(snapshot.lastSentAt).toISOString() : null;
  const lastError = snapshot?.lastError ?? null;

  let deliveryStatus: EmailDeliveryStatus = 'never_sent';
  if (lastSentAt) {
    deliveryStatus = 'sent';
  } else if (lastError) {
    deliveryStatus = 'failed';
  }

  return { deliveryStatus, lastSentAt, sendCount, lastError };
}

function lifecycleEmailPath(type: EmployeeLifecycleEmailType): string {
  return `lifecycleEmails.${type}`;
}

export const EmployeeLifecycleService = {
  async recordEmailSuccess(
    companyId: string,
    employeeId: string,
    type: EmployeeLifecycleEmailType,
    sentBy: string,
  ): Promise<void> {
    const employee = await EmployeeRepository.findById(employeeId, { companyId });
    if (!employee) {
      return;
    }

    const current = employee.lifecycleEmails?.[type];
    const sendCount = (current?.sendCount ?? 0) + 1;
    const prefix = lifecycleEmailPath(type);

    await EmployeeRepository.update(
      employeeId,
      {
        $set: {
          [`${prefix}.lastSentAt`]: new Date(),
          [`${prefix}.lastSentBy`]: sentBy,
          [`${prefix}.sendCount`]: sendCount,
          updatedBy: sentBy,
        },
        $unset: {
          [`${prefix}.lastError`]: '',
        },
      },
      { companyId },
    );
  },

  async recordEmailFailure(
    companyId: string,
    employeeId: string,
    type: EmployeeLifecycleEmailType,
    sentBy: string,
    error: unknown,
  ): Promise<void> {
    const employee = await EmployeeRepository.findById(employeeId, { companyId });
    if (!employee) {
      return;
    }

    const message = error instanceof Error ? error.message : String(error);
    const prefix = lifecycleEmailPath(type);
    const current = employee.lifecycleEmails?.[type];

    await EmployeeRepository.update(
      employeeId,
      {
        $set: {
          [`${prefix}.lastError`]: message,
          [`${prefix}.lastSentBy`]: sentBy,
          [`${prefix}.sendCount`]: current?.sendCount ?? 0,
          updatedBy: sentBy,
        },
      },
      { companyId },
    );
  },

  async getProfileStatus(companyId: string, employeeId: string): Promise<EmployeeLifecycleProfileView> {
    const employee = await EmployeeRepository.findById(employeeId, { companyId });
    if (!employee) {
      throw new NotFoundError('Employee not found', ERROR_CODES.NOT_FOUND);
    }

    const user = employee.userId
      ? await AuthUserRepository.findById(employee.userId, companyId)
      : null;
    const onboarding = await OnboardingRepository.findOne({ employeeId }, { companyId });
    const emails = employee.lifecycleEmails ?? {};

    return {
      account: {
        hasUserAccount: Boolean(employee.userId),
        userStatus: user?.status ?? null,
        isActivated: user?.status === USER_STATUS.ACTIVE,
        email: toEmailView(emails.accountActivation),
      },
      onboarding: {
        status: onboarding?.status ?? 'not_started',
        progressPercent: onboarding?.progressPercent ?? 0,
        isComplete: onboarding?.status === ONBOARDING_STATUS.COMPLETED,
        email: toEmailView(emails.onboardingPortal),
      },
      passwordReset: {
        email: toEmailView(emails.passwordReset),
      },
    };
  },

  async sendActivationEmail(
    actor: EmployeeActorContext,
    employeeId: string,
  ): Promise<{ expiresAt: string; message: string; lifecycle: EmployeeLifecycleProfileView }> {
    try {
      const result = await AccountActivationService.issueActivationToken(actor, employeeId);
      await this.recordEmailSuccess(actor.companyId, employeeId, EMPLOYEE_LIFECYCLE_EMAIL.ACCOUNT_ACTIVATION, actor.userId);
      const lifecycle = await this.getProfileStatus(actor.companyId, employeeId);
      return {
        expiresAt: result.expiresAt.toISOString(),
        message: 'Account activation email sent successfully.',
        lifecycle,
      };
    } catch (error) {
      if (!(error instanceof ConflictError)) {
        await this.recordEmailFailure(actor.companyId, employeeId, EMPLOYEE_LIFECYCLE_EMAIL.ACCOUNT_ACTIVATION, actor.userId, error);
      }
      throw error;
    }
  },

  async sendOnboardingEmail(
    actor: EmployeeActorContext,
    employeeId: string,
  ): Promise<{ expiresAt: string; message: string; lifecycle: EmployeeLifecycleProfileView }> {
    const employee = await EmployeeRepository.findById(employeeId, { companyId: actor.companyId });
    if (!employee) {
      throw new NotFoundError('Employee not found', ERROR_CODES.NOT_FOUND);
    }

    if (!employee.userId) {
      throw new ValidationError('Employee has no user account', [], { code: ERROR_CODES.VALIDATION_FAILED });
    }

    const user = await AuthUserRepository.findById(employee.userId, actor.companyId);
    if (!user || user.status !== USER_STATUS.ACTIVE) {
      throw new ValidationError('Employee must activate their account before onboarding email can be sent', [], {
        code: ERROR_CODES.VALIDATION_FAILED,
      });
    }

    try {
      const result = await OnboardingService.issuePortalLinkForEmployee(actor, employeeId);
      await this.recordEmailSuccess(actor.companyId, employeeId, EMPLOYEE_LIFECYCLE_EMAIL.ONBOARDING_PORTAL, actor.userId);
      const lifecycle = await this.getProfileStatus(actor.companyId, employeeId);
      return {
        expiresAt: result.expiresAt.toISOString(),
        message: 'Onboarding email sent successfully.',
        lifecycle,
      };
    } catch (error) {
      await this.recordEmailFailure(actor.companyId, employeeId, EMPLOYEE_LIFECYCLE_EMAIL.ONBOARDING_PORTAL, actor.userId, error);
      throw error;
    }
  },

  async sendPasswordResetEmail(
    actor: EmployeeActorContext,
    employeeId: string,
  ): Promise<{ message: string; lifecycle: EmployeeLifecycleProfileView }> {
    const employee = await EmployeeRepository.findById(employeeId, { companyId: actor.companyId });
    if (!employee) {
      throw new NotFoundError('Employee not found', ERROR_CODES.NOT_FOUND);
    }

    if (!employee.userId) {
      throw new ValidationError('Employee has no user account', [], { code: ERROR_CODES.VALIDATION_FAILED });
    }

    const user = await AuthUserRepository.findById(employee.userId, actor.companyId);
    if (!user) {
      throw new NotFoundError('User not found', ERROR_CODES.NOT_FOUND);
    }

    try {
      const rawToken = randomBytes(PASSWORD_RESET_TOKEN_BYTES).toString('hex');
      const tokenHash = hashRefreshToken(rawToken);
      const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRY_MS);

      await AuthPasswordResetRepository.invalidateUserTokens(user.id, actor.companyId);
      await AuthPasswordResetRepository.createToken({
        id: generateUuid(),
        companyId: actor.companyId,
        userId: user.id,
        tokenHash,
        expiresAt,
        ipAddress: actor.ip,
        createdBy: actor.userId,
        updatedBy: actor.userId,
      });

      const env = getEnv();
      const resetUrl = `${env.FRONTEND_URL.split(',')[0]}/reset-password?token=${rawToken}`;

      await QueueProducer.addEmailJob(AUTH_EMAIL_JOBS.PASSWORD_RESET, {
        tenantId: actor.companyId,
        userId: user.id,
        to: user.email,
        templateType: EMAIL_TEMPLATE_TYPES.PASSWORD_RESET,
        resetUrl,
        expiresAt: expiresAt.toISOString(),
      });

      await this.recordEmailSuccess(actor.companyId, employeeId, EMPLOYEE_LIFECYCLE_EMAIL.PASSWORD_RESET, actor.userId);
      const lifecycle = await this.getProfileStatus(actor.companyId, employeeId);
      return { message: 'Password reset email sent successfully.', lifecycle };
    } catch (error) {
      await this.recordEmailFailure(actor.companyId, employeeId, EMPLOYEE_LIFECYCLE_EMAIL.PASSWORD_RESET, actor.userId, error);
      throw error;
    }
  },
};
