export const PAYROLL_PERMISSIONS = {
  READ: 'payroll.read',
  CREATE: 'payroll.create',
  UPDATE: 'payroll.update',
  DELETE: 'payroll.delete',
  PROCESS: 'payroll.process',
} as const;

export const PAYSLIP_PERMISSIONS = {
  READ: 'payslip.read',
  CREATE: 'payslip.create',
  UPDATE: 'payslip.update',
  DELETE: 'payslip.delete',
} as const;
