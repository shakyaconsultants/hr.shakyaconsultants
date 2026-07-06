import { listEntities, type MasterDataRecord } from '@/features/organization/api/organization.api';
import type { ListQueryParams } from '@/features/organization/api/organization.api';
import { MASTER_DATA_MAX_PAGE_SIZE } from '@/features/organization/constants/master-data.constants';

export interface HolidayRecord extends MasterDataRecord {
  date?: string;
  type?: string;
  holidayModuleId?: string;
  branchId?: string;
  dayOfWeek?: number;
  isRecurring?: boolean;
  recurrenceRule?: string;
  isOptional?: boolean;
  description?: string;
}

export async function fetchAllHolidays(
  params: Omit<ListQueryParams, 'page' | 'pageSize'> = {},
): Promise<HolidayRecord[]> {
  const items: HolidayRecord[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const result = await listEntities('holiday', {
      ...params,
      page,
      pageSize: MASTER_DATA_MAX_PAGE_SIZE,
      sortBy: 'date',
      sortOrder: 'asc',
    });
    items.push(...(result.items as HolidayRecord[]));
    totalPages = result.pagination?.totalPages ?? 1;
    page += 1;
  }

  return items;
}
