import {
  EXPORT_FORMAT,
  ExportJobRepository,
  INTEGRATION_LOG_CATEGORY,
  JOB_STATUS,
  type ExportJobDocument,
} from '@domain/integration/integration.schemas.js';
import { CsvService } from '@modules/organization/shared/csv.service.js';
import { MasterDataService } from '@modules/organization/shared/master-data.service.js';
import { EmployeeExportService } from '@modules/employee/services/employee-export.service.js';
import { EmployeeService } from '@modules/employee/services/employee.service.js';
import { NotFoundError, BadRequestError } from '@shared/errors/app.error.js';
import { ERROR_CODES } from '@shared/constants/error-codes.js';
import { generateUuid } from '@shared/utils/random-id.util.js';
import { IntegrationLogService } from '@modules/integration/services/integration-log.service.js';
import { IntegrationAuditService } from '@modules/integration/services/integration-audit.service.js';
import type { IntegrationActorContext } from '@modules/approval/types/approval.types.js';
import type { PaginatedResult } from '@shared/types/api.types.js';
import type { MasterDataEntityKey } from '@modules/organization/constants/organization.constants.js';

export interface ExportInput {
  module: string;
  format: string;
  filters?: Record<string, unknown>;
  columns?: string[];
  entityKey?: string;
}

export const ExportPlatformService = {
  async create(context: IntegrationActorContext, input: ExportInput): Promise<ExportJobDocument> {
    if (!Object.values(EXPORT_FORMAT).includes(input.format as typeof EXPORT_FORMAT[keyof typeof EXPORT_FORMAT])) {
      throw new BadRequestError(`Unsupported export format: ${input.format}`);
    }

    const job = await ExportJobRepository.create({
      id: generateUuid(),
      companyId: context.companyId,
      module: input.module,
      format: input.format,
      status: JOB_STATUS.PROCESSING,
      filters: input.filters ?? {},
      columns: input.columns ?? [],
      createdBy: context.userId,
      updatedBy: context.userId,
    });

    try {
      const content = await this.generateExport(context, input);
      const downloadUrl = `data:text/${input.format === EXPORT_FORMAT.CSV ? 'csv' : 'plain'};base64,${Buffer.from(content).toString('base64')}`;

      const updated = await ExportJobRepository.update(job.id, {
        $set: {
          status: JOB_STATUS.COMPLETED,
          downloadUrl,
          updatedBy: context.userId,
        },
      }, { companyId: context.companyId });

      await IntegrationLogService.log({
        companyId: context.companyId,
        userId: context.userId,
        category: INTEGRATION_LOG_CATEGORY.EXPORT,
        message: `Export completed for ${input.module}`,
        metadata: { jobId: job.id, format: input.format },
      });

      await IntegrationAuditService.log({
        companyId: context.companyId,
        userId: context.userId,
        entityType: 'export_job',
        entityId: job.id,
        action: 'export',
        after: { module: input.module, format: input.format },
        ip: context.ip,
        userAgent: context.userAgent,
      });

      return updated ?? job;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Export failed';
      await ExportJobRepository.update(job.id, {
        $set: { status: JOB_STATUS.FAILED, updatedBy: context.userId },
      }, { companyId: context.companyId });
      throw new BadRequestError(message);
    }
  },

  async generateExport(context: IntegrationActorContext, input: ExportInput): Promise<string> {
    switch (input.format) {
      case EXPORT_FORMAT.CSV:
        return this.exportCsv(context, input);
      case EXPORT_FORMAT.PDF:
        return `[PDF export stub for module: ${input.module}]`;
      case EXPORT_FORMAT.XLSX:
        return `[XLSX export stub for module: ${input.module}]`;
      default:
        throw new BadRequestError(`Unsupported format: ${input.format}`);
    }
  },

  async exportCsv(context: IntegrationActorContext, input: ExportInput): Promise<string> {
    if (input.module === 'organization' && input.entityKey) {
      const result = await MasterDataService.list(input.entityKey as MasterDataEntityKey, context, { page: 1, pageSize: 10000 });
      const items = 'items' in result ? result.items : [];
      return CsvService.exportToCsv(input.entityKey as MasterDataEntityKey, items);
    }

    if (input.module === 'employee') {
      const result = await EmployeeService.list(context.companyId, { page: 1, pageSize: 10000 });
      return EmployeeExportService.toCsv(result.items);
    }

    throw new BadRequestError(`CSV export not supported for module: ${input.module}`);
  },

  async getHistory(companyId: string, query: { page?: number; pageSize?: number; module?: string }): Promise<PaginatedResult<ExportJobDocument>> {
    const filter: Record<string, unknown> = {};
    if (query.module) filter.module = query.module;
    return ExportJobRepository.paginate(filter, {
      page: query.page,
      pageSize: query.pageSize,
      companyId,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  },

  async getById(companyId: string, id: string): Promise<ExportJobDocument> {
    return ExportJobRepository.findByIdOrFail(id, { companyId });
  },

  async getDownload(companyId: string, id: string): Promise<{ content: string; format: string; fileName: string }> {
    const job = await ExportJobRepository.findByIdOrFail(id, { companyId });
    if (!job.downloadUrl) {
      throw new NotFoundError('Export not ready or failed', ERROR_CODES.NOT_FOUND);
    }

    if (job.downloadUrl.startsWith('data:')) {
      const base64 = job.downloadUrl.split(',')[1] ?? '';
      return {
        content: Buffer.from(base64, 'base64').toString('utf-8'),
        format: job.format,
        fileName: `${job.module}-export.${job.format}`,
      };
    }

    return {
      content: job.downloadUrl,
      format: job.format,
      fileName: `${job.module}-export.${job.format}`,
    };
  },
};
