import { Outlet, Link } from 'react-router-dom';
import { APP_CONFIG, ROUTES } from '@/config/app.config';

export function RootLayout() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-14 items-center gap-6 px-4">
          <Link to={ROUTES.HOME} className="text-lg font-semibold">
            {APP_CONFIG.name}
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link to={ROUTES.HOME} className="text-muted-foreground hover:text-foreground">
              Home
            </Link>
            <Link to={ROUTES.ORGANIZATION} className="text-muted-foreground hover:text-foreground">
              Organization
            </Link>
            <Link to={ROUTES.RBAC} className="text-muted-foreground hover:text-foreground">
              Access Control
            </Link>
            <Link to={ROUTES.EMPLOYEES} className="text-muted-foreground hover:text-foreground">
              Employees
            </Link>
            <Link to={ROUTES.RECRUITMENT} className="text-muted-foreground hover:text-foreground">
              Recruitment
            </Link>
            <Link to={ROUTES.PROJECTS} className="text-muted-foreground hover:text-foreground">
              Projects
            </Link>
            <Link to={ROUTES.WORKSPACE} className="text-muted-foreground hover:text-foreground">
              Workspace
            </Link>
            <Link to={ROUTES.LEAVE_EXIT} className="text-muted-foreground hover:text-foreground">
              Leave & Exit
            </Link>
            <Link to={ROUTES.APPROVAL_INBOX} className="text-muted-foreground hover:text-foreground">
              Approvals
            </Link>
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
