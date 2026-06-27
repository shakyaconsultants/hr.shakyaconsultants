import apiClient from '@/shared/api/axios.client';
import type { ApiSuccessResponse, PaginatedResult, PaginationMeta } from '@/shared/types/api.types';

const PAYROLL_PREFIX = '/api/v1/payroll';

export interface SalaryComponent {
  name: string;
  code: string;
  type: 'fixed' | 'percentage';
  amount: number;
  isTaxable: boolean;
}

export interface SalaryStructure {
  id: string;
  name: string;
  code: string;
  baseSalary: number;
  currency: string;
  components: SalaryComponent[];
  status: string;
}

export interface Allowance {
  id: string;
  name: string;
  code: string;
  amount: number;
  type: string;
  isTaxable: boolean;
  status: string;
}

export interface Deduction {
  id: string;
  name: string;
  code: string;
  amount: number;
  type: string;
  isStatutory: boolean;
  status: string;
}

export interface PayrollPolicy {
  payCycle: 'monthly' | 'biweekly' | 'weekly';
  payDay: number;
  currency: string;
  roundingMode: 'nearest' | 'up' | 'down';
  proRataEnabled: boolean;
  taxCalculationEnabled: boolean;
  statutoryDeductionsEnabled: boolean;
}

export interface PayrollCalendarEntry {
  id: string;
  year: number;
  month: number;
  periodStart: string;
  periodEnd: string;
  payDate: string;
  status: string;
}

export interface PayrollRun {
  id: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  processedAt?: string;
  finalizedAt?: string;
  processedBy?: string;
  totalEmployees?: number;
  totalGross?: number;
  totalNet?: number;
}

export interface PayrollLineItem {
  id: string;
  payrollId: string;
  employeeId: string;
  employeeName?: string;
  grossSalary: number;
  netSalary: number;
  totalDeductions: number;
  totalAllowances: number;
  status: string;
  exceptions?: string[];
}

export interface PayrollException {
  id: string;
  payrollId: string;
  employeeId: string;
  type: string;
  status: string;
  details?: string;
}

export interface CompensationAssignment {
  id: string;
  employeeId: string;
  salaryStructureId: string;
  salaryStructure?: SalaryStructure;
  baseSalary: number;
  currency: string;
  effectiveFrom: string;
  effectiveTo?: string;
  isLocked: boolean;
  status: string;
}

export interface SalaryRevision {
  id: string;
  employeeId: string;
  previousSalary: number;
  newSalary: number;
  effectiveFrom: string;
  reason: string;
  approvedBy?: string;
  approvedAt?: string;
  status: string;
}

export interface Payslip {
  id: string;
  payrollId: string;
  employeeId: string;
  grossSalary: number;
  netSalary: number;
  totalDeductions: number;
  totalAllowances: number;
  currency: string;
  pdfUrl?: string;
  status: string;
  periodStart?: string;
  periodEnd?: string;
}

export interface PayrollDashboardStats {
  activeStructures: number;
  pendingRuns: number;
  finalizedRuns: number;
  totalEmployeesOnPayroll: number;
  exceptionsCount: number;
  lastProcessedAt?: string;
}

export interface FinanceDashboardStats {
  draftRuns: number;
  processingRuns: number;
  pendingApproval: number;
  lockedRuns: number;
  exceptionsCount: number;
  totalNetThisMonth?: number;
}

export interface HrPayrollStats {
  assignedEmployees: number;
  pendingRevisions: number;
  lockedCompensations: number;
  unassignedEmployees: number;
}

export interface MySalarySummary {
  baseSalary: number;
  currency: string;
  structureName?: string;
  effectiveFrom?: string;
  isLocked: boolean;
}

export interface PayrollReportRow {
  employeeId: string;
  employeeName?: string;
  departmentId?: string;
  grossSalary: number;
  netSalary: number;
  totalDeductions: number;
  totalAllowances: number;
}

export interface PayrollReport {
  period: string;
  scope: string;
  rows: PayrollReportRow[];
  summary: Record<string, number>;
}

export interface ListParams {
  page?: number;
  pageSize?: number;
  status?: string;
  employeeId?: string;
}

export interface ReportParams {
  period: 'monthly' | 'quarterly' | 'yearly';
  scope: 'employee' | 'department' | 'branch' | 'company';
  startDate: string;
  endDate: string;
  employeeId?: string;
  departmentId?: string;
  branchId?: string;
}

export interface CreateSalaryStructurePayload {
  name: string;
  code: string;
  baseSalary: number;
  currency?: string;
  components?: SalaryComponent[];
}

export interface CreateCompensationPayload {
  employeeId: string;
  salaryStructureId: string;
  baseSalary: number;
  effectiveFrom: string;
}

export interface CreateRevisionPayload {
  employeeId: string;
  newSalary: number;
  effectiveFrom: string;
  reason: string;
}

export interface CreatePayrollRunPayload {
  periodStart: string;
  periodEnd: string;
}

