import apiClient from '@/shared/api/axios.client';
import type { ApiSuccessResponse, PaginatedResult, PaginationMeta } from '@/shared/types/api.types';

const ATTENDANCE_PREFIX = '/api/v1/attendance';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  status: string;
  shiftId?: string;
  checkIn?: string;
  checkOut?: string;
  workedMinutes?: number;
  overtimeMinutes?: number;
  breakMinutes?: number;
  lateMinutes?: number;
  earlyExitMinutes?: number;
  departmentId?: string;
  branchId?: string;
  isWeekend?: boolean;
  isHoliday?: boolean;
  notes?: string;
  payrollSnapshot?: Record<string, unknown>;
}

export interface AttendanceLog {
  id: string;
  attendanceId: string;
  employeeId: string;
  type: string;
  timestamp: string;
  location?: string;
}

export interface AttendancePolicy {
  gracePeriodMinutes: number;
  lateThresholdMinutes: number;
  earlyExitThresholdMinutes: number;
  overtimeEnabled: boolean;
  weeklyOffDays: number[];
  halfDayThresholdMinutes: number;
  autoMarkAbsentAfterMinutes?: number;
}

export interface ShiftAssignment {
  id: string;
  employeeId: string;
  workShiftId: string;
  effectiveFrom: string;
  effectiveTo?: string;
  status: string;
  workShift?: { id: string; name: string; code: string; startTime: string; endTime: string };
}

export interface AttendanceCorrection {
  id: string;
  attendanceId: string;
  employeeId: string;
  originalStatus: string;
  adjustedStatus: string;
  reason: string;
  status: string;
  approvalRequestId?: string;
  createdAt: string;
}

export interface AttendanceDashboardStats {
  presentToday: number;
  absentToday: number;
  lateToday: number;
  onLeaveToday: number;
  pendingCorrections: number;
  missingPunches: number;
  totalEmployees?: number;
  halfDayToday?: number;
  holidayToday?: number;
}

export interface AttendanceException {
  id: string;
  employeeId: string;
  date: string;
  type: string;
  status: string;
  details?: string;
}

export interface AttendanceReportRow {
  employeeId: string;
  employeeName?: string;
  departmentId?: string;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  halfDays: number;
  leaveDays: number;
  workedMinutes: number;
  overtimeMinutes: number;
}

export interface AttendanceReport {
  period: string;
  scope: string;
  rows: AttendanceReportRow[];
  summary: Record<string, number>;
}

export interface CalendarDayRecord {
  date: string;
  status: string;
  checkIn?: string;
  checkOut?: string;
  employeeId?: string;
}

export interface ListRecordsParams {
  page?: number;
  pageSize?: number;
  employeeId?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  departmentId?: string;
  branchId?: string;
}

export interface ReportParams {
  period: 'daily' | 'weekly' | 'monthly';
  scope: 'employee' | 'department' | 'branch' | 'company';
  startDate: string;
  endDate: string;
  employeeId?: string;
  departmentId?: string;
  branchId?: string;
}

export interface PunchPayload {
  type: 'check_in' | 'check_out' | 'break_start' | 'break_end';
  location?: string;
  notes?: string;
}

export interface CreateCorrectionPayload {
  attendanceId: string;
  adjustedStatus: string;
  reason: string;
  submit?: boolean;
}

export interface CreateShiftAssignmentPayload {
  employeeId: string;
  workShiftId: string;
  effectiveFrom: string;
  effectiveTo?: string;
}

export interface OverrideRecordPayload {
  attendanceId: string;
  status: string;
  checkIn?: string;
  checkOut?: string;
  reason: string;
}

export interface MonthlyProcessingPayload {
  year: number;
  month: number;
  departmentId?: string;
}

async function unwrap<T>(response: { data: ApiSuccessResponse<T> }): Promise<T> {
  return response.data.data;
}

