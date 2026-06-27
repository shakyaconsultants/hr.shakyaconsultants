import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  return useMutation({
    mutationFn: (payload: CreateConnectorPayload) => createConnector(payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...INTEGRATION_QUERY_KEY, 'connectors'] }),
  });
}

export function useUpdateConnector() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateConnectorPayload }) =>
      updateConnector(id, payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...INTEGRATION_QUERY_KEY, 'connectors'] }),
  });
}

export function useDeleteConnector() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteConnector,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...INTEGRATION_QUERY_KEY, 'connectors'] }),
  });
}

export function useTestConnector() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: testConnector,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...INTEGRATION_QUERY_KEY, 'connectors'] }),
  });
}

export function useToggleConnector() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => toggleConnector(id, enabled),
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
  return useMutation({
    mutationFn: (payload: CreateApiKeyPayload) => createApiKey(payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...INTEGRATION_QUERY_KEY, 'api-keys'] }),
  });
}

export function useUpdateApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateApiKeyPayload }) => updateApiKey(id, payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...INTEGRATION_QUERY_KEY, 'api-keys'] }),
  });
}

export function useRevokeApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: revokeApiKey,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...INTEGRATION_QUERY_KEY, 'api-keys'] }),
  });
}

export function useRotateApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: rotateApiKey,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...INTEGRATION_QUERY_KEY, 'api-keys'] }),
  });
}

export function useRegenerateApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: regenerateApiKey,
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
  return useMutation({
    mutationFn: (payload: CreateWebhookPayload) => createWebhook(payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...INTEGRATION_QUERY_KEY, 'webhooks'] }),
  });
}

export function useUpdateWebhook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateWebhookPayload }) => updateWebhook(id, payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...INTEGRATION_QUERY_KEY, 'webhooks'] }),
  });
}

export function useDeleteWebhook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteWebhook,
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
  return useMutation({
    mutationFn: ({ id, event }: { id: string; event?: string }) => testWebhook(id, event),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: [...INTEGRATION_QUERY_KEY, 'webhooks', variables.id, 'deliveries'],
      });
    },
  });
}

export function useRetryWebhookDelivery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ webhookId, deliveryId }: { webhookId: string; deliveryId: string }) =>
      retryWebhookDelivery(webhookId, deliveryId),
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
  return useMutation({
    mutationFn: ({ module, file }: { module: string; file: File }) => previewImport(module, file),
  });
}

export function useExecuteImport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ module, file }: { module: string; file: File }) => executeImport(module, file),
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
  return useMutation({
    mutationFn: (payload: CreateExportPayload) => createExportJob(payload),
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
  return useMutation({
    mutationFn: downloadExport,
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
  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => toggleSchedulerJob(id, enabled),
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
  return useMutation({
    mutationFn: createBackup,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...INTEGRATION_QUERY_KEY, 'backups'] }),
  });
}

export function useVerifyBackup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: verifyBackup,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...INTEGRATION_QUERY_KEY, 'backups'] }),
  });
}
