import { UserRepository, USER_STATUS } from '@domain/auth/user.schema.js';
import { EmployeeRepository } from '@domain/employee/employee.schemas.js';
import { RoleRepository } from '@domain/permission/permission.schemas.js';
import { NotFoundError, ConflictError, ValidationError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';
import { SYSTEM_ROLE_SLUG } from '@modules/rbac/constants/rbac.constants.js';
import { MongoServerError } from 'mongodb';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { PasswordService } from '@modules/auth/services/password.service.js';
import { RecruitmentEmailService } from '@modules/recruitment/services/recruitment-email.service.js';
import {
  EmployeeLifecycleService,
  EMPLOYEE_LIFECYCLE_EMAIL,
} from '@modules/employee/services/employee-lifecycle.service.js';
import { DEFAULT_EMPLOYEE_TEMP_PASSWORD } from '@modules/employee/constants/employee.constants.js';
import { EmployeeProvisioningService } from '@modules/employee/services/employee-provisioning.service.js';
import { getEnv } from '@config/env.js';

export interface ProvisionPortalUserInput {
  companyId: string;
  userId: string;
  email: string;
  employeeId: string;
  temporaryPassword?: string;
}

export interface ProvisionPortalUserResult {
  userId: string;
  temporaryPassword: string;
  accountStatus: string;
}

export const EmployeeAccountService = {
  resolveTemporaryPassword(input?: string): string {
    const value = typeof input === 'string' ? input.trim() : '';
    return value.length >= 6 ? value : DEFAULT_EMPLOYEE_TEMP_PASSWORD;
  },

  assertPortalPassword(password: string): string {
    const value = password.trim();
    if (value.length < 6) {
      throw new ValidationError('Portal password must be at least 6 characters');
    }
    return value;
  },

  async provisionPortalUser(input: ProvisionPortalUserInput): Promise<ProvisionPortalUserResult> {
    const email = input.email.toLowerCase();
    const temporaryPassword = this.resolveTemporaryPassword(input.temporaryPassword);
    const passwordHash = await PasswordService.hashPassword(temporaryPassword);

    let existingUser = await UserRepository.findOne({ email }, { companyId: input.companyId });
    let userId: string;

    const linkExistingUser = async (user: NonNullable<typeof existingUser>): Promise<string> => {
      const superAdminRole = await RoleRepository.findOne(
        { slug: SYSTEM_ROLE_SLUG.SUPER_ADMIN },
        { companyId: input.companyId },
      );
      const isSystemAdmin =
        Boolean(superAdminRole && user.roleIds.includes(superAdminRole.id)) && !user.employeeId;

      if (isSystemAdmin) {
        throw new ConflictError(
          'This email is reserved for the company administrator login. Use a different work email for the employee.',
          ERROR_CODES.EMAIL_ALREADY_EXISTS,
          { field: 'email', value: email, reason: 'SYSTEM_ADMIN_EMAIL' },
        );
      }

      if (user.employeeId) {
        const linkedEmployee = await EmployeeRepository.findById(user.employeeId, {
          companyId: input.companyId,
          includeDeleted: true,
        });
        if (
          linkedEmployee &&
          linkedEmployee.status === ENTITY_STATUS.ACTIVE &&
          !linkedEmployee.isDeleted
        ) {
          const employeeLabel =
            `${linkedEmployee.firstName} ${linkedEmployee.lastName}`.trim() ||
            linkedEmployee.employeeNumber;
          throw new ConflictError(
            `Email "${email}" is already linked to ${employeeLabel}`,
            ERROR_CODES.EMAIL_ALREADY_EXISTS,
            {
              field: 'email',
              value: email,
              reason: 'PORTAL_USER_LINKED',
              employeeId: linkedEmployee.id,
            },
          );
        }
      }

      await UserRepository.update(
        user.id,
        {
          employeeId: input.employeeId,
          passwordHash,
          status: USER_STATUS.ACTIVE,
          mustChangePassword: false,
          updatedBy: input.userId,
        },
        { companyId: input.companyId },
      );
      return user.id;
    };

    if (existingUser) {
      userId = await linkExistingUser(existingUser);
    } else {
      userId = generateUuid();
      try {
        await UserRepository.create(
          {
            id: userId,
            companyId: input.companyId,
            email,
            passwordHash,
            employeeId: input.employeeId,
            mustChangePassword: false,
            status: USER_STATUS.ACTIVE,
            createdBy: input.userId,
            updatedBy: input.userId,
          },
          { companyId: input.companyId },
        );
      } catch (error) {
        if (error instanceof MongoServerError && error.code === 11000) {
          existingUser = await UserRepository.findOne({ email }, { companyId: input.companyId });
          if (!existingUser) {
            throw error;
          }
          userId = await linkExistingUser(existingUser);
        } else {
          throw error;
        }
      }
    }

    return { userId, temporaryPassword, accountStatus: USER_STATUS.ACTIVE };
  },

  async ensurePortalAccountForEmployee(input: {
    companyId: string;
    actorUserId: string;
    employeeId: string;
    password?: string;
  }): Promise<ProvisionPortalUserResult> {
    const employee = await EmployeeRepository.findById(input.employeeId, {
      companyId: input.companyId,
    });
    if (!employee) {
      throw new NotFoundError('Employee not found', ERROR_CODES.NOT_FOUND);
    }

    const email = employee.email.trim().toLowerCase();
    if (!email) {
      throw new ValidationError('Employee email is required to create a portal account');
    }

    const result = await this.provisionPortalUser({
      companyId: input.companyId,
      userId: input.actorUserId,
      email,
      employeeId: employee.id,
      temporaryPassword: input.password,
    });

    if (employee.userId !== result.userId) {
      await EmployeeRepository.update(
        employee.id,
        { userId: result.userId, updatedBy: input.actorUserId },
        { companyId: input.companyId },
      );
    }

    await EmployeeProvisioningService.ensureDefaultEmployeeRole(input.companyId, employee.id, {
      companyId: input.companyId,
      userId: result.userId,
      employeeId: employee.id,
    });

    return result;
  },

  async setPortalPasswordForEmployee(input: {
    companyId: string;
    actorUserId: string;
    employeeId: string;
    password: string;
  }): Promise<{ temporaryPassword: string }> {
    const password = this.assertPortalPassword(input.password);
    const result = await this.ensurePortalAccountForEmployee({
      companyId: input.companyId,
      actorUserId: input.actorUserId,
      employeeId: input.employeeId,
      password,
    });
    return { temporaryPassword: result.temporaryPassword };
  },

  async sendWelcomeCredentialsEmail(
    actor: { companyId: string; userId: string; ip?: string; userAgent?: string },
    employeeId: string,
    temporaryPassword?: string,
    options?: { skipProvisioning?: boolean },
  ): Promise<{ temporaryPassword: string }> {
    const employee = await EmployeeRepository.findById(employeeId, { companyId: actor.companyId });
    if (!employee) {
      throw new NotFoundError('Employee not found', ERROR_CODES.NOT_FOUND);
    }

    const password = this.resolveTemporaryPassword(temporaryPassword);
    if (!options?.skipProvisioning) {
      await this.ensurePortalAccountForEmployee({
        companyId: actor.companyId,
        actorUserId: actor.userId,
        employeeId,
        password,
      });
    } else if (!employee.userId) {
      throw new ValidationError(
        'Employee portal account is not ready yet. Try again in a moment or resend login credentials.',
      );
    }

    const loginUrl = `${getEnv().FRONTEND_URL.split(',')[0]?.trim() ?? 'http://localhost:5173'}/login`;

    if (!employee.email.trim()) {
      throw new ValidationError('Employee email is required to send welcome credentials');
    }

    await RecruitmentEmailService.sendAccountCredentialsNow(actor, employee.email, {
      employeeName: `${employee.firstName} ${employee.lastName}`,
      email: employee.email,
      password,
      loginUrl,
    });
    await EmployeeLifecycleService.recordEmailSuccess(
      actor.companyId,
      employeeId,
      EMPLOYEE_LIFECYCLE_EMAIL.ACCOUNT_ACTIVATION,
      actor.userId,
    );

    return { temporaryPassword: password };
  },
};
