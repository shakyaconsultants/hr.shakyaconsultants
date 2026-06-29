import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppMutation } from '@/shared/feedback/use-app-mutation';
import {
  assignLead,
  completeFollowUp,
  createActivity,
  createCallLog,
  createFollowUp,
  createLead,
  createLeadSource,
  createPipeline,
  createSalesTarget,
  createSalesTeam,
  createTerritory,
  deleteLead,
  deleteLeadSource,
  deletePipeline,
  deleteSalesTarget,
  deleteSalesTeam,
  deleteTerritory,
  exportLeads,
  exportSalesReport,
  fetchActivities,
  fetchCallLogs,
  fetchConversionAnalytics,
  fetchDeals,
  fetchEnterpriseSalesDashboard,
  fetchExecutiveSalesDashboard,
  fetchFollowUps,
  fetchLead,
  fetchLeadKanban,
  fetchLeadSources,
  fetchLeadTimeline,
  fetchLeads,
  fetchManagerSalesDashboard,
  fetchMyLeads,
  fetchPipeline,
  fetchPipelines,
  fetchRevenueAnalytics,
  fetchSalesPolicy,
  fetchSalesReport,
  fetchSalesTargets,
  fetchSalesTeams,
  fetchTeamLeads,
  fetchTerritories,
  importLeads,
  moveLeadStage,
  updateLead,
  updateLeadSource,
  updatePipeline,
  updateSalesPolicy,
  updateSalesTarget,
  updateSalesTeam,
  updateTerritory,
  type AssignLeadPayload,
  type CreateActivityPayload,
  type CreateCallLogPayload,
  type CreateFollowUpPayload,
  type CreateLeadPayload,
  type CreateLeadSourcePayload,
  type CreatePipelinePayload,
  type CreateSalesTargetPayload,
  type CreateSalesTeamPayload,
  type CreateTerritoryPayload,
  type ListParams,
  type MoveStagePayload,
  type ReportParams,
  type UpdateLeadPayload,
} from '@/features/sales/api/sales.api';

export function useEnterpriseSalesDashboard() {
  return useQuery({
    queryKey: ['sales', 'dashboard', 'enterprise'],
    queryFn: fetchEnterpriseSalesDashboard,
  });
}

export function useManagerSalesDashboard() {
  return useQuery({
    queryKey: ['sales', 'dashboard', 'manager'],
    queryFn: fetchManagerSalesDashboard,
  });
}

export function useExecutiveSalesDashboard() {
  return useQuery({
    queryKey: ['sales', 'dashboard', 'executive'],
    queryFn: fetchExecutiveSalesDashboard,
  });
}

export function useSalesPolicy() {
  return useQuery({
    queryKey: ['sales', 'policy'],
    queryFn: fetchSalesPolicy,
  });
}

export function useUpdateSalesPolicy() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: updateSalesPolicy,
    errorToast: false,
    successMessage: false,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['sales', 'policy'] }),
  });
}

export function usePipelines(params: ListParams = {}) {
  return useQuery({
    queryKey: ['sales', 'pipelines', params],
    queryFn: () => fetchPipelines(params),
  });
}

export function usePipeline(id: string) {
  return useQuery({
    queryKey: ['sales', 'pipeline', id],
    queryFn: () => fetchPipeline(id),
    enabled: Boolean(id),
  });
}

export function useCreatePipeline() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: (payload: CreatePipelinePayload) => createPipeline(payload),
    errorToast: false,
    successMessage: false,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['sales', 'pipelines'] }),
  });
}

export function useUpdatePipeline() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreatePipelinePayload> }) => updatePipeline(id, payload),
    errorToast: false,
    successMessage: false,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['sales', 'pipelines'] }),
  });
}

export function useDeletePipeline() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: (id: string) => deletePipeline(id),
    errorToast: false,
    successMessage: false,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['sales', 'pipelines'] }),
  });
}

export function useLeadSources(params: ListParams = {}) {
  return useQuery({
    queryKey: ['sales', 'lead-sources', params],
    queryFn: () => fetchLeadSources(params),
  });
}

