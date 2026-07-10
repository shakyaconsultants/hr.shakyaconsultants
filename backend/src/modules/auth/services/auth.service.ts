import { randomBytes } from 'node:crypto';
import { getEnv } from '@config/env.js';
import { CompanyRepository } from '@domain/company/company.schema.js';
import { EmployeeRepository } from '@domain/employee/employee.schemas.js';
import { EmployeeRoleRepository, RoleRepository } from '@domain/permission/permission.schemas.js';
import { USER_STATUS } from '@domain/auth/user.schema.js';
import { EffectivePermissionService } from '@modules/rbac/services/effective-permission.service.js';
import { EmployeeProvisioningService } from '@modules/employee/services/employee-provisioning.service.js';
import { NavigationConfigService } from '@modules/settings/services/navigation-config.service.js';
import { FeatureFlagService } from '@modules/settings/services/feature-flag.service.js';
import { SYSTEM_ROLE_SLUG } from '@modules/rbac/constants/rbac.constants.js';
import { getAuthPortalHomeRoute, resolveAuthPortal } from '@modules/auth/utils/auth-portal.util.js';
import { AuditLogService } from '@infrastructure/audit/audit-log.service.js';
import { EmailDispatcher } from '@infrastructure/email/email-outbound.service.js';
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
import type { UserDocument } from '@domain/auth/user.schema.js';
import { AuthPerfTimer } from '@modules/auth/utils/auth-perf.util.js';
import { SystemAdminProfileService } from '@modules/auth/services/system-admin-profile.service.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';
import { logger } from '@logging/winston.logger.js';

export interface AuthRequestMeta {
  ipAddress: string;
  userAgent: string;
  correlationId: string;
}

async function findActiveEmployeeByEmail(companyId: string, email: string) {
  const matches = await EmployeeRepository.findMany({ email }, { companyId });
  return matches.find(
    (row) => row.status === ENTITY_STATUS.ACTIVE && !row.isDeleted && row.email.trim().length > 0,
  );
}

