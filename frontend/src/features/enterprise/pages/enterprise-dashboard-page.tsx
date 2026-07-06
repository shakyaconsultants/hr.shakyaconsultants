import { useMemo } from 'react';
import { Building2 } from 'lucide-react';
import { DEFAULT_FEATURE_FLAGS, getEnterpriseDashboardWidgets } from '@/config/module-registry';
import { PORTAL } from '@/config/portals';
import { QuickActionCenter } from '@/features/enterprise/widgets/quick-actions-widget';
import { EnterpriseWidgetComponents } from '@/features/enterprise/widgets/widget-registry';
import { PageHeader } from '@/shared/components/page-header';
import { LazyWidget, WidgetGrid } from '@/shared/components/widget-system/widget-frame';
import { useAuthStore } from '@/shared/stores/app.store';

export function EnterpriseDashboardPage() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const hasAnyPermission = useAuthStore((s) => s.hasAnyPermission);
  const company = useAuthStore((s) => s.company);
  const featureFlags = useAuthStore((s) => s.featureFlags);

  const widgets = useMemo(
    () =>
      getEnterpriseDashboardWidgets({
        portal: PORTAL.ENTERPRISE,
        hasPermission,
        hasAnyPermission,
        featureFlags: Object.keys(featureFlags).length > 0 ? featureFlags : DEFAULT_FEATURE_FLAGS,
      }),
    [hasPermission, hasAnyPermission, featureFlags],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Building2 className="h-6 w-6 text-primary" />}
        title="Company Dashboard"
        description={`Executive overview for ${company?.name ?? 'your organization'} — headcount, approvals, attendance, and leave.`}
      />

      <QuickActionCenter />

      <WidgetGrid>
        {widgets.map((widget) => {
          const Component =
            EnterpriseWidgetComponents[widget.id as keyof typeof EnterpriseWidgetComponents];
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
