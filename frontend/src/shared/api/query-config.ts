/** On-demand query defaults — no automatic refetching; cache after first successful fetch. */
export const ON_DEMAND_QUERY_OPTIONS = {
  staleTime: 5 * 60_000,
  gcTime: 30 * 60_000,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  retry: 1,
} as const;

/** Master data (org entities, settings lists) — longer cache, still on-demand only. */
export const MASTER_DATA_QUERY_OPTIONS = {
  ...ON_DEMAND_QUERY_OPTIONS,
  staleTime: 30 * 60_000,
  gcTime: 60 * 60_000,
} as const;
