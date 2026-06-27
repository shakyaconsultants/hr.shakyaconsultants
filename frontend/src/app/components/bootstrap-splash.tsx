import { Loader2, RefreshCw, WifiOff } from 'lucide-react';
import { APP_CONFIG } from '@/config/app.config';
import { Button } from '@/shared/components/ui/button';

interface BootstrapSplashProps {
  message?: string;
  error?: string | null;
  onRetry?: () => void;
}

/** Lightweight full-screen splash shown while AUTH_LOADING — blocks all routes. */
export function BootstrapSplash({
  message = 'Starting HR Shakya…',
  error = null,
  onRetry,
}: BootstrapSplashProps) {
  const isTransientError = Boolean(error);

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6"
      role="status"
      aria-live="polite"
      aria-busy={!isTransientError}
    >
      {isTransientError ? (
        <WifiOff className="h-9 w-9 text-muted-foreground" aria-hidden="true" />
      ) : (
        <Loader2 className="h-9 w-9 animate-spin text-primary" aria-hidden="true" />
      )}
      <div className="max-w-sm text-center">
        <p className="text-sm font-medium text-foreground">
          {isTransientError ? 'Connection problem' : message}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {isTransientError ? error : 'Securing your session'}
        </p>
      </div>
      {isTransientError && onRetry ? (
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      ) : null}
      {import.meta.env.DEV || import.meta.env.VITE_AUTH_DEBUG === 'true' ? (
        <p className="text-[10px] text-muted-foreground/70">
          {APP_CONFIG.authUseHttpOnlyCookies ? 'cookie auth' : 'bearer auth'}
        </p>
      ) : null}
    </div>
  );
}
