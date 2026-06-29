/** Backend Zod schema caps list pageSize at 100; requests above that fail validation. */
export const MASTER_DATA_MAX_PAGE_SIZE = 100;

export function clampMasterDataPageSize(pageSize?: number): number {
  const value = pageSize ?? 20;
  return Math.min(MASTER_DATA_MAX_PAGE_SIZE, Math.max(1, value));
}

export function clampMasterDataListParams<T extends { pageSize?: number }>(params: T): T {
  return { ...params, pageSize: clampMasterDataPageSize(params.pageSize) };
}
