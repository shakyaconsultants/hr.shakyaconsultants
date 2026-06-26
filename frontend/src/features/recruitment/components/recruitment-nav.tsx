import { Link, useLocation } from 'react-router-dom';
import { ROUTES } from '@/config/app.config';
import { cn } from '@/shared/utils/cn';

const NAV_ITEMS = [
  { label: 'Dashboard', path: ROUTES.RECRUITMENT },
  { label: 'Candidates', path: ROUTES.RECRUITMENT_CANDIDATES },
  { label: 'Pipeline', path: ROUTES.RECRUITMENT_PIPELINE },
  { label: 'Interviews', path: ROUTES.RECRUITMENT_INTERVIEWS },
] as const;

export function RecruitmentNav() {
  const location = useLocation();

  return (
    <nav className="flex flex-wrap gap-1 border-b pb-px">
      {NAV_ITEMS.map((item) => {
        const isActive =
          location.pathname === item.path ||
          (item.path !== ROUTES.RECRUITMENT && location.pathname.startsWith(item.path));
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
