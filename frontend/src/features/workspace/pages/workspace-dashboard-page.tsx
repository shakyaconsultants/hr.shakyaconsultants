import { useWorkspaceLayout } from '@/features/workspace/hooks/use-workspace';
import { WidgetRenderer } from '@/features/workspace/components/widget-renderer';
import { WidgetSkeleton } from '@/features/workspace/components/widget-primitives';
import { WorkspacePageHeader } from '@/features/workspace/components/workspace-nav';
import { LayoutDashboard } from 'lucide-react';

export function WorkspaceDashboardPage() {
  const { data: layout, isLoading } = useWorkspaceLayout();

  const visibleWidgets = layout?.widgets.filter((w) => w.isVisible) ?? [];
  const catalogMap = new Map(layout?.catalog.map((c) => [c.slug, c]) ?? []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-primary">
        <LayoutDashboard className="h-5 w-5" />
        <WorkspacePageHeader title="My Workspace" description="Your daily employee portal — widgets load independently." />
      </div>
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <WidgetSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" role="region" aria-label="Workspace widgets">
          {visibleWidgets.map((widget) => {
            const catalog = catalogMap.get(widget.widgetSlug);
            return (
              <WidgetRenderer
                key={widget.widgetSlug}
                slug={widget.widgetSlug}
                title={catalog?.name ?? widget.widgetSlug}
                columnSpan={widget.columnSpan}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
