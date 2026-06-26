import { useMemo } from 'react';
import { Building2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getEnterpriseDashboardWidgets } from '@/config/module-registry';
import { PORTAL } from '@/config/portals';
import { useFeatureFlags } from '@/features/admin/hooks/use-settings';
import { QuickActionCenter } from '@/features/enterprise/widgets/quick-actions-widget';
import { getCompany } from '@/features/organization/api/organization.api';
import { EnterpriseWidgetComponents } from '@/features/enterprise/widgets/widget-registry';
import { PageHeader } from '@/shared/components/page-header';
import { LazyWidget, WidgetGrid } from '@/shared/components/widget-system/widget-frame';
import { useAuthStore } from '@/shared/stores/app.store';
import { Loading } from '@/shared/components/loading';

export function EnterpriseDashboardPage() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const hasAnyPermission = useAuthStore((s) => s.hasAnyPermission);
  const company = useAuthStore((s) => s.company);
  const { data: featureFlags } = useFeatureFlags();

  const { data: companyProfile, isLoading } = useQuery({
    queryKey: ['organization', 'company'],
    queryFn: getCompany,
  });

  const widgets = useMemo(
    () =>
      getEnterpriseDashboardWidgets({
        portal: PORTAL.ENTERPRISE,
        hasPermission,
        hasAnyPermission,
        featureFlags: featureFlags ?? undefined,
      }),
    [hasPermission, hasAnyPermission, featureFlags],
  );

  if (isLoading) {
    return <Loading message="Loading enterprise control center..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Building2 className="h-6 w-6 text-primary" />}
        title="Enterprise Control Center"
        description={`Company management console for ${companyProfile?.name ?? company?.name ?? 'your organization'}.`}
      />

      <QuickActionCenter />

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
