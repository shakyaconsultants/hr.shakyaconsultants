import { Router } from 'express';
import { authenticateMiddleware } from '@modules/auth/middleware/authenticate.middleware.js';
import { companyScopeMiddleware } from '@modules/auth/middleware/company-scope.middleware.js';
import { authorizeAny } from '@modules/rbac/middleware/authorize.middleware.js';
import { INTEGRATION_PERMISSIONS } from '@modules/integration/constants/integration-permissions.constants.js';
import {
  createApiKey,
  createBackup,
  createConnector,
  createExport,
  createScheduledJob,
  createWebhook,
  deleteConnector,
  deleteWebhook,
  downloadExport,
  executeImport,
  exportLogs,
  getApiKeyUsage,
  getBackup,
  getConnectorHealth,
  getDashboard,
  getExportHistory,
  getImportHistory,
  getImportJob,
  getImportTemplate,
  getSchedulerHistory,
  getWebhookDeliveries,
  listApiKeys,
  listBackups,
  listConnectors,
  listLogs,
  listScheduledJobs,
  listWebhooks,
  previewImport,
  regenerateApiKey,
  revokeApiKey,
  rotateApiKey,
  runScheduledJob,
  testConnector,
  testWebhook,
  updateConnector,
  updateScheduledJob,
  updateWebhook,
} from '@modules/integration/controllers/integration.controller.js';

const integrationRoutes = Router();

integrationRoutes.use(authenticateMiddleware);
integrationRoutes.use(companyScopeMiddleware());

const readPerm = authorizeAny(
  INTEGRATION_PERMISSIONS.READ,
  INTEGRATION_PERMISSIONS.SETTINGS_MANAGE,
);
const managePerm = authorizeAny(
  INTEGRATION_PERMISSIONS.MANAGE,
  INTEGRATION_PERMISSIONS.SETTINGS_MANAGE,
);

/** @swagger tags: [Integration] */
integrationRoutes.get('/dashboard', readPerm, getDashboard);

integrationRoutes.get('/connectors', readPerm, listConnectors);
integrationRoutes.post('/connectors', managePerm, createConnector);
integrationRoutes.patch('/connectors/:id', managePerm, updateConnector);
integrationRoutes.delete('/connectors/:id', managePerm, deleteConnector);
integrationRoutes.get('/connectors/:id/health', readPerm, getConnectorHealth);
integrationRoutes.post('/connectors/:id/test', managePerm, testConnector);

integrationRoutes.get('/api-keys', readPerm, listApiKeys);
integrationRoutes.post('/api-keys', managePerm, createApiKey);
integrationRoutes.post('/api-keys/:id/rotate', managePerm, rotateApiKey);
integrationRoutes.post('/api-keys/:id/revoke', managePerm, revokeApiKey);
integrationRoutes.post('/api-keys/:id/regenerate', managePerm, regenerateApiKey);
integrationRoutes.get('/api-keys/:id/usage', readPerm, getApiKeyUsage);

integrationRoutes.get('/webhooks', readPerm, listWebhooks);
integrationRoutes.post('/webhooks', managePerm, createWebhook);
integrationRoutes.patch('/webhooks/:id', managePerm, updateWebhook);
integrationRoutes.delete('/webhooks/:id', managePerm, deleteWebhook);
integrationRoutes.get('/webhooks/:id/deliveries', readPerm, getWebhookDeliveries);
integrationRoutes.post('/webhooks/:id/test', managePerm, testWebhook);

integrationRoutes.get('/import/templates/:module', readPerm, getImportTemplate);
integrationRoutes.post('/import/preview', managePerm, previewImport);
integrationRoutes.post('/import/execute', managePerm, executeImport);
integrationRoutes.get('/import/history', readPerm, getImportHistory);
integrationRoutes.get('/import/:id', readPerm, getImportJob);

integrationRoutes.post('/export', managePerm, createExport);
integrationRoutes.get('/export/history', readPerm, getExportHistory);
integrationRoutes.get('/export/:id/download', readPerm, downloadExport);

integrationRoutes.get('/scheduler/jobs', readPerm, listScheduledJobs);
integrationRoutes.post('/scheduler/jobs', managePerm, createScheduledJob);
integrationRoutes.patch('/scheduler/jobs/:id', managePerm, updateScheduledJob);
integrationRoutes.post('/scheduler/jobs/:id/run', managePerm, runScheduledJob);
integrationRoutes.get('/scheduler/history', readPerm, getSchedulerHistory);

integrationRoutes.get('/logs', readPerm, listLogs);
integrationRoutes.get('/logs/export', readPerm, exportLogs);

integrationRoutes.get('/backups', readPerm, listBackups);
integrationRoutes.post('/backups', managePerm, createBackup);
integrationRoutes.get('/backups/:id', readPerm, getBackup);

export { integrationRoutes };
