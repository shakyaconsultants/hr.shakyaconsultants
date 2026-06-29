import { QueryProvider } from '@/app/providers/query-provider';
import { ThemeProvider } from '@/app/providers/theme-provider';
import { AuthProvider } from '@/app/providers/auth-provider';
import { AppRouter } from '@/app/routes/router';
import { AppErrorBoundary } from '@/app/components/app-error-boundary';
import { ToastProvider } from '@/shared/feedback/toast-provider';

export function App() {
  return (
    <AppErrorBoundary>
      <QueryProvider>
        <ThemeProvider>
          <AuthProvider>
            <AppRouter />
            <ToastProvider />
          </AuthProvider>
        </ThemeProvider>
      </QueryProvider>
    </AppErrorBoundary>
  );
}
