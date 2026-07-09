import { useMemo } from 'react';
import { AnnexureASalaryTable } from '@/features/payroll/components/annexure-a-salary-table';
import {
  CompensationSetupWizard,
  compensationBreakdownFromAssignment,
} from '@/features/payroll/components/compensation-setup-wizard';
import { useEmployeeCompensation, useMyCompensation } from '@/features/payroll/hooks/use-payroll';
import { useAuthStore } from '@/shared/stores/app.store';
import { Loading } from '@/shared/components/loading';

interface EmployeePayrollPanelProps {
  employeeId: string;
  employeeName?: string;
}

export function EmployeePayrollPanel({ employeeId, employeeName }: EmployeePayrollPanelProps) {
  const authEmployeeId = useAuthStore((s) => s.employee?.id);
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const isSelf = authEmployeeId === employeeId;
  const canManage = hasPermission('payroll.update') || hasPermission('payroll.create');

  const employeeQuery = useEmployeeCompensation(employeeId);
  const selfQuery = useMyCompensation();
  const compensationQuery = isSelf && !hasPermission('payroll.read') ? selfQuery : employeeQuery;
  const { data: compensation, isLoading } = compensationQuery;

  const breakdown = useMemo(() => {
    if (!compensation?.baseSalary) return null;
    return compensationBreakdownFromAssignment(
      compensation.baseSalary,
      compensation.salaryStructure?.components,
      compensation.componentOverrides,
      compensation.currency,
    );
  }, [compensation]);

  if (isLoading) {
    return <Loading message="Loading salary structure..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Salary Structure</h2>
        <p className="text-sm text-muted-foreground">
          {employeeName
            ? `Monthly salary components for ${employeeName}.`
            : 'Monthly salary components and Annexure A preview.'}
        </p>
      </div>

      {canManage ? (
        <CompensationSetupWizard employeeId={employeeId} />
      ) : breakdown ? (
        <AnnexureASalaryTable breakdown={breakdown} />
      ) : (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <p className="font-medium">No salary assigned</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Contact HR to set up your salary structure.
          </p>
        </div>
      )}
    </div>
  );
}
