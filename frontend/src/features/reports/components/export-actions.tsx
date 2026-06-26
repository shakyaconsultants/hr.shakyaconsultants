import { Download, FileText, Printer } from 'lucide-react';
import type { ExportFormat, ExportReportParams } from '@/features/reports/api/reports.api';
import { useExportReport } from '@/features/reports/hooks/use-reports';
import { Button } from '@/shared/components/ui/button';

export interface ExportActionsProps {
  domain: string;
  type: string;
  parameters?: Record<string, unknown>;
  filters?: ExportReportParams;
  disabled?: boolean;
  className?: string;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function ExportActions({ domain, type, parameters, filters, disabled, className }: ExportActionsProps) {
  const exportReport = useExportReport();

  const baseParams = {
    domain,
    type,
    ...filters,
    parameters,
  };

  const handleExport = async (format: ExportFormat) => {
    const blob = await exportReport.mutateAsync({
      ...baseParams,
      format,
    });
    downloadBlob(blob, `${domain}-${type}-report.${format}`);
  };

  const handlePrint = () => {
    window.print();
  };

  const isPending = exportReport.isPending;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className ?? ''}`}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || isPending}
        onClick={() => void handleExport('csv')}
      >
        <Download className="mr-1.5 h-4 w-4" />
        {isPending ? 'Exporting...' : 'CSV'}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || isPending}
        onClick={() => void handleExport('pdf')}
      >
        <FileText className="mr-1.5 h-4 w-4" />
        PDF
      </Button>
      <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={handlePrint}>
        <Printer className="mr-1.5 h-4 w-4" />
        Print
      </Button>
    </div>
  );
}
