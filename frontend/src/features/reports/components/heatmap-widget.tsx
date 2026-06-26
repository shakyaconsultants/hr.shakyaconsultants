import { cn } from '@/shared/utils/cn';

export interface HeatmapCell {
  row: string;
  column: string;
  value: number;
}

export interface HeatmapWidgetProps {
  title?: string;
  rows: string[];
  columns: string[];
  cells: HeatmapCell[];
  valueSuffix?: string;
}

function intensityClass(value: number, max: number): string {
  if (max <= 0) {
    return 'bg-muted';
  }
  const ratio = value / max;
  if (ratio >= 0.8) return 'bg-blue-600 text-white';
  if (ratio >= 0.6) return 'bg-blue-500 text-white';
  if (ratio >= 0.4) return 'bg-blue-400 text-white';
  if (ratio >= 0.2) return 'bg-blue-200 text-foreground';
  return 'bg-blue-50 text-foreground';
}

export function HeatmapWidget({ title, rows, columns, cells, valueSuffix = '' }: HeatmapWidgetProps) {
  const maxValue = Math.max(...cells.map((cell) => cell.value), 1);
  const cellMap = new Map(cells.map((cell) => [`${cell.row}:${cell.column}`, cell.value]));

  if (rows.length === 0 || columns.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-md border border-dashed p-6 text-sm text-muted-foreground">
        No heatmap data available
      </div>
    );
  }

  return (
    <div className="space-y-3 overflow-x-auto">
      {title ? <p className="text-sm font-medium">{title}</p> : null}
      <table className="w-full min-w-[480px] border-collapse text-xs">
        <thead>
          <tr>
            <th className="p-2 text-left font-medium text-muted-foreground" />
            {columns.map((column) => (
              <th key={column} className="p-2 text-center font-medium text-muted-foreground">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row}>
              <td className="p-2 font-medium text-muted-foreground">{row}</td>
              {columns.map((column) => {
                const value = cellMap.get(`${row}:${column}`) ?? 0;
                return (
                  <td key={`${row}-${column}`} className="p-1">
                    <div
                      className={cn(
                        'flex h-10 items-center justify-center rounded text-center font-medium',
                        intensityClass(value, maxValue),
                      )}
                      title={`${row} / ${column}: ${value}${valueSuffix}`}
                    >
                      {value}
                      {valueSuffix}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
