import { UserRepository, USER_STATUS } from '@domain/auth/user.schema.js';
import { EmployeeRepository } from '@domain/employee/employee.schemas.js';
import { NotFoundError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { PasswordService } from '@modules/auth/services/password.service.js';
import { RecruitmentEmailService } from '@modules/recruitment/services/recruitment-email.service.js';
import {
  EmployeeLifecycleService,
  EMPLOYEE_LIFECYCLE_EMAIL,
} from '@modules/employee/services/employee-lifecycle.service.js';
import { DEFAULT_EMPLOYEE_TEMP_PASSWORD } from '@modules/employee/constants/employee.constants.js';
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

  async provisionPortalUser(input: ProvisionPortalUserInput): Promise<ProvisionPortalUserResult> {
    const email = input.email.toLowerCase();
    const temporaryPassword = this.resolveTemporaryPassword(input.temporaryPassword);
    const passwordHash = await PasswordService.hashPassword(temporaryPassword);

    const existingUser = await UserRepository.findOne({ email }, { companyId: input.companyId });
    let userId: string;

    if (existingUser) {
      await UserRepository.update(
        existingUser.id,
        {
          employeeId: input.employeeId,
          passwordHash,
          status: USER_STATUS.ACTIVE,
          mustChangePassword: false,
          updatedBy: input.userId,
        },
        { companyId: input.companyId },
      );
      userId = existingUser.id;
    } else {
      userId = generateUuid();
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
    }

    return { userId, temporaryPassword, accountStatus: USER_STATUS.ACTIVE };
  },

  async sendWelcomeCredentialsEmail(
    actor: { companyId: string; userId: string; ip?: string; userAgent?: string },
    employeeId: string,
    temporaryPassword?: string,
  ): Promise<{ temporaryPassword: string }> {
    const employee = await EmployeeRepository.findById(employeeId, { companyId: actor.companyId });
    if (!employee) {
      throw new NotFoundError('Employee not found', ERROR_CODES.NOT_FOUND);
    }

    const password = this.resolveTemporaryPassword(temporaryPassword);
    if (employee.userId) {
      const passwordHash = await PasswordService.hashPassword(password);
      await UserRepository.update(
        employee.userId,
        {
          passwordHash,
          status: USER_STATUS.ACTIVE,
          mustChangePassword: false,
          updatedBy: actor.userId,
        },
        { companyId: actor.companyId },
      );
    }

    const loginUrl = `${getEnv().FRONTEND_URL.split(',')[0]?.trim() ?? 'http://localhost:5173'}/login`;

    if (employee.email) {
      await RecruitmentEmailService.sendAccountCredentials(actor, employee.email, {
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
    }

    return { temporaryPassword: password };
  },
};
