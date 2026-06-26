import { Link, useLocation } from 'react-router-dom';
import { ROUTES } from '@/config/app.config';
import { cn } from '@/shared/utils/cn';

const NAV_ITEMS = [
  { label: 'Inbox', path: ROUTES.APPROVAL_INBOX },
  { label: 'History', path: ROUTES.APPROVAL_HISTORY },
  { label: 'Workflows', path: ROUTES.APPROVAL_WORKFLOWS },
] as const;

export function ApprovalNav() {
  const location = useLocation();

  return (
    <nav className="flex flex-wrap gap-1 border-b pb-px">
      {NAV_ITEMS.map((item) => {
        const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              'rounded-t-md px-4 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'border border-b-0 border-border bg-card text-foreground'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function ApprovalPageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold">{title}</h1>
      {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
    </div>
  );
}
