import type { ProjectRecord } from '@/features/project/api/project.api';
import {
  formatProjectRole,
  formatProjectStatus,
} from '@/features/project/utils/project-display.util';

interface ProjectDetailHeaderProps {
  project: ProjectRecord;
  memberRole?: string;
  accessLabel?: string;
}

export function ProjectDetailHeader({
  project,
  memberRole,
  accessLabel,
}: ProjectDetailHeaderProps) {
  return (
    <div className="flex flex-wrap items-start gap-6 rounded-xl border bg-gradient-to-br from-card to-muted/20 p-6 shadow-sm">
      {project.logoUrl ? (
        <img
          src={project.logoUrl}
          alt=""
          className="h-16 w-16 rounded-xl object-cover ring-2 ring-primary/10"
        />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 text-xl font-bold text-primary ring-2 ring-primary/10">
          {project.code.slice(0, 2)}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
        <p className="font-mono text-sm text-muted-foreground">{project.code}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            {formatProjectStatus(project.status)}
          </span>
          {project.projectKind && (
            <span className="rounded-full border bg-background px-2.5 py-0.5 text-xs">
              {project.projectKind === 'internal' ? 'In-house' : 'External'}
            </span>
          )}
          {memberRole ? (
            <span className="rounded-full border bg-background px-2.5 py-0.5 text-xs">
              {formatProjectRole(memberRole)}
            </span>
          ) : (
            <span className="rounded-full border bg-background px-2.5 py-0.5 text-xs capitalize">
              {project.priority} priority
            </span>
          )}
          {accessLabel ? (
            <span className="rounded-full border bg-background px-2.5 py-0.5 text-xs text-muted-foreground">
              {accessLabel}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
