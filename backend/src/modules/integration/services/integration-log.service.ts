import {
  INTEGRATION_LOG_CATEGORY,
  IntegrationLogRepository,
  type IntegrationLogDocument,
} from '@domain/integration/integration.schemas.js';
import { getCorrelationId } from '@shared/context/request.context.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import type { PaginatedResult } from '@shared/types/api.types.js';
import { buildRegexFilter } from '@infrastructure/database/query/search.helper.js';

export interface IntegrationLogInput {
  companyId: string;
  userId: string;
  category: string;
  message: string;
  metadata?: Record<string, unknown>;
  correlationId?: string;
}

export interface IntegrationLogQuery {
  page?: number;
  pageSize?: number;
  category?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  correlationId?: string;
}

export const IntegrationLogService = {
  async log(input: IntegrationLogInput): Promise<IntegrationLogDocument> {
    return IntegrationLogRepository.create({
      id: generateUuid(),
      companyId: input.companyId,
      category: input.category,
      message: input.message,
      metadata: input.metadata ?? {},
      correlationId: input.correlationId ?? getCorrelationId() ?? 'system',
      createdBy: input.userId,
      updatedBy: input.userId,
    });
  },

  async list(
    companyId: string,
    query: IntegrationLogQuery,
  ): Promise<PaginatedResult<IntegrationLogDocument>> {
    const filter: Record<string, unknown> = {};
    if (query.category) {
      filter.category = query.category;
    }
    if (query.correlationId) {
      filter.correlationId = query.correlationId;
    }
    if (query.startDate || query.endDate) {
      const createdAt: Record<string, Date> = {};
      if (query.startDate) createdAt.$gte = new Date(query.startDate);
      if (query.endDate) createdAt.$lte = new Date(query.endDate);
      filter.createdAt = createdAt;
    }
    if (query.search?.trim()) {
      filter.message = buildRegexFilter(query.search);
    }

    return IntegrationLogRepository.paginate(filter, {
      page: query.page,
      pageSize: query.pageSize,
      companyId,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  },

  async exportCsv(companyId: string, query: IntegrationLogQuery): Promise<string> {
    const result = await this.list(companyId, { ...query, page: 1, pageSize: 5000 });
    const rows = result.items.map((item) => ({
      id: item.id,
      category: item.category,
      message: item.message,
      correlationId: item.correlationId ?? '',
      createdAt: item.createdAt.toISOString(),
    }));
    if (rows.length === 0) {
      return 'id,category,message,correlationId,createdAt\n';
    }
    const headers = Object.keys(rows[0]);
    const lines = [headers.join(',')];
    for (const row of rows) {
      lines.push(
        headers
          .map((h) => {
            const str = row[h as keyof typeof row];
            return str.includes(',') ? `"${str.replace(/"/g, '""')}"` : str;
          })
          .join(','),
      );
    }
    return lines.join('\n');
  },

  categories(): string[] {
    return Object.values(INTEGRATION_LOG_CATEGORY);
  },
};