export const AuthService = {
  async login(input: LoginInput, meta: AuthRequestMeta): Promise<LoginResponse> {
    const perf = new AuthPerfTimer('login');

    await SystemInitService.assertSystemInitialized();
    perf.mark('system_init');

    const company = await CompanyRepository.findOne({ code: input.companyCode });
    perf.mark('company_lookup');
    if (!company) {
      await PasswordService.comparePassword(input.password, undefined);
      throw new AuthenticationError('Invalid credentials', ERROR_CODES.AUTH_INVALID_CREDENTIALS);
    }

    const user = await AuthUserRepository.findByEmailWithPassword(input.email, company.id);
    perf.mark('user_lookup');
    const passwordValid = await PasswordService.comparePassword(input.password, user?.passwordHash);
    perf.mark('password_verify');

    if (!user || !passwordValid) {
      if (!user) {
        const employee = await findActiveEmployeeByEmail(company.id, input.email);
        if (employee && !employee.userId) {
          throw new AuthenticationError(
            'Portal login is not set up for this employee yet. Ask your administrator to send login credentials from the employee profile.',
            ERROR_CODES.AUTH_ACCOUNT_INACTIVE,
          );
        }
      }

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
      throw new AuthenticationError(
        user.status === USER_STATUS.INACTIVE
          ? 'Account is not activated. Check your email for the activation link or contact your administrator.'
          : 'Account is not active',
        ERROR_CODES.AUTH_ACCOUNT_INACTIVE,
      );
    }

    let activeUser = user;
    if (await SystemAdminProfileService.isLegacyEmployeeLinkedAdmin(company.id, user)) {
      activeUser = await SystemAdminProfileService.migrateLegacyEmployeeLinkedAdmin(
        company.id,
        user,
      );
    }

    const roleIds = await this.resolveRoleIdsForUser(company.id, activeUser);
    perf.mark('role_lookup');
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
      userId: activeUser.id,
      companyId: company.id,
      deviceId,
      deviceName: input.deviceName,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      refreshToken,
      rememberMe: input.rememberMe,
      createdBy: user.id,
    });
    perf.mark('session_create');

    const accessToken = TokenService.signAccessToken({
      userId: activeUser.id,
      companyId: company.id,
      sessionId: session.sessionId,
      tokenVersion: activeUser.tokenVersion,
      roleIds,
      jti: accessJti,
    });
    perf.mark('token_generation');

    await Promise.all([
      AuthUserRepository.resetFailedAttempts(activeUser.id, company.id),
      AuthUserRepository.updateLastLogin(activeUser.id, company.id),
      LoginHistoryService.recordLoginAttempt({
        userId: activeUser.id,
        companyId: company.id,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        success: true,
        correlationId: meta.correlationId,
        createdBy: user.id,
      }),
    ]);
    perf.mark('post_login_persistence');

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
    perf.mark('audit_log');

    const profile = await this.getCurrentUser(
      {
        userId: activeUser.id,
        companyId: company.id,
        sessionId: session.sessionId,
        employeeId: activeUser.employeeId,
        roleIds,
        tokenVersion: activeUser.tokenVersion,
        email: activeUser.email,
      },
      activeUser,
    );
    perf.mark('profile_build');

    const response = toLoginResponse({
      user: toAuthUserResponse(activeUser),
      accessToken,
      refreshToken,
      expiresIn: getJwtConfig().accessExpiresIn,
      sessionId: session.sessionId,
      profile,
    });

    perf.finish({ companyId: company.id, userId: user.id });
    return response;
  },

  async refresh(refreshToken: string, _meta: AuthRequestMeta): Promise<RefreshResponse> {
    await SystemInitService.assertSystemInitialized();

    const payload = TokenService.verifyRefreshToken(refreshToken);

    const isReplay = await SessionService.isRefreshReplay(payload.jti);
    if (isReplay) {
      await SessionService.revokeAllUserSessions(payload.companyId, payload.sub, payload.sub);
      throw new AuthenticationError(
        'Refresh token replay detected',
        ERROR_CODES.AUTH_REFRESH_REPLAY,
      );
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

    const roleIds = await this.resolveRoleIdsForUser(payload.companyId, user);
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

    await EmailDispatcher.sendEmail(AUTH_EMAIL_JOBS.PASSWORD_RESET, {
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

    await AuthUserRepository.updatePassword(user.id, resetToken.companyId, passwordHash, user.id);
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

  async getCurrentUser(
    user: AuthenticatedUser,
    cachedUser?: UserDocument,
  ): Promise<CurrentUserResponse> {
    const perf = new AuthPerfTimer('auth_me');

    const dbUser = cachedUser ?? (await AuthUserRepository.findById(user.userId, user.companyId));
    perf.mark('user_lookup');
    if (!dbUser) {
      throw new NotFoundError('User not found', ERROR_CODES.NOT_FOUND);
    }

    if (user.employeeId) {
      void EmployeeProvisioningService.refreshEmployeePortalAccess(
        user.companyId,
        user.employeeId,
      ).catch((error: unknown) => {
        logger.warn('Employee portal permission sync failed during auth/me — continuing', {
          companyId: user.companyId,
          employeeId: user.employeeId,
          error: error instanceof Error ? error.message : String(error),
        });
      });
    }

    const [company, permissionsResult, employee, navigationItems, featureFlagList] =
      await Promise.all([
        CompanyRepository.findById(user.companyId, { companyId: user.companyId }),
        user.employeeId
          ? PermissionEngineService.getPermissionsForUser(user.companyId, user.employeeId)
          : dbUser.roleIds.length
            ? EffectivePermissionService.calculateForRoleIds(user.companyId, dbUser.roleIds)
            : Promise.resolve([] as string[]),
        user.employeeId
          ? EmployeeRepository.findById(user.employeeId, { companyId: user.companyId })
          : Promise.resolve(null),
        NavigationConfigService.getEffectiveNavigation(user.companyId),
        FeatureFlagService.list(user.companyId),
      ]);
    perf.mark('session_shell_fetch');

    if (!company) {
      throw new NotFoundError('Company not found', ERROR_CODES.NOT_FOUND);
    }

    const roles: CurrentUserResponse['roles'] = [];
    let employeeSummary: CurrentUserResponse['employee'];

    const roleIdsForLookup =
      user.roleIds.length > 0
        ? user.roleIds
        : dbUser.roleIds.length
          ? dbUser.roleIds
          : user.employeeId
            ? (
                await EmployeeRoleRepository.findMany(
                  { employeeId: user.employeeId, effectiveTo: null },
                  { companyId: user.companyId },
                )
              ).map((entry) => entry.roleId)
            : [];

    let resolvedRoleIds = roleIdsForLookup;
    if (user.employeeId && resolvedRoleIds.length === 0) {
      try {
        const provisioned = await EmployeeProvisioningService.ensureDefaultEmployeeRole(
          user.companyId,
          user.employeeId,
          { companyId: user.companyId, userId: user.userId },
        );
        if (provisioned) {
          resolvedRoleIds = (
            await EmployeeRoleRepository.findMany(
              { employeeId: user.employeeId, effectiveTo: null },
              { companyId: user.companyId },
            )
          ).map((entry) => entry.roleId);
        }
      } catch (error) {
        logger.warn('Default employee role provisioning failed during auth/me — continuing login', {
          companyId: user.companyId,
          employeeId: user.employeeId,
          userId: user.userId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    if (resolvedRoleIds.length > 0) {
      const roleDocs = await RoleRepository.findMany(
        { id: { $in: resolvedRoleIds } },
        { companyId: user.companyId },
      );
      for (const role of roleDocs) {
        roles.push({ id: role.id, name: role.name, slug: role.slug });
      }
    }
    perf.mark('roles_fetch');

    let permissions = permissionsResult;
    if (permissions.length === 0 && resolvedRoleIds.length > 0) {
      if (user.employeeId) {
        permissions = await PermissionEngineService.getPermissionsForUser(
          user.companyId,
          user.employeeId,
        );
      } else {
        permissions = await EffectivePermissionService.calculateForRoleIds(
          user.companyId,
          resolvedRoleIds,
        );
      }
      perf.mark('permission_fallback');
    }

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
    }

    const isSuperAdmin = roles.some((role) => role.slug === SYSTEM_ROLE_SLUG.SUPER_ADMIN);
    const portal = resolveAuthPortal(permissions, isSuperAdmin);
    const homeRoute = getAuthPortalHomeRoute(portal);
    const featureFlags: Record<string, boolean> = {};
    for (const flag of featureFlagList) {
      featureFlags[flag.key.replace(/^feature\./, '')] = flag.enabled;
    }

    perf.finish({ companyId: user.companyId, userId: user.userId });

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
      roles,
      permissions,
      employee: employeeSummary,
      portal,
      homeRoute,
      navigation: {
        items: navigationItems.map((item) => ({
          id: item.id,
          enabled: item.enabled,
          order: item.sortOrder,
          label: item.label,
          icon: item.icon,
          portals: item.portals,
        })),
      },
      featureFlags,
      sessionId: user.sessionId,
    };
  },

  async resolveRoleIdsForUser(
    companyId: string,
    user: Pick<UserDocument, 'employeeId' | 'roleIds'>,
  ): Promise<string[]> {
    if (user.employeeId) {
      const employeeRoles = await EmployeeRoleRepository.findMany(
        { employeeId: user.employeeId, effectiveTo: null },
        { companyId },
      );
      return employeeRoles.map((entry) => entry.roleId);
    }

    return user.roleIds;
  },

  /** @deprecated Use resolveRoleIdsForUser */
  async getRoleIdsForUser(companyId: string, employeeId?: string): Promise<string[]> {
    if (!employeeId) {
      return [];
    }

    const employeeRoles = await EmployeeRoleRepository.findMany(
      { employeeId, effectiveTo: null },
      { companyId },
    );

    return employeeRoles.map((entry) => entry.roleId);
  },
};
