import { DataTable, type DataTableColumn } from '@/shared/components/data-table';

export interface TableWidgetColumn {
  key: string;
  header: string;
}

export interface TableWidgetProps {
  title?: string;
  columns: TableWidgetColumn[];
  rows: Array<Record<string, string | number | undefined>>;
  emptyMessage?: string;
}

export function TableWidget({ title, columns, rows, emptyMessage = 'No data available' }: TableWidgetProps) {
  const tableColumns: DataTableColumn<{ id: string } & Record<string, string | number | undefined>>[] = columns.map(
    (column) => ({
      key: column.key,
      header: column.header,
      render: (row) => {
        const value = row[column.key];
        if (typeof value === 'number') {
          return value.toLocaleString();
        }
        return value ?? '—';
      },
    }),
  );

  const tableData = rows.map((row, index) => ({ ...row, id: String(row.id ?? index) }));

  return (
    <div className="space-y-3">
      {title ? <p className="text-sm font-medium">{title}</p> : null}
      <DataTable columns={tableColumns} data={tableData} emptyMessage={emptyMessage} />
    </div>
  );
}