export function useCreateLeadSource() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: (payload: CreateLeadSourcePayload) => createLeadSource(payload),
    errorToast: false,
    successMessage: false,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['sales', 'lead-sources'] }),
  });
}

export function useUpdateLeadSource() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateLeadSourcePayload> }) => updateLeadSource(id, payload),
    errorToast: false,
    successMessage: false,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['sales', 'lead-sources'] }),
  });
}

export function useDeleteLeadSource() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: (id: string) => deleteLeadSource(id),
    errorToast: false,
    successMessage: false,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['sales', 'lead-sources'] }),
  });
}

export function useSalesTeams(params: ListParams = {}) {
  return useQuery({
    queryKey: ['sales', 'teams', params],
    queryFn: () => fetchSalesTeams(params),
  });
}

export function useCreateSalesTeam() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: (payload: CreateSalesTeamPayload) => createSalesTeam(payload),
    errorToast: false,
    successMessage: false,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['sales', 'teams'] }),
  });
}

export function useUpdateSalesTeam() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateSalesTeamPayload> }) => updateSalesTeam(id, payload),
    errorToast: false,
    successMessage: false,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['sales', 'teams'] }),
  });
}

export function useDeleteSalesTeam() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: (id: string) => deleteSalesTeam(id),
    errorToast: false,
    successMessage: false,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['sales', 'teams'] }),
  });
}

export function useTerritories(params: ListParams = {}) {
  return useQuery({
    queryKey: ['sales', 'territories', params],
    queryFn: () => fetchTerritories(params),
  });
}

export function useCreateTerritory() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: (payload: CreateTerritoryPayload) => createTerritory(payload),
    errorToast: false,
    successMessage: false,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['sales', 'territories'] }),
  });
}

export function useUpdateTerritory() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateTerritoryPayload> }) => updateTerritory(id, payload),
    errorToast: false,
    successMessage: false,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['sales', 'territories'] }),
  });
}

export function useDeleteTerritory() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: (id: string) => deleteTerritory(id),
    errorToast: false,
    successMessage: false,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['sales', 'territories'] }),
  });
}

export function useSalesTargets(params: ListParams = {}) {
  return useQuery({
    queryKey: ['sales', 'targets', params],
    queryFn: () => fetchSalesTargets(params),
  });
}

export function useCreateSalesTarget() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: (payload: CreateSalesTargetPayload) => createSalesTarget(payload),
    errorToast: false,
    successMessage: false,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['sales', 'targets'] }),
  });
}

export function useUpdateSalesTarget() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateSalesTargetPayload> }) => updateSalesTarget(id, payload),
    errorToast: false,
    successMessage: false,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['sales', 'targets'] }),
  });
}

export function useDeleteSalesTarget() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: (id: string) => deleteSalesTarget(id),
    errorToast: false,
    successMessage: false,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['sales', 'targets'] }),
  });
}

export function useLeads(params: ListParams = {}) {
  return useQuery({
    queryKey: ['sales', 'leads', params],
    queryFn: () => fetchLeads(params),
  });
}

export function useMyLeads(params: ListParams = {}) {
  return useQuery({
    queryKey: ['sales', 'leads', 'me', params],
    queryFn: () => fetchMyLeads(params),
  });
}

export function useTeamLeads(params: ListParams = {}) {
  return useQuery({
    queryKey: ['sales', 'leads', 'team', params],
    queryFn: () => fetchTeamLeads(params),
  });
}

export function useLead(id: string) {
  return useQuery({
    queryKey: ['sales', 'lead', id],
    queryFn: () => fetchLead(id),
    enabled: Boolean(id),
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: (payload: CreateLeadPayload) => createLead(payload),
    errorToast: false,
    successMessage: false,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['sales', 'leads'] }),
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateLeadPayload }) => updateLead(id, payload),
    errorToast: false,
    successMessage: false,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['sales', 'leads'] });
      void queryClient.invalidateQueries({ queryKey: ['sales', 'lead', variables.id] });
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: (id: string) => deleteLead(id),
    errorToast: false,
    successMessage: false,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['sales', 'leads'] }),
  });
}

