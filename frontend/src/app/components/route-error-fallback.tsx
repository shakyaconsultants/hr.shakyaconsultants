import { useRouteError, isRouteErrorResponse, Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { ROUTES } from '@/config/app.config';
import { logClientError } from '@/shared/utils/error-logger';
import { useEffect } from 'react';

export function RouteErrorFallback() {
  const error = useRouteError();
  const navigate = useNavigate();

  useEffect(() => {
    logClientError(error, { source: 'route-error', route: window.location.pathname });
  }, [error]);

  let title = 'Unexpected error';
  let description = 'Something went wrong while loading this page.';
  let statusCode = 'Error';

  if (isRouteErrorResponse(error)) {
    statusCode = String(error.status);
    if (error.status === 404) {
      title = 'Page not found';
      description = 'The page you requested does not exist.';
    } else if (error.status === 403) {
      title = 'Access denied';
      description = 'You do not have permission to view this page.';
    } else if (error.status === 401) {
      title = 'Authentication required';
      description = 'Please sign in to continue.';
    } else if (error.status >= 500) {
      title = 'Server error';
      description = 'Our servers encountered a problem. Please try again.';
    }
  } else if (error instanceof Error) {
    description = error.message;
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-xl border bg-card p-8 text-center shadow-sm">
        <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-destructive" aria-hidden />
        <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">{statusCode}</p>
        <h1 className="mt-2 text-2xl font-bold">{title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{description}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go back
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
          <Button asChild>
            <Link to={ROUTES.WORKSPACE}>Go to workspace</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
