import type { ReactNode } from 'react';
import { AlertTriangle, Lock, RefreshCw, WifiOff } from 'lucide-react';
import { EmptyState } from '@/shared/components/empty-state';
import { PageSkeleton } from '@/shared/components/page-skeleton';
import { Button } from '@/shared/components/ui/button';
import { logClientError } from '@/shared/utils/error-logger';
import { useEffect } from 'react';

export interface PageDataBoundaryProps {
  isLoading?: boolean;
  isError?: boolean;
  error?: unknown;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  denied?: boolean;
  deniedMessage?: string;
  onRetry?: () => void;
  loadingFallback?: ReactNode;
  source?: string;
  children: ReactNode;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'error' in error) {
    const apiError = error as { error?: { message?: string } };
    return apiError.error?.message ?? 'Something went wrong while loading data.';
  }
  return 'Something went wrong while loading data.';
}

export function PageDataBoundary({
  isLoading = false,
  isError = false,
  error,
  isEmpty = false,
  emptyTitle = 'No data yet',
  emptyDescription,
  emptyAction,
  denied = false,
  deniedMessage = 'You do not have permission to view this content.',
  onRetry,
  loadingFallback,
  source = 'page',
  children,
}: PageDataBoundaryProps) {
  useEffect(() => {
    if (isError && error) {
      logClientError(error, { source, route: window.location.pathname });
    }
  }, [isError, error, source]);

  if (denied) {
    return (
      <EmptyState
        title="Access denied"
        description={deniedMessage}
        icon={<Lock className="h-10 w-10" aria-hidden />}
      />
    );
  }

  if (isLoading) {
    return <>{loadingFallback ?? <PageSkeleton />}</>;
  }

  if (isError) {
    const offline = typeof navigator !== 'undefined' && !navigator.onLine;
    return (
      <EmptyState
        title={offline ? 'You are offline' : 'Unable to load data'}
        description={offline ? 'Check your connection and try again.' : getErrorMessage(error)}
        icon={offline ? <WifiOff className="h-10 w-10" aria-hidden /> : <AlertTriangle className="h-10 w-10" aria-hidden />}
        action={
          onRetry ? (
            <Button variant="outline" onClick={onRetry}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          ) : null
        }
      />
    );
  }

  if (isEmpty) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  return <>{children}</>;
}
