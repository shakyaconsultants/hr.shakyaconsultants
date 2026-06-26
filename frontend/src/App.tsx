import { QueryProvider } from '@/app/providers/query-provider';
import { ThemeProvider } from '@/app/providers/theme-provider';
import { AuthProvider } from '@/app/providers/auth-provider';
import { AppRouter } from '@/app/routes/router';

export function App() {
  return (
    <QueryProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}
