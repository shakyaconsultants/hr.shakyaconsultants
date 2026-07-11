import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppMutation } from '@/shared/feedback/use-app-mutation';
import {
  createCorrection,
  createShiftAssignment,
  deleteShiftAssignment,
  exportAttendanceReport,
  fetchAttendanceCalendar,
  fetchAttendanceCalendarSummary,
  fetchAttendanceExceptions,
  fetchAttendancePolicy,
  fetchAttendanceRecord,
  fetchAttendanceReport,
  fetchAttendanceRecords,
  fetchDailyAttendanceRegister,
  fetchCorrections,
  fetchEnterpriseDashboard,
  fetchHrDashboard,
  fetchManagerDashboard,
  fetchShiftAssignments,
  fetchTeamAttendance,
  fetchTodayAttendance,
  overrideAttendanceRecord,
  processMonthlyAttendance,
  punch,
  submitCorrection,
  updateAttendancePolicy,
  updateShiftAssignment,
  type CreateCorrectionPayload,
  type CreateShiftAssignmentPayload,
  type DailyRegisterParams,
  type ListRecordsParams,
  type MonthlyProcessingPayload,
  type OverrideRecordPayload,
  type PunchPayload,
  type ReportParams,
} from '@/features/attendance/api/attendance.api';

export function useEnterpriseAttendanceDashboard() {
  return useQuery({
    queryKey: ['attendance', 'dashboard', 'enterprise'],
    queryFn: fetchEnterpriseDashboard,
  });
}

export function useHrAttendanceDashboard() {
  return useQuery({
    queryKey: ['attendance', 'dashboard', 'hr'],
    queryFn: fetchHrDashboard,
  });
}

export function useManagerAttendanceDashboard() {
  return useQuery({
    queryKey: ['attendance', 'dashboard', 'manager'],
    queryFn: fetchManagerDashboard,
  });
}

export function useAttendancePolicy() {
  return useQuery({
    queryKey: ['attendance', 'policy'],
    queryFn: fetchAttendancePolicy,
  });
}

export function useUpdateAttendancePolicy() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: updateAttendancePolicy,
    errorToast: false,
    successMessage: false,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['attendance', 'policy'] }),
  });
}

export function useShiftAssignments(
  params: { employeeId?: string; page?: number; pageSize?: number } = {},
) {
  return useQuery({
    queryKey: ['attendance', 'shift-assignments', params],
    queryFn: () => fetchShiftAssignments(params),
  });
}

export function useCreateShiftAssignment() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: (payload: CreateShiftAssignmentPayload) => createShiftAssignment(payload),
    errorToast: false,
    successMessage: false,
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ['attendance', 'shift-assignments'] }),
  });
}

export function useUpdateShiftAssignment() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateShiftAssignmentPayload> }) =>
      updateShiftAssignment(id, payload),
    errorToast: false,
    successMessage: false,
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ['attendance', 'shift-assignments'] }),
  });
}

export function useDeleteShiftAssignment() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: (id: string) => deleteShiftAssignment(id),
    errorToast: false,
    successMessage: false,
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ['attendance', 'shift-assignments'] }),
  });
}

export function usePunch() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: (payload: PunchPayload) => punch(payload),
    successMessage: 'Punched successfully',
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}

export function useAttendanceRecords(params: ListRecordsParams = {}) {
  return useQuery({
    queryKey: ['attendance', 'records', params],
    queryFn: () => fetchAttendanceRecords(params),
    enabled: Boolean(params.employeeId),
  });
}

export function useDailyAttendanceRegister(params: DailyRegisterParams) {
  return useQuery({
    queryKey: ['attendance', 'daily-register', params],
    queryFn: () => fetchDailyAttendanceRegister(params),
    enabled: Boolean(params.date),
  });
}

export function useTodayAttendance(employeeId?: string) {
  return useQuery({
    queryKey: ['attendance', 'today', employeeId],
    queryFn: () => fetchTodayAttendance(employeeId),
  });
}

export function useAttendanceCalendar(startDate: string, endDate: string, employeeId?: string) {
  return useQuery({
    queryKey: ['attendance', 'calendar', startDate, endDate, employeeId],
    queryFn: () => fetchAttendanceCalendar(startDate, endDate, employeeId),
    enabled: Boolean(startDate && endDate && employeeId),
  });
}

export function useAttendanceCalendarSummary(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['attendance', 'calendar-summary', startDate, endDate],
    queryFn: () => fetchAttendanceCalendarSummary(startDate, endDate),
    enabled: Boolean(startDate && endDate),
  });
}

export function useAttendanceRecord(id: string) {
  return useQuery({
    queryKey: ['attendance', 'record', id],
    queryFn: () => fetchAttendanceRecord(id),
    enabled: Boolean(id),
  });
}

export function useCorrections(
  params: { page?: number; pageSize?: number; status?: string; employeeId?: string } = {},
) {
  return useQuery({
    queryKey: ['attendance', 'corrections', params],
    queryFn: () => fetchCorrections(params),
  });
}

export function useCreateCorrection() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: (payload: CreateCorrectionPayload) => createCorrection(payload),
    errorToast: false,
    successMessage: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['attendance'] });
      void queryClient.invalidateQueries({ queryKey: ['approval'] });
    },
  });
}

export function useSubmitCorrection() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: (id: string) => submitCorrection(id),
    successMessage: 'Submitted successfully',
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['attendance'] });
      void queryClient.invalidateQueries({ queryKey: ['approval'] });
    },
  });
}

export function useTeamAttendance(params: ListRecordsParams = {}) {
  return useQuery({
    queryKey: ['attendance', 'team', params],
    queryFn: () => fetchTeamAttendance(params),
  });
}

export function useAttendanceExceptions(
  params: { page?: number; pageSize?: number; type?: string } = {},
) {
  return useQuery({
    queryKey: ['attendance', 'exceptions', params],
    queryFn: () => fetchAttendanceExceptions(params),
  });
}

export function useAttendanceReport(params: ReportParams) {
  return useQuery({
    queryKey: ['attendance', 'report', params],
    queryFn: () => fetchAttendanceReport(params),
    enabled: Boolean(params.startDate && params.endDate),
  });
}

export function useExportAttendanceReport() {
  return useAppMutation({
    mutationFn: (params: ReportParams) => exportAttendanceReport(params),
    successMessage: 'Export started successfully',
  });
}

export function useProcessMonthlyAttendance() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: (payload: MonthlyProcessingPayload) => processMonthlyAttendance(payload),
    successMessage: 'Processed successfully',
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['attendance'] }),
  });
}

export function useOverrideAttendanceRecord() {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: (payload: OverrideRecordPayload) => overrideAttendanceRecord(payload),
    successMessage: 'Saved successfully',
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['attendance'] }),
  });
}
