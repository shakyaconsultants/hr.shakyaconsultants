import { listEntities, type MasterDataRecord } from '@/features/organization/api/organization.api';
import type { ListQueryParams } from '@/features/organization/api/organization.api';
import { MASTER_DATA_MAX_PAGE_SIZE } from '@/features/organization/constants/master-data.constants';

export interface HolidayModuleRecord extends MasterDataRecord {
  moduleType?: string;
  calendarYear?: number;
  branchId?: string;
  departmentIds?: string[];
  description?: string;
}

export async function fetchAllHolidayModules(
  params: Omit<ListQueryParams, 'page' | 'pageSize'> = {},
): Promise<HolidayModuleRecord[]> {
  const items: HolidayModuleRecord[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const result = await listEntities('holiday-module', {
      ...params,
      page,
      pageSize: MASTER_DATA_MAX_PAGE_SIZE,
      sortBy: 'name',
      sortOrder: 'asc',
    });
    items.push(...(result.items as HolidayModuleRecord[]));
    totalPages = result.pagination?.totalPages ?? 1;
    page += 1;
  }

  return items;
}
