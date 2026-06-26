import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  exportReport,
  fetchDashboardConfig,
  fetchDomainAnalytics,
  fetchExecutiveDashboard,
  fetchReportDefinition,
  fetchReportDefinitions,
  fetchReportRun,
  fetchReportRuns,
  fetchRoleDashboard,
  runReport,
  saveDashboardConfig,
  scheduleReport,
  type DashboardConfig,
  type ExportReportParams,
  type ListDefinitionsParams,
  type ListRunsParams,
  type ReportFilterParams,
  type RunReportPayload,
  type ScheduleReportPayload,
} from '@/features/reports/api/reports.api';

export function useReportDefinitions(params: ListDefinitionsParams = {}) {
  return useQuery({
    queryKey: ['reports', 'definitions', params],
    queryFn: () => fetchReportDefinitions(params),
  });
}

export function useReportDefinition(code: string) {
  return useQuery({
    queryKey: ['reports', 'definition', code],
    queryFn: () => fetchReportDefinition(code),
    enabled: Boolean(code),
  });
}

export function useRunReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RunReportPayload) => runReport(payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['reports', 'runs'] }),
  });
}

export function useReportRuns(params: ListRunsParams = {}) {
  return useQuery({
    queryKey: ['reports', 'runs', params],
    queryFn: () => fetchReportRuns(params),
  });
}

export function useReportRun(id: string) {
  return useQuery({
    queryKey: ['reports', 'run', id],
    queryFn: () => fetchReportRun(id),
    enabled: Boolean(id),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'pending' || status === 'running' ? 2000 : false;
    },
  });
}

export function useScheduleReport() {
  return useMutation({
    mutationFn: (payload: ScheduleReportPayload) => scheduleReport(payload),
  });
}

export function useExecutiveDashboard(params: ReportFilterParams = {}) {
  return useQuery({
    queryKey: ['reports', 'dashboard', 'executive', params],
    queryFn: () => fetchExecutiveDashboard(params),
  });
}

export function useRoleDashboard(role: string, params: ReportFilterParams = {}) {
  return useQuery({
    queryKey: ['reports', 'dashboard', role, params],
    queryFn: () => fetchRoleDashboard(role, params),
    enabled: Boolean(role),
  });
}

export function useDashboardConfig(role?: string) {
  return useQuery({
    queryKey: ['reports', 'dashboard', 'config', role],
    queryFn: () => fetchDashboardConfig(role),
  });
}

export function useSaveDashboardConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: DashboardConfig) => saveDashboardConfig(payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['reports', 'dashboard', 'config', variables.role] });
      void queryClient.invalidateQueries({ queryKey: ['reports', 'dashboard', variables.role] });
      void queryClient.invalidateQueries({ queryKey: ['reports', 'dashboard', 'executive'] });
    },
  });
}

export function useDomainAnalytics(domain: string, params: ReportFilterParams = {}) {
  return useQuery({
    queryKey: ['reports', 'analytics', domain, params],
    queryFn: () => fetchDomainAnalytics(domain, params),
    enabled: Boolean(domain),
  });
}

export function useExportReport() {
  return useMutation({
    mutationFn: (params: ExportReportParams) => exportReport(params),
  });
}

export function useReportResult(domain: string, type: string, params: ReportFilterParams & Record<string, unknown> = {}) {
  return useQuery({
    queryKey: ['reports', 'result', domain, type, params],
    queryFn: () =>
      runReport({
        domain,
        type,
        parameters: params,
        format: 'json',
      }),
    enabled: Boolean(domain && type),
  });
}
