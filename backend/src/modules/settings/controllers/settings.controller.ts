import type { Response, NextFunction, RequestHandler } from 'express';
import type { AuthenticatedRequest } from '@modules/auth/interfaces/auth-request.interface.js';
import { ResponseService } from '@shared/services/response.service.js';
import { validateInput } from '@modules/auth/validators/validate.util.js';
import { SettingsService } from '@modules/settings/services/settings.service.js';
import { ConfigurationCatalogService } from '@modules/settings/services/configuration-catalog.service.js';
import { SettingVersionService } from '@modules/settings/services/setting-version.service.js';
import { FeatureFlagService } from '@modules/settings/services/feature-flag.service.js';
import { NavigationConfigService } from '@modules/settings/services/navigation-config.service.js';
import { AuditExplorerService } from '@modules/settings/services/audit-explorer.service.js';
import { SystemAdminService } from '@modules/settings/services/system-admin.service.js';
import {
  auditExplorerQuerySchema,
  auditIdParamSchema,
  createSettingSchema,
  emailTestSchema,
  featureFlagKeyParamSchema,
  listSettingsQuerySchema,
  settingGroupParamSchema,
  settingHistoryQuerySchema,
  settingKeyParamSchema,
  toggleFeatureFlagSchema,
  updateNavigationSchema,
  updateSettingSchema,
} from '@modules/settings/validators/settings.validator.js';
import type { MasterDataActorContext } from '@modules/organization/shared/master-data.service.js';

function buildActor(req: AuthenticatedRequest): MasterDataActorContext {
  return {
    companyId: req.user.companyId,
    userId: req.user.userId,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  };
}

export const listSettings: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(listSettingsQuerySchema, req.query);
    const result = await SettingsService.list(authReq.user.companyId, query);
    return ResponseService.paginated(res, authReq, result);
  } catch (error) {
    next(error);
    return;
  }
};

export const getPublicSettings: RequestHandler = async (req, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const settings = await SettingsService.getPublicSettings(authReq.user.companyId);
    return ResponseService.success(res, authReq, settings);
  } catch (error) {
    next(error);
    return;
  }
};

export const getSettingByKey: RequestHandler = async (req, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { key } = validateInput(settingKeyParamSchema, req.params);
    const setting = await SettingsService.getByKey(authReq.user.companyId, key);
    return ResponseService.success(res, authReq, setting);
  } catch (error) {
    next(error);
    return;
  }
};

export const getSettingsByGroup: RequestHandler = async (req, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { group } = validateInput(settingGroupParamSchema, req.params);
    const settings = await SettingsService.getByGroup(authReq.user.companyId, group);
    return ResponseService.success(res, authReq, settings);
  } catch (error) {
    next(error);
    return;
  }
};

export const createSetting: RequestHandler = async (req, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const input = validateInput(createSettingSchema, req.body);
    const setting = await SettingsService.create(authReq.user.companyId, input, buildActor(authReq));
    return ResponseService.created(res, authReq, setting);
  } catch (error) {
    next(error);
    return;
  }
};

export const updateSetting: RequestHandler = async (req, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { key } = validateInput(settingKeyParamSchema, req.params);
    const input = validateInput(updateSettingSchema, req.body);
    const setting = await SettingsService.update(authReq.user.companyId, key, input, buildActor(authReq));
    return ResponseService.updated(res, authReq, setting);
  } catch (error) {
    next(error);
    return;
  }
};

export const deleteSetting: RequestHandler = async (req, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { key } = validateInput(settingKeyParamSchema, req.params);
    await SettingsService.softDelete(authReq.user.companyId, key, buildActor(authReq));
    return ResponseService.deleted(res, authReq);
  } catch (error) {
    next(error);
    return;
  }
};

export const getConfigurationSections: RequestHandler = async (req, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const sections = ConfigurationCatalogService.getSections();
    return ResponseService.success(res, authReq, sections);
  } catch (error) {
    next(error);
    return;
  }
};