export function useAssignLead() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AssignLeadPayload }) => assignLead(id, payload),
    errorToast: false,
    successMessage: false,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['sales', 'leads'] });
      void queryClient.invalidateQueries({ queryKey: ['sales', 'lead', variables.id] });
    },
  });
}

export function useMoveLeadStage() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: ({ id, payload }: { id: string; payload: MoveStagePayload }) => moveLeadStage(id, payload),
    successMessage: 'Updated successfully',
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['sales'] });
      void queryClient.invalidateQueries({ queryKey: ['sales', 'lead', variables.id] });
    },
  });
}

export function useLeadTimeline(id: string) {
  return useQuery({
    queryKey: ['sales', 'lead', id, 'timeline'],
    queryFn: () => fetchLeadTimeline(id),
    enabled: Boolean(id),
  });
}

export function useLeadKanban(pipelineId?: string) {
  return useQuery({
    queryKey: ['sales', 'kanban', pipelineId],
    queryFn: () => fetchLeadKanban(pipelineId),
  });
}

export function useImportLeads() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: (file: File) => importLeads(file),
    successMessage: 'Imported successfully',
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['sales', 'leads'] }),
  });
}

export function useExportLeads() {
  return useAppMutation({
    mutationFn: (params: ListParams) => exportLeads(params),
    successMessage: 'Export started successfully',
  });
}

export function useActivities(params: ListParams & { leadId?: string } = {}) {
  return useQuery({
    queryKey: ['sales', 'activities', params],
    queryFn: () => fetchActivities(params),
  });
}

export function useCreateActivity() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: (payload: CreateActivityPayload) => createActivity(payload),
    errorToast: false,
    successMessage: false,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['sales', 'activities'] });
      void queryClient.invalidateQueries({ queryKey: ['sales', 'lead', variables.leadId, 'timeline'] });
    },
  });
}

export function useCallLogs(params: ListParams & { leadId?: string } = {}) {
  return useQuery({
    queryKey: ['sales', 'call-logs', params],
    queryFn: () => fetchCallLogs(params),
  });
}

export function useCreateCallLog() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: (payload: CreateCallLogPayload) => createCallLog(payload),
    errorToast: false,
    successMessage: false,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['sales', 'call-logs'] }),
  });
}

export function useFollowUps(params: ListParams & { leadId?: string } = {}) {
  return useQuery({
    queryKey: ['sales', 'follow-ups', params],
    queryFn: () => fetchFollowUps(params),
  });
}

export function useCreateFollowUp() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: (payload: CreateFollowUpPayload) => createFollowUp(payload),
    errorToast: false,
    successMessage: false,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['sales', 'follow-ups'] }),
  });
}

export function useCompleteFollowUp() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: (id: string) => completeFollowUp(id),
    successMessage: 'Completed successfully',
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['sales', 'follow-ups'] }),
  });
}

export function useDeals(params: ListParams = {}) {
  return useQuery({
    queryKey: ['sales', 'deals', params],
    queryFn: () => fetchDeals(params),
  });
}

export function useSalesReport(params: ReportParams) {
  return useQuery({
    queryKey: ['sales', 'report', params],
    queryFn: () => fetchSalesReport(params),
    enabled: Boolean(params.startDate && params.endDate),
  });
}

export function useExportSalesReport() {
  return useAppMutation({
    mutationFn: (params: ReportParams) => exportSalesReport(params),
    successMessage: 'Export started successfully',
  });
}

export function useConversionAnalytics(params: { startDate: string; endDate: string; pipelineId?: string }) {
  return useQuery({
    queryKey: ['sales', 'analytics', 'conversion', params],
    queryFn: () => fetchConversionAnalytics(params),
    enabled: Boolean(params.startDate && params.endDate),
  });
}

export function useRevenueAnalytics(params: { startDate: string; endDate: string; teamId?: string }) {
  return useQuery({
    queryKey: ['sales', 'analytics', 'revenue', params],
    queryFn: () => fetchRevenueAnalytics(params),
    enabled: Boolean(params.startDate && params.endDate),
  });
}
