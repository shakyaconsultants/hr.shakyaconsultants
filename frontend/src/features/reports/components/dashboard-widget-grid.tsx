import { useMemo } from 'react';
import type { DashboardLayoutItem, ReportWidget } from '@/features/reports/api/reports.api';
import { ChartWidget, type ChartDataPoint } from '@/features/reports/components/chart-widget';
import { HeatmapWidget, type HeatmapCell } from '@/features/reports/components/heatmap-widget';
import { ProgressWidget, type ProgressItem } from '@/features/reports/components/progress-widget';
import { StatCardWidget } from '@/features/reports/components/stat-card-widget';
import { TableWidget, type TableWidgetColumn } from '@/features/reports/components/table-widget';
import { TrendWidget, type TrendDataPoint } from '@/features/reports/components/trend-widget';
import { WidgetFrame, WidgetGrid } from '@/shared/components/widget-system/widget-frame';

export interface DashboardWidgetGridProps {
  widgets: ReportWidget[];
  layout?: DashboardLayoutItem[];
  editable?: boolean;
  onLayoutChange?: (layout: DashboardLayoutItem[]) => void;
}

function renderWidgetContent(widget: ReportWidget) {
  const data = widget.data;

  switch (widget.type) {
    case 'stat':
      return (
        <StatCardWidget
          title={widget.title}
          value={String(data.value ?? '—')}
          subtitle={data.subtitle ? String(data.subtitle) : undefined}
          trend={typeof data.trend === 'number' ? data.trend : undefined}
          trendLabel={data.trendLabel ? String(data.trendLabel) : undefined}
        />
      );
    case 'chart':
      return (
        <ChartWidget
          title={widget.title}
          data={(data.points as ChartDataPoint[] | undefined) ?? []}
          type={(data.chartType as 'bar' | 'line' | undefined) ?? 'bar'}
          valuePrefix={data.valuePrefix ? String(data.valuePrefix) : undefined}
          valueSuffix={data.valueSuffix ? String(data.valueSuffix) : undefined}
        />
      );
    case 'table':
      return (
        <TableWidget
          title={widget.title}
          columns={(data.columns as TableWidgetColumn[] | undefined) ?? []}
          rows={(data.rows as Array<Record<string, string | number | undefined>> | undefined) ?? []}
        />
      );
    case 'trend':
      return (
        <TrendWidget
          title={widget.title}
          data={(data.points as TrendDataPoint[] | undefined) ?? []}
          currentValue={typeof data.currentValue === 'number' ? data.currentValue : undefined}
          previousValue={typeof data.previousValue === 'number' ? data.previousValue : undefined}
          unit={data.unit ? String(data.unit) : undefined}
        />
      );
    case 'progress':
      return (
        <ProgressWidget
          title={widget.title}
          items={(data.items as ProgressItem[] | undefined) ?? []}
        />
      );
    case 'heatmap':
      return (
        <HeatmapWidget
          title={widget.title}
          rows={(data.rows as string[] | undefined) ?? []}
          columns={(data.columns as string[] | undefined) ?? []}
          cells={(data.cells as HeatmapCell[] | undefined) ?? []}
          valueSuffix={data.valueSuffix ? String(data.valueSuffix) : undefined}
        />
      );
    default:
      return (
        <pre className="overflow-auto text-xs text-muted-foreground">{JSON.stringify(data, null, 2)}</pre>
      );
  }
}

export function DashboardWidgetGrid({ widgets, layout, editable: _editable, onLayoutChange: _onLayoutChange }: DashboardWidgetGridProps) {
  const orderedWidgets = useMemo((): ReportWidget[] => {
    if (!layout || layout.length === 0) {
      return widgets;
    }

    const widgetMap = new Map(widgets.map((widget) => [widget.id, widget]));
    const visibleLayout = layout.filter((item) => item.visible).sort((a, b) => a.order - b.order);

    return visibleLayout.flatMap((item) => {
      const widget = widgetMap.get(item.widgetId);
      if (!widget) {
        return [];
      }
      return [{ ...widget, colSpan: item.colSpan }];
    });
  }, [widgets, layout]);

  if (orderedWidgets.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        No dashboard widgets available for the selected filters.
      </div>
    );
  }

  return (
    <WidgetGrid>
      {orderedWidgets.map((widget) => (
        <WidgetFrame key={widget.id} id={widget.id} title={widget.title} colSpan={widget.colSpan ?? 1}>
          {renderWidgetContent(widget)}
        </WidgetFrame>
      ))}
    </WidgetGrid>
  );
}
