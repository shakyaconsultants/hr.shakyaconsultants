import type { ComponentType, ReactNode } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Layers,
  ListTodo,
  Tag,
} from 'lucide-react';
import type { ProjectRecord } from '@/features/project/api/project.api';
import type { ManagerDashboard } from '@/features/project/api/project.api';
import { cn } from '@/shared/utils/cn';

interface ProjectOverviewTabProps {
  project: ProjectRecord;
  dashboard?: ManagerDashboard | null;
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: ComponentType<{ className?: string }>;
  accent: string;
}) {
  return (
    <div className="rounded-xl border bg-gradient-to-br from-card to-muted/20 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 text-3xl font-bold tracking-tight">{value}</p>
        </div>
        <div className={cn('rounded-lg p-2.5', accent)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  title,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  icon: ComponentType<{ className?: string }>;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('rounded-xl border bg-card p-5 shadow-sm', className)}>
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="text-sm leading-relaxed text-foreground/90">{children}</div>
    </section>
  );
}

function formatStatus(slug: string): string {
  return slug
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function ProjectOverviewTab({ project, dashboard }: ProjectOverviewTabProps) {
  return (
    <div className="space-y-6">
      {dashboard && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Tasks"
            value={dashboard.totalTasks}
            icon={ListTodo}
            accent="bg-blue-500/10 text-blue-600 dark:text-blue-400"
          />
          <StatCard
            label="Blocked"
            value={dashboard.blockedTasks}
            icon={AlertCircle}
            accent="bg-red-500/10 text-red-600 dark:text-red-400"
          />
          <StatCard
            label="Overdue"
            value={dashboard.overdueTasks}
            icon={Clock}
            accent="bg-amber-500/10 text-amber-600 dark:text-amber-400"
          />
          <StatCard
            label="Pending Verifications"
            value={dashboard.pendingVerifications ?? 0}
            icon={CheckCircle2}
            accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {project.description && (
          <InfoCard title="Summary" icon={FileText} className="lg:col-span-2">
            <p className="whitespace-pre-wrap">{project.description}</p>
          </InfoCard>
        )}

        {project.requirements && (
          <InfoCard title="Requirements" icon={Layers} className="lg:col-span-2">
            <p className="whitespace-pre-wrap">{project.requirements}</p>
          </InfoCard>
        )}

        {(project.startDate || project.endDate || project.clientName) && (
          <InfoCard title="Timeline & Client" icon={Calendar}>
            <dl className="space-y-2">
              {project.startDate && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Start</dt>
                  <dd className="font-medium">
                    {new Date(project.startDate).toLocaleDateString()}
                  </dd>
                </div>
              )}
              {project.endDate && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">End</dt>
                  <dd className="font-medium">{new Date(project.endDate).toLocaleDateString()}</dd>
                </div>
              )}
              {project.clientName && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Client</dt>
                  <dd className="font-medium">{project.clientName}</dd>
                </div>
              )}
            </dl>
          </InfoCard>
        )}

        {project.scalabilityNotes && (
          <InfoCard title="Scalability & Tech Stack" icon={Layers}>
            <p className="whitespace-pre-wrap">{project.scalabilityNotes}</p>
          </InfoCard>
        )}

        {project.uiDocs && (
          <InfoCard title="UI / Design Docs" icon={FileText} className="lg:col-span-2">
            <p className="whitespace-pre-wrap">{project.uiDocs}</p>
          </InfoCard>
        )}

        {project.tags.length > 0 && (
          <InfoCard title="Tags" icon={Tag} className="lg:col-span-2">
            <div className="flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                >
                  {tag}
                </span>
              ))}
            </div>
          </InfoCard>
        )}

        {!project.description &&
          !project.requirements &&
          !project.scalabilityNotes &&
          !project.uiDocs &&
          project.tags.length === 0 && (
            <p className="text-sm text-muted-foreground lg:col-span-2">
              No overview details yet. Update project settings to add a summary and requirements.
            </p>
          )}
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="rounded-full border px-2.5 py-1">{formatStatus(project.status)}</span>
        {project.projectKind && (
          <span className="rounded-full border px-2.5 py-1">
            {project.projectKind === 'internal' ? 'In-house' : 'External'}
          </span>
        )}
        <span className="rounded-full border px-2.5 py-1 capitalize">
          {project.priority} priority
        </span>
      </div>
    </div>
  );
}
