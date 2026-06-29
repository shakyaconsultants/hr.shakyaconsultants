import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppMutation } from '@/shared/feedback/use-app-mutation';
import { ON_DEMAND_QUERY_OPTIONS, MASTER_DATA_QUERY_OPTIONS } from '@/shared/api/query-config';
import {
  createApiKey,
  createBackup,
  createConnector,
  createExportJob,
  createWebhook,
  deleteConnector,
  deleteWebhook,
  downloadExport,
  executeImport,
  fetchApiKey,
  fetchApiKeyUsage,
  fetchApiKeys,
  fetchBackups,
  fetchConnector,
  fetchConnectors,
  fetchExportHistory,
  fetchExportJob,
  fetchImportHistory,
  fetchImportJob,
  fetchImportModules,
  fetchIntegrationDashboard,
  fetchIntegrationLogs,
  fetchSchedulerFailures,
  fetchSchedulerJobHistory,
  fetchSchedulerJobs,
  fetchWebhook,
  fetchWebhookDeliveries,
  fetchWebhooks,
  previewImport,
  regenerateApiKey,
  retryWebhookDelivery,
  revokeApiKey,
  rotateApiKey,
  testConnector,
  testWebhook,
  toggleConnector,
  toggleSchedulerJob,
  updateApiKey,
  updateConnector,
  updateWebhook,
  verifyBackup,
  type CreateApiKeyPayload,
  type CreateConnectorPayload,
  type CreateExportPayload,
  type CreateWebhookPayload,
  type ListParams,
  type LogListParams,
  type UpdateApiKeyPayload,
  type UpdateConnectorPayload,
  type UpdateWebhookPayload,
} from '@/features/integration/api/integration.api';

const INTEGRATION_QUERY_KEY = ['integration'] as const;

export function useIntegrationDashboard() {
  return useQuery({
    queryKey: [...INTEGRATION_QUERY_KEY, 'dashboard'],
    queryFn: fetchIntegrationDashboard,
    ...ON_DEMAND_QUERY_OPTIONS,
  });
}

export function useConnectors() {
  return useQuery({
    queryKey: [...INTEGRATION_QUERY_KEY, 'connectors'],
    queryFn: fetchConnectors,
    ...ON_DEMAND_QUERY_OPTIONS,
  });
}

export function useConnector(id: string) {
  return useQuery({
    queryKey: [...INTEGRATION_QUERY_KEY, 'connectors', id],
    queryFn: () => fetchConnector(id),
    enabled: Boolean(id),
  });
}

export function useCreateConnector() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: (payload: CreateConnectorPayload) => createConnector(payload),
    errorToast: false,
    successMessage: false,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...INTEGRATION_QUERY_KEY, 'connectors'] }),
  });
}

export function useUpdateConnector() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateConnectorPayload }) =>
      updateConnector(id, payload),
    errorToast: false,
    successMessage: false,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...INTEGRATION_QUERY_KEY, 'connectors'] }),
  });
}

export function useDeleteConnector() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: deleteConnector,
    errorToast: false,
    successMessage: false,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...INTEGRATION_QUERY_KEY, 'connectors'] }),
  });
}

export function useTestConnector() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: testConnector,
    successMessage: 'Test completed successfully',
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...INTEGRATION_QUERY_KEY, 'connectors'] }),
  });
}

export function useToggleConnector() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => toggleConnector(id, enabled),
    successMessage: 'Updated successfully',
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...INTEGRATION_QUERY_KEY, 'connectors'] }),
  });
}

export function useApiKeys(params: ListParams = {}) {
  return useQuery({
    queryKey: [...INTEGRATION_QUERY_KEY, 'api-keys', params],
    queryFn: () => fetchApiKeys(params),
  });
}

export function useApiKey(id: string) {
  return useQuery({
    queryKey: [...INTEGRATION_QUERY_KEY, 'api-keys', id],
    queryFn: () => fetchApiKey(id),
    enabled: Boolean(id),
  });
}

export function useCreateApiKey() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: (payload: CreateApiKeyPayload) => createApiKey(payload),
    errorToast: false,
    successMessage: false,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...INTEGRATION_QUERY_KEY, 'api-keys'] }),
  });
}

export function useUpdateApiKey() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateApiKeyPayload }) => updateApiKey(id, payload),
    errorToast: false,
    successMessage: false,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...INTEGRATION_QUERY_KEY, 'api-keys'] }),
  });
}

export function useRevokeApiKey() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: revokeApiKey,
    successMessage: 'Revoked successfully',
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...INTEGRATION_QUERY_KEY, 'api-keys'] }),
  });
}

export function useRotateApiKey() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: rotateApiKey,
    successMessage: 'Rotated successfully',
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...INTEGRATION_QUERY_KEY, 'api-keys'] }),
  });
}

export function useRegenerateApiKey() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: regenerateApiKey,
    successMessage: 'Regenerated successfully',
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...INTEGRATION_QUERY_KEY, 'api-keys'] }),
  });
}

export function useApiKeyUsage(id: string, params: ListParams = {}) {
  return useQuery({
    queryKey: [...INTEGRATION_QUERY_KEY, 'api-keys', id, 'usage', params],
    queryFn: () => fetchApiKeyUsage(id, params),
    enabled: Boolean(id),
  });
}

export function useWebhooks(params: ListParams = {}) {
  return useQuery({
    queryKey: [...INTEGRATION_QUERY_KEY, 'webhooks', params],
    queryFn: () => fetchWebhooks(params),
  });
}

export function useWebhook(id: string) {
  return useQuery({
    queryKey: [...INTEGRATION_QUERY_KEY, 'webhooks', id],
    queryFn: () => fetchWebhook(id),
    enabled: Boolean(id),
  });
}

