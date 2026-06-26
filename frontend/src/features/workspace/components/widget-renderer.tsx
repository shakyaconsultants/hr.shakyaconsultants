import { useWidgetData } from '@/features/workspace/hooks/use-workspace';
import { WidgetCard, WidgetSkeleton, EmptyState } from '@/features/workspace/components/widget-primitives';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/config/app.config';

interface WidgetRendererProps {
  slug: string;
  title: string;
  columnSpan?: number;
}

export function WidgetRenderer({ slug, title, columnSpan = 1 }: WidgetRendererProps) {
  const { data, isLoading, isError } = useWidgetData(slug);

  return (
    <div className={columnSpan > 1 ? 'md:col-span-2' : undefined}>
      {isLoading ? (
        <WidgetSkeleton title={title} />
      ) : (
        <WidgetCard title={title}>
          {isError ? (
            <EmptyState title="Unable to load widget" description="Please try again later." />
          ) : (
            <WidgetContent slug={slug} data={data ?? {}} />
          )}
        </WidgetCard>
      )}
    </div>
  );
}

function WidgetContent({ slug, data }: { slug: string; data: Record<string, unknown> }) {
  if (data.placeholder) {
    return <EmptyState title={String(data.message ?? 'Coming soon')} />;
  }

  switch (slug) {
    case 'today_tasks':
      return <TaskList items={(data.tasks as Record<string, unknown>[]) ?? []} emptyLabel="No tasks for today" />;
    case 'my_projects':
      return <ProjectList items={(data.projects as Record<string, unknown>[]) ?? []} />;
    case 'project_progress':
      return <ProgressList items={(data.items as { name: string; progress: number }[]) ?? []} average={Number(data.averageProgress ?? 0)} />;
    case 'upcoming_deadlines':
      return <DeadlineList items={(data.deadlines as Record<string, unknown>[]) ?? []} />;
    case 'recent_notifications':
      return <NotificationList items={(data.notifications as Record<string, unknown>[]) ?? []} unread={Number(data.unreadCount ?? 0)} />;
    case 'recent_activities':
      return <ActivityList items={(data.activities as Record<string, unknown>[]) ?? []} />;
    case 'announcements':
      return <AnnouncementList items={(data.announcements as Record<string, unknown>[]) ?? []} />;
    case 'quick_links':
      return <QuickLinks links={(data.links as { label: string; path: string }[]) ?? []} />;
    case 'upcoming_birthdays':
      return <PeopleList items={(data.birthdays as { firstName: string; lastName: string; dateOfBirth?: string }[]) ?? []} label="birthday" />;
    case 'work_anniversaries':
      return <PeopleList items={(data.anniversaries as { firstName: string; lastName: string; years: number }[]) ?? []} label="anniversary" />;
    case 'manager_messages':
      return <ManagerMessages manager={data.manager as { firstName: string; lastName: string } | null} messages={(data.messages as Record<string, unknown>[]) ?? []} />;
    default:
      return <EmptyState title="Widget not configured" />;
  }
}

function TaskList({ items, emptyLabel }: { items: Record<string, unknown>[]; emptyLabel: string }) {
  if (items.length === 0) return <EmptyState title={emptyLabel} />;
  return (
    <ul className="space-y-2">
      {items.map((task) => (
        <li key={String(task.id)} className="rounded border px-3 py-2 text-sm">
          <p className="font-medium">{String(task.title)}</p>
          <p className="text-xs text-muted-foreground">{String(task.status)}</p>
        </li>
      ))}
    </ul>
  );
}

