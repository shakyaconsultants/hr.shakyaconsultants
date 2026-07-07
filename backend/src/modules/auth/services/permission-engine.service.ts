import { EffectivePermissionService } from '@modules/rbac/services/effective-permission.service.js';
import { PermissionCacheService } from '@modules/rbac/services/permission-cache.service.js';
import { logger } from '@logging/winston.logger.js';

export const PermissionEngineService = {
  async getPermissionsForUser(companyId: string, employeeId: string): Promise<string[]> {
    const cached = await PermissionCacheService.get(companyId, employeeId);
    if (cached) {
      return cached;
    }

    const result = await EffectivePermissionService.calculateForEmployee(companyId, employeeId);
    try {
      await PermissionCacheService.set(companyId, employeeId, result.permissions);
    } catch (error) {
      logger.warn('Permission cache write failed — continuing with computed permissions', {
        companyId,
        employeeId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
    return result.permissions;
  },

  async loadPermissionsFromDatabase(companyId: string, employeeId: string): Promise<string[]> {
    const result = await EffectivePermissionService.calculateForEmployee(companyId, employeeId);
    return result.permissions;
  },

  async invalidateUserPermissions(companyId: string, employeeId: string): Promise<void> {
    await PermissionCacheService.invalidate(companyId, employeeId);
  },
};
