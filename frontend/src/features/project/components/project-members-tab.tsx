import { Mail, User } from 'lucide-react';
import type { ProjectMemberRecord } from '@/features/project/api/project.api';
import { cn } from '@/shared/utils/cn';

const ROLE_LABELS: Record<string, string> = {
  project_manager: 'Project Manager',
  assistant_project_manager: 'Assistant PM',
  developer: 'Developer',
  qa: 'QA',
  designer: 'Designer',
  devops: 'DevOps',
  business_analyst: 'Business Analyst',
  intern: 'Intern',
  owner: 'Owner',
  viewer: 'Viewer',
};

function formatRole(role: string): string {
  return (
    ROLE_LABELS[role] ??
    role
      .split('_')
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(' ')
  );
}

function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
  }
  return (parts[0]?.slice(0, 2) ?? '?').toUpperCase();
}

interface ProjectMembersTabProps {
  members: ProjectMemberRecord[];
}

export function ProjectMembersTab({ members }: ProjectMembersTabProps) {
  if (members.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-muted/10 p-10 text-center">
        <User className="mx-auto h-8 w-8 text-muted-foreground/60" />
        <p className="mt-3 text-sm font-medium">No team members yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Assign members from the Administration tab or during project setup.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {members.map((member) => {
        const displayName = member.employeeName ?? 'Unknown member';
        return (
          <article
            key={String(member.id)}
            className="flex gap-4 rounded-xl border bg-card p-4 shadow-sm transition-colors hover:border-primary/30"
          >
            <div
              className={cn(
                'flex h-12 w-12 shrink-0 items-center justify-center rounded-full',
                'bg-primary/10 text-sm font-bold text-primary',
              )}
            >
              {getInitials(member.employeeName)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold">{displayName}</h3>
                  {member.employeeNumber && (
                    <p className="text-xs text-muted-foreground">{member.employeeNumber}</p>
                  )}
                </div>
                <span className="shrink-0 rounded-full border bg-primary/5 px-2.5 py-0.5 text-xs font-medium text-primary">
                  {formatRole(String(member.role))}
                </span>
              </div>
              {member.employeeEmail && (
                <p className="mt-2 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                  <Mail className="h-3 w-3 shrink-0" />
                  {member.employeeEmail}
                </p>
              )}
              {typeof member.allocationPercent === 'number' && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Allocation:{' '}
                  <span className="font-medium text-foreground">{member.allocationPercent}%</span>
                </p>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