function ProjectList({ items }: { items: Record<string, unknown>[] }) {
  if (items.length === 0) return <EmptyState title="No projects assigned" />;
  return (
    <ul className="space-y-2">
      {items.map((item) => {
        const project = item.project as Record<string, unknown> | null;
        if (!project) return null;
        return (
          <li key={String(project.id)}>
            <Link to={ROUTES.WORKSPACE_PROJECTS} className="block rounded border px-3 py-2 text-sm hover:bg-muted">
              <span className="font-medium">{String(project.name)}</span>
              <span className="ml-2 text-xs text-muted-foreground">{String(item.role ?? '')}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function ProgressList({ items, average }: { items: { name: string; progress: number }[]; average: number }) {
  if (items.length === 0) return <EmptyState title="No project progress data" />;
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Average progress: <span className="font-semibold text-foreground">{average}%</span></p>
      {items.map((item) => (
        <div key={item.name}>
          <div className="mb-1 flex justify-between text-xs">
            <span>{item.name}</span>
            <span>{item.progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted">
            <div className="h-2 rounded-full bg-primary" style={{ width: `${item.progress}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function DeadlineList({ items }: { items: Record<string, unknown>[] }) {
  if (items.length === 0) return <EmptyState title="No upcoming deadlines" />;
  return (
    <ul className="space-y-2 text-sm">
      {items.map((d) => (
        <li key={String(d.id)} className="flex justify-between border-b pb-2 last:border-0">
          <span>{String(d.title)}</span>
          <span className="text-xs text-muted-foreground">{d.dueDate ? new Date(String(d.dueDate)).toLocaleDateString() : '—'}</span>
        </li>
      ))}
    </ul>
  );
}

function NotificationList({ items, unread }: { items: Record<string, unknown>[]; unread: number }) {
  return (
    <div>
      {unread > 0 && <p className="mb-2 text-xs text-primary">{unread} unread</p>}
      {items.length === 0 ? (
        <EmptyState title="No notifications" />
      ) : (
        <ul className="space-y-2 text-sm">
          {items.map((n) => (
            <li key={String(n.id)} className={`rounded border px-3 py-2 ${n.readAt ? '' : 'border-primary/30 bg-primary/5'}`}>
              <p className="font-medium">{String(n.title)}</p>
              <p className="text-xs text-muted-foreground line-clamp-2">{String(n.body)}</p>
            </li>
          ))}
        </ul>
      )}
      <Link to={ROUTES.WORKSPACE_NOTIFICATIONS} className="mt-3 inline-block text-xs text-primary hover:underline">View all</Link>
    </div>
  );
}

function ActivityList({ items }: { items: Record<string, unknown>[] }) {
  if (items.length === 0) return <EmptyState title="No recent activity" />;
  return (
    <ul className="space-y-2 text-sm">
      {items.map((a) => (
        <li key={String(a.id)} className="border-b pb-2 last:border-0">
          <p>{String(a.description)}</p>
          <p className="text-xs text-muted-foreground">{a.createdAt ? new Date(String(a.createdAt)).toLocaleString() : ''}</p>
        </li>
      ))}
    </ul>
  );
}

function AnnouncementList({ items }: { items: Record<string, unknown>[] }) {
  if (items.length === 0) return <EmptyState title="No announcements" />;
  return (
    <ul className="space-y-2 text-sm">
      {items.map((a) => (
        <li key={String(a.id)} className="rounded border px-3 py-2">
          {a.isPinned ? <span className="mr-2 text-xs font-medium text-primary">Pinned</span> : null}
          <p className="font-medium">{String(a.title)}</p>
        </li>
      ))}
    </ul>
  );
}

function QuickLinks({ links }: { links: { label: string; path: string }[] }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {links.map((link) => (
        <Link key={link.path} to={link.path} className="rounded border px-3 py-2 text-sm hover:bg-muted">
          {link.label}
        </Link>
      ))}
    </div>
  );
}

function PeopleList({ items, label }: { items: { firstName: string; lastName: string; years?: number; dateOfBirth?: string }[]; label: string }) {
  if (items.length === 0) return <EmptyState title={`No upcoming ${label}s this month`} />;
  return (
    <ul className="space-y-2 text-sm">
      {items.map((p, i) => (
        <li key={`${p.firstName}-${i}`} className="flex justify-between">
          <span>{p.firstName} {p.lastName}</span>
          <span className="text-xs text-muted-foreground">
            {label === 'anniversary' && p.years ? `${p.years}y` : p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
          </span>
        </li>
      ))}
    </ul>
  );
}

function ManagerMessages({ manager, messages }: { manager: { firstName: string; lastName: string } | null; messages: Record<string, unknown>[] }) {
  return (
    <div>
      {manager ? (
        <p className="mb-2 text-sm text-muted-foreground">Manager: <span className="font-medium text-foreground">{manager.firstName} {manager.lastName}</span></p>
      ) : (
        <p className="mb-2 text-sm text-muted-foreground">No manager assigned</p>
      )}
      {messages.length === 0 ? (
        <EmptyState title="No messages" />
      ) : (
        <ul className="space-y-2 text-sm">
          {messages.map((m) => (
            <li key={String(m.id)} className="rounded border px-3 py-2">{String(m.title)}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
