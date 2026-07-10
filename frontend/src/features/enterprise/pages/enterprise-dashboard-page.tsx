import { Link } from 'react-router-dom';
import { Bell, CalendarDays, CheckCircle2, Clock, FolderKanban, Users } from 'lucide-react';
import { ROUTES } from '@/config/app.config';
import { ENTERPRISE_QUICK_ACTIONS } from '@/features/enterprise/constants/quick-actions';
import { useApprovalInbox } from '@/features/approval/hooks/use-approval';
import { useEnterpriseAttendanceDashboard } from '@/features/attendance/hooks/use-attendance';
import { useCommunicationNotifications } from '@/features/communication/hooks/use-communication';
import { useEmployees } from '@/features/employee/hooks/use-employees';
import { useEmployeeLabelMap } from '@/features/employee/hooks/use-employee-label-map';
import { useCompanyCalendar } from '@/features/leave-exit/hooks/use-leave-exit';
import type { CalendarEvent } from '@/features/leave-exit/api/leave-exit.api';
import { useEnterpriseDashboard, useProjects } from '@/features/project/hooks/use-projects';
import { Button } from '@/shared/components/ui/button';
import { Loading } from '@/shared/components/loading';
import { useAuthStore } from '@/shared/stores/app.store';
import { cn } from '@/shared/utils/cn';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function isApprovedLeaveOnDate(event: CalendarEvent, date: string): boolean {
  if (event.type !== 'approved_leave') {
    return false;
  }
  const start = event.date.slice(0, 10);
  const end = (event.endDate ?? event.date).slice(0, 10);
  return date >= start && date <= end;
}

function formatRelativeTime(value: string): string {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function DashboardCard({
  title,
  icon: Icon,
  href,
  linkLabel,
  children,
  className,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  linkLabel?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('erp-card flex h-full flex-col p-5', className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-secondary/10 text-secondary">
            <Icon className="h-4 w-4" />
          </div>
          <h2 className="text-body-sm font-semibold">{title}</h2>
        </div>
        {href ? (
          <Link to={href} className="text-data font-medium text-secondary hover:underline">
            {linkLabel ?? 'View all'}
          </Link>
        ) : null}
      </div>
      <div className="flex-1">{children}</div>
    </section>
  );
}

function MetricPill({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn('text-xl font-semibold', tone)}>{value}</p>
    </div>
  );
}

function EmptyNote({ message }: { message: string }) {
  return <p className="text-sm text-muted-foreground">{message}</p>;
}

function QuickActionsStrip() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const hasAnyPermission = useAuthStore((s) => s.hasAnyPermission);

  const actions = ENTERPRISE_QUICK_ACTIONS.filter((action) => {
    if (action.permission) return hasPermission(action.permission);
    if (action.permissionsAny) return hasAnyPermission(action.permissionsAny);
    return true;
  });

  if (actions.length === 0) return null;

  return (
    <div className="erp-toolbar">
      <span className="mr-1 text-label-caps text-muted-foreground">Quick actions</span>
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Button key={action.id} asChild size="sm" variant="outline" className="h-8 gap-1.5">
            <Link to={action.path}>
              <Icon className="h-3.5 w-3.5" />
              {action.label}
            </Link>
          </Button>
        );
      })}
    </div>
  );
}

