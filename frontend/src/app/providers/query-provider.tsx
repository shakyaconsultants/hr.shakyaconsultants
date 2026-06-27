import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { ON_DEMAND_QUERY_OPTIONS } from '@/shared/api/query-config';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: ON_DEMAND_QUERY_OPTIONS,
  },
});

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
