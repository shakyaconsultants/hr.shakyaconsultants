import { useMemo } from 'react';
import { Users } from 'lucide-react';
import { getManagerDashboardWidgets, DEFAULT_FEATURE_FLAGS } from '@/config/module-registry';
import { PORTAL } from '@/config/portals';
import { EnterpriseWidgetComponents } from '@/features/enterprise/widgets/widget-registry';
import { PageHeader } from '@/shared/components/page-header';
import { LazyWidget, WidgetGrid } from '@/shared/components/widget-system/widget-frame';
import { useAuthStore } from '@/shared/stores/app.store';

export function ManagerDashboardPage() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const hasAnyPermission = useAuthStore((s) => s.hasAnyPermission);
  const featureFlags = useAuthStore((s) => s.featureFlags);

  const widgets = useMemo(
    () =>
      getManagerDashboardWidgets({
        portal: PORTAL.MANAGER,
        hasPermission,
        hasAnyPermission,
        featureFlags: Object.keys(featureFlags).length > 0 ? featureFlags : DEFAULT_FEATURE_FLAGS,
      }),
    [hasPermission, hasAnyPermission, featureFlags],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Users className="h-6 w-6 text-primary" />}
        title="Manager Dashboard"
        description="How is your team performing? Operational overview for approvals, projects, and people."
      />

      <WidgetGrid>
        {widgets.map((widget) => {
          const Component = EnterpriseWidgetComponents[widget.id as keyof typeof EnterpriseWidgetComponents];
          if (!Component) {
            return null;
          }
          return (
            <LazyWidget
              key={widget.id}
              id={widget.id}
              title={widget.title}
              colSpan={widget.colSpan}
              component={Component}
            />
          );
        })}
      </WidgetGrid>
    </div>
  );
}
