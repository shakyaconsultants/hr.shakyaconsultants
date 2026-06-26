import { AuditLogRepository } from '@domain/audit/audit.schemas.js';
import type { AuditLogDocument } from '@domain/audit/audit.schemas.js';
import { NotFoundError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { buildSearchFilter } from '@infrastructure/database/query/search.helper.js';
import type { PaginatedResult } from '@shared/types/api.types.js';

export interface AuditExplorerQuery {
  entityType?: string;
  userId?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

function csvEscape(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export const AuditExplorerService = {
  async query(companyId: string, query: AuditExplorerQuery): Promise<PaginatedResult<AuditLogDocument>> {
    const filter: Record<string, unknown> = {};

    if (query.entityType) {
      filter.entityType = query.entityType;
    }
    if (query.userId) {
      filter.userId = query.userId;
    }
    if (query.action) {
      filter.action = query.action;
    }
    if (query.dateFrom || query.dateTo) {
      const createdAt: Record<string, Date> = {};
      if (query.dateFrom) {
        createdAt.$gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        createdAt.$lte = new Date(query.dateTo);
      }
      filter.createdAt = createdAt;
    }
    if (query.search) {
      Object.assign(filter, buildSearchFilter(query.search, ['entityType', 'entityId', 'action']));
    }

    return AuditLogRepository.paginate(
      filter,
      {
        page: query.page,
        pageSize: query.pageSize,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        companyId,
      },
      { companyId },
    );
  },

  async getById(companyId: string, id: string): Promise<AuditLogDocument> {
    const log = await AuditLogRepository.findById(id, { companyId });
    if (!log) {
      throw new NotFoundError('Audit log not found', ERROR_CODES.NOT_FOUND);
    }
    return log;
  },

  async getTimeline(
    companyId: string,
    entityType: string,
    entityId: string,
    query: Pick<AuditExplorerQuery, 'page' | 'pageSize'> = {},
  ): Promise<PaginatedResult<AuditLogDocument>> {
    return AuditLogRepository.paginate(
      { entityType, entityId },
      {
        page: query.page,
        pageSize: query.pageSize,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        companyId,
      },
      { companyId },
    );
  },

  async exportCsv(companyId: string, query: AuditExplorerQuery): Promise<string> {
    const result = await this.query(companyId, { ...query, page: 1, pageSize: 10000 });
    const headers = ['id', 'action', 'entityType', 'entityId', 'userId', 'createdAt', 'ipAddress'];
    const rows = result.items.map((log) =>
      headers.map((h) => csvEscape(log[h as keyof AuditLogDocument])).join(','),
    );
    return [headers.join(','), ...rows].join('\n');
  },
};
