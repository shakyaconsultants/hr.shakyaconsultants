import type { RequestHandler } from 'express';
import { z } from 'zod';
import type { AuthenticatedRequest } from '@modules/auth/interfaces/auth-request.interface.js';
import { ResponseService } from '@shared/services/response.service.js';
import { validateInput } from '@modules/auth/validators/validate.util.js';
import { buildIntegrationActor } from '@modules/approval/types/approval.types.js';
import { IntegrationDashboardService } from '@modules/integration/services/integration-dashboard.service.js';
import { ConnectorService } from '@modules/integration/services/connector.service.js';
import { ApiKeyService } from '@modules/integration/services/api-key.service.js';
import { WebhookPlatformService } from '@modules/integration/services/webhook-platform.service.js';
import { ImportPlatformService } from '@modules/integration/services/import-platform.service.js';
import { ExportPlatformService } from '@modules/integration/services/export-platform.service.js';
import { SchedulerPlatformService } from '@modules/integration/services/scheduler-platform.service.js';
import { IntegrationLogService } from '@modules/integration/services/integration-log.service.js';
import { BackupService } from '@modules/integration/services/backup.service.js';
import {
  createApiKeySchema,
  createBackupSchema,
  createConnectorSchema,
  createScheduledJobSchema,
  createWebhookSchema,
  exportSchema,
  idParamSchema,
  importExecuteSchema,
  importPreviewSchema,
  importTemplateQuerySchema,
  listQuerySchema,
  logExportQuerySchema,
  moduleParamSchema,
  updateConnectorSchema,
  updateScheduledJobSchema,
  updateWebhookSchema,
} from '@modules/integration/validators/integration.validator.js';

function actor(req: AuthenticatedRequest) {
  return buildIntegrationActor(req);
}

export const getDashboard: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const data = await IntegrationDashboardService.getOverview(authReq.user.companyId);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const listConnectors: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(listQuerySchema, req.query);
    const data = await ConnectorService.list(authReq.user.companyId, query);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const createConnector: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = validateInput(createConnectorSchema, req.body);
    const data = await ConnectorService.create(actor(authReq), payload);
    return ResponseService.created(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const updateConnector: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const payload = validateInput(updateConnectorSchema, req.body);
    const data = await ConnectorService.update(actor(authReq), id, payload);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const deleteConnector: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    await ConnectorService.delete(actor(authReq), id);
    return ResponseService.success(res, authReq, { deleted: true });
  } catch (error) {
    next(error);
    return;
  }
};

export const getConnectorHealth: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const data = await ConnectorService.healthCheck(authReq.user.companyId, id);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const testConnector: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const data = await ConnectorService.test(actor(authReq), id);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const listApiKeys: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(listQuerySchema, req.query);
    const data = await ApiKeyService.list(authReq.user.companyId, query);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const createApiKey: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = validateInput(createApiKeySchema, req.body);
    const data = await ApiKeyService.create(actor(authReq), payload);
    return ResponseService.created(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const rotateApiKey: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const data = await ApiKeyService.rotate(actor(authReq), id);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const revokeApiKey: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const data = await ApiKeyService.revoke(actor(authReq), id);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const regenerateApiKey: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const data = await ApiKeyService.regenerate(actor(authReq), id);
    return ResponseService.created(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getApiKeyUsage: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const data = await ApiKeyService.getUsage(authReq.user.companyId, id);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const listWebhooks: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(listQuerySchema, req.query);
    const data = await WebhookPlatformService.list(authReq.user.companyId, query);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const createWebhook: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = validateInput(createWebhookSchema, req.body);
    const data = await WebhookPlatformService.create(actor(authReq), payload);
    return ResponseService.created(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const updateWebhook: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const payload = validateInput(updateWebhookSchema, req.body);
    const data = await WebhookPlatformService.update(actor(authReq), id, payload);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const deleteWebhook: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    await WebhookPlatformService.delete(actor(authReq), id);
    return ResponseService.success(res, authReq, { deleted: true });
  } catch (error) {
    next(error);
    return;
  }
};

export const getWebhookDeliveries: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const query = validateInput(listQuerySchema, req.query);
    const data = await WebhookPlatformService.listDeliveries(authReq.user.companyId, id, query);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const testWebhook: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const data = await WebhookPlatformService.test(actor(authReq), id);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const retryWebhookDelivery: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { deliveryId } = validateInput(z.object({ deliveryId: z.uuid() }), {
      deliveryId: req.params.deliveryId,
    });
    const data = await WebhookPlatformService.retryDelivery(authReq.user.companyId, deliveryId);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getImportTemplate: RequestHandler = (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { module } = validateInput(moduleParamSchema, req.params);
    const query = validateInput(importTemplateQuerySchema, req.query);
    const data = ImportPlatformService.getTemplate(module, query.entityKey);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const previewImport: RequestHandler = (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = validateInput(importPreviewSchema, req.body);
    const data = ImportPlatformService.preview(actor(authReq), payload);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const executeImport: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = validateInput(importExecuteSchema, req.body);
    const data = await ImportPlatformService.execute(actor(authReq), payload);
    return ResponseService.created(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getImportHistory: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(listQuerySchema, req.query);
    const data = await ImportPlatformService.getHistory(authReq.user.companyId, query);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getImportJob: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const data = await ImportPlatformService.getById(authReq.user.companyId, id);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const createExport: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = validateInput(exportSchema, req.body);
    const data = await ExportPlatformService.create(actor(authReq), payload);
    return ResponseService.created(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getExportHistory: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(listQuerySchema, req.query);
    const data = await ExportPlatformService.getHistory(authReq.user.companyId, query);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const downloadExport: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const data = await ExportPlatformService.getDownload(authReq.user.companyId, id);
    res.setHeader('Content-Type', data.format === 'csv' ? 'text/csv' : 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${data.fileName}"`);
    return res.send(data.content);
  } catch (error) {
    next(error);
    return;
  }
};

export const listScheduledJobs: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(listQuerySchema, req.query);
    const data = await SchedulerPlatformService.list(authReq.user.companyId, query);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const createScheduledJob: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = validateInput(createScheduledJobSchema, req.body);
    const data = await SchedulerPlatformService.create(actor(authReq), payload);
    return ResponseService.created(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const updateScheduledJob: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const payload = validateInput(updateScheduledJobSchema, req.body);
    const data = await SchedulerPlatformService.update(actor(authReq), id, payload);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const runScheduledJob: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const data = await SchedulerPlatformService.runNow(actor(authReq), id);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getSchedulerHistory: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(listQuerySchema, req.query);
    const data = await SchedulerPlatformService.getHistory(authReq.user.companyId, query);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const listLogs: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(logExportQuerySchema, req.query);
    const data = await IntegrationLogService.list(authReq.user.companyId, query);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const exportLogs: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(logExportQuerySchema, req.query);
    const csv = await IntegrationLogService.exportCsv(authReq.user.companyId, query);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=integration-logs.csv');
    return res.send(csv);
  } catch (error) {
    next(error);
    return;
  }
};

export const listBackups: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const query = validateInput(listQuerySchema, req.query);
    const data = await BackupService.list(authReq.user.companyId, query);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const createBackup: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = validateInput(createBackupSchema, req.body ?? {});
    const data = await BackupService.trigger(actor(authReq), payload.type);
    return ResponseService.created(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};

export const getBackup: RequestHandler = async (req, res, next) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = validateInput(idParamSchema, req.params);
    const data = await BackupService.getById(authReq.user.companyId, id);
    return ResponseService.success(res, authReq, data);
  } catch (error) {
    next(error);
    return;
  }
};
