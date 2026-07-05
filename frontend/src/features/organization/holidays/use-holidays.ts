import { useQuery } from '@tanstack/react-query';
import { fetchAllHolidays } from '@/features/organization/holidays/holiday.api';
import type { ListQueryParams } from '@/features/organization/api/organization.api';

export function holidayQueryKey(params: Omit<ListQueryParams, 'page' | 'pageSize'> = {}) {
  return ['organization', 'holiday', 'all', params] as const;
}

export function useAllHolidays(params: Omit<ListQueryParams, 'page' | 'pageSize'> = {}) {
  return useQuery({
    queryKey: holidayQueryKey(params),
    queryFn: () => fetchAllHolidays(params),
    refetchOnMount: true,
  });
}
