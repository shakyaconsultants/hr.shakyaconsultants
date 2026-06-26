import { QueryProvider } from '@/app/providers/query-provider';
import { ThemeProvider } from '@/app/providers/theme-provider';
import { AuthProvider } from '@/app/providers/auth-provider';
import { AppRouter } from '@/app/routes/router';
import { AppErrorBoundary } from '@/app/components/app-error-boundary';

export function App() {
  return (
    <AppErrorBoundary>
      <QueryProvider>
        <ThemeProvider>
          <AuthProvider>
            <AppRouter />
          </AuthProvider>
        </ThemeProvider>
      </QueryProvider>
    </AppErrorBoundary>
  );
}