function NotificationsCard() {
  const { data, isLoading, isError } = useCommunicationNotifications({ pageSize: 5 });

  if (isLoading) return <Loading message="Loading notifications..." />;
  if (isError) return <EmptyNote message="Unable to load notifications." />;

  const items = data?.items ?? [];
  const unread = items.filter((item) => !item.readAt).length;

  if (items.length === 0) {
    return <EmptyNote message="No notifications right now." />;
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {unread > 0 ? `${unread} unread` : 'All caught up'}
      </p>
      <ul className="space-y-2">
        {items.slice(0, 4).map((item) => (
          <li
            key={item.id}
            className={cn(
              'rounded-lg border px-3 py-2',
              !item.readAt ? 'border-secondary/20 bg-secondary/5' : 'border-border bg-muted/30',
            )}
          >
            <p className="text-sm font-medium leading-snug">{item.title}</p>
            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{item.body}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {formatRelativeTime(item.createdAt)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PendingApprovalsCard() {
  const { data, isLoading, isError } = useApprovalInbox({
    page: 1,
    pageSize: 5,
    status: 'pending',
  });

  if (isLoading) return <Loading message="Loading approvals..." />;
  if (isError) return <EmptyNote message="Unable to load pending approvals." />;

  const items = data?.items ?? [];
  const total = data?.pagination?.total ?? items.length;

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-2">
        <p className="text-3xl font-bold">{total}</p>
        <p className="pb-1 text-sm text-muted-foreground">awaiting action</p>
      </div>
      {items.length === 0 ? (
        <EmptyNote message="No pending approvals." />
      ) : (
        <ul className="space-y-2">
          {items.slice(0, 4).map((item) => (
            <li key={item.id} className="rounded-lg border bg-muted/10 px-3 py-2 text-sm">
              <p className="font-medium leading-snug">{item.title}</p>
              <p className="mt-0.5 text-xs capitalize text-muted-foreground">
                {item.requestType.replace(/_/g, ' ')}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AttendanceOverviewCard() {
  const { data, isLoading, isError } = useEnterpriseAttendanceDashboard();

  if (isLoading) return <Loading message="Loading attendance..." />;
  if (isError || !data) return <EmptyNote message="Unable to load attendance overview." />;

  return (
    <div className="grid grid-cols-2 gap-3">
      <MetricPill label="Present" value={data.presentToday ?? 0} tone="text-emerald-600" />
      <MetricPill label="Absent" value={data.absentToday ?? 0} tone="text-red-600" />
      <MetricPill label="Late" value={data.lateToday ?? 0} tone="text-amber-600" />
      <MetricPill label="On leave" value={data.onLeaveToday ?? 0} />
      <MetricPill label="Half day" value={data.halfDayToday ?? 0} />
      <MetricPill label="Missing punch" value={data.missingPunches ?? 0} />
    </div>
  );
}

function EmployeesOnLeaveCard() {
  const today = todayIsoDate();
  const { data: events, isLoading, isError } = useCompanyCalendar(today, today);
  const labelMap = useEmployeeLabelMap();

  if (isLoading) return <Loading message="Loading leave data..." />;
  if (isError) return <EmptyNote message="Unable to load employees on leave." />;

  const onLeaveToday = (events ?? []).filter((event) => isApprovedLeaveOnDate(event, today));

  if (onLeaveToday.length === 0) {
    return <EmptyNote message="No employees on leave today." />;
  }

  return (
    <ul className="space-y-2">
      {onLeaveToday.slice(0, 6).map((event) => (
        <li
          key={event.id}
          className="flex items-center justify-between gap-3 rounded-lg border bg-muted/10 px-3 py-2 text-sm"
        >
          <span className="font-medium">
            {event.employeeId ? (labelMap.get(event.employeeId) ?? event.title) : event.title}
          </span>
          <span className="shrink-0 text-xs text-muted-foreground">On leave</span>
        </li>
      ))}
    </ul>
  );
}

function EssentialDetailsCard() {
  const company = useAuthStore((s) => s.company);
  const { data: allEmployees, isLoading: allLoading } = useEmployees({ page: 1, pageSize: 1 });
  const { data: activeEmployees, isLoading: activeLoading } = useEmployees({
    page: 1,
    pageSize: 1,
    status: 'active',
  });
  const { data: attendance, isLoading: attendanceLoading } = useEnterpriseAttendanceDashboard();
  const { data: approvals, isLoading: approvalsLoading } = useApprovalInbox({
    page: 1,
    pageSize: 1,
    status: 'pending',
  });

  if (allLoading || activeLoading || attendanceLoading || approvalsLoading) {
    return <Loading message="Loading details..." />;
  }

  const totalEmployees = allEmployees?.pagination?.total ?? 0;
  const activeCount = activeEmployees?.pagination?.total ?? 0;
  const pendingApprovals = approvals?.pagination?.total ?? 0;

  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-lg border bg-muted/10 px-3 py-2">
        <dt className="text-xs text-muted-foreground">Company</dt>
        <dd className="font-medium">{company?.name ?? '—'}</dd>
      </div>
      <div className="rounded-lg border bg-muted/10 px-3 py-2">
        <dt className="text-xs text-muted-foreground">Total employees</dt>
        <dd className="text-xl font-semibold">{totalEmployees}</dd>
      </div>
      <div className="rounded-lg border bg-muted/10 px-3 py-2">
        <dt className="text-xs text-muted-foreground">Active employees</dt>
        <dd className="text-xl font-semibold">{activeCount}</dd>
      </div>
      <div className="rounded-lg border bg-muted/10 px-3 py-2">
        <dt className="text-xs text-muted-foreground">Present today</dt>
        <dd className="text-xl font-semibold">{attendance?.presentToday ?? 0}</dd>
      </div>
      <div className="rounded-lg border bg-muted/10 px-3 py-2">
        <dt className="text-xs text-muted-foreground">Pending approvals</dt>
        <dd className="text-xl font-semibold">{pendingApprovals}</dd>
      </div>
      <div className="rounded-lg border bg-muted/10 px-3 py-2">
        <dt className="text-xs text-muted-foreground">Pending corrections</dt>
        <dd className="text-xl font-semibold">{attendance?.pendingCorrections ?? 0}</dd>
      </div>
    </dl>
  );
}

function ActiveProjectsCard() {
  const { data: dashboard, isLoading: dashboardLoading } = useEnterpriseDashboard();
  const { data: projects, isLoading: projectsLoading } = useProjects({
    page: 1,
    pageSize: 5,
    status: 'active',
  });

  if (dashboardLoading || projectsLoading) {
    return <Loading message="Loading projects..." />;
  }

  const activeCount = dashboard?.activeProjects ?? projects?.pagination?.total ?? 0;
  const openTasks = dashboard?.totalTasks ?? 0;
  const items = projects?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <MetricPill label="Active projects" value={activeCount} />
        <MetricPill label="Open tasks" value={openTasks} />
      </div>
      {items.length === 0 ? (
        <EmptyNote message="No active projects." />
      ) : (
        <ul className="space-y-2">
          {items.slice(0, 5).map((project) => (
            <li key={project.id}>
              <Link
                to={ROUTES.projectDetail(project.id)}
                className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/30 px-3 py-2 text-body-sm transition hover:border-secondary/30"
              >
                <span className="font-medium">{project.name}</span>
                <span className="text-xs uppercase text-muted-foreground">{project.status}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function EnterpriseDashboardPage() {
  const employee = useAuthStore((s) => s.employee);
  const company = useAuthStore((s) => s.company);
  const user = useAuthStore((s) => s.user);
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const hasAnyPermission = useAuthStore((s) => s.hasAnyPermission);

  const displayName =
    employee?.firstName?.trim() || user?.email?.split('@')[0]?.replace(/[._]/g, ' ') || 'Admin';

  const showNotifications =
    hasPermission('notification.read') ||
    hasAnyPermission(['announcement.read', 'notifications.broadcast']);
  const showApprovals = hasPermission('approval.read');
  const showAttendance = hasPermission('attendance.read');
  const showLeave = hasPermission('leave.read');
  const showProjects = hasPermission('project.read');
  const showEssentials = hasPermission('company.read') || hasPermission('employee.read');

  return (
    <div className="space-y-5">
      <header className="erp-card px-6 py-5">
        <p className="text-data text-muted-foreground">
          {new Date().toLocaleDateString(undefined, {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
        <h1 className="mt-1 text-display">
          {getGreeting()}, {displayName}
        </h1>
        <p className="mt-1 text-body-sm text-muted-foreground">
          {company?.name ?? 'Your organization'} — admin overview
        </p>
      </header>

      <QuickActionsStrip />

      <div className="grid gap-4 lg:grid-cols-2">
        {showNotifications ? (
          <DashboardCard
            title="Notifications"
            icon={Bell}
            href={`${ROUTES.COMMUNICATION}?tab=notifications`}
            linkLabel="Open inbox"
          >
            <NotificationsCard />
          </DashboardCard>
        ) : null}

        {showApprovals ? (
          <DashboardCard
            title="Pending Approvals"
            icon={CheckCircle2}
            href={ROUTES.APPROVAL_INBOX}
            linkLabel="Review inbox"
          >
            <PendingApprovalsCard />
          </DashboardCard>
        ) : null}

        {showAttendance ? (
          <DashboardCard
            title="Today's Attendance"
            icon={Clock}
            href={ROUTES.ATTENDANCE}
            linkLabel="Attendance admin"
          >
            <AttendanceOverviewCard />
          </DashboardCard>
        ) : null}

        {showLeave ? (
          <DashboardCard
            title="Employees on Leave"
            icon={CalendarDays}
            href={ROUTES.LEAVE_EXIT}
            linkLabel="Leave module"
          >
            <EmployeesOnLeaveCard />
          </DashboardCard>
        ) : null}

        {showEssentials ? (
          <DashboardCard title="Essential Details" icon={Users}>
            <EssentialDetailsCard />
          </DashboardCard>
        ) : null}

        {showProjects ? (
          <DashboardCard
            title="Active Projects"
            icon={FolderKanban}
            href={ROUTES.PROJECTS}
            linkLabel="Projects hub"
          >
            <ActiveProjectsCard />
          </DashboardCard>
        ) : null}
      </div>
    </div>
  );
}
