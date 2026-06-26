import { Link } from 'react-router-dom';
import { ROUTES } from '@/config/app.config';
import { Button } from '@/shared/components/ui/button';

interface StatusPageProps {
  code: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionTo?: string;
}

function StatusPage({ code, title, description, actionLabel = 'Sign in', actionTo = ROUTES.LOGIN }: StatusPageProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/20 p-6">
      <div className="w-full max-w-lg rounded-xl border bg-card p-10 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">{code}</p>
        <h1 className="mt-3 text-3xl font-bold">{title}</h1>
        <p className="mt-3 text-muted-foreground">{description}</p>
        <Button asChild className="mt-8">
          <Link to={actionTo}>{actionLabel}</Link>
        </Button>
      </div>
    </div>
  );
}

export function UnauthorizedPage() {
  return <StatusPage code="401" title="Authentication required" description="Please sign in to continue." />;
}

export function ForbiddenPage() {
  return (
    <StatusPage
      code="403"
      title="Access denied"
      description="You do not have permission to view this page."
      actionLabel="Go to workspace"
      actionTo={ROUTES.WORKSPACE}
    />
  );
}

export function NotFoundPage() {
  return (
    <StatusPage
      code="404"
      title="Page not found"
      description="The page you requested does not exist or has moved."
      actionLabel="Go to workspace"
      actionTo={ROUTES.WORKSPACE}
    />
  );
}

export function SessionExpiredPage() {
  return <StatusPage code="Session expired" title="Your session ended" description="Sign in again to continue working securely." />;
}

export function MaintenancePage() {
  return (
    <StatusPage
      code="Maintenance"
      title="System maintenance"
      description="The ERP is temporarily unavailable. Please try again shortly."
      actionLabel="Retry sign in"
    />
  );
}
