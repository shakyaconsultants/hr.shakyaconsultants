import type { ImportPreviewRow } from '@/features/integration/api/integration.api';
import { StatusBadge } from '@/features/integration/components/status-badge';
import { cn } from '@/shared/utils/cn';

interface ImportPreviewTableProps {
  rows: ImportPreviewRow[];
  fields: string[];
  maxRows?: number;
}

export function ImportPreviewTable({ rows, fields, maxRows = 50 }: ImportPreviewTableProps) {
  const displayRows = rows.slice(0, maxRows);

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
        Upload a CSV file to preview import data.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {rows.length > maxRows ? (
        <p className="text-xs text-muted-foreground">
          Showing first {maxRows} of {rows.length} rows
        </p>
      ) : null}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left font-medium">#</th>
              {fields.map((field) => (
                <th key={field} className="px-3 py-2 text-left font-medium">
                  {field}
                </th>
              ))}
              <th className="px-3 py-2 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row) => (
              <tr
                key={row.rowNumber}
                className={cn(
                  'border-b last:border-0',
                  row.errors?.length ? 'bg-destructive/5' : row.isDuplicate ? 'bg-amber-50/50 dark:bg-amber-900/10' : '',
                )}
              >
                <td className="px-3 py-2 text-muted-foreground">{row.rowNumber}</td>
                {fields.map((field) => (
                  <td key={field} className="max-w-[200px] truncate px-3 py-2">
                    {row.data[field] ?? '—'}
                  </td>
                ))}
                <td className="px-3 py-2">
                  {row.errors?.length ? (
                    <span className="text-xs text-destructive">{row.errors.join('; ')}</span>
                  ) : row.isDuplicate ? (
                    <StatusBadge status="pending" />
                  ) : (
                    <StatusBadge status="connected" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
