import type { ClientSession } from 'mongoose';
import { CompanyRepository } from '@domain/company/company.schema.js';
import { EmployeeRepository, EMPLOYMENT_TYPE } from '@domain/employee/employee.schemas.js';
import {
  BranchRepository,
  DepartmentRepository,
  DesignationRepository,
} from '@domain/organization/organization.schemas.js';
import {
  EmployeeRoleRepository,
  PermissionGroupRepository,
  PermissionRepository,
  RolePermissionRepository,
  RoleRepository,
} from '@domain/permission/permission.schemas.js';
import { UserRepository, USER_STATUS } from '@domain/auth/user.schema.js';
import { runInTransaction } from '@infrastructure/database/transaction.helper.js';
import { AuditLogService } from '@infrastructure/audit/audit-log.service.js';
import { AuditAction } from '@shared/enums/index.js';
import {
  AUTH_AUDIT_WHERE,
  AUTH_ENTITY_TYPES,
} from '@modules/auth/constants/auth.constants.js';
import {
  DIRECTOR_PERMISSION_CODES,
} from '@modules/auth/constants/permission-catalog.constants.js';
import {
  BOOTSTRAP_ORG_DEFAULTS,
  DIRECTOR_ROLE,
  SUPER_ADMIN_ROLE,
} from '@modules/auth/constants/role-seed.constants.js';
import { ENTERPRISE_PERMISSION_CATALOG } from '@modules/rbac/constants/enterprise-permission-catalog.constants.js';
import type { BootstrapResultResponse } from '@modules/auth/dto/auth.dto.js';
import { PasswordService } from '@modules/auth/services/password.service.js';
import { SystemInitService } from '@modules/auth/services/system-init.service.js';
import type { BootstrapInput } from '@modules/auth/validators/bootstrap.validator.js';
import { ConflictError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { ENTITY_STATUS } from '@shared/constants/status.constants.js';
import { generateUuid } from '@shared/utils/random-id.util.js';

const SYSTEM_ACTOR = 'system';

export const BootstrapService = {
  async bootstrapSystem(input: BootstrapInput): Promise<BootstrapResultResponse> {
    const initialized = await SystemInitService.isSystemInitialized();
    if (initialized) {
      throw new ConflictError(
        'System is already initialized',
        ERROR_CODES.SYSTEM_ALREADY_INITIALIZED,
      );
    }

    const companyId = generateUuid();
    const branchDefaults = input.branch ?? {};
    const branchAddress = branchDefaults.address ?? input.company.address;

    return runInTransaction(async (session: ClientSession) => {
      const company = await CompanyRepository.create(
        {
          id: companyId,
          companyId,
          name: input.company.name,
          legalName: input.company.legalName,
          slug: input.company.name,
          code: input.company.code,
          email: input.company.email,
          phone: input.company.phone,
          website: input.company.website,
          taxId: input.company.taxId,
          registrationNumber: input.company.registrationNumber,
          address: input.company.address,
          timezone: input.company.timezone,
          currency: input.company.currency,
          fiscalYearStart: input.company.fiscalYearStart,
          status: ENTITY_STATUS.ACTIVE,
          settings: {},
          createdBy: SYSTEM_ACTOR,
          updatedBy: SYSTEM_ACTOR,
        },
        { session },
      );

      const branchId = generateUuid();
      await BranchRepository.create(
        {
          id: branchId,
          companyId,
          name: branchDefaults.name ?? BOOTSTRAP_ORG_DEFAULTS.BRANCH_NAME,
          code: branchDefaults.code ?? BOOTSTRAP_ORG_DEFAULTS.BRANCH_CODE,
          phone: branchDefaults.phone ?? input.company.phone,
          email: branchDefaults.email ?? input.company.email,
          address: branchAddress,
          status: ENTITY_STATUS.ACTIVE,
          createdBy: SYSTEM_ACTOR,
          updatedBy: SYSTEM_ACTOR,
        },
        { companyId, session },
      );

      const departmentId = generateUuid();
      await DepartmentRepository.create(
        {
          id: departmentId,
          companyId,
          name: BOOTSTRAP_ORG_DEFAULTS.DEPARTMENT_NAME,
          code: BOOTSTRAP_ORG_DEFAULTS.DEPARTMENT_CODE,
          status: ENTITY_STATUS.ACTIVE,
          createdBy: SYSTEM_ACTOR,
          updatedBy: SYSTEM_ACTOR,
        },
        { companyId, session },
      );

      const designationId = generateUuid();
      await DesignationRepository.create(
        {
          id: designationId,
          companyId,
          name: BOOTSTRAP_ORG_DEFAULTS.DESIGNATION_NAME,
          code: BOOTSTRAP_ORG_DEFAULTS.DESIGNATION_CODE,
          status: ENTITY_STATUS.ACTIVE,
          createdBy: SYSTEM_ACTOR,
          updatedBy: SYSTEM_ACTOR,
        },
        { companyId, session },
      );

      const permissionGroupMap = new Map<string, string>();
      const uniqueGroups = [...new Set(ENTERPRISE_PERMISSION_CATALOG.map((entry) => entry.groupSlug))];

      const permissionGroupDocs = uniqueGroups.map((groupSlug) => {
        const groupId = generateUuid();
        const catalogEntry = ENTERPRISE_PERMISSION_CATALOG.find((entry) => entry.groupSlug === groupSlug);
        permissionGroupMap.set(groupSlug, groupId);

        return {
          id: groupId,
          companyId,
          name: groupSlug.charAt(0).toUpperCase() + groupSlug.slice(1),
          slug: groupSlug,
          module: catalogEntry?.module ?? groupSlug,
          status: ENTITY_STATUS.ACTIVE,
          createdBy: SYSTEM_ACTOR,
          updatedBy: SYSTEM_ACTOR,
        };
      });

      await PermissionGroupRepository.bulkInsert(permissionGroupDocs, { companyId, session });

      const permissionIdByCode = new Map<string, string>();
      const permissionDocs = ENTERPRISE_PERMISSION_CATALOG.map((entry) => {
        const permissionId = generateUuid();
        permissionIdByCode.set(entry.code, permissionId);

        return {
          id: permissionId,
          companyId,
          code: entry.code,
          name: entry.name,
          module: entry.module,
          action: entry.action,
          permissionGroupId: permissionGroupMap.get(entry.groupSlug),
          status: ENTITY_STATUS.ACTIVE,
          createdBy: SYSTEM_ACTOR,
          updatedBy: SYSTEM_ACTOR,
        };
      });

      await PermissionRepository.bulkInsert(permissionDocs, { session });

      const superAdminRoleId = generateUuid();
      await RoleRepository.create(
        {
          id: superAdminRoleId,
          companyId,
          name: SUPER_ADMIN_ROLE.name,
          slug: SUPER_ADMIN_ROLE.slug,
          description: SUPER_ADMIN_ROLE.description,
          isSystem: SUPER_ADMIN_ROLE.isSystem,
          status: ENTITY_STATUS.ACTIVE,
          createdBy: SYSTEM_ACTOR,
          updatedBy: SYSTEM_ACTOR,
        },
        { companyId, session },
      );

      const superAdminRolePermissions = ENTERPRISE_PERMISSION_CATALOG.flatMap((entry) => {
        const permissionId = permissionIdByCode.get(entry.code);
        if (!permissionId) {
          return [];
        }
        return [
          {
            id: generateUuid(),
            companyId,
            roleId: superAdminRoleId,
            permissionId,
            createdBy: SYSTEM_ACTOR,
            updatedBy: SYSTEM_ACTOR,
          },
        ];
      });

      await RolePermissionRepository.bulkInsert(superAdminRolePermissions, { companyId, session });

      const directorRoleId = generateUuid();
      await RoleRepository.create(
        {
          id: directorRoleId,
          companyId,
          name: DIRECTOR_ROLE.name,
          slug: DIRECTOR_ROLE.slug,
          description: DIRECTOR_ROLE.description,
          isSystem: DIRECTOR_ROLE.isSystem,
          status: ENTITY_STATUS.ACTIVE,
          createdBy: SYSTEM_ACTOR,
          updatedBy: SYSTEM_ACTOR,
        },
        { companyId, session },
      );

      const directorRolePermissions = DIRECTOR_PERMISSION_CODES.flatMap((code) => {
        const permissionId = permissionIdByCode.get(code);
        if (!permissionId) {
          return [];
        }
        return [
          {
            id: generateUuid(),
            companyId,
            roleId: directorRoleId,
            permissionId,
            createdBy: SYSTEM_ACTOR,
            updatedBy: SYSTEM_ACTOR,
          },
        ];
      });

      await RolePermissionRepository.bulkInsert(directorRolePermissions, { companyId, session });

      const adminEmployeeId = generateUuid();
      await EmployeeRepository.create(
        {
          id: adminEmployeeId,
          companyId,
          employeeNumber: BOOTSTRAP_ORG_DEFAULTS.EMPLOYEE_NUMBER,
          firstName: input.admin.firstName,
          lastName: input.admin.lastName,
          email: input.admin.email,
          phone: input.admin.phone,
          departmentId,
          designationId,
          branchId,
          joinedAt: new Date(),
          employmentType: EMPLOYMENT_TYPE.FULL_TIME,
          status: ENTITY_STATUS.ACTIVE,
          createdBy: SYSTEM_ACTOR,
          updatedBy: SYSTEM_ACTOR,
        },
        { companyId, session },
      );

      const passwordHash = await PasswordService.hashPassword(input.admin.password);
      const adminUserId = generateUuid();
      await UserRepository.create(
        {
          id: adminUserId,
          companyId,
          email: input.admin.email,
          passwordHash,
          employeeId: adminEmployeeId,
          tokenVersion: 0,
          failedLoginAttempts: 0,
          lockedUntil: null,
          lastLoginAt: null,
          passwordChangedAt: new Date(),
          mustChangePassword: false,
          status: USER_STATUS.ACTIVE,
          createdBy: SYSTEM_ACTOR,
          updatedBy: SYSTEM_ACTOR,
        },
        { companyId, session },
      );

      await EmployeeRepository.update(
        adminEmployeeId,
        { $set: { userId: adminUserId } },
        { companyId, session },
      );

      await EmployeeRoleRepository.create(
        {
          id: generateUuid(),
          companyId,
          employeeId: adminEmployeeId,
          roleId: superAdminRoleId,
          assignedBy: SYSTEM_ACTOR,
          assignedAt: new Date(),
          createdBy: SYSTEM_ACTOR,
          updatedBy: SYSTEM_ACTOR,
        },
        { companyId, session },
      );

      AuditLogService.log({
        who: SYSTEM_ACTOR,
        where: AUTH_AUDIT_WHERE.AUTH_BOOTSTRAP,
        action: AuditAction.Create,
        entity: AUTH_ENTITY_TYPES.USER,
        entityId: adminUserId,
        newValue: {
          companyId,
          companyCode: company.code,
          adminEmail: input.admin.email,
        },
        tenantId: companyId,
      });

      return {
        companyId,
        companyCode: company.code,
        branchId,
        adminUserId,
        adminEmployeeId,
        superAdminRoleId,
        message: 'System initialized successfully',
      };
    });
  },
};
