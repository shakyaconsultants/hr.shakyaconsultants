import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Building2, GitBranch, Mail, Users } from 'lucide-react';
import { ROUTES } from '@/config/app.config';
import { useAuthStore } from '@/shared/stores/app.store';
import { cn } from '@/shared/utils/cn';
import type { OrgChartEmployee } from '@/features/admin/components/org-chart/org-chart.types';

function initials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function avatarTone(seed: string): string {
  const tones = [
    'bg-sky-500/15 text-sky-700 dark:text-sky-300',
    'bg-violet-500/15 text-violet-700 dark:text-violet-300',
    'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    'bg-amber-500/15 text-amber-700 dark:text-amber-300',
    'bg-rose-500/15 text-rose-700 dark:text-rose-300',
    'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300',
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return tones[Math.abs(hash) % tones.length] ?? tones[0];
}

export function OrgChartConnector({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col items-center', className)} aria-hidden>
      <div className="h-6 w-px bg-border" />
      <div className="h-2 w-2 rounded-full border-2 border-border bg-background" />
    </div>
  );
}

export function OrgChartHorizontalRail({ childCount }: { childCount: number }) {
  if (childCount <= 1) return <OrgChartConnector />;

  return (
    <div className="relative flex w-full flex-col items-center" aria-hidden>
      <div className="h-6 w-px bg-border" />
      <div className="relative h-px w-full max-w-full bg-border">
        <div className="absolute left-0 top-1/2 h-3 w-px -translate-y-1/2 bg-border" />
        <div className="absolute right-0 top-1/2 h-3 w-px -translate-y-1/2 bg-border" />
      </div>
    </div>
  );
}

interface NodeCardProps {
  title: string;
  subtitle?: string;
  meta?: string;
  icon: ReactNode;
  accent?: 'company' | 'branch' | 'department';
  className?: string;
}

export function OrgChartNodeCard({
  title,
  subtitle,
  meta,
  icon,
  accent = 'branch',
  className,
}: NodeCardProps) {
  const accentStyles = {
    company:
      'border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card shadow-md ring-1 ring-primary/20',
    branch: 'border-border bg-card shadow-sm hover:border-primary/30 hover:shadow-md',
    department: 'border-border/80 bg-muted/20 shadow-sm hover:border-primary/20 hover:bg-muted/30',
  } as const;

  return (
    <div
      className={cn(
        'relative min-w-[200px] max-w-[240px] rounded-xl border px-4 py-3 transition-all',
        accentStyles[accent],
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
            accent === 'company'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground',
          )}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-tight">{title}</p>
          {subtitle ? (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>
          ) : null}
          {meta ? (
            <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              <Users className="h-3 w-3" />
              {meta}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function OrgChartCompanyNode({
  name,
  code,
  employeeCount,
}: {
  name: string;
  code: string;
  employeeCount: number;
}) {
  return (
    <OrgChartNodeCard
      accent="company"
      title={name}
      subtitle={code ? `Code: ${code}` : undefined}
      meta={`${employeeCount} people`}
      icon={<Building2 className="h-5 w-5" />}
      className="min-w-[260px] max-w-[320px]"
    />
  );
}

export function OrgChartBranchNode({
  name,
  code,
  employeeCount,
}: {
  name: string;
  code: string;
  employeeCount: number;
}) {
  return (
    <OrgChartNodeCard
      accent="branch"
      title={name}
      subtitle={code}
      meta={`${employeeCount} people`}
      icon={<GitBranch className="h-4 w-4" />}
    />
  );
}

export function OrgChartDepartmentNode({
  name,
  code,
  employeeCount,
}: {
  name: string;
  code: string;
  employeeCount: number;
}) {
  return (
    <OrgChartNodeCard
      accent="department"
      title={name}
      subtitle={code}
      meta={`${employeeCount} members`}
      icon={<Users className="h-4 w-4" />}
      className="min-w-[180px] max-w-[220px]"
    />
  );
}

export function OrgChartEmployeeCard({
  employee,
  compact = false,
  variant = 'default',
}: {
  employee: OrgChartEmployee;
  compact?: boolean;
  variant?: 'default' | 'admin';
}) {
  const fullName = `${employee.firstName} ${employee.lastName}`.trim();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canOpenProfile = hasPermission('employee.read');

  const cardBody = (
    <>
      {employee.photoUrl ? (
        <img
          src={employee.photoUrl}
          alt=""
          className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-background"
        />
      ) : (
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ring-2 ring-background',
            avatarTone(employee.id),
          )}
        >
          {initials(employee.firstName, employee.lastName)}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'truncate text-sm font-medium leading-tight',
            canOpenProfile && 'group-hover:text-primary',
          )}
        >
          {fullName}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {variant === 'admin' ? 'Admin · ' : ''}
          {employee.designationName}
        </p>
        {!compact ? (
          <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-muted-foreground/80">
            <Mail className="h-3 w-3 shrink-0" />
            {employee.email}
          </p>
        ) : null}
      </div>
    </>
  );

  const className = cn(
    'group flex items-center gap-2.5 rounded-lg border bg-card px-3 py-2 shadow-sm transition-all',
    variant === 'admin' && 'min-w-[220px] border-primary/40 bg-primary/5 ring-1 ring-primary/20',
    canOpenProfile && 'hover:border-primary/40 hover:bg-primary/5 hover:shadow-md',
    compact ? 'min-w-[160px]' : 'min-w-[190px]',
  );

  if (!canOpenProfile) {
    return <div className={className}>{cardBody}</div>;
  }

  return (
    <Link to={ROUTES.employeeDetail(employee.id)} className={className}>
      {cardBody}
    </Link>
  );
}
