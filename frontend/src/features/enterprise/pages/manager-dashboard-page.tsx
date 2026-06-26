import { Link } from 'react-router-dom';
import { ClipboardCheck, FolderKanban, Users } from 'lucide-react';
import { PageHeader } from '@/shared/components/page-header';
import { StatCard } from '@/shared/components/stat-card';
import { ROUTES } from '@/config/app.config';
import { useEmployees } from '@/features/employee/hooks/use-employees';
import { useApprovalInbox } from '@/features/approval/hooks/use-approval';
import { useManagerDashboard } from '@/features/project/hooks/use-projects';
import { Loading } from '@/shared/components/loading';
import { Button } from '@/shared/components/ui/button';

export function ManagerDashboardPage() {
  const { data: employees, isLoading: employeesLoading } = useEmployees({ page: 1, pageSize: 1 });
  const { data: approvals, isLoading: approvalsLoading } = useApprovalInbox({ page: 1, pageSize: 1, status: 'pending' });
  const { data: projects, isLoading: projectsLoading } = useManagerDashboard();

  if (employeesLoading || approvalsLoading || projectsLoading) {
    return <Loading message="Loading manager dashboard..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manager Dashboard"
        description="Operational overview for your teams, projects, and pending actions."
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to={ROUTES.APPROVAL_INBOX}>Approval Inbox</Link>
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={Users} label="Team Size" value={employees?.pagination?.total ?? 0} />
        <StatCard icon={ClipboardCheck} label="Pending Approvals" value={approvals?.pagination?.total ?? 0} />
        <StatCard icon={FolderKanban} label="Active Projects" value={projects?.activeProjects ?? 0} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-lg border bg-card p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold">People</h2>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={ROUTES.EMPLOYEES}>Employees</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to={ROUTES.RECRUITMENT}>Recruitment</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to={ROUTES.LEAVE_EXIT}>Leave & Exit</Link>
            </Button>
          </div>
        </section>
        <section className="rounded-lg border bg-card p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold">Operations</h2>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={ROUTES.PROJECTS}>Projects</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to={ROUTES.APPROVAL_INBOX}>Approvals</Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
