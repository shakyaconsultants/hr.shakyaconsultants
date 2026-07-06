import { useSearchParams } from 'react-router-dom';
import { LogOut, ClipboardCheck } from 'lucide-react';
import { LeaveExitNav } from '@/features/leave-exit/components/leave-exit-nav';
import { ResignationsPanel } from '@/features/leave-exit/components/resignations-panel';
import { ExitProgressPanel } from '@/features/leave-exit/components/exit-progress-panel';
import { PageHeader } from '@/shared/components/page-header';
import { Button } from '@/shared/components/ui/button';
import { ROUTES } from '@/config/app.config';
import { cn } from '@/shared/utils/cn';

type OffboardingTab = 'resignations' | 'exit';

export function LeaveOffboardingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get('tab') as OffboardingTab) || 'resignations';

  function setTab(next: OffboardingTab) {
    setSearchParams({ tab: next }, { replace: true });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<LogOut className="h-6 w-6 text-primary" />}
        title="Offboarding"
        description="Manage resignation requests and employee exit clearance in one place."
        breadcrumbs={[{ label: 'Leave', href: ROUTES.LEAVE_EXIT }, { label: 'Offboarding' }]}
      />
      <LeaveExitNav />

      <div className="flex flex-wrap gap-2 border-b pb-2">
        <Button
          type="button"
          size="sm"
          variant={tab === 'resignations' ? 'default' : 'ghost'}
          onClick={() => setTab('resignations')}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Resignations
        </Button>
        <Button
          type="button"
          size="sm"
          variant={tab === 'exit' ? 'default' : 'ghost'}
          onClick={() => setTab('exit')}
        >
          <ClipboardCheck className="mr-2 h-4 w-4" />
          Exit Clearance
        </Button>
      </div>

      <div className={cn(tab === 'resignations' ? 'block' : 'hidden')}>
        <ResignationsPanel />
      </div>
      <div className={cn(tab === 'exit' ? 'block' : 'hidden')}>
        <ExitProgressPanel />
      </div>
    </div>
  );
}
