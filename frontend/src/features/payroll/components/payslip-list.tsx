import { useDownloadPayslip, useMyPayslips, usePayslips } from '@/features/payroll/hooks/use-payroll';
import type { Payslip } from '@/features/payroll/api/payroll.api';
import { DataTable, type DataTableColumn } from '@/shared/components/data-table';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/cn';

interface PayslipListProps {
  employeeId?: string;
  ownOnly?: boolean;
}

export function PayslipList({ employeeId, ownOnly = false }: PayslipListProps) {
  const adminQuery = usePayslips({ employeeId, pageSize: 50 });
  const ownQuery = useMyPayslips({ pageSize: 50 });
  const downloadPayslip = useDownloadPayslip();

  const { data, isLoading } = ownOnly ? ownQuery : adminQuery;

  const handleDownload = async (id: string, periodLabel: string) => {
    const blob = await downloadPayslip.mutateAsync(id);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payslip-${periodLabel}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const columns: DataTableColumn<Payslip>[] = [
    ...(ownOnly ? [] : [{ key: 'employeeId', header: 'Employee ID' }]),
    {
      key: 'period',
      header: 'Period',
      render: (row) => {
        if (row.periodStart && row.periodEnd) {
          return `${new Date(row.periodStart).toLocaleDateString()} – ${new Date(row.periodEnd).toLocaleDateString()}`;
        }
        return '—';
      },
    },
    {
      key: 'grossSalary',
      header: 'Gross',
      render: (row) => `${row.currency} ${row.grossSalary.toLocaleString()}`,
    },
    {
      key: 'netSalary',
      header: 'Net',
      render: (row) => `${row.currency} ${row.netSalary.toLocaleString()}`,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <PayslipStatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void handleDownload(row.id, row.periodStart ?? row.id)}
          disabled={downloadPayslip.isPending}
        >
          Download
        </Button>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data?.items ?? []}
      isLoading={isLoading}
      emptyMessage={ownOnly ? 'No payslips available' : 'No payslips found'}
    />
  );
}

function PayslipStatusBadge({ status }: { status: string }) {
  const tone =
    status === 'acknowledged'
      ? 'bg-emerald-100 text-emerald-800'
      : status === 'sent'
        ? 'bg-blue-100 text-blue-800'
        : 'bg-muted text-muted-foreground';

  return <span className={cn('rounded px-2 py-0.5 text-xs font-medium capitalize', tone)}>{status}</span>;
}
