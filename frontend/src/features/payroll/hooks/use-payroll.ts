import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppMutation } from '@/shared/feedback/use-app-mutation';
import {
  approvePayrollRun,
  assignCompensation,
  bulkApprovePayrollRuns,
  createPayrollRun,
  createSalaryRevision,
  createSalaryStructure,
  deleteSalaryStructure,
  downloadPayslip,
  exportPayrollReport,
  fetchAllowances,
  fetchCompensations,
  fetchDeductions,
  fetchEmployeeCompensation,
  fetchMyCompensation,
  fetchEnterprisePayrollDashboard,
  fetchFinancePayrollDashboard,
  fetchHrPayrollDashboard,
  fetchMyPayslips,
  fetchMySalary,
  fetchPayrollCalendar,
  fetchPayrollExceptions,
  fetchPayrollLineItems,
  fetchPayrollPolicy,
  fetchPayrollReport,
  fetchPayrollRun,
  fetchPayrollRuns,
  fetchPayslips,
  fetchEmployeeSalaryHistory,
  fetchSalaryRevisions,
  fetchSalaryStructures,
  lockPayrollRun,
  processPayrollRun,
  updatePayrollPolicy,
  updateSalaryStructure,
  uploadPayslip,
  type CreateCompensationPayload,
  type CreatePayrollRunPayload,
  type CreateRevisionPayload,
  type CreateSalaryStructurePayload,
  type ListParams,
  type ReportParams,
} from '@/features/payroll/api/payroll.api';

export function useEnterprisePayrollDashboard() {
  return useQuery({
    queryKey: ['payroll', 'dashboard', 'enterprise'],
    queryFn: fetchEnterprisePayrollDashboard,
  });
}

export function useFinancePayrollDashboard() {
  return useQuery({
    queryKey: ['payroll', 'dashboard', 'finance'],
    queryFn: fetchFinancePayrollDashboard,
  });
}

export function useHrPayrollDashboard() {
  return useQuery({
    queryKey: ['payroll', 'dashboard', 'hr'],
    queryFn: fetchHrPayrollDashboard,
  });
}

export function usePayrollPolicy() {
  return useQuery({
    queryKey: ['payroll', 'policy'],
    queryFn: fetchPayrollPolicy,
  });
}

export function useUpdatePayrollPolicy() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: updatePayrollPolicy,
    errorToast: false,
    successMessage: false,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['payroll', 'policy'] }),
  });
}

export function useSalaryStructures(params: ListParams = {}) {
  return useQuery({
    queryKey: ['payroll', 'structures', params],
    queryFn: () => fetchSalaryStructures(params),
  });
}

export function useCreateSalaryStructure() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: (payload: CreateSalaryStructurePayload) => createSalaryStructure(payload),
    errorToast: false,
    successMessage: false,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['payroll', 'structures'] }),
  });
}

export function useUpdateSalaryStructure() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateSalaryStructurePayload> }) =>
      updateSalaryStructure(id, payload),
    errorToast: false,
    successMessage: false,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['payroll', 'structures'] }),
  });
}

export function useDeleteSalaryStructure() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: (id: string) => deleteSalaryStructure(id),
    errorToast: false,
    successMessage: false,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['payroll', 'structures'] }),
  });
}

export function useAllowances(params: ListParams = {}) {
  return useQuery({
    queryKey: ['payroll', 'allowances', params],
    queryFn: () => fetchAllowances(params),
  });
}

export function useDeductions(params: ListParams = {}) {
  return useQuery({
    queryKey: ['payroll', 'deductions', params],
    queryFn: () => fetchDeductions(params),
  });
}

export function usePayrollCalendar(year: number) {
  return useQuery({
    queryKey: ['payroll', 'calendar', year],
    queryFn: () => fetchPayrollCalendar(year),
    enabled: year > 0,
  });
}

export function usePayrollRuns(params: ListParams = {}) {
  return useQuery({
    queryKey: ['payroll', 'runs', params],
    queryFn: () => fetchPayrollRuns(params),
  });
}

export function usePayrollRun(id: string) {
  return useQuery({
    queryKey: ['payroll', 'run', id],
    queryFn: () => fetchPayrollRun(id),
    enabled: Boolean(id),
  });
}

export function useCreatePayrollRun() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: (payload: CreatePayrollRunPayload) => createPayrollRun(payload),
    errorToast: false,
    successMessage: false,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['payroll', 'runs'] }),
  });
}