async function unwrap<T>(response: { data: ApiSuccessResponse<T> }): Promise<T> {
  return response.data.data;
}

async function unwrapPaginated<T>(response: {
  data: ApiSuccessResponse<T[]> & { pagination?: PaginationMeta };
}): Promise<PaginatedResult<T>> {
  const { data } = response;
  return {
    items: data.data,
    pagination: data.pagination ?? { page: 1, pageSize: 20, total: data.data.length, totalPages: 1 },
  };
}

export async function fetchEnterprisePayrollDashboard(): Promise<PayrollDashboardStats> {
  const response = await apiClient.get<ApiSuccessResponse<PayrollDashboardStats>>(`${PAYROLL_PREFIX}/dashboard/enterprise`);
  return unwrap(response);
}

export async function fetchFinancePayrollDashboard(): Promise<FinanceDashboardStats> {
  const response = await apiClient.get<ApiSuccessResponse<FinanceDashboardStats>>(`${PAYROLL_PREFIX}/dashboard/finance`);
  return unwrap(response);
}

export async function fetchHrPayrollDashboard(): Promise<HrPayrollStats> {
  const response = await apiClient.get<ApiSuccessResponse<HrPayrollStats>>(`${PAYROLL_PREFIX}/dashboard/hr`);
  return unwrap(response);
}

export async function fetchPayrollPolicy(): Promise<PayrollPolicy> {
  const response = await apiClient.get<ApiSuccessResponse<PayrollPolicy>>(`${PAYROLL_PREFIX}/policies`);
  return unwrap(response);
}

export async function updatePayrollPolicy(payload: Partial<PayrollPolicy>): Promise<PayrollPolicy> {
  const response = await apiClient.patch<ApiSuccessResponse<PayrollPolicy>>(`${PAYROLL_PREFIX}/policies`, payload);
  return unwrap(response);
}

export async function fetchSalaryStructures(params: ListParams = {}): Promise<PaginatedResult<SalaryStructure>> {
  const response = await apiClient.get<ApiSuccessResponse<SalaryStructure[]> & { pagination?: PaginationMeta }>(
    `${PAYROLL_PREFIX}/salary-structures`,
    { params },
  );
  return unwrapPaginated(response);
}

export async function createSalaryStructure(payload: CreateSalaryStructurePayload): Promise<SalaryStructure> {
  const response = await apiClient.post<ApiSuccessResponse<SalaryStructure>>(`${PAYROLL_PREFIX}/salary-structures`, payload);
  return unwrap(response);
}

export async function updateSalaryStructure(id: string, payload: Partial<CreateSalaryStructurePayload>): Promise<SalaryStructure> {
  const response = await apiClient.patch<ApiSuccessResponse<SalaryStructure>>(`${PAYROLL_PREFIX}/salary-structures/${id}`, payload);
  return unwrap(response);
}

export async function deleteSalaryStructure(id: string): Promise<void> {
  await apiClient.delete(`${PAYROLL_PREFIX}/salary-structures/${id}`);
}

export async function fetchAllowances(params: ListParams = {}): Promise<PaginatedResult<Allowance>> {
  const response = await apiClient.get<ApiSuccessResponse<Allowance[]> & { pagination?: PaginationMeta }>(
    `${PAYROLL_PREFIX}/components`,
    { params: { ...params, kind: 'allowance' } },
  );
  return unwrapPaginated(response);
}

export async function fetchDeductions(params: ListParams = {}): Promise<PaginatedResult<Deduction>> {
  const response = await apiClient.get<ApiSuccessResponse<Deduction[]> & { pagination?: PaginationMeta }>(
    `${PAYROLL_PREFIX}/components`,
    { params: { ...params, kind: 'deduction' } },
  );
  return unwrapPaginated(response);
}

export async function fetchPayrollCalendar(_year: number): Promise<PayrollCalendarEntry[]> {
  return [];
}

export async function fetchPayrollRuns(params: ListParams = {}): Promise<PaginatedResult<PayrollRun>> {
  const response = await apiClient.get<ApiSuccessResponse<PayrollRun[]> & { pagination?: PaginationMeta }>(
    `${PAYROLL_PREFIX}/payroll-runs`,
    { params },
  );
  return unwrapPaginated(response);
}

export async function fetchPayrollRun(id: string): Promise<PayrollRun> {
  const response = await apiClient.get<ApiSuccessResponse<PayrollRun>>(`${PAYROLL_PREFIX}/payroll-runs/${id}`);
  return unwrap(response);
}

export async function createPayrollRun(payload: CreatePayrollRunPayload): Promise<PayrollRun> {
  const response = await apiClient.post<ApiSuccessResponse<PayrollRun>>(`${PAYROLL_PREFIX}/payroll-runs`, payload);
  return unwrap(response);
}

export async function processPayrollRun(id: string): Promise<PayrollRun> {
  const response = await apiClient.post<ApiSuccessResponse<PayrollRun>>(`${PAYROLL_PREFIX}/payroll-runs/${id}/process`);
  return unwrap(response);
}