export const getConfigurationCatalog: RequestHandler = async (req, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const catalog = await ConfigurationCatalogService.getCatalog(authReq.user.companyId);
    return ResponseService.success(res, authReq, catalog);
  } catch (error) {
    next(error);
    return;
  }
};

export const seedConfigurationDefaults: RequestHandler = async (req, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const result = await ConfigurationCatalogService.seedDefaults(
      authReq.user.companyId,
      buildActor(authReq),
    );
    return ResponseService.success(res, authReq, result);
  } catch (error) {
    next(error);
    return;
  }
};

export const getSettingHistory: RequestHandler = async (req, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { key } = validateInput(settingKeyParamSchema, req.params);
    const query = validateInput(settingHistoryQuerySchema, req.query);
    const history = await SettingVersionService.getHistoryByKey(authReq.user.companyId, key, query);
    return ResponseService.paginated(res, authReq, history);
  } catch (error) {
    next(error);
    return;
  }
};

export const listFeatureFlags: RequestHandler = async (req, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const flags = await FeatureFlagService.list(authReq.user.companyId);
    return ResponseService.success(res, authReq, flags);
  } catch (error) {
    next(error);
    return;
  }
};

export const toggleFeatureFlag: RequestHandler = async (req, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { flagKey } = validateInput(featureFlagKeyParamSchema, req.params);
    const { enabled } = validateInput(toggleFeatureFlagSchema, req.body);
    const setting = await FeatureFlagService.toggle(
      authReq.user.companyId,
      flagKey,
      enabled,
      buildActor(authReq),
    );
    return ResponseService.updated(res, authReq, setting);
  } catch (error) {
    next(error);
    return;
  }
};

export const getNavigationConfig: RequestHandler = async (req, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const navigation = await NavigationConfigService.getEffectiveNavigation(authReq.user.companyId);
    return ResponseService.success(res, authReq, navigation);
  } catch (error) {
    next(error);
    return;
  }
};

export const updateNavigationConfig: RequestHandler = async (req, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { overrides } = validateInput(updateNavigationSchema, req.body);
    const navigation = await NavigationConfigService.saveOverrides(
      authReq.user.companyId,
      overrides,
      buildActor(authReq),
    );
    return ResponseService.success(res, authReq, navigation);
  } catch (error) {
    next(error);
    return;
  }
};

export const queryAuditLogs: RequestHandler = async (req, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(auditExplorerQuerySchema, req.query);
    const result = await AuditExplorerService.query(authReq.user.companyId, query);
    return ResponseService.paginated(res, authReq, result);
  } catch (error) {
    next(error);
    return;
  }
};

export const getAuditLogById: RequestHandler = async (req, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(auditIdParamSchema, req.params);
    const log = await AuditExplorerService.getById(authReq.user.companyId, id);
    return ResponseService.success(res, authReq, log);
  } catch (error) {
    next(error);
    return;
  }
};

export const exportAuditLogs: RequestHandler = async (req, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(auditExplorerQuerySchema, req.query);
    const csv = await AuditExplorerService.exportCsv(authReq.user.companyId, query);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="audit-logs-export.csv"');
    return res.status(200).send(csv);
  } catch (error) {
    next(error);
    return;
  }
};

export const getSystemHealth: RequestHandler = async (req, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const [health, storage, appInfo, emailQueue] = await Promise.all([
      SystemAdminService.getSystemHealth(),
      SystemAdminService.getStorageInfo(authReq.user.companyId),
      Promise.resolve(SystemAdminService.getAppInfo()),
      SystemAdminService.getEmailQueueStatus(authReq.user.companyId),
    ]);
    return ResponseService.success(res, authReq, { health, storage, appInfo, emailQueue });
  } catch (error) {
    next(error);
    return;
  }
};

export const testEmailSettings: RequestHandler = async (req, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    validateInput(emailTestSchema, req.body);
    const result = await SystemAdminService.testEmail(authReq.user.companyId);
    return ResponseService.success(res, authReq, result);
  } catch (error) {
    next(error);
    return;
  }
};
