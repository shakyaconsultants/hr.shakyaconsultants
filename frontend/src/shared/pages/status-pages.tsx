import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { ROUTES } from '@/config/app.config';
import { Button } from '@/shared/components/ui/button';

interface EnterpriseStatusPageProps {
  code: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionTo?: string;
  showBack?: boolean;
  showRetry?: boolean;
  onRetry?: () => void;
}

function EnterpriseStatusPage({
  code,
  title,
  description,
  actionLabel = 'Sign in',
  actionTo = ROUTES.LOGIN,
  showBack = true,
  showRetry = false,
  onRetry,
}: EnterpriseStatusPageProps) {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/20 p-6">
      <div className="w-full max-w-lg rounded-xl border bg-card p-10 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">{code}</p>
        <h1 className="mt-3 text-3xl font-bold">{title}</h1>
        <p className="mt-3 text-muted-foreground">{description}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {showBack ? (
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go back
            </Button>
          ) : null}
          {showRetry ? (
            <Button variant="outline" onClick={onRetry ?? (() => window.location.reload())}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          ) : null}
          <Button asChild>
            <Link to={actionTo}>{actionLabel}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export function UnauthorizedPage() {
  return <EnterpriseStatusPage code="401" title="Authentication required" description="Please sign in to continue." />;
}

export function ForbiddenPage() {
  return (
    <EnterpriseStatusPage
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
    <EnterpriseStatusPage
      code="404"
      title="Page not found"
      description="The page you requested does not exist or has moved."
      actionLabel="Go to workspace"
      actionTo={ROUTES.WORKSPACE}
    />
  );
}

export function ServerErrorPage() {
  return (
    <EnterpriseStatusPage
      code="500"
      title="Server error"
      description="Our servers encountered a problem. Please try again shortly."
      actionLabel="Go to workspace"
      actionTo={ROUTES.WORKSPACE}
      showRetry
    />
  );
}

export function NetworkErrorPage() {
  return (
    <EnterpriseStatusPage
      code="Network"
      title="Connection problem"
      description="We could not reach the server. Check your network and try again."
      actionLabel="Go to workspace"
      actionTo={ROUTES.WORKSPACE}
      showRetry
    />
  );
}

export function OfflinePage() {
  return (
    <EnterpriseStatusPage
      code="Offline"
      title="You are offline"
      description="Reconnect to the internet to continue working in the ERP."
      actionLabel="Go to workspace"
      actionTo={ROUTES.WORKSPACE}
      showRetry
    />
  );
}

export function ModuleLoadFailurePage() {
  return (
    <EnterpriseStatusPage
      code="Module load"
      title="Failed to load module"
      description="A part of the application could not be loaded. Reload or return to a safe page."
      actionLabel="Go to workspace"
      actionTo={ROUTES.WORKSPACE}
      showRetry
    />
  );
}

export function DataLoadFailurePage() {
  return (
    <EnterpriseStatusPage
      code="Data load"
      title="Failed to load data"
      description="The page loaded but required data could not be retrieved."
      actionLabel="Go to workspace"
      actionTo={ROUTES.WORKSPACE}
      showRetry
    />
  );
}

export function UnexpectedErrorPage() {
  return (
    <EnterpriseStatusPage
      code="Error"
      title="Unexpected error"
      description="Something went wrong. Our team has been notified if logging is enabled."
      actionLabel="Go to workspace"
      actionTo={ROUTES.WORKSPACE}
      showRetry
    />
  );
}

export function SessionExpiredPage() {
  return (
    <EnterpriseStatusPage
      code="Session expired"
      title="Your session ended"
      description="Sign in again to continue working securely."
    />
  );
}

export function MaintenancePage() {
  return (
    <EnterpriseStatusPage
      code="Maintenance"
      title="System maintenance"
      description="The ERP is temporarily unavailable. Please try again shortly."
      actionLabel="Retry sign in"
      showRetry
    />
  );
}
