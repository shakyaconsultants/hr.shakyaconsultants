import { MasterDataCacheService } from '@modules/organization/shared/master-data-cache.service.js';
import { ModuleReportAdapter } from '@modules/reports/services/module-report.adapter.js';
import { CACHE_TTL } from '@modules/reports/constants/reports.constants.js';
import type { ReportFilters, ReportRequest } from '@modules/reports/types/reports.types.js';

function buildCacheKey(companyId: string, request: ReportRequest): string {
  return MasterDataCacheService.buildKey(
    companyId,
    'reports',
    `${request.domain}:${request.type}:${JSON.stringify(request.filters ?? {})}`,
  );
}

function applyGroupingAndSorting(data: unknown, filters: ReportFilters): unknown {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const record = data as Record<string, unknown>;

  if (filters.groupBy && Array.isArray(record.byDepartment)) {
    const grouped = record.byDepartment as Array<Record<string, unknown>>;
    const key = filters.groupBy;
    const map: Record<string, unknown[]> = {};
    for (const item of grouped) {
      const groupKey = String(item[key] ?? 'unknown');
      if (!map[groupKey]) map[groupKey] = [];
      map[groupKey].push(item);
    }
    return { ...record, grouped: map };
  }

  if (filters.sortBy && Array.isArray(record.byMonth)) {
    const items = [...(record.byMonth as Array<Record<string, unknown>>)];
    const sortKey = filters.sortBy;
    const order = filters.sortOrder === 'desc' ? -1 : 1;
    items.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * order;
      return String(av ?? '').localeCompare(String(bv ?? '')) * order;
    });
    return { ...record, byMonth: items };
  }

  if (filters.search && Array.isArray(record.employees)) {
    const term = filters.search.toLowerCase();
    const employees = (record.employees as Array<Record<string, unknown>>).filter((e) =>
      Object.values(e).some((v) => String(v).toLowerCase().includes(term)),
    );
    return { ...record, employees };
  }

  return data;
}

export const ReportEngineService = {
  async generate(companyId: string, request: ReportRequest, options?: { skipCache?: boolean }) {
    const cacheKey = buildCacheKey(companyId, request);

    if (!options?.skipCache) {
      const cached = await MasterDataCacheService.getJson<unknown>(cacheKey);
      if (cached) {
        return applyGroupingAndSorting(cached, request.filters ?? {});
      }
    }

    const raw = await ModuleReportAdapter.generate(companyId, request);
    const result = applyGroupingAndSorting(raw, request.filters ?? {});

    await MasterDataCacheService.setJson(cacheKey, result, CACHE_TTL.REPORT_ENGINE);
    return result;
  },

  async invalidate(companyId: string, domain?: string): Promise<void> {
    await MasterDataCacheService.invalidateEntity(companyId, domain ? `reports:${domain}` : 'reports');
  },
};
