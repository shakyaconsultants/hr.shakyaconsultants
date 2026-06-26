export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface ChartWidgetProps {
  title?: string;
  data: ChartDataPoint[];
  type?: 'bar' | 'line';
  height?: number;
  valuePrefix?: string;
  valueSuffix?: string;
}

const DEFAULT_COLORS = ['#2563eb', '#7c3aed', '#0891b2', '#059669', '#d97706', '#dc2626'];

function formatChartValue(value: number, prefix = '', suffix = ''): string {
  return `${prefix}${value.toLocaleString()}${suffix}`;
}

export function ChartWidget({
  title,
  data,
  type = 'bar',
  height = 180,
  valuePrefix = '',
  valueSuffix = '',
}: ChartWidgetProps) {
  const maxValue = Math.max(...data.map((point) => point.value), 1);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-md border border-dashed p-6 text-sm text-muted-foreground">
        No chart data available
      </div>
    );
  }

  if (type === 'line') {
    const width = 100;
    const points = data.map((point, index) => {
      const x = data.length === 1 ? width / 2 : (index / (data.length - 1)) * width;
      const y = height - (point.value / maxValue) * (height - 20) - 10;
      return `${x},${y}`;
    });

    return (
      <div className="space-y-3">
        {title ? <p className="text-sm font-medium">{title}</p> : null}
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label={title ?? 'Line chart'}>
          <polyline
            fill="none"
            stroke="#2563eb"
            strokeWidth="2"
            points={points.join(' ')}
          />
          {data.map((point, index) => {
            const x = data.length === 1 ? width / 2 : (index / (data.length - 1)) * width;
            const y = height - (point.value / maxValue) * (height - 20) - 10;
            return <circle key={point.label} cx={x} cy={y} r="2.5" fill="#2563eb" />;
          })}
        </svg>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {data.map((point) => (
            <span key={point.label}>
              {point.label}: {formatChartValue(point.value, valuePrefix, valueSuffix)}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {title ? <p className="text-sm font-medium">{title}</p> : null}
      <div className="flex items-end gap-2" style={{ height }}>
        {data.map((point, index) => {
          const barHeight = Math.max((point.value / maxValue) * (height - 24), 4);
          const color = point.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length];
          return (
            <div key={point.label} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[10px] text-muted-foreground">
                {formatChartValue(point.value, valuePrefix, valueSuffix)}
              </span>
              <div
                className="w-full rounded-t-sm"
                style={{ height: barHeight, backgroundColor: color }}
                title={`${point.label}: ${formatChartValue(point.value, valuePrefix, valueSuffix)}`}
              />
              <span className="truncate text-[10px] text-muted-foreground">{point.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
