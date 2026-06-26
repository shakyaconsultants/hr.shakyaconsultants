import { randomBytes } from 'node:crypto';
import { getEnv } from '@config/env.js';
import { CompanyRepository } from '@domain/company/company.schema.js';
import { EmployeeRepository } from '@domain/employee/employee.schemas.js';
import {
  BranchRepository,
  DepartmentRepository,
} from '@domain/organization/organization.schemas.js';
import { EmployeeRoleRepository, RoleRepository } from '@domain/permission/permission.schemas.js';
import { USER_STATUS } from '@domain/auth/user.schema.js';
import { AuditLogService } from '@infrastructure/audit/audit-log.service.js';
import { QueueProducer } from '@infrastructure/queue/queue.producer.js';
import { AuditAction } from '@shared/enums/index.js';
import {
  AUTH_AUDIT_WHERE,
  AUTH_EMAIL_JOBS,
  AUTH_ENTITY_TYPES,
  PASSWORD_RESET_EXPIRY_MS,
  PASSWORD_RESET_TOKEN_BYTES,
} from '@modules/auth/constants/auth.constants.js';
import type {
  CurrentUserResponse,
  ForgotPasswordResponse,
  LoginResponse,
  LogoutResponse,
  RefreshResponse,
  ResetPasswordResponse,
} from '@modules/auth/dto/auth.dto.js';
import { toAuthUserResponse, toLoginResponse } from '@modules/auth/dto/auth.dto.js';
import { AuthPasswordResetRepository } from '@modules/auth/repositories/password-reset.repository.js';
import { AuthUserRepository } from '@modules/auth/repositories/user.repository.js';
import { LoginHistoryService } from '@modules/auth/services/login-history.service.js';
import { PasswordService } from '@modules/auth/services/password.service.js';
import { PermissionEngineService } from '@modules/auth/services/permission-engine.service.js';
import { SessionService } from '@modules/auth/services/session.service.js';
import { SystemInitService } from '@modules/auth/services/system-init.service.js';
import {
  getJwtConfig,
  hashRefreshToken,
  TokenService,
} from '@modules/auth/services/token.service.js';
import type {
  ForgotPasswordInput,
  LoginInput,
  ResetPasswordInput,
} from '@modules/auth/validators/auth.validator.js';
import type { AuthenticatedUser } from '@modules/auth/interfaces/auth-user.interface.js';
import { AuthenticationError, NotFoundError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { EMAIL_TEMPLATE_TYPES } from '@shared/constants/email.constants.js';
import { generateUuid } from '@shared/utils/random-id.util.js';

export interface AuthRequestMeta {
  ipAddress: string;
  userAgent: string;
  correlationId: string;
}

export const AuthService = {
  async login(input: LoginInput, meta: AuthRequestMeta): Promise<LoginResponse> {
    await SystemInitService.assertSystemInitialized();

    const company = await CompanyRepository.findOne({ code: input.companyCode });
    if (!company) {
      await PasswordService.comparePassword(input.password, undefined);
      throw new AuthenticationError('Invalid credentials', ERROR_CODES.AUTH_INVALID_CREDENTIALS);
    }

    const user = await AuthUserRepository.findByEmailWithPassword(input.email, company.id);
    const passwordValid = await PasswordService.comparePassword(
      input.password,
      user?.passwordHash,
    );

    if (!user || !passwordValid) {
      if (user) {
        await AuthUserRepository.incrementFailedAttempts(user.id, company.id);
        await LoginHistoryService.recordLoginAttempt({
          userId: user.id,
          companyId: company.id,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
          success: false,
          correlationId: meta.correlationId,
          failureReason: 'invalid_credentials',
          createdBy: user.id,
        });
      }

      throw new AuthenticationError('Invalid credentials', ERROR_CODES.AUTH_INVALID_CREDENTIALS);
    }

    if (user.status === USER_STATUS.LOCKED) {
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        await LoginHistoryService.recordLoginAttempt({
          userId: user.id,
          companyId: company.id,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
          success: false,
          correlationId: meta.correlationId,
          failureReason: 'account_locked',
          createdBy: user.id,
        });
        throw new AuthenticationError('Account is locked', ERROR_CODES.AUTH_ACCOUNT_LOCKED);
      }
      await AuthUserRepository.resetFailedAttempts(user.id, company.id);
    }

    if (user.status === USER_STATUS.INACTIVE || user.status === USER_STATUS.PENDING) {
      throw new AuthenticationError('Account is not active', ERROR_CODES.AUTH_ACCOUNT_INACTIVE);
    }

    const roleIds = await this.getRoleIdsForUser(company.id, user.employeeId);
    const sessionId = generateUuid();
    const accessJti = generateUuid();
    const refreshJti = generateUuid();
    const deviceId = input.deviceId ?? generateUuid();

    const refreshToken = TokenService.signRefreshToken({
      userId: user.id,
      companyId: company.id,
      sessionId,
      tokenVersion: user.tokenVersion,
      jti: refreshJti,
    });

    const session = await SessionService.createSession({
      sessionId,
      userId: user.id,
      companyId: company.id,
      deviceId,
      deviceName: input.deviceName,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      refreshToken,
      rememberMe: input.rememberMe,
      createdBy: user.id,
    });

    const accessToken = TokenService.signAccessToken({
      userId: user.id,
      companyId: company.id,
      sessionId: session.sessionId,
      tokenVersion: user.tokenVersion,
      roleIds,
      jti: accessJti,
    });

    await AuthUserRepository.resetFailedAttempts(user.id, company.id);
    await AuthUserRepository.updateLastLogin(user.id, company.id);

    await LoginHistoryService.recordLoginAttempt({
      userId: user.id,
      companyId: company.id,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      success: true,
      correlationId: meta.correlationId,
      createdBy: user.id,
    });

    AuditLogService.log({
      who: user.id,
      where: AUTH_AUDIT_WHERE.AUTH_LOGIN,
      action: AuditAction.Login,
      entity: AUTH_ENTITY_TYPES.USER,
      entityId: user.id,
      newValue: { sessionId: session.sessionId, companyId: company.id },
      ip: meta.ipAddress,
      device: meta.userAgent,
      correlationId: meta.correlationId,
      tenantId: company.id,
    });

    return toLoginResponse({
      user: toAuthUserResponse(user),
      accessToken,
      refreshToken,
      expiresIn: getJwtConfig().accessExpiresIn,
      sessionId: session.sessionId,
    });
  },

  async refresh(refreshToken: string, _meta: AuthRequestMeta): Promise<RefreshResponse> {
    await SystemInitService.assertSystemInitialized();

    const payload = TokenService.verifyRefreshToken(refreshToken);

    const isReplay = await SessionService.isRefreshReplay(payload.jti);
    if (isReplay) {
      await SessionService.revokeAllUserSessions(payload.companyId, payload.sub, payload.sub);
      throw new AuthenticationError('Refresh token replay detected', ERROR_CODES.AUTH_REFRESH_REPLAY);
    }

    const session = await SessionService.findActiveSession(payload.companyId, payload.sessionId);
    if (!session) {
      throw new AuthenticationError('Session revoked', ERROR_CODES.AUTH_SESSION_REVOKED);
    }

    const tokenHash = hashRefreshToken(refreshToken);
    if (session.refreshTokenHash !== tokenHash) {
      await SessionService.revokeSession(payload.companyId, payload.sessionId, payload.sub);
      throw new AuthenticationError('Invalid refresh token', ERROR_CODES.AUTH_TOKEN_INVALID);
    }

    const user = await AuthUserRepository.findById(payload.sub, payload.companyId);
    if (!user || user.tokenVersion !== payload.tokenVersion) {
      throw new AuthenticationError('Invalid refresh token', ERROR_CODES.AUTH_TOKEN_INVALID);
    }

    const roleIds = await this.getRoleIdsForUser(payload.companyId, user.employeeId);
    const newAccessJti = generateUuid();
    const newRefreshJti = generateUuid();

    const newRefreshToken = TokenService.signRefreshToken({
      userId: user.id,
      companyId: payload.companyId,
      sessionId: payload.sessionId,
      tokenVersion: user.tokenVersion,
      jti: newRefreshJti,
    });

    await SessionService.rotateRefreshToken({
      companyId: payload.companyId,
      sessionId: payload.sessionId,
      oldJti: payload.jti,
      newRefreshToken,
      updatedBy: user.id,
    });

    await SessionService.updateLastActivity(payload.companyId, payload.sessionId);

    const accessToken = TokenService.signAccessToken({
      userId: user.id,
      companyId: payload.companyId,
      sessionId: payload.sessionId,
      tokenVersion: user.tokenVersion,
      roleIds,
      jti: newAccessJti,
    });

    return {
      tokens: {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: getJwtConfig().accessExpiresIn,
        tokenType: 'Bearer',
      },
      sessionId: payload.sessionId,
    };
  },

  async logout(
    user: AuthenticatedUser,
    refreshToken: string | undefined,
    meta: AuthRequestMeta,
  ): Promise<LogoutResponse> {
    if (refreshToken) {
      try {
        const payload = TokenService.verifyRefreshToken(refreshToken);
        if (payload.sub === user.userId && payload.sessionId === user.sessionId) {
          await SessionService.revokeSession(user.companyId, user.sessionId, user.userId);
        }
      } catch {
        await SessionService.revokeSession(user.companyId, user.sessionId, user.userId);
      }
    } else {
      await SessionService.revokeSession(user.companyId, user.sessionId, user.userId);
    }

    AuditLogService.log({
      who: user.userId,
      where: AUTH_AUDIT_WHERE.AUTH_LOGOUT,
      action: AuditAction.Logout,
      entity: AUTH_ENTITY_TYPES.SESSION,
      entityId: user.sessionId,
      ip: meta.ipAddress,
      device: meta.userAgent,
      correlationId: meta.correlationId,
      tenantId: user.companyId,
    });

    return { message: 'Logged out successfully' };
  },

  async logoutAllDevices(user: AuthenticatedUser, _meta: AuthRequestMeta): Promise<LogoutResponse> {
    await SessionService.revokeAllUserSessions(user.companyId, user.userId, user.userId);

    AuditLogService.log({
      who: user.userId,
      where: AUTH_AUDIT_WHERE.AUTH_LOGOUT_ALL,
      action: AuditAction.Logout,
      entity: AUTH_ENTITY_TYPES.USER,
      entityId: user.userId,
      ip: _meta.ipAddress,
      device: _meta.userAgent,
      correlationId: _meta.correlationId,
      tenantId: user.companyId,
    });

    return { message: 'Logged out from all devices' };
  },

  async forgotPassword(
    input: ForgotPasswordInput,
    meta: AuthRequestMeta,
  ): Promise<ForgotPasswordResponse> {
    await SystemInitService.assertSystemInitialized();

    const company = await CompanyRepository.findOne({ code: input.companyCode });
    const genericMessage = 'If the account exists, a password reset email has been sent';

    if (!company) {
      return { message: genericMessage };
    }

    const user = await AuthUserRepository.findByEmailWithPassword(input.email, company.id);
    if (!user) {
      return { message: genericMessage };
    }

    const rawToken = randomBytes(PASSWORD_RESET_TOKEN_BYTES).toString('hex');
    const tokenHash = hashRefreshToken(rawToken);
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRY_MS);

    await AuthPasswordResetRepository.invalidateUserTokens(user.id, company.id);
    await AuthPasswordResetRepository.createToken({
      id: generateUuid(),
      companyId: company.id,
      userId: user.id,
      tokenHash,
      expiresAt,
      ipAddress: meta.ipAddress,
      createdBy: user.id,
      updatedBy: user.id,
    });

    const env = getEnv();
    const resetUrl = `${env.FRONTEND_URL.split(',')[0]}/reset-password?token=${rawToken}`;

    await QueueProducer.addEmailJob(AUTH_EMAIL_JOBS.PASSWORD_RESET, {
      tenantId: company.id,
      userId: user.id,
      to: user.email,
      templateType: EMAIL_TEMPLATE_TYPES.PASSWORD_RESET,
      resetUrl,
      expiresAt: expiresAt.toISOString(),
    });

    return { message: genericMessage };
  },

  async resetPassword(
    input: ResetPasswordInput,
    meta: AuthRequestMeta,
  ): Promise<ResetPasswordResponse> {
    await SystemInitService.assertSystemInitialized();
    PasswordService.validatePasswordStrength(input.password);

    const tokenHash = hashRefreshToken(input.token);
    const resetToken = await AuthPasswordResetRepository.findValidByHash(tokenHash);

    if (!resetToken) {
      throw new AuthenticationError(
        'Invalid or expired reset token',
        ERROR_CODES.AUTH_RESET_TOKEN_INVALID,
      );
    }

    if (resetToken.expiresAt <= new Date()) {
      throw new AuthenticationError(
        'Reset token has expired',
        ERROR_CODES.AUTH_RESET_TOKEN_EXPIRED,
      );
    }

    const user = await AuthUserRepository.findById(resetToken.userId, resetToken.companyId);
    if (!user) {
      throw new NotFoundError('User not found', ERROR_CODES.NOT_FOUND);
    }

    const passwordHash = await PasswordService.hashPassword(input.password);

    await AuthUserRepository.updatePassword(
      user.id,
      resetToken.companyId,
      passwordHash,
      user.id,
    );
    await PasswordService.recordPasswordHistory(
      user.id,
      resetToken.companyId,
      passwordHash,
      user.id,
    );
    await AuthPasswordResetRepository.markUsed(resetToken.id);
    await AuthUserRepository.incrementTokenVersion(user.id, resetToken.companyId);
    await SessionService.revokeAllUserSessions(resetToken.companyId, user.id, user.id);

    if (user.employeeId) {
      await PermissionEngineService.invalidateUserPermissions(
        resetToken.companyId,
        user.employeeId,
      );
    }

    AuditLogService.log({
      who: user.id,
      where: AUTH_AUDIT_WHERE.AUTH_PASSWORD_RESET,
      action: AuditAction.Update,
      entity: AUTH_ENTITY_TYPES.USER,
      entityId: user.id,
      ip: meta.ipAddress,
      device: meta.userAgent,
      correlationId: meta.correlationId,
      tenantId: resetToken.companyId,
    });

    return { message: 'Password reset successfully' };
  },

  async getCurrentUser(user: AuthenticatedUser): Promise<CurrentUserResponse> {
    const dbUser = await AuthUserRepository.findById(user.userId, user.companyId);
    if (!dbUser) {
      throw new NotFoundError('User not found', ERROR_CODES.NOT_FOUND);
    }

    const company = await CompanyRepository.findById(user.companyId, { companyId: user.companyId });
    if (!company) {
      throw new NotFoundError('Company not found', ERROR_CODES.NOT_FOUND);
    }

    let permissions: string[] = [];
    let employeeSummary: CurrentUserResponse['employee'];
    let branchSummary: CurrentUserResponse['branch'];
    let departmentSummary: CurrentUserResponse['department'];
    let managerSummary: CurrentUserResponse['manager'];
    const roles: CurrentUserResponse['roles'] = [];

    if (user.employeeId) {
      permissions = await PermissionEngineService.getPermissionsForUser(
        user.companyId,
        user.employeeId,
      );

      const employee = await EmployeeRepository.findById(user.employeeId, {
        companyId: user.companyId,
      });

      if (employee) {
        employeeSummary = {
          id: employee.id,
          employeeNumber: employee.employeeNumber,
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          phone: employee.phone,
          departmentId: employee.departmentId,
          designationId: employee.designationId,
          branchId: employee.branchId,
          reportingManagerId: employee.reportingManagerId,
          employmentType: employee.employmentType,
          status: employee.status,
          joinedAt: employee.joinedAt.toISOString(),
        };

        if (employee.branchId) {
          const branch = await BranchRepository.findById(employee.branchId, {
            companyId: user.companyId,
          });
          if (branch) {
            branchSummary = { id: branch.id, name: branch.name, code: branch.code };
          }
        }

        const department = await DepartmentRepository.findById(employee.departmentId, {
          companyId: user.companyId,
        });
        if (department) {
          departmentSummary = {
            id: department.id,
            name: department.name,
            code: department.code,
          };
        }

        if (employee.reportingManagerId) {
          const manager = await EmployeeRepository.findById(employee.reportingManagerId, {
            companyId: user.companyId,
          });
          if (manager) {
            managerSummary = {
              id: manager.id,
              employeeNumber: manager.employeeNumber,
              firstName: manager.firstName,
              lastName: manager.lastName,
            };
          }
        }

        const employeeRoles = await EmployeeRoleRepository.findMany(
          { employeeId: user.employeeId },
          { companyId: user.companyId },
        );
        const roleIds = employeeRoles.map((entry) => entry.roleId);
        if (roleIds.length > 0) {
          const roleDocs = await RoleRepository.findMany(
            { id: { $in: roleIds } },
            { companyId: user.companyId },
          );
          for (const role of roleDocs) {
            roles.push({ id: role.id, name: role.name, slug: role.slug });
          }
        }
      }
    }

    return {
      user: toAuthUserResponse(dbUser),
      company: {
        id: company.id,
        name: company.name,
        code: company.code,
        email: company.email,
        timezone: company.timezone,
        currency: company.currency,
      },
      branch: branchSummary,
      department: departmentSummary,
      roles,
      permissions,
      manager: managerSummary,
      employee: employeeSummary,
      sessionId: user.sessionId,
    };
  },

  async getRoleIdsForUser(companyId: string, employeeId?: string): Promise<string[]> {
    if (!employeeId) {
      return [];
    }

    const employeeRoles = await EmployeeRoleRepository.findMany(
      { employeeId },
      { companyId },
    );

    return employeeRoles.map((entry) => entry.roleId);
  },

  async listSessions(user: AuthenticatedUser) {
    return SessionService.listActiveSessions(user.companyId, user.userId, user.sessionId);
  },

  async listSessionHistory(user: AuthenticatedUser) {
    return SessionService.listSessionHistory(user.companyId, user.userId);
  },

  async revokeSession(user: AuthenticatedUser, sessionId: string, meta: AuthRequestMeta) {
    await SessionService.revokeUserSession(user.companyId, user.userId, sessionId, user.userId, user.sessionId);

    AuditLogService.log({
      who: user.userId,
      where: AUTH_AUDIT_WHERE.AUTH_SESSION_REVOKE,
      action: AuditAction.Update,
      entity: AUTH_ENTITY_TYPES.SESSION,
      entityId: sessionId,
      ip: meta.ipAddress,
      device: meta.userAgent,
      correlationId: meta.correlationId,
      tenantId: user.companyId,
    });

    return { message: 'Session revoked' };
  },
};