export async function approvePayrollRun(id: string): Promise<PayrollRun> {
  const response = await apiClient.post<ApiSuccessResponse<PayrollRun>>(`${PAYROLL_PREFIX}/payroll-runs/${id}/submit`);
  return unwrap(response);
}

export async function lockPayrollRun(id: string): Promise<PayrollRun> {
  const response = await apiClient.post<ApiSuccessResponse<PayrollRun>>(`${PAYROLL_PREFIX}/payroll-runs/${id}/lock`);
  return unwrap(response);
}

export async function fetchPayrollLineItems(payrollId: string, params: ListParams = {}): Promise<PaginatedResult<PayrollLineItem>> {
  const response = await apiClient.get<ApiSuccessResponse<PayrollLineItem[]> & { pagination?: PaginationMeta }>(
    `${PAYROLL_PREFIX}/payroll-runs/${payrollId}/payslips`,
    { params },
  );
  return unwrapPaginated(response);
}

export async function fetchPayrollExceptions(params: ListParams & { payrollId?: string } = {}): Promise<PaginatedResult<PayrollException>> {
  const response = await apiClient.get<ApiSuccessResponse<PayrollException[]> & { pagination?: PaginationMeta }>(
    `${PAYROLL_PREFIX}/exceptions`,
    { params },
  );
  return unwrapPaginated(response);
}

export async function bulkApprovePayrollRuns(ids: string[]): Promise<{ approved: number }> {
  let approved = 0;
  for (const id of ids) {
    await approvePayrollRun(id);
    approved += 1;
  }
  return { approved };
}

export async function fetchCompensations(params: ListParams = {}): Promise<PaginatedResult<CompensationAssignment>> {
  const response = await apiClient.get<ApiSuccessResponse<CompensationAssignment[]> & { pagination?: PaginationMeta }>(
    `${PAYROLL_PREFIX}/employee-compensations`,
    { params },
  );
  return unwrapPaginated(response);
}

export async function fetchEmployeeCompensation(employeeId: string): Promise<CompensationAssignment | null> {
  const response = await apiClient.get<ApiSuccessResponse<CompensationAssignment[]> & { pagination?: PaginationMeta }>(
    `${PAYROLL_PREFIX}/employee-compensations`,
    { params: { employeeId, pageSize: 1 } },
  );
  const result = await unwrapPaginated(response);
  return result.items[0] ?? null;
}

export async function assignCompensation(payload: CreateCompensationPayload): Promise<CompensationAssignment> {
  const response = await apiClient.post<ApiSuccessResponse<CompensationAssignment>>(`${PAYROLL_PREFIX}/employee-compensations`, payload);
  return unwrap(response);
}

export async function fetchSalaryRevisions(params: ListParams = {}): Promise<PaginatedResult<SalaryRevision>> {
  const response = await apiClient.get<ApiSuccessResponse<SalaryRevision[]> & { pagination?: PaginationMeta }>(
    `${PAYROLL_PREFIX}/salary-revisions`,
    { params },
  );
  return unwrapPaginated(response);
}

export async function createSalaryRevision(payload: CreateRevisionPayload): Promise<SalaryRevision> {
  const response = await apiClient.post<ApiSuccessResponse<SalaryRevision>>(`${PAYROLL_PREFIX}/salary-revisions`, payload);
  return unwrap(response);
}

export async function fetchPayslips(params: ListParams = {}): Promise<PaginatedResult<Payslip>> {
  const response = await apiClient.get<ApiSuccessResponse<Payslip[]> & { pagination?: PaginationMeta }>(
    `${PAYROLL_PREFIX}/payslips`,
    { params },
  );
  return unwrapPaginated(response);
}

export async function fetchMyPayslips(params: ListParams = {}): Promise<PaginatedResult<Payslip>> {
  return fetchPayslips(params);
}

export async function fetchMySalary(): Promise<MySalarySummary> {
  const compensations = await fetchCompensations({ pageSize: 1 });
  const assignment = compensations.items[0];
  if (!assignment) {
    return { baseSalary: 0, currency: 'INR', isLocked: false };
  }
  return {
    baseSalary: assignment.baseSalary,
    currency: assignment.currency,
    structureName: assignment.salaryStructure?.name,
    effectiveFrom: assignment.effectiveFrom,
    isLocked: assignment.isLocked,
  };
}

export async function downloadPayslip(id: string): Promise<Blob> {
  const response = await apiClient.get(`${PAYROLL_PREFIX}/payslips/${id}/download`, { responseType: 'blob' });
  return response.data as Blob;
}

export async function fetchPayrollReport(params: ReportParams): Promise<PayrollReport> {
  const response = await apiClient.get<ApiSuccessResponse<PayrollReport>>(`${PAYROLL_PREFIX}/reports`, { params });
  return unwrap(response);
}

export async function exportPayrollReport(params: ReportParams): Promise<Blob> {
  const response = await apiClient.get(`${PAYROLL_PREFIX}/reports/export`, { params, responseType: 'blob' });
  return response.data as Blob;
}
