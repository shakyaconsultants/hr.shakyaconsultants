import { useSearchParams } from 'react-router-dom';
import { LeaveExitNav } from '@/features/leave-exit/components/leave-exit-nav';
import { LeaveTypesPanel } from '@/features/leave-exit/components/leave-types-panel';
import { LeavePoliciesPanel } from '@/features/leave-exit/components/leave-policies-panel';
import { PageHeader } from '@/shared/components/page-header';
import { Button } from '@/shared/components/ui/button';
import { ROUTES } from '@/config/app.config';
import { Scale, Tags } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

type SetupTab = 'types' | 'policies';

export function LeaveSetupPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get('tab') as SetupTab) || 'types';

  function setTab(next: SetupTab) {
    setSearchParams({ tab: next }, { replace: true });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Scale className="h-6 w-6 text-primary" />}
        title="Leave Setup"
        description="Configure leave types and policies in one place — types define categories, policies define rules and who they apply to."
        breadcrumbs={[{ label: 'Leave', href: ROUTES.LEAVE_EXIT }, { label: 'Setup' }]}
      />
      <LeaveExitNav />

      <section className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">End-to-end leave configuration</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>
            Create <strong>Leave Types</strong> (Casual, Sick, Earned, LOP, etc.)
          </li>
          <li>
            Seed or create <strong>Policies</strong> with quotas and department scope
          </li>
          <li>Employees apply leave against policies; balances track automatically</li>
        </ol>
      </section>

      <div className="flex flex-wrap gap-2 border-b pb-2">
        <Button
          type="button"
          size="sm"
          variant={tab === 'types' ? 'default' : 'ghost'}
          onClick={() => setTab('types')}
        >
          <Tags className="mr-2 h-4 w-4" />
          Leave Types
        </Button>
        <Button
          type="button"
          size="sm"
          variant={tab === 'policies' ? 'default' : 'ghost'}
          onClick={() => setTab('policies')}
        >
          <Scale className="mr-2 h-4 w-4" />
          Policies & Rules
        </Button>
      </div>

      <div className={cn(tab === 'types' ? 'block' : 'hidden')}>
        <LeaveTypesPanel />
      </div>
      <div className={cn(tab === 'policies' ? 'block' : 'hidden')}>
        <LeavePoliciesPanel />
      </div>
    </div>
  );
}
