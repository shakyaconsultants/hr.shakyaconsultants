import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { logClientError } from '@/shared/utils/error-logger';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  message?: string;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logClientError(error, { source: 'react-boundary', extra: { componentStack: info.componentStack } });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-muted/20 p-6">
          <div className="w-full max-w-lg rounded-xl border bg-card p-8 text-center shadow-sm">
            <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-destructive" aria-hidden />
            <h1 className="text-2xl font-bold">Unexpected application error</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              {this.state.message ?? 'The application encountered an unexpected problem.'}
            </p>
            <Button className="mt-6" onClick={() => window.location.reload()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Reload application
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