export function useProcessPayrollRun() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: (id: string) => processPayrollRun(id),
    successMessage: 'Processed successfully',
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['payroll'] }),
  });
}

export function useApprovePayrollRun() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: (id: string) => approvePayrollRun(id),
    successMessage: 'Approved successfully',
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['payroll'] }),
  });
}

export function useLockPayrollRun() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: (id: string) => lockPayrollRun(id),
    successMessage: 'Locked successfully',
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['payroll'] }),
  });
}

export function usePayrollLineItems(payrollId: string, params: ListParams = {}) {
  return useQuery({
    queryKey: ['payroll', 'line-items', payrollId, params],
    queryFn: () => fetchPayrollLineItems(payrollId, params),
    enabled: Boolean(payrollId),
  });
}

export function usePayrollExceptions(params: ListParams & { payrollId?: string } = {}) {
  return useQuery({
    queryKey: ['payroll', 'exceptions', params],
    queryFn: () => fetchPayrollExceptions(params),
  });
}

export function useBulkApprovePayrollRuns() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: (ids: string[]) => bulkApprovePayrollRuns(ids),
    successMessage: 'Approved successfully',
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['payroll', 'runs'] }),
  });
}

export function useCompensations(params: ListParams = {}) {
  return useQuery({
    queryKey: ['payroll', 'compensation', params],
    queryFn: () => fetchCompensations(params),
  });
}

export function useEmployeeCompensation(employeeId: string) {
  return useQuery({
    queryKey: ['payroll', 'compensation', 'employee', employeeId],
    queryFn: () => fetchEmployeeCompensation(employeeId),
    enabled: Boolean(employeeId),
  });
}

export function useMyCompensation() {
  return useQuery({
    queryKey: ['payroll', 'compensation', 'me'],
    queryFn: fetchMyCompensation,
  });
}

export function useAssignCompensation() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: (payload: CreateCompensationPayload) => assignCompensation(payload),
    errorToast: false,
    successMessage: false,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['payroll', 'compensation'] });
      void queryClient.invalidateQueries({
        queryKey: ['payroll', 'compensation', 'employee', variables.employeeId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['payroll', 'salary-history', variables.employeeId],
      });
      void queryClient.invalidateQueries({ queryKey: ['payroll', 'my-salary'] });
    },
  });
}

export function useSalaryRevisions(params: ListParams = {}) {
  return useQuery({
    queryKey: ['payroll', 'revisions', params],
    queryFn: () => fetchSalaryRevisions(params),
  });
}

export function useCreateSalaryRevision() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: (payload: CreateRevisionPayload) => createSalaryRevision(payload),
    errorToast: false,
    successMessage: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['payroll', 'revisions'] });
      void queryClient.invalidateQueries({ queryKey: ['payroll', 'compensation'] });
    },
  });
}

export function usePayslips(params: ListParams = {}) {
  return useQuery({
    queryKey: ['payroll', 'payslips', params],
    queryFn: () => fetchPayslips(params),
  });
}

export function useMyPayslips(params: ListParams = {}) {
  return useQuery({
    queryKey: ['payroll', 'payslips', 'me', params],
    queryFn: () => fetchMyPayslips(params),
  });
}

export function useMySalary() {
  return useQuery({
    queryKey: ['payroll', 'compensation', 'me'],
    queryFn: fetchMySalary,
  });
}

export function useDownloadPayslip() {
  return useAppMutation({
    mutationFn: (id: string) => downloadPayslip(id),
    successMessage: 'Downloaded successfully',
  });
}

export function useUploadPayslip(employeeId: string) {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: (input: {
      file: File;
      periodStart: string;
      periodEnd: string;
      grossSalary?: number;
      netSalary?: number;
    }) => uploadPayslip(employeeId, input.file, input),
    errorToast: false,
    successMessage: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['payroll', 'payslips', { employeeId }] });
    },
  });
}

export function useEmployeeSalaryHistory(employeeId: string) {
  return useQuery({
    queryKey: ['payroll', 'salary-history', employeeId],
    queryFn: () => fetchEmployeeSalaryHistory(employeeId),
    enabled: Boolean(employeeId),
  });
}

export function usePayrollReport(params: ReportParams) {
  return useQuery({
    queryKey: ['payroll', 'report', params],
    queryFn: () => fetchPayrollReport(params),
    enabled: Boolean(params.startDate && params.endDate),
  });
}

export function useExportPayrollReport() {
  return useAppMutation({
    mutationFn: (params: ReportParams) => exportPayrollReport(params),
    successMessage: 'Export started successfully',
  });
}
