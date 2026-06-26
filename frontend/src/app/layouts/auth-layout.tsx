import { Link, Outlet } from 'react-router-dom';
import { APP_CONFIG, ROUTES } from '@/config/app.config';

export function AuthLayout() {
  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-primary/80 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-widest text-white/70">Enterprise HR Platform</p>
          <h1 className="mt-4 text-4xl font-bold leading-tight">{APP_CONFIG.name}</h1>
          <p className="mt-4 max-w-md text-lg text-white/80">
            Secure access to your organization workspace, approvals, and employee services.
          </p>
        </div>
        <p className="text-sm text-white/60">Protected by role-based access control and session management.</p>
      </div>
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <Link to={ROUTES.LOGIN} className="mb-8 inline-block text-xl font-semibold lg:hidden">
            {APP_CONFIG.name}
          </Link>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export function PortalLayout() {
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background px-6 py-4">
        <p className="text-sm font-medium text-muted-foreground">Secure Portal</p>
        <h1 className="text-lg font-semibold">{APP_CONFIG.name}</h1>
      </header>
      <main className="container mx-auto max-w-3xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