async function unwrapPaginated<T>(response: {
  data: ApiSuccessResponse<T[]> | ApiSuccessResponse<PaginatedResult<T>>;
}): Promise<PaginatedResult<T>> {
  const data = response.data?.data as any;
  if (data && 'items' in data && 'pagination' in data) {
    return data as PaginatedResult<T>;
  }
  const items = Array.isArray(data) ? data : (data?.items ?? []);
  const pagination = (response.data as any)?.pagination ?? data?.pagination ?? { page: 1, pageSize: 20, total: items.length, totalPages: 1 };
  return { items, pagination };
}

export async function fetchEnterpriseDashboard(): Promise<AttendanceDashboardStats> {
  const response = await apiClient.get<ApiSuccessResponse<AttendanceDashboardStats>>(`${ATTENDANCE_PREFIX}/dashboard/enterprise`);
  return unwrap(response);
}

export async function fetchHrDashboard(): Promise<AttendanceDashboardStats> {
  const response = await apiClient.get<ApiSuccessResponse<AttendanceDashboardStats>>(`${ATTENDANCE_PREFIX}/dashboard/hr`);
  return unwrap(response);
}

export async function fetchManagerDashboard(): Promise<AttendanceDashboardStats> {
  const response = await apiClient.get<ApiSuccessResponse<AttendanceDashboardStats>>(`${ATTENDANCE_PREFIX}/dashboard/manager`);
  return unwrap(response);
}

export async function fetchAttendancePolicy(): Promise<AttendancePolicy> {
  const response = await apiClient.get<ApiSuccessResponse<AttendancePolicy>>(`${ATTENDANCE_PREFIX}/policies`);
  return unwrap(response);
}

export async function updateAttendancePolicy(payload: Partial<AttendancePolicy>): Promise<AttendancePolicy> {
  const response = await apiClient.patch<ApiSuccessResponse<AttendancePolicy>>(`${ATTENDANCE_PREFIX}/policies`, payload);
  return unwrap(response);
}

export async function fetchShiftAssignments(params: { employeeId?: string; page?: number; pageSize?: number } = {}): Promise<PaginatedResult<ShiftAssignment>> {
  const response = await apiClient.get<ApiSuccessResponse<ShiftAssignment[]> & { pagination?: PaginationMeta }>(
    `${ATTENDANCE_PREFIX}/shift-assignments`,
    { params },
  );
  return unwrapPaginated(response);
}

export async function createShiftAssignment(payload: CreateShiftAssignmentPayload): Promise<ShiftAssignment> {
  const response = await apiClient.post<ApiSuccessResponse<ShiftAssignment>>(`${ATTENDANCE_PREFIX}/shift-assignments`, payload);
  return unwrap(response);
}

export async function updateShiftAssignment(id: string, payload: Partial<CreateShiftAssignmentPayload>): Promise<ShiftAssignment> {
  const response = await apiClient.patch<ApiSuccessResponse<ShiftAssignment>>(`${ATTENDANCE_PREFIX}/shift-assignments/${id}`, payload);
  return unwrap(response);
}

export async function deleteShiftAssignment(id: string): Promise<void> {
  await apiClient.delete(`${ATTENDANCE_PREFIX}/shift-assignments/${id}`);
}

export async function punch(payload: PunchPayload): Promise<{ record: AttendanceRecord; log: AttendanceLog }> {
  const response = await apiClient.post<ApiSuccessResponse<{ record: AttendanceRecord; log: AttendanceLog }>>(
    `${ATTENDANCE_PREFIX}/punch`,
    payload,
  );
  return unwrap(response);
}

export async function fetchAttendanceRecords(params: ListRecordsParams = {}): Promise<PaginatedResult<AttendanceRecord>> {
  const response = await apiClient.get<ApiSuccessResponse<AttendanceRecord[]> & { pagination?: PaginationMeta }>(
    `${ATTENDANCE_PREFIX}/records`,
    { params },
  );
  return unwrapPaginated(response);
}

