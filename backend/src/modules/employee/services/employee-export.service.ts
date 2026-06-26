import type { EmployeeDocument } from '@domain/employee/employee.schemas.js';
import { EmployeeAuditService } from '@modules/employee/services/employee-audit.service.js';
import type { EmployeeActorContext } from '@modules/employee/types/employee.types.js';

const CSV_ESCAPE = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '';
  }
  let str: string;
  if (typeof value === 'string') {
    str = value;
  } else if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    str = String(value);
  } else if (value instanceof Date) {
    str = value.toISOString();
  } else {
    str = JSON.stringify(value);
  }
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const EXPORT_COLUMNS = [
  'id',
  'employeeNumber',
  'firstName',
  'lastName',
  'email',
  'phone',
  'departmentId',
  'designationId',
  'branchId',
  'employmentType',
  'employmentStatus',
  'status',
  'joinedAt',
] as const;

export const EmployeeExportService = {
  toCsv(items: EmployeeDocument[]): string {
    const header = EXPORT_COLUMNS.join(',');
    const rows = items.map((item) =>
      EXPORT_COLUMNS.map((key) => CSV_ESCAPE(item[key as keyof EmployeeDocument])).join(','),
    );
    return [header, ...rows].join('\n');
  },

  parseCsv(content: string): Record<string, string>[] {
    const lines = content.trim().split(/\r?\n/);
    if (lines.length < 2) {
      return [];
    }
    const headers = lines[0].split(',').map((h) => h.trim());
    return lines.slice(1).map((line) => {
      const values = line.split(',');
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index]?.trim() ?? '';
      });
      return row;
    });
  },

  async logExport(context: EmployeeActorContext, count: number): Promise<void> {
    await EmployeeAuditService.log({
      companyId: context.companyId,
      userId: context.userId,
      entityType: 'employee',
      entityId: 'bulk-export',
      action: 'export',
      after: { count },
      ip: context.ip,
      userAgent: context.userAgent,
    });
  },
};
