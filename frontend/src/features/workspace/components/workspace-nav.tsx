import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, User, FolderKanban, CheckSquare, FileText, Bell, Megaphone, Calendar, Activity, Search, MessageSquare } from 'lucide-react';
import { ROUTES } from '@/config/app.config';

const NAV_ITEMS = [
  { to: ROUTES.WORKSPACE, label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: ROUTES.WORKSPACE_PROFILE, label: 'Profile', icon: User },
  { to: ROUTES.WORKSPACE_PROJECTS, label: 'My Projects', icon: FolderKanban },
  { to: ROUTES.WORKSPACE_TASKS, label: 'My Tasks', icon: CheckSquare },
  { to: ROUTES.WORKSPACE_DOCUMENTS, label: 'Documents', icon: FileText },
  { to: ROUTES.WORKSPACE_MESSAGES, label: 'Messages', icon: MessageSquare },
  { to: ROUTES.WORKSPACE_NOTIFICATIONS, label: 'Notifications', icon: Bell },
  { to: ROUTES.WORKSPACE_ANNOUNCEMENTS, label: 'Announcements', icon: Megaphone },
  { to: ROUTES.WORKSPACE_CALENDAR, label: 'Calendar', icon: Calendar },
  { to: ROUTES.WORKSPACE_ACTIVITY, label: 'Activity', icon: Activity },
  { to: ROUTES.WORKSPACE_SEARCH, label: 'Search', icon: Search },
];

export function WorkspaceNav() {
  const location = useLocation();

  return (
    <nav className="flex flex-wrap gap-2 border-b pb-4" aria-label="Workspace navigation">
      {NAV_ITEMS.map(({ to, label, icon: Icon, exact }) => {
        const active = exact ? location.pathname === to : location.pathname.startsWith(to);
        return (
          <Link
            key={to}
            to={to}
            className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function WorkspacePageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold">{title}</h1>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}
