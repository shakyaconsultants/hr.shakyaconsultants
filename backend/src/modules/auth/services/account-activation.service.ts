import { getEnv, isProduction } from '@config/env.js';
import { UserRepository, USER_STATUS } from '@domain/auth/user.schema.js';
import { AuthUserRepository } from '@modules/auth/repositories/user.repository.js';
import { EmployeeRepository } from '@domain/employee/employee.schemas.js';
import { AuditLogService } from '@infrastructure/audit/audit-log.service.js';
import { QueueProducer } from '@infrastructure/queue/queue.producer.js';
import { AuditAction } from '@shared/enums/index.js';
import {
  SECURE_TOKEN_ENTITY_TYPE,
  SECURE_TOKEN_PURPOSE,
} from '@shared/constants/secure-token.constants.js';
import { SecureAccessTokenService } from '@modules/approval/services/secure-access-token.service.js';
import { PasswordService } from '@modules/auth/services/password.service.js';
import { PermissionEngineService } from '@modules/auth/services/permission-engine.service.js';
import {
  AUTH_AUDIT_WHERE,
  AUTH_EMAIL_JOBS,
  AUTH_ENTITY_TYPES,
} from '@modules/auth/constants/auth.constants.js';
import { NotFoundError, ConflictError, ValidationError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { EMAIL_TEMPLATE_TYPES } from '@shared/constants/email.constants.js';
import { OnboardingService } from '@modules/recruitment/services/onboarding.service.js';
import {
  EmployeeLifecycleService,
  EMPLOYEE_LIFECYCLE_EMAIL,
} from '@modules/employee/services/employee-lifecycle.service.js';
import { EmployeeProvisioningService } from '@modules/employee/services/employee-provisioning.service.js';
import { logger } from '@logging/winston.logger.js';

export interface AccountActivationActor {
  companyId: string;
  userId: string;
  ip?: string;
  userAgent?: string;
}

export const AccountActivationService = {
  async issueActivationToken(
    actor: AccountActivationActor,
    employeeId: string,
  ): Promise<{ expiresAt: Date }> {
    const employee = await EmployeeRepository.findById(employeeId, { companyId: actor.companyId });
    if (!employee) {
      throw new NotFoundError('Employee not found', ERROR_CODES.NOT_FOUND);
    }

    if (!employee.userId) {
      throw new ValidationError('Employee has no user account', [], {
        code: ERROR_CODES.VALIDATION_FAILED,
      });
    }

    const user = await AuthUserRepository.findById(employee.userId, actor.companyId);
    if (!user) {
      throw new NotFoundError('User not found', ERROR_CODES.NOT_FOUND);
    }

    if (user.status === USER_STATUS.ACTIVE) {
      throw new ConflictError('Account is already active', ERROR_CODES.CONFLICT);
    }

    const env = getEnv();
    const { token, expiresAt } = await SecureAccessTokenService.issue({
      companyId: actor.companyId,
      purpose: SECURE_TOKEN_PURPOSE.ACCOUNT_ACTIVATION,
      entityType: SECURE_TOKEN_ENTITY_TYPE.USER,
      entityId: user.id,
      createdByUserId: actor.userId,
      expiryHours: env.SECURE_TOKEN_EXPIRY_HOURS,
      metadata: { employeeId, email: user.email },
    });

    const activationUrl = `${env.FRONTEND_URL.split(',')[0]}/account-activation/${token}`;

    if (!isProduction()) {
      logger.info('Account activation link issued (dev)', {
        email: user.email,
        employeeId,
        activationUrl,
      });
    }

    await QueueProducer.addEmailJob(AUTH_EMAIL_JOBS.ACCOUNT_ACTIVATION, {
      tenantId: actor.companyId,
      userId: user.id,
      to: user.email,
      templateType: EMAIL_TEMPLATE_TYPES.ACCOUNT_ACTIVATION,
      activationUrl,
      expiresAt: expiresAt.toISOString(),
    }).catch((emailError: unknown) => {
      logger.error('Account activation email delivery failed', {
        email: user.email,
        employeeId,
        error: emailError instanceof Error ? emailError.message : String(emailError),
      });
    });

    AuditLogService.log({
      who: actor.userId,
      where: AUTH_AUDIT_WHERE.AUTH_ACCOUNT_ACTIVATION_ISSUE,
      action: AuditAction.Create,
      entity: AUTH_ENTITY_TYPES.USER,
      entityId: user.id,
      newValue: { employeeId, expiresAt: expiresAt.toISOString() },
      ip: actor.ip,
      device: actor.userAgent,
      tenantId: actor.companyId,
    });

    return { expiresAt };
  },

  async activateAccount(
    rawToken: string,
    password: string,
    meta: { ip?: string; userAgent?: string },
  ): Promise<{ message: string }> {
    PasswordService.validatePasswordStrength(password);
    const resolved = await SecureAccessTokenService.assertValid(
      SECURE_TOKEN_PURPOSE.ACCOUNT_ACTIVATION,
      rawToken,
    );

    const user = await AuthUserRepository.findById(resolved.entityId, resolved.companyId);
    if (!user) {
      throw new NotFoundError('User not found', ERROR_CODES.NOT_FOUND);
    }

    if (user.status === USER_STATUS.ACTIVE) {
      throw new ConflictError('Account is already active', ERROR_CODES.CONFLICT);
    }

    const passwordHash = await PasswordService.hashPassword(password);
    await AuthUserRepository.updatePassword(
      resolved.entityId,
      resolved.companyId,
      passwordHash,
      resolved.entityId,
    );
    await UserRepository.update(
      resolved.entityId,
      { status: USER_STATUS.ACTIVE, mustChangePassword: false, updatedBy: resolved.entityId },
      { companyId: resolved.companyId },
    );
    await PasswordService.recordPasswordHistory(
      resolved.entityId,
      resolved.companyId,
      passwordHash,
      resolved.entityId,
    );
    await SecureAccessTokenService.consume(resolved, resolved.entityId);

    if (user.employeeId) {
      await EmployeeProvisioningService.ensureDefaultEmployeeRole(
        resolved.companyId,
        user.employeeId,
        {
          companyId: resolved.companyId,
          userId: resolved.entityId,
          employeeId: user.employeeId,
          ip: meta.ip,
          userAgent: meta.userAgent,
        },
      );
      await PermissionEngineService.invalidateUserPermissions(resolved.companyId, user.employeeId);
      try {
        await OnboardingService.issuePortalLinkForEmployee(
          {
            companyId: resolved.companyId,
            userId: resolved.entityId,
            ip: meta.ip,
            userAgent: meta.userAgent,
          },
          user.employeeId,
        );
        await EmployeeLifecycleService.recordEmailSuccess(
          resolved.companyId,
          user.employeeId,
          EMPLOYEE_LIFECYCLE_EMAIL.ONBOARDING_PORTAL,
          resolved.entityId,
        );
      } catch (onboardingError) {
        if (user.employeeId) {
          await EmployeeLifecycleService.recordEmailFailure(
            resolved.companyId,
            user.employeeId,
            EMPLOYEE_LIFECYCLE_EMAIL.ONBOARDING_PORTAL,
            resolved.entityId,
            onboardingError,
          );
        }
        console.error('Failed to trigger employee onboarding portal:', onboardingError);
      }
    }

    AuditLogService.log({
      who: resolved.entityId,
      where: AUTH_AUDIT_WHERE.AUTH_ACCOUNT_ACTIVATION,
      action: AuditAction.Update,
      entity: AUTH_ENTITY_TYPES.USER,
      entityId: resolved.entityId,
      ip: meta.ip,
      device: meta.userAgent,
      tenantId: resolved.companyId,
    });

    return { message: 'Account activated successfully. You may now sign in.' };
  },

  async getActivationStatus(
    rawToken: string,
  ): Promise<{ valid: boolean; expired: boolean; email?: string }> {
    try {
      const resolved = await SecureAccessTokenService.assertValid(
        SECURE_TOKEN_PURPOSE.ACCOUNT_ACTIVATION,
        rawToken,
      );
      const metadata = resolved.record.metadata;
      const email = typeof metadata.email === 'string' ? metadata.email : undefined;
      return { valid: true, expired: false, email };
    } catch (error) {
      if (error instanceof ConflictError) {
        return { valid: false, expired: true };
      }
      return { valid: false, expired: false };
    }
  },
};
