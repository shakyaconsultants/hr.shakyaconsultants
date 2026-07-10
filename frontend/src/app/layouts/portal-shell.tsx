import { Link, Outlet } from 'react-router-dom';
import { LogOut, Menu } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { APP_CONFIG } from '@/config/app.config';
import { getPortalHomeRoute, getPortalLabel, type PortalType } from '@/config/portals';
import { PortalSidebar } from '@/app/components/portal-sidebar';
import { useAuth } from '@/app/providers/auth-provider';
import { useAuthStore } from '@/shared/stores/app.store';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/cn';

export interface PortalShellProps {
  portal: PortalType;
  children?: ReactNode;
}

export function PortalShell({ portal, children }: PortalShellProps) {
  const { logout } = useAuth();
  const company = useAuthStore((s) => s.company);
  const user = useAuthStore((s) => s.user);
  const [mobileOpen, setMobileOpen] = useState(false);
  const homeRoute = getPortalHomeRoute(portal);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform lg:static lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="flex h-14 shrink-0 flex-col justify-center border-b border-sidebar-border px-4">
          <Link
            to={homeRoute}
            className="text-sm font-semibold leading-tight text-sidebar-foreground"
          >
            {APP_CONFIG.name}
          </Link>
          <span className="text-[11px] font-medium uppercase tracking-wider text-sidebar-muted-foreground">
            {getPortalLabel(portal)} Portal
          </span>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <PortalSidebar portal={portal} onNavigate={() => setMobileOpen(false)} />
        </div>
        <div className="shrink-0 border-t border-sidebar-border p-4 text-xs text-sidebar-muted-foreground">
          <p className="font-medium text-sidebar-foreground">{company?.name ?? 'Organization'}</p>
          <p>{user?.email ?? ''}</p>
        </div>
      </aside>

      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        />
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-card px-4">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={() => void logout()}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto bg-background p-4 md:p-6">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
}