export function useCreateWebhook() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: (payload: CreateWebhookPayload) => createWebhook(payload),
    errorToast: false,
    successMessage: false,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...INTEGRATION_QUERY_KEY, 'webhooks'] }),
  });
}

export function useUpdateWebhook() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateWebhookPayload }) => updateWebhook(id, payload),
    errorToast: false,
    successMessage: false,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...INTEGRATION_QUERY_KEY, 'webhooks'] }),
  });
}

export function useDeleteWebhook() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: deleteWebhook,
    errorToast: false,
    successMessage: false,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...INTEGRATION_QUERY_KEY, 'webhooks'] }),
  });
}

export function useWebhookDeliveries(webhookId: string, params: ListParams = {}) {
  return useQuery({
    queryKey: [...INTEGRATION_QUERY_KEY, 'webhooks', webhookId, 'deliveries', params],
    queryFn: () => fetchWebhookDeliveries(webhookId, params),
    enabled: Boolean(webhookId),
  });
}

export function useTestWebhook() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: ({ id, event }: { id: string; event?: string }) => testWebhook(id, event),
    successMessage: 'Test completed successfully',
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: [...INTEGRATION_QUERY_KEY, 'webhooks', variables.id, 'deliveries'],
      });
    },
  });
}

export function useRetryWebhookDelivery() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: ({ webhookId, deliveryId }: { webhookId: string; deliveryId: string }) =>
      retryWebhookDelivery(webhookId, deliveryId),
    successMessage: 'Retried successfully',
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: [...INTEGRATION_QUERY_KEY, 'webhooks', variables.webhookId, 'deliveries'],
      });
    },
  });
}

export function useImportModules() {
  return useQuery({
    queryKey: [...INTEGRATION_QUERY_KEY, 'import', 'modules'],
    queryFn: fetchImportModules,
    ...MASTER_DATA_QUERY_OPTIONS,
  });
}

export function usePreviewImport() {
  return useAppMutation({
    mutationFn: ({ module, file }: { module: string; file: File }) => previewImport(module, file),
  });
}

export function useExecuteImport() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: ({ module, file }: { module: string; file: File }) => executeImport(module, file),
    successMessage: 'Imported successfully',
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...INTEGRATION_QUERY_KEY, 'import', 'history'] }),
  });
}

export function useImportHistory(params: ListParams = {}) {
  return useQuery({
    queryKey: [...INTEGRATION_QUERY_KEY, 'import', 'history', params],
    queryFn: () => fetchImportHistory(params),
  });
}

export function useImportJob(id: string) {
  return useQuery({
    queryKey: [...INTEGRATION_QUERY_KEY, 'import', 'jobs', id],
    queryFn: () => fetchImportJob(id),
    enabled: Boolean(id),
    ...ON_DEMAND_QUERY_OPTIONS,
  });
}

export function useCreateExportJob() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: (payload: CreateExportPayload) => createExportJob(payload),
    successMessage: 'Export started successfully',
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...INTEGRATION_QUERY_KEY, 'export', 'history'] }),
  });
}

export function useExportHistory(params: ListParams = {}) {
  return useQuery({
    queryKey: [...INTEGRATION_QUERY_KEY, 'export', 'history', params],
    queryFn: () => fetchExportHistory(params),
  });
}

export function useExportJob(id: string) {
  return useQuery({
    queryKey: [...INTEGRATION_QUERY_KEY, 'export', 'jobs', id],
    queryFn: () => fetchExportJob(id),
    enabled: Boolean(id),
    ...ON_DEMAND_QUERY_OPTIONS,
  });
}

export function useDownloadExport() {
  return useAppMutation({
    mutationFn: downloadExport,
    successMessage: 'Downloaded successfully',
  });
}

export function useSchedulerJobs() {
  return useQuery({
    queryKey: [...INTEGRATION_QUERY_KEY, 'scheduler', 'jobs'],
    queryFn: fetchSchedulerJobs,
    ...ON_DEMAND_QUERY_OPTIONS,
  });
}

export function useToggleSchedulerJob() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => toggleSchedulerJob(id, enabled),
    successMessage: 'Updated successfully',
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...INTEGRATION_QUERY_KEY, 'scheduler'] }),
  });
}

export function useSchedulerJobHistory(jobId: string, params: ListParams = {}) {
  return useQuery({
    queryKey: [...INTEGRATION_QUERY_KEY, 'scheduler', 'jobs', jobId, 'history', params],
    queryFn: () => fetchSchedulerJobHistory(jobId, params),
    enabled: Boolean(jobId),
  });
}

export function useSchedulerFailures(params: ListParams = {}) {
  return useQuery({
    queryKey: [...INTEGRATION_QUERY_KEY, 'scheduler', 'failures', params],
    queryFn: () => fetchSchedulerFailures(params),
  });
}

export function useIntegrationLogs(params: LogListParams = {}) {
  return useQuery({
    queryKey: [...INTEGRATION_QUERY_KEY, 'logs', params],
    queryFn: () => fetchIntegrationLogs(params),
  });
}

export function useBackups(params: ListParams = {}) {
  return useQuery({
    queryKey: [...INTEGRATION_QUERY_KEY, 'backups', params],
    queryFn: () => fetchBackups(params),
  });
}

export function useCreateBackup() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: createBackup,
    successMessage: 'Backup started successfully',
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...INTEGRATION_QUERY_KEY, 'backups'] }),
  });
}

export function useVerifyBackup() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: verifyBackup,
    successMessage: 'Verified successfully',
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...INTEGRATION_QUERY_KEY, 'backups'] }),
  });
}
