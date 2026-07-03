import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { OrganizationChartPreview } from '@/features/admin/components/org-chart/organization-chart-preview';
import { ROUTES } from '@/config/app.config';
import { Button } from '@/shared/components/ui/button';

export function OrgChartPreviewWidget() {
  return (
    <div className="space-y-3">
      <OrganizationChartPreview compact showHeader={false} maxScale={0.7} />
      <div className="flex justify-end">
        <Button asChild variant="ghost" size="sm">
          <Link to={ROUTES.ORGANIZATION_CHART}>
            View interactive chart
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
