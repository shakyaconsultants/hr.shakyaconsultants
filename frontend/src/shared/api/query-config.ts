import axios from 'axios';

function isRateLimited(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    return error.response?.status === 429;
  }
  if (error && typeof error === 'object' && 'status' in error) {
    return (error as { status?: number }).status === 429;
  }
  return false;
}

function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (isRateLimited(error)) {
    return false;
  }
  return failureCount < 1;
}

/** Live data defaults — cache briefly; avoid refetch storms on login/refresh. */
export const ON_DEMAND_QUERY_OPTIONS = {
  staleTime: 30_000,
  gcTime: 10 * 60_000,
  refetchOnMount: true,
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
  retry: shouldRetryQuery,
} as const;

/** Master data (org entities, settings lists) — short cache, still refreshes on mount. */
export const MASTER_DATA_QUERY_OPTIONS = {
  ...ON_DEMAND_QUERY_OPTIONS,
  staleTime: 60_000,
  gcTime: 30 * 60_000,
} as const;

/** Invalidate matching queries and immediately refetch active ones (lists, dashboards). */
export async function invalidateAndRefetch(
  queryClient: import('@tanstack/react-query').QueryClient,
  queryKey: readonly unknown[],
): Promise<void> {
  await queryClient.invalidateQueries({ queryKey });
  await queryClient.refetchQueries({ queryKey, type: 'active' });
}