export async function fetchTodayAttendance(employeeId?: string): Promise<AttendanceRecord | null> {
  const response = await apiClient.get<ApiSuccessResponse<AttendanceRecord | null>>(`${ATTENDANCE_PREFIX}/records/today`, {
    params: employeeId ? { employeeId } : undefined,
  });
  return unwrap(response);
}

export async function fetchAttendanceCalendar(startDate: string, endDate: string, employeeId?: string): Promise<CalendarDayRecord[]> {
  const response = await apiClient.get<ApiSuccessResponse<CalendarDayRecord[]>>(`${ATTENDANCE_PREFIX}/records/calendar`, {
    params: { startDate, endDate, employeeId },
  });
  return unwrap(response);
}

export async function fetchAttendanceRecord(id: string): Promise<AttendanceRecord> {
  const response = await apiClient.get<ApiSuccessResponse<AttendanceRecord>>(`${ATTENDANCE_PREFIX}/records/${id}`);
  return unwrap(response);
}

export async function fetchCorrections(params: { page?: number; pageSize?: number; status?: string; employeeId?: string } = {}): Promise<PaginatedResult<AttendanceCorrection>> {
  const response = await apiClient.get<ApiSuccessResponse<AttendanceCorrection[]> & { pagination?: PaginationMeta }>(
    `${ATTENDANCE_PREFIX}/corrections`,
    { params },
  );
  return unwrapPaginated(response);
}

export async function createCorrection(payload: CreateCorrectionPayload): Promise<AttendanceCorrection> {
  const response = await apiClient.post<ApiSuccessResponse<AttendanceCorrection>>(`${ATTENDANCE_PREFIX}/corrections`, payload);
  return unwrap(response);
}

export async function submitCorrection(id: string): Promise<AttendanceCorrection> {
  const response = await apiClient.post<ApiSuccessResponse<AttendanceCorrection>>(`${ATTENDANCE_PREFIX}/corrections/${id}/submit`);
  return unwrap(response);
}

export async function fetchTeamAttendance(params: ListRecordsParams = {}): Promise<PaginatedResult<AttendanceRecord>> {
  const response = await apiClient.get<ApiSuccessResponse<AttendanceRecord[]> & { pagination?: PaginationMeta }>(
    `${ATTENDANCE_PREFIX}/team`,
    { params },
  );
  return unwrapPaginated(response);
}

export async function fetchAttendanceExceptions(params: { page?: number; pageSize?: number; type?: string } = {}): Promise<PaginatedResult<AttendanceException>> {
  const response = await apiClient.get<ApiSuccessResponse<AttendanceException[]> & { pagination?: PaginationMeta }>(
    `${ATTENDANCE_PREFIX}/exceptions`,
    { params },
  );
  return unwrapPaginated(response);
}

export async function fetchAttendanceReport(params: ReportParams): Promise<AttendanceReport> {
  const response = await apiClient.get<ApiSuccessResponse<AttendanceReport>>(`${ATTENDANCE_PREFIX}/reports`, { params });
  return unwrap(response);
}

export async function exportAttendanceReport(params: ReportParams): Promise<Blob> {
  const response = await apiClient.get(`${ATTENDANCE_PREFIX}/reports/export`, {
    params,
    responseType: 'blob',
  });
  return response.data as Blob;
}

export async function processMonthlyAttendance(payload: MonthlyProcessingPayload): Promise<{ processed: number; month: string }> {
  const response = await apiClient.post<ApiSuccessResponse<{ processed: number; month: string }>>(
    `${ATTENDANCE_PREFIX}/processing/monthly`,
    payload,
  );
  return unwrap(response);
}

export async function overrideAttendanceRecord(payload: OverrideRecordPayload): Promise<AttendanceRecord> {
  const response = await apiClient.post<ApiSuccessResponse<AttendanceRecord>>(`${ATTENDANCE_PREFIX}/overrides`, payload);
  return unwrap(response);
}
