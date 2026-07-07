/** Live data defaults — refetch when screens mount or after mutations invalidate cache. */
export const ON_DEMAND_QUERY_OPTIONS = {
  staleTime: 0,
  gcTime: 10 * 60_000,
  refetchOnMount: true,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
  retry: 1,
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
